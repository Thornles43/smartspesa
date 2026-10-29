# SmartSpesa

Web app per spendere meno al supermercato: confronta i prezzi dello stesso prodotto tra i punti vendita, tiene la lista della spesa e legge gli scontrini per costruire uno storico dei prezzi realmente pagati.

L'app è una pagina unica (`index.html`) pubblicata su GitHub Pages. Non c'è un server proprio: usa Firebase per login e database.

## Cosa fa

- **Accesso con Google** (Firebase Authentication).
- **Prezzi condivisi**: ogni utente registra prezzi, che l'app confronta per prodotto e per supermercato (Firestore, collezione `prices`). Ognuno può eliminare solo i propri prezzi.
- **Scansione del codice a barre** (html5-qrcode) per identificare il prodotto.
- **Lista della spesa** privata per utente (collezione `shoppingItems`).
- **Scontrini**: foto o PDF letti **nel browser** (Tesseract.js e pdf.js), senza inviare l'immagine a servizi esterni. Le righe lette si controllano e si correggono a mano prima di salvarle.
- **Cataloghi e offerte ufficiali** dei supermercati, letti dalle pagine pubbliche delle insegne (vedi sotto).
- **Supermercati vicini** (OpenStreetMap/Overpass, con proxy Cloudflare facoltativo).

## Controllo degli scontrini

Dopo la lettura, l'app confronta le righe con quello che lo scontrino stesso stampa:

- la **somma delle righe** deve coincidere con il **totale**;
- il **numero di articoli** letti deve coincidere con "ARTICOLI N", se presente.

Le righe del tipo `12 x 0,35` valgono per la riga successiva (12 × 0,35 = 4,20): il prezzo salvato è quello unitario. Se il conto non torna, l'app lo segnala e chiede una conferma esplicita prima di salvare. Le righe senza aliquota IVA (4, 5, 10, 22%) sono evidenziate come sospette quando quasi tutte le altre ce l'hanno.

## Struttura del repository

| Percorso | Contenuto |
|---|---|
| `index.html` | L'intera app (HTML, CSS e JavaScript) |
| `firestore.rules` | Regole di sicurezza del database |
| `firebase.json` | Configurazione Firebase (solo regole Firestore) |
| `scripts/sync-official-catalogs.mjs` | Legge i cataloghi ufficiali (Sole 365, Rossetto, Conad, Eurospin) e scrive `data/official-catalogs.json` |
| `data/official-catalogs.json` | Catalogo generato, aggiornato ogni giorno |
| `docs/catalog-sources.md` | Fonti verificate, limiti e regole di riuso dei dati |
| `workers/` | Proxy Cloudflare facoltativo per le richieste a Overpass |
| `.github/workflows/` | Pubblicazione delle regole Firestore e sincronizzazione quotidiana dei cataloghi |

## Pubblicazione

- Le **regole Firestore** vengono pubblicate automaticamente a ogni push su `main` che modifica `firestore.rules` (workflow `deploy-firestore-rules`).
- Il **catalogo ufficiale** si aggiorna ogni giorno alle 05:15 UTC (workflow `sync-official-catalogs`). Un'insegna che non risponde non cancella i dati precedenti.

## Limiti noti

- Non esiste una banca dati pubblica e completa dei prezzi per supermercato: i dati vengono dagli scontrini degli utenti e dalle pagine ufficiali delle insegne che le pubblicano. Vedi `docs/catalog-sources.md`.
- Il catalogo ufficiale copre poche insegne e può avere meno prodotti di quanti ne esistano.
- L'OCR sbaglia con scontrini molto lunghi, spiegazzati o fotografati male: per questo il controllo sul totale e la conferma riga per riga sono obbligatori nel flusso.
