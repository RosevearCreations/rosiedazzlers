
import { requireStaffAccess, serviceHeaders, json, methodNotAllowed, isUuid } from "../_lib/staff-auth.js";
export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }
export async function onRequestPost(context){
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const customer_profile_id = String(body.customer_profile_id || "").trim();
    if (!customer_profile_id) return withCors(json({ error:"Missing customer_profile_id." },400));
    if (!isUuid(customer_profile_id)) return withCors(json({ error:"Invalid customer_profile_id." },400));
    const access = await requireStaffAccess({ request, env, body, capability:"manage_bookings", allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);
    const headers = serviceHeaders(env);
    const profileRes = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_profiles?select=*&id=eq.${encodeURIComponent(customer_profile_id)}&limit=1`, { headers });
    if (!profileRes.ok) return withCors(json({ error:`Could not load customer profile. ${await profileRes.text()}` },500));
    const profileRows = await profileRes.json().catch(() => []); const profile = Array.isArray(profileRows)? profileRows[0] || null : null; if(!profile) return withCors(json({ error:'Customer profile not found.' },404));
    const email = String(profile.email || profile.customer_email || '').trim().toLowerCase(); const phone = String(profile.phone || profile.customer_phone || '').trim(); const tierCode = profile.tier_code ? String(profile.tier_code) : null;
    const [tierRes, bookingsRes, vehiclesRes, vehicleMediaRes, giftsRes, redemptionsRes] = await Promise.all([
      tierCode ? fetch(`${env.SUPABASE_URL}/rest/v1/customer_tiers?select=*&code=eq.${encodeURIComponent(tierCode)}&limit=1`, { headers }) : Promise.resolve(null),
      fetch(buildBookingsUrl(env, { email, phone }), { headers }),
      fetch(`${env.SUPABASE_URL}/rest/v1/customer_vehicles?select=*&customer_profile_id=eq.${encodeURIComponent(customer_profile_id)}&order=display_order.asc,created_at.desc`, { headers }).catch(() => null),
      fetch(`${env.SUPABASE_URL}/rest/v1/customer_vehicle_media?select=*&customer_profile_id=eq.${encodeURIComponent(customer_profile_id)}&order=is_deleted.asc,is_primary.desc,created_at.desc`, { headers }).catch(() => null),
      fetch(`${env.SUPABASE_URL}/rest/v1/gift_certificates?select=*&or=(purchaser_email.eq.${encodeURIComponent(email)},recipient_email.eq.${encodeURIComponent(email)})&order=created_at.desc`, { headers }).catch(() => null),
      fetch(`${env.SUPABASE_URL}/rest/v1/gift_certificate_redemptions?select=id,gift_certificate_id,booking_id,amount_cents,created_at,notes,gift_certificate:gift_certificates(code,purchaser_email,recipient_email)&order=created_at.desc`, { headers }).catch(() => null)
    ]);
    if (tierRes && !tierRes.ok) return withCors(json({ error:`Could not load customer tier. ${await tierRes.text()}` },500));
    if (!bookingsRes.ok) return withCors(json({ error:`Could not load related bookings. ${await bookingsRes.text()}` },500));
    const tierRows = tierRes ? await tierRes.json().catch(() => []) : []; const bookingRows = await bookingsRes.json().catch(() => []); const vehiclesRows = vehiclesRes && vehiclesRes.ok ? await vehiclesRes.json().catch(() => []) : []; const vehicleMediaRows = vehicleMediaRes && vehicleMediaRes.ok ? await vehicleMediaRes.json().catch(() => []) : []; const giftRows = giftsRes && giftsRes.ok ? await giftsRes.json().catch(() => []) : []; const redemptionRows = redemptionsRes && redemptionsRes.ok ? await redemptionsRes.json().catch(() => []) : [];
    const tier = Array.isArray(tierRows)? tierRows[0] || null : null; const bookings=Array.isArray(bookingRows)?bookingRows:[]; const summary=summarizeBookings(bookings); const redemptions = Array.isArray(redemptionRows)? redemptionRows.filter((row)=>{ const g=row.gift_certificate || {}; return String(g.purchaser_email||'').toLowerCase()===email || String(g.recipient_email||'').toLowerCase()===email; }):[];
    const vehicles = Array.isArray(vehiclesRows)?vehiclesRows.map(v => ({ ...v, media: Array.isArray(vehicleMediaRows)?vehicleMediaRows.filter(m => String(m.vehicle_id) === String(v.id)) : [] })) : [];
    return withCors(json({ ok:true, actor:{ id:access.actor.id||null, full_name:access.actor.full_name||null, email:access.actor.email||null, role_code:access.actor.role_code||null }, customer_profile: profile, customer_tier: tier, booking_summary: summary, bookings, vehicles, vehicle_media: Array.isArray(vehicleMediaRows)?vehicleMediaRows:[], gift_certificates: Array.isArray(giftRows)?giftRows:[], redemptions }));
  } catch (err) { return withCors(json({ error: err?.message || 'Unexpected server error.' },500)); }
}
export async function onRequestGet(){ return withCors(methodNotAllowed()); }
function buildBookingsUrl(env,{email,phone}){ let url=`${env.SUPABASE_URL}/rest/v1/bookings?select=*&order=service_date.desc,created_at.desc`; const orParts=[]; if(email) orParts.push(`customer_email.eq.${encodeURIComponent(email)}`); if(phone) orParts.push(`customer_phone.eq.${encodeURIComponent(phone)}`); if(!orParts.length) url += `&id=eq.__no_match__`; else url += `&or=(${orParts.join(',')})`; return url; }
function summarizeBookings(bookings){ const out={ booking_count:0, completed_count:0, cancelled_count:0, active_count:0, total_estimated_value_cents:0, total_deposits_cents:0, last_booking_at:null }; for(const row of bookings){ out.booking_count += 1; const status=String(row.status||'').toLowerCase(); const job=String(row.job_status||'').toLowerCase(); if(status==='cancelled'||job==='cancelled') out.cancelled_count += 1; else out.active_count += 1; if(status==='completed'||job==='completed') out.completed_count += 1; out.total_estimated_value_cents += Number(row.price_total_cents || 0); out.total_deposits_cents += Number(row.deposit_cents || 0); const when=row.service_date || row.created_at || null; if(when && (!out.last_booking_at || Date.parse(when) > Date.parse(out.last_booking_at))) out.last_booking_at = when; } return out; }
function corsHeaders(){ return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"Content-Type, x-admin-password, x-staff-email, x-staff-user-id","Cache-Control":"no-store"}; }
function withCors(response){ const headers=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
