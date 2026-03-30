import { getCurrentCustomerSession } from "./_lib/customer-session.js";

export async function onRequestOptions() {
  return new Response("", { status: 204, headers: corsHeaders() });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const current = await getCurrentCustomerSession({ env, request });
    if (!current?.customer_profile?.id) return withCors(json({ error: "Unauthorized." }, 401));
    const customerId = current.customer_profile.id;
    const headers = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, Accept: 'application/json' };
    const [giftsRes, redemptionsRes] = await Promise.all([
      fetch(`${env.SUPABASE_URL}/rest/v1/gift_certificates?select=id,code,original_amount_cents,remaining_cents,status,expires_at,created_at&customer_profile_id=eq.${encodeURIComponent(customerId)}&order=created_at.desc`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/gift_redemptions?select=id,gift_certificate_id,booking_id,amount_cents,created_at&customer_profile_id=eq.${encodeURIComponent(customerId)}&order=created_at.desc`, { headers })
    ]);
    if (!giftsRes.ok) return withCors(json({ error: `Could not load gift history. ${await giftsRes.text()}` }, 500));
    if (!redemptionsRes.ok) return withCors(json({ error: `Could not load redemption history. ${await redemptionsRes.text()}` }, 500));
    const gifts = await giftsRes.json().catch(() => []);
    const redemptions = await redemptionsRes.json().catch(() => []);
    return withCors(json({ ok: true, gifts: Array.isArray(gifts)?gifts:[], redemptions: Array.isArray(redemptions)?redemptions:[] }));
  } catch (err) {
    return withCors(json({ error: err?.message || "Unexpected server error." }, 500));
  }
}

function json(data, status=200){ return new Response(JSON.stringify(data, null, 2), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } }); }
function corsHeaders(){ return { "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Methods":"GET,OPTIONS", "Access-Control-Allow-Headers":"Content-Type", "Cache-Control":"no-store" }; }
function withCors(response){ const h=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) h.set(k,v); return new Response(response.body,{ status: response.status, statusText: response.statusText, headers: h }); }
