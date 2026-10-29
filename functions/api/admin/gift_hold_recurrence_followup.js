// Build 698: owner-only read-only recurrence follow-up over B697's bounded audit.
// A snapshot fingerprint is NOT a historical recurrence, delivery or closure receipt.
import {onRequestGet as readOutcomes} from './gift_hold_escalation_outcome_audit.js';
import {json} from '../_lib/staff-auth.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CLASS={
  MISSING_OWNER_HOLD_ACK:'OWNER_HOLD_ACK_FOLLOW_UP',
  SIXTH_WITNESS_OWNER_ACK_OVERDUE:'OWNER_ACK_ESCALATION_OVERDUE',
  SIXTH_WITNESS_WINDOW_EXPIRED:'EXPIRED_REVIEW_AUTHORITY_ESCALATION',
  SIXTH_WITNESS_OUTCOME_OVERDUE:'INDEPENDENT_REVIEW_OVERDUE',
  SIXTH_WITNESS_ASSIGNMENT_OVERDUE:'OWNER_ASSIGNMENT_OVERDUE',
  RECORDED_HOLD_ACK_ONLY:'ACKNOWLEDGED_HOLD_UNRESOLVED',
  PENDING_MANUAL_REVIEW:'MANUAL_HOLD_MONITOR'
};
function reply(body,status=200){const response=json(body,status),headers=new Headers(response.headers);
  headers.set('Cache-Control','no-store, private');headers.set('Referrer-Policy','no-referrer');
  headers.set('X-Content-Type-Options','nosniff');return new Response(response.body,{status:response.status,headers});}

export function reconcileGiftHoldFollowup(row){
  const classification=CLASS[row?.outcome];
  if(!classification||!UUID.test(String(row.case_id||''))||!UUID.test(String(row.attempt_id||''))||
    !UUID.test(String(row.certificate_id||''))||!Number.isSafeInteger(row.checkout_line_number)||
    row.checkout_line_number<1||row.manual_hold!==true||row.resend_permitted!==false||
    row.final_delivery_verified!==false||row.closure_authorized!==false||
    row.customer_contact_authorized!==false||row.automatic_escalation!==false||
    row.evidence_disposition!=='UNRESOLVED_ORIGINAL_DELIVERY'||row.connection_state!=='DISCONNECTED')
    throw Error('Untrusted source HOLD disposition');
  return {case_id:row.case_id,attempt_id:row.attempt_id,certificate_id:row.certificate_id,
    checkout_line_number:row.checkout_line_number,source_outcome:row.outcome,
    follow_up_classification:classification,phase:row.phase,priority:row.priority,
    fifth_review_age_hours:row.fifth_review_age_hours,
    watch_age_hours:row.watch_age_hours,owner_ack_age_hours:row.owner_ack_age_hours,
    manual_follow_up:classification!=='MANUAL_HOLD_MONITOR',
    delivery_evidence:'NOT_CERTIFIED',recurrence_history:'NOT_INFERRED_FROM_ONE_SNAPSHOT',
    owner_release_authorized:false,manual_hold:true,resend_permitted:false,
    customer_contact_authorized:false,connection_state:'DISCONNECTED'};
}
export async function fingerprintFollowup(rows){
  const entries=rows.map(r=>[r.case_id,r.attempt_id,r.checkout_line_number,
    r.source_outcome,r.follow_up_classification,r.phase].join('|')).sort();
  const bytes=new TextEncoder().encode(entries.join('\n'));
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),
    b=>b.toString(16).padStart(2,'0')).join('');
}
export async function onRequestGet({request,env}){
  const source=await readOutcomes({request,env});if(!source.ok)return source;
  let data;try{data=await source.json();}catch{return reply({ok:false,error:'Owner HOLD outcomes unavailable.'},503);}
  if(!data.ok||!Array.isArray(data.outcomes)||data.outcomes.length>100||
    data.historical_audit_complete!==false||data.connection_state!=='DISCONNECTED')
    return reply({ok:false,error:'Owner HOLD outcome source incomplete.'},503);
  try{
    const followups=data.outcomes.map(reconcileGiftHoldFollowup);
    const counts=Object.fromEntries(Object.values(CLASS).map(c=>[c,0]));
    for(const f of followups)counts[f.follow_up_classification]++;
    return reply({ok:true,build:698,followups,counts,case_count:followups.length,
      snapshot_sha256:await fingerprintFollowup(followups),
      snapshot_comparison_available:false,independently_confirmed_recurrence_count:null,
      confirmed_delivery_count:0,authorized_closure_count:0,
      manual_follow_up_count:followups.filter(f=>f.manual_follow_up).length,
      sample_limit:data.sample_limit,truncated_possible:data.truncated_possible,
      historical_audit_complete:false,read_only:true,connection_state:'DISCONNECTED',
      notice:'Fingerprint compares a bounded current HOLD snapshot only; no prior trusted snapshot or original delivery receipt was supplied. Manual HOLD/no-resend continues. No review, payment, customer or gateway mutation.'});
  }catch{return reply({ok:false,error:'Conflicting follow-up evidence; all cases remain on manual HOLD.'},503);}
}
