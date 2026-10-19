# Agenda locale

Piccola agenda per il Mac: calendario mensile e settimanale, task con descrizione,
priorità, ripetizioni, spunta «Fatta», notifiche native di macOS, una chat per
aggiungere task scrivendo a parole, una raccolta di link ai progetti e un pannello
con le ultime notizie di Teleboario da copiare.

**Funziona solo in locale, sul tuo Mac.** Nessun account, nessun cloud: le task stanno
in un file sul tuo computer. Usa solo Python 3, già incluso in macOS.

## Installazione (una volta sola)

1. Scarica questa cartella (pulsante verde **Code**, poi **Download ZIP**) e aprila.
2. Fai doppio click su `Installa.command`.
   - Se macOS lo blocca: **Impostazioni di Sistema → Privacy e sicurezza → Apri comunque**.
   - Se non parte per niente: apri **Terminale**, scrivi `bash ` (con lo spazio),
     trascina dentro il file `Installa.command` e premi Invio. Succede quando i file
     scaricati da GitHub perdono il permesso di esecuzione.
3. Si apre l'agenda su <http://localhost:8765>. Da ora parte da sola a ogni accensione.
4. Clicca **Prova notifica**. Se non vedi nulla: **Impostazioni di Sistema → Notifiche →
   Script Editor** e attivale.

## Uso quotidiano

- Apri <http://localhost:8765> (mettila nei preferiti o aggiungila al Dock da Safari).
- **Chat in alto:** scrivi per esempio «Domani alle 15 chiama Marco, avvisami 30 minuti
  prima» oppure «Ogni lunedì alle 9 riunione, priorità alta». Più task insieme: separale con `;`.
- **ALT + click** su una task la duplica.
- **LINK PROGETTI:** tabella di nomi e link modificabili.
- **NOTIZIE TG:** legge le 5 «Ultime news» della home di teleboario.it. Il tasto **Copia**
  mette `Titolo 👉🏼 link` negli appunti. Non invia mai nulla.

## Aggiornare l'app

Sostituisci `index.html` e `server.py` nella cartella `Agenda` della tua Home, poi fai
doppio click su `Riavvia Agenda.command`. Le task non vengono toccate.

## Dove sono i dati

Nella cartella `Agenda` della tua Home: `tasks.json` (task e link) e `backup/`
(una copia al giorno). Questi file **non** sono nel repository (vedi `.gitignore`).
Per un backup copia quella cartella su iCloud Drive o una chiavetta.

## Disinstallare

Doppio click su `Disinstalla.command`. I dati restano.

## Perché non si pubblica online («deploy»)

L'app è pensata per un solo utente sul proprio Mac:

- non ha login: chiunque raggiungesse l'indirizzo vedrebbe e modificherebbe le task;
- le notifiche usano `osascript`, che esiste solo su macOS;
- i dati sono in un file locale, non in un database condiviso.

GitHub serve quindi per conservare il codice e la sua storia, o per installarla su un altro
Mac. Una versione online richiederebbe login, un database e notifiche web: sarebbe un
progetto diverso.

## Struttura

| File | A cosa serve |
|---|---|
| `server.py` | Programma di sfondo: salva i dati, invia le notifiche, legge le notizie |
| `index.html` | L'interfaccia (calendario, chat, pannelli) |
| `Installa.command` | Installa e avvia al login (LaunchAgent) |
| `Riavvia Agenda.command` | Riavvia il programma dopo un aggiornamento |
| `Disinstalla.command` | Ferma l'avvio automatico |
