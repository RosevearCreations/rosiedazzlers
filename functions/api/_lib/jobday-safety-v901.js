// Rosie 901 private source adapter for the canonical job workflow and Admin review.
// No job mutations; stop-work evidence is enforced only for jobs enrolled in 901.
import {serviceHeaders} from './staff-auth.js';
import {validId900} from '../../../assets/build900-workforce-safety.mjs';
import {project901} from '../../../assets/build901-jobday-dispatch.mjs';
const LIMITS={assignments:160,checks:300,signoffs:80,service:150,events:250};
export async function privateRows901(env,path,limit){
 if(!/^https:\/\//.test(String(env.SUPABASE_URL||''))||!String(env.SUPABASE_SERVICE_ROLE_KEY||''))
  throw Error('Original private database unavailable');
 const r=await fetch(env.SUPABASE_URL+'/rest/v1/'+path,{headers:serviceHeaders(env),redirect:'error',cache:'no-store'});
 if(!r.ok)throw Error('Original private source query failed');
 const rows=await r.json().catch(()=>null);
 if(!Array.isArray(rows)||rows.length>=limit)throw Error('Original evidence window incomplete');
 return rows;
}
export const eventFields901='id,booking_id,event_kind,inventory_item_id,escalation_id,safety_signoff_id,subject,severity,decision,note,staff_user_id,recorded_at';
export async function load901Events(env,id){
 if(!validId900(id))throw Error('Invalid original booking ID');
 return privateRows901(env,'rosie_jobday_events_v901?select='+eventFields901+'&booking_id=eq.'+id+'&order=recorded_at.desc&limit='+LIMITS.events,LIMITS.events);
}
export async function load901Context(env,booking,preloadedEvents=null){
 if(!booking||!validId900(booking.id))throw Error('Invalid original booking');
 const id=booking.id,prefix='&booking_id=eq.'+id+'&order=recorded_at.desc';
 const [assignments,checks,signoffs,service,events]=await Promise.all([
  privateRows901(env,'rosie_job_equipment_assignments_v900?select=id,booking_id,inventory_item_id,assigned_to_staff_user_id,assignment_action,note,recorded_at'+prefix+'&limit=160',LIMITS.assignments),
  privateRows901(env,'rosie_job_preparation_checks_v900?select=id,booking_id,check_key,inventory_item_id,outcome,staff_user_id,note,recorded_at'+prefix+'&limit=300',LIMITS.checks),
  privateRows901(env,'rosie_job_safety_signoffs_v900?select=id,booking_id,decision,signed_by_staff_user_id,note,recorded_at'+prefix+'&limit=80',LIMITS.signoffs),
  privateRows901(env,'rosie_equipment_service_v899?select=id,inventory_item_id,event_kind,due_date,recorded_at&order=recorded_at.desc&limit=150',LIMITS.service),
  preloadedEvents===null?load901Events(env,id):Promise.resolve(preloadedEvents)
 ]);
 const report=project901({booking,assignments,checks,signoffs,service,events});
 return {assignments,checks,signoffs,service,events,report};
}
export async function requireJobdayTransition901({env,bookingId,action}){
 if(!['dispatch','start','resume'].includes(action))return {allowed:true,enrolled:false};
 const events=await load901Events(env,bookingId);
 if(events.length===0)return {allowed:true,enrolled:false}; // explicit opt-in; preserve legacy work orders.
 const row=await privateRows901(env,'bookings?select=id,status,job_status,service_date,assigned_staff_user_id&id=eq.'+bookingId+'&limit=2',2);
 if(!row[0])return {allowed:false,enrolled:true,code:'jobday_booking_missing'};
 const report=(await load901Context(env,row[0],events)).report;
 return {allowed:report.dispatch_authorized,enrolled:true,
  code:report.dispatch_authorized?null:report.open_escalations.length?'jobday_stop_work':'jobday_dispatch_hold',
  status:report.dispatch_status};
}
