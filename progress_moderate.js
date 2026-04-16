import { requireStaffAccess, json, methodNotAllowed } from '../_lib/staff-auth.js';

export async function onRequestOptions(){ return new Response('', { status:204, headers:corsHeaders() }); }
export async function onRequestGet(){ return withCors(methodNotAllowed()); }
export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json().catch(() => ({}));
    const entity = String(body.entity || '').trim();
    const id = String(body.id || '').trim();
    const action = String(body.action || '').trim();
    const moderation_reason = String(body.moderation_reason || '').trim() || null;
    if (!['update','media'].includes(entity) || !id) return withCors(json({ error: 'Missing entity or id.' }, 400));
    if (!['visible','hidden','internal_only','pinned'].includes(action)) return withCors(json({ error: 'Invalid action.' }, 400));

    const access = await requireStaffAccess({ request, env, body, capability: 'manage_progress', allowLegacyAdminFallback: false });
    if (!access.ok) return withCors(access.response);

    const table = entity === 'media' ? 'job_media' : 'job_updates';
    const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify({ thread_status: action, moderated_at: new Date().toISOString(), moderated_by_name: access.actor.full_name || 'Staff', moderation_reason })
    });
    if (!res.ok) return withCors(json({ error: `Could not moderate entry. ${await res.text()}` }, 500));
    return withCors(json({ ok: true, item: (await res.json().catch(() => []))?.[0] || null }));
  } catch (err) {
    return withCors(json({ error: err?.message || 'Unexpected server error.' }, 500));
  }
}
function corsHeaders(){ return { 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type, x-admin-password, x-staff-email, x-staff-user-id','Cache-Control':'no-store' }; }
function withCors(response){ const headers=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
