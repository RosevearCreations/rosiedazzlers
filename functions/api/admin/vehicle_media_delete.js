
import { requireStaffAccess, serviceHeaders, json, methodNotAllowed, cleanText, isUuid } from "../_lib/staff-auth.js";
export async function onRequestOptions(){ return new Response("", { status:204, headers:corsHeaders() }); }
export async function onRequestPost(context){
  const { request, env } = context;
  try {
    const body = await request.json().catch(()=>({}));
    const media_id = String(body.media_id || '').trim();
    const override_reason = cleanText(body.override_reason);
    if (!media_id || !isUuid(media_id)) return withCors(json({ error:'Invalid media_id.' },400));
    const access = await requireStaffAccess({ request, env, body, capability:'manage_bookings', allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);
    const headers = serviceHeaders(env);
    const lookup = await fetch(`${env.SUPABASE_URL}/rest/v1/customer_vehicle_media?select=*&id=eq.${encodeURIComponent(media_id)}&limit=1`, { headers });
    const rows = await lookup.json().catch(()=>[]); const media = Array.isArray(rows)?rows[0]||null:null;
    if (!lookup.ok || !media) return withCors(json({ error:'Vehicle media not found.' },404));
    await fetch(`${env.SUPABASE_URL}/rest/v1/customer_vehicle_media?id=eq.${encodeURIComponent(media_id)}`, { method:'PATCH', headers:{ ...headers, Prefer:'return=minimal' }, body: JSON.stringify({ is_deleted:true, admin_override_reason: override_reason || 'Deleted by admin.', updated_at:new Date().toISOString() }) });
    await fetch(`${env.SUPABASE_URL}/rest/v1/customer_vehicles?id=eq.${encodeURIComponent(media.vehicle_id)}&garage_display_media_url=eq.${encodeURIComponent(media.media_url)}`, { method:'PATCH', headers:{ ...headers, Prefer:'return=minimal' }, body: JSON.stringify({ garage_display_media_url:null, garage_display_media_kind:null, updated_at:new Date().toISOString() }) }).catch(()=>null);
    return withCors(json({ ok:true, deleted_media_id: media_id }));
  } catch(err){ return withCors(json({ error: err?.message || 'Unexpected server error.' },500)); }
}
export async function onRequestGet(){ return withCors(methodNotAllowed()); }
function corsHeaders(){ return {'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type, x-admin-password, x-staff-email, x-staff-user-id','Cache-Control':'no-store'}; }
function withCors(response){ const headers=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
