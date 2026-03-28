import { requireStaffAccess } from "../_lib/staff-auth.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const bookingId = String(body.booking_id || '').trim();
    const note = String(body.note || '').trim();
    const visibilityRaw = String(body.visibility || 'customer').trim().toLowerCase();
    const visibility = ['customer', 'internal'].includes(visibilityRaw) ? visibilityRaw : 'customer';

    if (!bookingId) return json({ error: 'Missing booking_id.' }, 400);
    if (!note) return json({ error: 'Missing note.' }, 400);
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      return json({ error: 'Server configuration is incomplete.' }, 500);
    }

    const access = await requireStaffAccess({
      request,
      env,
      body,
      capability: 'work_booking',
      bookingId,
      allowLegacyAdminFallback: false
    });

    if (!access.ok) return access.response;
    const actor = access.actor || {};

    const headers = {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    };

    const insertRes = await fetch(`${env.SUPABASE_URL}/rest/v1/job_updates`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation' },
      body: JSON.stringify([{
        booking_id: bookingId,
        created_by: actor.full_name || actor.email || 'Staff',
        note: note.slice(0, 4000),
        visibility
      }])
    });

    if (!insertRes.ok) {
      return json({ error: `Could not save note. ${await insertRes.text()}` }, 500);
    }

    await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`, {
      method: 'POST',
      headers,
      body: JSON.stringify([{
        booking_id: bookingId,
        event_type: visibility === 'internal' ? 'internal_note_posted' : 'detailer_update_posted',
        event_note: note.slice(0, 250),
        actor_name: actor.full_name || actor.email || 'Staff',
        payload: { visibility, actor_id: actor.id || null }
      }])
    }).catch(() => null);

    return json({ ok: true });
  } catch (err) {
    const status = Number.isInteger(err?.status) ? err.status : 500;
    return json({ error: err?.message || 'Unexpected server error.' }, status);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}
