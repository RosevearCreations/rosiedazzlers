import { schemaLooksLegacy } from "../_lib/job-live-feed.js";
import { queueStaffLiveAlert, liveCommunicationState } from '../_lib/live-interaction-alerts.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json().catch(() => ({}));
    const token = String(body.token || '').trim();
    const createdBy = String(body.created_by || '').trim();
    const note = String(body.note || '').trim();
    if (!token) return json({ error: 'Missing token.' }, 400);
    if (!createdBy || !note) return json({ error: 'Your name and message are required.' }, 400);
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) return json({ error: 'Server configuration is incomplete.' }, 500);

    const headers = serviceHeaders(env);
    const bookingRes = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=id,customer_name,progress_enabled,progress_token,status,job_status,current_workflow_stage&progress_token=eq.${encodeURIComponent(token)}&limit=1`, { headers });
    if (!bookingRes.ok) return json({ error: `Could not resolve booking. ${await bookingRes.text()}` }, 500);
    const booking = (await bookingRes.json().catch(() => []))?.[0] || null;
    if (!booking) return json({ error: 'Progress record not found.' }, 404);
    if (booking.progress_enabled === false) return json({ error: 'Progress viewing is not enabled for this booking.' }, 403);
    const communication = liveCommunicationState(booking);
    if (!communication.open) return json({ error: 'Live job messaging is closed because this job is no longer active.', communication_state: communication.state }, 409);

    const cleanName = createdBy.slice(0, 120);
    const cleanNote = note.slice(0, 4000);
    const now = new Date().toISOString();
    const enhanced = {
      booking_id: booking.id,
      created_by: cleanName,
      note: cleanNote,
      visibility: 'customer',
      stage: 'general',
      source_channel: 'customer',
      review_status: 'approved',
      requires_admin_review: false,
      customer_action_required: false,
      customer_visible_at: now
    };
    let insertRes = await insertUpdate(env, headers, enhanced);
    if (!insertRes.ok) {
      const text = await insertRes.text();
      if (!schemaLooksLegacy(text)) return json({ error: `Could not save message. ${text}` }, 500);
      insertRes = await insertUpdate(env, headers, { booking_id: booking.id, created_by: cleanName, note: cleanNote, visibility: 'customer' });
      if (!insertRes.ok) return json({ error: `Could not save message. ${await insertRes.text()}` }, 500);
    }

    await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`, {
      method: 'POST',
      headers,
      body: JSON.stringify([{ booking_id: booking.id, event_type: 'customer_comment', event_note: 'Customer sent a live progress message.', actor_name: cleanName, payload: { source: 'progress_page' } }])
    }).catch(() => null);
    await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(booking.id)}`, {
      method:'PATCH', headers:{...headers, Prefer:'return=minimal'}, body:JSON.stringify({ progress_last_customer_message_at:now })
    }).catch(()=>null);

    await queueStaffLiveAlert({ env, bookingId: booking.id, eventType: 'customer_live_reply', title: 'New customer progress reply', message: `${cleanName} replied during the detailing job.`, payload: { source: 'progress_page' } }).catch(()=>null);
    return json({ ok: true });
  } catch (err) {
    return json({ error: err?.message || 'Unexpected server error.' }, 500);
  }
}

function insertUpdate(env, headers, row) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/job_updates`, { method:'POST', headers:{...headers, Prefer:'return=representation'}, body:JSON.stringify([row]) });
}
function serviceHeaders(env){ return { apikey:env.SUPABASE_SERVICE_ROLE_KEY, Authorization:`Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type':'application/json' }; }
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } }); }
