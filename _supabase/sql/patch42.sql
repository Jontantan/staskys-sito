-- Staskys · PATCH 4.2 · database
-- Da incollare in Supabase > SQL Editor > New query > Run, NELLO STESSO MOMENTO in cui si pubblica la patch 4.2
-- (prima della pubblicazione il sito vecchio non riuscirebbe più a salvare i punteggi).
-- Non cancella nessun punteggio, voto o profilo. Si può rieseguire senza problemi.
--  1) ANTI-CHEAT: i punteggi si salvano solo con una partita aperta dal server (start_game → submit_score)
--  2) nuovo minigioco "Higher or Lower" (hol)
--  3) ruoli speciali del sito (es. "Gestore sito"), modificabili da Table Editor > site_roles
--  4) commenti sul profilo (con limiti, eliminazione e possibilità di disattivarli)

begin;

-- 1a) giochi permessi e limiti (uguali a prima + hol)
alter table public.scores drop constraint if exists scores_game_check;
alter table public.scores add constraint scores_game_check check (game in (
  'snake','reaction','clicker','flappy','tetris','dino','quiz',
  '2048','breakout','typing','mines','wordle','stack','suika','hol'));
alter table public.scores drop constraint if exists score_sane;
alter table public.scores add constraint score_sane check (
  (game = 'snake'    and score between 1 and 397) or
  (game = 'reaction' and score between 100 and 5000) or
  (game = 'clicker'  and score between 1 and 400) or
  (game = 'flappy'   and score between 1 and 10000) or
  (game = 'tetris'   and score between 1 and 9999999) or
  (game = 'dino'     and score between 1 and 1000000) or
  (game = 'quiz'     and score between 1 and 2000) or
  (game = '2048'     and score between 4 and 4000000) or
  (game = 'breakout' and score between 1 and 1000000) or
  (game = 'typing'   and score between 1 and 250) or
  (game = 'mines'    and score between 10 and 36000) or
  (game = 'wordle'   and score between 1 and 7) or
  (game = 'stack'    and score between 1 and 5000) or
  (game = 'suika'    and score between 1 and 1000000) or
  (game = 'hol'      and score between 1 and 1000)
);

-- 1b) partite aperte dal server (nessuno le legge o le scrive dal sito: solo le due funzioni qui sotto)
create table if not exists public.game_sessions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  game       text not null,
  started_at timestamptz not null default now(),
  used_at    timestamptz,
  score      int,
  extra      jsonb,
  result     text
);
create index if not exists game_sessions_user on public.game_sessions (user_id, started_at desc);
alter table public.game_sessions enable row level security;
revoke all on public.game_sessions from anon, authenticated;

-- inizio partita: il server segna l'ora (non il browser). Max 40 partite al minuto per persona.
create or replace function public.start_game(p_game text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_t timestamptz := now();
begin
  if auth.uid() is null then raise exception 'Accedi con Discord per giocare'; end if;
  if p_game is null or p_game not in ('snake','reaction','clicker','flappy','tetris','dino','quiz','2048','breakout','typing','mines','wordle','stack','suika','hol') then
    raise exception 'Gioco non valido';
  end if;
  if (select count(*) from public.game_sessions where user_id = auth.uid() and started_at > now() - interval '1 minute') >= 40 then
    raise exception 'Troppe partite in poco tempo: riprova tra un minuto';
  end if;
  delete from public.game_sessions where user_id = auth.uid() and started_at < now() - interval '7 days';
  insert into public.game_sessions (user_id, game, started_at) values (auth.uid(), p_game, v_t) returning id into v_id;
  return jsonb_build_object('id', v_id, 't', v_t);
end $$;
revoke all on function public.start_game(text) from public, anon;
grant execute on function public.start_game(text) to authenticated;

-- fine partita: controlla che la partita sia tua, non ancora usata, non scaduta e che il punteggio
-- sia possibile nel tempo passato davvero (misurato dal server). Se va bene salva il punteggio.
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
      n := nullif(x->>'chars', '')::numeric;                                              -- lettere giuste scritte in 60 secondi
      if n is null or el + 2 < 60 or n / 5.0 > 200 or sc > ceil(n / 5.0) + 1 then err := 'tempo'; end if;
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

-- 1c) basta salvataggi diretti dal browser: si passa solo da submit_score
drop policy if exists "scores_insert_own" on public.scores;
revoke insert, update, delete, truncate on public.scores from anon, authenticated;

-- 2) RUOLI SPECIALI DEL SITO ------------------------------------------------
-- label = scritta del badge sul profilo; can_moderate = può cancellare qualsiasi commento.
create table if not exists public.site_roles (
  discord_id   text primary key check (discord_id ~ '^[0-9]{5,25}$'),
  label        text not null check (char_length(label) between 1 and 30),
  color        text check (color is null or color ~ '^#[0-9a-fA-F]{6}$'),
  can_moderate boolean not null default false
);
alter table public.site_roles enable row level security;
drop policy if exists "site_roles_select_all" on public.site_roles;
create policy "site_roles_select_all" on public.site_roles for select using (true);
revoke all on public.site_roles from anon, authenticated;
grant select on public.site_roles to anon, authenticated;
insert into public.site_roles (discord_id, label, color, can_moderate)
values ('760448374196404236', 'Gestore sito', '#22d3ee', true)            -- Jonathan
on conflict (discord_id) do nothing;

create or replace function public.my_discord() returns text
language sql stable security definer set search_path = public, auth as $$
  select coalesce(
    (select coalesce(i.identity_data->>'sub', i.provider_id) from auth.identities i where i.user_id = auth.uid() and i.provider = 'discord' limit 1),
    (select coalesce(u.raw_user_meta_data->>'provider_id', u.raw_user_meta_data->>'sub') from auth.users u where u.id = auth.uid()));
$$;
revoke all on function public.my_discord() from public, anon;
grant execute on function public.my_discord() to authenticated;

create or replace function public.can_moderate() returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and exists (select 1 from public.site_roles r where r.discord_id = public.my_discord() and r.can_moderate);
$$;
grant execute on function public.can_moderate() to anon, authenticated;

-- 3) COMMENTI SUL PROFILO ---------------------------------------------------
alter table public.site_profiles add column if not exists comments_off boolean not null default false;

create table if not exists public.profile_comments (
  id             bigint generated always as identity primary key,
  target_discord text not null check (target_discord ~ '^[0-9]{5,25}$'),
  author_id      uuid not null default auth.uid() references auth.users(id) on delete cascade,
  author_discord text,
  body           text not null check (char_length(body) between 1 and 300),
  created_at     timestamptz not null default now()
);
create index if not exists profile_comments_target on public.profile_comments (target_discord, created_at desc);
create index if not exists profile_comments_author on public.profile_comments (author_id, created_at desc);

-- autore e data li decide il server; max 3 commenti al minuto e 30 al giorno per persona
create or replace function public.profile_comments_fill() returns trigger
language plpgsql security definer set search_path = public, auth as $$
begin
  new.author_id := auth.uid();
  new.author_discord := public.my_discord();
  new.created_at := now();
  new.body := btrim(regexp_replace(new.body, '\s+', ' ', 'g'));
  if exists (select 1 from public.site_profiles p where p.discord_id = new.target_discord and p.comments_off) then
    raise exception 'I commenti su questo profilo sono disattivati';
  end if;
  if (select count(*) from public.profile_comments where author_id = auth.uid() and created_at > now() - interval '1 minute') >= 3 then
    raise exception 'Troppi commenti, riprova tra un minuto';
  end if;
  if (select count(*) from public.profile_comments where author_id = auth.uid() and created_at > now() - interval '1 day') >= 30 then
    raise exception 'Hai raggiunto il limite di commenti di oggi';
  end if;
  return new;
end $$;
drop trigger if exists profile_comments_fill on public.profile_comments;
create trigger profile_comments_fill before insert on public.profile_comments
  for each row execute function public.profile_comments_fill();

alter table public.profile_comments enable row level security;
drop policy if exists "comments_select_all" on public.profile_comments;
create policy "comments_select_all" on public.profile_comments for select using (true);
drop policy if exists "comments_insert_own" on public.profile_comments;
create policy "comments_insert_own" on public.profile_comments for insert to authenticated
  with check (author_id = auth.uid() and not exists (
    select 1 from public.site_profiles p where p.discord_id = target_discord and p.comments_off));
-- cancella: chi l'ha scritto, il proprietario del profilo, oppure chi ha un ruolo del sito che può moderare
drop policy if exists "comments_delete" on public.profile_comments;
create policy "comments_delete" on public.profile_comments for delete to authenticated
  using (author_id = auth.uid() or target_discord = public.my_discord() or public.can_moderate());
revoke all on public.profile_comments from anon, authenticated;
grant select on public.profile_comments to anon, authenticated;
grant insert, delete on public.profile_comments to authenticated;

commit;
-- Fatto! Deve comparire "Success. No rows returned".
