// Build 217 — controlled final-balance link expiry, replacement, customer notification, and cancellation.
import { requireStaffAccess, serviceHeaders, json, cleanText, isUuid } from "../_lib/staff-auth.js";
import { queueCustomerLiveAlert } from "../_lib/live-interaction-alerts.js";
import { siteOrigin, newOpaqueToken, hashOpaqueToken, paymentPageUrl, safeExpiry, tokenFromPaymentUrl, statusKind } from "../_lib/final-balance-links.js";

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const id = cleanText(body.payment_request_id || body.id);
    const action = cleanText(body.action).toLowerCase();
    const access = await requireStaffAccess({ request, env, body, capability:"manage_bookings", allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);
    if (!isUuid(id)) return withCors(json({ ok:false, error:"A valid final-balance payment request id is required." }, 400));
    if (!hasSupabaseConfig(env)) return withCors(json({ ok:false, error:"Supabase service configuration is missing." }, 500));
    if (!['rotate_link','set_expiry','cancel','reopen','notify_customer'].includes(action)) return withCors(json({ ok:false, error:"Unsupported final-balance request action." }, 400));

    const row = await loadRequest(env, id);
    if (!row) return withCors(json({ ok:false, error:"Final-balance payment request was not found." }, 404));
    const now = new Date();
    const currentState = statusKind(row, now);
    if (currentState === 'paid' && action !== 'notify_customer') return withCors(json({ ok:false, error:"A settled payment request cannot be changed." }, 409));

    const patch = { updated_at:now.toISOString() };
    let publicPaymentUrl = row.payment_url || null;
    let notification = null;

    if (action === 'rotate_link' || action === 'reopen') {
      const expiry = safeExpiry(body.expires_at || null, { now });
      if (!expiry.ok) return withCors(json({ ok:false, error:expiry.error }, 400));
      const token = newOpaqueToken();
      publicPaymentUrl = paymentPageUrl(siteOrigin(request, env), row.id, token);
      Object.assign(patch, {
        token_hash:await hashOpaqueToken(token), payment_url:publicPaymentUrl, expires_at:expiry.value,
        access_token_rotated_at:now.toISOString(), status:'open', cancelled_at:null, cancelled_reason:null,
        cancelled_by_staff_user_id:null, cancelled_by_staff_name:null
      });
    }

    if (action === 'set_expiry') {
      if (currentState === 'cancelled') return withCors(json({ ok:false, error:"Reopen the cancelled request before setting a new expiry." }, 409));
      const expiry = safeExpiry(body.expires_at, { now });
      if (!expiry.ok) return withCors(json({ ok:false, error:expiry.error }, 400));
      patch.expires_at = expiry.value;
    }

    if (action === 'cancel') {
      if (currentState === 'cancelled') return withCors(json({ ok:true, message:"This payment request is already cancelled.", payment_request:staffSafePaymentRequest(row) }, 200));
      Object.assign(patch, {
        status:'cancelled', cancelled_at:now.toISOString(), cancelled_reason:cleanText(body.reason).slice(0,280) || 'Cancelled by staff',
        cancelled_by_staff_user_id:access.actor?.id || null, cancelled_by_staff_name:access.actor?.full_name || access.actor?.email || 'Staff'
      });
    }

    if (action === 'notify_customer') {
      if (currentState !== 'open') return withCors(json({ ok:false, error:"Only an active payment request can be queued for customer notification." }, 409));
      if (!row.booking_id) return withCors(json({ ok:false, error:"This payment request is not linked to a booking, so it cannot use the customer notification queue." }, 409));
      if (!tokenFromPaymentUrl(publicPaymentUrl)) return withCors(json({ ok:false, error:"Create a replacement secure link before notifying the customer." }, 409));
      notification = await queueCustomerLiveAlert({
        env, bookingId:row.booking_id, eventType:'final_balance_payment_link_ready',
        message:'Your secure final-balance payment link is ready.',
        payload:{ payment_request_id:row.id, payment_url:publicPaymentUrl }
      }).catch((err) => ({ ok:false, error:err?.message || 'Customer notification could not be queued.' }));
      if (notification?.ok) Object.assign(patch, { status:'sent', link_sent_at:now.toISOString(), link_sent_count:Number(row.link_sent_count || 0) + 1 });
    }

    const updated = await patchRequest(env, id, patch);
    return withCors(json({
      ok:true,
      action,
      message:action === 'notify_customer' ? (notification?.ok ? 'Customer notification was queued for delivery.' : 'The link remains active, but the notification was not queued.') : 'Final-balance request updated.',
      notification,
      public_payment_url:publicPaymentUrl,
      payment_request:staffSafePaymentRequest(updated || { ...row, ...patch })
    }));
  } catch (err) {
    return withCors(json({ ok:false, error:err?.message || 'Could not update the final-balance request.' }, 500));
  }
}

async function loadRequest(env, id) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/final_balance_payment_requests?select=*&id=eq.${encodeURIComponent(id)}&limit=1`, { headers:serviceHeaders(env) });
  if (!res.ok) throw new Error(`Could not load final-balance request. ${await res.text()}`);
  return (await res.json().catch(() => []))?.[0] || null;
}
async function patchRequest(env, id, patch) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/final_balance_payment_requests?id=eq.${encodeURIComponent(id)}`, { method:'PATCH', headers:{ ...serviceHeaders(env), Prefer:'return=representation' }, body:JSON.stringify(patch) });
  if (!res.ok) throw new Error(`Could not update final-balance request. ${await res.text()}`);
  return (await res.json().catch(() => []))?.[0] || null;
}
function hasSupabaseConfig(env) { return !!(env?.SUPABASE_URL && (env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY)); }
export async function onRequestOptions() { return new Response('', { status:204, headers:corsHeaders() }); }
function corsHeaders() { return { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'POST,OPTIONS', 'Access-Control-Allow-Headers':'Content-Type,x-admin-password,x-staff-email,x-staff-user-id', 'Cache-Control':'no-store' }; }
function withCors(response) { const h = new Headers(response.headers || {}); for (const [k,v] of Object.entries(corsHeaders())) h.set(k,v); return new Response(response.body, { status:response.status, statusText:response.statusText, headers:h }); }

function staffSafePaymentRequest(row) {
  if (!row || typeof row !== "object") return row || null;
  const { token_hash, ...safe } = row;
  return safe;
}
