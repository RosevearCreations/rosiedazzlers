// Build 184 — poll Stripe/PayPal refund status and sync local refund tracking.
import { requireStaffAccess, json, serviceHeaders, cleanText, isUuid } from "../_lib/staff-auth.js";

const REFUND_SELECT = [
  "id", "quote_deposit_payment_request_id", "quote_proposal_draft_id", "lead_id", "booking_id",
  "provider", "provider_refund_id", "refund_status", "refund_amount_cents", "currency", "reason", "provider_payload", "refunded_at", "created_at", "updated_at"
].join(",");

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability: "manage_bookings", allowLegacyAdminFallback: true });
    if (!access.ok) return access.response;
    if (!hasSupabaseConfig(env)) return json({ ok: false, error: "Supabase service configuration is missing." }, 500);

    const refundId = cleanText(body.refund_record_id || body.id);
    const providerRefundId = cleanText(body.provider_refund_id || body.providerRefundId);
    const row = await loadRefundRecord(env, { refundId, providerRefundId });
    if (!row) return json({ ok: false, error: "Refund record was not found." }, 404);
    if (!row.provider_refund_id) return json({ ok: false, error: "Refund record has no provider_refund_id to poll.", refund: row }, 400);

    const provider = String(body.provider || row.provider || "").trim().toLowerCase();
    let providerResult;
    if (provider === "stripe") providerResult = await pollStripeRefund(env, row.provider_refund_id);
    else if (provider === "paypal") providerResult = await pollPayPalRefund(env, row.provider_refund_id);
    else return json({ ok: false, error: "Only Stripe and PayPal provider refunds can be polled.", provider, refund: row }, 400);

    if (!providerResult.ok) return json({ ok: false, error: providerResult.error || "Provider refund status poll failed.", provider, refund: row }, providerResult.status || 502);

    const now = new Date().toISOString();
    const patch = {
      refund_status: normalizeRefundStatus(provider, providerResult.payload),
      provider_payload: providerResult.payload,
      refunded_at: providerResult.refunded_at || row.refunded_at || (isFinalRefundStatus(providerResult.payload) ? now : null),
      updated_at: now
    };
    const updated = await patchRefundRecord(env, row.id, patch);
    await patchPaymentRequestRefundStatus(env, row.quote_deposit_payment_request_id, patch.refund_status, patch.refunded_at).catch(() => null);

    return json({ ok: true, provider, refund: updated, provider_payload: providerResult.payload, next_step: "Provider refund status was polled and the local refund record was refreshed." });
  } catch (err) {
    return json({ ok: false, error: err?.message || "Could not poll provider refund status." }, 500);
  }
}

async function loadRefundRecord(env, { refundId, providerRefundId }) {
  let query = "";
  if (isUuid(refundId)) query = `id=eq.${encodeURIComponent(refundId)}`;
  else if (providerRefundId) query = `provider_refund_id=eq.${encodeURIComponent(providerRefundId)}`;
  else return null;
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_deposit_refund_records?select=${encodeURIComponent(REFUND_SELECT)}&${query}&limit=1`, { headers: serviceHeaders(env) });
  const rows = res.ok ? await res.json().catch(() => []) : [];
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function pollStripeRefund(env, refundId) {
  if (!env.STRIPE_SECRET_KEY) return { ok: false, status: 500, error: "STRIPE_SECRET_KEY is not configured." };
  const res = await fetch(`https://api.stripe.com/v1/refunds/${encodeURIComponent(refundId)}`, {
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` }
  });
  const text = await res.text();
  const payload = safeJson(text) || { raw: text };
  if (!res.ok) return { ok: false, status: res.status, error: payload?.error?.message || text || "Stripe refund poll failed." };
  return { ok: true, payload, refunded_at: payload.created ? new Date(Number(payload.created) * 1000).toISOString() : null };
}

async function pollPayPalRefund(env, refundId) {
  const token = await getPayPalToken(env);
  if (!token.ok) return token;
  const base = paypalBase(env);
  const res = await fetch(`${base}/v2/payments/refunds/${encodeURIComponent(refundId)}`, {
    headers: { Authorization: `Bearer ${token.access_token}`, "Content-Type": "application/json" }
  });
  const text = await res.text();
  const payload = safeJson(text) || { raw: text };
  if (!res.ok) return { ok: false, status: res.status, error: payload?.message || text || "PayPal refund poll failed." };
  return { ok: true, payload, refunded_at: payload.update_time || payload.create_time || null };
}

async function getPayPalToken(env) {
  const client = env.PAYPAL_CLIENT_ID;
  const secret = env.PAYPAL_CLIENT_SECRET || env.PAYPAL_SECRET;
  if (!client || !secret) return { ok: false, status: 500, error: "PayPal credentials are not configured." };
  const res = await fetch(`${paypalBase(env)}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(`${client}:${secret}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials"
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.access_token) return { ok: false, status: res.status, error: data?.error_description || data?.error || "Could not get PayPal token." };
  return { ok: true, access_token: data.access_token };
}

async function patchRefundRecord(env, id, patch) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/quote_deposit_refund_records?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH", headers: { ...serviceHeaders(env), Prefer: "return=representation" }, body: JSON.stringify(patch)
  });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok) throw new Error(data?.message || text || "Could not update refund record.");
  return Array.isArray(data) ? data[0] || null : data;
}

async function patchPaymentRequestRefundStatus(env, paymentRequestId, refundStatus, latestRefundAt) {
  if (!isUuid(paymentRequestId)) return null;
  const status = String(refundStatus || "").toLowerCase();
  const paymentStatus = status === "succeeded" || status === "refunded" ? "refunded" : status === "partial_refund" ? "partial_refund" : null;
  const patch = { refund_status: status || null, latest_refund_at: latestRefundAt || new Date().toISOString(), updated_at: new Date().toISOString() };
  if (paymentStatus) patch.payment_status = paymentStatus;
  await fetch(`${env.SUPABASE_URL}/rest/v1/quote_deposit_payment_requests?id=eq.${encodeURIComponent(paymentRequestId)}`, { method: "PATCH", headers: serviceHeaders(env), body: JSON.stringify(patch) });
}

function normalizeRefundStatus(provider, payload) {
  if (provider === "stripe") {
    const s = String(payload?.status || "").toLowerCase();
    if (s === "succeeded") return "succeeded";
    if (s === "failed") return "failed";
    if (s === "canceled" || s === "cancelled") return "cancelled";
    if (s === "pending" || s === "requires_action") return "pending";
  }
  if (provider === "paypal") {
    const s = String(payload?.status || "").toUpperCase();
    if (["COMPLETED", "REFUNDED"].includes(s)) return "succeeded";
    if (["PENDING"].includes(s)) return "pending";
    if (["FAILED", "DENIED"].includes(s)) return "failed";
    if (["CANCELLED", "CANCELED"].includes(s)) return "cancelled";
  }
  return "pending";
}
function isFinalRefundStatus(payload) { const s = String(payload?.status || "").toLowerCase(); return ["succeeded", "completed", "refunded"].includes(s); }
function paypalBase(env) { return env.PAYPAL_API_BASE || "https://api-m.paypal.com"; }
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }
