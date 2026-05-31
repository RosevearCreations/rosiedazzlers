// Build 183 — direct Stripe/PayPal refund initiation for quote deposit/payment requests.
// Staff can initiate full or partial provider refunds from Admin Payments. The
// provider response is still recorded through the shared refund tracker so manual,
// webhook, and direct-provider refund paths remain consistent.
import { requireStaffAccess, json, serviceHeaders, cleanText, isUuid, methodNotAllowed } from "../_lib/staff-auth.js";
import { recordQuoteDepositRefund } from "../_lib/quote-payment-events.js";
import { moneyToCents } from "../_lib/quote-deposit-payments.js";

const REQUEST_SELECT = [
  "id", "quote_proposal_draft_id", "lead_id", "lead_conversion_draft_id", "booking_id", "confirmed_booking_id",
  "provider", "payment_status", "amount_cents", "paid_amount_cents", "refunded_amount_cents", "currency",
  "customer_name", "customer_email", "payment_reference", "external_checkout_id", "provider_payment_intent_id",
  "provider_order_id", "provider_capture_id", "latest_refund_at", "refund_status"
].join(",");

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);
    if (!hasSupabaseConfig(env)) return withCors(json({ ok: false, error: "Supabase service configuration is missing." }, 500));

    const paymentRequestId = cleanText(body.payment_request_id || body.quote_deposit_payment_request_id || body.id);
    if (!isUuid(paymentRequestId)) return withCors(json({ ok: false, error: "Valid payment_request_id is required." }, 400));

    const row = await loadPaymentRequest(env, paymentRequestId);
    if (!row) return withCors(json({ ok: false, error: "Quote deposit/payment request was not found." }, 404));

    const provider = normalizeProvider(body.provider || row.provider);
    const paidCents = moneyToCents(row.paid_amount_cents || row.amount_cents || 0);
    const refundedCents = moneyToCents(row.refunded_amount_cents || 0);
    const refundableCents = Math.max(0, paidCents - refundedCents);
    const requestedCents = moneyToCents(body.refund_amount_cents ?? body.amount_cents ?? body.amount ?? refundableCents);

    if (!provider || !["stripe", "paypal"].includes(provider)) {
      return withCors(json({ ok: false, error: "Direct provider refund initiation requires provider=stripe or provider=paypal. Use manual refund record for cash/e-transfer/manual adjustments.", provider: row.provider || null }, 400));
    }
    if (!String(row.payment_status || "").match(/paid|partial_refund|refunded/i)) {
      return withCors(json({ ok: false, error: "Refund initiation is only allowed after the deposit is marked paid.", payment_status: row.payment_status || null }, 409));
    }
    if (!(requestedCents > 0)) return withCors(json({ ok: false, error: "Refund amount must be greater than zero." }, 400));
    if (requestedCents > refundableCents) {
      return withCors(json({ ok: false, error: "Refund amount is greater than the remaining refundable balance.", refundable_amount_cents: refundableCents }, 409));
    }

    const reason = cleanText(body.reason || body.refund_reason || "Staff initiated provider refund from Admin Payments.");
    let providerResult = null;
    if (provider === "stripe") providerResult = await initiateStripeRefund({ env, row, amountCents: requestedCents, reason, actor: access.actor });
    if (provider === "paypal") providerResult = await initiatePayPalRefund({ env, row, amountCents: requestedCents, reason, actor: access.actor });

    if (!providerResult?.ok) {
      return withCors(json({ ok: false, error: providerResult?.error || "Provider refund initiation failed.", provider, details: providerResult?.details || null }, providerResult?.status || 502));
    }

    const tracked = await recordQuoteDepositRefund(env, {
      payment_request_id: row.id,
      provider,
      provider_refund_id: providerResult.refund_id,
      provider_event_id: providerResult.refund_id,
      provider_event_type: provider === "stripe" ? "staff.stripe_refund_initiated" : "staff.paypal_refund_initiated",
      refund_amount_cents: requestedCents,
      currency: row.currency || "CAD",
      refund_status: normalizeRefundStatus(providerResult.status),
      reason,
      provider_payload: {
        source: "admin_direct_provider_refund",
        actor_id: access.actor?.id || null,
        actor_email: access.actor?.email || null,
        provider_response: providerResult.raw || null
      }
    });

    return withCors(json({
      ok: !!tracked.ok,
      provider,
      direct_provider_refund: true,
      refund_amount_cents: requestedCents,
      provider_refund_id: providerResult.refund_id,
      provider_status: providerResult.status || null,
      tracked,
      next_step: tracked.ok ? "Provider refund initiated and recorded. Watch webhook history for the provider refund event if the provider sends one." : "Provider refund was initiated, but local refund tracking failed. Review payment history."
    }, tracked.ok ? 200 : tracked.status || 500));
  } catch (err) {
    return withCors(json({ ok: false, error: err?.message || "Could not initiate provider refund." }, 500));
  }
}
export async function onRequestGet() { return withCors(methodNotAllowed()); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

async function loadPaymentRequest(env, id) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_deposit_payment_requests?select=${encodeURIComponent(REQUEST_SELECT)}&id=eq.${encodeURIComponent(id)}&limit=1`, { headers: serviceHeaders(env) });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not load quote deposit/payment request."));
  return Array.isArray(data) ? data[0] || null : null;
}

async function initiateStripeRefund({ env, row, amountCents, reason, actor }) {
  const secret = String(env.STRIPE_SECRET_KEY || "").trim();
  if (!secret) return { ok: false, status: 500, error: "Missing STRIPE_SECRET_KEY." };
  const paymentIntent = cleanText(row.provider_payment_intent_id || (String(row.payment_reference || "").startsWith("pi_") ? row.payment_reference : ""));
  const charge = cleanText(String(row.payment_reference || "").startsWith("ch_") ? row.payment_reference : "");
  if (!paymentIntent && !charge) return { ok: false, status: 409, error: "No Stripe payment_intent or charge reference is stored for this deposit request." };
  const params = new URLSearchParams();
  params.set("amount", String(Math.round(amountCents)));
  if (paymentIntent) params.set("payment_intent", paymentIntent);
  else params.set("charge", charge);
  params.set("metadata[quote_deposit_payment_request_id]", row.id);
  params.set("metadata[source]", "admin_direct_refund_build183");
  if (actor?.email) params.set("metadata[staff_email]", actor.email);
  if (reason) params.set("metadata[refund_reason]", reason.slice(0, 450));
  const res = await fetch("https://api.stripe.com/v1/refunds", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok || !data?.id) return { ok: false, status: res.status || 502, error: data?.error?.message || text || "Stripe refund API failed.", details: data || text };
  return { ok: true, refund_id: data.id, status: data.status || "succeeded", raw: data };
}

async function initiatePayPalRefund({ env, row, amountCents, reason }) {
  const captureId = cleanText(row.provider_capture_id || (String(row.payment_reference || "").match(/^[A-Z0-9]{8,}$/i) ? row.payment_reference : ""));
  if (!captureId) return { ok: false, status: 409, error: "No PayPal capture id is stored for this deposit request." };
  const access = await getPayPalAccessToken(env);
  if (!access.ok) return access;
  const payload = {
    amount: { value: (Number(amountCents || 0) / 100).toFixed(2), currency_code: String(row.currency || "CAD").toUpperCase() },
    note_to_payer: String(reason || "Rosie Dazzlers refund").slice(0, 255)
  };
  const res = await fetch(`${paypalBase(env)}/v2/payments/captures/${encodeURIComponent(captureId)}/refund`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access.token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      "PayPal-Request-Id": `rd-${row.id}-${Date.now()}`
    },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok || !data?.id) return { ok: false, status: res.status || 502, error: data?.message || text || "PayPal refund API failed.", details: data || text };
  return { ok: true, refund_id: data.id, status: data.status || "COMPLETED", raw: data };
}

async function getPayPalAccessToken(env) {
  const clientId = String(env.PAYPAL_CLIENT_ID || "").trim();
  const clientSecret = String(env.PAYPAL_CLIENT_SECRET || env.PAYPAL_SECRET || "").trim();
  if (!clientId || !clientSecret) return { ok: false, status: 500, error: "Missing PayPal client credentials." };
  const auth = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch(`${paypalBase(env)}/v1/oauth2/token`, { method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=client_credentials" });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok || !data?.access_token) return { ok: false, status: res.status || 502, error: "Could not obtain PayPal access token.", details: data || text };
  return { ok: true, token: data.access_token };
}

function paypalBase(env) { return String(env.PAYPAL_API_BASE || "").trim() || "https://api-m.paypal.com"; }
function normalizeProvider(value) { const text = String(value || "").trim().toLowerCase(); return text === "stripe" || text === "paypal" ? text : null; }
function normalizeRefundStatus(value) { const text = String(value || "").toLowerCase(); if (["succeeded", "completed", "complete"].includes(text)) return "succeeded"; if (["pending"].includes(text)) return "pending"; if (["failed", "denied", "cancelled", "canceled"].includes(text)) return "failed"; return text || "succeeded"; }
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function safeJson(text) { try { return typeof text === "string" ? JSON.parse(text) : text || null; } catch { return null; } }
function extractSupabaseError(data, text, fallback) { if (data?.message) return data.message; if (typeof text === "string" && text.trim()) return text.slice(0, 300); return fallback; }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
