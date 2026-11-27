-- Staskys · PATCH 5.1 scacchi (da incollare quando si pubblica la patch 5.1). Si può rieseguire senza problemi.
begin;
-- Staskys · PATCH 5.1 scacchi · database
-- Da incollare in Supabase > SQL Editor > Run quando si pubblica la patch 5.1. Si può rieseguire: non cancella dati.
--  · presenza di giocatori e spettatori (chi guarda, avversario disconnesso → perde dopo 60 s)
--  · l'orologio parte dopo la prima mossa; 30 s per la prima mossa o la partita si annulla
--  · chat degli spettatori; nelle amichevoli gli spettatori possono scrivere ai giocatori (ogni giocatore può spegnerlo)
--  · amichevoli: sostituzione giocatore ⇄ spettatore (lo spettatore può chiederla al massimo 2 volte)

-- ---------- presenza (giocatori e spettatori) ----------
create table if not exists public.chess_presence (
  game_id uuid not null references public.chess_games(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  discord_id text,
  since timestamptz not null default now(),
  seen  timestamptz not null default now(),
  primary key (game_id, user_id)
);
alter table public.chess_presence enable row level security;
revoke all on public.chess_presence from anon, authenticated;

alter table public.chess_games add column if not exists spec_talk_off jsonb not null default '{}'::jsonb;
alter table public.chess_chat add column if not exists room text not null default 'p';
do $$ begin
  alter table public.chess_chat add constraint chess_chat_room_check check (room in ('p','s'));
exception when duplicate_object then null; end $$;

create table if not exists public.chess_subs (
  id bigint generated always as identity primary key,
  game_id uuid not null references public.chess_games(id) on delete cascade,
  spec_uid uuid not null references auth.users(id) on delete cascade, spec_did text,
  player_uid uuid not null references auth.users(id) on delete cascade, player_did text,
  by_spec boolean not null,                       -- true = lo chiede lo spettatore, false = lo propone il giocatore
  status text not null default 'pending' check (status in ('pending','accepted','declined','expired')),
  created_at timestamptz not null default now()
);
create index if not exists chess_subs_game on public.chess_subs (game_id, status);
alter table public.chess_subs enable row level security;
revoke all on public.chess_subs from anon, authenticated;

-- segna "ci sono" (lo chiamano le funzioni della partita a ogni aggiornamento)
create or replace function public.chess_seen(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then return; end if;
  if not exists (select 1 from public.chess_games where id = p_id and status in ('invite','voting','coin','tiebreak','active')) then return; end if;
  insert into public.chess_presence as x (game_id, user_id, discord_id) values (p_id, auth.uid(), public.chess_did(auth.uid()))
  on conflict (game_id, user_id) do update set seen = now(), since = case when x.seen < now() - interval '30 seconds' then now() else x.since end;
end $$;
revoke all on function public.chess_seen(uuid) from public, anon, authenticated;

-- stato della partita + chi è collegato, chi guarda, richieste di sostituzione
create or replace function public.chess_out(g public.chess_games) returns jsonb
language sql stable security definer set search_path = public as $$
  select to_jsonb(g) - 'keys' || jsonb_build_object('now', now(),
    'seen', coalesce((select jsonb_object_agg(x.user_id::text, x.seen) from public.chess_presence x where x.game_id = g.id and x.user_id in (g.white, g.black, g.challenger, g.opponent)), '{}'::jsonb),
    'watchers', coalesce((select jsonb_agg(x.discord_id order by x.since) from public.chess_presence x
        where x.game_id = g.id and x.seen > now() - interval '20 seconds' and x.user_id not in (g.challenger, g.opponent) and x.discord_id is not null), '[]'::jsonb),
    'subs', coalesce((select jsonb_agg(jsonb_build_object('id', s.id, 'spec', s.spec_did, 'player', s.player_did, 'by_spec', s.by_spec, 'at', s.created_at) order by s.id)
        from public.chess_subs s where s.game_id = g.id and s.status = 'pending' and s.created_at > now() - interval '30 seconds'), '[]'::jsonb),
    'subs_used', coalesce((select jsonb_object_agg(t.spec_did, t.n) from (select s.spec_did, count(*) n from public.chess_subs s where s.game_id = g.id and s.by_spec group by s.spec_did) t), '{}'::jsonb))
$$;
revoke all on function public.chess_out(public.chess_games) from public, anon, authenticated;

create or replace function public.chess_advance(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare g public.chess_games; v jsonb; a text; b text; va text; vb text; p public.chess_pos; rem bigint; side text; lw timestamptz; lb timestamptz;
begin
  select * into g from public.chess_games where id = p_id for update;
  if not found then return; end if;
  a := g.challenger::text; b := g.opponent::text;
  if g.status = 'invite' and now() > g.created_at + (case when g.mode = 'live' then interval '3 minutes' else interval '7 days' end) then
    update public.chess_games set status = 'expired', updated_at = now() where id = p_id; return;
  end if;
  if g.status = 'voting' and g.vote->>'dl' is null then
    if now() > (g.vote->>'wait')::timestamptz then
      update public.chess_games set status = 'aborted', reason = 'avversario assente', ended_at = now(), updated_at = now() where id = p_id;
    end if;
    return;
  end if;
  if g.status = 'voting' then
    v := g.vote; va := v->'v'->>a; vb := v->'v'->>b;
    if (va is not null and vb is not null) or now() > (v->>'dl')::timestamptz then
      if va is not null and vb is not null and va = vb then perform public.chess_begin(p_id, va, 1.5);
      elsif va is null and vb is null then
        if (v->>'r')::int = 1 then
          update public.chess_games set vote = jsonb_build_object('r', 2, 'dl', now() + interval '6 seconds', 'v', '{}'::jsonb, 'prev', v->'v', 'last', '{}'::jsonb), updated_at = now() where id = p_id;
        else perform public.chess_begin(p_id, '10+0', 1.5); end if;
      elsif va is null or vb is null then perform public.chess_begin(p_id, coalesce(va, vb), 1.5);   -- ha votato solo uno: vale il suo voto
      elsif (v->>'r')::int = 1 then
        update public.chess_games set vote = jsonb_build_object('r', 2, 'dl', now() + interval '6 seconds', 'v', '{}'::jsonb, 'prev', v->'v', 'last', v->'v'), updated_at = now() where id = p_id;
      else
        -- ancora in disaccordo
        update public.chess_games set vote = v || jsonb_build_object('last', v->'v'), updated_at = now() where id = p_id;
        if g.ranked then
          update public.chess_games set status = 'coin', coin = jsonb_build_object('for', 'tc', 'dl', now() + interval '8 seconds', 'picks', '{}'::jsonb) where id = p_id;
        else
          -- amichevole: si sceglie se fare testa o croce o uno spareggio a un minigioco
          update public.chess_games set status = 'tiebreak', tiebreak = jsonb_build_object('stage', 'how', 'dl', now() + interval '8 seconds', 'how', '{}'::jsonb) where id = p_id;
        end if;
      end if;
    end if;
    return;
  end if;
  if g.status = 'coin' then
    if g.coin->>'res' is null and (g.coin->'picks' <> '{}'::jsonb or now() > (g.coin->>'dl')::timestamptz) then perform public.chess_coin_flip(p_id); end if;
    return;
  end if;
  if g.status = 'tiebreak' then perform public.chess_tiebreak_advance(p_id); return; end if;
  if g.status = 'active' then
    p := public.chess_parse(g.fen); side := p.turn;
    -- PATCH 5.1: chi non fa la sua prima mossa entro 30 secondi fa annullare la partita (niente ELO)
    if g.mode = 'live' and coalesce(array_length(g.moves, 1), 0) < 2 and now() > g.turn_since + interval '30 seconds' then
      update public.chess_games set status = 'aborted', reason = 'prima mossa', ended_at = now(), updated_at = now(), draw_offer = null where id = p_id;
      return;
    end if;
    -- PATCH 5.1: chi chiude la scheda o perde la connessione per più di 75 secondi (15 + 60 di conto alla rovescia) perde per abbandono
    if g.mode = 'live' and now() > g.turn_since then
      lw := greatest(coalesce((select x.seen from public.chess_presence x where x.game_id = p_id and x.user_id = g.white), g.started_at), g.started_at);
      lb := greatest(coalesce((select x.seen from public.chess_presence x where x.game_id = p_id and x.user_id = g.black), g.started_at), g.started_at);
      if least(lw, lb) < now() - interval '75 seconds' then
        perform public.chess_finish(p_id, case when lw <= lb then '0-1' else '1-0' end, 'disconnesso');
        return;
      end if;
    end if;
    if g.mode = 'live' then
      rem := case when side = 'w' then g.wms else g.bms end - case when coalesce(array_length(g.moves, 1), 0) < 2 then 0 else (extract(epoch from (now() - g.turn_since)) * 1000)::bigint end;
      if rem <= 0 then
        update public.chess_games set wms = case when side = 'w' then 0 else wms end, bms = case when side = 'b' then 0 else bms end where id = p_id;
        if public.chess_cant_mate(p.b, case when side = 'w' then 'b' else 'w' end) then perform public.chess_finish(p_id, '1/2-1/2', 'timeout_insufficiente');
        else perform public.chess_finish(p_id, case when side = 'w' then '0-1' else '1-0' end, 'tempo'); end if;
      end if;
    elsif now() > g.turn_since + interval '3 days' then
      perform public.chess_finish(p_id, case when side = 'w' then '0-1' else '1-0' end, 'tempo');
    end if;
  end if;
end $$;
revoke all on function public.chess_advance(uuid) from public, anon, authenticated;

-- chess_get: chi la chiama (giocatore o spettatore con accesso) risulta collegato
create or replace function public.chess_get(p_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare g public.chess_games;
begin
  if not exists (select 1 from public.chess_games where id = p_id) then raise exception 'Partita non trovata'; end if;
  perform public.chess_seen(p_id);
  perform public.chess_advance(p_id);
  select * into g from public.chess_games where id = p_id;
  return public.chess_out(g);
end $$;
grant execute on function public.chess_get(uuid) to anon, authenticated;

create or replace function public.chess_move(p_id uuid, p_uci text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare g public.chess_games; p public.chess_pos; n public.chess_pos; me uuid := auth.uid(); el bigint; rem bigint; k text;
  res text; why text;
begin
  perform public.chess_advance(p_id);
  select * into g from public.chess_games where id = p_id for update;
  if not found or me not in (g.white, g.black) then raise exception 'Partita non trovata'; end if;
  if g.status <> 'active' then raise exception 'La partita è finita'; end if;
  p := public.chess_parse(g.fen);
  if (p.turn = 'w' and me <> g.white) or (p.turn = 'b' and me <> g.black) then raise exception 'Non è il tuo turno'; end if;
  if now() < g.turn_since then raise exception 'La partita sta per iniziare'; end if;
  p_uci := lower(trim(p_uci));
  if p_uci !~ '^[a-h][1-8][a-h][1-8][qrbn]?$' or not exists (select 1 from public.chess_legal(p) m where m = p_uci) then
    raise exception 'Mossa non valida';
  end if;
  n := public.chess_make(p, public.chess_sq(substr(p_uci,1,2)), public.chess_sq(substr(p_uci,3,2)), nullif(substr(p_uci,5,1),''));
  el := greatest(0, (extract(epoch from (now() - g.turn_since)) * 1000)::bigint);
  if g.mode = 'live' then
    -- PATCH 5.1: l'orologio di ognuno parte dopo la sua prima mossa
    rem := case when p.turn = 'w' then g.wms else g.bms end - case when coalesce(array_length(g.moves, 1), 0) < 2 then 0 else el - coalesce(g.tc_inc, 0) * 1000 end;
  end if;
  k := public.chess_key(n);
  update public.chess_games set fen = public.chess_fen(n), moves = moves || p_uci, move_ms = move_ms || least(el, 2000000000)::int, keys = keys || k,
    wms = case when p.turn = 'w' and g.mode = 'live' then rem else wms end, bms = case when p.turn = 'b' and g.mode = 'live' then rem else bms end,
    turn_since = now(), updated_at = now(), draw_offer = case when draw_offer = me then draw_offer else null end
   where id = p_id;
  if not public.chess_has_legal(n) then
    if public.chess_in_check(n) then res := case when p.turn = 'w' then '1-0' else '0-1' end; why := 'scaccomatto';
    else res := '1/2-1/2'; why := 'stallo'; end if;
  elsif public.chess_insufficient(n.b) then res := '1/2-1/2'; why := 'materiale insufficiente';
  elsif (select count(*) from unnest(g.keys || k) x where x = k) >= 3 then res := '1/2-1/2'; why := 'ripetizione';
  elsif n.half >= 100 then res := '1/2-1/2'; why := '50 mosse';
  end if;
  perform public.chess_seen(p_id);
  if res is not null then perform public.chess_finish(p_id, res, why); end if;
  select * into g from public.chess_games where id = p_id;
  return public.chess_out(g);
end $$;

-- ---------- chat: giocatori ('p') e spettatori ('s') ----------
create or replace function public.chess_chat_visible(p_game uuid, p_room text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.chess_games g where g.id = p_game and (
    auth.uid() in (g.challenger, g.opponent)
      and p_room = 'p'
    or auth.uid() is not null and auth.uid() not in (g.challenger, g.opponent) and (
      p_room = 's'
      or p_room = 'p' and not g.ranked and not exists (select 1 from jsonb_each_text(g.spec_talk_off) e where e.value = 'true'))))
$$;
revoke all on function public.chess_chat_visible(uuid, text) from public, anon;
grant execute on function public.chess_chat_visible(uuid, text) to authenticated;
drop policy if exists "chess_chat_players" on public.chess_chat;
drop policy if exists "chess_chat_visible" on public.chess_chat;
create policy "chess_chat_visible" on public.chess_chat for select to authenticated using (public.chess_chat_visible(game_id, room));

drop function if exists public.chess_chat_send(uuid, text);
create or replace function public.chess_chat_send(p_id uuid, p_body text, p_room text default 'p') returns jsonb
language plpgsql security definer set search_path = public as $$
declare g public.chess_games; v_id bigint; v_room text;
begin
  if auth.uid() is null then raise exception 'Accedi per scrivere'; end if;
  select * into g from public.chess_games where id = p_id;
  if not found then raise exception 'Partita non trovata'; end if;
  if auth.uid() in (g.challenger, g.opponent) then v_room := 'p';
  elsif coalesce(p_room, 'p') = 'p' and public.chess_chat_visible(p_id, 'p') then v_room := 'p';
  else v_room := 's'; end if;
  p_body := left(trim(regexp_replace(coalesce(p_body,''), '[\r\n\t]+', ' ', 'g')), 300);
  if p_body = '' then raise exception 'Messaggio vuoto'; end if;
  if (select count(*) from public.chess_chat where user_id = auth.uid() and created_at > now() - interval '1 minute') >= 20 then
    raise exception 'Stai scrivendo troppo veloce';
  end if;
  insert into public.chess_chat (game_id, user_id, discord_id, body, room) values (p_id, auth.uid(), public.chess_did(auth.uid()), p_body, v_room) returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id, 'room', v_room);
end $$;
revoke all on function public.chess_chat_send(uuid, text, text) from public, anon;
grant execute on function public.chess_chat_send(uuid, text, text) to authenticated;

-- un giocatore spegne/riaccende la possibilità degli spettatori di scrivergli (solo amichevoli, non serve l'ok dell'altro)
create or replace function public.chess_spec_talk(p_id uuid, p_off boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare g public.chess_games;
begin
  select * into g from public.chess_games where id = p_id for update;
  if not found or auth.uid() not in (g.challenger, g.opponent) then raise exception 'Partita non trovata'; end if;
  if g.ranked then raise exception 'Nelle ranked gli spettatori hanno solo la loro chat'; end if;
  update public.chess_games set spec_talk_off = spec_talk_off || jsonb_build_object(auth.uid()::text, coalesce(p_off, true)) where id = p_id returning * into g;
  return public.chess_out(g);
end $$;
revoke all on function public.chess_spec_talk(uuid, boolean) from public, anon;
grant execute on function public.chess_spec_talk(uuid, boolean) to authenticated;

-- ---------- amichevoli: sostituzione giocatore ⇄ spettatore ----------
create or replace function public.chess_sub_request(p_id uuid, p_did text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare g public.chess_games; me uuid := auth.uid(); other uuid; spec uuid; pl uuid;
begin
  perform public.chess_advance(p_id);
  select * into g from public.chess_games where id = p_id for update;
  if not found or me is null then raise exception 'Partita non trovata'; end if;
  if g.ranked then raise exception 'La sostituzione si può fare solo nelle amichevoli'; end if;
  if g.status <> 'active' then raise exception 'La partita non è in corso'; end if;
  update public.chess_subs set status = 'expired' where game_id = p_id and status = 'pending' and created_at <= now() - interval '30 seconds';
  if me in (g.challenger, g.opponent) then
    -- il giocatore propone a uno spettatore di prendere il suo posto
    select x.user_id into spec from public.chess_presence x where x.game_id = p_id and x.discord_id = p_did and x.seen > now() - interval '20 seconds'
       and x.user_id not in (g.challenger, g.opponent) limit 1;
    if spec is null then raise exception 'Quello spettatore non sta più guardando'; end if;
    pl := me;
    if exists (select 1 from public.chess_subs where game_id = p_id and status = 'pending' and spec_uid = spec and player_uid = pl) then raise exception 'Richiesta già inviata'; end if;
    insert into public.chess_subs (game_id, spec_uid, spec_did, player_uid, player_did, by_spec) values (p_id, spec, p_did, pl, public.chess_did(pl), false);
  else
    -- lo spettatore chiede a un giocatore di prendere il suo posto (massimo 2 volte per partita)
    pl := case when p_did = g.challenger_did then g.challenger when p_did = g.opponent_did then g.opponent end;
    if pl is null then raise exception 'Quel giocatore non è in questa partita'; end if;
    if (select count(*) from public.chess_subs where game_id = p_id and spec_uid = me and by_spec) >= 2 then raise exception 'Puoi chiedere la sostituzione solo 2 volte per partita'; end if;
    if exists (select 1 from public.chess_subs where game_id = p_id and status = 'pending' and spec_uid = me) then raise exception 'Hai già una richiesta in attesa'; end if;
    perform public.chess_seen(p_id);
    insert into public.chess_subs (game_id, spec_uid, spec_did, player_uid, player_did, by_spec) values (p_id, me, public.chess_did(me), pl, p_did, true);
  end if;
  select * into g from public.chess_games where id = p_id;
  return public.chess_out(g);
end $$;
revoke all on function public.chess_sub_request(uuid, text) from public, anon;
grant execute on function public.chess_sub_request(uuid, text) to authenticated;

create or replace function public.chess_sub_answer(p_req bigint, p_accept boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare s public.chess_subs; g public.chess_games; me uuid := auth.uid(); nd text;
begin
  select * into s from public.chess_subs where id = p_req for update;
  if not found then raise exception 'Richiesta non trovata'; end if;
  if (s.by_spec and me <> s.player_uid) or (not s.by_spec and me <> s.spec_uid) then raise exception 'Questa richiesta non è per te'; end if;
  select * into g from public.chess_games where id = s.game_id for update;
  if s.status <> 'pending' or s.created_at <= now() - interval '30 seconds' then
    update public.chess_subs set status = 'expired' where id = p_req and status = 'pending';
    raise exception 'La richiesta è scaduta';
  end if;
  if not p_accept then
    update public.chess_subs set status = 'declined' where id = p_req;
  else
    if g.status <> 'active' or g.ranked then raise exception 'La partita non è più in corso'; end if;
    if s.player_uid not in (g.challenger, g.opponent) or s.spec_uid in (g.challenger, g.opponent) then raise exception 'I giocatori sono cambiati'; end if;
    nd := coalesce(s.spec_did, public.chess_did(s.spec_uid));
    update public.chess_games set
      challenger = case when challenger = s.player_uid then s.spec_uid else challenger end,
      challenger_did = case when challenger = s.player_uid then nd else challenger_did end,
      opponent = case when opponent = s.player_uid then s.spec_uid else opponent end,
      opponent_did = case when opponent = s.player_uid then nd else opponent_did end,
      white = case when white = s.player_uid then s.spec_uid else white end,
      white_did = case when white = s.player_uid then nd else white_did end,
      black = case when black = s.player_uid then s.spec_uid else black end,
      black_did = case when black = s.player_uid then nd else black_did end,
      draw_offer = null, spec_talk_off = spec_talk_off - s.player_uid::text, updated_at = now()
     where id = s.game_id;
    update public.chess_subs set status = 'accepted' where id = p_req;
    update public.chess_subs set status = 'expired' where game_id = s.game_id and status = 'pending';
    insert into public.chess_presence (game_id, user_id, discord_id) values (s.game_id, s.spec_uid, nd)
      on conflict (game_id, user_id) do update set seen = now();
    insert into public.chess_chat (game_id, user_id, discord_id, body, room)
      values (s.game_id, s.spec_uid, nd, '🔄 Sono entrato in partita al posto di un giocatore', 'p');
  end if;
  select * into g from public.chess_games where id = s.game_id;
  return public.chess_out(g);
end $$;
revoke all on function public.chess_sub_answer(bigint, boolean) from public, anon;
grant execute on function public.chess_sub_answer(bigint, boolean) to authenticated;

-- partite già in corso quando si installa la patch: contano come appena collegati (così nessuno perde per "disconnesso" subito)
insert into public.chess_presence as x (game_id, user_id, discord_id)
  select g.id, u.uid, u.did from public.chess_games g
    cross join lateral (values (g.challenger, g.challenger_did), (g.opponent, g.opponent_did)) u(uid, did)
   where g.status = 'active'
on conflict (game_id, user_id) do update set seen = now();
commit;
