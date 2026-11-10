import {hasActionAccess} from '../_lib/action-permissions.js';
import {staffAccess811} from './worksite_issue_review_v811.js';
import {baseHealth838} from '../../../assets/build838-health-reconciliation.mjs';
const answer=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{
  'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store',
  'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',
  'X-Robots-Tag':'noindex,nofollow','Access-Control-Allow-Origin':'none'}});
const readonly=()=>answer({ok:false,error:'Health reconciliation is read-only.'},405);
export const onRequestOptions=readonly;
export const onRequestPost=readonly;
export const onRequestPut=readonly;
export const onRequestPatch=readonly;
export const onRequestDelete=readonly;
export async function onRequestGet({request,env}){
  const access=await staffAccess811(request,env);
  if(!access.ok)return access.response;
  if(!['admin','operations_manager'].includes(String(access.actor?.role_code||'').toLowerCase())||
     !hasActionAccess(access.actor,'operations.assignment.manage')||
     !hasActionAccess(access.actor,'it.runtime.view'))
    return answer({ok:false,error:'Source operations and I.T. review permission required.'},403);
  try{return answer({ok:true,report:baseHealth838({runtimeRevision:env?.CF_PAGES_COMMIT_SHA,
    branch:env?.CF_PAGES_BRANCH,generatedAt:new Date().toISOString(),originalSessionVerified:true}),
    authority:{signedStaffSession:true,sessionLookupObserved:true,otherSourceReads:0,
      databaseWrites:0,customerRecordsReturned:false,remoteProviderCalls:0,
      originalSignerOrMasterInvoked:false}});
  }catch{return answer({ok:false,error:'Source health unavailable; HOLD.'},503);}
}
