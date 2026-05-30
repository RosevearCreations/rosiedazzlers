// Build 182 — staff refund/partial-refund tracking for quote deposit/payment requests.
import { requireStaffAccess, json, cleanText, isUuid, methodNotAllowed } from "../_lib/staff-auth.js";
import { recordQuoteDepositRefund } from "../_lib/quote-payment-events.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);
    if (!hasSupabaseConfig(env)) return withCors(json({ ok: false, error: "Supabase service configuration is missing." }, 500));
    const paymentRequestId = cleanText(body.payment_request_id || body.quote_deposit_payment_request_id || body.id);
    if (!isUuid(paymentRequestId)) return withCors(json({ ok: false, error: "Valid payment_request_id is required." }, 400));
    const amount = Number(body.refund_amount_cents ?? body.amount_cents ?? body.refund_amount ?? body.amount ?? 0);
    if (!(amount > 0)) return withCors(json({ ok: false, error: "Refund amount must be greater than zero." }, 400));
    const tracked = await recordQuoteDepositRefund(env, {
      payment_request_id: paymentRequestId,
      provider: cleanText(body.provider || "manual") || "manual",
      provider_refund_id: cleanText(body.provider_refund_id || body.reference || `manual-${Date.now()}`),
      provider_event_id: cleanText(body.provider_event_id || "") || null,
      provider_event_type: cleanText(body.provider_event_type || "staff.manual_refund_recorded"),
      refund_amount_cents: amount,
      currency: cleanText(body.currency || "CAD"),
      refund_status: cleanText(body.refund_status || "succeeded"),
      reason: cleanText(body.reason || `Recorded by ${access.actor?.full_name || access.actor?.email || "staff"}`),
      provider_payload: { source: "admin_refund_save", actor_id: access.actor?.id || null, note: cleanText(body.note || "") || null }
    });
    return withCors(json(tracked, tracked.ok ? 200 : tracked.status || 500));
  } catch (err) {
    return withCors(json({ ok: false, error: err?.message || "Could not save refund record." }, 500));
  }
}
export async function onRequestGet() { return withCors(methodNotAllowed()); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
