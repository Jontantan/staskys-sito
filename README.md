# Sito Staskys

Sito statico del server Discord Staskys (staskys.it).

- I file del sito (`index.html`, `style.css`, `app.js`, ecc.) stanno nella radice del repository.
- `scripts/sync.py` legge i dati dal server Discord e aggiorna `data.js` e i file `.json`.
- La GitHub Action in `.github/workflows/sync.yml` lo esegue ogni 10 minuti (o a mano dalla scheda **Actions**).
- Serve il secret `STASKYS_BOT_TOKEN` (Settings > Secrets and variables > Actions). Il token non va **mai** scritto nei file.

Istruzioni passo passo: vedi `GUIDA.md`.
