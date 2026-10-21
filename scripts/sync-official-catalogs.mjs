import fs from "node:fs/promises";
import path from "node:path";

const OUT = path.resolve("data/official-catalogs.json");
const NOW = new Date();
const TODAY = NOW.toISOString().slice(0, 10);
const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const MONTHS = { gennaio:1, febbraio:2, marzo:3, aprile:4, maggio:5, giugno:6, luglio:7, agosto:8, settembre:9, ottobre:10, novembre:11, dicembre:12 };
const SOURCES = [
  { id: "sole365", name: "Sole 365", url: "https://catalogo.sole365.it/", domain: "sole365.it", mode: "catalog" },
  { id: "rossetto", name: "Iper Rossetto / Rossetto", url: "https://rossettogroup.it/prezzi-rossetto-in-corso/", domain: "rossettogroup.it", mode: "promotions" },
  // Conad: acquisisce solo Product JSON-LD effettivamente pubblicati dalla pagina ufficiale.
  // Se il sito non espone dati strutturati leggibili, il sync segnala errore e conserva i dati precedenti.
  { id: "conad", name: "Conad", url: "https://spesaonline.conad.it/tutti-i-prodotti", domain: "spesaonline.conad.it", mode: "conad" },
  { id: "eurospin", name: "Eurospin", url: "https://www.eurospin.it/ribassati/", domain: "eurospin.it", mode: "eurospin" }
];

function decodeEntities(s) {
  return String(s || "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&euro;/gi, "€").replace(/&agrave;/gi, "à").replace(/&egrave;/gi, "è")
    .replace(/&igrave;/gi, "ì").replace(/&ograve;/gi, "ò").replace(/&ugrave;/gi, "ù")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}
function htmlText(html) {
  return decodeEntities(String(html || "")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .replace(/<[^>]+>/g, " "))
    .replace(/[\t\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}
function normalize(s) {
  return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}
function parseMoney(s) {
  if (s === null || s === undefined || String(s).trim() === "") return null;
  const raw = String(s).trim().replace(/\s|€/g, "");
  // I cataloghi italiani usano sia 1.234,56 sia 1.23.
  // Rimuovi i separatori delle migliaia solo quando è presente la virgola decimale;
  // altrimenti il punto è il separatore decimale e non va eliminato.
  const cleaned = raw.includes(",")
    ? raw.replace(/\./g, "").replace(",", ".")
    : raw;
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 && n <= 100000 ? Math.round(n * 100) / 100 : null;
}

// Guardie di regressione per il parsing dei prezzi italiani e internazionali.
for (const [input, expected] of [["1,99", 1.99], ["1.234,56", 1234.56], ["1.99", 1.99], ["0.55", 0.55]]) {
  if (parseMoney(input) !== expected) throw new Error("Parsing prezzo non valido: " + input);
}
function parseExpiry(text) {
  const m = String(text || "").match(/(?:fino\s+al|valido\s+fino\s+al)\s+(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)(?:\s+(20\d{2}))?/i);
  if (!m) return null;
  const day = Number(m[1]);
  const month = MONTHS[m[2].toLowerCase()];
  let year = m[3] ? Number(m[3]) : NOW.getUTCFullYear();
  if (!m[3] && month < NOW.getUTCMonth() + 1) return null; // expired dates are never rolled into next year
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date.toISOString().slice(0, 10);
}
function parseJsonLdProducts(source, html) {
  const roots = [];
  const blocks = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(blocks)) {
    try { roots.push(JSON.parse(match[1].trim())); } catch { /* JSON-LD non valido: ignora il blocco */ }
  }

  const candidates = [];
  const visited = new Set();
  function walk(value) {
    if (!value || typeof value !== "object" || visited.has(value)) return;
    visited.add(value);
    const types = Array.isArray(value["@type"]) ? value["@type"] : [value["@type"]];
    if (types.some(type => String(type || "").toLowerCase() === "product")) candidates.push(value);
    if (Array.isArray(value)) value.forEach(walk);
    else Object.values(value).forEach(walk);
  }
  roots.forEach(walk);

  const products = [];
  const seen = new Set();
  for (const item of candidates) {
    const name = String(item.name || "").trim();
    if (name.length < 2 || name.length > 180) continue;
    const offers = Array.isArray(item.offers) ? item.offers : [item.offers || {}];
    const offer = offers.find(value => value && (value.price !== undefined || value.lowPrice !== undefined)) || {};
    const currency = String(offer.priceCurrency || item.priceCurrency || "EUR").toUpperCase();
    if (currency !== "EUR") continue;
    const price = parseMoney(offer.price ?? offer.lowPrice);
    if (price === null) continue;

    let validUntil = null;
    const rawExpiry = String(offer.priceValidUntil || "").slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(rawExpiry)) {
      const parsed = new Date(rawExpiry + "T00:00:00Z");
      if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== rawExpiry || rawExpiry < TODAY) continue;
      validUntil = rawExpiry;
    }

    const rawUrl = String(item.url || "");
    let sourceUrl = source.url;
    try {
      const candidateUrl = new URL(rawUrl, source.url);
      if (candidateUrl.protocol === "https:" &&
          (candidateUrl.hostname === source.domain || candidateUrl.hostname.endsWith("." + source.domain))) {
        sourceUrl = candidateUrl.href;
      }
    } catch { /* usa la pagina ufficiale del catalogo */ }

    const brandValue = item.brand;
    const brand = String(typeof brandValue === "string" ? brandValue : brandValue?.name || "").trim();
    const rawQuantity = String(item.size || item.weight || "").trim();
    const quantityMatch = (name + " " + rawQuantity).match(/\b\d+(?:[,.]\d+)?\s?(?:kg|g|mg|ml|lt|l|cl)\b/i);
    const quantity = rawQuantity || (quantityMatch ? quantityMatch[0] : "");
    const key = normalize(name) + "|" + normalize(quantity);
    if (seen.has(key)) continue;
    seen.add(key);
    products.push({
      id: source.id + ":" + key,
      supermarket: source.name,
      productName: name,
      brand,
      quantity,
      price,
      regularPrice: null,
      priceStatus: validUntil ? "official_promotion_with_expiry" : "official_catalog_validity_unconfirmed",
      validUntil,
      sourceUrl,
      catalogSource: "Catalogo online ufficiale Conad (dati strutturati pubblicati dal sito)",
      retrievedAt: NOW.toISOString(),
      sourceVerified: true
    });
  }
  return products.slice(0, 500);
}

// Test minimo del parser: prezzo, marca, formato e scadenza devono essere letti dai dati strutturati.
const jsonLdFixture = '<script type="application/ld+json">{"@type":"Product","name":"Test Pasta 500 g","brand":{"name":"Marca Test"},"size":"500 g","offers":{"price":"1,29","priceCurrency":"EUR","priceValidUntil":"2099-12-31"}}</script>';
const fixtureProducts = parseJsonLdProducts(
  { id: "fixture", name: "Test", url: "https://example.it/catalogo", domain: "example.it" },
  jsonLdFixture
);
if (fixtureProducts.length !== 1 || fixtureProducts[0].price !== 1.29 ||
    fixtureProducts[0].brand !== "Marca Test" || fixtureProducts[0].validUntil !== "2099-12-31") {
  throw new Error("Test parser JSON-LD non superato");
}

function extractHeadings(html, allowedTags) {
  const re = new RegExp("<(" + allowedTags.join("|") + ")\\b[^>]*>([\\s\\S]*?)<\\/\\1\\s*>", "gi");
  const headings = [];
  for (const m of html.matchAll(re)) {
    const title = htmlText(m[2]);
    if (title.length >= 3 && title.length <= 180) headings.push({ title, start: m.index, end: m.index + m[0].length });
  }
  return headings;
}
function parseConadProducts(source, html) {
  // La pagina ufficiale Conad espone le schede nel contenuto HTML, ma non sempre
  // pubblica Product JSON-LD. Leggiamo solo titoli h3 associati a un prezzo in euro.
  const headings = extractHeadings(html, ["h3"]);
  const products = [];
  const seen = new Set();
  const ignoredTitles = /^(aggiungi quantita|filtra e ordina|vedi tutti|tutti i prodotti|home|resetta|applica)$/i;

  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const name = heading.title.trim();
    if (name.length < 3 || name.length > 180 || ignoredTitles.test(normalize(name))) continue;
    const segment = html.slice(heading.end, headings[i + 1]?.start ?? (heading.end + 2200));
    const text = htmlText(segment);
    if (!text) continue;

    // Escludi prezzi unitari (€/kg, €/L): non sono il prezzo della confezione.
    const prices = [];
    const pricePattern = /(?:€\s*)?(\d{1,4}(?:\.\d{3})*,\d{2})(?:\s*€)?/g;
    for (const match of text.matchAll(pricePattern)) {
      const end = (match.index || 0) + match[0].length;
      const tail = text.slice(end, end + 16);
      if (/^\s*\/\s*(?:kg|l|lt|litro|litri)\b/i.test(tail)) continue;
      const value = parseMoney(match[1]);
      if (value !== null) prices.push(value);
    }
    // Se una scheda contiene più prezzi di confezione, non indoviniamo quale sia corrente.
    const uniquePrices = [...new Set(prices)];
    if (uniquePrices.length !== 1) continue;
    const price = uniquePrices[0];

    const qty = text.match(/\b\d+(?:[,.]\d+)?\s?(?:kg|g|mg|ml|lt|l|cl)\b/i);
    const quantity = qty ? qty[0].replace(/\s+/g, " ").trim() : "";
    const key = normalize(name) + "|" + normalize(quantity);
    if (seen.has(key)) continue;
    seen.add(key);

    products.push({
      id: source.id + ":" + key,
      supermarket: source.name,
      productName: name,
      brand: "",
      quantity,
      price,
      regularPrice: null,
      priceStatus: "official_catalog_validity_unconfirmed",
      validUntil: null,
      sourceUrl: source.url,
      catalogSource: "Catalogo ufficiale Conad online",
      retrievedAt: NOW.toISOString(),
      sourceVerified: true
    });
    if (products.length >= 500) break;
  }
  return products;
}

function parseEurospinProducts(source, html) {
  // Le offerte Eurospin pubblicano un periodo globale e, per ogni scheda,
  // prezzo precedente, prezzo ribassato e formato. Non stimiamo scadenze mancanti.
  const pageText = htmlText(html);
  const period = pageText.match(/offerte\\s+valide\\s+dal\\s+(\\d{1,2})\\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\\s+al\\s+(\\d{1,2})\\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\\s+(20\\d{2})/i);
  if (!period) return [];
  const from = new Date(Date.UTC(Number(period[5]), MONTHS[period[2].toLowerCase()] - 1, Number(period[1])));
  const until = new Date(Date.UTC(Number(period[5]), MONTHS[period[4].toLowerCase()] - 1, Number(period[3])));
  if (from.toISOString().slice(0, 10) > until.toISOString().slice(0, 10) ||
      until.toISOString().slice(0, 10) < TODAY) return [];
  const validFrom = from.toISOString().slice(0, 10);
  const validUntil = until.toISOString().slice(0, 10);
  const headings = extractHeadings(html, ["h2", "h3"]);
  const products = [];
  const seen = new Set();
  const pricePattern = /(?:€\\s*)?(\\d{1,4}(?:\\.\\d{3})*,\\d{2})(?:\\s*€)?/g;
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const name = heading.title.trim();
    const normalizedName = normalize(name);
    if (name.length < 3 || name.length > 180 ||
        /^(ribassati|scopri tutti i prodotti ribassati di eurospin|offerte valide dal|home|vedi prodotto)$/i.test(normalizedName)) continue;
    const segment = html.slice(heading.end, headings[i + 1]?.start ?? (heading.end + 2400))
      .replace(/<(del|s)\\b[^>]*>[\\s\\S]*?<\\/\\1\\s*>/gi, " ");
    const text = htmlText(segment);
    if (!text) continue;
    const prices = [];
    for (const match of text.matchAll(pricePattern)) {
      const end = (match.index || 0) + match[0].length;
      const tail = text.slice(end, end + 16);
      if (/^\\s*\\/\\s*(?:kg|l|lt|litro|litri)\\b/i.test(tail)) continue;
      const value = parseMoney(match[1]);
      if (value !== null) prices.push(value);
    }
    const distinct = [...new Set(prices)];
    if (!distinct.length) continue;
    const price = distinct[distinct.length - 1];
    const regularPrice = distinct.length > 1 && distinct[0] > price ? distinct[0] : null;
    const qty = text.match(/\\b\\d+\\s*x\\s*\\d+(?:[,.]\\d+)?\\s?(?:kg|g|mg|ml|lt|l|cl)\\b/i) ||
      text.match(/\\b\\d+(?:[,.]\\d+)?\\s?(?:kg|g|mg|ml|lt|l|cl)\\b/i);
    const quantity = qty ? qty[0].replace(/\\s+/g, " ").trim() : "";
    const key = normalize(name) + "|" + normalize(quantity);
    if (seen.has(key)) continue;
    seen.add(key);
    products.push({
      id: source.id + ":" + key,
      supermarket: source.name,
      productName: name,
      brand: "",
      quantity,
      price,
      regularPrice,
      priceStatus: "official_promotion_with_expiry",
      validFrom,
      validUntil,
      sourceUrl: source.url,
      catalogSource: "Offerte ribassate ufficiali Eurospin",
      retrievedAt: NOW.toISOString(),
      sourceVerified: true
    });
    if (products.length >= 250) break;
  }
  return products;
}

// Regressione Conad: il prezzo al litro non deve essere confuso col prezzo della confezione.
const conadFixture = '<h3>Acqua minerale naturale 1,5 l Conad</h3><div>1,5 L 0,20 € / L 0,30€</div><h3>Aggiungi quantità</h3><div>0,30€</div>';
const conadFixtureProducts = parseConadProducts(
  { id: "conad", name: "Conad", url: "https://spesaonline.conad.it/tutti-i-prodotti", domain: "spesaonline.conad.it" },
  conadFixture
);
if (conadFixtureProducts.length !== 1 || conadFixtureProducts[0].price !== 0.30 ||
    conadFixtureProducts[0].supermarket !== "Conad" || conadFixtureProducts[0].quantity !== "1,5 L") {
  throw new Error("Test parser catalogo Conad non superato");
}

// Regressione Eurospin: usa il prezzo ribassato, conserva il prezzo precedente e applica la scadenza ufficiale.
const eurospinFixture = '<h2>Offerte valide dal 1 ottobre al 31 ottobre 2026</h2><h3>TRANCIO DI SPALLA COTTA</h3><div>LA BOTTEGA DEL GUSTO 2,99 2,69 € 500 g - 5,38 €/kg</div>';
const eurospinFixtureProducts = parseEurospinProducts(
  { id: "eurospin", name: "Eurospin", url: "https://www.eurospin.it/ribassati/", domain: "eurospin.it" },
  eurospinFixture
);
if (eurospinFixtureProducts.length !== 1 || eurospinFixtureProducts[0].price !== 2.69 ||
    eurospinFixtureProducts[0].regularPrice !== 2.99 || eurospinFixtureProducts[0].validUntil !== "2026-10-31") {
  throw new Error("Test parser catalogo Eurospin non superato: " + JSON.stringify(eurospinFixtureProducts));
}

function parseProducts(source, html) {
  if (source.mode === "jsonld") return parseJsonLdProducts(source, html);
  if (source.mode === "conad") return parseConadProducts(source, html);
  const allowedTags = source.id === "sole365" ? ["h2"] : ["h4"];
  const headings = extractHeadings(html, allowedTags);
  const products = [];
  const seen = new Set();
  for (let i = 0; i < headings.length; i++) {
    const heading = headings[i];
    const segment = html.slice(heading.end, headings[i + 1]?.start ?? (heading.end + 3500));
    const text = htmlText(segment);
    if (!text || /cerca nel volantino|categorie|ultime ricette|scopri di piu/i.test(heading.title)) continue;

    let price = null;
    let regularPrice = null;
    if (source.id === "sole365") {
      const special = text.match(/a partire da\s*(?:prezzo speciale\s*)?€\s*([\d.]+,[\d]{2}|[\d]+\.[\d]{2})/i);
      const generic = text.match(/€\s*([\d.]+,[\d]{2}|[\d]+\.[\d]{2})/i);
      const sale = special || generic;
      if (sale) price = parseMoney(sale[1]);
      const regular = text.match(/prezzo di vendita\s*:?\s*€\s*([\d.]+,[\d]{2}|[\d]+\.[\d]{2})/i);
      if (regular) regularPrice = parseMoney(regular[1]);
    } else {
      const expiry = parseExpiry(text);
      if (!expiry || expiry < TODAY) continue;
      const priceMatches = [...text.matchAll(/(?:€\s*)?([\d]{1,3}(?:\.\d{3})*,[\d]{2}|[\d]+,[\d]{2})(?:\s*€)?/g)];
      if (priceMatches.length) price = parseMoney(priceMatches[0][1]);
    }
    if (price === null) continue;

    const qty = text.match(/\b(?:\d+(?:[,.]\d+)?\s?(?:kg|g|mg|ml|lt|l|cl)|x\s?\d+|\d+\s?(?:pezzi|pz))\b/i);
    const expiry = source.id === "rossetto" ? parseExpiry(text) : null;
    const key = normalize(heading.title) + "|" + (qty ? normalize(qty[0]) : "");
    if (seen.has(key)) continue;
    seen.add(key);
    products.push({
      id: source.id + ":" + key,
      supermarket: source.name,
      productName: heading.title,
      brand: "",
      quantity: qty ? qty[0] : "",
      price,
      regularPrice,
      priceStatus: source.id === "rossetto" ? "official_promotion_with_expiry" : "official_catalog_validity_unconfirmed",
      validUntil: expiry,
      sourceUrl: source.url,
      catalogSource: source.id === "rossetto" ? "Pagina prezzi ufficiale Rossetto" : "Catalogo ufficiale Sole 365",
      retrievedAt: NOW.toISOString(),
      sourceVerified: true
    });
  }
  return products.slice(0, 250);
}
async function fetchSource(source) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(source.url, {
      headers: { "User-Agent": "SmartSpesaOfficialCatalogSync/1.0 (+https://github.com/Thornles43/smartspesa)", "Accept": "text/html" },
      signal: controller.signal
    });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const reader = response.body.getReader();
    const chunks = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_SOURCE_BYTES) throw new Error("Risposta oltre il limite consentito");
      chunks.push(value);
    }
    const bytes = Buffer.concat(chunks);
    const html = new TextDecoder("utf-8").decode(bytes);
    const products = parseProducts(source, html);
    if (!products.length) throw new Error("Nessun prodotto con struttura e prezzo riconosciuti; non sovrascrivo il catalogo con dati vuoti");
    return { products, sourceStatus: { id: source.id, name: source.name, url: source.url, lastFetched: NOW.toISOString(), status: "ok", productCount: products.length } };
  } finally {
    clearTimeout(timer);
  }
}

let previous = { products: [], sources: [] };
try { previous = JSON.parse(await fs.readFile(OUT, "utf8")); } catch {}
const nextProducts = [];
const sourceStatuses = [];
for (const source of SOURCES) {
  try {
    const result = await fetchSource(source);
    nextProducts.push(...result.products);
    sourceStatuses.push(result.sourceStatus);
    console.log(source.id + ": " + result.products.length + " prodotti ufficiali acquisiti");
  } catch (error) {
    console.error(source.id + ": acquisizione non riuscita - " + String(error?.message || error));
    const oldProducts = (previous.products || []).filter(p => p.id && p.id.startsWith(source.id + ":"));
    nextProducts.push(...oldProducts);
    const oldStatus = (previous.sources || []).find(s => s.id === source.id);
    sourceStatuses.push({
      id: source.id, name: source.name, url: source.url,
      lastFetched: oldStatus?.lastFetched || null, status: "error",
      productCount: oldProducts.length, error: String(error?.message || error).slice(0, 240)
    });
  }
}
const output = { schemaVersion: 1, updatedAt: NOW.toISOString(), products: nextProducts, sources: sourceStatuses };
await fs.mkdir(path.dirname(OUT), { recursive: true });
await fs.writeFile(OUT, JSON.stringify(output, null, 2) + "\n", "utf8");
console.log("Scritto " + OUT + " con " + nextProducts.length + " prodotti totali.");
