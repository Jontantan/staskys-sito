# Update 3 · aggiornare la funzione `super-endpoint` (5 minuti)

Finché non lo fai, sul sito queste parti mostrano **"In arrivo tra poco ⏳"**:
import da Letterboxd, IMDb, Trakt e MyGameList, e le copertine consigliate di film, serie e giochi.
Appena premi **Deploy** si accendono **da sole** (il sito controlla ogni 5 minuti, non serve pubblicare niente).

## 1) Aggiorna il codice
1. Apri il codice nuovo: https://raw.githubusercontent.com/Jontantan/staskys-sito/main/_supabase/functions/catalog-search/index.ts
2. Premi **Ctrl+A** e **Ctrl+C**.
3. Vai su Supabase → **Edge Functions** → **super-endpoint** → scheda **Code**:
   https://supabase.com/dashboard/project/otxtpwojvuyxksrsfpdl/functions
4. Nel riquadro del codice premi **Ctrl+A**, poi **Ctrl+V** (sostituisci tutto).
5. Premi **Deploy** (in basso a destra) e aspetta la spunta verde.

Per controllare: apri https://otxtpwojvuyxksrsfpdl.supabase.co/functions/v1/super-endpoint?type=ping
deve comparire una riga che inizia con `{"v":3`.

## 2) (Facoltativo) Trakt
Serve solo per importare da Trakt.
1. Vai su https://trakt.tv/oauth/applications/new (accedi con un account Trakt).
2. Name: `Staskys` · Redirect uri: `urn:ietf:wg:oauth:2.0:oob` · il resto lascialo vuoto → **Save App**.
3. Copia il **Client ID** (NON il Client Secret).
4. Supabase → **Edge Functions** → **Secrets** → **Add new secret**: nome `TRAKT_CLIENT_ID`, valore = il Client ID → **Save**.

## 3) (Facoltativo) MyAnimeList con il nome utente
Senza questo l'import MyAnimeList funziona già caricando il file di export. Con questo si può anche scrivere solo il nome utente.
1. Vai su https://myanimelist.net/apiconfig → **Create ID**.
2. App Name `Staskys`, App Type **web**, App Redirect URL `https://staskys.it`, Homepage `https://staskys.it`, il resto a piacere → **Submit**.
3. Copia il **Client ID**.
4. Supabase → **Edge Functions** → **Secrets** → nome `MAL_CLIENT_ID`, valore = il Client ID → **Save**.
