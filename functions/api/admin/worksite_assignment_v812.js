// Build 812: verified operations assignment, acknowledgement and manual arrival escalation.
// Read/write only via server-held service role after a real staff session is authorized.
import { serviceHeaders } from '../_lib/staff-auth.js';
import { hasActionAccess } from '../_lib/action-permissions.js';
import { staffAccess811 } from './worksite_issue_review_v811.js';
import { sameOrigin811 } from '../client/worksite_issues_v811.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const OPEN=new Set(['pending_review','reviewing']);
const CLOSED_BOOKING=new Set(['completed','cancelled','canceled','refunded','no_show']);
const SELECT='id,customer_profile_id,booking_id,category,customer_description,status,submitted_at,updated_at,reviewed_at,reviewed_by_staff_user_id,staff_private_note,customer_visible_resolution,assigned_staff_user_id,assigned_at,assigned_by_staff_user_id,staff_acknowledged_at,staff_acknowledged_by_staff_user_id,arrival_escalation_status,arrival_escalated_at,arrival_escalated_by_staff_user_id,workflow_revision';
const STAFF='id,full_name,role_code,can_manage_bookings,is_active,permissions_profile';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const safeText=x=>typeof x==='string'?x.trim():'';

export function torontoToday812(now=new Date()) {
  const p=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Toronto',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
  const x=t=>p.find(y=>y.type===t)?.value||'';
  return `${x('year')}-${x('month')}-${x('day')}`;
}
export function arrivalPriority812(issue,serviceDate,today,booking=null) {
  if(!OPEN.has(issue.status))return 'closed';
  if(booking&&(booking.detailing_completed_at||CLOSED_BOOKING.has(String(booking.status||'').toLowerCase())||
    CLOSED_BOOKING.has(String(booking.job_status||'').toLowerCase())))return 'not_active';
  if(!/^\d{4}-\d{2}-\d{2}$/.test(serviceDate||''))return 'unavailable';
  return serviceDate<today?'past_due':serviceDate===today?'arrival_today':'upcoming';
}
export function eligibleAssignees812(rows) {
  return (Array.isArray(rows)?rows:[]).filter(row=>row.is_active===true &&
    (row.can_manage_bookings===true || row.role_code==='admin') && hasActionAccess(row,'operations.customer.manage'))
    .map(row=>({id:row.id,name:safeText(row.full_name)||'Authorized staff'}))
    .filter(row=>UUID.test(row.id)).sort((a,b)=>a.name.localeCompare(b.name));
}
export function validAssignmentAction812(body) {
  if(!body||typeof body!=='object'||Array.isArray(body))return null;
  const id=safeText(body.issue_id),revision=body.expected_revision,action=safeText(body.action);
  if(!UUID.test(id)||!Number.isSafeInteger(revision)||revision<0||revision>2147483645||
    !['assign','acknowledge','escalate','clear_escalation'].includes(action))return null;
  if(action==='assign' && body.assigned_staff_user_id!==null && !UUID.test(safeText(body.assigned_staff_user_id)))return null;
  return {id,revision,action,assignee:action==='assign'?body.assigned_staff_user_id:null};
}
async function rows(env,path) {
  const response=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,{headers:serviceHeaders(env)});
  if(!response.ok)throw Error('Authoritative source unavailable');
  const data=await response.json();if(!Array.isArray(data))throw Error('Unexpected source');return data;
}
function staffIssue812(row,bookings,today) {
  const booking=bookings.get(row.booking_id)||null,date=booking?.service_date||null;
  return {id:row.id,booking_id:row.booking_id,category:row.category,description:row.customer_description,
    status:row.status,submitted_at:row.submitted_at,updated_at:row.updated_at,reviewed_at:row.reviewed_at,
    reviewed_by_staff_user_id:row.reviewed_by_staff_user_id,private_note:row.staff_private_note,
    resolution:row.customer_visible_resolution,assigned_staff_user_id:row.assigned_staff_user_id,
    assigned_at:row.assigned_at,staff_acknowledged_at:row.staff_acknowledged_at,
    arrival_escalation_status:row.arrival_escalation_status,arrival_escalated_at:row.arrival_escalated_at,
    workflow_revision:row.workflow_revision,service_date:date,arrival_priority:arrivalPriority812(row,date,today,booking)};
}

export const onRequestOptions=()=>json({ok:false,error:'Method not allowed.'},405);
export async function onRequestGet({request,env}) {
  const access=await staffAccess811(request,env);if(!access.ok)return access.response;
  try {
    const [issues,staff]=await Promise.all([
      rows(env,`customer_worksite_issues_v811?select=${SELECT}&order=submitted_at.desc&limit=100`),
      rows(env,`staff_users?select=${STAFF}&is_active=eq.true&limit=100`)
    ]);
    const ids=[...new Set(issues.map(row=>row.booking_id).filter(id=>UUID.test(String(id))))];
    const bookings=ids.length?await rows(env,`bookings?select=id,service_date,status,job_status,detailing_completed_at&id=in.(${ids.join(',')})&limit=100`):[];
    const timelineIds=issues.map(row=>row.id).filter(id=>UUID.test(String(id)));
    const events=timelineIds.length?await rows(env,`customer_worksite_issue_events_v813?select=issue_id,issue_revision,event_kind,recorded_at,actor_staff_user_id,previous_status,current_status,previous_assignee,current_assignee,previous_escalation,current_escalation,customer_resolution_snapshot&issue_id=in.(${timelineIds.join(',')})&order=recorded_at.desc&limit=500`):[];
    const bookingMap=new Map(bookings.map(row=>[row.id,row]));
    const today=torontoToday812();
    return json({ok:true,issues:issues.map(row=>staffIssue812(row,bookingMap,today)),events,staff_candidates:eligibleAssignees812(staff),
      today,authority:{session_verified:true,operations_review:true,assignment_allowed:hasActionAccess(access.actor,'operations.assignment.manage'),customer_contacted:false,booking_changed:false,automatic_escalation:false}});
  }catch{return json({ok:false,error:'Assignment queue is temporarily unavailable. No decision was recorded.'},503);}
}

export async function onRequestPost({request,env}) {
  if(!sameOrigin811(request))return json({ok:false,error:'Staff updates must come from this application.'},403);
  if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))return json({ok:false,error:'JSON is required.'},415);
  const access=await staffAccess811(request,env);if(!access.ok)return access.response;
  try {
    const raw=await request.text();if(raw.length>1600)return json({ok:false,error:'Request is too large.'},413);
    const action=validAssignmentAction812(JSON.parse(raw));
    if(!action)return json({ok:false,error:'Invalid worksite action or review version. Refresh the queue.'},400);
    const source=await rows(env,`customer_worksite_issues_v811?select=${SELECT}&id=eq.${encodeURIComponent(action.id)}&limit=1`);
    const issue=source[0];
    if(!issue)return json({ok:false,error:'Issue not found.'},404);
    if(!OPEN.has(issue.status)||issue.workflow_revision!==action.revision)return json({ok:false,error:'This issue has changed or closed. Refresh the queue.'},409);
    const now=new Date().toISOString(),patch={updated_at:now,workflow_revision:action.revision+1};
    if(action.action==='assign') {
      if(!hasActionAccess(access.actor,'operations.assignment.manage'))return json({ok:false,error:'Staff assignment permission is required.'},403);
      if(action.assignee!==null){
        const candidates=eligibleAssignees812(await rows(env,`staff_users?select=${STAFF}&id=eq.${encodeURIComponent(action.assignee)}&is_active=eq.true&limit=1`));
        if(!candidates.some(row=>row.id===action.assignee))return json({ok:false,error:'Choose an active staff member authorized for customer issue review.'},403);
      }
      if(issue.assigned_staff_user_id===action.assignee)return json({ok:false,error:'Assignment is unchanged.'},409);
      patch.assigned_staff_user_id=action.assignee;patch.assigned_at=action.assignee?now:null;patch.assigned_by_staff_user_id=access.actor.id;
    } else if(action.action==='acknowledge') {
      if(issue.staff_acknowledged_at)return json({ok:false,error:'A staff member already acknowledged this report.'},409);
      patch.staff_acknowledged_at=now;patch.staff_acknowledged_by_staff_user_id=access.actor.id;
    } else if(action.action==='escalate') {
      if(issue.arrival_escalation_status==='flagged')return json({ok:false,error:'This issue is already flagged for arrival-day follow-up.'},409);
      const booking=(await rows(env,`bookings?select=id,service_date,status,job_status,detailing_completed_at&id=eq.${encodeURIComponent(issue.booking_id)}&limit=1`))[0];
      if(!booking||arrivalPriority812(issue,booking.service_date,torontoToday812(),booking)==='upcoming')
        return json({ok:false,error:'Arrival-day escalation is available only on or after the appointment date.'},409);
      if(!['past_due','arrival_today'].includes(arrivalPriority812(issue,booking.service_date,torontoToday812(),booking)))
        return json({ok:false,error:'This appointment is no longer eligible for arrival escalation.'},409);
      patch.arrival_escalation_status='flagged';patch.arrival_escalated_at=now;patch.arrival_escalated_by_staff_user_id=access.actor.id;
    } else {
      if(issue.arrival_escalation_status!=='flagged')return json({ok:false,error:'Only a flagged arrival-day issue may be marked addressed.'},409);
      patch.arrival_escalation_status='addressed';
      patch.arrival_escalation_addressed_at=now;patch.arrival_escalation_addressed_by_staff_user_id=access.actor.id;
    }
    const response=await fetch(`${env.SUPABASE_URL}/rest/v1/customer_worksite_issues_v811?select=${SELECT}&id=eq.${encodeURIComponent(action.id)}&status=in.(pending_review,reviewing)&workflow_revision=eq.${action.revision}`,{
      method:'PATCH',headers:{...serviceHeaders(env),Prefer:'return=representation'},body:JSON.stringify(patch)});
    if(!response.ok)return json({ok:false,error:'Update could not be recorded. Refresh before retrying.'},503);
    const saved=await response.json().catch(()=>[]);
    if(!Array.isArray(saved)||!saved[0])return json({ok:false,error:'Another staff member changed this issue. Refresh the queue.'},409);
    return json({ok:true,workflow_revision:saved[0].workflow_revision,recorded_action:action.action,
      customer_contacted:false,booking_changed:false,payment_changed:false});
  }catch(error){return json({ok:false,error:error instanceof SyntaxError?'Invalid JSON.':'Worksite action unavailable. No confirmation was recorded.'},error instanceof SyntaxError?400:503);}
}
