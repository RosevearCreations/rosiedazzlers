
import { requireStaffAccess, json, methodNotAllowed, serviceHeaders, cleanText } from "../_lib/staff-auth.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json().catch(()=>({}));
  const bookingId = cleanText(body.booking_id);
  const access = await requireStaffAccess({ request, env, body, capability: "work_booking", bookingId, allowLegacyAdminFallback: false });
  if (!access.ok) return access.response;
  const actor = access.actor;
  const action = cleanText(body.action);
  const reason = cleanText(body.reason);
  const arrived_latitude = toCoord(body.arrived_latitude);
  const arrived_longitude = toCoord(body.arrived_longitude);
  if (!bookingId || !action) return json({ error: "booking_id and action are required." }, 400);
  const now = new Date().toISOString();
  const patch = { updated_at: now };
  const event = { booking_id: bookingId, created_at: now, actor_name: actor.full_name || actor.email || 'Staff', payload: { actor_id: actor.id || null, action } };
  switch (action) {
    case 'accept': patch.detailer_response_status='accepted'; patch.detailer_response_reason=reason; patch.current_workflow_stage='accepted'; event.event_type='detailer_accepted'; event.event_note=reason || 'Detailer accepted the job.'; break;
    case 'decline': patch.detailer_response_status='declined'; patch.detailer_response_reason=reason; patch.current_workflow_stage='declined'; event.event_type='detailer_declined'; event.event_note=reason || 'Detailer declined the job.'; break;
    case 'dispatch': patch.current_workflow_stage='dispatched'; patch.dispatched_at=now; patch.job_status='scheduled'; event.event_type='detailer_dispatched'; event.event_note='Detailer is on the way.'; break;
    case 'arrive': patch.current_workflow_stage='arrived'; patch.arrived_at=now; event.event_type='detailer_arrived'; event.payload.arrived_latitude = arrived_latitude; event.payload.arrived_longitude = arrived_longitude; event.payload.location_verification_status = (arrived_latitude != null && arrived_longitude != null) ? 'captured' : 'unavailable'; event.event_note=(arrived_latitude != null && arrived_longitude != null) ? `Detailer arrived on site. Device location captured at ${arrived_latitude.toFixed(5)}, ${arrived_longitude.toFixed(5)}.` : 'Detailer arrived on site. Device geolocation was unavailable.'; break;
    case 'start': patch.current_workflow_stage='detailing'; patch.detailing_started_at=now; patch.detailing_paused_at=null; patch.job_status='in_progress'; event.event_type='detailing_started'; event.event_note='Detailing work started.'; break;
    case 'pause': patch.current_workflow_stage='paused'; patch.detailing_paused_at=now; event.event_type='detailing_paused'; event.event_note=reason || 'Detailing paused.'; break;
    case 'resume': patch.current_workflow_stage='detailing'; patch.detailing_paused_at=null; event.event_type='detailing_resumed'; event.event_note='Detailing resumed.'; break;
    case 'complete': patch.current_workflow_stage='awaiting_payment'; patch.detailing_completed_at=now; patch.job_status='completed'; event.event_type='detailing_completed'; event.event_note='Detailing marked complete and ready for final billing.'; break;
    default: return json({ error: 'Unsupported action.' }, 400);
  }
  const bookingRes = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}`, { method:'PATCH', headers:{...serviceHeaders(env), Prefer:'return=representation'}, body: JSON.stringify(patch) });
  if (!bookingRes.ok) return json({ error: `Could not update booking workflow. ${await bookingRes.text()}` }, 500);
  await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`, { method:'POST', headers:{...serviceHeaders(env), Prefer:'return=minimal'}, body: JSON.stringify(event) }).catch(()=>null);
  const rows = await bookingRes.json().catch(()=>[]);
  return json({ ok:true, booking: Array.isArray(rows)?rows[0]||null:null, action });
}

export const onRequestGet = methodNotAllowed;
function toCoord(value){ const n=Number(value); return Number.isFinite(n) ? n : null; }
