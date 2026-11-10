// Build 835: authenticated, read-only Rosie source pilot preparation; no original GET.
import {hasActionAccess} from '../_lib/action-permissions.js';
import {staffAccess811} from './worksite_issue_review_v811.js';
import {masterPilot835} from '../../../assets/build835-master-pilot.mjs';
const answer=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{
  'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store',
  'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',
  'X-Robots-Tag':'noindex,nofollow','Access-Control-Allow-Origin':'none'}});
const denyMutation=()=>answer({ok:false,error:'Owner-only original TEST authorization is not available through this web endpoint.'},405);
export const onRequestOptions=denyMutation;
export const onRequestPost=denyMutation;
export const onRequestPut=denyMutation;
export const onRequestPatch=denyMutation;
export const onRequestDelete=denyMutation;
export async function onRequestGet({request,env}){
  const access=await staffAccess811(request,env);
  if(!access.ok)return access.response;
  if(!['admin','operations_manager'].includes(String(access.actor?.role_code||'').toLowerCase())||
     !hasActionAccess(access.actor,'operations.assignment.manage'))
    return answer({ok:false,error:'Rosie administrator/supervisor permission required.'},403);
  try{return answer({ok:true,report:masterPilot835({
    runtimeRevision:env?.CF_PAGES_COMMIT_SHA,generatedAt:new Date().toISOString()}),
    authority:{sessionVerified:true,originalPrivateOperatorInvoked:false,
      remoteHealthGets:0,masterPublishes:0,extraDatabaseReads:0,databaseWrites:0}});
  }catch{return answer({ok:false,error:'Original source readiness unavailable; HOLD remains.'},503);}
}
