import { requireStaffAccess, json, methodNotAllowed, serviceHeaders, cleanText } from "../_lib/staff-auth.js";
import { compareAgainstTrustedLocation } from "../_lib/booking-location.js";

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

  let bookingRow = null;
  if (action === 'arrive') {
    const bookingRes = await fetch(
      `${env.SUPABASE_URL}/rest/v1/bookings?select=id,trusted_service_latitude,trusted_service_longitude,trusted_service_coordinate_source,trusted_service_coordinate_status,trusted_service_coordinate_label,trusted_service_geofence_radius_m&id=eq.${encodeURIComponent(bookingId)}&limit=1`,
      { headers: serviceHeaders(env) }
    );
    const bookingRows = await bookingRes.json().catch(()=>[]);
    bookingRow = Array.isArray(bookingRows) ? bookingRows[0] || null : null;
  }

  switch (action) {
    case 'accept':
      patch.detailer_response_status='accepted';
      patch.detailer_response_reason=reason;
      patch.current_workflow_stage='accepted';
      event.event_type='detailer_accepted';
      event.event_note=reason || 'Detailer accepted the job.';
      break;
    case 'decline':
      patch.detailer_response_status='declined';
      patch.detailer_response_reason=reason;
      patch.current_workflow_stage='declined';
      event.event_type='detailer_declined';
      event.event_note=reason || 'Detailer declined the job.';
      break;
    case 'dispatch':
      patch.current_workflow_stage='dispatched';
      patch.dispatched_at=now;
      patch.job_status='scheduled';
      event.event_type='detailer_dispatched';
      event.event_note='Detailer is on the way.';
      break;
    case 'arrive': {
      patch.current_workflow_stage='arrived';
      patch.arrived_at=now;
      event.event_type='detailer_arrived';
      event.payload.arrived_latitude = arrived_latitude;
      event.payload.arrived_longitude = arrived_longitude;

      const geofence = compareAgainstTrustedLocation({
        trustedLatitude: bookingRow?.trusted_service_latitude,
        trustedLongitude: bookingRow?.trusted_service_longitude,
        deviceLatitude: arrived_latitude,
        deviceLongitude: arrived_longitude,
        radiusMeters: bookingRow?.trusted_service_geofence_radius_m
      });

      patch.arrival_device_latitude = arrived_latitude;
      patch.arrival_device_longitude = arrived_longitude;
      patch.arrival_geofence_status = geofence.status;
      patch.arrival_distance_m = geofence.distance_m;
      patch.arrival_geofence_checked_at = now;

      event.payload.location_verification_status = (arrived_latitude != null && arrived_longitude != null) ? 'captured' : 'unavailable';
      event.payload.trusted_service_coordinate_source = bookingRow?.trusted_service_coordinate_source || null;
      event.payload.trusted_service_coordinate_status = bookingRow?.trusted_service_coordinate_status || null;
      event.payload.trusted_service_coordinate_label = bookingRow?.trusted_service_coordinate_label || null;
      event.payload.trusted_service_geofence_radius_m = geofence.radius_m;
      event.payload.arrival_geofence_status = geofence.status;
      event.payload.arrival_distance_m = geofence.distance_m;

      if (geofence.status === 'inside_geofence') {
        event.event_note = geofence.distance_m != null
          ? `Detailer arrived on site. Device location was ${geofence.distance_m}m from the trusted service location.`
          : 'Detailer arrived on site. Device location was inside the trusted service radius.';
      } else if (geofence.status === 'outside_geofence') {
        event.event_note = geofence.distance_m != null
          ? `Detailer arrived, but the device was ${geofence.distance_m}m away from the trusted service location.`
          : 'Detailer arrived, but the device was outside the trusted service radius.';
      } else if (geofence.status === 'no_reference') {
        event.event_note = 'Detailer arrived on site. Device location was captured, but no trusted booking coordinate was stored yet.';
      } else {
        event.event_note = 'Detailer arrived on site. Device geolocation was unavailable.';
      }
      break;
    }
    case 'start':
      patch.current_workflow_stage='detailing';
      patch.detailing_started_at=now;
      patch.detailing_paused_at=null;
      patch.job_status='in_progress';
      event.event_type='detailing_started';
      event.event_note='Detailing work started.';
      break;
    case 'pause':
      patch.current_workflow_stage='paused';
      patch.detailing_paused_at=now;
      event.event_type='detailing_paused';
      event.event_note=reason || 'Detailing paused.';
      break;
    case 'resume':
      patch.current_workflow_stage='detailing';
      patch.detailing_paused_at=null;
      event.event_type='detailing_resumed';
      event.event_note='Detailing resumed.';
      break;
    case 'complete':
      patch.current_workflow_stage='awaiting_payment';
      patch.detailing_completed_at=now;
      patch.job_status='completed';
      event.event_type='detailing_completed';
      event.event_note='Detailing marked complete and ready for final billing.';
      break;
    default:
      return json({ error: 'Unsupported action.' }, 400);
  }

  const bookingRes = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}`, { method:'PATCH', headers:{...serviceHeaders(env), Prefer:'return=representation'}, body: JSON.stringify(patch) });
  if (!bookingRes.ok) return json({ error: `Could not update booking workflow. ${await bookingRes.text()}` }, 500);
  await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`, { method:'POST', headers:{...serviceHeaders(env), Prefer:'return=minimal'}, body: JSON.stringify(event) }).catch(()=>null);
  const rows = await bookingRes.json().catch(()=>[]);
  return json({ ok:true, booking: Array.isArray(rows)?rows[0]||null:null, action });
}

export const onRequestGet = methodNotAllowed;
function toCoord(value){ const n=Number(value); return Number.isFinite(n) ? n : null; }
