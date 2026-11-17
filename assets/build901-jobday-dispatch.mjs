// Rosie 901 — immutable, scoped dispatch / stop-work / return reconciliation projections.
// Never grants a physical safety certificate or changes a canonical booking on its own.
import {evaluateJob900,validId900} from './build900-workforce-safety.mjs';
const TYPES=Object.freeze(['escalation','resolution','dispatch','return','reconcile']);
export const SUBJECTS901=Object.freeze(['ppe','chemicals','power_water','worksite','weather','equipment','other']);
const FIELDS901={
 escalation:['action','client_request_id','booking_id','subject','severity','inventory_item_id','note'],
 resolution:['action','client_request_id','booking_id','escalation_id','decision','note'],
 dispatch:['action','client_request_id','booking_id','decision','note'],
 return:['action','client_request_id','booking_id','inventory_item_id','decision','note'],
 reconcile:['action','client_request_id','booking_id','decision','note']
};
const ordered=rows=>[...rows].sort((a,b)=>String(b.recorded_at||'').localeCompare(String(a.recorded_at||''))||String(b.id||'').localeCompare(String(a.id||'')));
const newest=rows=>ordered(rows)[0]||null;
export function normalize901(input){
 if(!input||typeof input!=='object'||Array.isArray(input))return {ok:false,error:'Invalid request.'};
 const action=String(input.action||'');
 if(!TYPES.includes(action)||Object.keys(input).some(k=>!FIELDS901[action].includes(k)))
  return {ok:false,error:'Unsupported action or privileged field.'};
 if(!validId900(input.client_request_id)||!validId900(input.booking_id)||
   typeof input.note!=='string'||input.note.trim().length<12||input.note.trim().length>350)
  return {ok:false,error:'Valid job/request IDs and an original 12–350 character explanation required.'};
 const base={ok:true,action,client_request_id:input.client_request_id,booking_id:input.booking_id,note:input.note.trim()};
 if(action==='escalation'){
  if(!SUBJECTS901.includes(input.subject)||!['stop_work','review'].includes(input.severity)||
   (input.subject==='equipment'?!validId900(input.inventory_item_id):input.inventory_item_id!==undefined))
   return {ok:false,error:'Invalid safety subject, severity or equipment link.'};
  return {...base,subject:input.subject,severity:input.severity,inventory_item_id:input.inventory_item_id||null};
 }
 if(action==='resolution'){
  if(!validId900(input.escalation_id)||!['resolved','hold'].includes(input.decision))return {ok:false,error:'Invalid escalation resolution.'};
  return {...base,escalation_id:input.escalation_id,decision:input.decision};
 }
 if(action==='dispatch'&&!['authorize','hold'].includes(input.decision))return {ok:false,error:'Invalid dispatch decision.'};
 if(action==='return'&&(!validId900(input.inventory_item_id)||!['good','issue'].includes(input.decision)))return {ok:false,error:'Invalid equipment return.'};
 if(action==='reconcile'&&!['reconciled','hold'].includes(input.decision))return {ok:false,error:'Invalid reconciliation decision.'};
 return {...base,decision:input.decision,...(action==='return'?{inventory_item_id:input.inventory_item_id}:{})};
}
export function project901({booking,assignments=[],checks=[],signoffs=[],service=[],events=[],now=new Date()}){
 if(!booking||!validId900(booking.id)||[assignments,checks,signoffs,service,events].some(a=>!Array.isArray(a)))throw Error('Original source unavailable');
 if(assignments.length>=160||checks.length>=300||signoffs.length>=80||service.length>=150||events.length>=250)
  throw Error('Evidence window incomplete');
 for(const e of events)if(!validId900(e.id)||e.booking_id!==booking.id||!TYPES.includes(e.event_kind))throw Error('Malformed original ledger');
 const prep=evaluateJob900({assignments,checks,signoffs,service,now});
 const latestSignoff=newest(signoffs);
 const escalations=ordered(events.filter(e=>e.event_kind==='escalation'));
 const resolutions=events.filter(e=>e.event_kind==='resolution');
 const open=escalations.filter(e=>newest(resolutions.filter(r=>r.escalation_id===e.id))?.decision!=='resolved');
 const activity=events.filter(e=>['escalation','resolution','return'].includes(e.event_kind));
 const lastRisk=newest(activity)?.recorded_at||'';
 const signedReady=prep.readiness==='SUPERVISOR_RECORDED_READY'&&latestSignoff?.decision==='ready'&&
  String(latestSignoff.recorded_at)>String(newest(events.filter(e=>['escalation','resolution'].includes(e.event_kind)))?.recorded_at||'');
 const activeEquipment=prep.tools;
 const returnEvents=events.filter(e=>e.event_kind==='return');
 const returnView=[...new Set(assignments.filter(x=>x.assignment_action==='assign').map(x=>x.inventory_item_id))].map(id=>{
  const lastAssignment=newest(assignments.filter(a=>a.inventory_item_id===id&&a.assignment_action==='assign'));
  const lastReturn=newest(returnEvents.filter(e=>e.inventory_item_id===id));
  const accepted=!!lastReturn&&lastReturn.decision==='good'&&String(lastReturn.recorded_at)>String(lastAssignment?.recorded_at||'');
  return {inventory_item_id:id,latest_return:lastReturn?{decision:lastReturn.decision,at:lastReturn.recorded_at,staff_user_id:lastReturn.staff_user_id}:null,staff_report_return_good:accepted};
 });
 const returnedAny=returnEvents.length>0;
 const blocked=String(booking.status||'').toLowerCase().match(/cancelled|canceled|refunded/)||
  String(booking.job_status||'').toLowerCase().match(/completed|cancelled|canceled/);
 const eligible=!blocked&&signedReady&&open.length===0&&!returnedAny;
 const latestDispatch=newest(events.filter(e=>e.event_kind==='dispatch'));
 const latestInput=newest([...assignments,...checks,...signoffs,...activity])?.recorded_at||'';
 const authorized=eligible&&latestDispatch?.decision==='authorize'&&latestDispatch.safety_signoff_id===latestSignoff?.id&&
  String(latestDispatch.recorded_at)>=String(latestInput);
 const latestReconcile=newest(events.filter(e=>e.event_kind==='reconcile'));
 const allReturned=returnView.length>0&&returnView.every(x=>x.staff_report_return_good);
 const eligibleReconcile=allReturned&&open.length===0;
 const latestReturnChange=newest([...assignments,...returnEvents,...escalations,...resolutions])?.recorded_at||'';
 const reconciled=eligibleReconcile&&latestReconcile?.decision==='reconciled'&&
  String(latestReconcile.recorded_at)>=String(latestReturnChange);
 return {schema:'rosie.jobday.dispatch.v901',booking_id:booking.id,workforce:prep,
  open_escalations:open.map(e=>({id:e.id,subject:e.subject,severity:e.severity,inventory_item_id:e.inventory_item_id,
   recorded_at:e.recorded_at,staff_user_id:e.staff_user_id,note:e.note})),
  escalations:escalations.map(e=>({id:e.id,subject:e.subject,severity:e.severity,inventory_item_id:e.inventory_item_id,
   recorded_at:e.recorded_at,staff_user_id:e.staff_user_id,note:e.note,latest_resolution:newest(resolutions.filter(r=>r.escalation_id===e.id))?.decision||null})),
  equipment_returns:returnView,eligible_to_authorize:!!eligible,dispatch_authorized:!!authorized,
  dispatch_status:open.length?'STOP_WORK_HOLD':authorized?'SUPERVISOR_DISPATCH_AUTHORIZED':eligible?'AWAITING_DISPATCH_DECISION':'DISPATCH_HOLD',
  latest_dispatch:latestDispatch?{decision:latestDispatch.decision,recorded_at:latestDispatch.recorded_at,note:latestDispatch.note}:null,
  eligible_to_reconcile:eligibleReconcile,equipment_reconciled:!!reconciled,
  latest_reconciliation:latestReconcile?{decision:latestReconcile.decision,at:latestReconcile.recorded_at}:null,
  enrolled:events.length>0,counts:{events:events.length,open_escalations:open.length,assigned_tools:returnView.length,staff_reported_good_returns:returnView.filter(x=>x.staff_report_return_good).length},
  authority:{signed_original_staff_only:true,no_independent_physical_certification:true,no_catalog_mutation:true,
   no_customer_or_payment_mutation:true,no_automatic_dispatch:true,no_master_event_delivery:true}};
}
