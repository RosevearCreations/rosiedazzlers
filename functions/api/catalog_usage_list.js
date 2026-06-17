
import { requireStaffAccess, json, isUuid } from "../_lib/staff-auth.js";
export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }
export async function onRequestGet({ request, env }){
  try {
    const bookingId = String(new URL(request.url).searchParams.get('booking_id') || '').trim();
    const access = await requireStaffAccess({ request, env, capability: bookingId ? 'work_booking' : 'manage_staff', bookingId: bookingId || null, allowLegacyAdminFallback:false });
    if (!access.ok) return withCors(access.response);
    let url = `${env.SUPABASE_URL}/rest/v1/catalog_inventory_movements?select=*&order=created_at.desc&limit=100`;
    if (bookingId) { if (!isUuid(bookingId)) return withCors(json({ error:'Invalid booking_id.' },400)); url += `&booking_id=eq.${encodeURIComponent(bookingId)}`; }
    const res = await fetch(url, { headers:{ apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, Accept:'application/json' } });
    if (!res.ok) return withCors(json({ error: await res.text() },500));
    const rows = await res.json().catch(()=>[]);
    return withCors(json({ ok:true, movements: Array.isArray(rows) ? rows : [] }));
  } catch (err) { return withCors(json({ error:String(err) },500)); }
}
function corsHeaders(){return {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Methods":"GET,OPTIONS","Access-Control-Allow-Headers":"Content-Type, x-admin-password, x-staff-email, x-staff-user-id","Cache-Control":"no-store"};}
function withCors(response){ const headers=new Headers(response.headers||{}); for (const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
