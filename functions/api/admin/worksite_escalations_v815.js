// Build 815. Readable only by verified operations staff, writable only by
// supervisors with independent assignment-management permission.
import { serviceHeaders } from '../_lib/staff-auth.js';
import { hasActionAccess } from '../_lib/action-permissions.js';
import { staffAccess811 } from './worksite_issue_review_v811.js';
import { sameOrigin811 } from '../client/worksite_issues_v811.js';
import { followupAging815 } from '../_lib/worksite-followup-aging-v815.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TABLE='customer_worksite_followup_escalations_v815';
const FIELDS='id,followup_id,reason,status,flagged_at,flagged_by_staff_user_id,acknowledged_at,acknowledged_by_staff_user_id,cleared_at,cleared_by_staff_user_id,updated_at,workflow_revision';
const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const supervisor=actor=>['operations_manager','admin'].includes(String(actor?.role_code||'').toLowerCase())&&hasActionAccess(actor,'operations.assignment.manage');
async function rows(env,path){const r=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,{headers:serviceHeaders(env)});if(!r.ok)throw Error('Escalation source unavailable');const data=await r.json();if(!Array.isArray(data))throw Error('Invalid source');return data;}
export function validEscalationAction815(body){
  if(!body||typeof body!=='object'||Array.isArray(body))return null;
  const action=body.action,id=typeof body.followup_id==='string'?body.followup_id.trim():'',revision=body.expected_revision;
  if(!['flag','acknowledge','clear'].includes(action)||!UUID.test(id))return null;
  if(action==='flag'){
    const reason=typeof body.reason==='string'?body.reason.trim():'';
    return reason.length>=12&&reason.length<=600?{action,id,reason}:null;
  }
  if(!Number.isSafeInteger(revision)||revision<0||revision>2147483645)return null;
  return {action,id,revision};
}
export const onRequestOptions=()=>respond({ok:false,error:'Method not allowed.'},405);
export async function onRequestGet({request,env}){
  const access=await staffAccess811(request,env);if(!access.ok)return access.response;
  try{
    const escalations=await rows(env,`${TABLE}?select=${FIELDS}&order=flagged_at.desc&limit=150`);
    const ids=escalations.map(e=>e.id).filter(id=>UUID.test(String(id)));
    const events=ids.length?await rows(env,`customer_worksite_followup_escalation_events_v815?select=escalation_id,escalation_revision,event_kind,recorded_at,actor_staff_user_id,previous_status,current_status&escalation_id=in.(${ids.join(',')})&order=recorded_at.desc&limit=450`):[];
    return respond({ok:true,escalations,events,can_escalate:supervisor(access.actor),
      thresholds:{attention_hours:24,supervisor_review_hours:48,contractual_sla:false},
      authority:{staff_session_verified:true,automatic_escalation:false,customer_notification:false,booking_changed:false}});
  }catch{return respond({ok:false,error:'Supervisor escalation history unavailable. No escalation action was recorded.'},503);}
}
export async function onRequestPost({request,env}){
  if(!sameOrigin811(request))return respond({ok:false,error:'Supervisor changes must come from this application.'},403);
  if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))return respond({ok:false,error:'JSON is required.'},415);
  const access=await staffAccess811(request,env);if(!access.ok)return access.response;
  if(!supervisor(access.actor))return respond({ok:false,error:'An authenticated operations supervisor with assignment management permission must make this decision.'},403);
  try{
    const raw=await request.text();if(raw.length>1200)return respond({ok:false,error:'Escalation request is too large.'},413);
    const decision=validEscalationAction815(JSON.parse(raw));if(!decision)return respond({ok:false,error:'Choose a valid action and provide a private reason of 12–600 characters or the latest revision.'},400);
    const now=new Date().toISOString();
    if(decision.action==='flag'){
      const followup=(await rows(env,`customer_worksite_followups_v814?select=id,status,requested_at&id=eq.${encodeURIComponent(decision.id)}&limit=1`))[0];
      if(!followup)return respond({ok:false,error:'Follow-up not found.'},404);
      if(followup.status!=='awaiting_staff')return respond({ok:false,error:'Only an unanswered follow-up can be flagged. Refresh first.'},409);
      const previous=await rows(env,`${TABLE}?select=id&followup_id=eq.${encodeURIComponent(decision.id)}&limit=1`);
      if(previous.length)return respond({ok:false,error:'This follow-up already has a supervisor escalation. Refresh before retrying.'},409);
      const r=await fetch(`${env.SUPABASE_URL}/rest/v1/${TABLE}?select=${FIELDS}`,{method:'POST',headers:{...serviceHeaders(env),Prefer:'return=representation'},body:JSON.stringify({followup_id:decision.id,reason:decision.reason,status:'flagged',flagged_by_staff_user_id:access.actor.id})});
      if(r.status===409)return respond({ok:false,error:'Supervisor review already exists. Refresh first.'},409);
      if(!r.ok)return respond({ok:false,error:'Supervisor flag was not confirmed. Refresh before retrying.'},503);
      const saved=await r.json().catch(()=>[]);if(!Array.isArray(saved)||!saved[0])return respond({ok:false,error:'Supervisor flag not confirmed. Refresh before retrying.'},503);
      return respond({ok:true,status:saved[0].status,age:followupAging815(followup),notification_sent:false,booking_changed:false},201);
    }
    const original=(await rows(env,`${TABLE}?select=${FIELDS}&followup_id=eq.${encodeURIComponent(decision.id)}&limit=1`))[0];
    if(!original)return respond({ok:false,error:'Supervisor escalation not found.'},404);
    const expected=decision.action==='acknowledge'?'flagged':'acknowledged';
    if(original.status!==expected||original.workflow_revision!==decision.revision)return respond({ok:false,error:'The escalation already changed. Refresh before another decision.'},409);
    const patch={status:decision.action==='acknowledge'?'acknowledged':'cleared',updated_at:now,workflow_revision:decision.revision+1,
      ...(decision.action==='acknowledge'?{acknowledged_at:now,acknowledged_by_staff_user_id:access.actor.id}:{cleared_at:now,cleared_by_staff_user_id:access.actor.id})};
    const r=await fetch(`${env.SUPABASE_URL}/rest/v1/${TABLE}?select=${FIELDS}&id=eq.${encodeURIComponent(original.id)}&status=eq.${expected}&workflow_revision=eq.${decision.revision}`,{
      method:'PATCH',headers:{...serviceHeaders(env),Prefer:'return=representation'},body:JSON.stringify(patch)});
    if(!r.ok)return respond({ok:false,error:'The escalation transition was not confirmed. Refresh first.'},503);
    const saved=await r.json().catch(()=>[]);if(!Array.isArray(saved)||!saved[0])return respond({ok:false,error:'Another supervisor updated this escalation. Refresh first.'},409);
    return respond({ok:true,status:saved[0].status,workflow_revision:saved[0].workflow_revision,notification_sent:false,booking_changed:false});
  }catch(error){return respond({ok:false,error:error instanceof SyntaxError?'Invalid JSON.':'Supervisor escalation unavailable. Refresh before retrying.'},error instanceof SyntaxError?400:503);}
}
