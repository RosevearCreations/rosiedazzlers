// Rosie 902: server-only original exception queue, SLA and two-person crew handoff receipts.
import {requireStaffAccess,serviceHeaders,isUuid} from '../_lib/staff-auth.js';
import {hasActionAccess} from '../_lib/action-permissions.js';
import {sameOrigin811} from '../client/worksite_issues_v811.js';
import {validId900} from '../../../assets/build900-workforce-safety.mjs';
import {normalize902,project902} from '../../../assets/build902-jobday-exceptions.mjs';
import {privateRows901,load901Events} from '../_lib/jobday-safety-v901.js';

const table='rosie_jobday_exception_receipts_v902',maxReceipt=220;
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{
 'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store',
 'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex,nofollow'}});
const deny=()=>json({ok:false,error:'Unsupported source mutation.'},405);
export const onRequestOptions=deny;
export const onRequestPut=deny;
export const onRequestPatch=deny;
export const onRequestDelete=deny;
async function access(request,env){
 const a=await requireStaffAccess({request,env,capability:null,allowLegacyAdminFallback:false});
 if(!a.ok)return a;
 const role=String(a.actor?.role_code||'').toLowerCase();
 if(a.auth_mode!=='session'||!isUuid(a.actor?.id)||
  !['admin','operations_manager','senior_detailer','detailer'].includes(role)||
  !hasActionAccess(a.actor,'detailer.job.view'))
  return {ok:false,response:json({ok:false,error:'Original signed staff session required.'},403)};
 return {...a,supervisor:['admin','operations_manager'].includes(role)&&hasActionAccess(a.actor,'operations.assignment.manage'),
 worker:hasActionAccess(a.actor,'detailer.job.update')};
}
async function scopedBooking(env,a,id){
 if(!validId900(id))return null;
 const b=(await privateRows901(env,'bookings?select=id,status,job_status,service_date,assigned_staff_user_id&id=eq.'+id+'&limit=2',2))[0];
 if(!b)return null;
 if(a.supervisor||b.assigned_staff_user_id===a.actor.id)return b;
 const crew=await privateRows901(env,'booking_staff_assignments?select=staff_user_id&booking_id=eq.'+id+'&limit=60',60);
 return crew.some(x=>x.staff_user_id===a.actor.id)?b:null;
}
async function source(env,id){
 const [events901,receipts902]=await Promise.all([
  load901Events(env,id),
  privateRows901(env,table+'?select=id,booking_id,exception_id,event_kind,offer_id,recipient_staff_user_id,priority,decision,note,staff_user_id,recorded_at&booking_id=eq.'+id+'&order=recorded_at.desc&limit='+maxReceipt,maxReceipt)
 ]);
 return {events901,receipts902,report:project902({booking_id:id,events901,receipts902})};
}
async function roster(env){
 const all=await privateRows901(env,'staff_users?select=id,full_name,role_code,is_active&is_active=eq.true&limit=80',80);
 return all.filter(x=>['admin','operations_manager'].includes(String(x.role_code||'').toLowerCase()))
  .map(x=>({id:x.id,name:x.full_name||'Supervisor',role:x.role_code}));
}
export async function onRequestGet({request,env}){
 const a=await access(request,env);if(!a.ok)return a.response;
 const url=new URL(request.url),id=url.searchParams.get('booking_id');
 try{
  if(id){
   const b=await scopedBooking(env,a,id);
   if(!b)return json({ok:false,error:'This original work order is outside signed staff scope.'},403);
   const d=await source(env,b.id);
   return json({ok:true,booking:{id:b.id,service_date:b.service_date,status:b.status,job_status:b.job_status},
    report:d.report,receipts:d.receipts902.map(x=>({id:x.id,exception_id:x.exception_id,event_kind:x.event_kind,
     offer_id:x.offer_id,recipient_staff_user_id:x.recipient_staff_user_id,priority:x.priority,decision:x.decision,
     note:x.note,staff_user_id:x.staff_user_id,recorded_at:x.recorded_at})),
    supervisors:await roster(env),role:{supervisor:a.supervisor,worker:a.worker,actor_id:a.actor.id},
    source_revision:env.CF_PAGES_COMMIT_SHA||null});
  }
  if(!a.supervisor)return json({ok:false,error:'Original supervisor queue permission required.'},403);
  const [issues,receipts]=await Promise.all([
   privateRows901(env,'rosie_jobday_events_v901?select=id,booking_id,event_kind,escalation_id,subject,severity,decision,note,staff_user_id,recorded_at&event_kind=in.(escalation,resolution)&order=recorded_at.desc&limit=220',220),
   privateRows901(env,table+'?select=id,booking_id,exception_id,event_kind,offer_id,recipient_staff_user_id,priority,decision,note,staff_user_id,recorded_at&order=recorded_at.desc&limit=220',220)
  ]);
  const bookingIds=[...new Set(issues.map(e=>e.booking_id))];
  if(bookingIds.length>50)throw Error('Queue scope needs pagination');
  const queue=bookingIds.flatMap(b=>project902({booking_id:b,
   events901:issues.filter(x=>x.booking_id===b),receipts902:receipts.filter(x=>x.booking_id===b)}).open_queue);
  queue.sort((x,y)=>(x.sla_state==='OVERDUE'?0:1)-(y.sla_state==='OVERDUE'?0:1)||
   x.due_at.localeCompare(y.due_at));
  return json({ok:true,queue,metrics:{open:queue.length,overdue:queue.filter(x=>x.sla_state==='OVERDUE').length,
   awaiting_handoff:queue.filter(x=>x.handoff.status==='PENDING').length},
   source_revision:env.CF_PAGES_COMMIT_SHA||null,manual_refresh:true,automatic_alerts:false});
 }catch{return json({ok:false,error:'Original exception source unavailable or bounded queue incomplete. SLA status cannot be certified.'},503)}
}
export async function onRequestPost({request,env}){
 if(!sameOrigin811(request))return json({ok:false,error:'Same-origin signed staff session required.'},403);
 if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))
  return json({ok:false,error:'JSON required.'},415);
 const a=await access(request,env);if(!a.ok)return a.response;
 const raw=await request.text().catch(()=>'');
 if(raw.length>1400)return json({ok:false,error:'Original receipt exceeds size cap.'},413);
 let body;try{body=JSON.parse(raw)}catch{return json({ok:false,error:'Malformed JSON.'},400)}
 const p=normalize902(body);if(!p.ok)return json({ok:false,error:p.error},400);
 if(p.action==='offer'&&!a.worker)return json({ok:false,error:'Assigned reporting crew permission required.'},403);
 if(p.action!=='offer'&&!a.supervisor)return json({ok:false,error:'Original authorized supervisor required.'},403);
 try{
  const booking=await scopedBooking(env,a,p.booking_id);
  if(!booking)return json({ok:false,error:'Original booking outside signed staff scope.'},403);
  const old=await privateRows901(env,table+'?select=*&client_request_id=eq.'+p.client_request_id+'&limit=2',2);
  if(old.length){
   const prev=old[0],fields=p.action==='offer'?['booking_id','exception_id','recipient_staff_user_id','note']:
    p.action==='acknowledge'?['booking_id','exception_id','offer_id','decision','note']:
    p.action==='triage'?['booking_id','exception_id','priority','note']:['booking_id','exception_id','note'];
   const same=prev.staff_user_id===a.actor.id&&prev.event_kind===p.action&&
    fields.every(x=>(prev[x]??null)===(p[x]??null));
   return same?json({ok:true,duplicate:true,source_recorded:true,receipt_id:prev.id}):
    json({ok:false,error:'Operation key belongs to different original signed evidence.'},409);
  }
  const d=await source(env,p.booking_id),issue=d.report.exceptions.find(x=>x.id===p.exception_id);
  if(!issue||!issue.open)return json({ok:false,error:'Original 901 escalation not found or already resolved.'},409);
  const original=d.events901.find(x=>x.id===p.exception_id&&x.event_kind==='escalation');
  let payload={client_request_id:p.client_request_id,booking_id:p.booking_id,
   exception_id:p.exception_id,event_kind:p.action,staff_user_id:a.actor.id,note:p.note,
   independent_physical_certification:false,customer_message_sent:false,automatic_dispatch:false};
  if(p.action==='offer'){
   if(original.staff_user_id!==a.actor.id)
    return json({ok:false,error:'Only the original reporting crew member can hand off their issue.'},403);
   if(issue.handoff.status==='PENDING'||issue.handoff.status==='TWO_PERSON_ACCEPTED')
    return json({ok:false,error:'Prior crew offer is pending or accepted. Do not duplicate handoff.'},409);
   if(p.recipient_staff_user_id===a.actor.id)
    return json({ok:false,error:'Handoff requires a distinct supervisor.'},403);
   const people=await roster(env);
   if(!people.some(x=>x.id===p.recipient_staff_user_id))
    return json({ok:false,error:'Original active supervisor recipient is unavailable.'},409);
   payload={...payload,recipient_staff_user_id:p.recipient_staff_user_id};
  }else if(p.action==='acknowledge'){
   if(issue.handoff.status!=='PENDING'||issue.handoff.offer_id!==p.offer_id)
    return json({ok:false,error:'Original latest handoff offer changed or is no longer pending.'},409);
   if(issue.handoff.recipient_staff_user_id!==a.actor.id)
    return json({ok:false,error:'Only the exact originally nominated supervisor can acknowledge.'},403);
   payload={...payload,offer_id:p.offer_id,decision:p.decision};
  }else{
   if(original.staff_user_id===a.actor.id)
    return json({ok:false,error:'Exception review must have independent supervisor.'},403);
   if(p.action==='triage')payload={...payload,priority:p.priority};
  }
  const posted=await fetch(env.SUPABASE_URL+'/rest/v1/'+table+'?select=id',{
   method:'POST',redirect:'error',headers:{...serviceHeaders(env),Prefer:'return=representation'},body:JSON.stringify([payload])});
  if(posted.status===409)return json({ok:false,error:'Concurrent receipt or handoff conflict; refresh source.'},409);
  if(!posted.ok)return json({ok:false,error:'Original receipt write unavailable. Handoff remains unverified.'},503);
  const result=await posted.json().catch(()=>null);
  if(!Array.isArray(result)||!isUuid(result[0]?.id))
   return json({ok:false,error:'Source receipt readback unavailable; review before retry.'},503);
  return json({ok:true,source_recorded:true,receipt_id:result[0].id,actor_id:a.actor.id,
   actual_alerts_sent:0,automatic_dispatch:false,customer_messages_sent:0,
   independent_physical_certification:false,stock_adjusted:false,master_deliveries:0},201);
 }catch{return json({ok:false,error:'Original exception evidence unavailable. No handoff or supervisor acknowledgement inferred.'},503)}
}
