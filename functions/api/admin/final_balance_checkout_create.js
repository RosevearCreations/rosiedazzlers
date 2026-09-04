// Build 217 foundation; Build 320 — duplicate-safe hosted final-balance checkout recovery.
import { requireStaffAccess, serviceHeaders, json, cleanText, cleanEmail, isUuid } from "../_lib/staff-auth.js";
import { queueCustomerLiveAlert } from "../_lib/live-interaction-alerts.js";
import { siteOrigin, newOpaqueToken, hashOpaqueToken, paymentPageUrl, safeExpiry, tokenFromPaymentUrl, statusKind } from "../_lib/final-balance-links.js";

export async function onRequestOptions(){ return new Response('', { status:204, headers:corsHeaders() }); }
export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability:'manage_bookings', allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);
    if (!env.SUPABASE_URL || !serviceKey(env)) return withCors(json({ ok:false, error:'Supabase service configuration is missing.' }, 500));

    const id = cleanText(body.payment_request_id || body.id || body.request_id);
    if (!isUuid(id)) return withCors(json({ ok:false, error:'A valid final-balance payment request id is required.' }, 400));
    const row = await loadRequest(env, id);
    if (!row) return withCors(json({ ok:false, error:'Final balance payment request was not found.' }, 404));

    const currentKind = statusKind(row);
    if (currentKind === 'paid') return withCors(json({ ok:false, error:'This balance request already appears paid. Reconcile the payment before any new checkout action.' }, 409));

    const recoveryNeeded = currentKind === 'expired' || currentKind === 'cancelled';
    const recoveryConfirmed = body.recovery_confirmed === true;
    const recoveryReason = cleanText(body.recovery_reason);
    if (recoveryNeeded && (!recoveryConfirmed || !recoveryReason)) {
      return withCors(json({ ok:false, error:'Expired or cancelled requests require explicit recovery confirmation and a recovery reason.' }, 409));
    }
    if (recoveryNeeded && !body.expires_at) {
      return withCors(json({ ok:false, error:'Payment recovery requires an explicit new future expiry.' }, 400));
    }
    if (!(Number(row.amount_cents || 0) > 0)) return withCors(json({ ok:false, error:'Final balance amount must be greater than zero.' }, 400));

    const now = new Date();
    const requestedExpiry = body.expires_at || row.expires_at || null;
    const expiry = safeExpiry(requestedExpiry, { now });
    if (!expiry.ok) return withCors(json({ ok:false, error:expiry.error }, 400));

    let publicUrl = row.payment_url || '';
    let token = tokenFromPaymentUrl(publicUrl);
    const rotate = body.rotate_link === true || !row.token_hash || !token;
    const patch = { updated_at:now.toISOString(), expires_at:expiry.value, status:'open' };
    if (recoveryNeeded) Object.assign(patch, { cancelled_at:null, cancelled_reason:null });
    if (rotate) {
      token = newOpaqueToken();
      publicUrl = paymentPageUrl(siteOrigin(request, env), row.id, token);
      Object.assign(patch, { token_hash:await hashOpaqueToken(token), payment_url:publicUrl, access_token_rotated_at:now.toISOString() });
    }

    let checkout = null;
    let checkoutUrl = row.checkout_url || null;
    let providerStatus = row.provider_status || 'manual';
    let provider = cleanText(body.provider || row.provider || (env.STRIPE_SECRET_KEY ? 'stripe' : 'manual')).toLowerCase();
    let checkoutReused = false;
    let checkoutReplaced = false;
    let providerSessionStatus = null;

    if (cleanText(body.provider).toLowerCase() === 'manual' && String(row.provider || '').toLowerCase() === 'stripe' && row.external_checkout_id) {
      return withCors(json({ ok:false, error:'An existing Stripe checkout reference must be reconciled before switching this request to manual handling.' }, 409));
    }

    if (provider === 'stripe') {
      if (!env.STRIPE_SECRET_KEY) {
        if (row.external_checkout_id || row.checkout_url) {
          return withCors(json({ ok:false, error:'Stripe recovery cannot verify the existing checkout because Stripe is not configured. Use manual review; no replacement checkout was created.' }, 409));
        }
        provider = 'manual';
        providerStatus = 'stripe_not_configured_manual_fallback';
        Object.assign(patch, { provider:'manual', provider_status:providerStatus, checkout_url:null });
      } else {
        const mode = stripeMode(env.STRIPE_SECRET_KEY);
        if (isDevelopmentLike(env) && mode === 'live') {
          return withCors(json({ ok:false, error:'Live Stripe credentials are blocked for Development payment recovery.' }, 409));
        }

        if (row.external_checkout_id && row.checkout_url) {
          const existing = await loadStripeCheckoutSession({ env, sessionId:row.external_checkout_id });
          providerSessionStatus = `${existing.status || 'unknown'}/${existing.payment_status || 'unknown'}`;
          if (existing.payment_status === 'paid') {
            return withCors(json({ ok:false, error:'Stripe reports the existing checkout as paid. Reconcile the payment before any recovery action.', provider_session_status:providerSessionStatus }, 409));
          }
          if (existing.status === 'open') {
            checkoutUrl = existing.url || row.checkout_url;
            providerStatus = 'stripe_checkout_reused_open';
            checkoutReused = true;
            Object.assign(patch, { provider:'stripe', provider_status:providerStatus, checkout_url:checkoutUrl });
          } else if (existing.status === 'expired') {
            checkout = await createStripeCheckoutSession({ env, row:{ ...row, expires_at:expiry.value }, publicUrl });
            checkoutUrl = checkout.url;
            providerStatus = 'stripe_checkout_replaced_expired';
            checkoutReplaced = true;
            Object.assign(patch, { provider:'stripe', provider_status:providerStatus, checkout_url:checkoutUrl, external_checkout_id:checkout.id, checkout_created_at:now.toISOString() });
          } else if (existing.status === 'complete') {
            return withCors(json({ ok:false, error:'Stripe reports the existing checkout as complete but payment is not reconciled locally. Recovery is blocked to prevent a possible duplicate charge.', provider_session_status:providerSessionStatus }, 409));
          } else {
            return withCors(json({ ok:false, error:'Stripe returned an unknown checkout state. Recovery failed closed and no replacement checkout was created.', provider_session_status:providerSessionStatus }, 409));
          }
        } else {
          checkout = await createStripeCheckoutSession({ env, row, publicUrl });
          checkoutUrl = checkout.url;
          providerStatus = 'stripe_checkout_created';
          Object.assign(patch, { provider:'stripe', provider_status:providerStatus, checkout_url:checkoutUrl, external_checkout_id:checkout.id, checkout_created_at:now.toISOString() });
        }
      }
    } else if (provider === 'manual') {
      providerStatus = env.STRIPE_SECRET_KEY ? 'manual_selected' : 'stripe_not_configured_manual_fallback';
      Object.assign(patch, { provider:'manual', provider_status:providerStatus, checkout_url:null });
    } else {
      return withCors(json({ ok:false, error:'Unsupported payment provider. Use Stripe or the manual fallback.' }, 400));
    }

    let notification = null;
    if (body.notify_customer === true && row.booking_id) {
      notification = await queueCustomerLiveAlert({ env, bookingId:row.booking_id, eventType:'final_balance_payment_link_ready', message:'Your secure final-balance payment link is ready.', payload:{ payment_request_id:row.id, checkout_url:checkoutUrl, payment_url:publicUrl } }).catch((err) => ({ ok:false, error:err?.message || 'Could not queue customer notification.' }));
      if (notification?.ok) Object.assign(patch, { status:'sent', link_sent_at:now.toISOString(), link_sent_count:Number(row.link_sent_count || 0) + 1 });
    }

    const patched = await patchRequest(env, row.id, patch);
    return withCors(json({
      ok:true,
      provider,
      provider_status:providerStatus,
      payment_request:staffSafePaymentRequest(patched || { ...row, ...patch }),
      checkout_url:checkoutUrl,
      public_payment_url:publicUrl,
      expires_at:expiry.value,
      stripe_checkout_created:!!checkout?.id && !checkoutReplaced,
      checkout_reused:checkoutReused,
      checkout_replaced:checkoutReplaced,
      provider_session_status:providerSessionStatus,
      duplicate_charge_guard:true,
      recovery_applied:recoveryNeeded && recoveryConfirmed,
      manual_fallback:provider === 'manual',
      notification
    }));
  } catch (err) {
    return withCors(json({ ok:false, error:err?.message || 'Could not create or recover hosted final-balance checkout.' }, 500));
  }
}

async function loadRequest(env, id) { const res = await fetch(`${env.SUPABASE_URL}/rest/v1/final_balance_payment_requests?select=*&id=eq.${encodeURIComponent(id)}&limit=1`, { headers:serviceHeaders(env) }); if (!res.ok) throw new Error(`Could not load final balance request. ${await res.text()}`); return (await res.json().catch(() => []))?.[0] || null; }
async function patchRequest(env, id, patch) { const res = await fetch(`${env.SUPABASE_URL}/rest/v1/final_balance_payment_requests?id=eq.${encodeURIComponent(id)}`, { method:'PATCH', headers:{ ...serviceHeaders(env), Prefer:'return=representation' }, body:JSON.stringify(patch) }); if (!res.ok) throw new Error(`Checkout action completed but request update failed. ${await res.text()}`); return (await res.json().catch(() => []))?.[0] || null; }

async function loadStripeCheckoutSession({ env, sessionId }) {
  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, { method:'GET', headers:{ Authorization:`Bearer ${env.STRIPE_SECRET_KEY}` } });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok || !data?.id) throw new Error(`Stripe checkout verification failed closed. ${data?.error?.message || text || 'Unknown Stripe error.'}`);
  return data;
}

async function createStripeCheckoutSession({ env, row, publicUrl }) {
  const successUrl = new URL(publicUrl); successUrl.searchParams.set('payment', 'returned');
  const cancelUrl = new URL(publicUrl); cancelUrl.searchParams.set('payment', 'cancelled');
  const form = new URLSearchParams();
  form.set('mode', 'payment'); form.set('success_url', successUrl.toString()); form.set('cancel_url', cancelUrl.toString()); form.set('payment_method_types[0]', 'card');
  form.set('line_items[0][price_data][currency]', String(row.currency || 'CAD').toLowerCase());
  form.set('line_items[0][price_data][product_data][name]', `Rosie Dazzlers final balance${row.customer_name ? ` — ${row.customer_name}` : ''}`.slice(0,220));
  form.set('line_items[0][price_data][unit_amount]', String(Math.round(Number(row.amount_cents || 0)))); form.set('line_items[0][quantity]', '1');
  if (cleanEmail(row.customer_email)) form.set('customer_email', cleanEmail(row.customer_email));
  form.set('client_reference_id', row.id); form.set('metadata[final_balance_payment_request_id]', row.id); if (row.booking_id) form.set('metadata[booking_id]', row.booking_id); form.set('metadata[purpose]', 'final_balance');
  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', { method:'POST', headers:{ Authorization:`Bearer ${env.STRIPE_SECRET_KEY}`, 'Content-Type':'application/x-www-form-urlencoded' }, body:form.toString() });
  const text = await res.text(); const data = safeJson(text); if (!res.ok || !data?.id || !data?.url) throw new Error(`Stripe error creating final-balance checkout. ${data?.error?.message || text}`); return data;
}

function stripeMode(secret) {
  const value = String(secret || '');
  if (!value) return 'not_configured';
  if (value.startsWith('sk_test_')) return 'test';
  if (value.startsWith('sk_live_')) return 'live';
  return 'unknown';
}
function isDevelopmentLike(env) {
  const branch = String(env?.CF_PAGES_BRANCH || '').toLowerCase();
  const environment = String(env?.ENVIRONMENT || env?.APP_ENV || '').toLowerCase();
  return branch === 'dev' || branch.startsWith('build') || ['dev','development','preview','test'].includes(environment);
}
function serviceKey(env) { return env?.SUPABASE_SERVICE_ROLE_KEY || env?.SUPABASE_SERVICE_KEY || env?.SUPABASE_SERVICE_ROLE || env?.SUPABASE_SECRET_KEY; }
function safeJson(text){ try { return JSON.parse(text); } catch { return null; } }
function corsHeaders(){ return { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Methods':'POST,OPTIONS', 'Access-Control-Allow-Headers':'Content-Type,x-admin-password,x-staff-email,x-staff-user-id', 'Cache-Control':'no-store' }; }
function withCors(response){ const h = new Headers(response.headers || {}); for (const [k,v] of Object.entries(corsHeaders())) h.set(k,v); return new Response(response.body, { status:response.status, statusText:response.statusText, headers:h }); }
function staffSafePaymentRequest(row) { if (!row || typeof row !== 'object') return row || null; const { token_hash, ...safe } = row; return safe; }
