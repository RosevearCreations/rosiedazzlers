// Rosie 903 — original source-linked exception ownership, two-person supervisor routing,
// and internal-only draft/suppression outbox. Neither consent nor delivery is inferred.
import {validId900} from './build900-workforce-safety.mjs';
const KINDS=Object.freeze(['claim','route','accept_route','draft','suppress']);
const FIELDS={
 claim:['action','client_request_id','booking_id','exception_id','note'],
 route:['action','client_request_id','booking_id','exception_id','recipient_staff_user_id','note'],
 accept_route:['action','client_request_id','booking_id','exception_id','route_id','decision','note'],
 draft:['action','client_request_id','booking_id','exception_id','template_key','note'],
 suppress:['action','client_request_id','booking_id','exception_id','draft_id','note']
};
export const TEMPLATE_KEYS903=Object.freeze(['sla_overdue','safety_hold','handoff_pending']);
const newest=rows=>[...rows].sort((a,b)=>String(b.recorded_at).localeCompare(String(a.recorded_at))||String(b.id).localeCompare(String(a.id)));
export function normalize903(data){
 if(!data||typeof data!=='object'||Array.isArray(data))return {ok:false,error:'Invalid input.'};
 const action=String(data.action||''),keys=FIELDS[action];
 if(!keys||Object.keys(data).some(k=>!keys.includes(k)))return {ok:false,error:'Unsupported or privileged source fields.'};
 if(!validId900(data.booking_id)||!validId900(data.exception_id)||!validId900(data.client_request_id)||
  typeof data.note!=='string'||data.note.trim().length<12||data.note.trim().length>350)
  return {ok:false,error:'Original work order, exception, request ID, and 12–350 character reason required.'};
 const out={ok:true,action,booking_id:data.booking_id,exception_id:data.exception_id,client_request_id:data.client_request_id,note:data.note.trim()};
 if(action==='route'){
  if(!validId900(data.recipient_staff_user_id))return {ok:false,error:'Original supervisor recipient ID required.'};
  return {...out,recipient_staff_user_id:data.recipient_staff_user_id};
 }
 if(action==='accept_route'){
  if(!validId900(data.route_id)||!['accepted','rejected'].includes(data.decision))
   return {ok:false,error:'Exact pending route and signed decision required.'};
  return {...out,route_id:data.route_id,decision:data.decision};
 }
 if(action==='draft'){
  if(!TEMPLATE_KEYS903.includes(data.template_key))return {ok:false,error:'Unsupported internal preview template.'};
  return {...out,template_key:data.template_key};
 }
 if(action==='suppress'){
  if(!validId900(data.draft_id))return {ok:false,error:'Exact original draft required.'};
  return {...out,draft_id:data.draft_id};
 }
 return out;
}
export function project903({booking_id,exception,receipts903=[],now=new Date()}){
 if(!validId900(booking_id)||!exception||!validId900(exception.id)||exception.booking_id!==booking_id||
  !Array.isArray(receipts903)||receipts903.length>=220)throw Error('Original exception/ownership source incomplete');
 if(!Number.isFinite(new Date(now).getTime()))throw Error('Clock unavailable');
 for(const e of receipts903)if(!validId900(e.id)||e.booking_id!==booking_id||e.exception_id!==exception.id||
  !KINDS.includes(e.event_kind)||!Number.isFinite(Date.parse(e.recorded_at||'')))throw Error('Malformed custody receipt');
 const records=[...receipts903].sort((a,b)=>String(a.recorded_at).localeCompare(String(b.recorded_at))||String(a.id).localeCompare(String(b.id)));
 let owner=null,pendingRoute=null,holdReason=null;
 const claimed=[];
 for(const e of records){
  if(e.event_kind==='claim'){
   if(owner||!exception.handoff?.verified||e.staff_user_id!==exception.handoff.recipient_staff_user_id)
    throw Error('Conflicting or unverified original owner claim');
   owner=e.staff_user_id;claimed.push(e.id);
  } else if(e.event_kind==='route'){
   if(!owner||e.staff_user_id!==owner||pendingRoute||
    e.recipient_staff_user_id===owner)throw Error('Conflicting original owner route');
   pendingRoute=e;
  } else if(e.event_kind==='accept_route'){
   if(!pendingRoute||pendingRoute.id!==e.related_receipt_id||e.staff_user_id!==pendingRoute.recipient_staff_user_id||
    e.staff_user_id===owner||!['accepted','rejected'].includes(e.decision))throw Error('Invalid two-person route custody');
   if(e.decision==='accepted')owner=e.staff_user_id;
   pendingRoute=null;
  }else if(e.event_kind==='draft'){
   if(!owner||e.staff_user_id!==owner||pendingRoute||
    !TEMPLATE_KEYS903.includes(e.template_key))throw Error('Draft without current verified owner');
  }else if(e.event_kind==='suppress'){
   const draft=records.find(x=>x.id===e.related_receipt_id&&x.event_kind==='draft');
   if(!draft||!owner||e.staff_user_id!==owner||draft.recorded_at>e.recorded_at)
    throw Error('Invalid original outbox suppression');
  }
 }
 const drafts=newest(records.filter(x=>x.event_kind==='draft'));
 const suppressed=new Set(records.filter(x=>x.event_kind==='suppress').map(x=>x.related_receipt_id));
 const currentDraft=drafts[0]&&!suppressed.has(drafts[0].id)?drafts[0]:null;
 const sourceOwner=owner||null;
 const staleOwner=!!sourceOwner&&exception.handoff?.verified!==true;
 const current=!!exception.open&&!!sourceOwner&&!pendingRoute&&!staleOwner;
 const selectedDraft=current&&currentDraft&&currentDraft.staff_user_id===sourceOwner?currentDraft:null;
 const state=!exception.open?'EXCEPTION_RESOLVED':
  staleOwner?'ORIGINAL_HANDOFF_INVALID':
  !owner?'UNCLAIMED':pendingRoute?'ROUTING_AWAITING_ACK':'OWNER_VERIFIED';
 const templates={
  sla_overdue:'Supervisor SLA follow-up required',
  safety_hold:'Safety HOLD review required',
  handoff_pending:'Crew-to-supervisor handoff requires review'
 };
 const outbox=selectedDraft?{id:selectedDraft.id,template_key:selectedDraft.template_key,
  preview:templates[selectedDraft.template_key]+': original exception '+exception.id.slice(0,8)+
   ' ('+String(exception.subject||'review')+'). Recheck original safety and SLA evidence before any action.',
  status:'UNSENT_INTERNAL_DRAFT',prepared_at:selectedDraft.recorded_at,
  recipient_staff_user_id:sourceOwner}:null;
 return {schema:'rosie.exception-routing.v903',booking_id,exception_id:exception.id,exception_open:!!exception.open,
  owner_staff_user_id:sourceOwner,owner_state:state,owner_current:current,
  pending_route:pendingRoute?{id:pendingRoute.id,recipient_staff_user_id:pendingRoute.recipient_staff_user_id,recorded_at:pendingRoute.recorded_at}:null,
  outbox,outbox_draft_count:drafts.length,suppressed_draft_count:suppressed.size,
  sla_state:exception.sla_state,original_due_at:exception.due_at,source_handoff_verified:exception.handoff?.verified===true,
  authority:{delivery_enabled:false,automatic_send:false,customer_contact_allowed:false,
   customer_consent_claimed:false,internal_staff_channel_only:true,
   customer_data_read:false,physical_safety_certified:false,job_dispatch_changed:false,
   accounting_changed:false,master_delivery:false}};
}
