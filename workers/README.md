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
