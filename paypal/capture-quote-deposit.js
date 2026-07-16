// functions/api/paypal/capture-quote-deposit.js
// Build 181 — customer-return PayPal capture for quote deposit/payment requests.
// The PayPal webhook remains the source of provider verification, while this endpoint
// gives the customer payment page a safe way to capture an approved PayPal order.

import { markQuoteDepositPaidFromProvider, serviceHeaders, hasSupabaseConfig, cleanText, moneyToCents } from "../_lib/quote-deposit-payments.js";

const REQUEST_SELECT = ["id", "quote_proposal_draft_id", "external_checkout_id", "amount_cents", "token_hash", "provider", "payment_status"].join(",");

export async function onRequestOptions() { return corsResponse("", 204); }

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const requestId = cleanText(body.request_id || body.payment_request_id);
    const secureToken = cleanText(body.secure_token || body.token || body.request_token);
    const paypalOrderId = cleanText(body.paypal_order_id || body.order_id || body.paypal_token);

    if (!hasSupabaseConfig(env)) return corsJson({ ok: false, error: "Payment request storage is not configured yet." }, 503);
    if (!requestId || !secureToken || !paypalOrderId) return corsJson({ ok: false, error: "request_id, secure token, and PayPal order id are required." }, 400);

    const row = await loadPaymentRequest(env, requestId);
    if (!row) return corsJson({ ok: false, error: "Payment request was not found." }, 404);
    const tokenHash = await sha256Hex(secureToken);
    if (row.token_hash !== tokenHash) return corsJson({ ok: false, error: "Payment request token is invalid." }, 403);
    if (row.payment_status === "paid") return corsJson({ ok: true, already_paid: true, message: "Deposit was already recorded as paid." });

    if (row.external_checkout_id && row.external_checkout_id !== paypalOrderId) {
      return corsJson({ ok: false, error: "PayPal order does not match this deposit request." }, 409);
    }

    const accessToken = await getPayPalAccessToken(env);
    if (!accessToken.ok) return corsJson({ ok: false, error: accessToken.error, details: accessToken.details || null }, 500);

    const captureRes = await fetch(`${paypalBase(env)}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken.token}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: "{}"
    });
    const captureText = await captureRes.text();
    const captureData = safeJson(captureText);
    if (!captureRes.ok) return corsJson({ ok: false, error: "PayPal capture failed.", details: captureData || captureText }, 502);
    if (String(captureData?.status || "").toUpperCase() !== "COMPLETED") return corsJson({ ok: false, error: "PayPal order was not completed.", details: captureData }, 400);

    const meta = decodeCustomId(captureData?.purchase_units?.[0]?.custom_id || "");
    if (meta.quote_deposit_payment_request_id && meta.quote_deposit_payment_request_id !== requestId) {
      return corsJson({ ok: false, error: "PayPal metadata does not match this deposit request." }, 409);
    }

    const capture = captureData?.purchase_units?.[0]?.payments?.captures?.[0] || {};
    const settled = await markQuoteDepositPaidFromProvider({
      env,
      paymentRequestId: requestId,
      externalCheckoutId: paypalOrderId,
      provider: "paypal",
      paidAmountCents: moneyToCents(capture?.amount?.value || row.amount_cents),
      paymentReference: capture?.id || paypalOrderId,
      providerOrderId: paypalOrderId,
      providerCaptureId: capture?.id || null,
      providerEventType: "PAYPAL_CUSTOMER_RETURN_CAPTURE",
      providerPayload: { order: captureData },
      actorName: "Verified PayPal customer-return capture"
    });

    return corsJson({ ok: true, captured: true, settled });
  } catch (err) {
    return corsJson({ ok: false, error: err?.message || "Could not capture PayPal quote deposit." }, 500);
  }
}

async function loadPaymentRequest(env, id) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_deposit_payment_requests?select=${encodeURIComponent(REQUEST_SELECT)}&id=eq.${encodeURIComponent(id)}&limit=1`, { headers: serviceHeaders(env) });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) throw new Error(data?.message || text || "Could not load payment request.");
  return Array.isArray(data) ? data[0] || null : null;
}

async function getPayPalAccessToken(env) {
  const clientId = String(env.PAYPAL_CLIENT_ID || "").trim();
  const clientSecret = String(env.PAYPAL_CLIENT_SECRET || env.PAYPAL_SECRET || "").trim();
  if (!clientId || !clientSecret) return { ok: false, error: "Missing PayPal client credentials." };
  const auth = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch(`${paypalBase(env)}/v1/oauth2/token`, { method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=client_credentials" });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok || !data?.access_token) return { ok: false, error: "Could not obtain PayPal access token.", details: data };
  return { ok: true, token: data.access_token };
}

function decodeCustomId(customId) {
  if (!customId) return {};
  const variants = [customId];
  try { variants.push(decodeURIComponent(customId)); } catch {}
  for (const text of variants) {
    const parsed = safeJson(text);
    if (parsed && typeof parsed === "object") return parsed;
  }
  return {};
}

async function sha256Hex(value) { const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(value || ""))); return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join(""); }
function paypalBase(env) { return String(env.PAYPAL_API_BASE || "").trim() || "https://api-m.paypal.com"; }
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Cache-Control": "no-store" }; }
function corsJson(obj, status = 200) { return new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", ...corsHeaders() } }); }
function corsResponse(body = "", status = 200) { return new Response(body, { status, headers: corsHeaders() }); }
