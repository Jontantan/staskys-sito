-- Staskys · FIX update 5 (scacchi, amichevoli)
-- 1) Testa o croce per scegliere il minigioco bloccava la partita: errore "column reference winner is ambiguous".
-- 2) Dopo quella moneta i risultati dello spareggio non venivano salvati (mancava lo spazio "res").
-- Sicuro da rilanciare: sostituisce solo due funzioni, non tocca i dati. Le partite bloccate ripartono da sole.
begin;
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
revoke all on function public.chess_tiebreak_submit(uuid, uuid) from public, anon;
grant execute on function public.chess_tiebreak_submit(uuid, uuid) to authenticated;
commit;
