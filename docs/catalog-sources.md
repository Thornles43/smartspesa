# Inventario fonti cataloghi supermercati — SmartSpesa

**Verifica delle pagine pubbliche:** 21 ottobre 2026  
**Scopo:** distinguere fonti ufficiali consultabili da cataloghi completi, prezzi correnti e disponibilità in singolo negozio. Questo inventario non equivale a un'integrazione automatica dei dati.

## Fonti ufficiali verificate

| Insegna | Fonte ufficiale | Tipo di informazione osservata | Limite da rispettare |
|---|---|---|---|
| Sole 365 | https://catalogo.sole365.it/ | Catalogo online con nomi prodotto, formati e prezzi mostrati nella pagina | Prezzo e assortimento vanno verificati per zona/negozio e al momento della consultazione. Il marchio dichiara un modello di prezzi bassi quotidiani e non pubblica volantini tradizionali. |
| Sole 365 | https://www.sole365.it/spesa-online/ | Informazioni ufficiali sulla spesa online; rimanda al servizio CosìComodo | La copertura dipende dalla zona di consegna. La pagina informativa disponibile è datata 2021, quindi non prova da sola l'assortimento corrente. |
| Iper Rossetto / Rossetto | https://rossettogroup.it/prezzi-rossetto/ | Pagina ufficiale “Prezzi Rossetto”, esempi di prezzi bassi e promozioni | Non è stato verificato un catalogo pubblico completo interrogabile per prodotto o una API pubblica. Non inferire che ogni prodotto mostrato sia disponibile in ogni negozio. |
| Iper Rossetto / Rossetto | https://rossettogroup.it/prezzi-rossetto-in-corso/ | Pagina ufficiale “Prezzi bassi Rossetto” con prodotti, formati, prezzi e date di validità mostrate per singolo articolo | La pagina può mantenere voci con date già trascorse: controllare la scadenza di ogni articolo e non importare automaticamente come attuali i prezzi scaduti. Non è un feed/API strutturato né prova la disponibilità in ogni punto vendita. |
| Iper Rossetto / Rossetto | https://rossettogroup.it/punti-vendita/ | Elenco ufficiale dei punti vendita e delle insegne locali | Utile per disambiguare Super Rossetto e Iperalimentare Rossetto, non è un catalogo prodotti. |
| Iperlando | https://www.iperlando.it/ | Sito ufficiale e localizzazione dei punti vendita | Non è stato individuato un catalogo pubblico completo di prodotti/prezzi interrogabile. Usare la ricerca limitata al dominio ufficiale e non inventare risultati. |
| Conad | https://spesaonline.conad.it/tutti-i-prodotti | Catalogo/spesa online ufficiale: la pagina pubblica schede prodotto, formati e prezzi per il servizio online | La raccolta automatica importa solo schede con titolo e un prezzo confezione non ambiguo; esclude i prezzi unitari €/kg o €/L e le schede con più prezzi non distinguibili. La zona/negozio e la disponibilità fisica vanno verificate separatamente. | La sincronizzazione automatica prova a importare soltanto le schede Product con prezzo in JSON-LD; se il sito non le espone in modo leggibile, la fonte resta segnata come non acquisita.
| Conad | https://www.conad.it/ricerca-negozi | Negozi e volantini ufficiali | Le offerte vanno collegate al negozio selezionato e al periodo di validità. |
| Coop | https://www.coop.it/prodotti-coop/catalogo-prodotti | Catalogo ufficiale dei prodotti a marchio Coop, con filtri | Copre soprattutto le linee a marchio Coop; non equivale al catalogo completo di ogni cooperativa/ipermercato né a un listino prezzi locale. |
| Esselunga | https://spesaonline.esselunga.it/commerce/nav/supermercato/ | Spesa online e assortimento navigabile | Il catalogo e i prezzi possono richiedere selezione della zona/negozio o accesso; non generalizzare la disponibilità nazionale. |
| Carrefour | https://www.carrefour.it/spesa-online/i-nostri-prodotti-a-marchio/ | Catalogo online di prodotti a marchio Carrefour | È una sezione di prodotti a marchio, non l'intero assortimento di ogni punto vendita. |
| Lidl | https://www.lidl.it/c/cibo-e-bevande/s10068374 | Categorie di prodotti venduti in negozio | Alcuni prodotti sono stagionali o disponibili solo in periodi specifici; la pagina non conferma stock locale. |
| Lidl | https://www.lidl.it/c/c1074 | Prodotti/offerte pubblicate sul sito | Promozioni con intervalli temporali e disponibilità variabile. |
| ALDI | https://www.aldi.it/prodotti | Catalogo ufficiale per categorie, con formati e prezzi per alcuni articoli | Alcuni articoli sono indicati come disponibili da una data specifica; verificare periodo e negozio. |
| Eurospin | https://www.eurospin.it/ribassati/ | Prodotti ribassati con prezzo, formato e validità dichiarata | Sezione promozionale, non catalogo completo. Le date della promozione sono essenziali. |
| MD | https://www.mdspa.it/punti-vendita/ | Ricerca punto vendita e volantini ufficiali associati alla zona | Richiede la selezione della località/negozio; i volantini sono promozionali e non rappresentano il catalogo completo. Verificare sempre il periodo di validità e le condizioni della promozione. |
| Iper La grande i | https://volantini.iper.it/ | Volantini ufficiali selezionabili per città/punto vendita, con date | È una fonte promozionale; non va trattata come catalogo completo. Da non confondere con Iper Rossetto. |


| Bennet | https://www.bennet.com/ | Spesa online con categorie, prodotti e prezzi mostrati | Il sito richiede selezione del punto vendita e può segnalare articoli non acquistabili online; non equivale alla disponibilità in tutti i negozi. |
| Pam / Panorama | https://pamacasa.pampanorama.it/ | Spesa online e ricerca prodotto | Richiede verifica CAP/zona; assortimento e consegna non sono nazionali in modo uniforme. |
| Iperal | https://www.iperal.it/I-MARCHI/Iperal/ | Schede della linea a marchio Iperal | Solo prodotti a marchio in questa sezione; il sito rimanda alla spesa online per l'acquisto. |
| CRAI | https://crai.it/prodotti-crai/prodotti-a-marchio-crai | Catalogo e descrizioni dei prodotti a marchio CRAI | Non fornisce in questa pagina un listino completo di prezzi per ogni punto vendita. |
| Despar | https://www.despar.it/it/sbudget/ | Prodotti della linea S-Budget e collegamenti ai volantini locali | La pagina non rappresenta tutto l'assortimento Despar; i volantini hanno validità e copertura territoriale. |
| NaturaSì | https://www.naturasi.it/ | E-commerce e catalogo navigabile per categorie | Verificare zona di consegna e disponibilità; i prodotti online non provano la disponibilità nel singolo negozio fisico. |
| Migross | https://www.migross.it/ | Promozioni, volantini e accesso ai servizi online | La pagina mostra selezione del punto vendita; le promozioni hanno intervalli temporali e copertura specifica. |
| Decò / Gruppo Arena | https://decoacasa.gruppoarena.it/ | Catalogo di spesa online con prodotti e prezzi per negozio/zona | La selezione del negozio è necessaria; non generalizzare i prezzi ad altri punti vendita. |
| SuperConveniente / Gruppo Arena | https://superconveniente.gruppoarena.it/volantini/ | Volantini ufficiali selezionabili per punto vendita | Fonte promozionale locale, non catalogo completo. |
| Prix Quality | https://www.prixquality.com/app/ | App ufficiale con offerte e volantini digitali | Alcune offerte possono essere riservate a iscritti/carta fedeltà; verificare validità e condizioni. |
| Tigros / Primia | https://www.tigros.it/page/catalogo-primia | Catalogo ufficiale della linea Primia | Copre la linea Primia, non l'intero assortimento Tigros. |
| Bennet | https://www.bennet.com/ | Catalogo di spesa online con prodotti, formati, prezzi e indicazioni di disponibilità | La disponibilità può essere specifica del punto vendita e l'accesso può dipendere dalla selezione del negozio. |

## Stato nell'app

- La ricerca interna di SmartSpesa mostra prodotti già associati a un'insegna nei dati/prezzi registrati nell'app; i cataloghi generalisti esterni non vengono usati per popolare automaticamente i risultati interni.
- La ricerca interna mostra solo record già associati a un'insegna in SmartSpesa; non inserisce automaticamente risultati provenienti da database generalisti.
- La sincronizzazione automatica tenta anche il catalogo online ufficiale Conad: oltre ai dati strutturati, usa un parser prudente delle schede HTML con titolo e prezzo in euro, escludendo prezzi unitari e schede con più prezzi di confezione ambigui. La copertura effettiva viene confermata dal conteggio del job; non viene presunto che la pagina esponga l'intero catalogo.
- La sezione dei cataloghi offre sia il collegamento alla pagina del retailer sia una ricerca web vincolata al dominio dichiarato dell'insegna e al termine cercato. È una scorciatoia per consultare fonti ufficiali, non un'importazione automatica né una prova di disponibilità.
- L'importazione automatica delle offerte ora verifica anche la coerenza tra il nome del supermercato indicato dal fornitore e il dominio ufficiale del link. Un URL ufficiale di un'insegna diversa non è sufficiente e l'offerta viene esclusa.
- I cataloghi online di Sole 365, Rossetto e delle altre insegne restano limitati a ciò che ciascun sito pubblica e consente di interrogare; la ricerca vincolata al dominio non sostituisce un feed ufficiale.
- I collegamenti diretti a cataloghi sono stati aggiunti solo per pagine pubbliche individuate e verificate. Dove il sito non offre un catalogo pubblico completo, l'app non deve inventarlo.
- La ricerca online non è ancora un connettore dati strutturato: non importa automaticamente tutte le schede, i prezzi o le disponibilità dei siti esterni.
- Il riconoscimento tramite barcode nell'app ora cerca una corrispondenza esatta nei prezzi registrati in SmartSpesa e richiede che il record abbia nome prodotto e insegna. Non usa più cataloghi generalisti o UPCitemdb per identificare un articolo come prodotto di un supermercato. Se non esiste una corrispondenza, chiede l'inserimento manuale e la verifica sul sito ufficiale. L'ultima rilevazione può essere mostrata come dato storico, ma non viene copiata nel campo del prezzo corrente.
- Non sono state trovate e validate, in questa verifica pubblica, API aperte e documentate che forniscano l'intero catalogo aggiornato di tutte le insegne elencate. Per integrazioni commerciali o sincronizzazioni su larga scala serve verificare termini d'uso e, dove necessario, chiedere autorizzazione/feed al retailer.

## Regole dati richieste

1. Conservare per ogni prodotto l'insegna e la fonte originaria.
2. Tenere distinti prodotto di catalogo, prezzo osservato, offerta con validità e disponibilità del singolo punto vendita.
3. Mostrare prezzo e data solo se presenti nella fonte; non stimare né riutilizzare come attuale un prezzo scaduto.
4. Non importare risultati da marketplace o cataloghi generici come se fossero prodotti del supermercato.
5. Se il catalogo non è accessibile pubblicamente o richiede CAP/login, dichiarare il limite e usare il sito ufficiale, senza aggirare protezioni.


## Importazione automatica prudente delle offerte

- La ricerca delle offerte usa l'API pubblica di Prezzi in Vista come fonte di scoperta. Le condizioni d'uso del fornitore consentono le interrogazioni e la citazione dei dati con collegamento alla pagina originale, ma vietano di copiare in blocco il suo archivio per ripubblicarlo come servizio proprio.
- Per questo SmartSpesa importa al massimo **3 offerte per ogni ricerca esplicita** e soltanto se sono presenti: nome, insegna, prezzo valido, data di scadenza non trascorsa, URL della pagina Prezzi in Vista e URL HTTPS su un dominio ufficiale del supermercato presente nell'elenco consentito.
- Ogni record salvato conserva sia il collegamento alla fonte ufficiale del supermercato sia `dataProviderUrl` per citare Prezzi in Vista; il prezzo è contrassegnato come offerta da volantino e non come prezzo garantito in negozio.
- I record identici per prodotto, insegna, prezzo e scadenza vengono controllati prima dell'inserimento per evitare duplicazioni. Gli esiti e le offerte escluse sono mostrati nella schermata di ricerca.
- Le pagine di catalogo completo, come il catalogo Sole 365 e le pagine “Prezzi Rossetto”, restano consultabili tramite i collegamenti ufficiali. **Non vengono scaricate in massa né importate automaticamente** finché non sia disponibile un feed/API autorizzato o una modalità di riutilizzo verificata.
- L'importazione delle offerte non copre tutti i prodotti normalmente in assortimento. Per Iperlando, ad esempio, il sito ufficiale consultato non espone un catalogo pubblico completo interrogabile. In quel caso le fonti pratiche restano gli scontrini verificati e l'importazione controllata di volantini/documenti pubblicati dall'insegna.
- I dati degli scontrini vengono elaborati localmente con OCR; il sistema confronta le righe riconosciute sia con lo storico SmartSpesa sia con i prodotti importati dai cataloghi ufficiali disponibili. Le promozioni ufficiali con scadenza valida possono essere confrontate con il prezzo dello scontrino; i prezzi di catalogo senza validità esplicita sono mostrati come corrispondenze, ma non vengono usati per calcolare una differenza come se fossero correnti. Il nome del supermercato viene compilato automaticamente soltanto quando l'OCR riconosce un'insegna nota. Le righe e i prezzi OCR devono essere controllati prima del salvataggio.
