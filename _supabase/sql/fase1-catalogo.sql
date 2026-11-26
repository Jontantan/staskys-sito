-- Staskys · Fase 1 · Catalogo e profili
-- Da incollare UNA volta in Supabase > SQL Editor > New query > Run.
-- Crea la tabella dei voti (anime / giochi / film). Non tocca le tabelle dei giochi.

create table if not exists public.media_ratings (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  discord_id  text,
  username    text,
  avatar_url  text,
  kind        text not null check (kind in ('anime','game','movie')),
  media_id    text not null check (char_length(media_id) <= 40),
  title       text not null check (char_length(title) <= 300),
  cover       text check (cover is null or cover ~ '^https://'),
  year        int,
  rating      smallint check (rating between 1 and 10),
  status      text check (status in ('visto','in_corso','voglio')),
  updated_at  timestamptz not null default now(),
  unique (user_id, kind, media_id),
  check (rating is not null or status is not null)
);
create index if not exists media_ratings_discord_idx on public.media_ratings (discord_id);
create index if not exists media_ratings_media_idx   on public.media_ratings (kind, media_id);

-- L'ID Discord lo mette il database (dall'account con cui hai fatto login), non il sito: così nessuno può fingersi un altro.
create or replace function public.media_ratings_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.user_id := auth.uid();
  select coalesce(u.raw_user_meta_data->>'provider_id', u.raw_user_meta_data->>'sub')
    into new.discord_id from auth.users u where u.id = auth.uid();
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists media_ratings_owner on public.media_ratings;
create trigger media_ratings_owner before insert or update on public.media_ratings
  for each row execute function public.media_ratings_owner();

-- Permessi: tutti possono LEGGERE (i profili sono pubblici), ognuno MODIFICA solo i propri voti.
alter table public.media_ratings enable row level security;
drop policy if exists "leggi tutti" on public.media_ratings;
create policy "leggi tutti" on public.media_ratings for select using (true);
drop policy if exists "inserisci i tuoi" on public.media_ratings;
create policy "inserisci i tuoi" on public.media_ratings for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "modifica i tuoi" on public.media_ratings;
create policy "modifica i tuoi" on public.media_ratings for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "cancella i tuoi" on public.media_ratings;
create policy "cancella i tuoi" on public.media_ratings for delete to authenticated using (user_id = auth.uid());
grant select on public.media_ratings to anon, authenticated;
grant insert, update, delete on public.media_ratings to authenticated;

-- Media voti per titolo (servirà per la classifica generale nella fase 2).
create or replace view public.media_avg with (security_invoker = true) as
  select kind, media_id, max(title) as title, max(cover) as cover, max(year) as year,
         round(avg(rating)::numeric, 1) as avg_rating, count(rating) as votes
  from public.media_ratings where rating is not null group by kind, media_id;
grant select on public.media_avg to anon, authenticated;
