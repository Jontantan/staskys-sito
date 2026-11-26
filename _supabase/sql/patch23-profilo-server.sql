-- Patch 2.3 — profilo del SERVER Staskys sul sito
-- Aggiunge a site_profiles la colonna "dc": quando uno accede con Discord, il sito salva qui i CODICI
-- del suo avatar, banner e nickname NEL SERVER Staskys (mai indirizzi liberi: il sito ricostruisce i link
-- solo verso cdn.discordapp.com). Così tutti vedono la stessa foto, anche prima del prossimo aggiornamento del bot.
-- Le regole esistenti valgono già: tutti leggono, ognuno modifica solo il proprio profilo.
-- Si può eseguire più volte senza problemi.

alter table public.site_profiles
  add column if not exists dc jsonb check (dc is null or pg_column_size(dc) < 1000);
