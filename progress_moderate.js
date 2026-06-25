import { requireStaffAccess, json, methodNotAllowed } from './_lib/staff-auth.js';
import { schemaLooksLegacy } from './_lib/job-live-feed.js';

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
    if (!['visible','hidden','internal_only','pinned','approve_customer','reject_customer','make_internal'].includes(action)) return withCors(json({ error: 'Invalid action.' }, 400));

    const access = await requireStaffAccess({ request, env, body, capability: 'manage_progress', allowLegacyAdminFallback: true });
    if (!access.ok) return withCors(access.response);

    const table = entity === 'media' ? 'job_media' : 'job_updates';
    const now = new Date().toISOString();
    const actorName = access.actor.full_name || access.actor.email || 'Staff';
    const enhancedPatch = moderationPatch(action, now, access.actor, actorName, moderation_reason);
    let legacyUsed = false;
    let res = await patchRow(env, table, id, enhancedPatch);
    if (!res.ok) {
      const text = await res.text();
      if (!schemaLooksLegacy(text)) return withCors(json({ error: `Could not moderate entry. ${text}` }, 500));
      legacyUsed = true;
      res = await patchRow(env, table, id, legacyPatch(action, now, actorName, moderation_reason));
      if (!res.ok) return withCors(json({ error: `Could not moderate entry. ${await res.text()}` }, 500));
    }
    const item = (await res.json().catch(() => []))?.[0] || null;

    if (body.booking_id) {
      await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`, {
        method:'POST',
        headers:{ apikey:env.SUPABASE_SERVICE_ROLE_KEY, Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type':'application/json' },
        body:JSON.stringify([{
          booking_id:String(body.booking_id),
          event_type:action === 'approve_customer' ? 'progress_item_approved_for_customer' : 'progress_item_moderated',
          actor_name:actorName,
          event_note:action === 'approve_customer' ? `${entity} approved for customer viewing.` : `${entity} moderation changed to ${action}.`,
          payload:{ entity, id, action }
        }])
      }).catch(()=>null);
    }

    return withCors(json({ ok: true, item, schema_fallback_used: legacyUsed }));
  } catch (err) {
    return withCors(json({ error: err?.message || 'Unexpected server error.' }, 500));
  }
}

function moderationPatch(action, now, actor, actorName, reason) {
  const base = { moderated_at: now, moderated_by_name: actorName, moderation_reason: reason };
  if (action === 'approve_customer') return { ...base, visibility:'customer', thread_status:'visible', review_status:'approved', requires_admin_review:false, customer_visible_at:now, approved_by_staff_user_id:actor.id || null, approved_by_staff_name:actorName };
  if (action === 'reject_customer') return { ...base, visibility:'internal', thread_status:'hidden', review_status:'rejected', requires_admin_review:false, customer_visible_at:null, approved_by_staff_user_id:null, approved_by_staff_name:null };
  if (action === 'make_internal' || action === 'internal_only') return { ...base, visibility:'internal', thread_status:'internal_only', review_status:'not_required', requires_admin_review:false, customer_visible_at:null, approved_by_staff_user_id:null, approved_by_staff_name:null };
  if (action === 'hidden') return { ...base, thread_status:'hidden' };
  if (action === 'pinned') return { ...base, thread_status:'pinned' };
  return { ...base, thread_status:'visible' };
}

function legacyPatch(action, now, actorName, reason) {
  const base = { moderated_at:now, moderated_by_name:actorName, moderation_reason:reason };
  if (action === 'approve_customer') return { ...base, visibility:'customer', thread_status:'visible' };
  if (action === 'reject_customer') return { ...base, visibility:'internal', thread_status:'hidden' };
  if (action === 'make_internal' || action === 'internal_only') return { ...base, visibility:'internal', thread_status:'internal_only' };
  return { ...base, thread_status:action };
}

function patchRow(env, table, id, patch) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
    method:'PATCH',
    headers:{ apikey:env.SUPABASE_SERVICE_ROLE_KEY, Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type':'application/json', Prefer:'return=representation' },
    body:JSON.stringify(patch)
  });
}
function corsHeaders(){ return { 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type, x-admin-password, x-staff-email, x-staff-user-id','Cache-Control':'no-store' }; }
function withCors(response){ const headers=new Headers(response.headers||{}); for(const [k,v] of Object.entries(corsHeaders())) headers.set(k,v); return new Response(response.body,{status:response.status,statusText:response.statusText,headers}); }
