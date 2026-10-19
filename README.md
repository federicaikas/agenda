# Agenda

Agenda personale con calendario (mese e settimana), task con descrizione, priorità,
ripetizioni, spunta «Fatta», notifiche, una chat per aggiungere task scrivendo a parole,
una tabella di link ai progetti e un pannello con le ultime notizie di Teleboario da copiare.

Esistono **due versioni**, con lo stesso aspetto:

| | Versione online (Vercel) | Versione Mac |
|---|---|---|
| Dove gira | Su internet, protetta da password | Solo sul tuo Mac |
| Dati | Upstash Redis (servizio cloud) | File sul tuo Mac |
| Notifiche | Notifiche push del browser, anche a pagina chiusa | Notifiche di macOS |
| Serve | Account Vercel, Upstash e un servizio che «sveglia» l'app ogni minuto | Solo Python (già nel Mac) |

---

## Versione online (Vercel)

### Cosa devi sapere prima
- **Dopo la pubblicazione i tuoi dati stanno su un servizio cloud (Upstash)**, protetti dalla
  password. La versione Mac, invece, non manda nulla fuori dal computer.
- **Vercel gratuito non può eseguire un controllo ogni minuto** (il piano Hobby permette un solo
  controllo al giorno). Per questo le notifiche si appoggiano a un servizio esterno gratuito che
  chiama l'app ogni minuto (passo 6). Senza quel passo le notifiche **non partono**.
- Il repository GitHub deve essere **privato**.

### Passi

**1. Carica il progetto su GitHub** (repository privato): *New repository → Private →
uploading an existing file →* trascina tutti i file → *Commit changes*.

**2. Pubblica su Vercel.** Su vercel.com: *Add New → Project →* scegli il repository →
lascia **Framework Preset: Other**. Prima di premere *Deploy* apri **Environment Variables** e aggiungi:

| Nome | Valore |
|---|---|
| `APP_PASSWORD` | la password per entrare (lunga, almeno 12 caratteri) |
| `CRON_SECRET` | una parola lunga e casuale (serve al passo 6; non è la password) |
| `TZ_NAME` | facoltativo, `Europe/Rome` è già il valore predefinito |

**3. Collega il database.** Nel progetto: *Storage →* (Marketplace) **Upstash Redis** →
piano gratuito → *Connect* al progetto, su tutti gli ambienti. Poi *Deployments →* i tre puntini
sull'ultimo → **Redeploy**, perché le variabili nuove valgano.

**4. Entra.** Apri l'indirizzo del progetto (`https://nome-progetto.vercel.app`) e scrivi la password.

**5. Porta qui le tue task** (facoltativo). In basso clicca **Importa da file** e scegli
`tasks.json` dalla cartella `Agenda` nella tua Home. Le voci già presenti non vengono toccate.
Poi clicca **🔔 Attiva notifiche**, consenti, e premi **Prova notifica**.
Le notifiche vanno attivate **una volta per ogni browser** che usi.

**6. Sveglia ogni minuto.** Su un servizio gratuito di cron esterno (per esempio cron-job.org)
crea un'attività che apre ogni minuto questo indirizzo:

    https://nome-progetto.vercel.app/api/cron?key=IL_TUO_CRON_SECRET

(controlla che il piano gratuito del servizio scelto permetta davvero l'intervallo di 1 minuto).
In alternativa, con il piano **Vercel Pro**, aggiungi a `vercel.json`:

    "crons": [{ "path": "/api/cron", "schedule": "* * * * *" }]

e Vercel invia da solo la chiave `CRON_SECRET`. Con il piano gratuito questa riga **blocca la
pubblicazione**: non aggiungerla.

### Se qualcosa non va
- **«Database non collegato»** → ripeti il passo 3 e fai Redeploy.
- **«Manca la password»** → aggiungi `APP_PASSWORD` e fai Redeploy.
- **Pagina 404 all'indirizzo principale** → in *Settings → Build & Output → Output Directory* scrivi `public`.
- **Le notifiche non arrivano** → controlla che l'attività del passo 6 risponda 200, che il
  browser abbia il permesso e che su Mac sia Safari 16+ (macOS 13+), Chrome, Edge o Firefox.
- **«Troppi tentativi»** → hai sbagliato la password più di 8 volte: aspetta 15 minuti.

### Sicurezza
L'accesso è una sola password (a vita di 60 giorni sul browser), con blocco dopo 8 tentativi.
Scegline una lunga e non riusarla. I dati sono in Upstash; usa ogni tanto **Esporta backup**.
Il sito ricorda anche l'ultimo salvataggio precedente come copia di emergenza.

### Come funziona (per chi è curioso)
`public/` è la pagina; `api/` contiene le funzioni (dati, login, notizie, notifiche); `lib/` il codice
condiviso. Le notifiche usano Web Push standard: le chiavi (VAPID) si creano da sole al primo avvio.

---

## Versione Mac

Funziona solo in locale, senza account. Usa Python 3, già incluso in macOS.

1. Scarica la cartella (**Code → Download ZIP**) e aprila.
2. Doppio click su `Installa.command`. Se macOS lo blocca: *Impostazioni di Sistema →
   Privacy e sicurezza → Apri comunque*. Se non parte: apri **Terminale**, scrivi `bash `
   (con lo spazio), trascina dentro il file e premi Invio.
3. L'agenda si apre su <http://localhost:8765> e riparte da sola a ogni accensione.
4. Clicca **Prova notifica**; se non vedi nulla: *Notifiche → Script Editor* e attivale.

Aggiornare: sostituisci `index.html` e `server.py` nella cartella `Agenda` della tua Home, poi
doppio click su `Riavvia Agenda.command`. Disinstallare: `Disinstalla.command` (i dati restano).
I dati sono in `~/Agenda/tasks.json`, con una copia al giorno in `backup/`.

## Uso (uguale nelle due versioni)

- **Chat in alto:** «Domani alle 15 chiama Marco, avvisami 30 minuti prima», «Ogni lunedì alle 9
  riunione, priorità alta». Più task insieme: separale con `;`.
- **ALT + click** su una task la duplica. Il pallino ☐/☑ la segna come fatta.
- **LINK PROGETTI:** tabella di nomi e link modificabili.
- **NOTIZIE TG:** le 5 «Ultime news» della home di teleboario.it; **Copia** mette
  `Titolo 👉🏼 link` negli appunti. Non invia mai nulla.
