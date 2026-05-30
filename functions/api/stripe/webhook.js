// functions/api/stripe/webhook.js
// Build 182: verifies Stripe signatures, records webhook history, settles quote deposits,
// queues receipt emails, and tracks refunds/partial refunds for quote_deposit_payment_requests.

import { queueOrderConfirmationNotification } from "../_lib/booking-documents.js";
import { markQuoteDepositPaidFromProvider, getServiceKey, moneyToCents, cleanText } from "../_lib/quote-deposit-payments.js";
import { recordPaymentWebhookEvent, updatePaymentWebhookEvent, queueQuoteDepositReceiptEmail, recordQuoteDepositRefund } from "../_lib/quote-payment-events.js";

const SETTLEMENT_EVENTS = new Set(["checkout.session.completed"]);
const REFUND_EVENTS = new Set(["charge.refunded", "refund.created", "refund.updated", "charge.refund.updated"]);

export async function onRequestPost({ request, env }) {
  const SUPABASE_URL = env.SUPABASE_URL;
  const SERVICE_KEY = getServiceKey(env);
  const WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET || env.STRIPE_WEBHOOK_SECRET_QUOTES;

  if (!SUPABASE_URL || !SERVICE_KEY || !WEBHOOK_SECRET) {
    return new Response("Server not configured", { status: 500 });
  }

  const sig = request.headers.get("stripe-signature");
  if (!sig) return new Response("Missing Stripe-Signature", { status: 400 });

  const rawBody = await request.text();
  const verified = await verifyStripeSignature({
    signatureHeader: sig,
    payload: rawBody,
    secret: WEBHOOK_SECRET,
    toleranceSeconds: 300,
  });
  if (!verified.ok) {
    await recordPaymentWebhookEvent(env, {
      provider: "stripe",
      provider_event_id: `unverified-${Date.now()}`,
      provider_event_type: "signature_verification_failed",
      status: "unverified",
      last_error: verified.reason,
      processed_payload: { reason: verified.reason }
    });
    return new Response(`Signature verification failed: ${verified.reason}`, { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const history = await recordPaymentWebhookEvent(env, {
    provider: "stripe",
    provider_event_id: event.id || `stripe-${Date.now()}`,
    provider_event_type: event.type || "unknown",
    status: "verified",
    raw_payload: scrubStripePayload(event),
    processed_payload: { livemode: event.livemode === true }
  });

  if (REFUND_EVENTS.has(String(event?.type || ""))) {
    return handleStripeRefundEvent({ env, event, history });
  }

  if (!SETTLEMENT_EVENTS.has(String(event?.type || ""))) {
    await updatePaymentWebhookEvent(env, { provider: "stripe", provider_event_id: event.id }, { status: "ignored", processed_payload: { ignored_event_type: event.type } });
    return new Response("Ignored", { status: 200 });
  }

  const session = event?.data?.object || {};
  const metadata = session?.metadata || {};
  const quoteDepositPaymentRequestId = metadata.quote_deposit_payment_request_id || metadata.quoteDepositPaymentRequestId || null;

  if (quoteDepositPaymentRequestId) {
    const paid = await markQuoteDepositPaidFromProvider({
      env,
      paymentRequestId: quoteDepositPaymentRequestId,
      externalCheckoutId: session.id,
      provider: "stripe",
      paidAmountCents: session.amount_total || session.amount_subtotal || null,
      paymentReference: session.payment_intent || session.id,
      providerPaymentIntentId: session.payment_intent || null,
      providerEventId: event.id || null,
      providerEventType: event.type || null,
      providerPayload: { event_id: event.id, type: event.type, livemode: event.livemode, session: scrubStripePayload(session) }
    });

    if (!paid.ok) {
      await updatePaymentWebhookEvent(env, { provider: "stripe", provider_event_id: event.id }, { status: "failed", last_error: paid.error || "Quote deposit settlement failed.", quote_deposit_payment_request_id: quoteDepositPaymentRequestId });
      await logEvent(SUPABASE_URL, SERVICE_KEY, null, "stripe_quote_deposit_settle_failed", paid);
      return new Response(paid.error || "Quote deposit settlement failed", { status: paid.status || 500 });
    }

    const receipt = await queueQuoteDepositReceiptEmail(env, paid.payment_request, {
      paidAmountCents: session.amount_total || session.amount_subtotal || null,
      provider: "stripe",
      paymentReference: session.payment_intent || session.id
    });

    await updatePaymentWebhookEvent(env, { provider: "stripe", provider_event_id: event.id }, {
      status: paid.idempotent ? "replayed" : "settled",
      quote_deposit_payment_request_id: quoteDepositPaymentRequestId,
      booking_id: paid.booking_id || null,
      payment_reference: session.payment_intent || session.id,
      processed_payload: {
        session_id: session.id,
        payment_intent: session.payment_intent,
        booking_confirmed: paid.booking_confirmed,
        idempotent: !!paid.idempotent,
        receipt_email: receipt
      }
    });

    await logEvent(SUPABASE_URL, SERVICE_KEY, paid.booking_id || null, "stripe_quote_deposit_settled", {
      session_id: session.id,
      payment_intent: session.payment_intent,
      quote_deposit_payment_request_id: quoteDepositPaymentRequestId,
      booking_confirmed: paid.booking_confirmed,
      idempotent: !!paid.idempotent,
      receipt
    });

    return new Response("OK", { status: 200 });
  }

  const bookingId = metadata.booking_id || session?.metadata?.booking_id;
  if (!bookingId) {
    await updatePaymentWebhookEvent(env, { provider: "stripe", provider_event_id: event.id }, { status: "ignored", processed_payload: { reason: "missing_booking_id_metadata" } });
    await logEvent(SUPABASE_URL, SERVICE_KEY, null, "stripe_webhook_missing_booking_id", event);
    return new Response("Missing booking_id metadata", { status: 200 });
  }

  const patch = await supaPatch(
    SUPABASE_URL,
    SERVICE_KEY,
    `/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}`,
    {
      status: "confirmed",
      job_status: "scheduled",
      stripe_session_id: session?.id ?? null,
      stripe_payment_intent_id: session?.payment_intent ?? null,
      payment_provider: "stripe",
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  );

  if (!patch.ok) {
    await updatePaymentWebhookEvent(env, { provider: "stripe", provider_event_id: event.id }, { status: "failed", last_error: "Supabase booking update failed.", booking_id: bookingId });
    await logEvent(SUPABASE_URL, SERVICE_KEY, bookingId, "stripe_webhook_update_failed", patch);
    return new Response("Supabase update failed", { status: 500 });
  }

  const notification = await queueOrderConfirmationNotification(env, bookingId, "stripe_webhook");
  await updatePaymentWebhookEvent(env, { provider: "stripe", provider_event_id: event.id }, { status: "settled", booking_id: bookingId, payment_reference: session?.payment_intent || session?.id || null, processed_payload: { legacy_booking_checkout: true, notification } });

  await logEvent(SUPABASE_URL, SERVICE_KEY, bookingId, "stripe_webhook_confirmed", {
    session_id: session?.id,
    payment_intent: session?.payment_intent,
    notification
  });

  return new Response("OK", { status: 200 });
}

async function handleStripeRefundEvent({ env, event }) {
  const resource = event?.data?.object || {};
  const metadata = resource.metadata || resource.charge?.metadata || {};
  const quoteDepositPaymentRequestId = metadata.quote_deposit_payment_request_id || metadata.quoteDepositPaymentRequestId || null;
  const amountCents = extractStripeRefundAmountCents(event);
  const refundId = resource.id || resource.refund || resource.latest_charge || event.id;
  const paymentIntent = resource.payment_intent || resource.payment_intent_id || resource.charge?.payment_intent || metadata.payment_intent || null;
  const chargeId = resource.charge || resource.id || null;

  const tracked = await recordQuoteDepositRefund(env, {
    payment_request_id: quoteDepositPaymentRequestId,
    provider: "stripe",
    provider_refund_id: refundId,
    provider_event_id: event.id || null,
    provider_event_type: event.type || null,
    provider_payment_intent_id: paymentIntent,
    payment_reference: paymentIntent || chargeId,
    refund_amount_cents: amountCents,
    currency: resource.currency || resource.amount_refunded?.currency || "CAD",
    refund_status: isStripeRefundComplete(event, resource) ? "succeeded" : "pending",
    reason: resource.reason || resource.status || null,
    provider_payload: { event_id: event.id, type: event.type, resource: scrubStripePayload(resource) }
  });

  if (!tracked.ok) {
    await updatePaymentWebhookEvent(env, { provider: "stripe", provider_event_id: event.id }, { status: "failed", last_error: tracked.error || "Could not track refund.", quote_deposit_payment_request_id: quoteDepositPaymentRequestId || null });
    return new Response(tracked.error || "Refund tracking failed", { status: tracked.status || 500 });
  }

  await updatePaymentWebhookEvent(env, { provider: "stripe", provider_event_id: event.id }, {
    status: "refund_recorded",
    quote_deposit_payment_request_id: tracked.payment_request?.id || quoteDepositPaymentRequestId || null,
    booking_id: tracked.payment_request?.confirmed_booking_id || tracked.payment_request?.booking_id || null,
    payment_reference: refundId || paymentIntent || null,
    processed_payload: { refund_id: refundId, refund_amount_cents: amountCents, refund_status: tracked.refund?.refund_status || null, refund_email: tracked.refund_email || null }
  });

  return new Response("OK", { status: 200 });
}

function extractStripeRefundAmountCents(event) {
  const resource = event?.data?.object || {};
  if (Number(resource.amount_refunded) > 0) return moneyToCents(resource.amount_refunded);
  if (Number(resource.amount) > 0) return moneyToCents(resource.amount);
  return 0;
}
function isStripeRefundComplete(event, resource) {
  const status = String(resource?.status || "").toLowerCase();
  return event?.type === "charge.refunded" || status === "succeeded" || status === "refunded";
}
function scrubStripePayload(value) {
  if (!value || typeof value !== "object") return value || null;
  const copy = JSON.parse(JSON.stringify(value));
  if (copy?.client_secret) copy.client_secret = "[redacted]";
  if (copy?.url) copy.url = "[checkout-url-redacted]";
  return copy;
}

async function supaPatch(SUPABASE_URL, SERVICE_KEY, path, payload) {
  const res = await fetch(`${SUPABASE_URL}${path}`, {
    method: "PATCH",
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}
async function logEvent(SUPABASE_URL, SERVICE_KEY, bookingId, eventType, details) {
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/booking_events`, {
      method: "POST",
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ booking_id: bookingId, event_type: eventType, details: details ?? {} }),
    });
  } catch {}
}
async function verifyStripeSignature({ signatureHeader, payload, secret, toleranceSeconds }) {
  const pieces = signatureHeader.split(",").map((x) => x.trim()).filter(Boolean);
  const tPart = pieces.find((p) => p.startsWith("t="));
  const v1Parts = pieces.filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!tPart || !v1Parts.length) return { ok: false, reason: "Missing t or v1" };
  const timestamp = Number(tPart.slice(2));
  if (!Number.isFinite(timestamp)) return { ok: false, reason: "Bad timestamp" };
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > toleranceSeconds) return { ok: false, reason: "Timestamp outside tolerance" };
  const signedPayload = `${timestamp}.${payload}`;
  const expected = await hmacSha256Hex(secret, signedPayload);
  for (const v1 of v1Parts) if (timingSafeEqualHex(expected, v1)) return { ok: true };
  return { ok: false, reason: "Bad signature" };
}
async function hmacSha256Hex(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}
function timingSafeEqualHex(a, b) { if (!a || !b || a.length !== b.length) return false; let out = 0; for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i); return out === 0; }
