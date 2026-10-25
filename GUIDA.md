# Guida: mettere il sito Staskys su GitHub

Tranquillo: niente di quello che fai qui può rompere il server Discord o il dominio. Se sbagli qualcosa, si può sempre correggere o cancellare il repository e ricominciare.

## Cosa ti serve
- Il file `staskys-github.zip`
- Il tuo account GitHub (**Jontantan**), già con accesso fatto su github.com

---

## Passo 1 – Crea il repository
1. Vai su **https://github.com** e accedi.
2. In alto a destra clicca il **+** e poi **New repository**.
3. In **Repository name** scrivi: `staskys-sito`
4. Scegli **Public** o **Private**. Vanno bene tutti e due: le GitHub Actions (l'aggiornamento automatico) sono gratis in entrambi i casi. Se non sai cosa scegliere, scegli **Public**.
5. **Non** spuntare "Add a README file" (lo abbiamo già).
6. Clicca il bottone verde **Create repository**.

## Passo 2 – Estrai lo zip (Windows)
1. Trova `staskys-github.zip` (di solito nella cartella **Download**).
2. Tasto destro sul file → **Estrai tutto...** → **Estrai**.
3. Si apre una cartella `staskys-github`. Entraci dentro: devi vedere `index.html`, `style.css`, la cartella `assets`, la cartella `scripts` ecc.
4. **Importante:** c'è anche una cartella che si chiama `.github`. Windows a volte la nasconde: in Esplora file vai su **Visualizza** → **Mostra** → spunta **Elementi nascosti**.

## Passo 3 – Carica i file
1. Nella pagina del repository appena creato, clicca il link **uploading an existing file**
   (oppure, se non lo vedi, **Add file** → **Upload files**).
2. Nella cartella `staskys-github`, seleziona **TUTTO** il contenuto (premi `Ctrl + A`), compresa la cartella `.github`.
   ⚠️ Trascina il *contenuto* della cartella, non la cartella `staskys-github` stessa. `index.html` deve finire nella pagina principale del repository.
3. Trascina tutto nel riquadro della pagina GitHub e aspetta che finisca il caricamento.
4. In basso clicca il bottone verde **Commit changes**.
5. Controlla: nella pagina del repository devi vedere `index.html` e le cartelle `.github`, `assets`, `scripts`.

### Se la cartella `.github` non compare
Succede a volte: GitHub o il browser saltano le cartelle che iniziano con il punto. Si risolve così:
1. Nel repository clicca **Add file** → **Create new file**.
2. Nel campo del nome scrivi esattamente: `.github/workflows/sync.yml`
   (quando scrivi le `/` GitHub crea da solo le cartelle, è normale).
3. Sul tuo PC apri il file `.github\workflows\sync.yml` con il **Blocco note** (tasto destro → Apri con → Blocco note), premi `Ctrl + A`, `Ctrl + C`.
4. Torna su GitHub, clicca nel riquadro grande e premi `Ctrl + V`.
5. Clicca **Commit changes...** e poi di nuovo **Commit changes**.

## Passo 4 – Aggiungi al3xy come collaboratore (se serve)
Serve se al3xy deve inserire lui il token o collegare il repository all'hosting.
1. Nel repository clicca **Settings** (in alto, icona ingranaggio).
2. A sinistra clicca **Collaborators** (potrebbe chiederti la password o un codice).
3. Clicca **Add people**, scrivi `al3xy`, selezionalo e conferma.
4. al3xy riceverà un invito da accettare.

## Passo 5 – Il token del bot (lo fa al3xy)
Il token è come una password del bot Staskys: **non va mai scritto nei file né mandato in chat pubblica**. Lo inserisce al3xy, che ce l'ha:
1. **Settings** → a sinistra **Secrets and variables** → **Actions**.
2. Bottone verde **New repository secret**.
3. **Name:** `STASKYS_BOT_TOKEN`
4. **Secret:** incollare il token del bot.
5. **Add secret**.

## Passo 6 – Permetti all'aggiornamento di salvare i dati
1. **Settings** → a sinistra **Actions** → **General**.
2. Scorri fino a **Workflow permissions**.
3. Scegli **Read and write permissions**.
4. Clicca **Save**.

## Passo 7 – Prova l'aggiornamento una volta
(Dopo che al3xy ha messo il token.)
1. Clicca la scheda **Actions** in alto.
2. Se compare un bottone tipo "I understand my workflows, go ahead and enable them", cliccalo.
3. A sinistra clicca **Aggiorna dati Discord**.
4. A destra clicca **Run workflow** → di nuovo **Run workflow** (verde).
5. Aspetta 1 minuto e ricarica. Pallino **verde** ✅ = tutto ok. Da qui in poi si aggiorna da solo ogni 10 minuti circa.
6. Pallino **rosso** ❌ = cliccaci sopra e manda uno screenshot a al3xy (di solito è il token mancante o sbagliato).

## Passo 8 – Collegare il dominio
Lo fa al3xy dal pannello dell'hosting di staskys.it: deve collegare il repository `Jontantan/staskys-sito`, con il sito nella **radice** del repository (nessuna sottocartella).

Fatto! 🎉
