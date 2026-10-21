# Ricerca assistita dall'IA

## Cosa fa

Il Worker `workers/product-search-ai.js` riordina un massimo di 20 risultati già presenti nei dati SmartSpesa. Può aiutare con sinonimi, query poco precise e refusi. Non cerca in autonomia su Internet e non importa nuovi articoli: un prodotto senza associazione a un supermercato nei dati SmartSpesa resta fuori dai risultati. Prezzi, offerte e disponibilità non vengono generati dall'IA.

## Configurazione necessaria

L'IA non è attiva finché il Worker non viene distribuito e configurato. La chiave OpenAI non deve mai essere inserita in `index.html`, nel repository o inviata in chat.

1. Distribuisci `workers/product-search-ai.js) come Cloudflare Worker, ad esempio `smartspesa-product-ai`.
2. Nelle impostazioni del Worker, aggiungi il **Secret** `OPENAI_API_KEY` con una chiave API dedicata e con limiti di spesa adeguati.
3. Aggiungi la variabile `FIREBASE_WEB_API_KEY` con la chiave web già presente nella configurazione Firebase dell'app. È configurazione pubblica Firebase; non è la chiave OpenAI.
4. Facoltativamente, configura `OPENAI_MODEL`; se assente viene usato `gpt-4.1-mini`.
5. Copia l'URL `workers.dev` effettivamente assegnato da Cloudflare e inseriscilo nella riga `window.SMARTSPESA_AI_WORKER_URL = "";` all'inizio dello script in `index.html).
6. Dopo il commit, verifica il deploy GitHub Pages e prova la ricerca con almeno due prodotti già registrati.

Comando indicativo per distribuire il file dalla radice del repository:

```bash
npx wrangler deploy workers/product-search-ai.js --name smartspesa-product-ai
npx wrangler secret put OPENAI_API_KEY --name smartspesa-product-ai
```

La variabile `FIREBASE_WEB_API_KEY` si può aggiungere da Cloudflare Dashboard → Worker → Settings → Variables and Secrets. Non incollare la chiave OpenAI nel terminale condiviso, nei log o in Git.

## Protezioni implementate

- Accetta richieste solo dal dominio GitHub Pages dell'app e dagli indirizzi locali di sviluppo elencati nel codice.
- Richiede un token Firebase ID valido.
- Limita dimensione della richiesta e numero di candidati.
- Invia all'IA soltanto query e metadati essenziali dei prodotti, non prezzi, email o dati personali.
- Usa la Responses API con output JSON strutturato e `store: false`.
- Filtra gli ID restituiti dall'IA: la risposta può soltanto riordinare i candidati forniti.
- Se l'IA non risponde, l'app mantiene la ricerca normale.

**Limiti ancora da completare prima di un uso pubblico:** configurare limiti di richieste/spesa nel provider e controlli di abuso a livello Cloudflare; distribuire il Worker e verificare la chiamata reale. L'IA non sostituisce l'importazione autorizzata dei cataloghi ufficiali delle insegne.
