// Rosie 901: original job-day dispatch decisions, stop-work escalation and equipment return.
import {requireStaffAccess,serviceHeaders,isUuid} from '../_lib/staff-auth.js';
import {hasActionAccess} from '../_lib/action-permissions.js';
import {sameOrigin811} from '../client/worksite_issues_v811.js';
import {normalize901} from '../../../assets/build901-jobday-dispatch.mjs';
import {validId900} from '../../../assets/build900-workforce-safety.mjs';
import {privateRows901,load901Context} from '../_lib/jobday-safety-v901.js';

const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{
 'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store',
 'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex,nofollow'}});
const unsupported=()=>reply({ok:false,error:'Unsupported mutation.'},405);
export const onRequestOptions=unsupported;
export const onRequestPut=unsupported;
export const onRequestPatch=unsupported;
export const onRequestDelete=unsupported;
const table='rosie_jobday_events_v901';
async function authorize(request,env){
 const a=await requireStaffAccess({request,env,capability:null,allowLegacyAdminFallback:false});
 if(!a.ok)return a;
 const role=String(a.actor?.role_code||'').toLowerCase();
 if(a.auth_mode!=='session'||!isUuid(a.actor?.id)||
  !['admin','operations_manager','senior_detailer','detailer'].includes(role)||
  !hasActionAccess(a.actor,'detailer.job.view'))
  return {ok:false,response:reply({ok:false,error:'Original signed Rosie staff session required.'},403)};
 return {...a,supervisor:['admin','operations_manager'].includes(role)&&
  hasActionAccess(a.actor,'operations.assignment.manage'),
  worker:hasActionAccess(a.actor,'detailer.job.update')};
}
async function workOrder(env,a,id){
 if(!validId900(id))return null;
 const booking=(await privateRows901(env,
  'bookings?select=id,service_date,package_code,status,job_status,assigned_staff_user_id&id=eq.'+id+'&limit=2',2))[0];
 if(!booking)return null;
 if(a.supervisor||booking.assigned_staff_user_id===a.actor.id)return booking;
 const crew=await privateRows901(env,
  'booking_staff_assignments?select=staff_user_id&booking_id=eq.'+id+'&limit=60',60);
 return crew.some(x=>x.staff_user_id===a.actor.id)?booking:null;
}
export async function onRequestGet({request,env}){
 const a=await authorize(request,env);if(!a.ok)return a.response;
 const id=new URL(request.url).searchParams.get('booking_id');
 if(!validId900(id))return reply({ok:false,error:'Original booking UUID required.'},400);
 try{
  const booking=await workOrder(env,a,id);
  if(!booking)return reply({ok:false,error:'This original job is not in the signed staff scope.'},403);
  const data=await load901Context(env,booking);
  const tools=await privateRows901(env,
   'catalog_inventory_items?select=id,name,item_type,is_active&item_type=eq.tool&is_active=eq.true&order=name.asc&limit=150',150);
  return reply({ok:true,booking,report:data.report,
   events:data.events.map(x=>({id:x.id,event_kind:x.event_kind,subject:x.subject,severity:x.severity,
    decision:x.decision,inventory_item_id:x.inventory_item_id,escalation_id:x.escalation_id,
    staff_user_id:x.staff_user_id,recorded_at:x.recorded_at,note:x.note})),
   tools,role:{supervisor:a.supervisor,worker:a.worker,actor_id:a.actor.id},
   source_revision:env.CF_PAGES_COMMIT_SHA||null});
 }catch{return reply({ok:false,error:'Original job-day source unavailable or evidence window incomplete. Safety HOLD.'},503)}
}
export async function onRequestPost({request,env}){
 if(!sameOrigin811(request))return reply({ok:false,error:'Original same-origin staff session required.'},403);
 if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))
  return reply({ok:false,error:'JSON required.'},415);
 const a=await authorize(request,env);if(!a.ok)return a.response;
 const raw=await request.text().catch(()=>'');
 if(raw.length>1200)return reply({ok:false,error:'Safety event exceeds size limit.'},413);
 let input;try{input=JSON.parse(raw)}catch{return reply({ok:false,error:'Malformed JSON.'},400)}
 const p=normalize901(input);if(!p.ok)return reply({ok:false,error:p.error},400);
 if(['resolution','dispatch','reconcile'].includes(p.action)&&!a.supervisor)
  return reply({ok:false,error:'Independent original operations supervisor required.'},403);
 if(['escalation','return'].includes(p.action)&&!a.worker)
  return reply({ok:false,error:'Assigned staff operation permission required.'},403);
 try{
  const booking=await workOrder(env,a,p.booking_id);
  if(!booking)return reply({ok:false,error:'Original booking outside signed staff scope.'},403);
  const prev=await privateRows901(env,table+'?select=*&client_request_id=eq.'+p.client_request_id+'&limit=2',2);
  if(prev.length){
   const prior=prev[0];
   const keys=p.action==='escalation'?['booking_id','subject','severity','inventory_item_id','note']:
    p.action==='resolution'?['booking_id','escalation_id','decision','note']:
    p.action==='return'?['booking_id','inventory_item_id','decision','note']:['booking_id','decision','note'];
   const equal=prior.staff_user_id===a.actor.id&&prior.event_kind===p.action&&
    keys.every(k=>(prior[k]??null)===(p[k]??null));
   return equal?reply({ok:true,duplicate:true,source_recorded:true,record_id:prior.id}):
    reply({ok:false,error:'Request key already belongs to a different signed event.'},409);
  }
  const ctx=await load901Context(env,booking);
  const report=ctx.report;
  let saved={client_request_id:p.client_request_id,booking_id:p.booking_id,event_kind:p.action,
   staff_user_id:a.actor.id,note:p.note,independently_certified:false,automatic_dispatch:false};
  if(p.action==='escalation'){
   if(p.subject==='equipment'&&!ctx.assignments.some(x=>x.inventory_item_id===p.inventory_item_id&&x.assignment_action==='assign'))
    return reply({ok:false,error:'Original tool has no assignment history for this work order.'},409);
   saved={...saved,subject:p.subject,severity:p.severity,inventory_item_id:p.inventory_item_id};
  }else if(p.action==='resolution'){
   const original=ctx.events.find(x=>x.id===p.escalation_id&&x.event_kind==='escalation');
   if(!original)return reply({ok:false,error:'Exact original escalation is not in this work order.'},404);
   if(original.staff_user_id===a.actor.id)return reply({ok:false,error:'Supervisor cannot resolve an escalation they reported.'},403);
   saved={...saved,escalation_id:p.escalation_id,decision:p.decision};
  }else if(p.action==='dispatch'){
   if(p.decision==='authorize'&&!report.eligible_to_authorize)
    return reply({ok:false,error:'Original supervisor readiness, current checklist or incident clearance missing. Dispatch held.'},409);
   saved={...saved,decision:p.decision,
    safety_signoff_id:p.decision==='authorize'?ctx.signoffs
     .slice().sort((x,y)=>String(y.recorded_at).localeCompare(String(x.recorded_at)))[0]?.id:null};
   if(p.decision==='authorize'&&!validId900(saved.safety_signoff_id))
    return reply({ok:false,error:'Exact original safety signoff unavailable.'},503);
  }else if(p.action==='return'){
   const original=ctx.assignments.filter(x=>x.inventory_item_id===p.inventory_item_id&&x.assignment_action==='assign')
    .sort((x,y)=>String(y.recorded_at).localeCompare(String(x.recorded_at)))[0];
   if(!original||original.assigned_to_staff_user_id!==a.actor.id)
    return reply({ok:false,error:'Only the original assigned crew member may report this tool return.'},403);
   saved={...saved,inventory_item_id:p.inventory_item_id,decision:p.decision};
  }else if(p.action==='reconcile'){
   if(p.decision==='reconciled'&&!report.eligible_to_reconcile)
    return reply({ok:false,error:'All assigned tools require staff-reported GOOD returns and zero unresolved escalations.'},409);
   saved={...saved,decision:p.decision};
  }
  const response=await fetch(env.SUPABASE_URL+'/rest/v1/'+table+'?select=id',{
   method:'POST',redirect:'error',headers:{...serviceHeaders(env),Prefer:'return=representation'},
   body:JSON.stringify([saved])});
  if(response.status===409)return reply({ok:false,error:'Request key conflict; refresh and inspect original evidence.'},409);
  if(!response.ok)return reply({ok:false,error:'Original job-day event could not be written. Safety remains HOLD.'},503);
  const rows=await response.json().catch(()=>null);
  if(!Array.isArray(rows)||!isUuid(rows[0]?.id))return reply({ok:false,error:'Source readback absent; refresh before retry.'},503);
  return reply({ok:true,source_recorded:true,record_id:rows[0].id,actor_id:a.actor.id,kind:p.action,
   automatic_dispatch:false,independently_certified:false,stock_adjusted:false,
   customer_messages_sent:0,accounting_posted:false,master_deliveries:0},201);
 }catch{return reply({ok:false,error:'Original job-day source not available. Dispatch/safety decision remains HOLD.'},503)}
}
