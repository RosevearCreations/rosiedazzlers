// Build 824: authenticated, supervisor-only private review handoffs.
// Append-only note source. No customer-facing response, notification or booking mutation.
import { serviceHeaders } from '../_lib/staff-auth.js';
import { hasActionAccess } from '../_lib/action-permissions.js';
import { staffAccess811 } from './worksite_issue_review_v811.js';
import { sameOrigin811 } from '../client/worksite_issues_v811.js';

const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CATEGORIES=new Set(['all','older48h','unknownAge','unowned','openEscalations','reviewPast']);
const TABLE='customer_worksite_supervisor_notes_v824';
const SELECT='id,followup_id,request_id,actor_staff_user_id,exception_key,note_text,followup_revision,recorded_at';
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{
  'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff'
}});
const supervisor=actor=>['admin','operations_manager'].includes(String(actor?.role_code||'').toLowerCase())&&
  hasActionAccess(actor,'operations.assignment.manage');
async function rows(env,path){
  const r=await fetch(env.SUPABASE_URL+'/rest/v1/'+path,{headers:serviceHeaders(env)});
  if(!r.ok)throw Error('Private review evidence unavailable');
  const data=await r.json();
  if(!Array.isArray(data))throw Error('Invalid private source');
  return data;
}
export function validNote824(value){
  if(!value||Array.isArray(value)||typeof value!=='object')return null;
  const id=typeof value.followup_id==='string'?value.followup_id.trim():'';
  const requestId=typeof value.request_id==='string'?value.request_id.trim():'';
  const text=typeof value.note_text==='string'?value.note_text.trim():'';
  const category=value.exception_key,revision=value.expected_revision;
  if(!UUID.test(id)||!UUID.test(requestId)||!CATEGORIES.has(category)||
    text.length<12||text.length>500||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(text)||
    !Number.isSafeInteger(revision)||revision<0||revision>2147483645)return null;
  return {id,requestId,text,category,revision};
}
export const onRequestOptions=()=>reply({ok:false,error:'Method not allowed.'},405);
export async function onRequestGet({request,env}){
  const access=await staffAccess811(request,env);if(!access.ok)return access.response;
  if(!supervisor(access.actor))return reply({ok:false,error:'Supervisor review permission required.'},403);
  const id=new URL(request.url).searchParams.get('followup_id')||'';
  if(!UUID.test(id))return reply({ok:false,error:'Select one valid follow-up.'},400);
  try{
    const followup=await rows(env,'customer_worksite_followups_v814?select=id,workflow_revision&id=eq.'+encodeURIComponent(id)+'&limit=1');
    if(!followup.length)return reply({ok:false,error:'Follow-up not found.'},404);
    const history=await rows(env,TABLE+'?select='+SELECT+'&followup_id=eq.'+encodeURIComponent(id)+'&order=recorded_at.desc,id.desc&limit=20');
    return reply({ok:true,followup_id:id,history,history_limit:20,can_review:true,
      private_supervisor_only:true,customer_message_sent:false,booking_changed:false});
  }catch{return reply({ok:false,error:'Private review history unavailable. No contents were disclosed.'},503);}
}
export async function onRequestPost({request,env}){
  if(!sameOrigin811(request))return reply({ok:false,error:'Same-origin request required.'},403);
  if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))
    return reply({ok:false,error:'JSON required.'},415);
  const access=await staffAccess811(request,env);if(!access.ok)return access.response;
  if(!supervisor(access.actor))return reply({ok:false,error:'Supervisor review permission required.'},403);
  try{
    const raw=await request.text();if(raw.length>1800)return reply({ok:false,error:'Review note is too large.'},413);
    const value=validNote824(JSON.parse(raw));
    if(!value)return reply({ok:false,error:'A valid follow-up, revision, request ID, category and 12–500-character private note are required.'},400);
    const prior=await rows(env,TABLE+'?select='+SELECT+'&actor_staff_user_id=eq.'+
      encodeURIComponent(access.actor.id)+'&request_id=eq.'+encodeURIComponent(value.requestId)+'&limit=1');
    if(prior.length){
      const same=prior[0].followup_id===value.id&&prior[0].exception_key===value.category&&prior[0].note_text===value.text;
      if(!same)return reply({ok:false,error:'Request ID has already been used for a different review.'},409);
      return reply({ok:true,replayed:true,note_id:prior[0].id,recorded_at:prior[0].recorded_at,
        private_supervisor_only:true,customer_message_sent:false,booking_changed:false});
    }
    const followup=(await rows(env,'customer_worksite_followups_v814?select=id,workflow_revision&id=eq.'+
      encodeURIComponent(value.id)+'&limit=1'))[0];
    if(!followup)return reply({ok:false,error:'Follow-up not found.'},404);
    if(followup.workflow_revision!==value.revision)return reply({ok:false,error:'Follow-up revision changed. Refresh before recording a note.'},409);
    const payload={followup_id:value.id,request_id:value.requestId,actor_staff_user_id:access.actor.id,
      exception_key:value.category,note_text:value.text,followup_revision:value.revision};
    const response=await fetch(env.SUPABASE_URL+'/rest/v1/'+TABLE+'?select='+SELECT,{
      method:'POST',headers:{...serviceHeaders(env),Prefer:'return=representation'},body:JSON.stringify([payload])});
    if(!response.ok)return reply({ok:false,error:'Private review note could not be committed. Refresh and verify before retrying.'},503);
    const saved=await response.json().catch(()=>[]);
    if(!Array.isArray(saved)||saved.length!==1||saved[0].actor_staff_user_id!==access.actor.id)
      return reply({ok:false,error:'Private handoff could not be independently confirmed.'},503);
    return reply({ok:true,note_id:saved[0].id,recorded_at:saved[0].recorded_at,private_supervisor_only:true,
      customer_message_sent:false,booking_changed:false},201);
  }catch(e){return reply({ok:false,error:e instanceof SyntaxError?'Invalid JSON.':'Private source unavailable; no review note was confirmed.'},e instanceof SyntaxError?400:503);}
}
