/**
 * SmartSpesa — secure AI helper for product ranking and receipt OCR cleanup.
 *
 * Deploy as a Cloudflare Worker. Required:
 *   Secret: OPENAI_API_KEY
 *   Variable: FIREBASE_WEB_API_KEY
 * Optional:
 *   OPENAI_MODEL (defaults to gpt-4.1-mini)
 *
 * Receipt output is only a draft and must be reviewed before saving.
 */
const ALLOWED_ORIGINS = new Set([
  "https://thornles43.github.io",
  "http://localhost:8788",
  "http://127.0.0.1:8788"
]);
const MAX_BODY_CHARS = 22000;
const MAX_CANDIDATES = 20;

function json(data, status, corsHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });
}

async function verifyFirebaseIdToken(token, apiKey) {
  if (!token || !apiKey) return false;
  const response = await fetch(
    "https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=" + encodeURIComponent(apiKey),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token })
    }
  );
  if (!response.ok) return false;
  const result = await response.json();
  return Boolean(result && Array.isArray(result.users) && result.users[0] && result.users[0].localId);
}

function getOutputText(response) {
  const parts = [];
  for (const item of (response.output || [])) {
    for (const part of (item.content || [])) {
      if (part.type === "output_text" && typeof part.text === "string") parts.push(part.text);
    }
  }
  return parts.join("\n").trim();
}

async function callOpenAI(env, instructions, input, schemaName, schema, maxTokens = 1200) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + env.OPENAI_API_KEY,
        "Content-Type": "application/json"
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: env.OPENAI_MODEL || "gpt-4.1-mini",
        store: false,
        max_output_tokens: maxTokens,
        instructions,
        input: [{ role: "user", content: [{ type: "input_text", text: input }] }],
        text: {
          format: {
            type: "json_schema",
            name: schemaName,
            strict: true,
            schema
          }
        }
      })
    });
    if (!response.ok) throw new Error("AI provider unavailable");
    const payload = await response.json();
    const output = getOutputText(payload);
    if (!output) throw new Error("Empty AI response");
    return JSON.parse(output);
  } finally {
    clearTimeout(timeout);
  }
}

const rankingSchema = {
  type: "object",
  properties: { rankedIds: { type: "array", items: { type: "string" } } },
  required: ["rankedIds"],
  additionalProperties: false
};

const receiptSchema = {
  type: "object",
  properties: {
    rows: {
      type: "array",
      items: {
        type: "object",
        properties: {
          productName: { type: "string" },
          price: { type: "string" }
        },
        required: ["productName", "price"],
        additionalProperties: false
      }
    }
  },
  required: ["rows"],
  additionalProperties: false
};

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const corsOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "";
    const corsHeaders = {
      "Access-Control-Allow-Origin": corsOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin"
    };

    if (!corsOrigin) return json({ error: "Origin not allowed" }, 403, corsHeaders);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, corsHeaders);
    if (!env.OPENAI_API_KEY || !env.FIREBASE_WEB_API_KEY) {
      return json({ error: "AI service is not configured" }, 503, corsHeaders);
    }

    const authorization = request.headers.get("Authorization") || "";
    const tokenMatch = authorization.match(/^Bearer\s+(.+)$/i);
    if (!tokenMatch || !(await verifyFirebaseIdToken(tokenMatch[1], env.FIREBASE_WEB_API_KEY))) {
      return json({ error: "Authentication required" }, 401, corsHeaders);
    }

    let body;
    try {
      const raw = await request.text();
      if (raw.length > MAX_BODY_CHARS) return json({ error: "Request too large" }, 413, corsHeaders);
      body = JSON.parse(raw);
    } catch {
      return json({ error: "Invalid JSON" }, 400, corsHeaders);
    }

    const task = String(body.task || "rank_products");
    try {
      if (task === "receipt_parse") {
        const extractedText = String(body.extractedText || "").trim().slice(0, 12000);
        const localRows = Array.isArray(body.localRows) ? body.localRows.slice(0, 150).map(row => ({
          productName: String(row.productName || "").trim().slice(0, 180),
          price: String(row.price || "").trim().slice(0, 20)
        })) : [];
        if (extractedText.length < 5) return json({ rows: localRows, usedAI: false }, 200, corsHeaders);
        const parsed = await callOpenAI(
          env,
          "Sei un assistente di estrazione dati per scontrini italiani. Il testo fornito proviene da OCR e può contenere errori. Estrai esclusivamente righe di prodotti realmente presenti nel testo, con il prezzo della singola riga. Usa localRows come suggerimento, non come verità assoluta. Non includere totale, subtotale, IVA, pagamenti, resto, sconti complessivi, punti fedeltà, date o dati fiscali. Non inventare nomi o prezzi, non calcolare prezzi mancanti e non confondere quantità, codici o percentuali con importi. Conserva il prezzo scritto quando non è possibile correggerlo con certezza. Restituisci prezzi in formato decimale italiano, per esempio 1,29. Il risultato è una bozza che sarà verificata dall'utente.",
          JSON.stringify({ extractedText, localRows }),
          "smartspesa_receipt_rows",
          receiptSchema,
          1800
        );
        const rows = (Array.isArray(parsed.rows) ? parsed.rows : []).map(row => {
          const productName = String(row.productName || "").trim().slice(0, 180);
          const price = String(row.price || "").trim().slice(0, 20);
          const normalizedPrice = price.replace(/€/g, "").replace(/\s/g, "");
          const validPrice = /^(?:\d{1,3}(?:\.\d{3})*|\d{1,6})[,.]\d{2}$/.test(normalizedPrice);
          return { productName, price: normalizedPrice, validPrice };
        }).filter(row => row.productName.length >= 3 && row.validPrice)
          .map(row => ({ productName: row.productName, price: row.price.replace(".", ",") }))
          .slice(0, 150);
        return json({ rows, usedAI: true }, 200, corsHeaders);
      }

      if (task !== "rank_products") return json({ error: "Unsupported task" }, 400, corsHeaders);
      const query = String(body.query || "").trim().slice(0, 120);
      const supermarket = String(body.supermarket || "").trim().slice(0, 100);
      const candidates = Array.isArray(body.candidates) ? body.candidates.slice(0, MAX_CANDIDATES) : [];
      const safeCandidates = candidates.map((item, index) => ({
        id: String(item.id ?? index).slice(0, 20),
        name: String(item.name || "").trim().slice(0, 160),
        brand: String(item.brand || "").trim().slice(0, 80),
        quantity: String(item.quantity || "").trim().slice(0, 50),
        supermarket: String(item.supermarket || "").trim().slice(0, 100)
      })).filter(item => item.name && item.supermarket);
      if (query.length < 2 || safeCandidates.length < 2) {
        return json({ rankedIds: safeCandidates.map(item => item.id), usedAI: false }, 200, corsHeaders);
      }
      const parsed = await callOpenAI(
        env,
        "Sei il motore di ordinamento della ricerca prodotti di SmartSpesa. Ordina esclusivamente gli ID dei prodotti forniti, dal più pertinente al meno pertinente rispetto alla query italiana. Considera errori di battitura, sinonimi comuni, marca e formato. Rispetta il supermercato selezionato. Non inventare, modificare o aggiungere prodotti, prezzi, disponibilità o insegne. Restituisci tutti gli ID ricevuti una sola volta.",
        JSON.stringify({ query, supermarket, candidates: safeCandidates }),
        "smartspesa_product_ranking",
        rankingSchema,
        350
      );
      const allowedIds = new Set(safeCandidates.map(item => item.id));
      const ranked = Array.isArray(parsed.rankedIds) ? parsed.rankedIds.map(String).filter(id => allowedIds.has(id)) : [];
      const unique = [...new Set(ranked)];
      for (const item of safeCandidates) if (!unique.includes(item.id)) unique.push(item.id);
      return json({ rankedIds: unique, usedAI: true }, 200, corsHeaders);
    } catch {
      return json({ error: "AI request failed" }, 502, corsHeaders);
    }
  }
};
