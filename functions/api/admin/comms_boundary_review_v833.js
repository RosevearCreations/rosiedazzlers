// Build 833: original-session operations supervisor, server-only bounded read.
// Does not call Comms, send a message, register routes or change any source row.
import {serviceHeaders} from '../_lib/staff-auth.js';
import {hasActionAccess} from '../_lib/action-permissions.js';
import {staffAccess811} from './worksite_issue_review_v811.js';
import {reviewCommsBoundary833} from '../../../assets/build833-comms-boundary.mjs';

const LIMIT=100;
const QUERIES={
  issues:'customer_worksite_issues_v811?select=id,category,status,submitted_at&order=submitted_at.desc,id.desc&limit=100',
  handoffs:'customer_communication_handoff_audit?select=id,channel,purpose,outcome,recorded_at,staff_report_unverified,provider_delivery_verified,outbound_dispatched&order=recorded_at.desc,id.desc&limit=100'
};
const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{
  'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store',
  'X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex,nofollow',
  'Referrer-Policy':'no-referrer'}});
const allowed=actor=>['admin','operations_manager'].includes(String(actor?.role_code||'').toLowerCase())&&
  hasActionAccess(actor,'operations.assignment.manage');
async function read(env,query){
  const response=await fetch(env.SUPABASE_URL+'/rest/v1/'+query,{method:'GET',
    headers:serviceHeaders(env),redirect:'error'});
  if(!response.ok)throw Error('Source read failed');
  const rows=await response.json();
  if(!Array.isArray(rows)||rows.length>LIMIT)throw Error('Invalid source window');
  return rows;
}
const readonly=()=>respond({ok:false,error:'Read-only source contract review.'},405);
export const onRequestOptions=readonly;
export const onRequestPost=readonly;
export const onRequestPut=readonly;
export const onRequestPatch=readonly;
export const onRequestDelete=readonly;
export async function onRequestGet({request,env}){
  const access=await staffAccess811(request,env);
  if(!access.ok)return access.response;
  if(!allowed(access.actor))return respond({ok:false,error:'Signed Rosie operations supervisor required.'},403);
  try{
    const [issues,handoffs]=await Promise.all([read(env,QUERIES.issues),read(env,QUERIES.handoffs)]);
    const report=reviewCommsBoundary833({issues,handoffs,
      sampledAt:new Date().toISOString(),sourceRevision:env.CF_PAGES_COMMIT_SHA});
    return respond({ok:true,build:833,report,authority:{
      original_staff_session:true,read_only:true,server_only_select:true,
      customer_identity_excluded:true,free_text_excluded:true,
      current_consent_not_inferred:true,comms_api_calls:0,booking_or_issue_mutations:0,
      notifications_sent:0,canonical_hold_changed:false}});
  }catch{return respond({ok:false,error:'Private Comms review source unavailable or inconsistent; no route, consent or connection inferred.'},503);}
}
