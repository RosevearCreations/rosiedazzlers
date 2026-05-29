// functions/api/paypal/webhook.js
// Build 181 — PayPal verified webhook settlement for quote deposit/payment requests.
// PayPal verifies webhook authenticity through /v1/notifications/verify-webhook-signature.

import { markQuoteDepositPaidFromProvider, hasSupabaseConfig, cleanText, moneyToCents } from "../_lib/quote-deposit-payments.js";

const SETTLED_EVENT_TYPES = new Set([
  "PAYMENT.CAPTURE.COMPLETED",
  "PAYMENT.SALE.COMPLETED"
]);

export async function onRequestOptions() {
  return corsResponse("", 204);
}

export async function onRequestPost({ request, env }) {
  try {
    if (!hasSupabaseConfig(env)) return json({ ok: false, error: "Supabase service configuration is missing." }, 500);
    if (!env.PAYPAL_WEBHOOK_ID) return json({ ok: false, error: "Missing PAYPAL_WEBHOOK_ID." }, 500);
    if (!env.PAYPAL_CLIENT_ID || !(env.PAYPAL_CLIENT_SECRET || env.PAYPAL_SECRET)) return json({ ok: false, error: "Missing PayPal client credentials." }, 500);

    const rawBody = await request.text();
    const event = safeJson(rawBody);
    if (!event?.id || !event?.event_type) return json({ ok: false, error: "Invalid PayPal webhook payload." }, 400);

    const verified = await verifyPayPalWebhookSignature({ request, env, rawBody, event });
    if (!verified.ok) return json({ ok: false, error: verified.error || "PayPal webhook signature verification failed.", details: verified.details || null }, 400);

    if (!SETTLED_EVENT_TYPES.has(String(event.event_type))) {
      return json({ ok: true, ignored: event.event_type, verified: true });
    }

    const resource = event.resource || {};
    const meta = extractQuoteDepositMetadata(resource);
    if (!meta.quote_deposit_payment_request_id) {
      return json({ ok: true, ignored: "not_quote_deposit_payment_request", event_type: event.event_type, verified: true });
    }

    const amountCents = extractPayPalAmountCents(resource) || meta.amount_cents || null;
    const providerCaptureId = extractPayPalCaptureId(resource);
    const providerOrderId = cleanText(resource.id || meta.paypal_order_id || meta.order_id);

    const settled = await markQuoteDepositPaidFromProvider({
      env,
      paymentRequestId: meta.quote_deposit_payment_request_id,
      externalCheckoutId: providerOrderId,
      provider: "paypal",
      paidAmountCents: amountCents,
      paymentReference: providerCaptureId || providerOrderId || event.id,
      providerOrderId: providerOrderId || null,
      providerCaptureId: providerCaptureId || null,
      providerEventId: event.id || null,
      providerEventType: event.event_type || null,
      providerPayload: { event_id: event.id, event_type: event.event_type, resource },
      actorName: "Verified PayPal webhook"
    });

    if (!settled.ok) return json({ ok: false, error: settled.error || "Quote deposit settlement failed.", verified: true }, settled.status || 500);
    return json({ ok: true, verified: true, settled });
  } catch (err) {
    return json({ ok: false, error: err?.message || "PayPal webhook processing failed." }, 500);
  }
}

async function verifyPayPalWebhookSignature({ request, env, event }) {
  const tokenResult = await getPayPalAccessToken(env);
  if (!tokenResult.ok) return { ok: false, error: tokenResult.error, details: tokenResult.details || null };

  const payload = {
    auth_algo: request.headers.get("paypal-auth-algo") || request.headers.get("PAYPAL-AUTH-ALGO") || "",
    cert_url: request.headers.get("paypal-cert-url") || request.headers.get("PAYPAL-CERT-URL") || "",
    transmission_id: request.headers.get("paypal-transmission-id") || request.headers.get("PAYPAL-TRANSMISSION-ID") || "",
    transmission_sig: request.headers.get("paypal-transmission-sig") || request.headers.get("PAYPAL-TRANSMISSION-SIG") || "",
    transmission_time: request.headers.get("paypal-transmission-time") || request.headers.get("PAYPAL-TRANSMISSION-TIME") || "",
    webhook_id: env.PAYPAL_WEBHOOK_ID,
    webhook_event: event
  };

  if (!payload.auth_algo || !payload.cert_url || !payload.transmission_id || !payload.transmission_sig || !payload.transmission_time) {
    return { ok: false, error: "Missing PayPal webhook verification headers." };
  }

  const res = await fetch(`${paypalBase(env)}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tokenResult.token}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) return { ok: false, error: "PayPal verification request failed.", details: data || text };
  return { ok: String(data?.verification_status || "").toUpperCase() === "SUCCESS", details: data };
}

function extractQuoteDepositMetadata(resource) {
  const purchaseUnit = Array.isArray(resource.purchase_units) ? resource.purchase_units[0] : null;
  const customId = cleanText(resource.custom_id || purchaseUnit?.custom_id || resource.supplementary_data?.related_ids?.order_id || "");
  const decoded = decodeCustomId(customId);
  const referenceId = cleanText(purchaseUnit?.reference_id || resource.reference_id);
  if (!decoded.quote_deposit_payment_request_id && isUuidLike(referenceId)) decoded.quote_deposit_payment_request_id = referenceId;
  if (!decoded.paypal_order_id && resource.id) decoded.paypal_order_id = resource.id;
  return decoded;
}

function decodeCustomId(customId) {
  if (!customId) return {};
  const variants = [customId];
  try { variants.push(decodeURIComponent(customId)); } catch {}
  for (const text of variants) {
    const parsed = safeJson(text);
    if (parsed && typeof parsed === "object") return parsed;
  }
  return isUuidLike(customId) ? { quote_deposit_payment_request_id: customId } : {};
}

function extractPayPalAmountCents(resource) {
  const raw = resource?.amount?.value
    || resource?.seller_receivable_breakdown?.gross_amount?.value
    || resource?.purchase_units?.[0]?.amount?.value
    || resource?.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value
    || null;
  return raw ? moneyToCents(raw) : 0;
}

function extractPayPalCaptureId(resource) {
  return cleanText(resource?.id && String(resource?.status || "").toUpperCase() === "COMPLETED" ? resource.id : resource?.purchase_units?.[0]?.payments?.captures?.[0]?.id || "");
}

async function getPayPalAccessToken(env) {
  const clientId = String(env.PAYPAL_CLIENT_ID || "").trim();
  const clientSecret = String(env.PAYPAL_CLIENT_SECRET || env.PAYPAL_SECRET || "").trim();
  if (!clientId || !clientSecret) return { ok: false, error: "Missing PayPal client credentials." };
  const auth = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch(`${paypalBase(env)}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials"
  });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok || !data?.access_token) return { ok: false, error: "Could not obtain PayPal access token.", details: data };
  return { ok: true, token: data.access_token };
}

function paypalBase(env) { return String(env.PAYPAL_API_BASE || "").trim() || "https://api-m.paypal.com"; }
function isUuidLike(value) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || "")); }
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, paypal-auth-algo, paypal-cert-url, paypal-transmission-id, paypal-transmission-sig, paypal-transmission-time", "Cache-Control": "no-store" }; }
function json(obj, status = 200) { return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", ...corsHeaders() } }); }
function corsResponse(body = "", status = 200) { return new Response(body, { status, headers: corsHeaders() }); }
