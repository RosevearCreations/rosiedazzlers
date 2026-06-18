import { requireStaffAccess, serviceHeaders, json } from "../_lib/staff-auth.js";
import { normalizeAudience, normalizeLiveStage, audienceFields, schemaLooksLegacy } from "../_lib/job-live-feed.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const bookingId = String(body.booking_id || '').trim();
    const note = String(body.note || '').trim();
    const audience = normalizeAudience(body.audience, body.visibility);
    const stage = normalizeLiveStage(body.stage);
    const customerActionRequired = body.customer_action_required === true;

    if (!bookingId) return json({ error: 'Missing booking_id.' }, 400);
    if (!note) return json({ error: 'Missing note.' }, 400);
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'Server configuration is incomplete.' }, 500);

    const access = await requireStaffAccess({ request, env, body, capability: 'work_booking', bookingId, allowLegacyAdminFallback: false });
    if (!access.ok) return access.response;
    const actor = access.actor || {};
    const audiencePatch = audienceFields(audience, actor);
    const base = {
      booking_id: bookingId,
      created_by: actor.full_name || actor.email || 'Staff',
      note: note.slice(0, 4000),
      visibility: audiencePatch.visibility,
      staff_user_id: actor.id || null
    };
    const enhanced = {
      ...base,
      stage,
      source_channel: 'detailer',
      customer_action_required: customerActionRequired,
      ...audiencePatch
    };

    let usedLegacySchema = false;
    let insertRes = await insertUpdate(env, enhanced);
    if (!insertRes.ok) {
      const text = await insertRes.text();
      if (!schemaLooksLegacy(text)) return json({ error: `Could not save note. ${text}` }, 500);
      usedLegacySchema = true;
      insertRes = await insertUpdate(env, base);
      if (!insertRes.ok) return json({ error: `Could not save note. ${await insertRes.text()}` }, 500);
    }
    const row = (await insertRes.json().catch(() => []))?.[0] || null;

    await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`, {
      method: 'POST',
      headers: serviceHeaders(env),
      body: JSON.stringify([{
        booking_id: bookingId,
        event_type: audience === 'customer' ? 'detailer_update_posted' : audience === 'review' ? 'progress_update_pending_review' : 'internal_note_posted',
        event_note: audience === 'customer' ? note.slice(0, 250) : `${stage} ${audience} note saved.`,
        actor_name: actor.full_name || actor.email || 'Staff',
        payload: { audience, stage, customer_action_required: customerActionRequired, actor_id: actor.id || null, update_id: row?.id || null }
      }])
    }).catch(() => null);
    await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}`, {
      method:'PATCH', headers:{...serviceHeaders(env), Prefer:'return=minimal'}, body:JSON.stringify({ progress_last_staff_update_at:new Date().toISOString() })
    }).catch(()=>null);

    return json({ ok: true, update: row, audience, stage, schema_fallback_used: usedLegacySchema });
  } catch (err) {
    const status = Number.isInteger(err?.status) ? err.status : 500;
    return json({ error: err?.message || 'Unexpected server error.' }, status);
  }
}

function insertUpdate(env, row) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/job_updates`, { method:'POST', headers:{...serviceHeaders(env), Prefer:'return=representation'}, body:JSON.stringify([row]) });
}
