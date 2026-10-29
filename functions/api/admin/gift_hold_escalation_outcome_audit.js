// Build 697: read-only owner outcome audit over the existing bounded HOLD runbook.
// A recorded acknowledgment is a HOLD outcome, never delivery/closure evidence.
import {onRequestGet as readRunbook} from './gift_owner_hold_escalation_runbook.js';
import {json} from '../_lib/staff-auth.js';

const OUTCOMES={
  FIFTH_HOLD_ACK_MISSING:'MISSING_OWNER_HOLD_ACK',
  OWNER_ACK_OVERDUE_48H:'SIXTH_WITNESS_OWNER_ACK_OVERDUE',
  SIXTH_WITNESS_WINDOW_EXPIRED_14D:'SIXTH_WITNESS_WINDOW_EXPIRED',
  SIXTH_WITNESS_OVERDUE_24H:'SIXTH_WITNESS_OUTCOME_OVERDUE',
  OWNER_ASSIGNMENT_OVERDUE_24H:'SIXTH_WITNESS_ASSIGNMENT_OVERDUE',
  HOLD_ACK_RECORDED_STILL_UNRESOLVED:'RECORDED_HOLD_ACK_ONLY',
  MANUAL_HOLD_MONITOR:'PENDING_MANUAL_REVIEW'
};
function reply(body,status=200){const response=json(body,status),headers=new Headers(response.headers);
  headers.set('Cache-Control','no-store, private');headers.set('Referrer-Policy','no-referrer');
  headers.set('X-Content-Type-Options','nosniff');return new Response(response.body,{status:response.status,headers});}

export function auditGiftHoldOutcome(row){
  const outcome=OUTCOMES[row?.attention];
  if(!outcome||row.manual_hold!==true||row.resend_permitted!==false||
    row.delivery_confirmed!==false||row.customer_contact_authorized!==false||
    row.automatic_escalation!==false||row.connection_state!=='DISCONNECTED'||
    !Array.isArray(row.internal_steps)||row.internal_steps.length!==4)
    throw Error('Unverified original HOLD outcome');
  return {case_id:row.case_id,certificate_id:row.certificate_id,attempt_id:row.attempt_id,
    session_id:row.session_id,checkout_line_number:row.checkout_line_number,
    urgency:row.urgency,priority:row.priority,attention:row.attention,phase:row.phase,
    outcome,evidence_disposition:'UNRESOLVED_ORIGINAL_DELIVERY',
    owner_ack_age_hours:row.owner_ack_age_hours,
    fifth_review_age_hours:row.fifth_review_age_hours,
    watch_age_hours:row.watch_age_hours,
    manual_owner_follow_up_required:outcome!=='PENDING_MANUAL_REVIEW',
    final_delivery_verified:false,closure_authorized:false,owner_test_authorized:false,
    original_gateway_receipt_verified:false,manual_hold:true,resend_permitted:false,
    customer_contact_authorized:false,automatic_escalation:false,connection_state:'DISCONNECTED'};
}

export async function onRequestGet({request,env}){
  const source=await readRunbook({request,env});if(!source.ok)return source;
  let data;try{data=await source.json();}catch{return reply({ok:false,error:'Source HOLD runbook unavailable.'},503);}
  if(!data.ok||!Array.isArray(data.runbook))return reply({ok:false,error:'Source HOLD runbook unavailable.'},503);
  try{
    const outcomes=data.runbook.map(auditGiftHoldOutcome),counts={};
    for(const type of Object.values(OUTCOMES))counts[type]=0;
    for(const outcome of outcomes)counts[outcome.outcome]++;
    return reply({ok:true,build:697,outcomes,counts,case_count:outcomes.length,
      owner_follow_up_required_count:outcomes.filter(x=>x.manual_owner_follow_up_required).length,
      original_delivery_confirmed_count:0,closure_authorized_count:0,
      sample_limit:data.sample_limit,truncated_possible:data.truncated_possible,
      historical_audit_complete:false,read_only:true,manual_hold:true,
      resend_permitted:false,connection_state:'DISCONNECTED',
      notice:'Recent bounded owner HOLD audit only. An acknowledgment is not delivery proof. No closure, refund, recipient contact, reassignment, gateway call or resend.'});
  }catch{return reply({ok:false,error:'Conflicting HOLD evidence; no case outcome was certified.'},503);}
}
