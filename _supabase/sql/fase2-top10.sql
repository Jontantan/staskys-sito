-- Staskys · Fase 2 · Top 10 ordinabile
-- Da incollare UNA volta in Supabase > SQL Editor > New query > Run (dopo fase1-catalogo.sql).
-- Aggiunge la posizione in Top 10 (1–10) ai voti e una funzione per salvare l'ordine in un colpo solo.

alter table public.media_ratings
  add column if not exists top_pos smallint check (top_pos between 1 and 10);
create index if not exists media_ratings_top_idx on public.media_ratings (user_id, kind, top_pos) where top_pos is not null;

-- Salva la Top 10 di UNA categoria: p_ids = media_id in ordine (max 10).
-- "security invoker": gira con i permessi di chi la chiama, quindi le regole RLS
-- della fase 1 valgono anche qui (ognuno può toccare solo i propri voti).
create or replace function public.set_top10(p_kind text, p_ids text[])
returns void language plpgsql security invoker set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Devi fare il login'; end if;
  if p_kind not in ('anime','game','movie') then raise exception 'Categoria non valida'; end if;
  if coalesce(array_length(p_ids, 1), 0) > 10 then raise exception 'Massimo 10 titoli'; end if;
  update public.media_ratings set top_pos = null
    where user_id = auth.uid() and kind = p_kind and top_pos is not null;
  update public.media_ratings m set top_pos = array_position(p_ids, m.media_id)
    where m.user_id = auth.uid() and m.kind = p_kind and m.media_id = any(p_ids);
end $$;
revoke all on function public.set_top10(text, text[]) from public, anon;
grant execute on function public.set_top10(text, text[]) to authenticated;

-- Riordinare la Top 10 non deve cambiare la data dell'ultimo voto (serve per "sta guardando").
create or replace function public.media_ratings_owner() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.user_id := auth.uid();
  select coalesce(u.raw_user_meta_data->>'provider_id', u.raw_user_meta_data->>'sub')
    into new.discord_id from auth.users u where u.id = auth.uid();
  if tg_op = 'UPDATE' and new.rating is not distinct from old.rating and new.status is not distinct from old.status then
    new.updated_at := old.updated_at;
  else
    new.updated_at := now();
  end if;
  return new;
end $$;
