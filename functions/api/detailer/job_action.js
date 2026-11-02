import { requireStaffAccess, json, methodNotAllowed, serviceHeaders, cleanText } from "../_lib/staff-auth.js";
import { compareAgainstTrustedLocation } from "../_lib/booking-location.js";
import { loadProofOfWorkStatus, saveProofOfWorkStatus } from "../_lib/proof-of-work.js";
import { queueCustomerLiveAlert } from "../_lib/live-interaction-alerts.js";
import { syncCompletedBookingVehicleHistory } from "../_lib/customer-vehicle-service-history.js";
import { allowedMobileTransition745, mobileStage745 } from '../../../assets/detailer-mobile-dayboard-v745.mjs';
import { canWorkMobileBooking745 } from '../_lib/detailer-mobile-scope-v745.js';
import { loadOnsiteGate746 } from '../_lib/onsite-setup-v746.js';
import { qualitySnapshot749 } from '../_lib/quality-store-v749.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  const body = await request.json().catch(()=>({}));
  const bookingId = cleanText(body.booking_id);
  const access = await requireStaffAccess({ request, env, body, capability: "work_booking", bookingId, allowLegacyAdminFallback: false });
  if (!access.ok) return access.response;
  const actor = access.actor;
  const mobile745 = body.client_v745 === true;
  if (mobile745 && access.auth_mode !== 'session') return json({ok:false,error:'Mobile changes require a current signed-in staff session.'},401);
  if (mobile745 && request.headers.get('origin') !== new URL(request.url).origin)
    return json({ok:false,error:'Mobile changes must originate from the signed-in Rosie Dazzlers app.'},403);
  const action = cleanText(body.action);
  const reason = cleanText(body.reason);
  const arrived_latitude = toCoord(body.arrived_latitude);
  const arrived_longitude = toCoord(body.arrived_longitude);
  if (!bookingId || !action) return json({ error: "booking_id and action are required." }, 400);

  let expectedUpdatedAt = null;
  if (mobile745) {
    expectedUpdatedAt=String(body.expected_updated_at||'').trim();
    const expectedStage=String(body.expected_stage||'').trim().toLowerCase();
    if (!expectedUpdatedAt || !Number.isFinite(Date.parse(expectedUpdatedAt)) || !expectedStage || !allowedMobileTransition745(expectedStage,action))
      return json({ok:false,error:'Reopen this job and review the current stage before an action.',code:'mobile_revision_required'},409);
    const read=await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?select=id,updated_at,current_workflow_stage,job_status,status,assigned_staff_user_id,assigned_staff_email&id=eq.${encodeURIComponent(bookingId)}&limit=1`,
      {headers:serviceHeaders(env)});
    if (!read.ok) return json({ok:false,error:'Cannot verify current job revision. No action taken.'},503);
    const rows=await read.json().catch(()=>[]);
    const current=Array.isArray(rows)?rows[0]:null;
    if (!current) return json({ok:false,error:'Booking no longer available.'},404);
    if (!await canWorkMobileBooking745({env,actor,booking:current}))
      return json({ok:false,error:'This job is no longer assigned to you.',code:'mobile_assignment_changed'},403);
    if (String(current.updated_at||'')!==expectedUpdatedAt || mobileStage745(current)!==expectedStage || !allowedMobileTransition745(mobileStage745(current),action))
      return json({ok:false,error:'The job changed since your last review. Refresh assigned jobs; nothing was replayed.',code:'mobile_stale_revision'},409);
    if(action==='start'){
      let gate;
      try{gate=await loadOnsiteGate746(env,bookingId);}catch{
        return json({ok:false,error:'Current onsite readiness could not be verified. Start is held.',code:'onsite_verification_unavailable'},503);
      }
      if(!gate.assessment.ready || !gate.assessment.revision ||
        gate.assessment.revision!==String(body.expected_intake_updated_at||''))
        return json({ok:false,error:'Onsite setup is incomplete or changed. Reload and review the customer acknowledgements before Start.',
          code:'onsite_setup_required',missing:gate.assessment.missing},409);
      const [proof,notesRes,mediaRes]=await Promise.all([
        loadProofOfWorkStatus({env,bookingId}),
        fetch(`${env.SUPABASE_URL}/rest/v1/job_updates?select=note,visibility&booking_id=eq.${encodeURIComponent(bookingId)}&order=created_at.desc&limit=250`,{headers:serviceHeaders(env)}),
        fetch(`${env.SUPABASE_URL}/rest/v1/job_media?select=stage,visibility,review_status,thread_status,created_at,media_url,storage_bucket,storage_path&booking_id=eq.${encodeURIComponent(bookingId)}&stage=eq.arrival&order=created_at.desc&limit=100`,{headers:serviceHeaders(env)})
      ]);
      if(!notesRes.ok || !mediaRes.ok || proof.warning)return json({ok:false,error:'Before-service media/checklist could not be verified.',code:'before_service_unavailable'},503);
      const [notes,media]=await Promise.all([notesRes.json().catch(()=>[]),mediaRes.json().catch(()=>[])]);
      const checklist=Array.isArray(notes)&&notes.some(row=>String(row.note||'').startsWith('[FIELD CHECKLIST]')&&row.visibility==='internal');
      const consentTime=Date.parse(gate.receipt?.created_at||'');
      const consentedPhoto=Number.isFinite(consentTime)&&Array.isArray(media)&&media.some(row=>
        row.stage==='arrival'&&row.visibility==='internal'&&row.review_status!=='rejected'&&
        !['hidden','removed'].includes(row.thread_status)&&
        Boolean(row.media_url||(row.storage_bucket&&row.storage_path))&&Date.parse(row.created_at||'')>=consentTime);
      if(Number(proof.stage_counts?.arrival||0)<1||!consentedPhoto||!checklist)
        return json({ok:false,error:'A private arrival photo after recorded customer photo consent, plus a saved staff checklist, are required before Start.',code:'before_service_evidence_required'},409);
    }
    if(action==='complete'){
      let quality;
      try{quality=(await qualitySnapshot749(env,bookingId)).summary;}catch{
        return json({ok:false,error:'Quality receipts cannot be verified. Completion is held; reload the source.',code:'quality_source_unavailable'},503);
      }
      if(!quality.approved||quality.revision!==String(body.expected_quality_revision||''))
        return json({ok:false,error:'Independent quality acceptance on the exact current pre/post revision is required before completing the job.',code:'quality_acceptance_required',quality_status:quality.status},409);
    }
  }

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
    case 'complete': {
      const proofStatus = await loadProofOfWorkStatus({ env, bookingId });
      const overrideRequested = body.override_proof === true;
      const overrideAllowed = overrideRequested && (actor.is_admin || actor.can_manage_bookings) && reason;
      if (!proofStatus.ready && !overrideAllowed) {
        return json({ error:'Arrival, during-work, and final media are required before completion.', code:'proof_media_incomplete', proof_media_status:proofStatus },409);
      }
      await saveProofOfWorkStatus({ env, bookingId, status: proofStatus, actor, overrideReason: overrideAllowed ? reason : null }).catch(()=>null);
      patch.current_workflow_stage='awaiting_payment';
      patch.detailing_completed_at=now;
      patch.job_status='completed';
      event.event_type='detailing_completed';
      event.event_note=overrideAllowed ? `Detailing completed with proof override: ${reason}` : 'Detailing marked complete with arrival, during, and final proof media.';
      break;
    }
    default:
      return json({ error: 'Unsupported action.' }, 400);
  }

  const conditional=mobile745?`&updated_at=eq.${encodeURIComponent(expectedUpdatedAt)}`:'';
  const bookingRes = await fetch(`${env.SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}${conditional}`, { method:'PATCH', headers:{...serviceHeaders(env), Prefer:'return=representation'}, body: JSON.stringify(patch) });
  if (!bookingRes.ok) return json({ error: `Could not update booking workflow. ${await bookingRes.text()}` }, 500);
  const rows = await bookingRes.json().catch(()=>[]);
  const updatedBooking = Array.isArray(rows) ? rows[0] || null : null;
  if (mobile745 && !updatedBooking) return json({ok:false,error:'Concurrent job change detected. Refresh; no action was recorded.',code:'mobile_race_lost'},409);

  let vehicleServiceHistorySync = null;
  if (action === 'complete' && updatedBooking) {
    vehicleServiceHistorySync = await syncCompletedBookingVehicleHistory({ env, booking: updatedBooking }).catch((error) => ({
      ok: false,
      skipped: false,
      reason: 'vehicle_history_sync_exception',
      error: error?.message || String(error || 'Unexpected vehicle history sync error.')
    }));
    event.payload.vehicle_service_history_sync = {
      ok: vehicleServiceHistorySync.ok === true,
      skipped: vehicleServiceHistorySync.skipped === true,
      reason: vehicleServiceHistorySync.reason || null,
      updated_fields: Array.isArray(vehicleServiceHistorySync.updated_fields) ? vehicleServiceHistorySync.updated_fields : []
    };
  }

  await fetch(`${env.SUPABASE_URL}/rest/v1/booking_events`, { method:'POST', headers:{...serviceHeaders(env), Prefer:'return=minimal'}, body: JSON.stringify(event) }).catch(()=>null);
  if (['dispatch','arrive','start','complete'].includes(action)) {
    const messages={dispatch:'Your detailer is on the way.',arrive:'Your detailer has arrived.',start:'Detailing work has started.',complete:'Your detailing work is complete. A summary and final payment information will follow.'};
    await queueCustomerLiveAlert({env,bookingId,eventType:`job_${action}`,title:'Rosie Dazzlers job update',message:messages[action],payload:{action}}).catch(()=>null);
  }
  return json({
    ok:true,
    booking:updatedBooking,
    action,
    vehicle_service_history_sync:vehicleServiceHistorySync,
    next_step:action==='complete'?'generate_completed_job_summary':null
  });
}

export const onRequestGet = methodNotAllowed;
function toCoord(value){ const n=Number(value); return Number.isFinite(n) ? n : null; }
