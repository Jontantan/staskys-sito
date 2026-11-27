-- Staskys · UPDATE 5 (scacchi + corone) · database
-- Da incollare in Supabase > SQL Editor > New query > Run, quando si pubblica l'update 5.
-- Non cancella niente di esistente. Si può rieseguire senza problemi.
--  1) motore scacchi sul server (le mosse le controlla il database, non il browser)
--  2) partite dal vivo e per corrispondenza, chat, classifiche ELO
--  3) funzioni per sfidare, votare il tempo, testa o croce, muovere, arrendersi, patta
--  4) "Re di Staskys": il server segna per quante ore di fila uno resta 1° in classifica generale
--  5) amichevoli: spareggio a minigioco (+ Battitura da 30 secondi)
--  6) analisi Stockfish salvata e segnalazioni anti-cheat per lo staff
begin;
-- ============================================================
-- 1) MOTORE SCACCHI (regole complete, controllate dal server)
--    scacchiera = 64 caratteri, da a8 (0) a h1 (63); '.' = vuota
--    bianchi PNBRQK, neri pnbrqk
-- ============================================================
do $$ begin
  create type public.chess_pos as (b text, turn text, castle text, ep int, half int, full_no int);
exception when duplicate_object then null; end $$;

create or replace function public.chess_at(b text, f int, r int) returns text
language sql immutable as $$
  select case when f between 0 and 7 and r between 0 and 7 then substr(b, (7 - r) * 8 + f + 1, 1) else '#' end
$$;

create or replace function public.chess_sq(s text) returns int
language sql immutable as $$
  select case when s ~ '^[a-h][1-8]$' then (7 - (ascii(substr(s,2,1)) - 49)) * 8 + (ascii(substr(s,1,1)) - 97) else null end
$$;

create or replace function public.chess_sqname(i int) returns text
language sql immutable as $$ select chr(97 + i % 8) || chr(49 + 7 - i / 8) $$;

create or replace function public.chess_parse(fen text) returns public.chess_pos
language plpgsql immutable as $$
declare parts text[] := regexp_split_to_array(trim(fen), '\s+'); b text := ''; c text; i int;
begin
  for i in 1..char_length(parts[1]) loop
    c := substr(parts[1], i, 1);
    if c ~ '[1-8]' then b := b || repeat('.', c::int);
    elsif c <> '/' then b := b || c; end if;
  end loop;
  if char_length(b) <> 64 then raise exception 'FEN non valida'; end if;
  return row(b, coalesce(parts[2],'w'), coalesce(nullif(parts[3],''),'-'),
             coalesce(public.chess_sq(parts[4]), -1), coalesce(parts[5],'0')::int, coalesce(parts[6],'1')::int)::public.chess_pos;
end $$;

create or replace function public.chess_fen(p public.chess_pos) returns text
language plpgsql immutable as $$
declare o text := ''; r int; f int; n int; c text;
begin
  for r in 0..7 loop
    n := 0;
    for f in 0..7 loop
      c := substr(p.b, r * 8 + f + 1, 1);
      if c = '.' then n := n + 1; else if n > 0 then o := o || n; n := 0; end if; o := o || c; end if;
    end loop;
    if n > 0 then o := o || n; end if;
    if r < 7 then o := o || '/'; end if;
  end loop;
  return o || ' ' || p.turn || ' ' || coalesce(nullif(p.castle,''),'-') || ' ' ||
         case when p.ep >= 0 then public.chess_sqname(p.ep) else '-' end || ' ' || p.half || ' ' || p.full_no;
end $$;

-- la casella sq è attaccata dal colore "by" ('w' o 'b')?
create or replace function public.chess_attacked(b text, sq int, by text) returns boolean
language plpgsql immutable as $$
declare f int := sq % 8; r int := 7 - sq / 8; d int[]; k int; x int; y int; c text;
  pn text; nn text; kn text; rq text; bq text; w boolean := (by = 'w');
begin
  pn := case when w then 'P' else 'p' end; nn := case when w then 'N' else 'n' end; kn := case when w then 'K' else 'k' end;
  -- pedoni
  if w then
    if public.chess_at(b, f-1, r-1) = pn or public.chess_at(b, f+1, r-1) = pn then return true; end if;
  else
    if public.chess_at(b, f-1, r+1) = pn or public.chess_at(b, f+1, r+1) = pn then return true; end if;
  end if;
  -- cavalli
  foreach d slice 1 in array array[[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]] loop
    if public.chess_at(b, f+d[1], r+d[2]) = nn then return true; end if;
  end loop;
  -- re
  foreach d slice 1 in array array[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]] loop
    if public.chess_at(b, f+d[1], r+d[2]) = kn then return true; end if;
  end loop;
  -- pezzi lunghi
  foreach d slice 1 in array array[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]] loop
    x := f + d[1]; y := r + d[2];
    loop
      c := public.chess_at(b, x, y);
      exit when c = '#';
      if c <> '.' then
        if (c = case when w then 'Q' else 'q' end)
           or (d[1] * d[2] = 0 and c = case when w then 'R' else 'r' end)
           or (d[1] * d[2] <> 0 and c = case when w then 'B' else 'b' end) then return true; end if;
        exit;
      end if;
      x := x + d[1]; y := y + d[2];
    end loop;
  end loop;
  return false;
end $$;

create or replace function public.chess_is_own(c text, turn text) returns boolean
language sql immutable as $$ select c not in ('.','#') and ((turn = 'w') = (c = upper(c))) $$;

-- mosse pseudo-legali (senza controllare lo scacco al proprio re)
create or replace function public.chess_pseudo(p public.chess_pos, out fr int, out t int, out pr text) returns setof record
language plpgsql immutable as $$
declare i int; f int; r int; c text; u text; d int[]; x int; y int; tc text; dir int; start_r int; last_r int; w boolean := (p.turn = 'w');
  opp text := case when p.turn = 'w' then 'b' else 'w' end; q text;
begin
  dir := case when w then 1 else -1 end; start_r := case when w then 1 else 6 end; last_r := case when w then 7 else 0 end;
  for i in 0..63 loop
    c := substr(p.b, i+1, 1);
    continue when not public.chess_is_own(c, p.turn);
    f := i % 8; r := 7 - i / 8; u := upper(c); fr := i;
    if u = 'P' then
      if public.chess_at(p.b, f, r+dir) = '.' then
        t := (7-(r+dir))*8+f;
        if r + dir = last_r then foreach q in array array['q','r','b','n'] loop pr := q; return next; end loop;
        else pr := null; return next;
          if r = start_r and public.chess_at(p.b, f, r+2*dir) = '.' then t := (7-(r+2*dir))*8+f; pr := null; return next; end if;
        end if;
      end if;
      foreach x in array array[-1,1] loop
        tc := public.chess_at(p.b, f+x, r+dir);
        continue when tc = '#';
        t := (7-(r+dir))*8+f+x;
        if (tc <> '.' and not public.chess_is_own(tc, p.turn)) or (tc = '.' and t = p.ep) then
          if r + dir = last_r then foreach q in array array['q','r','b','n'] loop pr := q; return next; end loop;
          else pr := null; return next; end if;
        end if;
      end loop;
    elsif u in ('N','K') then
      foreach d slice 1 in array case when u = 'N' then array[[1,2],[2,1],[2,-1],[1,-2],[-1,-2],[-2,-1],[-2,1],[-1,2]]
                                       else array[[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1],[0,-1],[1,-1]] end loop
        tc := public.chess_at(p.b, f+d[1], r+d[2]);
        if tc = '.' or (tc <> '#' and not public.chess_is_own(tc, p.turn)) then
          t := (7-(r+d[2]))*8+f+d[1]; pr := null; return next;
        end if;
      end loop;
      if u = 'K' then
        if w and i = 60 then
          if strpos(p.castle,'K') > 0 and substr(p.b,62,1) = '.' and substr(p.b,63,1) = '.' and substr(p.b,64,1) = 'R'
             and not public.chess_attacked(p.b,60,opp) and not public.chess_attacked(p.b,61,opp) and not public.chess_attacked(p.b,62,opp) then
            t := 62; pr := null; return next; end if;
          if strpos(p.castle,'Q') > 0 and substr(p.b,60,1) = '.' and substr(p.b,59,1) = '.' and substr(p.b,58,1) = '.' and substr(p.b,57,1) = 'R'
             and not public.chess_attacked(p.b,60,opp) and not public.chess_attacked(p.b,59,opp) and not public.chess_attacked(p.b,58,opp) then
            t := 58; pr := null; return next; end if;
        elsif not w and i = 4 then
          if strpos(p.castle,'k') > 0 and substr(p.b,6,1) = '.' and substr(p.b,7,1) = '.' and substr(p.b,8,1) = 'r'
             and not public.chess_attacked(p.b,4,opp) and not public.chess_attacked(p.b,5,opp) and not public.chess_attacked(p.b,6,opp) then
            t := 6; pr := null; return next; end if;
          if strpos(p.castle,'q') > 0 and substr(p.b,4,1) = '.' and substr(p.b,3,1) = '.' and substr(p.b,2,1) = '.' and substr(p.b,1,1) = 'r'
             and not public.chess_attacked(p.b,4,opp) and not public.chess_attacked(p.b,3,opp) and not public.chess_attacked(p.b,2,opp) then
            t := 2; pr := null; return next; end if;
        end if;
      end if;
    else
      foreach d slice 1 in array case u when 'R' then array[[1,0],[-1,0],[0,1],[0,-1]]
                                        when 'B' then array[[1,1],[1,-1],[-1,1],[-1,-1]]
                                        else array[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]] end loop
        x := f + d[1]; y := r + d[2];
        loop
          tc := public.chess_at(p.b, x, y);
          exit when tc = '#' or public.chess_is_own(tc, p.turn);
          t := (7-y)*8+x; pr := null; return next;
          exit when tc <> '.';
          x := x + d[1]; y := y + d[2];
        end loop;
      end loop;
    end if;
  end loop;
end $$;

create or replace function public.chess_set(b text, i int, c text) returns text
language sql immutable as $$ select overlay(b placing c from i+1 for 1) $$;

-- esegue una mossa (già controllata) e restituisce la nuova posizione
create or replace function public.chess_make(p public.chess_pos, fr int, t int, pr text) returns public.chess_pos
language plpgsql immutable as $$
declare c text := substr(p.b, fr+1, 1); cap text := substr(p.b, t+1, 1); b text := p.b; w boolean := (p.turn = 'w');
  cs text := replace(p.castle,'-',''); n public.chess_pos;
begin
  b := public.chess_set(b, fr, '.');
  if upper(c) = 'P' and pr is not null then
    b := public.chess_set(b, t, case when w then upper(pr) else lower(pr) end);
  else b := public.chess_set(b, t, c); end if;
  if upper(c) = 'P' and t = p.ep and cap = '.' then b := public.chess_set(b, case when w then t+8 else t-8 end, '.'); end if;
  if upper(c) = 'K' and abs(t - fr) = 2 then
    if t = 62 then b := public.chess_set(public.chess_set(b,63,'.'),61,'R');
    elsif t = 58 then b := public.chess_set(public.chess_set(b,56,'.'),59,'R');
    elsif t = 6 then b := public.chess_set(public.chess_set(b,7,'.'),5,'r');
    elsif t = 2 then b := public.chess_set(public.chess_set(b,0,'.'),3,'r'); end if;
  end if;
  if c = 'K' then cs := replace(replace(cs,'K',''),'Q',''); end if;
  if c = 'k' then cs := replace(replace(cs,'k',''),'q',''); end if;
  if fr = 63 or t = 63 then cs := replace(cs,'K',''); end if;
  if fr = 56 or t = 56 then cs := replace(cs,'Q',''); end if;
  if fr = 7  or t = 7  then cs := replace(cs,'k',''); end if;
  if fr = 0  or t = 0  then cs := replace(cs,'q',''); end if;
  n.b := b; n.turn := case when w then 'b' else 'w' end; n.castle := coalesce(nullif(cs,''),'-');
  n.ep := case when upper(c) = 'P' and abs(t - fr) = 16 then (t + fr) / 2 else -1 end;
  n.half := case when upper(c) = 'P' or cap <> '.' then 0 else p.half + 1 end;
  n.full_no := p.full_no + case when w then 0 else 1 end;
  return n;
end $$;

create or replace function public.chess_in_check(p public.chess_pos) returns boolean
language sql immutable as $$
  select public.chess_attacked(p.b, strpos(p.b, case when p.turn = 'w' then 'K' else 'k' end) - 1, case when p.turn = 'w' then 'b' else 'w' end)
$$;

-- mosse legali in formato UCI (es. e2e4, e7e8q)
create or replace function public.chess_legal(p public.chess_pos) returns setof text
language plpgsql immutable as $$
declare m record; n public.chess_pos; k text := case when p.turn = 'w' then 'K' else 'k' end;
begin
  for m in select * from public.chess_pseudo(p) loop
    n := public.chess_make(p, m.fr, m.t, m.pr);
    if not public.chess_attacked(n.b, strpos(n.b, k) - 1, n.turn) then
      return next public.chess_sqname(m.fr) || public.chess_sqname(m.t) || coalesce(m.pr, '');
    end if;
  end loop;
end $$;

create or replace function public.chess_has_legal(p public.chess_pos) returns boolean
language plpgsql immutable as $$
declare m record; n public.chess_pos; k text := case when p.turn = 'w' then 'K' else 'k' end;
begin
  for m in select * from public.chess_pseudo(p) loop
    n := public.chess_make(p, m.fr, m.t, m.pr);
    if not public.chess_attacked(n.b, strpos(n.b, k) - 1, n.turn) then return true; end if;
  end loop;
  return false;
end $$;

-- materiale insufficiente per dare matto (come chess.js)
create or replace function public.chess_insufficient(b text) returns boolean
language plpgsql immutable as $$
declare i int; c text; n int := 0; minor text := ''; bcol int[] := '{}';
begin
  for i in 0..63 loop
    c := substr(b, i+1, 1);
    continue when c in ('.','K','k');
    n := n + 1;
    if upper(c) in ('P','R','Q') then return false; end if;
    minor := minor || upper(c);
    if upper(c) = 'B' then bcol := bcol || ((i % 8 + i / 8) % 2); end if;
  end loop;
  if n = 0 then return true; end if;
  if n = 1 then return true; end if;                                   -- re + alfiere/cavallo contro re
  if strpos(minor, 'N') = 0 and (select count(distinct x) from unnest(bcol) x) = 1 then return true; end if;  -- solo alfieri tutti dello stesso colore
  return false;
end $$;

-- ha solo il re + pezzi insufficienti? (per la caduta della bandierina: se l'altro non può dare matto è patta)
create or replace function public.chess_cant_mate(b text, side text) returns boolean
language plpgsql immutable as $$
declare i int; c text; n int := 0;
begin
  for i in 0..63 loop
    c := substr(b, i+1, 1);
    continue when c in ('.','K','k') or not public.chess_is_own(c, side);
    if upper(c) in ('P','R','Q') then return false; end if;
    n := n + 1;
  end loop;
  return n <= 1;
end $$;

-- punti materiale come chess.com (P1 C3 A3 T5 D9): bianco meno nero
create or replace function public.chess_material(b text) returns int
language sql immutable as $$
  select coalesce(sum(case upper(c) when 'P' then 1 when 'N' then 3 when 'B' then 3 when 'R' then 5 when 'Q' then 9 else 0 end
                     * case when c = upper(c) then 1 else -1 end), 0)::int
  from regexp_split_to_table(regexp_replace(b, '[.Kk]', '', 'g'), '') c where c <> ''
$$;

-- chiave della posizione per la triplice ripetizione (en passant solo se una presa è possibile)
create or replace function public.chess_key(p public.chess_pos) returns text
language plpgsql immutable as $$
declare e text := '-'; f int; r int; pn text;
begin
  if p.ep >= 0 then
    f := p.ep % 8; r := 7 - p.ep / 8; pn := case when p.turn = 'w' then 'P' else 'p' end;
    if public.chess_at(p.b, f-1, r + case when p.turn = 'w' then -1 else 1 end) = pn
       or public.chess_at(p.b, f+1, r + case when p.turn = 'w' then -1 else 1 end) = pn then e := public.chess_sqname(p.ep); end if;
  end if;
  return p.b || p.turn || p.castle || e;
end $$;

revoke all on function public.chess_parse(text), public.chess_fen(public.chess_pos), public.chess_attacked(text,int,text),
  public.chess_pseudo(public.chess_pos), public.chess_make(public.chess_pos,int,int,text), public.chess_legal(public.chess_pos),
  public.chess_has_legal(public.chess_pos) from anon;

-- ============================================================
-- 2) PARTITE, CHAT, CLASSIFICHE ELO (dal vivo e per corrispondenza)
-- ============================================================
create table if not exists public.chess_games (
  id          uuid primary key default gen_random_uuid(),
  mode        text not null check (mode in ('live','corr')),
  ranked      boolean not null default true,
  status      text not null default 'invite' check (status in ('invite','voting','tiebreak','coin','active','over','declined','cancelled','expired','aborted')),
  challenger  uuid not null references auth.users(id) on delete cascade,
  opponent    uuid not null references auth.users(id) on delete cascade,
  challenger_did text, opponent_did text,
  white uuid, black uuid, white_did text, black_did text,
  tc_base     int, tc_inc int,
  vote        jsonb not null default '{}'::jsonb,
  tiebreak    jsonb not null default '{}'::jsonb,
  coin        jsonb not null default '{}'::jsonb,
  start_fen   text not null default 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  fen         text not null default 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  moves       text[] not null default '{}',
  move_ms     int[] not null default '{}',          -- tempo usato per ogni mossa (serve all'analisi anti-cheat)
  keys        text[] not null default '{}',
  wms bigint, bms bigint,
  turn_since  timestamptz,
  draw_offer  uuid,
  result      text check (result in ('1-0','0-1','1/2-1/2')),
  reason      text,
  winner      uuid,
  elo         jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  started_at  timestamptz, ended_at timestamptz,
  updated_at  timestamptz not null default now()
);
create index if not exists chess_games_players on public.chess_games (white, black, ended_at desc);
create index if not exists chess_games_status on public.chess_games (status, updated_at desc);
create index if not exists chess_games_chal on public.chess_games (challenger, opponent, created_at desc);
alter table public.chess_games enable row level security;
drop policy if exists "chess_games_select_all" on public.chess_games;
create policy "chess_games_select_all" on public.chess_games for select using (true);   -- l'archivio è pubblico
revoke all on public.chess_games from anon, authenticated;
grant select on public.chess_games to anon, authenticated;

create table if not exists public.chess_chat (
  id bigint generated always as identity primary key,
  game_id uuid not null references public.chess_games(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  discord_id text,
  body text not null check (char_length(body) between 1 and 300),
  created_at timestamptz not null default now()
);
create index if not exists chess_chat_game on public.chess_chat (game_id, id);
alter table public.chess_chat enable row level security;
drop policy if exists "chess_chat_players" on public.chess_chat;
create policy "chess_chat_players" on public.chess_chat for select to authenticated
  using (exists (select 1 from public.chess_games g where g.id = game_id and auth.uid() in (g.challenger, g.opponent)));
revoke all on public.chess_chat from anon, authenticated;
grant select on public.chess_chat to authenticated;

create table if not exists public.chess_ratings (
  discord_id text not null,
  mode       text not null check (mode in ('live','corr')),
  user_id    uuid references auth.users(id) on delete cascade,
  elo        int not null default 1200,
  games      int not null default 0,
  wins int not null default 0, losses int not null default 0, draws int not null default 0,
  streak     int not null default 0,
  best_streak int not null default 0,
  peak       int not null default 1200,
  updated_at timestamptz not null default now(),
  primary key (discord_id, mode)
);
alter table public.chess_ratings enable row level security;
drop policy if exists "chess_ratings_select_all" on public.chess_ratings;
create policy "chess_ratings_select_all" on public.chess_ratings for select using (true);
revoke all on public.chess_ratings from anon, authenticated;
grant select on public.chess_ratings to anon, authenticated;

-- realtime: il sito riceve subito mosse e messaggi
do $$ begin
  alter publication supabase_realtime add table public.chess_games;
exception when undefined_object then null; when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.chess_chat;
exception when undefined_object then null; when duplicate_object then null; end $$;

-- ID Discord di un utente
create or replace function public.chess_did(u uuid) returns text
language sql stable security definer set search_path = public, auth as $$
  select coalesce(
    (select coalesce(i.identity_data->>'sub', i.provider_id) from auth.identities i where i.user_id = u and i.provider = 'discord' limit 1),
    (select coalesce(x.raw_user_meta_data->>'provider_id', x.raw_user_meta_data->>'sub') from auth.users x where x.id = u))
$$;
revoke all on function public.chess_did(uuid) from public, anon, authenticated;

create or replace function public.chess_uid_of(did text) returns uuid
language sql stable security definer set search_path = public, auth as $$
  select coalesce(
    (select i.user_id from auth.identities i where i.provider = 'discord' and (i.provider_id = did or i.identity_data->>'sub' = did) limit 1),
    (select x.id from auth.users x where x.raw_user_meta_data->>'provider_id' = did or x.raw_user_meta_data->>'sub' = did limit 1))
$$;
revoke all on function public.chess_uid_of(text) from public, anon, authenticated;

-- stato della partita + ora del server (per sincronizzare gli orologi)
create or replace function public.chess_out(g public.chess_games) returns jsonb
language sql stable as $$ select to_jsonb(g) - 'keys' || jsonb_build_object('now', now()) $$;

-- ---------- fine partita + ELO ----------
-- K: 80 nelle 5 partite di calibrazione, poi 32 (24 sopra le 30 partite)
-- vittorie di fila contro la STESSA persona: 1ª piena, 2ª metà, 3ª un quarto, dalla 4ª quasi nulla (5%)
-- streak: la 2ª vittoria di fila con la stessa persona allunga la streak solo se sono passate 3 ore dall'ultima partita con lei
create or replace function public.chess_finish(p_id uuid, p_result text, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare g public.chess_games; rw public.chess_ratings; rb public.chess_ratings; sw numeric; ew numeric;
  kw numeric; kb numeric; fac numeric := 1; n int := 0; prev record; dw int; db int; win uuid; win_did text; los_did text;
  same_recent boolean := false; h record;
begin
  select * into g from public.chess_games where id = p_id for update;
  if g.status <> 'active' then return; end if;
  win := case p_result when '1-0' then g.white when '0-1' then g.black else null end;
  update public.chess_games set status = 'over', result = p_result, reason = p_reason, winner = win, ended_at = now(), updated_at = now(), draw_offer = null
   where id = p_id;
  if not g.ranked then return; end if;

  insert into public.chess_ratings (discord_id, mode, user_id) values (g.white_did, g.mode, g.white) on conflict do nothing;
  insert into public.chess_ratings (discord_id, mode, user_id) values (g.black_did, g.mode, g.black) on conflict do nothing;
  select * into rw from public.chess_ratings where discord_id = g.white_did and mode = g.mode for update;
  select * into rb from public.chess_ratings where discord_id = g.black_did and mode = g.mode for update;

  sw := case p_result when '1-0' then 1 when '0-1' then 0 else 0.5 end;
  ew := 1 / (1 + power(10, (rb.elo - rw.elo) / 400.0));
  kw := case when rw.games < 5 then 80 when rw.games < 30 then 32 else 24 end;
  kb := case when rb.games < 5 then 80 when rb.games < 30 then 32 else 24 end;

  if win is not null then
    win_did := case when win = g.white then g.white_did else g.black_did end;
    los_did := case when win = g.white then g.black_did else g.white_did end;
    -- vittorie consecutive dello stesso vincitore contro questa persona (stessa modalità, ranked)
    for h in select x.winner, x.ended_at from public.chess_games x
              where x.id <> p_id and x.status = 'over' and x.ranked and x.mode = g.mode
                and ((x.white_did = g.white_did and x.black_did = g.black_did) or (x.white_did = g.black_did and x.black_did = g.white_did))
              order by x.ended_at desc limit 10 loop
      exit when h.winner is distinct from win;
      if n = 0 and h.ended_at > now() - interval '3 hours' then same_recent := true; end if;
      n := n + 1;
    end loop;
    fac := case least(n, 3) when 0 then 1 when 1 then 0.5 when 2 then 0.25 else 0.05 end;
  end if;

  dw := round(kw * (sw - ew) * fac);
  db := round(kb * ((1 - sw) - (1 - ew)) * fac);
  if win is not null and dw = 0 and db = 0 and fac > 0.05 then  -- almeno 1 punto quando conta
    if win = g.white then dw := 1; db := -1; else dw := -1; db := 1; end if;
  end if;

  update public.chess_ratings set elo = greatest(100, elo + dw), games = games + 1, peak = greatest(peak, elo + dw),
    wins = wins + (sw = 1)::int, losses = losses + (sw = 0)::int, draws = draws + (sw = 0.5)::int,
    streak = case when sw = 1 then streak + case when same_recent then 0 else 1 end else 0 end,
    best_streak = greatest(best_streak, case when sw = 1 then streak + case when same_recent then 0 else 1 end else 0 end),
    updated_at = now(), user_id = g.white
   where discord_id = g.white_did and mode = g.mode;
  update public.chess_ratings set elo = greatest(100, elo + db), games = games + 1, peak = greatest(peak, elo + db),
    wins = wins + (sw = 0)::int, losses = losses + (sw = 1)::int, draws = draws + (sw = 0.5)::int,
    streak = case when sw = 0 then streak + case when same_recent then 0 else 1 end else 0 end,
    best_streak = greatest(best_streak, case when sw = 0 then streak + case when same_recent then 0 else 1 end else 0 end),
    updated_at = now(), user_id = g.black
   where discord_id = g.black_did and mode = g.mode;

  update public.chess_games set elo = jsonb_build_object(
      'w', jsonb_build_object('before', rw.elo, 'after', greatest(100, rw.elo + dw), 'delta', dw, 'calib', rw.games < 5),
      'b', jsonb_build_object('before', rb.elo, 'after', greatest(100, rb.elo + db), 'delta', db, 'calib', rb.games < 5),
      'repeat', n, 'factor', fac, 'streak_hold', same_recent)
   where id = p_id;
  begin perform public.chess_flag_check(p_id); exception when others then null; end;
end $$;
revoke all on function public.chess_finish(uuid, text, text) from public, anon, authenticated;

-- colori: chi ha avuto il bianco l'ultima volta contro QUESTA persona ora ha il nero; la prima volta è casuale
create or replace function public.chess_assign_colors(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare g public.chess_games; last record; a_white boolean;
begin
  select * into g from public.chess_games where id = p_id;
  select x.white_did into last from public.chess_games x
   where x.id <> p_id and x.white_did is not null and x.status in ('active','over')
     and ((x.white_did = g.challenger_did and x.black_did = g.opponent_did) or (x.white_did = g.opponent_did and x.black_did = g.challenger_did))
   order by coalesce(x.started_at, x.created_at) desc limit 1;
  if found then a_white := last.white_did <> g.challenger_did; else a_white := random() < 0.5; end if;
  update public.chess_games set
    white = case when a_white then challenger else opponent end, black = case when a_white then opponent else challenger end,
    white_did = case when a_white then challenger_did else opponent_did end, black_did = case when a_white then opponent_did else challenger_did end
   where id = p_id;
end $$;
revoke all on function public.chess_assign_colors(uuid) from public, anon, authenticated;

create or replace function public.chess_begin(p_id uuid, p_tc text, p_delay_s numeric default 0) returns void
language plpgsql security definer set search_path = public as $$
declare base int; inc int;
begin
  if p_tc is not null then
    base := split_part(p_tc, '+', 1)::int * 60; inc := split_part(p_tc, '+', 2)::int;
  end if;
  perform public.chess_assign_colors(p_id);
  update public.chess_games set status = 'active', tc_base = base, tc_inc = inc,
    wms = case when base is null then null else base * 1000 end, bms = case when base is null then null else base * 1000 end,
    started_at = now() + make_interval(secs => p_delay_s), turn_since = now() + make_interval(secs => p_delay_s),
    keys = array[public.chess_key(public.chess_parse(start_fen))], updated_at = now()
   where id = p_id;
end $$;
revoke all on function public.chess_begin(uuid, text, numeric) from public, anon, authenticated;

-- lancio della moneta: il vincitore decide (il tempo che aveva votato, o il minigioco nello spareggio)
create or replace function public.chess_coin_flip(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare g public.chess_games; c jsonb; res text; w_uid text; a text; b text; pa text;
begin
  select * into g from public.chess_games where id = p_id for update;
  c := g.coin; a := g.challenger::text; b := g.opponent::text;
  if c->'picks' is null or c->'picks' = '{}'::jsonb then   -- nessuno ha scelto in tempo: scelta casuale
    pa := case when random() < 0.5 then 'testa' else 'croce' end;
    c := c || jsonb_build_object('picks', jsonb_build_object(a, pa, b, case when pa = 'testa' then 'croce' else 'testa' end), 'auto', true);
  end if;
  res := case when random() < 0.5 then 'testa' else 'croce' end;
  w_uid := case when c->'picks'->>a = res then a else b end;
  c := c || jsonb_build_object('res', res, 'winner', w_uid, 'at', now());
  update public.chess_games set coin = c, updated_at = now() where id = p_id;
  if c->>'for' = 'minigame' then
    -- la moneta sceglie il minigioco dello spareggio (quello votato da chi vince il lancio)
    update public.chess_games set status = 'tiebreak',
      tiebreak = tiebreak || jsonb_build_object('stage', 'play', 'game', tiebreak->'games'->>w_uid, 'dl', now() + interval '4 seconds' + interval '10 minutes', 'from', now() + interval '4 seconds', 'res', '{}'::jsonb)
     where id = p_id;
  else
    perform public.chess_begin(p_id, coalesce(g.vote->'last'->>w_uid, '10+0'), 4.5);   -- 4,5 s per vedere l'animazione
  end if;
end $$;
revoke all on function public.chess_coin_flip(uuid) from public, anon, authenticated;

-- fa avanzare le scadenze (voto, moneta, orologi, inviti). La chiama chiunque guardi la partita.
create or replace function public.chess_advance(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare g public.chess_games; v jsonb; a text; b text; va text; vb text; p public.chess_pos; rem bigint; side text;
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
    if g.mode = 'live' then
      rem := case when side = 'w' then g.wms else g.bms end - (extract(epoch from (now() - g.turn_since)) * 1000)::bigint;
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

-- ============================================================
-- 3) FUNZIONI CHIAMATE DAL SITO (tutte controllate dal server)
-- ============================================================
create or replace function public.chess_challenge(p_did text, p_mode text, p_ranked boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare me uuid := auth.uid(); opp uuid; my_did text; g public.chess_games;
begin
  if me is null then raise exception 'Accedi con Discord per giocare a scacchi'; end if;
  if p_mode not in ('live','corr') then raise exception 'Modalità non valida'; end if;
  opp := public.chess_uid_of(p_did); my_did := public.chess_did(me);
  if opp is null then raise exception 'Questo membro non ha ancora fatto l''accesso al sito'; end if;
  if opp = me then raise exception 'Non puoi sfidare te stesso'; end if;
  if (select count(*) from public.chess_games where challenger = me and status = 'invite') >= 10 then raise exception 'Hai già troppe sfide in attesa'; end if;
  if exists (select 1 from public.chess_games where status in ('invite','voting','coin','tiebreak') and mode = p_mode
             and ((challenger = me and opponent = opp) or (challenger = opp and opponent = me))) then
    raise exception 'C''è già una sfida aperta con questo membro';
  end if;
  insert into public.chess_games (mode, ranked, challenger, opponent, challenger_did, opponent_did)
  values (p_mode, coalesce(p_ranked, true), me, opp, my_did, p_did) returning * into g;
  return public.chess_out(g);
end $$;

create or replace function public.chess_respond(p_id uuid, p_accept boolean) returns jsonb
language plpgsql security definer set search_path = public as $$
declare g public.chess_games;
begin
  perform public.chess_advance(p_id);
  select * into g from public.chess_games where id = p_id for update;
  if not found or g.opponent <> auth.uid() then raise exception 'Sfida non trovata'; end if;
  if g.status <> 'invite' then raise exception 'Questa sfida non è più valida'; end if;
  if not p_accept then
    update public.chess_games set status = 'declined', updated_at = now() where id = p_id;
  elsif g.mode = 'corr' then
    perform public.chess_begin(p_id, null, 0);              -- per corrispondenza: niente orologio, 3 giorni per mossa
  else
    if exists (select 1 from public.chess_games where status in ('voting','coin','tiebreak','active') and mode = 'live' and id <> p_id
               and (auth.uid() in (challenger, opponent) or g.challenger in (challenger, opponent))) then
      raise exception 'Uno dei due sta già giocando una partita dal vivo';
    end if;
    -- il voto (5 secondi) parte quando tutti e due sono sulla pagina della partita (chess_ready); chi non arriva entro 45 s annulla
    update public.chess_games set status = 'voting', updated_at = now(),
      vote = jsonb_build_object('r', 1, 'dl', null, 'wait', now() + interval '45 seconds', 'ready', jsonb_build_object(auth.uid()::text, true), 'v', '{}'::jsonb, 'last', '{}'::jsonb)
     where id = p_id;
  end if;
  select * into g from public.chess_games where id = p_id;
  return public.chess_out(g);
end $$;

create or replace function public.chess_cancel(p_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare g public.chess_games;
begin
  update public.chess_games set status = 'cancelled', updated_at = now()
   where id = p_id and challenger = auth.uid() and status = 'invite' returning * into g;
  if not found then raise exception 'Sfida non trovata'; end if;
  return public.chess_out(g);
end $$;

create or replace function public.chess_get(p_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare g public.chess_games;
begin
  perform public.chess_advance(p_id);
  select * into g from public.chess_games where id = p_id;
  if not found then raise exception 'Partita non trovata'; end if;
  return public.chess_out(g);
end $$;

-- "sono qui": quando ci sono tutti e due parte il conto alla rovescia del voto
create or replace function public.chess_ready(p_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare g public.chess_games;
begin
  perform public.chess_advance(p_id);
  select * into g from public.chess_games where id = p_id for update;
  if not found or auth.uid() not in (g.challenger, g.opponent) then raise exception 'Partita non trovata'; end if;
  if g.status = 'voting' and g.vote->>'dl' is null then
    g.vote := jsonb_set(g.vote, array['ready', auth.uid()::text], 'true'::jsonb);
    if g.vote->'ready' ? g.challenger::text and g.vote->'ready' ? g.opponent::text then
      g.vote := g.vote || jsonb_build_object('dl', now() + interval '6 seconds');     -- 5 secondi + 1 di margine per la rete
    end if;
    update public.chess_games set vote = g.vote, updated_at = now() where id = p_id;
  end if;
  select * into g from public.chess_games where id = p_id;
  return public.chess_out(g);
end $$;

-- voto del tempo: 10+0, 10+4, 15+0, 15+4 (5 secondi, poi altri 5, poi testa o croce)
create or replace function public.chess_vote(p_id uuid, p_tc text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare g public.chess_games; me text := auth.uid()::text;
begin
  if p_tc not in ('10+0','10+4','15+0','15+4') then raise exception 'Tempo non valido'; end if;
  perform public.chess_advance(p_id);
  select * into g from public.chess_games where id = p_id for update;
  if not found or auth.uid() not in (g.challenger, g.opponent) then raise exception 'Partita non trovata'; end if;
  if g.status <> 'voting' then raise exception 'Il voto è chiuso'; end if;
  if g.vote->>'dl' is null then raise exception 'Aspetto che arrivi anche l''altro giocatore'; end if;
  if now() > (g.vote->>'dl')::timestamptz then raise exception 'Tempo scaduto per votare'; end if;
  update public.chess_games set vote = jsonb_set(vote, array['v', me], to_jsonb(p_tc)), updated_at = now() where id = p_id;
  perform public.chess_advance(p_id);
  select * into g from public.chess_games where id = p_id;
  return public.chess_out(g);
end $$;

-- testa o croce: chi sceglie per primo si prende quel lato, l'altro ha quello opposto
create or replace function public.chess_coin_pick(p_id uuid, p_side text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare g public.chess_games; me text := auth.uid()::text; other text;
begin
  if p_side not in ('testa','croce') then raise exception 'Scegli testa o croce'; end if;
  select * into g from public.chess_games where id = p_id for update;
  if not found or auth.uid() not in (g.challenger, g.opponent) then raise exception 'Partita non trovata'; end if;
  if g.status <> 'coin' or g.coin->>'res' is not null then raise exception 'La moneta è già stata lanciata'; end if;
  if coalesce(g.coin->'picks', '{}'::jsonb) <> '{}'::jsonb then raise exception 'L''altro ha scelto per primo'; end if;
  other := case when me = g.challenger::text then g.opponent::text else g.challenger::text end;
  update public.chess_games set coin = coin || jsonb_build_object('picks', jsonb_build_object(me, p_side, other, case when p_side = 'testa' then 'croce' else 'testa' end), 'first', me)
   where id = p_id;
  perform public.chess_coin_flip(p_id);
  select * into g from public.chess_games where id = p_id;
  return public.chess_out(g);
end $$;

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
    rem := case when p.turn = 'w' then g.wms else g.bms end - el + coalesce(g.tc_inc, 0) * 1000;
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
  if res is not null then perform public.chess_finish(p_id, res, why); end if;
  select * into g from public.chess_games where id = p_id;
  return public.chess_out(g);
end $$;

-- resa: nelle ranked solo se sei sotto di almeno 6 punti di materiale
create or replace function public.chess_resign(p_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare g public.chess_games; me uuid := auth.uid(); mat int;
begin
  perform public.chess_advance(p_id);
  select * into g from public.chess_games where id = p_id for update;
  if not found or me not in (g.white, g.black) then raise exception 'Partita non trovata'; end if;
  if g.status <> 'active' then raise exception 'La partita è finita'; end if;
  mat := public.chess_material((public.chess_parse(g.fen)).b) * case when me = g.white then 1 else -1 end;
  if g.ranked and mat > -6 then
    raise exception 'Nelle ranked puoi arrenderti solo quando sei sotto di almeno 6 punti di materiale (ora: %)', case when mat > 0 then '+' || mat else mat::text end;
  end if;
  perform public.chess_finish(p_id, case when me = g.white then '0-1' else '1-0' end, 'abbandono');
  select * into g from public.chess_games where id = p_id;
  return public.chess_out(g);
end $$;

-- patta: nelle ranked dal vivo solo quando a tutti e due restano meno di 5 minuti; per corrispondenza dopo 40 mosse
create or replace function public.chess_draw(p_id uuid, p_action text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare g public.chess_games; me uuid := auth.uid(); w bigint; b bigint; el bigint; turn text;
begin
  perform public.chess_advance(p_id);
  select * into g from public.chess_games where id = p_id for update;
  if not found or me not in (g.white, g.black) then raise exception 'Partita non trovata'; end if;
  if g.status <> 'active' then raise exception 'La partita è finita'; end if;
  if p_action = 'decline' then
    update public.chess_games set draw_offer = null, updated_at = now() where id = p_id and draw_offer is not null and draw_offer <> me;
  elsif p_action in ('offer','accept') then
    if g.draw_offer is not null and g.draw_offer <> me then
      perform public.chess_finish(p_id, '1/2-1/2', 'accordo');
    elsif p_action = 'accept' then raise exception 'Nessuna patta da accettare';
    else
      if g.ranked and g.mode = 'live' then
        turn := split_part(g.fen, ' ', 2); el := greatest(0, (extract(epoch from (now() - g.turn_since)) * 1000)::bigint);
        w := g.wms - case when turn = 'w' then el else 0 end; b := g.bms - case when turn = 'b' then el else 0 end;
        if w >= 300000 or b >= 300000 then raise exception 'Nelle ranked la patta si può chiedere solo quando a tutti e due restano meno di 5 minuti'; end if;
      elsif g.ranked and coalesce(array_length(g.moves, 1), 0) < 80 then
        raise exception 'Nelle ranked per corrispondenza la patta si può chiedere dopo 40 mosse';
      end if;
      update public.chess_games set draw_offer = me, updated_at = now() where id = p_id;
    end if;
  else raise exception 'Azione non valida'; end if;
  select * into g from public.chess_games where id = p_id;
  return public.chess_out(g);
end $$;

-- annulla: solo prima che tutti e due abbiano mosso (non conta per l'ELO)
create or replace function public.chess_abort(p_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare g public.chess_games;
begin
  perform public.chess_advance(p_id);
  select * into g from public.chess_games where id = p_id for update;
  if not found or auth.uid() not in (g.challenger, g.opponent) then raise exception 'Partita non trovata'; end if;
  if g.status not in ('voting','coin','tiebreak','active') or coalesce(array_length(g.moves, 1), 0) >= 2 then
    raise exception 'Ormai la partita non si può più annullare';
  end if;
  update public.chess_games set status = 'aborted', reason = 'annullata', ended_at = now(), updated_at = now() where id = p_id returning * into g;
  return public.chess_out(g);
end $$;

create or replace function public.chess_chat_send(p_id uuid, p_body text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare g public.chess_games; v_id bigint;
begin
  select * into g from public.chess_games where id = p_id;
  if not found or auth.uid() not in (g.challenger, g.opponent) then raise exception 'Partita non trovata'; end if;
  p_body := left(trim(regexp_replace(coalesce(p_body,''), '[\r\n\t]+', ' ', 'g')), 300);
  if p_body = '' then raise exception 'Messaggio vuoto'; end if;
  if (select count(*) from public.chess_chat where user_id = auth.uid() and created_at > now() - interval '1 minute') >= 20 then
    raise exception 'Stai scrivendo troppo veloce';
  end if;
  insert into public.chess_chat (game_id, user_id, discord_id, body) values (p_id, auth.uid(), public.chess_did(auth.uid()), p_body) returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;

do $$ declare f text; begin
  foreach f in array array['chess_challenge(text,text,boolean)','chess_respond(uuid,boolean)','chess_cancel(uuid)','chess_vote(uuid,text)',
    'chess_coin_pick(uuid,text)','chess_ready(uuid)','chess_move(uuid,text)','chess_resign(uuid)','chess_draw(uuid,text)','chess_abort(uuid)','chess_chat_send(uuid,text)'] loop
    execute 'revoke all on function public.' || f || ' from public, anon';
    execute 'grant execute on function public.' || f || ' to authenticated';
  end loop;
  execute 'grant execute on function public.chess_get(uuid) to anon, authenticated';
end $$;

-- submit_score uguale alla patch 4.2, in più: Battitura da 30 secondi (spareggio scacchi)
create or replace function public.submit_score(p_session uuid, p_score int, p_extra jsonb default '{}'::jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  s   public.game_sessions%rowtype;
  x   jsonb := coalesce(p_extra, '{}'::jsonb);
  el  numeric;          -- secondi passati dall'inizio della partita (orologio del server)
  sc  int := p_score;
  err text := null;
  n   numeric;
  v_id bigint;
  secs int;
begin
  if auth.uid() is null then raise exception 'Accedi con Discord per salvare il punteggio'; end if;
  select * into s from public.game_sessions where id = p_session for update;
  if not found or s.user_id <> auth.uid() then raise exception 'Partita non valida: rigioca per salvare il punteggio'; end if;
  if s.used_at is not null then raise exception 'Questa partita è già stata salvata'; end if;
  if s.started_at < now() - interval '4 hours' then raise exception 'Partita scaduta: rigioca per salvare il punteggio'; end if;
  if jsonb_typeof(x) <> 'object' or pg_column_size(x) > 2000 then x := '{}'::jsonb; end if;
  if sc is null or sc < 1 then raise exception 'Punteggio non valido'; end if;
  el := extract(epoch from (now() - s.started_at));

  case s.game
    when 'reaction' then if sc < 125 or el + 2 < 6 + 5 * sc / 1000.0 then err := 'tempo'; end if;
    when 'clicker'  then if sc > 400 or el + 2 < 10 then err := 'tempo'; end if;
    when 'mines'    then if sc < 25 or el + 3 < sc then err := 'tempo'; end if;           -- 20x20 con 60 fiori: sotto i 25 s non è credibile
    when 'typing'   then
      n := nullif(x->>'chars', '')::numeric;                                              -- lettere giuste scritte in 60 secondi (30 nello spareggio scacchi)
      secs := case when x->>'secs' = '30' then 30 else 60 end;
      if n is null or el + 2 < secs or n / 5.0 * 60 / secs > 200 or sc > ceil(n / 5.0 * 60 / secs) + 1 then err := 'tempo'; end if;
    when 'quiz'     then
      n := nullif(x->>'right', '')::numeric;                                              -- risposte giuste (max 10)
      if n is null or n < 0 or n > 10 or sc > 192 * n or sc < 100 * n                     -- almeno 1,2 s per domanda
         or el + 2 < (200 * n - sc) * 0.15 then err := 'tempo'; end if;
    when 'wordle'   then null;                                                            -- una volta al giorno (controllo già esistente)
    when 'dino'     then if sc > 150 * el + 200 then err := 'tempo'; end if;              -- velocità massima del gioco: 150 punti al secondo
    when 'flappy'   then if sc > 0.8 * el + 3 then err := 'tempo'; end if;                -- un tubo ogni 1,45 s
    when 'snake'    then if sc > 2.5 * el + 3 then err := 'tempo'; end if;
    when 'tetris'   then if sc > 100 * el + 3 * el * el + 500 then err := 'tempo'; end if;
    when 'suika'    then if sc > 300 * el + 1000 then err := 'tempo'; end if;
    when '2048'     then if sc > 150 * el + 500 then err := 'tempo'; end if;
    when 'breakout' then if sc > 40 * el + 300 then err := 'tempo'; end if;
    when 'stack'    then if sc > 4 * el + 5 then err := 'tempo'; end if;
    when 'hol'      then if sc > 1.25 * el + 2 then err := 'tempo'; end if;
    else err := 'gioco';
  end case;

  update public.game_sessions set used_at = now(), score = sc, extra = x, result = coalesce(err, 'ok') where id = s.id;
  if err is not null then
    return jsonb_build_object('ok', false, 'error', 'Punteggio non valido: la partita non risulta giocata davvero, quindi non è stato salvato.');
  end if;
  insert into public.scores (game, score) values (s.game, sc) returning id into v_id;   -- nome, avatar e ID Discord li mette il trigger
  return jsonb_build_object('ok', true, 'id', v_id);
end $$;
revoke all on function public.submit_score(uuid, int, jsonb) from public, anon;
grant execute on function public.submit_score(uuid, int, jsonb) to authenticated;

-- ============================================================
-- 5) AMICHEVOLI: spareggio con un minigioco quando non siete d'accordo sul tempo
--    Snake e Flappy: chi muore per primo perde · Riflessi: chi è più lento perde · Quiz anime: 5 domande, meno punti perde
--    Stack: torre più bassa perde · Battitura: 30 secondi, più lento perde. I punteggi valgono anche nelle classifiche dei minigiochi.
-- ============================================================
create or replace function public.chess_tiebreak_advance(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare g public.chess_games; t jsonb; a text; b text; x text; y text; ra jsonb; rb jsonb; win text; better int;
begin
  select * into g from public.chess_games where id = p_id for update;
  if g.status <> 'tiebreak' then return; end if;
  t := g.tiebreak; a := g.challenger::text; b := g.opponent::text;
  if t->>'stage' = 'how' then
    x := t->'how'->>a; y := t->'how'->>b;
    if (x is not null and y is not null) or now() > (t->>'dl')::timestamptz then
      if x = 'minigame' and y = 'minigame' then
        update public.chess_games set tiebreak = jsonb_build_object('stage', 'pick', 'dl', now() + interval '12 seconds', 'how', t->'how', 'games', '{}'::jsonb), updated_at = now() where id = p_id;
      else
        update public.chess_games set status = 'coin', coin = jsonb_build_object('for', 'tc', 'dl', now() + interval '8 seconds', 'picks', '{}'::jsonb), updated_at = now() where id = p_id;
      end if;
    end if;
  elsif t->>'stage' = 'pick' then
    x := t->'games'->>a; y := t->'games'->>b;
    if (x is not null and y is not null) or now() > (t->>'dl')::timestamptz then
      if x is null and y is null then
        update public.chess_games set status = 'coin', coin = jsonb_build_object('for', 'tc', 'dl', now() + interval '8 seconds', 'picks', '{}'::jsonb), updated_at = now() where id = p_id;
      elsif x is null or y is null or x = y then
        update public.chess_games set tiebreak = t || jsonb_build_object('stage', 'play', 'game', coalesce(x, y), 'from', now(), 'dl', now() + interval '10 minutes', 'res', '{}'::jsonb), updated_at = now() where id = p_id;
      else
        -- minigiochi diversi: decide la moneta
        update public.chess_games set status = 'coin', coin = jsonb_build_object('for', 'minigame', 'dl', now() + interval '8 seconds', 'picks', '{}'::jsonb), updated_at = now() where id = p_id;
      end if;
    end if;
  elsif t->>'stage' = 'play' then
    ra := t->'res'->a; rb := t->'res'->b;
    if (ra is not null and rb is not null) or now() > (t->>'dl')::timestamptz then
      if ra is null and rb is null then
        update public.chess_games set status = 'coin', coin = jsonb_build_object('for', 'tc', 'dl', now() + interval '8 seconds', 'picks', '{}'::jsonb), updated_at = now() where id = p_id;
        return;
      elsif rb is null then win := a;
      elsif ra is null then win := b;
      else
        better := case t->>'game'
          when 'reaction' then sign((rb->>'s')::numeric - (ra->>'s')::numeric)                 -- più basso è meglio
          when 'snake'    then sign((ra->>'d')::numeric - (rb->>'d')::numeric)                 -- chi resta vivo di più
          when 'flappy'   then sign((ra->>'d')::numeric - (rb->>'d')::numeric)
          else sign((ra->>'s')::numeric - (rb->>'s')::numeric) end;
        if better = 0 then
          update public.chess_games set tiebreak = t || jsonb_build_object('stage', 'done', 'winner', null), status = 'coin',
            coin = jsonb_build_object('for', 'tc', 'dl', now() + interval '8 seconds', 'picks', '{}'::jsonb), updated_at = now() where id = p_id;
          return;
        end if;
        win := case when better > 0 then a else b end;
      end if;
      update public.chess_games set tiebreak = t || jsonb_build_object('stage', 'done', 'winner', win) where id = p_id;
      perform public.chess_begin(p_id, coalesce(g.vote->'last'->>win, '10+0'), 4);
    end if;
  end if;
end $$;
revoke all on function public.chess_tiebreak_advance(uuid) from public, anon, authenticated;

create or replace function public.chess_tiebreak(p_id uuid, p_what text, p_value text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare g public.chess_games; me text := auth.uid()::text;
begin
  perform public.chess_advance(p_id);
  select * into g from public.chess_games where id = p_id for update;
  if not found or auth.uid() not in (g.challenger, g.opponent) then raise exception 'Partita non trovata'; end if;
  if g.status <> 'tiebreak' then raise exception 'Lo spareggio è chiuso'; end if;
  if p_what = 'how' and g.tiebreak->>'stage' = 'how' and p_value in ('coin','minigame') then
    update public.chess_games set tiebreak = jsonb_set(tiebreak, array['how', me], to_jsonb(p_value)), updated_at = now() where id = p_id;
  elsif p_what = 'game' and g.tiebreak->>'stage' = 'pick' and p_value in ('snake','reaction','flappy','quiz','stack','typing') then
    update public.chess_games set tiebreak = jsonb_set(tiebreak, array['games', me], to_jsonb(p_value)), updated_at = now() where id = p_id;
  else raise exception 'Scelta non valida'; end if;
  perform public.chess_advance(p_id);
  select * into g from public.chess_games where id = p_id;
  return public.chess_out(g);
end $$;

-- risultato dello spareggio: si manda l'ID della partita al minigioco (già salvata con submit_score, quindi controllata)
create or replace function public.chess_tiebreak_submit(p_id uuid, p_session uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare g public.chess_games; s public.game_sessions; me text := auth.uid()::text;
begin
  perform public.chess_advance(p_id);
  select * into g from public.chess_games where id = p_id for update;
  if not found or auth.uid() not in (g.challenger, g.opponent) then raise exception 'Partita non trovata'; end if;
  if g.status <> 'tiebreak' or g.tiebreak->>'stage' <> 'play' then raise exception 'Lo spareggio è chiuso'; end if;
  if g.tiebreak->'res'->me is not null then raise exception 'Hai già giocato lo spareggio'; end if;
  select * into s from public.game_sessions where id = p_session;
  if not found or s.user_id <> auth.uid() or s.game <> g.tiebreak->>'game' or s.used_at is null or s.result <> 'ok'
     or s.started_at < (g.tiebreak->>'from')::timestamptz - interval '5 seconds' then
    raise exception 'Partita dello spareggio non valida';
  end if;
  if s.game = 'quiz' and coalesce(s.extra->>'n','') <> '5' then raise exception 'Nello spareggio il quiz è da 5 domande'; end if;
  if s.game = 'typing' and coalesce(s.extra->>'secs','') <> '30' then raise exception 'Nello spareggio la battitura dura 30 secondi'; end if;
  update public.chess_games set tiebreak = jsonb_set(tiebreak || jsonb_build_object('res', coalesce(tiebreak->'res', '{}'::jsonb)), array['res', me],
      jsonb_build_object('s', s.score, 'd', (extract(epoch from (s.used_at - s.started_at)) * 1000)::bigint)), updated_at = now()
   where id = p_id;
  perform public.chess_advance(p_id);
  select * into g from public.chess_games where id = p_id;
  return public.chess_out(g);
end $$;

-- se lo spareggio finisce in "perso" (morto subito ecc.) la partita può non arrivare a submit_score ma conta comunque
-- quella salvata. Chi non gioca entro 10 minuti perde lo spareggio.
do $$ declare f text; begin
  foreach f in array array['chess_tiebreak(uuid,text,text)','chess_tiebreak_submit(uuid,uuid)'] loop
    execute 'revoke all on function public.' || f || ' from public, anon';
    execute 'grant execute on function public.' || f || ' to authenticated';
  end loop;
end $$;

-- ============================================================
-- 6) ANALISI STOCKFISH + CONTROLLO ANTI-CHEAT (solo segnalazioni allo staff, niente ban automatici)
--    L'analisi la fa Stockfish nel browser; ognuno salva la sua copia (giocatori e staff), così nessuno può nasconderla.
-- ============================================================
create table if not exists public.chess_analysis (
  game_id uuid not null references public.chess_games(id) on delete cascade,
  by_did  text not null,
  data    jsonb not null,           -- per ogni mossa: tipo (geniale, migliore, errore…), mossa migliore, valutazione
  acc_w   numeric, acc_b numeric,
  depth   int,
  created_at timestamptz not null default now(),
  primary key (game_id, by_did)
);
alter table public.chess_analysis enable row level security;
drop policy if exists "chess_analysis_select_all" on public.chess_analysis;
create policy "chess_analysis_select_all" on public.chess_analysis for select using (true);
revoke all on public.chess_analysis from anon, authenticated;
grant select on public.chess_analysis to anon, authenticated;

create table if not exists public.chess_flags (
  id bigint generated always as identity primary key,
  game_id uuid not null references public.chess_games(id) on delete cascade,
  discord_id text not null,
  kind text not null,               -- troppo_preciso · salto_precisione · perde_apposta
  detail text,
  created_at timestamptz not null default now(),
  checked boolean not null default false,
  unique (game_id, discord_id, kind)
);
alter table public.chess_flags enable row level security;
drop policy if exists "chess_flags_staff" on public.chess_flags;
create policy "chess_flags_staff" on public.chess_flags for select to authenticated using (public.can_moderate() or public.is_staff());
revoke all on public.chess_flags from anon, authenticated;
grant select on public.chess_flags to authenticated;

create or replace function public.chess_flag(p_game uuid, p_did text, p_kind text, p_detail text) returns void
language sql security definer set search_path = public as $$
  insert into public.chess_flags (game_id, discord_id, kind, detail) values (p_game, p_did, p_kind, left(p_detail, 300))
  on conflict (game_id, discord_id, kind) do update set detail = excluded.detail;
$$;
revoke all on function public.chess_flag(uuid, text, text, text) from public, anon, authenticated;

-- controlli che non servono l'analisi: chi perde tante ranked di fila contro la stessa persona in poco tempo
create or replace function public.chess_flag_check(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare g public.chess_games; los_did text; win_did text; n int;
begin
  select * into g from public.chess_games where id = p_id;
  if not g.ranked or g.winner is null then return; end if;
  win_did := case when g.winner = g.white then g.white_did else g.black_did end;
  los_did := case when g.winner = g.white then g.black_did else g.white_did end;
  select count(*) into n from public.chess_games x
   where x.status = 'over' and x.ranked and x.ended_at > now() - interval '24 hours'
     and ((x.white_did = win_did and x.black_did = los_did) or (x.white_did = los_did and x.black_did = win_did))
     and x.winner is not null and (case when x.winner = x.white then x.white_did else x.black_did end) = win_did;
  if n >= 3 then perform public.chess_flag(p_id, los_did, 'perde_apposta', n || ' ranked perse contro lo stesso membro in 24 ore'); end if;
  if coalesce(array_length(g.moves,1),0) < 12 and g.reason in ('abbandono','tempo') then
    perform public.chess_flag(p_id, los_did, 'perde_apposta', 'ranked persa per ' || g.reason || ' dopo solo ' || coalesce(array_length(g.moves,1),0) || ' mosse');
  end if;
end $$;
revoke all on function public.chess_flag_check(uuid) from public, anon, authenticated;

create or replace function public.chess_save_analysis(p_id uuid, p_data jsonb, p_acc_w numeric, p_acc_b numeric, p_depth int) returns jsonb
language plpgsql security definer set search_path = public as $$
declare g public.chess_games; me text := public.chess_did(auth.uid()); staff boolean := public.can_moderate() or public.is_staff();
  side text; did text; acc numeric; nmoves int; avg_prev numeric; blund int; loser text;
begin
  select * into g from public.chess_games where id = p_id;
  if not found or g.status <> 'over' then raise exception 'Partita non trovata'; end if;
  if not staff and auth.uid() not in (g.white, g.black) then raise exception 'Solo i giocatori e lo staff salvano l''analisi'; end if;
  if jsonb_typeof(p_data) <> 'array' or pg_column_size(p_data) > 250000 then raise exception 'Analisi non valida'; end if;
  insert into public.chess_analysis (game_id, by_did, data, acc_w, acc_b, depth) values (p_id, me, p_data, p_acc_w, p_acc_b, p_depth)
  on conflict (game_id, by_did) do update set data = excluded.data, acc_w = excluded.acc_w, acc_b = excluded.acc_b, depth = excluded.depth, created_at = now();
  if not g.ranked then return jsonb_build_object('ok', true); end if;
  loser := case when g.winner = g.white then 'b' when g.winner = g.black then 'w' end;
  foreach side in array array['w','b'] loop
    did := case when side = 'w' then g.white_did else g.black_did end;
    acc := case when side = 'w' then p_acc_w else p_acc_b end;
    nmoves := (coalesce(array_length(g.moves,1),0) + case when side = 'w' then 1 else 0 end) / 2;
    continue when acc is null or nmoves < 15;
    if acc >= 96 then perform public.chess_flag(p_id, did, 'troppo_preciso', 'precisione ' || round(acc,1) || '% su ' || nmoves || ' mosse'); end if;
    select avg(case when x.white_did = did then a.acc_w else a.acc_b end) into avg_prev
      from public.chess_analysis a join public.chess_games x on x.id = a.game_id
     where a.game_id <> p_id and (x.white_did = did or x.black_did = did) and x.ranked;
    if avg_prev is not null and acc >= 90 and acc - avg_prev >= 25 then
      perform public.chess_flag(p_id, did, 'salto_precisione', 'precisione ' || round(acc,1) || '% contro una media di ' || round(avg_prev,1) || '%');
    end if;
    if side = loser then
      select count(*) into blund from jsonb_array_elements(p_data) with ordinality e(v, i)
       where (i % 2 = 1) = (side = 'w') and v->>'c' = 'blunder';
      if acc < 35 or blund >= 5 then
        perform public.chess_flag(p_id, did, 'perde_apposta', 'precisione ' || round(acc,1) || '% e ' || blund || ' blunder nella partita persa');
      end if;
    end if;
  end loop;
  return jsonb_build_object('ok', true);
end $$;
revoke all on function public.chess_save_analysis(uuid, jsonb, numeric, numeric, int) from public, anon;
grant execute on function public.chess_save_analysis(uuid, jsonb, numeric, numeric, int) to authenticated;

create or replace function public.chess_flag_seen(p_id bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not (public.can_moderate() or public.is_staff()) then raise exception 'Solo staff'; end if;
  update public.chess_flags set checked = true where id = p_id;
end $$;
revoke all on function public.chess_flag_seen(bigint) from public, anon;
grant execute on function public.chess_flag_seen(bigint) to authenticated;

-- ============================================================
-- 4) CORONE: "Re di Staskys" = 1° in classifica generale per 30 ore di fila
--    Il server segna da quando qualcuno è 1° (stesso calcolo dei punti del sito)
-- ============================================================
create table if not exists public.king_reigns (
  id bigint generated always as identity primary key,
  discord_id text not null,
  started_at timestamptz not null default now(),
  ended_at   timestamptz,
  checked_at timestamptz not null default now()
);
create index if not exists king_reigns_did on public.king_reigns (discord_id);
create unique index if not exists king_reigns_one_open on public.king_reigns ((ended_at is null)) where ended_at is null;
alter table public.king_reigns enable row level security;
drop policy if exists "king_reigns_select_all" on public.king_reigns;
create policy "king_reigns_select_all" on public.king_reigns for select using (true);
revoke all on public.king_reigns from anon, authenticated;
grant select on public.king_reigns to anon, authenticated;

-- punti della classifica generale, uguali al sito (social.js):
-- 10 per minigioco + 50/30/20 per 1°/2°/3° + 5 se in top 10 + 5 per giorno di streak (Wordle, Clicker, Higher or Lower esclusi)
-- UPDATE 5: + scacchi ranked (dal vivo e per corrispondenza), contati come un minigioco ciascuno dopo le 5 partite di calibrazione
create or replace function public.general_points() returns table (discord_id text, points int, firsts int)
language sql stable security definer set search_path = public as $$
  with lb as (
    select l.discord_id, l.user_id, l.game,
           row_number() over (partition by l.game order by case when l.game in ('reaction','mines','wordle') then l.score else -l.score end, l.created_at) rk
      from public.leaderboard l where coalesce(l.discord_id,'') <> ''
  ), g as (
    select lb.discord_id, sum(10 + case when rk = 1 then 50 when rk = 2 then 30 when rk = 3 then 20 when rk <= 10 then 5 else 0 end) pts,
           count(*) filter (where rk = 1) f
      from lb where lb.game not in ('wordle','clicker','hol') group by lb.discord_id
  ), uid as (select distinct on (lb.discord_id) lb.discord_id, lb.user_id from lb), st as (
    select u.discord_id, max(case when (now() at time zone 'Europe/Rome')::date - s.last_day <= 1 then s.streak else 0 end) * 5 pts
      from public.streaks s join uid u on u.user_id = s.user_id group by u.discord_id
  ), ch as (
    select r.discord_id, sum(10 + case when rk = 1 then 50 when rk = 2 then 30 when rk = 3 then 20 when rk <= 10 then 5 else 0 end) pts
      from (select c.discord_id, row_number() over (partition by c.mode order by c.elo desc, c.games desc, c.discord_id) rk
              from public.chess_ratings c where c.games >= 5) r group by r.discord_id
  ), ids as (select g.discord_id from g union select ch.discord_id from ch)
  select i.discord_id, (coalesce(g.pts,0) + coalesce(st.pts,0) + coalesce(ch.pts,0))::int, coalesce(g.f,0)::int
    from ids i left join g on g.discord_id = i.discord_id left join st on st.discord_id = i.discord_id left join ch on ch.discord_id = i.discord_id
$$;
revoke all on function public.general_points() from public, anon, authenticated;

create or replace function public.king_tick() returns void
language plpgsql security definer set search_path = public as $$
declare top text; cur public.king_reigns;
begin
  select discord_id into top from public.general_points() where points > 0 order by points desc, firsts desc, discord_id limit 1;
  select * into cur from public.king_reigns where ended_at is null for update;
  if found and cur.discord_id = top then
    update public.king_reigns set checked_at = now() where id = cur.id; return;
  end if;
  if found then update public.king_reigns set ended_at = now(), checked_at = now() where id = cur.id; end if;
  if top is not null then insert into public.king_reigns (discord_id) values (top); end if;
end $$;
revoke all on function public.king_tick() from public, anon;
grant execute on function public.king_tick() to authenticated;   -- il sito lo chiama ogni tanto (non fa danni: ricalcola e basta)

create or replace function public.king_tick_trg() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  begin perform public.king_tick(); exception when others then null; end;   -- non deve mai bloccare un salvataggio
  return null;
end $$;
drop trigger if exists king_after_scores on public.scores;
create trigger king_after_scores after insert or delete on public.scores for each statement execute function public.king_tick_trg();
drop trigger if exists king_after_chess on public.chess_ratings;
create trigger king_after_chess after insert or update on public.chess_ratings for each statement execute function public.king_tick_trg();

-- controllo automatico ogni 10 minuti (le streak scadono anche senza nuove partite). Se pg_cron non c'è, basta il sito.
do $$ begin
  create extension if not exists pg_cron;
  perform cron.unschedule(jobid) from cron.job where jobname = 'staskys-re';
  perform cron.schedule('staskys-re', '*/10 * * * *', 'select public.king_tick()');
exception when others then raise notice 'pg_cron non disponibile: il controllo lo fa il sito';
end $$;

select public.king_tick();

commit;
