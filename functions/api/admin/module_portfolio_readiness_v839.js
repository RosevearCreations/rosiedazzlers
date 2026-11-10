import {hasActionAccess} from '../_lib/action-permissions.js';
import {staffAccess811} from './worksite_issue_review_v811.js';
import {basePortfolio839} from '../../../assets/build839-portfolio-readiness.mjs';

const answer=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{
  'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store',
  'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',
  'X-Robots-Tag':'noindex,nofollow','Access-Control-Allow-Origin':'none'}});
const readonly=()=>answer({ok:false,error:'Portfolio review is read-only.'},405);
export const onRequestOptions=readonly;
export const onRequestPost=readonly;
export const onRequestPut=readonly;
export const onRequestPatch=readonly;
export const onRequestDelete=readonly;

export async function onRequestGet({request,env}){
  const access=await staffAccess811(request,env);
  if(!access.ok)return access.response;
  if(String(access.actor?.role_code||'').toLowerCase()!=='admin'||
     !hasActionAccess(access.actor,'operations.assignment.manage')||
     !hasActionAccess(access.actor,'it.runtime.view'))
    return answer({ok:false,error:'Administrator operations and I.T. review permission required.'},403);
  try{return answer({ok:true,report:basePortfolio839({
    generatedAt:new Date().toISOString(),signedStaffSession:true,
    runtimeRevision:env?.CF_PAGES_COMMIT_SHA,branch:env?.CF_PAGES_BRANCH}),
  authority:{signedStaffSession:true,otherSourceReads:0,databaseWrites:0,
    originalOwnerSignerInvoked:false,masterConsumerInvoked:false}});
  }catch{return answer({ok:false,error:'Portfolio scope unavailable; HOLD.'},503);}
}
