-- Staskys · UPDATE 3 · tutto il database in un solo file
-- Da incollare UNA volta in Supabase > SQL Editor > New query > Run.
-- Si può rieseguire senza problemi (non cancella voti, profili o punti).
--  1) categorie Manga e Libri nel catalogo (+ pagine/capitoli fino a 50.000)
--  2) Top 10 funzionante per Serie, Manga e Libri
--  3) copertine personalizzate sul profilo (colonna "covers")
--  4) staff che può rimuovere copertine inappropriate (tabella site_staff)
--  5) spazio "covers" per le immagini caricate dal PC (max 2 MB, solo immagini)

-- 1) categorie
alter table public.media_ratings drop constraint if exists media_ratings_kind_check;
alter table public.media_ratings add constraint media_ratings_kind_check
  check (kind in ('anime','game','movie','tv','manga','book'));
alter table public.media_ratings drop constraint if exists media_ratings_episodes_check;
alter table public.media_ratings add constraint media_ratings_episodes_check
  check (episodes is null or episodes between 0 and 50000);
alter table public.media_ratings drop constraint if exists media_ratings_total_episodes_check;
alter table public.media_ratings add constraint media_ratings_total_episodes_check
  check (total_episodes is null or total_episodes between 0 and 50000);

-- 2) Top 10 per tutte le categorie
create or replace function public.set_top10(p_kind text, p_ids text[])
returns void language plpgsql security invoker set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Devi fare il login'; end if;
  if p_kind not in ('anime','game','movie','tv','manga','book') then raise exception 'Categoria non valida'; end if;
  if coalesce(array_length(p_ids, 1), 0) > 10 then raise exception 'Massimo 10 titoli'; end if;
  update public.media_ratings set top_pos = null
    where user_id = auth.uid() and kind = p_kind and top_pos is not null;
  update public.media_ratings m set top_pos = array_position(p_ids, m.media_id)
    where m.user_id = auth.uid() and m.kind = p_kind and m.media_id = any(p_ids);
end $$;
revoke all on function public.set_top10(text, text[]) from public, anon;
grant execute on function public.set_top10(text, text[]) to authenticated;

-- 3) copertine personalizzate: { "anime:al123": "https://...", ... } (le vedono tutti sul profilo)
alter table public.site_profiles
  add column if not exists covers jsonb not null default '{}'::jsonb;
alter table public.site_profiles drop constraint if exists site_profiles_covers_check;
alter table public.site_profiles add constraint site_profiles_covers_check
  check (jsonb_typeof(covers) = 'object' and pg_column_size(covers) < 30000);

-- 4) staff: chi può rimuovere le copertine caricate da altri
create table if not exists public.site_staff (
  discord_id text primary key,
  note       text,
  added_at   timestamptz not null default now()
);
alter table public.site_staff enable row level security;
drop policy if exists "leggi staff" on public.site_staff;
create policy "leggi staff" on public.site_staff for select using (true);
grant select on public.site_staff to anon, authenticated;
-- ⬇️ METTI QUI IL TUO ID DISCORD (Discord > Impostazioni > Avanzate > Modalità sviluppatore,
--    poi tasto destro sul tuo nome > "Copia ID utente"). Puoi aggiungere altre righe per altri staff.
insert into public.site_staff (discord_id, note) values ('IL_TUO_ID_DISCORD', 'Jonathan')
  on conflict (discord_id) do nothing;
delete from public.site_staff where discord_id = 'IL_TUO_ID_DISCORD'; -- toglie la riga d'esempio se non l'hai cambiata

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.site_staff s join auth.users u
      on s.discord_id = coalesce(u.raw_user_meta_data->>'provider_id', u.raw_user_meta_data->>'sub')
    where u.id = auth.uid());
$$;
grant execute on function public.is_staff() to anon, authenticated;

-- il proprietario di un profilo non cambia mai quando lo staff toglie una copertina
create or replace function public.site_profiles_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and old.user_id is distinct from auth.uid() then
    new.user_id := old.user_id; new.discord_id := old.discord_id; new.updated_at := now();
    return new;
  end if;
  new.user_id := auth.uid();
  select coalesce(u.raw_user_meta_data->>'provider_id', u.raw_user_meta_data->>'sub')
    into new.discord_id from auth.users u where u.id = auth.uid();
  new.updated_at := now();
  return new;
end $$;

-- lo staff toglie una copertina dal profilo di un membro (p_key = "anime:al123")
create or replace function public.staff_clear_cover(p_discord text, p_key text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then raise exception 'Solo lo staff'; end if;
  update public.site_profiles set covers = covers - p_key where discord_id = p_discord;
end $$;
revoke all on function public.staff_clear_cover(text, text) from public, anon;
grant execute on function public.staff_clear_cover(text, text) to authenticated;

-- 5) spazio immagini "covers": pubblico in lettura, max 2 MB, solo jpg/png/webp/gif
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('covers', 'covers', true, 2097152, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = true, file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg','image/png','image/webp','image/gif'];

-- ognuno carica/sostituisce solo nella sua cartella (covers/<suo id>/...); lo staff può cancellare tutto
drop policy if exists "covers carica nella tua cartella" on storage.objects;
create policy "covers carica nella tua cartella" on storage.objects for insert to authenticated
  with check (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "covers aggiorna i tuoi" on storage.objects;
create policy "covers aggiorna i tuoi" on storage.objects for update to authenticated
  using (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'covers' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "covers cancella i tuoi o staff" on storage.objects;
create policy "covers cancella i tuoi o staff" on storage.objects for delete to authenticated
  using (bucket_id = 'covers' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff()));
drop policy if exists "covers leggi i tuoi" on storage.objects;
create policy "covers leggi i tuoi" on storage.objects for select to authenticated
  using (bucket_id = 'covers' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff()));

-- Fatto! Deve comparire "Success. No rows returned".
