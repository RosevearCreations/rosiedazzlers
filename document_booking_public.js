import { loadBookingDocumentPayloadByToken } from "./_lib/booking-documents.js";

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const token = String(url.searchParams.get("token") || "").trim();
    if (!token) return withCors(json({ error: "Missing token." }, 400));
    const payload = await loadBookingDocumentPayloadByToken(env, token);
    if (!payload) return withCors(json({ error: "Document not found." }, 404));
    return withCors(json({ ok: true, document: payload }));
  } catch (err) {
    return withCors(json({ error: err?.message || "Unexpected server error." }, 500));
  }
}

export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
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
