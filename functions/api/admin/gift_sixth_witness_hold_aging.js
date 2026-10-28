// Build 694: no new reviewer/ledger/mutation. Read B693's scoped immutable watch only.
import {onRequestGet as readFifthRecurrence} from './gift_fifth_recurrence_closure_watch.js';
import {json} from '../_lib/staff-auth.js';

const hours=(value,now)=>{const t=Date.parse(value||'');return Number.isFinite(t)?
  Math.max(0,Math.floor((now-t)/3600000)):null;};

export function summarizeSixthWitnessHold(g,now=Date.now()){
  const events=Array.isArray(g.events)?g.events:[];
  const watch=events.find(x=>x.event_kind==='owner_fifth_recurrence_watch_opened');
  const witness=events.find(x=>x.event_kind==='independent_closure_risk_checked');
  const ack=events.find(x=>x.event_kind==='owner_continued_hold_ack');
  const watchAge=hours(watch?.created_at,now),witnessAge=hours(witness?.created_at,now),ackAge=hours(ack?.created_at,now);
  const phase=ack?'OWNER_HOLD_ACKNOWLEDGED_UNRESOLVED':witness?'OWNER_HOLD_ACK_PENDING':
    watch?'SIXTH_WITNESS_PENDING':'OWNER_ASSIGNMENT_PENDING';
  return {certificate_id:g.id,checkout_line_number:g.checkout_line_number,
    recipient_email_masked:g.recipient_email_masked,attempt_id:g.attempt_id,
    fifth_review_id:g.fifth_review_id,fifth_decision:g.fifth_decision,
    phase,watch_age_hours:watchAge,witness_age_hours:witnessAge,owner_ack_age_hours:ackAge,
    sixth_decision:witness?.decision_code||null,
    initial_24h_alert:!watch&&g.fifth_age_hours>=24,
    witness_24h_alert:!!watch&&!witness&&watchAge!==null&&watchAge>=24,
    owner_48h_alert:!!witness&&!ack&&witnessAge!==null&&witnessAge>=48,
    review_window_expired:!!watch&&!witness&&watchAge!==null&&watchAge>=336,
    known_unresolved_recurrence:!!witness&&['new_discrepancy_detected','original_evidence_missing',
      'discrepancy_still_open'].includes(witness.decision_code),
    reviewer_reassignment_automatic:false,delivery_confirmed:false,
    manual_hold:true,original_send_slot_consumed:true,resend_permitted:false,
    customer_messages_sent:0,provider_requests:0,payment_mutations:0,
    guidance:ack?'Owner acknowledgment retains HOLD; recipient delivery was not certified.':
      witness?'Sixth witness found unresolved risk; owner acknowledgment may record HOLD only.':
      watchAge>=336?'14-day witness window expired. Escalate manually; do not auto-reassign or resend.':
      watchAge>=24?'24-hour witness follow-up due. Internal review only.':
      'Evidence remains unresolved; watch progress only, no customer contact.'};
}

export async function onRequestGet({request,env}){
  const source=await readFifthRecurrence({request,env});
  if(!source.ok)return source;
  let data;try{data=await source.json();}catch{return json({ok:false,error:'Read-only watch unavailable.'},503);}
  if(!data.ok)return json({ok:false,error:data.error||'Read-only watch unavailable.'},503);
  const gifts=Array.isArray(data.gifts)?data.gifts.map(g=>summarizeSixthWitnessHold(g)):[];
  const r=json({ok:true,build:694,case:data.case||null,gifts,
    read_only:true,ql248_connection_state:'DISCONNECTED',
    safety_notice:'No new review assignment, owner decision, resend, payment, customer message or gateway request.'});
  const headers=new Headers(r.headers);headers.set('Cache-Control','no-store, private');
  headers.set('Referrer-Policy','no-referrer');headers.set('X-Content-Type-Options','nosniff');
  return new Response(r.body,{status:r.status,headers});
}
