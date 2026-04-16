import { requireStaffAccess, serviceHeaders, json, methodNotAllowed, isUuid } from "../_lib/staff-auth.js";

export async function onRequestOptions(){ return new Response('', { status:204, headers:corsHeaders() }); }
export async function onRequestPost(context){
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const annotation_id = String(body.annotation_id || '').trim();
    const thread_status = String(body.thread_status || '').trim().toLowerCase();
    const moderation_reason = String(body.moderation_reason || '').trim() || null;
    if (!annotation_id || !isUuid(annotation_id)) return withCors(json({ error:'Valid annotation_id is required.' },400));
    if (!['visible','hidden','removed'].includes(thread_status)) return withCors(json({ error:'thread_status must be visible, hidden, or removed.' },400));
    const access = await requireStaffAccess({ request, env, body, capability:'manage_progress', allowLegacyAdminFallback:true });
    if (!access.ok) return withCors(access.response);
    const payload = { thread_status, moderated_at:new Date().toISOString(), moderated_by_staff_user_id: access.actor?.staff_user_id || access.actor?.id || null, moderated_by_name: access.actor?.full_name || access.actor?.email || 'Staff', moderation_reason };
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/observation_annotations?id=eq.${encodeURIComponent(annotation_id)}`, { method:'PATCH', headers:{ ...serviceHeaders(env), Prefer:'return=representation' }, body: JSON.stringify(payload) });
    if (!res.ok) return withCors(json({ error:`Could not moderate annotation. ${await res.text()}` },500));
    const rows = await res.json().catch(() => []);
    return withCors(json({ ok:true, annotation: Array.isArray(rows) ? rows[0] || null : null }));
  } catch (err) {
    return withCors(json({ error: err?.message || 'Unexpected server error.' },500));
  }
}
export async function onRequestGet(){ return withCors(methodNotAllowed()); }
function corsHeaders(){ return { 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type, x-admin-password, x-staff-email, x-staff-user-id','Cache-Control':'no-store' }; }
function withCors(response){ const h=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) h.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers:h}); }
