
import { requireStaffAccess, serviceHeaders, json, methodNotAllowed, cleanText, isUuid } from "../_lib/staff-auth.js";
export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }
export async function onRequestPost(context){
  const { request, env } = context;
  try {
    const body = await request.json().catch(()=>({}));
    const vehicle_id = String(body.vehicle_id || '').trim();
    const media_id = String(body.media_id || '').trim();
    const garage_display_media_url = cleanText(body.garage_display_media_url);
    const garage_display_media_kind = cleanText(body.garage_display_media_kind);
    const admin_override_reason = cleanText(body.admin_override_reason);
    if (!vehicle_id || !isUuid(vehicle_id)) return withCors(json({ error:'Invalid vehicle_id.' },400));
    const access = await requireStaffAccess({ request, env, body, capability:'manage_bookings', allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);
    const headers = serviceHeaders(env);
    if (media_id && isUuid(media_id)) {
      await fetch(`${env.SUPABASE_URL}/rest/v1/customer_vehicle_media?id=eq.${encodeURIComponent(media_id)}`, { method:'PATCH', headers:{ ...headers, Prefer:'return=minimal' }, body: JSON.stringify({ admin_override_reason, is_primary:true, updated_at:new Date().toISOString() }) }).catch(()=>null);
    }
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_vehicles?id=eq.${encodeURIComponent(vehicle_id)}`, { method:'PATCH', headers:{ ...headers, Prefer:'return=representation' }, body: JSON.stringify({ garage_display_media_url: garage_display_media_url || null, garage_display_media_kind: garage_display_media_kind || null, updated_at:new Date().toISOString() }) });
    if (!res.ok) return withCors(json({ error:`Could not update garage image. ${await res.text()}` },500));
    const rows = await res.json().catch(()=>[]);
    return withCors(json({ ok:true, vehicle: Array.isArray(rows)?rows[0]||null:null }));
  } catch(err){ return withCors(json({ error: err?.message || 'Unexpected server error.' },500)); }
}
export async function onRequestGet(){ return withCors(methodNotAllowed()); }
function corsHeaders(){ return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type, x-admin-password, x-staff-email, x-staff-user-id','Cache-Control':'no-store'}; }
function withCors(response){ const headers=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
