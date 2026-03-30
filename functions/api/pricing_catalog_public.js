import { loadPricingCatalog } from "./_lib/pricing-catalog.js";

export async function onRequestGet(context) {
  const { env } = context;
  try {
    const catalog = await loadPricingCatalog(env);
    return withCors(json({
      ok: true,
      charts: Array.isArray(catalog.charts) ? catalog.charts : [],
      packages: Array.isArray(catalog.packages) ? catalog.packages : [],
      addons: Array.isArray(catalog.addons) ? catalog.addons : [],
      source: env?.SUPABASE_URL && env?.SUPABASE_SERVICE_ROLE_KEY ? "db_or_fallback" : "fallback"
    }));
  } catch (err) {
    return withCors(json({ error: err?.message || "Could not load pricing catalog." }, 500));
  }
}

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store"
  };
}

function withCors(response) {
  const headers = new Headers(response.headers || {});
  for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
