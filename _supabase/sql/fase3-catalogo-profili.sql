-- Staskys · Fase 3 · parte 1: voti decimali, "Droppato", episodi, categoria Serie, profili personalizzati
-- Da incollare UNA volta in Supabase > SQL Editor > New query > Run (dopo fase1 e fase2).
-- I voti interi che ci sono già restano validi (8 diventa 8.0).

-- 1) la vista delle medie dipende dalla colonna del voto: la togliamo e la rifacciamo dopo
drop view if exists public.media_avg;

-- 2) voti con un decimale da 0 a 10 (es. 8.7)
alter table public.media_ratings drop constraint if exists media_ratings_rating_check;
alter table public.media_ratings alter column rating type numeric(3,1) using rating::numeric(3,1);
alter table public.media_ratings add constraint media_ratings_rating_check check (rating >= 0 and rating <= 10);

-- 3) nuovo stato "droppato"
alter table public.media_ratings drop constraint if exists media_ratings_status_check;
alter table public.media_ratings add constraint media_ratings_status_check check (status in ('visto','in_corso','droppato','voglio'));

-- 4) nuova categoria "tv" (Serie)
alter table public.media_ratings drop constraint if exists media_ratings_kind_check;
alter table public.media_ratings add constraint media_ratings_kind_check check (kind in ('anime','game','movie','tv'));

-- 5) episodi visti e totale episodi
alter table public.media_ratings add column if not exists episodes int check (episodes is null or episodes between 0 and 5000);
alter table public.media_ratings add column if not exists total_episodes int check (total_episodes is null or total_episodes between 0 and 5000);

-- 6) la vista delle medie, ora con i decimali
create or replace view public.media_avg with (security_invoker = true) as
  select kind, media_id, max(title) as title, max(cover) as cover, max(year) as year,
         round(avg(rating)::numeric, 1) as avg_rating, count(rating) as votes
  from public.media_ratings where rating is not null group by kind, media_id;
grant select on public.media_avg to anon, authenticated;

-- 7) profilo del sito: bio, stile del passaporto e decorazioni indossate
create table if not exists public.site_profiles (
  user_id     uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  discord_id  text,
  bio         text check (bio is null or char_length(bio) <= 160),
  theme       jsonb not null default '{}'::jsonb check (pg_column_size(theme) < 4000),
  equipped    jsonb not null default '{}'::jsonb check (pg_column_size(equipped) < 2000),
  updated_at  timestamptz not null default now()
);
create index if not exists site_profiles_discord_idx on public.site_profiles (discord_id);

create or replace function public.site_profiles_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.user_id := auth.uid();
  select coalesce(u.raw_user_meta_data->>'provider_id', u.raw_user_meta_data->>'sub')
    into new.discord_id from auth.users u where u.id = auth.uid();
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists site_profiles_owner on public.site_profiles;
create trigger site_profiles_owner before insert or update on public.site_profiles
  for each row execute function public.site_profiles_owner();

alter table public.site_profiles enable row level security;
drop policy if exists "leggi tutti" on public.site_profiles;
create policy "leggi tutti" on public.site_profiles for select using (true);
drop policy if exists "inserisci il tuo" on public.site_profiles;
create policy "inserisci il tuo" on public.site_profiles for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "modifica il tuo" on public.site_profiles;
create policy "modifica il tuo" on public.site_profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select on public.site_profiles to anon, authenticated;
grant insert, update on public.site_profiles to authenticated;

-- 8) cambiare gli episodi visti conta come attività (per "sta guardando")
create or replace function public.media_ratings_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.user_id := auth.uid();
  select coalesce(u.raw_user_meta_data->>'provider_id', u.raw_user_meta_data->>'sub')
    into new.discord_id from auth.users u where u.id = auth.uid();
  if tg_op = 'UPDATE' and new.rating is not distinct from old.rating and new.status is not distinct from old.status
     and new.episodes is not distinct from old.episodes then
    new.updated_at := old.updated_at;
  else
    new.updated_at := now();
  end if;
  return new;
end $$;
