// Build 181 — shared quote deposit/payment settlement helpers.
// Build 274 hardening: provider settlement amounts entering this helper are explicit integer cents.
// Used by verified Stripe/PayPal webhooks and staff/manual confirmation flows.

import { queueOrderConfirmationNotification } from "./booking-documents.js";
import { normalizeCents, providerMoneyToCents } from "./payment-money.js";

const PAYMENT_SELECT = [
  "id", "quote_proposal_draft_id", "lead_id", "lead_conversion_draft_id", "booking_id", "confirmed_booking_id",
  "status", "payment_status", "provider", "amount_cents", "paid_amount_cents", "currency", "customer_name", "customer_email",
  "external_checkout_id", "payment_reference", "paid_at", "booking_confirmed_at"
].join(",");

export function serviceHeaders(env) {
  const key = getServiceKey(env);
  if (!key) throw new Error("Missing Supabase service-role key.");
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Accept: "application/json" };
}

export function hasSupabaseConfig(env) {
  return !!(env?.SUPABASE_URL && getServiceKey(env));
}

export function getServiceKey(env) {
  return String(env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY || "").trim();
}

export async function findQuoteDepositPaymentRequest(env, lookup = {}) {
  if (!hasSupabaseConfig(env)) throw new Error("Supabase service configuration is missing.");
  const id = cleanText(lookup.paymentRequestId || lookup.quoteDepositPaymentRequestId || lookup.id);
  if (isUuid(id)) return loadPaymentRequestByQuery(env, `id=eq.${encodeURIComponent(id)}`);

  const checkoutId = cleanText(lookup.externalCheckoutId || lookup.stripeCheckoutSessionId || lookup.paypalOrderId || lookup.orderId);
  if (checkoutId) return loadPaymentRequestByQuery(env, `external_checkout_id=eq.${encodeURIComponent(checkoutId)}`);

  const tokenHash = cleanText(lookup.tokenHash);
  if (tokenHash) return loadPaymentRequestByQuery(env, `token_hash=eq.${encodeURIComponent(tokenHash)}`);

  return null;
}

async function loadPaymentRequestByQuery(env, query) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_deposit_payment_requests?select=${encodeURIComponent(PAYMENT_SELECT)}&${query}&limit=1`, { headers: serviceHeaders(env) });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not load quote deposit/payment request."));
  return Array.isArray(data) ? data[0] || null : null;
}

export async function markQuoteDepositPaidFromProvider({
  env,
  paymentRequestId,
  externalCheckoutId,
  provider,
  paidAmountCents,
  paymentReference,
  providerPaymentIntentId,
  providerOrderId,
  providerCaptureId,
  providerEventId,
  providerEventType,
  providerPayload,
  actorName = "Verified payment webhook"
}) {
  const row = await findQuoteDepositPaymentRequest(env, { paymentRequestId, externalCheckoutId });
  if (!row) {
    return { ok: false, status: 404, error: "Quote deposit/payment request was not found.", payment_request: null };
  }

  const now = new Date().toISOString();
  const sourcePaidCents = paidAmountCents === null || paidAmountCents === undefined || paidAmountCents === ""
    ? row.amount_cents
    : paidAmountCents;
  const paidCents = normalizeCents(sourcePaidCents);
  const expectedCents = normalizeCents(row.amount_cents);
  if (!(paidCents > 0)) {
    return { ok: false, status: 400, error: "Verified payment amount must be greater than zero.", payment_request: row };
  }
  if (expectedCents > 0 && paidCents !== expectedCents) {
    return {
      ok: false,
      status: 409,
      error: "Verified provider payment amount does not match the quote deposit request.",
      expected_cents: expectedCents,
      paid_cents: paidCents,
      payment_request: row
    };
  }

  const bookingId = cleanText(row.booking_id || row.confirmed_booking_id || await convertedBookingId(env, row.lead_conversion_draft_id));
  const confirmedBookingId = isUuid(bookingId) ? bookingId : null;
  const normalizedProvider = cleanText(provider || row.provider || "provider").toLowerCase();
  const reference = cleanText(paymentReference || providerPaymentIntentId || providerCaptureId || externalCheckoutId || providerEventId || "verified webhook payment");

  if (row.payment_status === "paid" && row.paid_at) {
    const maybeBooking = confirmedBookingId ? await confirmBookingFromDeposit(env, confirmedBookingId, row, { paidAmountCents: paidCents, provider: normalizedProvider, paymentReference: reference, actorName }).catch(() => null) : null;
    return { ok: true, idempotent: true, payment_request: row, booking_confirmed: !!confirmedBookingId, booking_id: confirmedBookingId, notification: maybeBooking?.notification || null };
  }

  const extendedPatch = {
    status: confirmedBookingId ? "paid_booking_confirmed" : "paid_needs_booking",
    payment_status: "paid",
    paid_amount_cents: paidCents,
    paid_at: now,
    payment_method: normalizedProvider,
    payment_reference: reference,
    provider: normalizedProvider === "paypal" ? "paypal" : (normalizedProvider === "stripe" ? "stripe" : row.provider || normalizedProvider),
    provider_status: "verified_webhook_paid",
    confirmed_booking_id: confirmedBookingId,
    booking_confirmed_at: confirmedBookingId ? now : null,
    webhook_verified_at: now,
    webhook_processed_at: now,
    provider_event_id: providerEventId || null,
    provider_event_type: providerEventType || null,
    provider_payment_intent_id: providerPaymentIntentId || null,
    provider_order_id: providerOrderId || null,
    provider_capture_id: providerCaptureId || null,
    provider_payload: providerPayload || null,
    updated_at: now
  };

  const minimalPatch = {
    status: extendedPatch.status,
    payment_status: "paid",
    paid_amount_cents: paidCents,
    paid_at: now,
    payment_method: normalizedProvider,
    payment_reference: reference,
    provider_status: "verified_webhook_paid",
    confirmed_booking_id: confirmedBookingId,
    booking_confirmed_at: confirmedBookingId ? now : null,
    updated_at: now
  };

  const updated = await patchPaymentRequestWithFallback(env, row.id, extendedPatch, minimalPatch);

  await Promise.all([
    patchQuoteDraft(env, row.quote_proposal_draft_id, {
      deposit_request_status: extendedPatch.status,
      deposit_paid_at: now,
      final_booking_id: confirmedBookingId,
      final_booking_confirmed_at: confirmedBookingId ? now : null,
      status: confirmedBookingId ? "accepted" : "accepted_deposit_paid",
      updated_at: now
    }).catch(() => null),
    patchConversion(env, row.lead_conversion_draft_id, {
      status: confirmedBookingId ? "converted" : "ready_to_book",
      updated_at: now
    }).catch(() => null)
  ]);

  const bookingResult = confirmedBookingId
    ? await confirmBookingFromDeposit(env, confirmedBookingId, { ...row, ...updated }, { paidAmountCents: paidCents, provider: normalizedProvider, paymentReference: reference, actorName }).catch((err) => ({ ok: false, error: err?.message || "Booking confirmation failed." }))
    : null;

  return {
    ok: true,
    payment_request: updated,
    booking_confirmed: !!confirmedBookingId,
    booking_id: confirmedBookingId,
    notification: bookingResult?.notification || null,
    next_step: confirmedBookingId ? "Provider payment verified and booking confirmation linked." : "Provider payment verified. Create or link the final booking to complete confirmation."
  };
}

async function patchPaymentRequestWithFallback(env, id, extendedPatch, minimalPatch) {
  const first = await patchPaymentRequest(env, id, extendedPatch, { tolerate: true });
  if (first.ok) return first.row;
  const message = String(first.error || "").toLowerCase();
  if (message.includes("column") || message.includes("schema cache") || message.includes("could not find") || message.includes("constraint")) {
    const second = await patchPaymentRequest(env, id, minimalPatch, { tolerate: false });
    return second.row;
  }
  throw new Error(first.error || "Could not update quote deposit/payment request.");
}

async function patchPaymentRequest(env, id, patch, { tolerate = false } = {}) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_deposit_payment_requests?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { ...serviceHeaders(env), Prefer: "return=representation" },
    body: JSON.stringify(patch)
  });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) {
    const error = extractSupabaseError(data, text, "Could not update quote deposit/payment request.");
    if (tolerate) return { ok: false, error, status: res.status };
    throw new Error(error);
  }
  return { ok: true, row: Array.isArray(data) ? data[0] || null : data };
}

async function patchQuoteDraft(env, id, patch) {
  if (!id) return;
  await fetch(`${env.SUPABASE_URL}/rest/v1/quote_proposal_drafts?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: serviceHeaders(env), body: JSON.stringify(patch) });
}

async function patchConversion(env, id, patch) {
  if (!id) return;
  await fetch(`${env.SUPABASE_URL}/rest/v1/lead_conversion_drafts?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", headers: serviceHeaders(env), body: JSON.stringify(patch) });
}

async function convertedBookingId(env, conversionId) {
  if (!conversionId || !isUuid(conversionId)) return null;
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/lead_conversion_drafts?select=converted_booking_id&id=eq.${encodeURIComponent(conversionId)}&limit=1`, { headers: serviceHeaders(env) });
  const data = res.ok ? await res.json().catch(() => []) : [];
  return Array.isArray(data) ? data[0]?.converted_booking_id || null : null;
}

async function confirmBookingFromDeposit(env, bookingId, row, details) {
  const now = new Date().toISOString();
  await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}`, {
    method: "PATCH",
    headers: serviceHeaders(env),
    body: JSON.stringify({
      status: "confirmed",
      job_status: "scheduled",
      payment_provider: details.provider || row.provider || "provider",
      deposit_cents: details.paidAmountCents,
      confirmed_at: now,
      updated_at: now
    })
  });

  await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`, {
    method: "POST",
    headers: serviceHeaders(env),
    body: JSON.stringify([{
      booking_id: bookingId,
      event_type: "booking_finance_deposit",
      actor_name: details.actorName || "Verified payment webhook",
      event_note: `Quote deposit ${formatMoney(details.paidAmountCents)} verified via ${details.provider || "provider"}.`,
      payload: {
        entry_type: "deposit",
        amount_cad: Math.round(details.paidAmountCents) / 100,
        payment_method: details.provider || null,
        payment_reference: details.paymentReference || null,
        quote_deposit_payment_request_id: row.id,
        quote_proposal_draft_id: row.quote_proposal_draft_id
      }
    }])
  }).catch(() => null);

  let notification = null;
  try {
    notification = await queueOrderConfirmationNotification(env, bookingId, `${details.provider || "provider"}_quote_deposit_webhook`);
  } catch {}
  return { ok: true, notification };
}

// Compatibility export for retained webhook call sites. Numeric/integer values are already cents;
// decimal currency strings (the PayPal REST shape) are converted deliberately.
export function moneyToCents(value) {
  return providerMoneyToCents(value);
}

export function cleanText(value) { return String(value ?? "").trim(); }
export function isUuid(value) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || "")); }
function formatMoney(cents) { return `$${(Number(cents || 0) / 100).toFixed(2)} CAD`; }
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
function extractSupabaseError(data, text, fallback) { if (data?.message) return data.message; if (typeof text === "string" && text.trim()) return text.slice(0, 300); return fallback; }
