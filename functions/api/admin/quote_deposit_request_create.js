// Build 180 — create an accepted-quote deposit/payment request.
// Safe foundation: it creates a tracked payment request and optionally a Stripe
// Checkout session when STRIPE_SECRET_KEY is configured. Manual request mode
// remains available so the workflow does not break before provider setup.
import { requireStaffAccess, json, serviceHeaders, cleanText, cleanEmail, isUuid, methodNotAllowed } from "../_lib/staff-auth.js";

const QUOTE_SELECT = [
  "id", "lead_id", "booking_id", "title", "status", "body", "pricing_note", "internal_note",
  "customer_name", "customer_email", "acceptance_status", "accepted_at", "delivery_status",
  "final_booking_id", "latest_deposit_payment_request_id"
].join(",");

const CONVERSION_SELECT = [
  "id", "lead_id", "quote_proposal_draft_id", "status", "converted_booking_id", "customer_name", "customer_email", "final_deposit_cents", "final_price_total_cents", "proposed_booking"
].join(",");

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);

    if (!hasSupabaseConfig(env)) {
      return withCors(json({ ok: false, error: "Supabase service configuration is missing.", migration_hint: "Apply Build 180 SQL and confirm Supabase service-role env vars." }, 500));
    }

    const draftId = cleanText(body.quote_proposal_draft_id || body.draft_id || body.id);
    if (!isUuid(draftId)) return withCors(json({ ok: false, error: "A valid quote_proposal_draft_id is required." }, 400));

    const draft = await loadQuoteDraft(env, draftId);
    if (!draft) return withCors(json({ ok: false, error: "Quote/proposal draft was not found." }, 404));

    const acceptance = String(draft.acceptance_status || "").toLowerCase();
    if (!body.allow_unaccepted && acceptance !== "accepted") {
      return withCors(json({ ok: false, error: "Quote must be accepted before requesting a deposit. Use allow_unaccepted only for staff-tested exceptions.", acceptance_status: draft.acceptance_status || null }, 409));
    }

    const conversion = await findConversionDraft(env, draft.id).catch(() => null);
    const proposedBooking = conversion?.proposed_booking && typeof conversion.proposed_booking === "object" ? conversion.proposed_booking : {};
    const bookingId = cleanText(body.booking_id || draft.booking_id || conversion?.converted_booking_id || proposedBooking.booking_id);
    const amountCents = moneyToCents(body.amount_cents ?? body.deposit_cents ?? body.deposit_amount ?? conversion?.final_deposit_cents ?? proposedBooking.deposit_cents ?? proposedBooking.deposit_amount);
    if (!(amountCents > 0)) return withCors(json({ ok: false, error: "Deposit amount must be greater than zero." }, 400));

    const provider = normalizeProvider(body.provider || (env.STRIPE_SECRET_KEY ? "stripe" : (hasPayPalConfig(env) ? "paypal" : "manual")));
    const token = makeToken();
    const tokenHash = await sha256Hex(token);
    const origin = siteOrigin(request, env);
    const customerEmail = cleanEmail(body.customer_email || draft.customer_email || conversion?.customer_email);
    const customerName = cleanText(body.customer_name || draft.customer_name || conversion?.customer_name);
    const publicNote = cleanText(body.public_note || "Your quote has been accepted. Please use this secure page to review the deposit request and payment instructions.");

    const insertPayload = {
      quote_proposal_draft_id: draft.id,
      lead_id: draft.lead_id || conversion?.lead_id || null,
      lead_conversion_draft_id: conversion?.id || null,
      booking_id: bookingId && isUuid(bookingId) ? bookingId : null,
      status: "requested",
      payment_status: "pending",
      provider,
      amount_cents: amountCents,
      currency: "CAD",
      customer_name: customerName || null,
      customer_email: customerEmail || null,
      public_note: publicNote,
      internal_note: cleanText(body.internal_note || "Created from accepted quote/proposal draft."),
      token_hash: tokenHash,
      requested_at: new Date().toISOString(),
      created_by_staff_user_id: access.actor?.id && isUuid(access.actor.id) ? access.actor.id : null,
      updated_by_staff_user_id: access.actor?.id && isUuid(access.actor.id) ? access.actor.id : null
    };

    const requestRow = await insertPaymentRequest(env, insertPayload);
    if (!requestRow?.id) throw new Error("Payment request insert returned no row.");

    const paymentUrl = `${origin}/quote-payment.html?request_id=${encodeURIComponent(requestRow.id)}&token=${encodeURIComponent(token)}`;
    let checkout = null;
    let checkoutUrl = paymentUrl;
    let providerStatus = "manual";
    let externalCheckoutId = null;

    if (provider === "stripe" && env.STRIPE_SECRET_KEY) {
      checkout = await createStripeCheckoutSession({ env, request, paymentRequest: requestRow, draft, amountCents, customerEmail, paymentUrl });
      checkoutUrl = checkout.url || paymentUrl;
      externalCheckoutId = checkout.id || null;
      providerStatus = "stripe_checkout_created";
    } else if (provider === "paypal" && hasPayPalConfig(env)) {
      checkout = await createPayPalOrder({ env, paymentRequest: requestRow, draft, amountCents, paymentUrl });
      checkoutUrl = checkout.approve_url || paymentUrl;
      externalCheckoutId = checkout.id || null;
      providerStatus = "paypal_order_created";
    }

    const patch = {
      public_payment_url: paymentUrl,
      checkout_url: checkoutUrl,
      external_checkout_id: externalCheckoutId,
      provider_status: providerStatus,
      updated_at: new Date().toISOString()
    };
    const updated = await patchPaymentRequest(env, requestRow.id, patch);
    await Promise.all([
      patchQuoteDraft(env, draft.id, { deposit_request_status: "requested", deposit_requested_at: new Date().toISOString(), latest_deposit_payment_request_id: requestRow.id, updated_at: new Date().toISOString() }).catch(() => null),
      patchConversion(env, conversion?.id, { latest_deposit_payment_request_id: requestRow.id, updated_at: new Date().toISOString() }).catch(() => null)
    ]);

    return withCors(json({
      ok: true,
      payment_request: updated || { ...requestRow, ...patch },
      public_payment_url: paymentUrl,
      checkout_url: checkoutUrl,
      provider,
      stripe_created: provider === "stripe" && !!checkout?.id,
      paypal_created: provider === "paypal" && !!checkout?.id,
      next_step: checkoutUrl && checkoutUrl !== paymentUrl ? "Send the provider checkout link/customer payment page to the customer. The verified webhook can mark the deposit paid automatically." : "Send the secure payment page or record manual deposit payment from the admin screen."
    }));
  } catch (err) {
    return withCors(json({ ok: false, error: err?.message || "Could not create deposit/payment request.", migration_hint: "Apply Build 180 SQL first, then Build 181 SQL before using PayPal/verified provider deposits." }, 500));
  }
}

export async function onRequestGet() { return withCors(methodNotAllowed()); }
export async function onRequestOptions() { return new Response("", { status: 204, headers: corsHeaders() }); }

async function loadQuoteDraft(env, id) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_proposal_drafts?select=${encodeURIComponent(QUOTE_SELECT)}&id=eq.${encodeURIComponent(id)}&limit=1`, { headers: serviceHeaders(env) });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not load quote/proposal draft."));
  return Array.isArray(data) ? data[0] || null : null;
}

async function findConversionDraft(env, draftId) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/lead_conversion_drafts?select=${encodeURIComponent(CONVERSION_SELECT)}&quote_proposal_draft_id=eq.${encodeURIComponent(draftId)}&order=updated_at.desc&limit=1`, { headers: serviceHeaders(env) });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) return null;
  return Array.isArray(data) ? data[0] || null : null;
}

async function insertPaymentRequest(env, payload) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_deposit_payment_requests`, { method: "POST", headers: { ...serviceHeaders(env), Prefer: "return=representation" }, body: JSON.stringify(payload) });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) throw new Error(extractSupabaseError(data, text, "Could not insert deposit/payment request."));
  return Array.isArray(data) ? data[0] || null : data;
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

async function createStripeCheckoutSession({ env, request, paymentRequest, draft, amountCents, customerEmail, paymentUrl }) {
  const successUrl = new URL("/quote-payment.html", request.url);
  successUrl.searchParams.set("request_id", paymentRequest.id);
  successUrl.searchParams.set("payment", "returned");
  const cancelUrl = new URL(paymentUrl);
  cancelUrl.searchParams.set("payment", "cancelled");

  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("success_url", successUrl.toString());
  form.set("cancel_url", cancelUrl.toString());
  form.set("payment_method_types[0]", "card");
  form.set("line_items[0][price_data][currency]", "cad");
  form.set("line_items[0][price_data][product_data][name]", `${draft.title || "Rosie Dazzlers quote"} deposit`);
  form.set("line_items[0][price_data][unit_amount]", String(amountCents));
  form.set("line_items[0][quantity]", "1");
  if (customerEmail) form.set("customer_email", customerEmail);
  form.set("metadata[quote_deposit_payment_request_id]", paymentRequest.id);
  form.set("metadata[quote_proposal_draft_id]", draft.id);
  form.set("metadata[payment_provider]", "stripe");
  form.set("metadata[purpose]", "quote_deposit");

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", { method: "POST", headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, "Content-Type": "application/x-www-form-urlencoded" }, body: form.toString() });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok || !data?.id || !data?.url) throw new Error(`Stripe error creating quote deposit checkout. ${text}`);
  return data;
}

async function createPayPalOrder({ env, paymentRequest, draft, amountCents, paymentUrl }) {
  const tokenResult = await getPayPalAccessToken(env);
  if (!tokenResult.ok) throw new Error(tokenResult.error || "Could not get PayPal access token.");
  const amount = (Number(amountCents || 0) / 100).toFixed(2);
  const customId = encodeURIComponent(JSON.stringify({ quote_deposit_payment_request_id: paymentRequest.id, quote_proposal_draft_id: draft.id, purpose: "quote_deposit" }));
  const payload = {
    intent: "CAPTURE",
    purchase_units: [{
      reference_id: paymentRequest.id,
      custom_id: customId,
      description: `${draft.title || "Rosie Dazzlers quote"} deposit`,
      amount: { currency_code: "CAD", value: amount }
    }],
    application_context: {
      brand_name: "Rosie Dazzlers",
      landing_page: "NO_PREFERENCE",
      user_action: "PAY_NOW",
      return_url: `${paymentUrl}&paypal_return=1`,
      cancel_url: `${paymentUrl}&paypal_cancelled=1`
    }
  };
  const res = await fetch(`${paypalBase(env)}/v2/checkout/orders`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tokenResult.token}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok || !data?.id) throw new Error(`PayPal error creating quote deposit order. ${text}`);
  const approve = Array.isArray(data.links) ? data.links.find((link) => String(link.rel || "").toLowerCase() === "approve") : null;
  return { ...data, approve_url: approve?.href || null };
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
function hasPayPalConfig(env) { return !!(env?.PAYPAL_CLIENT_ID && (env?.PAYPAL_CLIENT_SECRET || env?.PAYPAL_SECRET)); }
function normalizeProvider(value) { const text = String(value || "manual").trim().toLowerCase(); return text === "stripe" || text === "paypal" ? text : "manual"; }
function moneyToCents(value) { if (value === null || value === undefined || value === "") return 0; const raw = Number(value); if (!Number.isFinite(raw) || raw < 0) return 0; return Math.round(raw > 9999 ? raw : raw * 100); }
function siteOrigin(request, env) { const configured = cleanText(env?.SITE_ORIGIN || env?.PUBLIC_SITE_ORIGIN); if (configured) return configured.replace(/\/+$/, ""); const url = new URL(request.url); return `${url.protocol}//${url.host}`; }
function makeToken() { const bytes = new Uint8Array(32); crypto.getRandomValues(bytes); return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(""); }
async function sha256Hex(value) { const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(value || ""))); return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join(""); }
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
function extractSupabaseError(data, text, fallback) { if (data?.message) return data.message; if (typeof text === "string" && text.trim()) return text.slice(0, 300); return fallback; }
function corsHeaders() { return { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-password, x-staff-email, x-staff-user-id", "Cache-Control": "no-store" }; }
function withCors(response) { const headers = new Headers(response.headers || {}); for (const [k, v] of Object.entries(corsHeaders())) headers.set(k, v); return new Response(response.body, { status: response.status, statusText: response.statusText, headers }); }
