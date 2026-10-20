/**
 * SmartSpesa — Cloudflare Worker proxy for Overpass API.
 *
 * Deploy as a Cloudflare Worker, then set:
 *   window.SMARTSPESA_OVERPASS_PROXY_URL = "https://YOUR-WORKER.YOUR-SUBDOMAIN.workers.dev"
 * before the Firebase module script in index.html.
 *
 * This proxy reduces browser CORS variability; it cannot guarantee Overpass availability.
 */
const ALLOWED_ORIGINS = new Set([
  "https://thornles43.github.io",
  "http://localhost:8788",
  "http://127.0.0.1:8788"
]);
const UPSTREAMS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter"
];

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const corsOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "https://thornles43.github.io";
    const headers = {
      "Access-Control-Allow-Origin": corsOrigin,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin"
    };

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "GET") return new Response("Method not allowed", { status: 405, headers });

    const data = url.searchParams.get("data") || "";
    // Accept only the nearby-shop Overpass query shape used by SmartSpesa.
    if (data.length > 2500 || !data.includes("[out:json]") ||
        !/around:\d{3,5},-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?/.test(data) ||
        !data.includes('["shop"')) {
      return new Response(JSON.stringify({ error: "Invalid Overpass query" }), {
        status: 400, headers: { ...headers, "Content-Type": "application/json; charset=utf-8" }
      });
    }

    let lastError = "Overpass unavailable";
    for (const upstream of UPSTREAMS) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);
      try {
        const target = upstream + "?data=" + encodeURIComponent(data);
        const response = await fetch(target, {
          method: "GET",
          headers: { "Accept": "application/json", "User-Agent": "SmartSpesa/1.0 (nearby supermarket search)" },
          signal: controller.signal
        });
        if (!response.ok) {
          lastError = "Overpass returned HTTP " + response.status;
          continue;
        }
        const body = await response.text();
        let parsed;
        try { parsed = JSON.parse(body); } catch { lastError = "Invalid JSON from Overpass"; continue; }
        return new Response(JSON.stringify(parsed), {
          status: 200,
          headers: { ...headers, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=60" }
        });
      } catch (error) {
        lastError = error?.name === "AbortError" ? "Overpass timed out" : "Overpass request failed";
      } finally {
        clearTimeout(timeout);
      }
    }
    return new Response(JSON.stringify({ error: lastError }), {
      status: 502, headers: { ...headers, "Content-Type": "application/json; charset=utf-8" }
    });
  }
};
