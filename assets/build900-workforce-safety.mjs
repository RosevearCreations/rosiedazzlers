// Rosie 900 — private, role-isolated job preparation and safety evidence.
export const REQUIRED_CHECKS900=Object.freeze(['ppe','chemicals','power_water','worksite','weather']);
export const CHECK_KEYS900=Object.freeze([...REQUIRED_CHECKS900,'tool_condition']);
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const validId900=x=>typeof x==='string'&&UUID.test(x);
const text=(x,n=350)=>typeof x==='string'&&x.trim().length>=12&&x.trim().length<=n;
export function normalizeAction900(input){
 if(!input||typeof input!=='object'||Array.isArray(input))return {ok:false,error:'Invalid action.'};
 const action=input.action;
 const fields={assignment:['action','client_request_id','booking_id','inventory_item_id','assigned_to_staff_user_id','assignment_action','note'],
  check:['action','client_request_id','booking_id','check_key','inventory_item_id','outcome','note'],
  signoff:['action','client_request_id','booking_id','decision','note']};
 if(!fields[action]||Object.keys(input).some(k=>!fields[action].includes(k)))return {ok:false,error:'Unsupported or privileged fields.'};
 if(!validId900(input.client_request_id)||!validId900(input.booking_id)||!text(input.note))
  return {ok:false,error:'Original job/request UUID and descriptive note (12–350 characters) required.'};
 const base={ok:true,action,client_request_id:input.client_request_id,booking_id:input.booking_id,note:input.note.trim()};
 if(action==='assignment'){
  if(!validId900(input.inventory_item_id)||!validId900(input.assigned_to_staff_user_id)||!['assign','return'].includes(input.assignment_action))
   return {ok:false,error:'Invalid equipment assignment.'};
  return {...base,inventory_item_id:input.inventory_item_id,assigned_to_staff_user_id:input.assigned_to_staff_user_id,assignment_action:input.assignment_action};
 }
 if(action==='check'){
  if(!CHECK_KEYS900.includes(input.check_key)||!['pass','issue'].includes(input.outcome))
   return {ok:false,error:'Invalid preparation check.'};
  const tool=input.check_key==='tool_condition';
  if(tool?!validId900(input.inventory_item_id):input.inventory_item_id!==undefined&&input.inventory_item_id!==null)
   return {ok:false,error:'Equipment ID belongs only to equipment condition checks.'};
  return {...base,check_key:input.check_key,inventory_item_id:tool?input.inventory_item_id:null,outcome:input.outcome};
 }
 if(!['ready','hold'].includes(input.decision))return {ok:false,error:'Unknown supervisor decision.'};
 return {...base,decision:input.decision};
}
const sort=(a,b)=>String(b.recorded_at).localeCompare(String(a.recorded_at))||String(b.id).localeCompare(String(a.id));
export function evaluateJob900({assignments=[],checks=[],signoffs=[],service=[],now=new Date()}={}){
 if([assignments,checks,signoffs,service].some(x=>!Array.isArray(x)))throw Error('Source unavailable');
 if(assignments.length>160||checks.length>300||signoffs.length>80||service.length>150)throw Error('Source window full: review incomplete');
 for(const a of [...assignments,...checks,...signoffs])if(!validId900(a.id)||!validId900(a.booking_id))throw Error('Malformed original evidence');
 const latestAssignment=new Map();
 for(const row of [...assignments].sort(sort))if(!latestAssignment.has(row.inventory_item_id))latestAssignment.set(row.inventory_item_id,row);
 const active=[...latestAssignment.values()].filter(x=>x.assignment_action==='assign').sort(sort);
 const latestCheck=new Map();
 for(const row of [...checks].sort(sort)){
  const key=row.check_key+'|'+(row.inventory_item_id||'');
  if(!latestCheck.has(key))latestCheck.set(key,row);
 }
 const checksView=REQUIRED_CHECKS900.map(key=>{
  const value=latestCheck.get(key+'|')||null;
  return {key,outcome:value?.outcome||'missing',recorded_at:value?.recorded_at||null,staff_user_id:value?.staff_user_id||null,note:value?.note||null};
 });
 const today=new Date(now).toISOString().slice(0,10);
 const overdueTools=new Set(service.filter(x=>x.event_kind==='planned'&&x.due_date<today).map(x=>x.inventory_item_id));
 const tools=active.map(row=>{
  const checked=latestCheck.get('tool_condition|'+row.inventory_item_id)||null;
  const fresh=checked&&String(checked.recorded_at)>String(row.recorded_at);
  const overdue=overdueTools.has(row.inventory_item_id);
  return {inventory_item_id:row.inventory_item_id,assigned_to_staff_user_id:row.assigned_to_staff_user_id,
   assigned_at:row.recorded_at,condition:fresh?checked.outcome:'missing',maintenance_review:overdue,
   ready:!!fresh&&checked.outcome==='pass'&&!overdue};
 });
 const complete=checksView.every(x=>x.outcome==='pass')&&tools.length>0&&tools.every(x=>x.ready);
 const latestSignoff=[...signoffs].sort(sort)[0]||null;
 const lastChange=[...assignments,...checks].map(x=>String(x.recorded_at)).sort().at(-1)||'';
 const signoffCurrent=!!latestSignoff&&String(latestSignoff.recorded_at)>=lastChange;
 const supervisorReady=complete&&signoffCurrent&&latestSignoff?.decision==='ready';
 return {schema:'rosie.workforce-safety.v900',required_checks:checksView,tools,
  pending_checks:checksView.filter(x=>x.outcome!=='pass').length,
  equipment_review_count:tools.filter(x=>!x.ready).length,
  eligible_for_supervisor_signoff:complete,
  supervisor_signoff:latestSignoff?{decision:latestSignoff.decision,recorded_at:latestSignoff.recorded_at,signer_id:latestSignoff.signed_by_staff_user_id,note:latestSignoff.note,current:signoffCurrent}:null,
  readiness:supervisorReady?'SUPERVISOR_RECORDED_READY':'HOLD',
  evidence:{source_original:true,staff_checks_self_reported:true,supervisor_recorded:supervisorReady,
   independent_physical_certification:false,automatic_job_start:false,customer_data_returned:false,
   inventory_changed:false,maintenance_certified:false,payments_or_master_changed:false}};
}