// Build 814: authenticated customer follow-up, with verified ownership and
// idempotent retries. Nothing here sends a message or mutates an appointment.
import { customerIdentity811, loadRows, sameOrigin811 } from './worksite_issues_v811.js';
import { serviceHeaders } from '../_lib/customer-session.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KINDS=new Set(['clarification','new_information','still_unresolved','other']);
const SELECT='id,issue_id,client_request_id,request_kind,request_text,status,requested_at,updated_at,workflow_revision,staff_response,staff_responded_at,customer_feedback,customer_decided_at';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const clean=v=>typeof v==='string'?v.trim():'';

export function validFollowupAction814(body){
  if(!body||typeof body!=='object'||Array.isArray(body))return null;
  if(body.action==='request'){
    const issueId=clean(body.issue_id),clientId=clean(body.client_request_id),kind=clean(body.request_kind),description=clean(body.request_text);
    if(!UUID.test(issueId)||!UUID.test(clientId)||!KINDS.has(kind)||description.length<12||description.length>1000)return null;
    return {action:'request',issueId,clientId,kind,description};
  }
  if(body.action==='confirm'){
    const id=clean(body.followup_id),decision=clean(body.decision),feedback=clean(body.feedback),revision=body.expected_revision;
    if(!UUID.test(id)||!['confirmed','needs_more_help'].includes(decision)||!Number.isSafeInteger(revision)||revision<1||revision>2147483645||
      feedback.length>500||(decision==='needs_more_help'&&feedback.length<12))return null;
    return {action:'confirm',id,decision,feedback,revision};
  }
  return null;
}
export function safeCustomerFollowup814(row){
  return {id:row.id,issue_id:row.issue_id,request_kind:row.request_kind,request_text:row.request_text,
    status:row.status,requested_at:row.requested_at,updated_at:row.updated_at,workflow_revision:row.workflow_revision,
    staff_response:row.staff_response||null,staff_responded_at:row.staff_responded_at||null,
    customer_feedback:row.customer_feedback||null,customer_decided_at:row.customer_decided_at||null};
}
async function write(env,method,path,payload){
  const response=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,{method,headers:{...serviceHeaders(env),Prefer:'return=representation'},body:JSON.stringify(payload)});
  if(response.status===409)return {conflict:true};
  if(!response.ok)throw Error('Source update failed');
  const rows=await response.json().catch(()=>null);
  if(!Array.isArray(rows))throw Error('Source confirmation unavailable');
  return {rows};
}
export const onRequestOptions=()=>json({ok:false,error:'Method not allowed.'},405);
export async function onRequestGet({request,env}){
  try{
    const identity=await customerIdentity811(request,env);
    if(!identity)return json({ok:false,error:'Sign in to see your follow-up requests.'},401);
    const rows=await loadRows(env,`customer_worksite_followups_v814?select=${SELECT}&customer_profile_id=eq.${encodeURIComponent(identity.profileId)}&order=requested_at.desc&limit=100`);
    return json({ok:true,followups:rows.map(safeCustomerFollowup814),authority:{customer_scoped:true,notification_sent:false,booking_changed:false}});
  }catch{return json({ok:false,error:'Follow-up history is unavailable. Please try again.'},503);}
}
export async function onRequestPost({request,env}){
  if(!sameOrigin811(request))return json({ok:false,error:'Submit follow-ups from your account.'},403);
  if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))return json({ok:false,error:'JSON is required.'},415);
  try{
    const identity=await customerIdentity811(request,env);
    if(!identity)return json({ok:false,error:'Sign in to submit a follow-up.'},401);
    const raw=await request.text();if(raw.length>2200)return json({ok:false,error:'Follow-up is too large.'},413);
    const data=validFollowupAction814(JSON.parse(raw));
    if(!data)return json({ok:false,error:'Choose a valid follow-up action and provide the requested detail.'},400);
    if(data.action==='request'){
      // Ownership is resolved by the authenticated profile, never by a body field.
      const owned=await loadRows(env,`customer_worksite_issues_v811?select=id&customer_profile_id=eq.${encodeURIComponent(identity.profileId)}&id=eq.${encodeURIComponent(data.issueId)}&limit=1`);
      if(!owned.length)return json({ok:false,error:'That worksite report is not available in this account.'},404);
      const previous=await loadRows(env,`customer_worksite_followups_v814?select=${SELECT}&customer_profile_id=eq.${encodeURIComponent(identity.profileId)}&client_request_id=eq.${encodeURIComponent(data.clientId)}&limit=1`);
      if(previous.length){
        const prior=previous[0];
        if(prior.issue_id!==data.issueId||prior.request_kind!==data.kind||prior.request_text!==data.description)
          return json({ok:false,error:'That request reference was already used for different content.'},409);
        return json({ok:true,duplicate:true,followup:safeCustomerFollowup814(prior),notification_sent:false,appointment_changed:false});
      }
      const current=await loadRows(env,`customer_worksite_followups_v814?select=id&issue_id=eq.${encodeURIComponent(data.issueId)}&status=in.(awaiting_staff,staff_replied)&limit=1`);
      if(current.length)return json({ok:false,error:'This report already has an outstanding follow-up. Review its status before creating another.'},409);
      const saved=await write(env,'POST',`customer_worksite_followups_v814?select=${SELECT}`,[{
        issue_id:data.issueId,customer_profile_id:identity.profileId,client_request_id:data.clientId,
        request_kind:data.kind,request_text:data.description,status:'awaiting_staff'}]);
      if(saved.conflict)return json({ok:false,error:'A follow-up was saved or another is already open. Refresh the history before retrying.'},409);
      if(!saved.rows[0])return json({ok:false,error:'The saved request could not be confirmed. Refresh your history first.'},503);
      return json({ok:true,followup:safeCustomerFollowup814(saved.rows[0]),notification_sent:false,appointment_changed:false},201);
    }
    const original=await loadRows(env,`customer_worksite_followups_v814?select=${SELECT}&customer_profile_id=eq.${encodeURIComponent(identity.profileId)}&id=eq.${encodeURIComponent(data.id)}&limit=1`);
    const row=original[0];
    if(!row)return json({ok:false,error:'This follow-up is not available in your account.'},404);
    if(row.status!== 'staff_replied'||row.workflow_revision!==data.revision)return json({ok:false,error:'This response has changed or already received a decision. Refresh first.'},409);
    const saved=await write(env,'PATCH',`customer_worksite_followups_v814?select=${SELECT}&id=eq.${encodeURIComponent(data.id)}&customer_profile_id=eq.${encodeURIComponent(identity.profileId)}&status=eq.staff_replied&workflow_revision=eq.${data.revision}`,{
      status:data.decision,customer_feedback:data.feedback||null,customer_decided_at:new Date().toISOString(),updated_at:new Date().toISOString(),workflow_revision:data.revision+1});
    if(saved.conflict||!saved.rows?.[0])return json({ok:false,error:'Another decision was recorded. Refresh to see the latest status.'},409);
    return json({ok:true,followup:safeCustomerFollowup814(saved.rows[0]),notification_sent:false,appointment_changed:false});
  }catch(error){return json({ok:false,error:error instanceof SyntaxError?'Invalid follow-up format.':'Follow-up could not be verified. Refresh your history before retrying.'},error instanceof SyntaxError?400:503);}
}
