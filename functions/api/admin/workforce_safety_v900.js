// Rosie 900: signed private work order preparation, equipment assignment and safety attestations.
import {requireStaffAccess,serviceHeaders,isUuid} from '../_lib/staff-auth.js';
import {hasActionAccess} from '../_lib/action-permissions.js';
import {sameOrigin811} from '../client/worksite_issues_v811.js';
import {normalizeAction900,evaluateJob900,validId900} from '../../../assets/build900-workforce-safety.mjs';

const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{
 'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store',
 'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex,nofollow'}});
const denied=()=>json({ok:false,error:'Unsupported operation.'},405);
export const onRequestOptions=denied;
export const onRequestPatch=denied;
export const onRequestPut=denied;
export const onRequestDelete=denied;
const TABLES={assignment:'rosie_job_equipment_assignments_v900',
 check:'rosie_job_preparation_checks_v900',signoff:'rosie_job_safety_signoffs_v900'};
async function auth(request,env){
 const a=await requireStaffAccess({request,env,capability:null,allowLegacyAdminFallback:false});
 if(!a.ok)return a;
 const role=String(a.actor?.role_code||'').toLowerCase();
 if(a.auth_mode!=='session'||!isUuid(a.actor?.id)||!['admin','operations_manager','senior_detailer','detailer'].includes(role)||
    !hasActionAccess(a.actor,'detailer.job.view'))
  return {ok:false,response:json({ok:false,error:'Original signed Rosie staff session required.'},403)};
 const supervisor=['admin','operations_manager'].includes(role)&&hasActionAccess(a.actor,'operations.assignment.manage');
 const worker=hasActionAccess(a.actor,'detailer.job.update');
 return {...a,supervisor,worker};
}
async function rows(env,query,limit){
 if(!/^https:\/\//.test(String(env.SUPABASE_URL||''))||!String(env.SUPABASE_SERVICE_ROLE_KEY||''))
  throw Error('Original source not configured');
 const r=await fetch(env.SUPABASE_URL+'/rest/v1/'+query,{redirect:'error',headers:serviceHeaders(env)});
 if(!r.ok)throw Error('Original private source unavailable');
 const d=await r.json().catch(()=>null);
 if(!Array.isArray(d)||d.length>=limit)throw Error('Original source window incomplete');
 return d;
}
const getJob=(env,id)=>rows(env,'bookings?select=id,service_date,package_code,status,job_status,assigned_staff_user_id&id=eq.'+id+'&limit=2',2);
const getCrew=(env,id)=>rows(env,'booking_staff_assignments?select=booking_id,staff_user_id&booking_id=eq.'+id+'&limit=60',60);
async function scope(env,access,id){
 if(!validId900(id))return null;
 const b=(await getJob(env,id))[0];
 if(!b)return null;
 if(access.supervisor)return b;
 if(b.assigned_staff_user_id===access.actor.id)return b;
 const crew=await getCrew(env,id);
 return crew.some(x=>x.staff_user_id===access.actor.id)?b:null;
}
async function overview(env,id){
 const prefix='&booking_id=eq.'+id+'&order=recorded_at.desc';
 const [assignments,checks,signoffs,service]=await Promise.all([
  rows(env,TABLES.assignment+'?select=id,booking_id,inventory_item_id,assigned_to_staff_user_id,assignment_action,note,recorded_at'+prefix+'&limit=160',160),
  rows(env,TABLES.check+'?select=id,booking_id,check_key,inventory_item_id,outcome,note,staff_user_id,recorded_at'+prefix+'&limit=300',300),
  rows(env,TABLES.signoff+'?select=id,booking_id,decision,note,signed_by_staff_user_id,recorded_at'+prefix+'&limit=80',80),
  rows(env,'rosie_equipment_service_v899?select=id,inventory_item_id,event_kind,due_date,recorded_at&order=recorded_at.desc&limit=150',150)
 ]);
 return {assignments,checks,signoffs,service,projection:evaluateJob900({assignments,checks,signoffs,service})};
}
async function jobsFor(env,access){
 if(access.supervisor)
  return rows(env,'bookings?select=id,service_date,package_code,status,job_status,assigned_staff_user_id&order=service_date.desc&limit=40',40);
 const direct=await rows(env,'bookings?select=id,service_date,package_code,status,job_status,assigned_staff_user_id&assigned_staff_user_id=eq.'+access.actor.id+'&order=service_date.desc&limit=35',35);
 const crew=await rows(env,'booking_staff_assignments?select=booking_id&staff_user_id=eq.'+access.actor.id+'&limit=35',35);
 const ids=[...new Set(crew.map(x=>x.booking_id).filter(validId900))].filter(id=>!direct.some(b=>b.id===id));
 if(!ids.length)return direct;
 const other=await rows(env,'bookings?select=id,service_date,package_code,status,job_status,assigned_staff_user_id&id=in.('+ids.join(',')+')&limit=36',36);
 return [...direct,...other].slice(0,40);
}
export async function onRequestGet({request,env}){
 const a=await auth(request,env);if(!a.ok)return a.response;
 try{
  const id=new URL(request.url).searchParams.get('booking_id');
  if(id){
   const booking=await scope(env,a,id);
   if(!booking)return json({ok:false,error:'Work order not available to this staff member.'},403);
   const data=await overview(env,id);
   const [tools,staff]=await Promise.all([
    rows(env,'catalog_inventory_items?select=id,name,item_type,is_active&item_type=eq.tool&is_active=eq.true&order=name.asc&limit=150',150),
    a.supervisor?rows(env,'staff_users?select=id,full_name,role_code,is_active&is_active=eq.true&limit=80',80):Promise.resolve([])
   ]);
   return json({ok:true,booking,tools,staff,assignments:data.assignments,checks:data.checks,
    report:data.projection,role:{supervisor:a.supervisor,worker:a.worker,actor_id:a.actor.id},
    source_revision:env.CF_PAGES_COMMIT_SHA||null});
  }
  return json({ok:true,jobs:await jobsFor(env,a),role:{supervisor:a.supervisor,worker:a.worker,actor_id:a.actor.id},
   source_revision:env.CF_PAGES_COMMIT_SHA||null});
 }catch{return json({ok:false,error:'Original workforce source unavailable or bounded evidence incomplete. HOLD.'},503)}
}
export async function onRequestPost({request,env}){
 if(!sameOrigin811(request))return json({ok:false,error:'Same-origin staff session required.'},403);
 if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))
  return json({ok:false,error:'JSON required.'},415);
 const a=await auth(request,env);if(!a.ok)return a.response;
 const raw=await request.text().catch(()=>'');
 if(raw.length>1350)return json({ok:false,error:'Request exceeds size limit.'},413);
 let input;try{input=JSON.parse(raw)}catch{return json({ok:false,error:'Invalid JSON.'},400)}
 const action=normalizeAction900(input);
 if(!action.ok)return json({ok:false,error:action.error},400);
 if((action.action==='assignment'||action.action==='signoff')&&!a.supervisor)
  return json({ok:false,error:'Original operations supervisor signoff/assignment required.'},403);
 if(action.action==='check'&&!a.worker)return json({ok:false,error:'Job preparation update permission required.'},403);
 try{
  const booking=await scope(env,a,action.booking_id);
  if(!booking)return json({ok:false,error:'Work order outside signed staff scope.'},403);
  if(['canceled','cancelled','refunded'].includes(String(booking.status||'').toLowerCase())||
   ['completed','cancelled','canceled'].includes(String(booking.job_status||'').toLowerCase()))
    return json({ok:false,error:'Closed or cancelled work orders cannot be cleared.'},409);
  const t=TABLES[action.action];
  const original=await rows(env,t+'?select=*&client_request_id=eq.'+action.client_request_id+'&limit=2',2);
  if(original.length){
   const prior=original[0];
   const fields=action.action==='assignment'?
    ['booking_id','inventory_item_id','assigned_to_staff_user_id','assignment_action','note']:
    action.action==='check'?['booking_id','check_key','inventory_item_id','outcome','note']:['booking_id','decision','note'];
   const who=action.action==='assignment'?'assigned_by_staff_user_id':action.action==='check'?'staff_user_id':'signed_by_staff_user_id';
   const matches=prior[who]===a.actor.id&&fields.every(f=>(prior[f]??null)===(action[f]??null));
   return matches?json({ok:true,duplicate:true,source_recorded:true,review_id:prior.id}):
    json({ok:false,error:'Request UUID already belongs to a different observation.'},409);
  }
  const view=await overview(env,action.booking_id);
  let payload={client_request_id:action.client_request_id,booking_id:action.booking_id,note:action.note};
  if(action.action==='assignment'){
   const tools=await rows(env,'catalog_inventory_items?select=id,item_type,is_active&id=eq.'+action.inventory_item_id+'&limit=2',2);
   const people=await rows(env,'staff_users?select=id,role_code,is_active&id=eq.'+action.assigned_to_staff_user_id+'&limit=2',2);
   const crew=await getCrew(env,action.booking_id);
   if(tools[0]?.item_type!=='tool'||tools[0]?.is_active!==true||people[0]?.is_active!==true||
      !['admin','operations_manager','senior_detailer','detailer'].includes(people[0]?.role_code)||
      !([booking.assigned_staff_user_id,...crew.map(x=>x.staff_user_id)].includes(action.assigned_to_staff_user_id)))
    return json({ok:false,error:'Active original job, assigned staff and tool required.'},409);
   payload={...payload,inventory_item_id:action.inventory_item_id,
    assigned_to_staff_user_id:action.assigned_to_staff_user_id,assignment_action:action.assignment_action,
    assigned_by_staff_user_id:a.actor.id};
  }else if(action.action==='check'){
   if(action.check_key==='tool_condition'){
    const equipment=view.projection.tools.find(x=>x.inventory_item_id===action.inventory_item_id);
    if(!equipment||(!a.supervisor&&equipment.assigned_to_staff_user_id!==a.actor.id))
      return json({ok:false,error:'Equipment must be assigned to the signed checker.'},403);
   }
   payload={...payload,check_key:action.check_key,inventory_item_id:action.inventory_item_id,
    outcome:action.outcome,staff_user_id:a.actor.id};
  }else{
   if(action.decision==='ready'&&!view.projection.eligible_for_supervisor_signoff)
    return json({ok:false,error:'Missing, failed, or overdue preparation/equipment checks. Supervisor READY is HOLD.'},409);
   payload={...payload,decision:action.decision,signed_by_staff_user_id:a.actor.id,independent_physical_certification:false};
  }
  const saved=await fetch(env.SUPABASE_URL+'/rest/v1/'+t+'?select=id',{
   method:'POST',redirect:'error',headers:{...serviceHeaders(env),Prefer:'return=representation'},body:JSON.stringify([payload])});
  if(saved.status===409)return json({ok:false,error:'Concurrent request key; refresh before retry.'},409);
  if(!saved.ok)return json({ok:false,error:'Original staff evidence write unavailable; no approval inferred.'},503);
  const result=await saved.json().catch(()=>null);
  if(!Array.isArray(result)||!isUuid(result[0]?.id))return json({ok:false,error:'Original evidence readback unavailable; refresh.'},503);
  return json({ok:true,source_recorded:true,review_id:result[0].id,
   signed_actor_id:a.actor.id,independent_physical_certification:false,automatic_job_start:false,
   stock_adjusted:false,accounting_posted:false,messages_sent:0},201);
 }catch{return json({ok:false,error:'Original workforce source unavailable. Safety signoff remains HOLD.'},503)}
}
