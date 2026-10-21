# Proxy per i supermercati vicini (facoltativo)

Il sito SmartSpesa è pubblicato su GitHub Pages, che non esegue codice server. Questo Worker è un proxy opzionale per ridurre i problemi CORS del browser durante le richieste a Overpass.

## Pubblicazione

1. Accedi a Cloudflare e apri **Workers & Pages**.
2. Crea un Worker chiamato, ad esempio, `smartspesa-overpass`.
3. Copia il contenuto di `overpass-proxy.js` nell'editor del Worker e fai Deploy.
4. Copia l'URL HTTPS assegnato al Worker.
5. In `index.html`, prima del tag `<script type="module">`, aggiungi:
   ```html
   <script>
     window.SMARTSPESA_OVERPASS_PROXY_URL = "https://NOME-WORKER.NOME-ACCOUNT.workers.dev";
   </script>
   ```
6. Pubblica la modifica su GitHub Pages e prova la ricerca dei supermercati.

Il Worker limita le richieste al formato di query usato dalla ricerca vicina e accetta CORS dal dominio GitHub Pages. Le istanze Overpass pubbliche possono comunque applicare limiti o non essere disponibili. Non sono richieste chiavi API, ma il proxy non deve essere considerato un servizio con garanzia di disponibilità.


## Percorso consigliato: AI senza costi iniziali con Firebase AI Logic

Il frontend può usare Gemini tramite Firebase AI Logic, senza una chiave API OpenAI e senza distribuire un Cloudflare Worker. Il codice usa il modello `gemini-3.5-flash-lite`, disponibile nel livello senza costi aggiuntivi della Gemini Developer API secondo la documentazione ufficiale; restano applicabili quote e limiti del piano gratuito.

Per attivarlo:
1. Apri la [console Firebase del progetto SmartSpesa](https://console.firebase.google.com/project/smartspesa-f9718).
2. Vai in **AI Services > AI Logic**, seleziona **Get started** e scegli **Gemini Developer API** (non Agent Platform/Vertex AI, che richiede il piano Blaze).
3. Completa la configurazione guidata e abilita Firebase AI Logic.
4. Configura **App Check** per l'app Web con il provider **reCAPTCHA v3** e il dominio `thornles43.github.io`. Copia la site key pubblica generata/configurata.
5. In `index.html`, sostituisci il valore vuoto di `window.SMARTSPESA_RECAPTCHA_SITE_KEY = "";` con quella site key pubblica. La site key reCAPTCHA non è una password; non inserire segreti o chiavi private nel repository.
6. Pubblica la modifica su `main` e prova la lettura di uno scontrino e la ricerca assistita.

**Importante:** il codice non attiva l'AI finché non è impostata la site key App Check. L'OCR locale continua a funzionare nel frattempo. L'AI corregge il testo OCR ricevuto, non analizza la foto originale; le righe restano bozze da controllare prima di salvarle. Il testo OCR dello scontrino viene inviato al modello Gemini quando la funzione è attiva. Verifica le informative e le impostazioni del servizio prima di usare dati personali.

Riferimenti ufficiali:
- [Configurare Firebase AI Logic per il Web](https://firebase.google.com/docs/ai-logic/get-started?platform=web)
- [Prezzi di Firebase AI Logic](https://firebase.google.com/docs/ai-logic/pricing)
- [FAQ e App Check](https://firebase.google.com/docs/ai-logic/faq-and-troubleshooting)

---

## Percorso alternativo: Worker OpenAI


Il file `product-search-ai.js` gestisce sia il riordino semantico dei prodotti sia la correzione/estrazione delle righe dal testo OCR degli scontrini. GitHub Pages non esegue codice server: il Worker va pubblicato separatamente e le chiavi segrete non devono essere inserite in `index.html` o nel repository.

1. In Cloudflare apri **Workers & Pages** e crea un Worker chiamato, ad esempio, `smartspesa-ai`.
2. Incolla il contenuto di `product-search-ai.js` e fai Deploy.
3. Nelle impostazioni del Worker aggiungi la variabile `FIREBASE_WEB_API_KEY` con la chiave web già presente nella configurazione Firebase dell'app.
4. Aggiungi il secret `OPENAI_API_KEY` con una chiave API OpenAI valida. Non inserirla mai nel codice pubblico.
5. Facoltativamente imposta `OPENAI_MODEL` a un modello disponibile nel tuo account API.
6. Copia l'URL HTTPS del Worker. In `index.html`, sostituisci la riga `window.SMARTSPESA_AI_WORKER_URL = "";` con l'URL del Worker, mantenendo la variabile tra virgolette.
7. Pubblica la modifica su GitHub Pages e verifica sia una ricerca prodotti sia l'importazione di uno scontrino.

Il Worker verifica il token Firebase dell'utente, limita le richieste al dominio pubblicato, usa `store: false` per le richieste al modello e non scrive dati in Firestore. Le righe restituite dall'AI restano bozze: l'utente deve controllare e confermare ogni prezzo prima del salvataggio. Quando l'assistenza AI per gli scontrini è attiva, il testo OCR viene inviato al fornitore AI; la foto originale non viene inviata da questa funzione. Non attivare la funzione se non vuoi trasmettere il testo dello scontrino. Costi API e limiti dipendono dall'account del fornitore.

La configurazione del Worker non viene effettuata da GitHub Pages: senza deploy del Worker e senza le variabili/secret sopra indicate, l'app continua a usare il parser locale e l'AI resta disattivata.
