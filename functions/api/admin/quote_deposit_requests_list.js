// Build 180 — list quote deposit/payment requests for admin follow-up.
import { requireStaffAccess, json, serviceHeaders, cleanText, isUuid, methodNotAllowed } from "../_lib/staff-auth.js";

const SELECT = [
  "id", "quote_proposal_draft_id", "lead_id", "lead_conversion_draft_id", "booking_id", "confirmed_booking_id",
  "status", "payment_status", "provider", "provider_status", "amount_cents", "currency", "customer_name", "customer_email",
  "public_payment_url", "checkout_url", "external_checkout_id", "public_note", "internal_note", "requested_at", "paid_at", "booking_confirmed_at", "created_at", "updated_at"
].join(",");

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);
    if (!hasSupabaseConfig(env)) return withCors(json({ ok: true, table_ready: false, requests: [], warning: "Supabase env vars are not configured.", migration_hint: "Apply Build 180 SQL before listing quote deposit requests." }));

    const params = new URLSearchParams();
    params.set("select", SELECT);
    params.set("order", "updated_at.desc");
    params.set("limit", String(clampInt(body.limit, 1, 100, 25)));
    const fields = ["id", "quote_proposal_draft_id", "lead_id", "lead_conversion_draft_id", "booking_id"];
    for (const field of fields) {
      const value = cleanText(body[field] || (field === "quote_proposal_draft_id" ? body.draft_id : ""));
      if (value && isUuid(value)) params.set(field, `eq.${value}`);
    }
    const status = cleanText(body.status);
    if (status && status !== "all") params.set("status", `eq.${status}`);

    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_deposit_payment_requests?${params.toString()}`, { headers: serviceHeaders(env) });
    const text = await res.text();
    const data = safeJson(text);
    if (!res.ok) return withCors(json({ ok: true, table_ready: false, requests: [], warning: extractSupabaseError(data, text, "Could not load quote deposit requests."), migration_hint: "Apply sql/2026-05-26_build180_quote_deposit_booking_confirmation.sql." }));
    return withCors(json({ ok: true, table_ready: true, requests: Array.isArray(data) ? data : [] }));
  } catch (err) {
    return withCors(json({ ok: true, table_ready: false, requests: [], warning: err?.message || "Could not load quote deposit requests.", migration_hint: "Apply Build 180 SQL before listing quote deposit requests." }));
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
