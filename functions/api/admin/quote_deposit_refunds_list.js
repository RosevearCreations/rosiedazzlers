// Build 182 — admin list for quote deposit refund/partial-refund records.
import { requireStaffAccess, json, serviceHeaders, cleanText, isUuid, methodNotAllowed } from "../_lib/staff-auth.js";

const SELECT = [
  "id", "quote_deposit_payment_request_id", "quote_proposal_draft_id", "lead_id", "booking_id", "provider",
  "provider_refund_id", "provider_event_id", "provider_event_type", "refund_status", "refund_amount_cents", "currency", "reason", "refunded_at", "created_at", "updated_at"
].join(",");

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);
    if (!hasSupabaseConfig(env)) return withCors(json({ ok: true, table_ready: false, refunds: [], warning: "Supabase env vars are not configured." }));

    const params = new URLSearchParams();
    params.set("select", SELECT);
    params.set("order", "created_at.desc");
    params.set("limit", String(clampInt(body.limit, 1, 200, 50)));
    const requestId = cleanText(body.quote_deposit_payment_request_id || body.payment_request_id);
    if (isUuid(requestId)) params.set("quote_deposit_payment_request_id", `eq.${requestId}`);
    const provider = cleanText(body.provider);
    if (provider && provider !== "all") params.set("provider", `eq.${provider}`);

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_deposit_refund_records?${params.toString()}`, { headers: serviceHeaders(env) });
    const text = await res.text();
    const data = safeJson(text);
    if (!res.ok) return withCors(json({ ok: true, table_ready: false, refunds: [], warning: extractSupabaseError(data, text, "Could not load refund records."), migration_hint: "Apply sql/2026-05-26_build182_webhook_history_receipts_refunds.sql." }));
    return withCors(json({ ok: true, table_ready: true, refunds: Array.isArray(data) ? data : [] }));
  } catch (err) {
    return withCors(json({ ok: true, table_ready: false, refunds: [], warning: err?.message || "Could not load refund records." }));
  }
}
export async function onRequestGet(context) { return onRequestPost(context); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
export async function onRequestPut() { return withCors(methodNotAllowed()); }
function clampInt(value, min, max, fallback) { const n = Number(value); return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.floor(n))) : fallback; }
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
function extractSupabaseError(data, text, fallback) { if (data?.message) return data.message; if (typeof text === "string" && text.trim()) return text.slice(0, 300); return fallback; }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
