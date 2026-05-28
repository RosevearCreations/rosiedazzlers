// Build 180 — public read-only quote deposit/payment request endpoint.
import { json, serviceHeaders, cleanText, isUuid, methodNotAllowed } from "./_lib/staff-auth.js";

const REQUEST_SELECT = [
  "id", "quote_proposal_draft_id", "booking_id", "status", "payment_status", "provider", "provider_status", "amount_cents", "currency", "customer_name", "customer_email", "public_payment_url", "checkout_url", "public_note", "requested_at", "paid_at", "booking_confirmed_at"
].join(",");
const QUOTE_SELECT = ["id", "title", "body", "pricing_note", "customer_name", "customer_email", "acceptance_status"].join(",");

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const requestId = cleanText(url.searchParams.get("request_id") || url.searchParams.get("id"));
    const token = cleanText(url.searchParams.get("token"));
    if (!isUuid(requestId)) return withCors(json({ ok: false, error: "Valid request_id is required." }, 400));
    if (!token && !url.searchParams.get("payment")) return withCors(json({ ok: false, error: "Secure token is required." }, 400));
    if (!hasSupabaseConfig(env)) return withCors(json({ ok: false, error: "Payment request storage is not configured yet." }, 503));

    const row = await loadPaymentRequest(env, requestId);
    if (!row) return withCors(json({ ok: false, error: "Payment request was not found." }, 404));
    if (token) {
      const tokenHash = await sha256Hex(token);
      const verified = await verifyToken(env, requestId, tokenHash);
      if (!verified) return withCors(json({ ok: false, error: "Payment request token is invalid or expired." }, 403));
    }

    const quote = row.quote_proposal_draft_id ? await loadQuote(env, row.quote_proposal_draft_id).catch(() => null) : null;
    return withCors(json({
      ok: true,
      payment_request: publicRequest(row),
      quote: quote ? publicQuote(quote) : null,
      payment_returned: url.searchParams.get("payment") === "returned",
      message: row.payment_status === "paid" ? "Deposit has been marked paid." : "Review the deposit request and use the provided payment option."
    }));
  } catch (err) {
    return withCors(json({ ok: false, error: err?.message || "Could not load quote payment request." }, 500));
  }
}

export async function onRequestPost() { return withCors(methodNotAllowed()); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

async function loadPaymentRequest(env, id) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_deposit_payment_requests?select=${encodeURIComponent(REQUEST_SELECT)}&id=eq.${encodeURIComponent(id)}&limit=1`, { headers: serviceHeaders(env) });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not load payment request."));
  return Array.isArray(data) ? data[0] || null : null;
}
async function verifyToken(env, id, tokenHash) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_deposit_payment_requests?select=id&id=eq.${encodeURIComponent(id)}&token_hash=eq.${encodeURIComponent(tokenHash)}&limit=1`, { headers: serviceHeaders(env) });
  const data = res.ok ? await res.json().catch(() => []) : [];
  return Array.isArray(data) && data.length > 0;
}
async function loadQuote(env, id) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_proposal_drafts?select=${encodeURIComponent(QUOTE_SELECT)}&id=eq.${encodeURIComponent(id)}&limit=1`, { headers: serviceHeaders(env) });
  const data = res.ok ? await res.json().catch(() => []) : [];
  return Array.isArray(data) ? data[0] || null : null;
}
function publicRequest(row) { const { token_hash, internal_note, ...safe } = row || {}; return safe; }
function publicQuote(row) { return { title: row.title || "Rosie Dazzlers quote", body: row.body || "", pricing_note: row.pricing_note || "", customer_name: row.customer_name || "", acceptance_status: row.acceptance_status || "" }; }
async function sha256Hex(value) { const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(value || ""))); return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join(""); }
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
function extractSupabaseError(data, text, fallback) { if (data?.message) return data.message; if (typeof text === "string" && text.trim()) return text.slice(0, 300); return fallback; }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
