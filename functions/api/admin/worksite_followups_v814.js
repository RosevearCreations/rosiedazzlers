// Build 814: authorized staff follow-up queue; staff response is visible in
// My Account only. No external notification or appointment mutation.
import { serviceHeaders } from '../_lib/staff-auth.js';
import { staffAccess811 } from './worksite_issue_review_v811.js';
import { sameOrigin811 } from '../client/worksite_issues_v811.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SELECT='id,issue_id,request_kind,request_text,status,requested_at,updated_at,workflow_revision,staff_response,staff_responded_at,staff_responded_by_staff_user_id,customer_feedback,customer_decided_at';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function rows(env,path){const response=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,{headers:serviceHeaders(env)});
  if(!response.ok)throw Error('Staff source unavailable');const result=await response.json();if(!Array.isArray(result))throw Error('Invalid source');return result;}

export function validStaffFollowup814(body){
  if(!body||typeof body!=='object'||Array.isArray(body))return null;
  const id=typeof body.followup_id==='string'?body.followup_id.trim():'',revision=body.expected_revision;
  const response=typeof body.response==='string'?body.response.trim():'';
  if(!UUID.test(id)||!Number.isSafeInteger(revision)||revision<0||revision>2147483645||response.length<12||response.length>1000)return null;
  return {id,revision,response};
}
export const onRequestOptions=()=>json({ok:false,error:'Method not allowed.'},405);
export async function onRequestGet({request,env}){
  const access=await staffAccess811(request,env);if(!access.ok)return access.response;
  try{
    const followups=await rows(env,`customer_worksite_followups_v814?select=${SELECT}&order=requested_at.desc&limit=150`);
    const ids=[...new Set(followups.map(r=>r.issue_id).filter(id=>UUID.test(String(id))))];
    const issues=ids.length?await rows(env,`customer_worksite_issues_v811?select=id,booking_id,category,status&id=in.(${ids.join(',')})&limit=150`):[];
    const fids=followups.map(r=>r.id).filter(id=>UUID.test(String(id)));
    const events=fids.length?await rows(env,`customer_worksite_followup_events_v814?select=followup_id,followup_revision,event_kind,recorded_at,actor_staff_user_id,previous_status,current_status&followup_id=in.(${fids.join(',')})&order=recorded_at.desc&limit=450`):[];
    const context=new Map(issues.map(r=>[r.id,r]));
    return json({ok:true,followups:followups.map(r=>({...r,issue_category:context.get(r.issue_id)?.category||null,booking_id:context.get(r.issue_id)?.booking_id||null})),events,
      authority:{staff_session_verified:true,operations_permission:true,notification_sent:false,booking_changed:false}});
  }catch{return json({ok:false,error:'The staff follow-up queue is unavailable. No response was recorded.'},503);}
}
export async function onRequestPost({request,env}){
  if(!sameOrigin811(request))return json({ok:false,error:'Staff responses must come from the application.'},403);
  if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))return json({ok:false,error:'JSON is required.'},415);
  const access=await staffAccess811(request,env);if(!access.ok)return access.response;
  try{
    const raw=await request.text();if(raw.length>1500)return json({ok:false,error:'Response is too large.'},413);
    const decision=validStaffFollowup814(JSON.parse(raw));
    if(!decision)return json({ok:false,error:'Enter a clear response of 12–1000 characters and refresh the latest follow-up version.'},400);
    const current=(await rows(env,`customer_worksite_followups_v814?select=id,status,workflow_revision&id=eq.${encodeURIComponent(decision.id)}&limit=1`))[0];
    if(!current)return json({ok:false,error:'Follow-up not found.'},404);
    if(current.status!=='awaiting_staff'||current.workflow_revision!==decision.revision)
      return json({ok:false,error:'This follow-up is no longer awaiting a response. Refresh first.'},409);
    const now=new Date().toISOString();
    const response=await fetch(`${env.SUPABASE_URL}/rest/v1/customer_worksite_followups_v814?select=id,status,workflow_revision&id=eq.${encodeURIComponent(decision.id)}&status=eq.awaiting_staff&workflow_revision=eq.${decision.revision}`,{
      method:'PATCH',headers:{...serviceHeaders(env),Prefer:'return=representation'},body:JSON.stringify({status:'staff_replied',staff_response:decision.response,
        staff_responded_by_staff_user_id:access.actor.id,staff_responded_at:now,updated_at:now,workflow_revision:decision.revision+1})});
    if(!response.ok)return json({ok:false,error:'Could not save a verified staff response. Refresh before retrying.'},503);
    const saved=await response.json().catch(()=>[]);
    if(!Array.isArray(saved)||!saved[0])return json({ok:false,error:'Another reviewer responded first. Refresh to see the latest state.'},409);
    return json({ok:true,status:saved[0].status,workflow_revision:saved[0].workflow_revision,
      notification_sent:false,booking_changed:false,payment_changed:false});
  }catch(error){return json({ok:false,error:error instanceof SyntaxError?'Invalid response JSON.':'Staff response unavailable. No result was confirmed.'},error instanceof SyntaxError?400:503);}
}
