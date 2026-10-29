// Build 696: owner-only, read-only escalation guidance over B695 scoped HOLD triage.
// No reviewer assignment, delivery, refund, SMS, email, provider, gateway or DB writes.
import {onRequestGet as readOwnerQueue} from './gift_owner_hold_triage_queue.js';
import {json} from '../_lib/staff-auth.js';

const COMMON=[
  'Preserve the original no-resend slot and manual HOLD; recipient delivery is not certified.',
  'Open the exact checkout in the existing signed-owner review UI and compare immutable evidence.',
  'Document any independent decision only through the existing authorized workflow; never auto-close or contact the recipient.'
];
const GUIDANCE={
  FIFTH_HOLD_ACK_MISSING:{urgency:'OWNER_SAFETY_REVIEW',next:'Verify whether the fifth-review owner HOLD acknowledgment is absent from source evidence. If genuinely missing, escalate to the owner for the existing signed HOLD workflow; never invent an event.'},
  OWNER_ACK_OVERDUE_48H:{urgency:'OVERDUE_OWNER_ACK',next:'Bring the independent sixth-witness finding to the authenticated owner. Any continued HOLD acknowledgment must use the existing immutable owner workflow.'},
  SIXTH_WITNESS_WINDOW_EXPIRED_14D:{urgency:'EXPIRED_INDEPENDENT_WINDOW',next:'Escalate the expired 14-day sixth-witness window for a manual audit decision. Do not auto-assign a seventh reviewer or extend the expired original authorization.'},
  SIXTH_WITNESS_OVERDUE_24H:{urgency:'OVERDUE_INDEPENDENT_CHECK',next:'Ask the already assigned independent sixth witness to review evidence internally within the existing authorization. Do not send a customer reminder.'},
  OWNER_ASSIGNMENT_OVERDUE_24H:{urgency:'OVERDUE_OWNER_ASSIGNMENT',next:'Have the authenticated owner review distinct sixth-witness eligibility in the existing fifth-recurrence UI; no automatic assignment or customer contact.'},
  HOLD_ACK_RECORDED_STILL_UNRESOLVED:{urgency:'CONTINUE_MANUAL_HOLD',next:'Maintain the documented HOLD, recheck original recipient/provider evidence manually, and do not interpret acknowledgment as proof of delivery.'},
  MANUAL_HOLD_MONITOR:{urgency:'WATCH_ONLY',next:'Monitor the already recorded HOLD and witness window without creating an extra review cycle or any external request.'}
};
function reply(body,status=200){const r=json(body,status),h=new Headers(r.headers);
  h.set('Cache-Control','no-store, private');h.set('Referrer-Policy','no-referrer');
  h.set('X-Content-Type-Options','nosniff');return new Response(r.body,{status:r.status,headers:h});}

export function makeGiftHoldEscalation(q){
  const g=GUIDANCE[q?.attention];if(!g||!q.manual_hold||q.resend_permitted!==false||q.delivery_confirmed!==false)
    throw Error('Unverified HOLD triage input');
  return {case_id:q.case_id,certificate_id:q.certificate_id,attempt_id:q.attempt_id,
    session_id:q.session_id,checkout_line_number:q.checkout_line_number,
    attention:q.attention,priority:q.priority,urgency:g.urgency,phase:q.phase,
    fifth_review_age_hours:q.fifth_review_age_hours,watch_age_hours:q.watch_age_hours,
    owner_ack_age_hours:q.owner_ack_age_hours,
    internal_steps:[g.next,...COMMON],
    manual_hold:true,delivery_confirmed:false,resend_permitted:false,
    customer_contact_authorized:false,automatic_escalation:false,
    original_gateway_evidence_verified:false,connection_state:'DISCONNECTED'};
}

export async function onRequestGet({request,env}){
  const original=await readOwnerQueue({request,env});if(!original.ok)return original;
  let data;try{data=await original.json();}catch{return reply({ok:false,error:'Runbook source unavailable.'},503);}
  if(!data.ok||!Array.isArray(data.queue))return reply({ok:false,error:'Runbook source unavailable.'},503);
  try{return reply({ok:true,build:696,runbook:data.queue.map(makeGiftHoldEscalation),
    sample_limit:data.sample_limit,truncated_possible:data.truncated_possible,
    read_only:true,connection_state:'DISCONNECTED',
    notice:'Internal owner decision support only. No new case event, automatic reassignment, customer contact, resend or original gateway verification.'});}
  catch{return reply({ok:false,error:'Incomplete HOLD evidence; fail-closed runbook unavailable.'},503);}
}
