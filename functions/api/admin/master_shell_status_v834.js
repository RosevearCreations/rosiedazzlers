// Build 834: signed-in local operator review only; no external fetch or emit.
import {hasActionAccess} from '../_lib/action-permissions.js';
import {staffAccess811} from './worksite_issue_review_v811.js';
import {masterStatus834} from '../../../assets/build834-master-status.mjs';
const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{
  'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store',
  'X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex,nofollow',
  'Referrer-Policy':'no-referrer','Access-Control-Allow-Origin':'none'}});
const readonly=()=>respond({ok:false,error:'Read-only private master status; no publish or mutation.'},405);
export const onRequestOptions=readonly;
export const onRequestPost=readonly;
export const onRequestPut=readonly;
export const onRequestPatch=readonly;
export const onRequestDelete=readonly;
export async function onRequestGet({request,env}){
  const access=await staffAccess811(request,env);
  if(!access.ok)return access.response;
  if(!['admin','operations_manager'].includes(String(access.actor?.role_code||'').toLowerCase())||
     !hasActionAccess(access.actor,'operations.assignment.manage'))
    return respond({ok:false,error:'Signed Rosie source administrator/supervisor required.'},403);
  try{
    const now=Date.now(),report=masterStatus834({runtimeRevision:env?.CF_PAGES_COMMIT_SHA,
      generatedAt:new Date(now).toISOString(),now});
    return respond({ok:true,build:834,report,authority:{
      original_session:true,local_source_only:true,source_data_reads:0,
      remote_verification_calls:0,master_publishes:0,comms_calls:0,
      database_writes:0,customer_or_device_data_returned:false,
      canonical_hold_changed:false}});
  }catch{return respond({ok:false,error:'Master source status unavailable; no connection or release proof inferred.'},503);}
}
