// Build 184 — queue/re-queue a customer quote-deposit receipt email.
import { requireStaffAccess, json, serviceHeaders, cleanText, isUuid } from "../_lib/staff-auth.js";
import { queueQuoteDepositReceiptEmail } from "../_lib/quote-payment-events.js";

const REQUEST_SELECT = [
  "id", "quote_proposal_draft_id", "lead_id", "booking_id", "confirmed_booking_id", "provider", "payment_status", "amount_cents", "paid_amount_cents", "currency", "customer_name", "customer_email", "payment_reference", "external_checkout_id", "public_payment_url", "receipt_email_status", "receipt_email_queued_at", "receipt_notification_event_id"
].join(",");

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return access.response;
    if (!hasSupabaseConfig(env)) return json({ ok: false, error: "Supabase service configuration is missing." }, 500);
    const id = cleanText(body.payment_request_id || body.quote_deposit_payment_request_id || body.id);
    if (!isUuid(id)) return json({ ok: false, error: "Valid payment_request_id is required." }, 400);
    const paymentRequest = await loadPaymentRequest(env, id);
    if (!paymentRequest) return json({ ok: false, error: "Quote deposit/payment request was not found." }, 404);
    if (!paymentRequest.customer_email) return json({ ok: false, error: "Payment request has no customer email for a receipt." }, 400);
    const result = await queueQuoteDepositReceiptEmail(env, paymentRequest, { provider: paymentRequest.provider, paidAmountCents: paymentRequest.paid_amount_cents || paymentRequest.amount_cents, paymentReference: paymentRequest.payment_reference || paymentRequest.external_checkout_id || paymentRequest.id });
    return json({ ok: result.ok === true, receipt: result, payment_request: paymentRequest, next_step: result.ok ? "Receipt email was queued for notification processing." : "Receipt email could not be queued; review notification_events schema/provider settings." }, result.ok ? 200 : 500);
  } catch (err) {
    return json({ ok: false, error: err?.message || "Could not queue receipt email." }, 500);
  }
}
async function loadPaymentRequest(env, id) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_deposit_payment_requests?select=${encodeURIComponent(REQUEST_SELECT)}&id=eq.${encodeURIComponent(id)}&limit=1`, { headers: serviceHeaders(env) });
  const rows = res.ok ? await res.json().catch(() => []) : [];
  return Array.isArray(rows) ? rows[0] || null : null;
}
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
