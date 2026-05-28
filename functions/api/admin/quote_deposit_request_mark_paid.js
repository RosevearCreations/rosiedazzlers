// Build 180 — staff records a quote deposit as paid and confirms/links booking when possible.
import { requireStaffAccess, json, serviceHeaders, cleanText, isUuid, methodNotAllowed } from "../_lib/staff-auth.js";

const SELECT = [
  "id", "quote_proposal_draft_id", "lead_id", "lead_conversion_draft_id", "booking_id", "confirmed_booking_id",
  "status", "payment_status", "provider", "amount_cents", "currency", "customer_name", "customer_email", "paid_at", "booking_confirmed_at"
].join(",");

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);
    if (!hasSupabaseConfig(env)) return withCors(json({ ok: false, error: "Supabase service configuration is missing.", migration_hint: "Apply Build 180 SQL before marking quote deposits paid." }, 500));

    const requestId = cleanText(body.payment_request_id || body.request_id || body.id);
    if (!isUuid(requestId)) return withCors(json({ ok: false, error: "Valid payment_request_id is required." }, 400));

    const row = await loadPaymentRequest(env, requestId);
    if (!row) return withCors(json({ ok: false, error: "Deposit/payment request was not found." }, 404));

    const paidAmountCents = moneyToCents(body.paid_amount_cents ?? body.amount_cents ?? body.paid_amount ?? row.amount_cents);
    if (!(paidAmountCents > 0)) return withCors(json({ ok: false, error: "Paid amount must be greater than zero." }, 400));
    const paymentMethod = cleanText(body.payment_method || row.provider || "manual");
    const paymentReference = cleanText(body.payment_reference || body.reference || "manual staff confirmation");
    const now = new Date().toISOString();
    const bookingId = cleanText(body.booking_id || row.booking_id || row.confirmed_booking_id || await convertedBookingId(env, row.lead_conversion_draft_id));
    const confirmedBookingId = bookingId && isUuid(bookingId) ? bookingId : null;

    const patch = {
      status: confirmedBookingId ? "paid_booking_confirmed" : "paid_needs_booking",
      payment_status: "paid",
      paid_amount_cents: paidAmountCents,
      paid_at: now,
      payment_method: paymentMethod,
      payment_reference: paymentReference,
      confirmed_booking_id: confirmedBookingId,
      booking_confirmed_at: confirmedBookingId ? now : null,
      updated_at: now,
      updated_by_staff_user_id: access.actor?.id && isUuid(access.actor.id) ? access.actor.id : null
    };

    const updated = await patchPaymentRequest(env, row.id, patch);
    await Promise.all([
      patchQuoteDraft(env, row.quote_proposal_draft_id, { deposit_request_status: patch.status, deposit_paid_at: now, final_booking_id: confirmedBookingId, final_booking_confirmed_at: confirmedBookingId ? now : null, status: confirmedBookingId ? "accepted" : "accepted_deposit_paid", updated_at: now }).catch(() => null),
      patchConversion(env, row.lead_conversion_draft_id, { status: confirmedBookingId ? "converted" : "ready_to_book", updated_at: now }).catch(() => null),
      confirmedBookingId ? confirmBooking(env, confirmedBookingId, row, { paidAmountCents, paymentMethod, paymentReference, actor: access.actor }).catch(() => null) : null
    ]);

    return withCors(json({ ok: true, payment_request: updated, booking_confirmed: !!confirmedBookingId, booking_id: confirmedBookingId, next_step: confirmedBookingId ? "Deposit recorded and booking confirmation linked." : "Deposit recorded. Create or link the final booking to complete confirmation." }));
  } catch (err) {
    return withCors(json({ ok: false, error: err?.message || "Could not mark deposit request paid.", migration_hint: "Apply sql/2026-05-26_build180_quote_deposit_booking_confirmation.sql before confirming quote deposits." }, 500));
  }
}

export async function onRequestGet() { return withCors(methodNotAllowed()); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

async function loadPaymentRequest(env, id) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_deposit_payment_requests?select=${encodeURIComponent(SELECT)}&id=eq.${encodeURIComponent(id)}&limit=1`, { headers: serviceHeaders(env) });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not load deposit/payment request."));
  return Array.isArray(data) ? data[0] || null : null;
}
async function convertedBookingId(env, conversionId) {
  if (!conversionId || !isUuid(conversionId)) return null;
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/lead_conversion_drafts?select=converted_booking_id&id=eq.${encodeURIComponent(conversionId)}&limit=1`, { headers: serviceHeaders(env) });
  const data = res.ok ? await res.json().catch(() => []) : [];
  return Array.isArray(data) ? data[0]?.converted_booking_id || null : null;
}
async function patchPaymentRequest(env, id, patch) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_deposit_payment_requests?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: { ...serviceHeaders(env), Prefer: "return=representation" }, body: JSON.stringify(patch) });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not update deposit/payment request."));
  return Array.isArray(data) ? data[0] || null : data;
}
async function patchQuoteDraft(env, id, patch) { if (!id) return; await fetch(`${env.SUPABASE_URL}/rest/v1/quote_proposal_drafts?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: serviceHeaders(env), body: JSON.stringify(patch) }); }
async function patchConversion(env, id, patch) { if (!id) return; await fetch(`${env.SUPABASE_URL}/rest/v1/lead_conversion_drafts?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: serviceHeaders(env), body: JSON.stringify(patch) }); }
async function confirmBooking(env, bookingId, row, details) {
  await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}`, { method: "PATCH", headers: serviceHeaders(env), body: JSON.stringify({ status: "confirmed", payment_provider: details.paymentMethod || row.provider || "manual", deposit_cents: details.paidAmountCents, updated_at: new Date().toISOString() }) });
  await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`, { method: "POST", headers: serviceHeaders(env), body: JSON.stringify([{ booking_id: bookingId, event_type: "booking_finance_deposit", actor_name: details.actor?.full_name || details.actor?.email || "Staff", event_note: `Quote deposit ${formatMoney(details.paidAmountCents)} recorded via ${details.paymentMethod || "manual"}.`, payload: { entry_type: "deposit", amount_cad: Math.round(details.paidAmountCents) / 100, payment_method: details.paymentMethod || null, payment_reference: details.paymentReference || null, quote_deposit_payment_request_id: row.id, quote_proposal_draft_id: row.quote_proposal_draft_id } }]) });
}
function moneyToCents(value) { if (value === null || value === undefined || value === "") return 0; const raw = Number(value); if (!Number.isFinite(raw) || raw < 0) return 0; return Math.round(raw > 9999 ? raw : raw * 100); }
function formatMoney(cents) { return `$${(Number(cents || 0) / 100).toFixed(2)} CAD`; }
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
function extractSupabaseError(data, text, fallback) { if (data?.message) return data.message; if (typeof text === "string" && text.trim()) return text.slice(0, 300); return fallback; }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
