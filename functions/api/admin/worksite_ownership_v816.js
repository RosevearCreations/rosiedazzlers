// Build 816: private, revision-checked supervisor ownership and priority inbox.
import { serviceHeaders } from '../_lib/staff-auth.js';
import { hasActionAccess } from '../_lib/action-permissions.js';
import { staffAccess811 } from './worksite_issue_review_v811.js';
import { eligibleAssignees812 } from './worksite_assignment_v812.js';
import { sameOrigin811 } from '../client/worksite_issues_v811.js';
import { followupAging815 } from '../_lib/worksite-followup-aging-v815.js';
const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TABLE='customer_worksite_followup_ownership_v816';
const FIELDS='id,followup_id,owner_staff_user_id,assigned_by_staff_user_id,assigned_at,review_due_at,private_note,updated_at,workflow_revision';
const STAFF='id,full_name,role_code,can_manage_bookings,is_active,permissions_profile';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
const supervisor=actor=>['operations_manager','admin'].includes(String(actor?.role_code||'').toLowerCase())&&hasActionAccess(actor,'operations.assignment.manage');
async function rows(env,path){const r=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,{headers:serviceHeaders(env)});if(!r.ok)throw Error('Ownership source unavailable');const data=await r.json();if(!Array.isArray(data))throw Error('Invalid source');return data;}
export function followupPriority816(row,ownership=null,escalation=null,now=Date.now()){
  if(row?.status!=='awaiting_staff')return {level:7,key:'not_waiting',label:'Not waiting for a staff response'};
  const age=followupAging815(row,now),openEscalation=escalation&&escalation.status!=='cleared';
  if(openEscalation&&!ownership)return {level:0,key:'escalated_unowned',label:'Supervisor escalation without an owner'};
  if(age.band==='overdue'&&!ownership)return {level:1,key:'overdue_unowned',label:'Over 48 hours without an owner'};
  if(age.band==='overdue')return {level:2,key:'overdue_owned',label:'Over 48 hours — owner assigned'};
  if(openEscalation)return {level:3,key:'escalated_owned',label:'Supervisor review — owner assigned'};
  if(age.band==='attention'&&!ownership)return {level:4,key:'attention_unowned',label:'Over 24 hours without an owner'};
  if(age.band==='attention')return {level:5,key:'attention_owned',label:'Over 24 hours — owner assigned'};
  return {level:6,key:'recent',label:'Recent follow-up'};
}
export function validOwnership816(body,now=Date.now()){
  if(!body||typeof body!=='object'||Array.isArray(body))return null;
  const id=typeof body.followup_id==='string'?body.followup_id.trim():'',owner=typeof body.owner_staff_user_id==='string'?body.owner_staff_user_id.trim():'',note=typeof body.private_note==='string'?body.private_note.trim():'';
  if(!UUID.test(id)||!UUID.test(owner)||note.length<12||note.length>600)return null;
  const revision=body.expected_revision;
  if(revision!==null&&(!Number.isSafeInteger(revision)||revision<0||revision>2147483645))return null;
  if(revision===undefined)return null;
  let dueAt=null;
  if(body.review_due_at!==null&&body.review_due_at!==undefined&&body.review_due_at!==''){
    if(typeof body.review_due_at!=='string'||!/\d{4}-\d{2}-\d{2}T/.test(body.review_due_at))return null;
    const date=Date.parse(body.review_due_at);
    if(!Number.isFinite(date)||date<=now||date>now+30*86400000)return null;
    dueAt=new Date(date).toISOString();
  }
  return {id,owner,note,revision,dueAt};
}
export const onRequestOptions=()=>json({ok:false,error:'Method not allowed.'},405);
export async function onRequestGet({request,env}){
  const access=await staffAccess811(request,env);if(!access.ok)return access.response;
  try{
    const [ownership,staff]=await Promise.all([rows(env,`${TABLE}?select=${FIELDS}&order=assigned_at.desc&limit=150`),rows(env,`staff_users?select=${STAFF}&is_active=eq.true&limit=100`)]);
    const ids=ownership.map(row=>row.id).filter(id=>UUID.test(String(id)));
    const events=ids.length?await rows(env,`customer_worksite_followup_ownership_events_v816?select=ownership_id,ownership_revision,event_kind,recorded_at,actor_staff_user_id,previous_owner_staff_user_id,current_owner_staff_user_id,review_due_at&ownership_id=in.(${ids.join(',')})&order=recorded_at.desc&limit=450`):[];
    return json({ok:true,ownership,events,candidates:eligibleAssignees812(staff),can_assign:supervisor(access.actor),current_staff_user_id:access.actor.id,
      authority:{signed_staff_session:true,internal_review_due_not_sla:true,automatic_outreach:false,booking_changed:false}});
  }catch{return json({ok:false,error:'Supervisor ownership queue unavailable. No assignment was changed.'},503);}
}
export async function onRequestPost({request,env}){
  if(!sameOrigin811(request))return json({ok:false,error:'Assignments must come from this application.'},403);
  if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))return json({ok:false,error:'JSON is required.'},415);
  const access=await staffAccess811(request,env);if(!access.ok)return access.response;
  if(!supervisor(access.actor))return json({ok:false,error:'Supervisor assignment permission is required.'},403);
  try{
    const raw=await request.text();if(raw.length>1500)return json({ok:false,error:'Assignment is too large.'},413);
    const data=validOwnership816(JSON.parse(raw));if(!data)return json({ok:false,error:'Select an authorized owner, enter a private 12–600 character note and a valid optional future review date (within 30 days).'},400);
    const followup=(await rows(env,`customer_worksite_followups_v814?select=id,status,workflow_revision&id=eq.${encodeURIComponent(data.id)}&limit=1`))[0];
    if(!followup)return json({ok:false,error:'Follow-up not found.'},404);
    if(followup.status!=='awaiting_staff')return json({ok:false,error:'This follow-up is no longer waiting for staff. Refresh first.'},409);
    const eligible=eligibleAssignees812(await rows(env,`staff_users?select=${STAFF}&id=eq.${encodeURIComponent(data.owner)}&is_active=eq.true&limit=1`));
    if(!eligible.some(item=>item.id===data.owner))return json({ok:false,error:'Choose an active staff member authorized for customer follow-up review.'},403);
    const prior=(await rows(env,`${TABLE}?select=${FIELDS}&followup_id=eq.${encodeURIComponent(data.id)}&limit=1`))[0];
    if((prior?.workflow_revision??null)!==data.revision)return json({ok:false,error:'This assignment has changed. Refresh before saving.'},409);
    if(prior&&prior.owner_staff_user_id===data.owner&&prior.private_note===data.note&&String(prior.review_due_at||'')===String(data.dueAt||''))return json({ok:false,error:'No ownership change to save.'},409);
    const now=new Date().toISOString();
    const payload={owner_staff_user_id:data.owner,assigned_by_staff_user_id:access.actor.id,private_note:data.note,review_due_at:data.dueAt,assigned_at:now,updated_at:now,
      ...(prior?{workflow_revision:prior.workflow_revision+1}:{followup_id:data.id})};
    const path=prior?`${TABLE}?select=${FIELDS}&id=eq.${encodeURIComponent(prior.id)}&workflow_revision=eq.${prior.workflow_revision}`:`${TABLE}?select=${FIELDS}`;
    const response=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,{method:prior?'PATCH':'POST',headers:{...serviceHeaders(env),Prefer:'return=representation'},body:JSON.stringify(prior?payload:[payload])});
    if(response.status===409)return json({ok:false,error:'Another supervisor recorded ownership. Refresh first.'},409);
    if(!response.ok)return json({ok:false,error:'Ownership save could not be confirmed. Refresh before retrying.'},503);
    const saved=await response.json().catch(()=>[]);if(!Array.isArray(saved)||!saved[0])return json({ok:false,error:'Ownership changed concurrently. Refresh first.'},409);
    return json({ok:true,workflow_revision:saved[0].workflow_revision,owner_staff_user_id:saved[0].owner_staff_user_id,notification_sent:false,booking_changed:false});
  }catch(error){return json({ok:false,error:error instanceof SyntaxError?'Invalid JSON.':'Ownership source unavailable. No save was confirmed.'},error instanceof SyntaxError?400:503);}
}
