import { getCurrentCustomerSession, touchCustomerSession, rotateCustomerSession, appendSetCookie } from "../_lib/customer-session.js";
export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }
export async function onRequestGet(context){ return handle(context); }
export async function onRequestPost(context){ return handle(context); }
async function handle(context){
  const { request, env } = context;
  try {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return withCors(json({ error:"Server configuration is incomplete." },500));
    const current = await getCurrentCustomerSession({ env, request });
    if (!current?.customer_profile?.id) return withCors(json({ error:"Unauthorized." },401));
    await touchCustomerSession({ env, sessionId: current.session?.id || null, request });
    let rotatedCookie = null;
    if (current.needs_rotation === true) {
      const rotated = await rotateCustomerSession({ env, request, currentSession: current.session, customerProfile: current.customer_profile });
      rotatedCookie = rotated.cookie || null;
    }
    const headers = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type":"application/json" };
    const email = current.customer_profile.email;
    const [bookRes, giftRes, redeemRes, vehicleRes] = await Promise.all([
      fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=id,created_at,service_date,start_slot,status,job_status,package_code,vehicle_size,price_total_cents,deposit_cents,progress_enabled,progress_token,customer_tier_code,assigned_staff_name&customer_email=eq.${encodeURIComponent(email)}&order=created_at.desc`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/gift_certificates?select=id,code,sku,type,status,remaining_cents,face_value_cents,expires_at,currency,package_code,vehicle_size,created_at,purchaser_email,recipient_email&or=(purchaser_email.eq.${encodeURIComponent(email)},recipient_email.eq.${encodeURIComponent(email)})&order=created_at.desc`, { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/gift_certificate_redemptions?select=id,gift_certificate_id,booking_id,amount_cents,created_at,notes,gift_certificate:gift_certificates(code,purchaser_email,recipient_email),booking:bookings(service_date,package_code,status)&order=created_at.desc`, { headers }).catch(() => null),
      fetch(`${env.SUPABASE_URL}/rest/v1/customer_vehicles?select=*&customer_profile_id=eq.${encodeURIComponent(current.customer_profile.id)}&order=display_order.asc,created_at.desc`, { headers }).catch(() => null)
    ]);
    if (!bookRes.ok) return withCors(json({ error:`Could not load booking history. ${await bookRes.text()}` },500));
    if (!giftRes.ok) return withCors(json({ error:`Could not load gift certificates. ${await giftRes.text()}` },500));
    const bookings = await bookRes.json().catch(() => []);
    const gifts = await giftRes.json().catch(() => []);
    const redemptionsAll = redeemRes && redeemRes.ok ? await redeemRes.json().catch(() => []) : [];
    const vehicles = vehicleRes && vehicleRes.ok ? await vehicleRes.json().catch(() => []) : [];
    const redemptions = Array.isArray(redemptionsAll) ? redemptionsAll.filter((row) => { const gift = row.gift_certificate || {}; return (String(gift.purchaser_email || '').toLowerCase() === String(email || '').toLowerCase()) || (String(gift.recipient_email || '').toLowerCase() === String(email || '').toLowerCase()); }) : [];
    let headersOut = new Headers({ "Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store" });
    if (rotatedCookie) headersOut = appendSetCookie(headersOut, rotatedCookie);
    headersOut = applyCors(headersOut);
    return new Response(JSON.stringify({ ok:true, customer: current.customer_profile, bookings: Array.isArray(bookings)?bookings:[], vehicles: Array.isArray(vehicles)?vehicles:[], gift_certificates: Array.isArray(gifts)?gifts:[], redemptions: Array.isArray(redemptions)?redemptions:[] }, null, 2), { status:200, headers: headersOut });
  } catch (err) { return withCors(json({ error: err?.message || 'Unexpected server error.' },500)); }
}
function json(data,status=200){ return new Response(JSON.stringify(data,null,2),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"}}); }
function corsHeaders(){ return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"}; }
function applyCors(headers){ const out=headers instanceof Headers?new Headers(headers):new Headers(headers||{}); for(const [k,v] of Object.entries(corsHeaders())) if(!out.has(k)) out.set(k,v); return out; }
function withCors(response){ return new Response(response.body,{status:response.status,statusText:response.statusText,headers:applyCors(response.headers||{})}); }
