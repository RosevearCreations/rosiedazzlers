// Build 849 local source-owned read-only projection. No external Master grant.
import {onRequestGet as prior} from './master_social_intelligence_v848.js';
import {MASTER_CONTRACT_849} from '../_lib/jobday-integrity-849.js';
const deny=()=>new Response(JSON.stringify({ok:false,error:'Private source-only, read-only preview.'}),{status:405,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export const onRequestOptions=deny;
export const onRequestPost=deny;
export const onRequestPut=deny;
export const onRequestDelete=deny;
export const onRequestPatch=deny;
export async function onRequestGet(ctx){
  const response=await prior(ctx);if(!response.ok)return response;
  const body=await response.json();
  return new Response(JSON.stringify({ok:true,build:849,projection:{...body.projection,contract:MASTER_CONTRACT_849},authority:{...body.authority,multi_episode_linkage_review:true,priority_counts_source_only:true,independent_master_runtime_ack_preflight:'HOLD_UNTIL_SIGNED',runtime_consumer_ack:false,approved_cross_app_consumer:false,master_connection:'HOLD'}}),{status:200,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex,nofollow','Referrer-Policy':'no-referrer','Access-Control-Allow-Origin':'none'}});
}
