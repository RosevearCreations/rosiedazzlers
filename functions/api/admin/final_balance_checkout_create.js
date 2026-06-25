import { requireStaffAccess, serviceHeaders, json, cleanText, cleanEmail, isUuid } from "../_lib/staff-auth.js";
import { queueCustomerLiveAlert } from "../_lib/live-interaction-alerts.js";

export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }
export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const access = await requireStaffAccess({ request, env, body, capability:"manage_bookings", allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return withCors(json({ ok:false, error:"Supabase service configuration is missing." }, 500));

    const id = cleanText(body.payment_request_id || body.id || body.request_id);
    if (!isUuid(id)) return withCors(json({ ok:false, error:"A valid final balance payment request id is required." }, 400));
    const headers = serviceHeaders(env);
    const row = await loadRequest(env, id);
    if (!row) return withCors(json({ ok:false, error:"Final balance payment request was not found." }, 404));
    if (isPaid(row.status) || row.paid_at) return withCors(json({ ok:false, error:"This balance request already appears paid." }, 409));
    if (!(Number(row.amount_cents || 0) > 0)) return withCors(json({ ok:false, error:"Final balance amount must be greater than zero." }, 400));

    const origin = siteOrigin(request, env);
    const publicUrl = makePublicUrl(origin, row);
    let checkout = null;
    let checkoutUrl = row.checkout_url || row.payment_url || publicUrl;
    let providerStatus = row.provider_status || "manual";
    let provider = cleanText(body.provider || row.provider || (env.STRIPE_SECRET_KEY ? "stripe" : "manual")).toLowerCase();
    const patch = { payment_url: publicUrl, updated_at: new Date().toISOString() };

    if (provider === "stripe" && env.STRIPE_SECRET_KEY) {
      checkout = await createStripeCheckoutSession({ env, row, publicUrl, request });
      checkoutUrl = checkout.url;
      providerStatus = "stripe_checkout_created";
      Object.assign(patch, { provider:"stripe", provider_status:providerStatus, checkout_url:checkoutUrl, external_checkout_id:checkout.id, checkout_created_at:new Date().toISOString(), status: cleanText(row.status) || "sent" });
    } else {
      provider = "manual";
      providerStatus = env.STRIPE_SECRET_KEY ? "manual_selected" : "stripe_not_configured_manual_fallback";
      Object.assign(patch, { provider:"manual", provider_status:providerStatus, checkout_url:row.checkout_url || null, status: cleanText(row.status) || "draft" });
    }

    const patched = await patchRequest(env, row.id, patch);
    if (body.notify_customer === true && row.booking_id) {
      await queueCustomerLiveAlert({ env, bookingId:row.booking_id, eventType:"final_balance_payment_link_ready", message:"Your secure final-balance payment link is ready.", payload:{ payment_request_id:row.id, checkout_url:checkoutUrl, payment_url:publicUrl } }).catch(() => null);
    }
    return withCors(json({ ok:true, provider, provider_status:providerStatus, payment_request:patched || { ...row, ...patch }, checkout_url:checkoutUrl, public_payment_url:publicUrl, stripe_checkout_created:!!checkout?.id, manual_fallback:provider === "manual" }));
  } catch (err) {
    return withCors(json({ ok:false, error:err?.message || "Could not create hosted final-balance checkout." }, 500));
  }
}

async function loadRequest(env, id) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/final_balance_payment_requests?select=*&id=eq.${encodeURIComponent(id)}&limit=1`, { headers:serviceHeaders(env) });
  if (!res.ok) throw new Error(`Could not load final balance request. ${await res.text()}`);
  return (await res.json().catch(() => []))?.[0] || null;
}
async function patchRequest(env, id, patch) {
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/final_balance_payment_requests?id=eq.${encodeURIComponent(id)}`, { method:"PATCH", headers:{ ...serviceHeaders(env), Prefer:"return=representation" }, body:JSON.stringify(patch) });
  if (!res.ok) throw new Error(`Checkout was created but request update failed. Apply Build 211 migration. ${await res.text()}`);
  return (await res.json().catch(() => []))?.[0] || null;
}
async function createStripeCheckoutSession({ env, row, publicUrl, request }) {
  const successUrl = new URL(publicUrl);
  successUrl.searchParams.set("payment", "returned");
  const cancelUrl = new URL(publicUrl);
  cancelUrl.searchParams.set("payment", "cancelled");
  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("success_url", successUrl.toString());
  form.set("cancel_url", cancelUrl.toString());
  form.set("payment_method_types[0]", "card");
  form.set("line_items[0][price_data][currency]", String(row.currency || "CAD").toLowerCase());
  form.set("line_items[0][price_data][product_data][name]", `Rosie Dazzlers final balance${row.customer_name ? ` — ${row.customer_name}` : ""}`.slice(0, 220));
  form.set("line_items[0][price_data][unit_amount]", String(Math.round(Number(row.amount_cents || 0))));
  form.set("line_items[0][quantity]", "1");
  if (cleanEmail(row.customer_email)) form.set("customer_email", cleanEmail(row.customer_email));
  form.set("client_reference_id", row.id);
  form.set("metadata[final_balance_payment_request_id]", row.id);
  if (row.booking_id) form.set("metadata[booking_id]", row.booking_id);
  form.set("metadata[purpose]", "final_balance");
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", { method:"POST", headers:{ Authorization:`Bearer ${env.STRIPE_SECRET_KEY}`, "Content-Type":"application/x-www-form-urlencoded" }, body:form.toString() });
  const text = await res.text();
  const data = safeJson(text);
  if (!res.ok || !data?.id || !data?.url) throw new Error(`Stripe error creating final-balance checkout. ${text}`);
  return data;
}
function makePublicUrl(origin, row){ const u=new URL("/final-balance-payment.html", origin); u.searchParams.set("request_id", row.id); return u.toString(); }
function siteOrigin(request, env){ const configured=cleanText(env.PUBLIC_SITE_ORIGIN || env.SITE_URL || env.PUBLIC_BASE_URL); if(configured) return configured.replace(/\/$/,""); return new URL(request.url).origin; }
function isPaid(v){ return /paid|succeeded|complete/.test(String(v||"").toLowerCase()); }
function safeJson(text){ try{return JSON.parse(text);}catch{return null;} }
function corsHeaders(){ return { "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Methods":"POST,OPTIONS", "Access-Control-Allow-Headers":"Content-Type,x-admin-password,x-staff-email,x-staff-user-id", "Cache-Control":"no-store" }; }
function withCors(response){ const h=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders()))h.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h}); }
