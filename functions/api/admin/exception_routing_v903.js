// Rosie 903 — original 901/902-linked supervisor ownership and UNSENT internal notification outbox.
import {requireStaffAccess,serviceHeaders,isUuid} from '../_lib/staff-auth.js';
import {hasActionAccess} from '../_lib/action-permissions.js';
import {sameOrigin811} from '../client/worksite_issues_v811.js';
import {validId900} from '../../../assets/build900-workforce-safety.mjs';
import {project902} from '../../../assets/build902-jobday-exceptions.mjs';
import {normalize903,project903} from '../../../assets/build903-exception-routing.mjs';
import {load901Events,privateRows901} from '../_lib/jobday-safety-v901.js';

const TABLE='rosie_exception_routing_outbox_v903',SELECT='id,booking_id,exception_id,event_kind,handoff_ack_id,related_receipt_id,recipient_staff_user_id,decision,template_key,staff_user_id,note,recorded_at';
const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{
 'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store',
 'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex,nofollow'}});
const deny=()=>reply({ok:false,error:'Unsupported original source mutation.'},405);
export const onRequestOptions=deny;
export const onRequestPatch=deny;
export const onRequestPut=deny;
export const onRequestDelete=deny;
async function signedSupervisor(request,env){
 const a=await requireStaffAccess({request,env,capability:null,allowLegacyAdminFallback:false});
 if(!a.ok)return a;
 if(a.auth_mode!=='session'||!isUuid(a.actor?.id)||
  !['admin','operations_manager'].includes(String(a.actor?.role_code||'').toLowerCase())||
  !hasActionAccess(a.actor,'operations.assignment.manage')||
  !hasActionAccess(a.actor,'detailer.job.view'))
  return {ok:false,response:reply({ok:false,error:'Original signed operations supervisor required.'},403)};
 return a;
}
async function booking(env,id){
 if(!validId900(id))return null;
 return (await privateRows901(env,'bookings?select=id,status,job_status,service_date&id=eq.'+id+'&limit=2',2))[0]||null;
}
async function originals(env,id){
 const [events901,receipts902,receipts903]=await Promise.all([
  load901Events(env,id),
  privateRows901(env,'rosie_jobday_exception_receipts_v902?select=id,booking_id,exception_id,event_kind,offer_id,recipient_staff_user_id,priority,decision,note,staff_user_id,recorded_at&booking_id=eq.'+id+'&order=recorded_at.desc&limit=220',220),
  privateRows901(env,TABLE+'?select='+SELECT+'&booking_id=eq.'+id+'&order=recorded_at.desc&limit=210',210)
 ]);
 return {events901,receipts902,receipts903,queue902:project902({booking_id:id,events901,receipts902})};
}
async function supervisors(env){
 const active=await privateRows901(env,'staff_users?select=id,full_name,role_code,is_active&is_active=eq.true&limit=80',80);
 return active.filter(p=>['admin','operations_manager'].includes(String(p.role_code||'').toLowerCase()))
  .map(x=>({id:x.id,name:x.full_name||'Supervisor',role:x.role_code}));
}
function view(d,id,exceptionId){
 const original=d.queue902.exceptions.find(e=>e.id===exceptionId);
 if(!original)return null;
 return {exception:original,report:project903({booking_id:id,exception:original,
  receipts903:d.receipts903.filter(x=>x.exception_id===exceptionId)})};
}
export async function onRequestGet({request,env}){
 const a=await signedSupervisor(request,env);if(!a.ok)return a.response;
 const url=new URL(request.url),id=url.searchParams.get('booking_id'),exceptionId=url.searchParams.get('exception_id');
 try{
  if(id){
   const b=await booking(env,id);
   if(!b)return reply({ok:false,error:'Original booking not found.'},404);
   const d=await originals(env,id);
   const list=d.queue902.exceptions.map(x=>({
    id:x.id,subject:x.subject,open:x.open,priority:x.priority,sla_state:x.sla_state,
    due_at:x.due_at,handoff_verified:x.handoff.verified}));
   if(exceptionId&&!validId900(exceptionId))return reply({ok:false,error:'Original exception UUID required.'},400);
   const target=exceptionId||list[0]?.id||null;
   const state=target?view(d,id,target):null;
   if(target&&!state)return reply({ok:false,error:'Exception outside original work order.'},404);
   return reply({ok:true,booking:{id:b.id,service_date:b.service_date},
    exceptions:list,exception:state?.exception||null,report:state?.report||null,
    history:state?d.receipts903.filter(x=>x.exception_id===target):[],
    supervisors:await supervisors(env),role:{supervisor:true,actor_id:a.actor.id},
    source_revision:env.CF_PAGES_COMMIT_SHA||null});
  }
  const events=await privateRows901(env,'rosie_jobday_events_v901?select=id,booking_id,event_kind,escalation_id,subject,severity,decision,note,staff_user_id,recorded_at&event_kind=in.(escalation,resolution)&order=recorded_at.desc&limit=210',210);
  const ids=[...new Set(events.map(x=>x.booking_id))];
  if(ids.length>45)throw Error('Original queue window needs pagination');
  const tasks=[];
  for(const bookingId of ids){
   const d=await originals(env,bookingId);
   for(const e of d.queue902.open_queue){
    const s=view(d,bookingId,e.id);
    tasks.push({booking_id:bookingId,exception_id:e.id,subject:e.subject,due_at:e.due_at,
     sla_state:e.sla_state,priority:e.priority,owner_state:s.report.owner_state,
     owner_staff_user_id:s.report.owner_staff_user_id,pending_route:s.report.pending_route!==null,
     unsent_draft:s.report.outbox!==null});
   }
  }
  tasks.sort((a,b)=>(a.sla_state==='OVERDUE'?0:1)-(b.sla_state==='OVERDUE'?0:1)||a.due_at.localeCompare(b.due_at));
  return reply({ok:true,queue:tasks,metrics:{open:tasks.length,unclaimed:tasks.filter(x=>!x.owner_staff_user_id).length,
   awaiting_routing:tasks.filter(x=>x.pending_route).length,internal_drafts:tasks.filter(x=>x.unsent_draft).length},
   source_revision:env.CF_PAGES_COMMIT_SHA||null,external_delivery_enabled:false});
 }catch{return reply({ok:false,error:'Original routing/consent boundary source incomplete. No owner or notification accepted.'},503);}
}
export async function onRequestPost({request,env}){
 if(!sameOrigin811(request))return reply({ok:false,error:'Original same-origin signed session required.'},403);
 if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))
  return reply({ok:false,error:'JSON required.'},415);
 const a=await signedSupervisor(request,env);if(!a.ok)return a.response;
 const raw=await request.text().catch(()=>'');
 if(raw.length>1250)return reply({ok:false,error:'Request size exceeds limit.'},413);
 let input;try{input=JSON.parse(raw)}catch{return reply({ok:false,error:'Malformed JSON.'},400);}
 const p=normalize903(input);if(!p.ok)return reply({ok:false,error:p.error},400);
 try{
  const b=await booking(env,p.booking_id);
  if(!b)return reply({ok:false,error:'Original work order is missing.'},404);
  const prior=await privateRows901(env,TABLE+'?select=*&client_request_id=eq.'+p.client_request_id+'&limit=2',2);
  if(prior.length){
   const x=prior[0];
   const keys=p.action==='route'?['booking_id','exception_id','recipient_staff_user_id','note']:
    p.action==='accept_route'?['booking_id','exception_id','decision','note']:
    p.action==='draft'?['booking_id','exception_id','template_key','note']:
    ['booking_id','exception_id','note'];
   const same=x.event_kind===p.action&&x.staff_user_id===a.actor.id&&keys.every(k=>(x[k]??null)===(p[k]??null))&&
    (p.action!=='accept_route'||x.related_receipt_id===p.route_id)&&
    (p.action!=='suppress'||x.related_receipt_id===p.draft_id);
   return same?reply({ok:true,source_recorded:true,duplicate:true,receipt_id:x.id}):
    reply({ok:false,error:'Request UUID belongs to a different signed event.'},409);
  }
  const d=await originals(env,p.booking_id),s=view(d,p.booking_id,p.exception_id);
  if(!s||!s.exception.open)return reply({ok:false,error:'Original exception not open or unavailable.'},409);
  const {exception,report}=s;
  const payload={client_request_id:p.client_request_id,booking_id:p.booking_id,exception_id:p.exception_id,
   event_kind:p.action,staff_user_id:a.actor.id,note:p.note,
   channel:'internal_task',send_authorized:false,delivery_attempted:false,
   customer_contact_authorized:false,customer_consent_claimed:false,physical_safety_certified:false};
  if(p.action==='claim'){
   if(report.owner_staff_user_id||!exception.handoff.verified||
     exception.handoff.recipient_staff_user_id!==a.actor.id)
    return reply({ok:false,error:'Original two-person supervisor handoff is not verified for this claimant.'},409);
   const ack=d.receipts902.find(x=>x.exception_id===p.exception_id&&
    x.event_kind==='acknowledge'&&x.decision==='accepted'&&
    x.staff_user_id===a.actor.id&&x.offer_id===exception.handoff.offer_id);
   if(!ack)return reply({ok:false,error:'Exact original handoff acceptance receipt missing.'},409);
   payload.handoff_ack_id=ack.id;
  }else if(p.action==='route'){
   if(!report.owner_current||report.owner_staff_user_id!==a.actor.id||
     p.recipient_staff_user_id===a.actor.id)
    return reply({ok:false,error:'Only the current verified exception owner can route to a distinct supervisor.'},403);
   if(!(await supervisors(env)).some(x=>x.id===p.recipient_staff_user_id))
    return reply({ok:false,error:'Original active supervisor recipient unavailable.'},409);
   payload.recipient_staff_user_id=p.recipient_staff_user_id;
  }else if(p.action==='accept_route'){
   if(!report.pending_route||report.pending_route.id!==p.route_id||
    report.pending_route.recipient_staff_user_id!==a.actor.id||
    report.owner_staff_user_id===a.actor.id)
    return reply({ok:false,error:'Only the nominated distinct supervisor can acknowledge the current original route.'},403);
   payload.related_receipt_id=p.route_id;payload.decision=p.decision;
  }else if(p.action==='draft'){
   if(!report.owner_current||report.owner_staff_user_id!==a.actor.id||
    !['sla_overdue','safety_hold','handoff_pending'].includes(p.template_key))
    return reply({ok:false,error:'Only current verified owner may prepare an internal UNSENT draft.'},403);
   payload.template_key=p.template_key;payload.recipient_staff_user_id=a.actor.id;
  }else if(p.action==='suppress'){
   if(report.owner_staff_user_id!==a.actor.id||report.outbox?.id!==p.draft_id)
    return reply({ok:false,error:'Only current owner may suppress the exact active UNSENT draft.'},403);
   payload.related_receipt_id=p.draft_id;
  }
  const posted=await fetch(env.SUPABASE_URL+'/rest/v1/'+TABLE+'?select=id',{
    method:'POST',redirect:'error',headers:{...serviceHeaders(env),Prefer:'return=representation'},body:JSON.stringify([payload])});
  if(posted.status===409)return reply({ok:false,error:'Concurrent owner/routing conflict. Refresh original source.'},409);
  if(!posted.ok)return reply({ok:false,error:'Original source receipt unavailable. No owner/send inferred.'},503);
  const rows=await posted.json().catch(()=>null);
  if(!Array.isArray(rows)||!isUuid(rows[0]?.id))
   return reply({ok:false,error:'Original receipt readback missing; review before retry.'},503);
  return reply({ok:true,source_recorded:true,receipt_id:rows[0].id,signed_actor_id:a.actor.id,
   channel:'internal_task',delivery_enabled:false,sent_count:0,customer_consent_claimed:false,
   customer_contact_authorized:false,provider_calls:0,master_deliveries:0,physical_safety_certified:false},201);
 }catch{return reply({ok:false,error:'Original routing/outbox source incomplete. Operation HOLD; no notification inferred.'},503);}
}
