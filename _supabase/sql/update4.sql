-- Staskys · UPDATE 4 · tutto il database in un solo file
-- Da incollare in Supabase > SQL Editor > New query > Run.
-- PARTE A (sotto) è SICURA: non cancella niente e si può rieseguire quante volte vuoi.
--  1) data del PRIMO ACCESSO di ognuno (salvata una volta sola, mai sovrascritta) + recupero per chi è già iscritto
--  2) LIKE ai passaporti (uno per persona per passaporto, si può togliere)
--  3) colonna "meta" del profilo (obiettivo/quest di Personalizza e "ho importato la mia lista")
--  4) statistiche per badge e decorazioni: streak migliore di sempre e partite notturne
--  5) Riflessi (Tempo di reazione): sotto i 125 ms non si salva più (anticipo)
--  6) classifiche dei minigiochi azzerabili SENZA cancellare punteggi (tabella game_resets)
-- PARTE B (in fondo, tutta commentata con --) è l'AZZERAMENTO della classifica di Riflessi: si esegue a parte, solo dopo conferma.
-- Wordle e Clicker veloce: NON serve SQL. I punti della classifica li calcola il sito e da update 4 non li conta più
-- (i punteggi restano salvati e i due giochi hanno ancora la loro classifica).

begin;

-- 1) PRIMO ACCESSO ---------------------------------------------------------
create table if not exists public.site_first_seen (
  discord_id text primary key check (discord_id ~ '^[0-9]{5,25}$'),
  user_id    uuid references auth.users(id) on delete set null,
  first_at   timestamptz not null default now()
);
alter table public.site_first_seen enable row level security;
drop policy if exists "first_seen_select_all" on public.site_first_seen;
create policy "first_seen_select_all" on public.site_first_seen for select using (true);
revoke all on public.site_first_seen from anon, authenticated;
grant select on public.site_first_seen to anon, authenticated;

-- chiamata dal sito dopo il login: salva la data SOLO se non c'è già (on conflict do nothing = mai sovrascritta)
create or replace function public.touch_first_seen() returns timestamptz
language plpgsql security definer set search_path = public, auth as $$
declare d text; t timestamptz;
begin
  if auth.uid() is null then return null; end if;
  select coalesce(i.identity_data->>'sub', i.provider_id) into d
    from auth.identities i where i.user_id = auth.uid() and i.provider = 'discord' limit 1;
  if d is null or d !~ '^[0-9]{5,25}$' then return null; end if;
  insert into public.site_first_seen (discord_id, user_id, first_at)
    values (d, auth.uid(), coalesce((select u.created_at from auth.users u where u.id = auth.uid()), now()))
    on conflict (discord_id) do nothing;
  select first_at into t from public.site_first_seen where discord_id = d;
  return t;
end $$;
revoke all on function public.touch_first_seen() from public, anon;
grant execute on function public.touch_first_seen() to authenticated;

-- recupero per chi c'era già: la data più vecchia tra account, punteggi, voti e profilo (chi ha già una data la tiene)
insert into public.site_first_seen (discord_id, user_id, first_at)
select d, (array_agg(uid order by t))[1], min(t) from (
  select coalesce(i.identity_data->>'sub', i.provider_id) as d, u.id as uid, u.created_at as t
    from auth.users u join auth.identities i on i.user_id = u.id and i.provider = 'discord'
  union all select s.discord_id, s.user_id, s.created_at from public.scores s where s.discord_id is not null
  union all select m.discord_id::text, m.user_id, m.updated_at from public.media_ratings m where m.discord_id is not null
  union all select p.discord_id::text, p.user_id, p.updated_at from public.site_profiles p where p.discord_id is not null
) x
where d ~ '^[0-9]{5,25}$' and t is not null
group by d
on conflict (discord_id) do nothing;

-- 2) LIKE AI PASSAPORTI ----------------------------------------------------
create table if not exists public.passport_likes (
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  liker_discord  text,
  target_discord text not null check (target_discord ~ '^[0-9]{5,25}$'),
  created_at     timestamptz not null default now(),
  primary key (user_id, target_discord)
);
create index if not exists passport_likes_target on public.passport_likes (target_discord);

-- chi mette like lo decide il server (non il browser); niente like a se stessi; max 30 like al minuto
create or replace function public.passport_likes_fill() returns trigger
language plpgsql security definer set search_path = public, auth as $$
begin
  new.user_id := auth.uid();
  new.created_at := now();
  select coalesce(i.identity_data->>'sub', i.provider_id) into new.liker_discord
    from auth.identities i where i.user_id = auth.uid() and i.provider = 'discord' limit 1;
  if new.liker_discord is not null and new.liker_discord = new.target_discord then
    raise exception 'Non puoi mettere like al tuo passaporto';
  end if;
  if (select count(*) from public.passport_likes where user_id = auth.uid() and created_at > now() - interval '1 minute') >= 30 then
    raise exception 'Troppi like, riprova tra poco';
  end if;
  return new;
end $$;
drop trigger if exists passport_likes_fill on public.passport_likes;
create trigger passport_likes_fill before insert on public.passport_likes
  for each row execute function public.passport_likes_fill();

alter table public.passport_likes enable row level security;
drop policy if exists "likes_select_all" on public.passport_likes;
create policy "likes_select_all" on public.passport_likes for select using (true);
drop policy if exists "likes_insert_own" on public.passport_likes;
create policy "likes_insert_own" on public.passport_likes for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "likes_delete_own" on public.passport_likes;
create policy "likes_delete_own" on public.passport_likes for delete to authenticated using (user_id = auth.uid());
revoke all on public.passport_likes from anon, authenticated;
grant select on public.passport_likes to anon, authenticated;
grant insert, delete on public.passport_likes to authenticated;

-- 3) META DEL PROFILO (obiettivo di Personalizza, lista importata) ----------
alter table public.site_profiles add column if not exists meta jsonb not null default '{}'::jsonb;
alter table public.site_profiles drop constraint if exists site_profiles_meta_check;
alter table public.site_profiles add constraint site_profiles_meta_check
  check (jsonb_typeof(meta) = 'object' and length(meta::text) < 4000);

-- 4) STATISTICHE PER BADGE E DECORAZIONI ------------------------------------
--    best_streak = la streak più lunga di sempre (la vista "streaks" mostra solo quella in corso)
--    night = ha salvato almeno una partita tra le 2:00 e le 4:59 (ora di Roma) → badge Nottambulo
create or replace view public.player_stats with (security_invoker = true) as
with d as (
  select distinct user_id, (created_at at time zone 'Europe/Rome')::date as day from public.scores
), g as (
  select user_id, day - (row_number() over (partition by user_id order by day))::int as grp from d
), b as (
  select user_id, max(n)::int as best_streak from (select user_id, count(*) as n from g group by user_id, grp) s group by user_id
), n as (
  select user_id, max(discord_id) as discord_id,
         bool_or(extract(hour from created_at at time zone 'Europe/Rome') between 2 and 4) as night
  from public.scores group by user_id
)
select n.user_id, n.discord_id, coalesce(b.best_streak, 0) as best_streak, n.night
from n left join b using (user_id);
grant select on public.player_stats to anon, authenticated;

-- 5) RIFLESSI: sotto i 125 ms è un anticipo, non si salva più ----------------
--    (vincolo nuovo e separato: non tocca gli altri limiti; "not valid" = non controlla i punteggi vecchi)
alter table public.scores drop constraint if exists reaction_min_125;
alter table public.scores add constraint reaction_min_125 check (game <> 'reaction' or score >= 125) not valid;

-- 6) AZZERAMENTO CLASSIFICHE SENZA CANCELLARE -------------------------------
--    Se un gioco è in game_resets, in classifica contano solo le partite giocate DOPO reset_at.
--    I punteggi vecchi restano nel database (e restano valide le streak e le statistiche).
create table if not exists public.game_resets (
  game     text primary key,
  reset_at timestamptz not null default now()
);
alter table public.game_resets enable row level security;
drop policy if exists "game_resets_select_all" on public.game_resets;
create policy "game_resets_select_all" on public.game_resets for select using (true);
revoke all on public.game_resets from anon, authenticated;
grant select on public.game_resets to anon, authenticated;

-- classifica (stesse colonne di prima): miglior punteggio di ognuno, solo dopo l'eventuale azzeramento
create or replace view public.leaderboard with (security_invoker = true) as
select distinct on (s.game, s.user_id)
  s.game, s.user_id, s.username, s.avatar_url, s.score, s.created_at, s.discord_id
from public.scores s
where not exists (select 1 from public.game_resets r where r.game = s.game and s.created_at < r.reset_at)
order by s.game, s.user_id,
  case when s.game in ('reaction','mines','wordle') then s.score else -s.score end,
  s.created_at;
grant select on public.leaderboard to anon, authenticated;

commit;

-- ============================================================================
-- PARTE B · AZZERAMENTO CLASSIFICA DI RIFLESSI (Tempo di reazione)
-- Eseguila SOLO dopo aver confermato. Per eseguirla: seleziona le 2 righe qui sotto,
-- togli i due trattini "--" all'inizio di ognuna e premi Run.
-- Oggi (27/11/2026) ci sono 231 partite di Riflessi di 13 giocatori in classifica.
-- NON cancella niente: la classifica riparte da zero, le partite vecchie restano salvate
-- (così non si perdono streak e statistiche). Per annullare: delete from public.game_resets where game = 'reaction';
-- ============================================================================
-- insert into public.game_resets (game, reset_at) values ('reaction', now())
--   on conflict (game) do update set reset_at = excluded.reset_at;
