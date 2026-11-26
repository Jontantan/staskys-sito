-- Staskys · Fase 3 · parte 2: STASKYS AWARDS 2026
-- Da incollare UNA volta in Supabase > SQL Editor > New query > Run (dopo fase3-catalogo-profili.sql).
--
-- COME CAMBIARE FASE (lo fa solo Jonathan, da Supabase > Table Editor > award_settings):
--   phase = 'presto'      → pagina di anteprima, niente voti
--   phase = 'nomination'  → ognuno sceglie i suoi preferiti per ogni premio
--   phase = 'finale'      → per ogni premio si vota tra i 5 più nominati
--   phase = 'risultati'   → si vedono i vincitori
-- Le date (nom_start, ecc.) sono solo da mostrare sul sito.

create table if not exists public.award_settings (
  id          int primary key default 1 check (id = 1),
  year        int not null default 2026,
  phase       text not null default 'presto' check (phase in ('presto','nomination','finale','risultati')),
  nom_start   timestamptz, nom_end timestamptz,
  final_start timestamptz, final_end timestamptz,
  ceremony    timestamptz
);
insert into public.award_settings (id) values (1) on conflict (id) do nothing;
alter table public.award_settings enable row level security;
drop policy if exists "leggi tutti" on public.award_settings;
create policy "leggi tutti" on public.award_settings for select using (true);
grant select on public.award_settings to anon, authenticated;   -- nessuno la può modificare dal sito

create table if not exists public.award_votes (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  discord_id  text,
  round       text not null check (round in ('nom','final')),
  award_id    text not null check (char_length(award_id) <= 40),
  choice_key  text not null check (char_length(choice_key) <= 200),
  title       text not null check (char_length(title) <= 300),
  detail      text check (detail is null or char_length(detail) <= 120),
  cover       text check (cover is null or cover ~ '^https://'),
  updated_at  timestamptz not null default now(),
  unique (user_id, round, award_id)
);

create or replace function public.award_votes_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.user_id := auth.uid();
  select coalesce(u.raw_user_meta_data->>'provider_id', u.raw_user_meta_data->>'sub')
    into new.discord_id from auth.users u where u.id = auth.uid();
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists award_votes_owner on public.award_votes;
create trigger award_votes_owner before insert or update on public.award_votes
  for each row execute function public.award_votes_owner();

-- i 5 finalisti per premio (visibili solo da quando parte la finale)
create or replace function public.award_finalists()
returns table (award_id text, choice_key text, title text, detail text, cover text, noms bigint)
language sql stable security definer set search_path = public as $$
  select award_id, choice_key, title, detail, cover, noms from (
    select v.award_id, v.choice_key, max(v.title) as title, max(v.detail) as detail, max(v.cover) as cover, count(*) as noms,
           row_number() over (partition by v.award_id order by count(*) desc, max(v.title)) as rn
    from public.award_votes v where v.round = 'nom' group by v.award_id, v.choice_key) t
  where rn <= 5 and exists (select 1 from public.award_settings s where s.id = 1 and s.phase in ('finale','risultati'))
$$;
-- i risultati finali (visibili solo nella fase risultati)
create or replace function public.award_results()
returns table (award_id text, choice_key text, title text, detail text, cover text, votes bigint)
language sql stable security definer set search_path = public as $$
  select v.award_id, v.choice_key, max(v.title), max(v.detail), max(v.cover), count(*)
  from public.award_votes v where v.round = 'final'
    and exists (select 1 from public.award_settings s where s.id = 1 and s.phase = 'risultati')
  group by v.award_id, v.choice_key
$$;
grant execute on function public.award_finalists() to anon, authenticated;
grant execute on function public.award_results() to anon, authenticated;

-- voti SEGRETI: ognuno vede solo i propri; si vota solo nella fase giusta
alter table public.award_votes enable row level security;
drop policy if exists "vedi i tuoi" on public.award_votes;
create policy "vedi i tuoi" on public.award_votes for select to authenticated using (user_id = auth.uid());
drop policy if exists "vota nella fase giusta" on public.award_votes;
create policy "vota nella fase giusta" on public.award_votes for insert to authenticated with check (
  user_id = auth.uid() and exists (select 1 from public.award_settings s where s.id = 1 and
    ((round = 'nom' and s.phase = 'nomination') or (round = 'final' and s.phase = 'finale'))) and
  (round = 'nom' or choice_key in (select f.choice_key from public.award_finalists() f where f.award_id = award_votes.award_id)));
drop policy if exists "cambia nella fase giusta" on public.award_votes;
create policy "cambia nella fase giusta" on public.award_votes for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid() and exists (select 1 from public.award_settings s where s.id = 1 and
    ((round = 'nom' and s.phase = 'nomination') or (round = 'final' and s.phase = 'finale'))) and
  (round = 'nom' or choice_key in (select f.choice_key from public.award_finalists() f where f.award_id = award_votes.award_id)));
drop policy if exists "togli nella fase giusta" on public.award_votes;
create policy "togli nella fase giusta" on public.award_votes for delete to authenticated using (
  user_id = auth.uid() and exists (select 1 from public.award_settings s where s.id = 1 and
    ((round = 'nom' and s.phase = 'nomination') or (round = 'final' and s.phase = 'finale'))));
grant select, insert, update, delete on public.award_votes to authenticated;

