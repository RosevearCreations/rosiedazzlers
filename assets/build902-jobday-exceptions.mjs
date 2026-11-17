// Rosie 902: deterministic SLA clocks, exception review and two-person crew handoff.
// Source event times are authoritative; no simulated dispatch, notifications or timers.
import {validId900} from './build900-workforce-safety.mjs';
export const POLICY902=Object.freeze({stop_work:15,review:60});
const ACTIONS={offer:['action','client_request_id','booking_id','exception_id','recipient_staff_user_id','note'],
 acknowledge:['action','client_request_id','booking_id','exception_id','offer_id','decision','note'],
 triage:['action','client_request_id','booking_id','exception_id','priority','note'],
 escalate:['action','client_request_id','booking_id','exception_id','note']};
const sort=rows=>[...rows].sort((a,b)=>String(b.recorded_at).localeCompare(String(a.recorded_at))||String(b.id).localeCompare(String(a.id)));
export function normalize902(input){
 if(!input||typeof input!=='object'||Array.isArray(input))return {ok:false,error:'Invalid source request.'};
 const action=String(input.action||''),fields=ACTIONS[action];
 if(!fields||Object.keys(input).some(x=>!fields.includes(x)))return {ok:false,error:'Unsupported action or client-authorized field.'};
 if(!validId900(input.client_request_id)||!validId900(input.booking_id)||!validId900(input.exception_id)||
  typeof input.note!=='string'||input.note.trim().length<12||input.note.trim().length>350)
  return {ok:false,error:'Exact original IDs and 12–350 character observation required.'};
 const base={ok:true,action,client_request_id:input.client_request_id,booking_id:input.booking_id,
  exception_id:input.exception_id,note:input.note.trim()};
 if(action==='offer'){
  if(!validId900(input.recipient_staff_user_id))return {ok:false,error:'Original supervisor recipient required.'};
  return {...base,recipient_staff_user_id:input.recipient_staff_user_id};
 }
 if(action==='acknowledge'){
  if(!validId900(input.offer_id)||!['accepted','rejected'].includes(input.decision))
   return {ok:false,error:'Original offer and signed acknowledgement decision required.'};
  return {...base,offer_id:input.offer_id,decision:input.decision};
 }
 if(action==='triage'){
  if(!['critical','high','normal'].includes(input.priority))return {ok:false,error:'Unsupported priority.'};
  return {...base,priority:input.priority};
 }
 return base;
}
const validDate=x=>typeof x==='string'&&Number.isFinite(Date.parse(x));
export function project902({booking_id,events901=[],receipts902=[],now=new Date()}={}){
 if(!validId900(booking_id)||!Array.isArray(events901)||!Array.isArray(receipts902)||
  events901.length>=240||receipts902.length>=240)throw Error('Original exception source unavailable or window incomplete');
 const nowMs=new Date(now).getTime();if(!Number.isFinite(nowMs))throw Error('Clock unavailable');
 const escalations=events901.filter(e=>e.event_kind==='escalation');
 const resolutions=events901.filter(e=>e.event_kind==='resolution');
 for(const e of [...events901,...receipts902]){
  if(!validId900(e.id)||e.booking_id!==booking_id||!validDate(e.recorded_at))
   throw Error('Malformed original exception evidence');
 }
 for(const r of receipts902)if(!validId900(r.exception_id)||!['offer','acknowledge','triage','escalate'].includes(r.event_kind))
  throw Error('Malformed original handoff evidence');
 const rows=sort(escalations).map(e=>{
  const latestResolution=sort(resolutions.filter(r=>r.escalation_id===e.id))[0]||null;
  const open=latestResolution?.decision!=='resolved';
  const receipts=sort(receipts902.filter(r=>r.exception_id===e.id));
  const offer=receipts.find(r=>r.event_kind==='offer')||null;
  const responses=offer?receipts.filter(r=>r.event_kind==='acknowledge'&&r.offer_id===offer.id):[];
  if(responses.length>1)throw Error('Conflicting original handoff acknowledgements');
  const acknowledgement=responses[0]||null;
  const ackVerified=!!offer&&!!acknowledgement&&acknowledgement.decision==='accepted'&&
   offer.staff_user_id!==acknowledgement.staff_user_id&&
   acknowledgement.staff_user_id===offer.recipient_staff_user_id&&
   acknowledgement.recorded_at>=offer.recorded_at;
  const firstResponse=[...receipts].filter(r=>r.event_kind==='triage'||r.event_kind==='escalate'||
   (r.event_kind==='acknowledge'&&r.decision==='accepted'&&r.staff_user_id===offer?.recipient_staff_user_id))
   .sort((a,b)=>String(a.recorded_at).localeCompare(String(b.recorded_at)))[0]||null;
  const sourceMs=Date.parse(e.recorded_at),minutes=POLICY902[e.severity];
  if(!minutes)throw Error('Unknown original source severity');
  const dueMs=sourceMs+minutes*60000;
  const responseMs=firstResponse?Date.parse(firstResponse.recorded_at):null;
  const sla_state=responseMs!==null?(responseMs<=dueMs?'ACK_ON_TIME':'ACK_LATE'):
    !open?'CLOSED_UNACKNOWLEDGED':nowMs>dueMs?'OVERDUE':'AWAITING_RESPONSE';
  const priority=receipts.find(r=>r.event_kind==='triage')?.priority||
   (e.severity==='stop_work'?'critical':'high');
  const handoff_status=!offer?'NOT_OFFERED':!acknowledgement?'PENDING':
   ackVerified?'TWO_PERSON_ACCEPTED':acknowledgement.decision==='rejected'?'REJECTED':'INVALID_HOLD';
  return {id:e.id,booking_id,subject:e.subject,severity:e.severity,reported_by:e.staff_user_id,
   recorded_at:e.recorded_at,open,priority,
   due_at:new Date(dueMs).toISOString(),sla_minutes:minutes,sla_state,
   response_at:firstResponse?.recorded_at||null,
   age_minutes:Math.max(0,Math.floor((nowMs-sourceMs)/60000)),
   handoff:{status:handoff_status,verified:ackVerified,offer_id:offer?.id||null,
    recipient_staff_user_id:offer?.recipient_staff_user_id||null,
    accepted_at:ackVerified?acknowledgement.recorded_at:null},
   escalated:receipts.some(r=>r.event_kind==='escalate'),
   latest_resolution:latestResolution?.decision||null,
   note:e.note};
 });
 const open=rows.filter(r=>r.open).sort((a,b)=>(a.sla_state==='OVERDUE'?0:1)-(b.sla_state==='OVERDUE'?0:1)||
  (a.priority==='critical'?0:a.priority==='high'?1:2)-(b.priority==='critical'?0:b.priority==='high'?1:2)||
  a.due_at.localeCompare(b.due_at));
 return {schema:'rosie.jobday.exception.v902',booking_id,exceptions:rows,open_queue:open,
  totals:{open:open.length,overdue:open.filter(r=>r.sla_state==='OVERDUE').length,
   pending_handoffs:open.filter(r=>r.handoff.status==='PENDING').length,
   verified_handoffs:open.filter(r=>r.handoff.verified).length},
  evidence:{source_timestamps_only:true,sla_policy_minutes:POLICY902,automatic_timer:false,
   communications_sent:false,dispatch_or_safety_approved:false,independent_field_certification:false,
   original_901_safety_gate_unchanged:true}};
}
