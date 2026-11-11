// Build 848 private owner-supervisor counts only; no cross-app audience grant.
import {onRequestGet as prior} from './master_social_intelligence_v847.js';
import {MASTER_CONTRACT_848} from '../_lib/jobday-recovery-848.js';
const deny=()=>new Response(JSON.stringify({ok:false,error:'Private source-only read.'}),{status:405,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export const onRequestOptions=deny;
export const onRequestPost=deny;
export const onRequestPut=deny;
export const onRequestDelete=deny;
export async function onRequestGet(ctx){
  const response=await prior(ctx);
  if(!response.ok)return response;
  const data=await response.json();
  return new Response(JSON.stringify({ok:true,build:848,projection:{...data.projection,contract:MASTER_CONTRACT_848},authority:{...data.authority,recovery_reclosure_requires_new_provider_cdn_and_fresh_origin_head:true,independent_master_freshness_receipt:'HOLD_UNTIL_VERIFIED',cross_app_delivery:false,approved_cross_app_consumer:false,master_runtime_ack:'HOLD'}}),{status:200,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex,nofollow','Referrer-Policy':'no-referrer','Access-Control-Allow-Origin':'none'}});
}
