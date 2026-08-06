
import { requireStaffAccess, serviceHeaders, json, methodNotAllowed, isUuid } from "../_lib/staff-auth.js";
export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }
export async function onRequestPost(context){
  const { request, env } = context;
  try {
    const body = await request.json().catch(()=>({}));
    const vehicle_id = String(body.vehicle_id || '').trim();
    if (!vehicle_id || !isUuid(vehicle_id)) return withCors(json({ error:'Invalid vehicle_id.' },400));
    const access = await requireStaffAccess({ request, env, body, capability:'manage_bookings', allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_vehicle_media?select=*&vehicle_id=eq.${encodeURIComponent(vehicle_id)}&order=is_deleted.asc,is_primary.desc,created_at.desc`, { headers: serviceHeaders(env) });
    if (!res.ok) return withCors(json({ error:`Could not load vehicle media. ${await res.text()}` },500));
    return withCors(json({ ok:true, media: await res.json().catch(()=>[]) }));
  } catch(err){ return withCors(json({ error: err?.message || 'Unexpected server error.' },500)); }
}
export async function onRequestGet(){ return withCors(methodNotAllowed()); }
function corsHeaders(){ return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type, x-admin-password, x-staff-email, x-staff-user-id','Cache-Control':'no-store'}; }
function withCors(response){ const headers=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
