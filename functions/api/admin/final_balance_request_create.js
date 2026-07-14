// Build 185 foundation; Build 217 — create a tracked final-balance request with a token-gated public payment link.
import { requireStaffAccess, json, serviceHeaders, cleanText, isUuid } from "../_lib/staff-auth.js";
import { siteOrigin, newOpaqueToken, hashOpaqueToken, paymentPageUrl, safeExpiry } from "../_lib/final-balance-links.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability:"manage_bookings", allowLegacyAdminFallback:true });
    if (!access.ok) return access.response;
    if (!hasSupabaseConfig(env)) return json({ ok:false, error:"Supabase not configured." }, 500);

    const bookingId = cleanText(body.booking_id);
    const customerEmail = cleanText(body.customer_email);
    const amount = Number(body.amount_cents || body.balance_cents || 0);
    if (!isUuid(bookingId) && !customerEmail) return json({ ok:false, error:"booking_id or customer_email is required." }, 400);
    if (!(amount > 0)) return json({ ok:false, error:"amount_cents must be greater than zero." }, 400);
    const expiry = safeExpiry(body.expires_at || null);
    if (!expiry.ok) return json({ ok:false, error:expiry.error }, 400);

    const id = crypto.randomUUID();
    const publicToken = newOpaqueToken();
    const publicPaymentUrl = paymentPageUrl(siteOrigin(request, env), id, publicToken);
    const now = new Date().toISOString();
    const row = {
      id,
      booking_id:isUuid(bookingId) ? bookingId : null,
      customer_name:cleanText(body.customer_name) || null,
      customer_email:customerEmail || null,
      status:"open",
      amount_cents:Math.round(amount),
      currency:cleanText(body.currency) || "CAD",
      notes:cleanText(body.notes) || "Final balance request",
      token_hash:await hashOpaqueToken(publicToken),
      payment_url:publicPaymentUrl,
      expires_at:expiry.value,
      access_token_rotated_at:now,
      created_by_staff_id:access.actor?.id || null,
      created_at:now,
      updated_at:now
    };
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/final_balance_payment_requests`, { method:"POST", headers:{ ...serviceHeaders(env), Prefer:"return=representation" }, body:JSON.stringify(row) });
    const text = await res.text();
    const data = safeJson(text);
    if (!res.ok) throw new Error(data?.message || text || "Could not create final balance request. Apply Build 217 SQL before using secure links.");
    const requestRow = Array.isArray(data) ? data[0] : data;
    return json({ ok:true, request:staffSafePaymentRequest(requestRow), public_payment_url:publicPaymentUrl, expires_at:expiry.value, next_step:"Create hosted checkout or copy the secure link from Admin Payments. A customer notification is only queued when explicitly requested." });
  } catch (err) {
    return json({ ok:false, error:err?.message || "Could not create final balance request." }, 500);
  }
}
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
function safeJson(text) { try { return JSON.parse(text); } catch { return null; } }

function staffSafePaymentRequest(row) {
  if (!row || typeof row !== "object") return row || null;
  const { token_hash, ...safe } = row;
  return safe;
}
