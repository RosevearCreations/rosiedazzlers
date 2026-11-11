// Build 847: supervisor-only local source projection. No Master reader,
// externally trusted signer, permission grant, event or consumer ACK exists.
import {onRequestGet as source846} from './master_social_intelligence_v846.js';
import {MASTER_CONTRACT_847} from '../_lib/jobday-pilot-847.js';

export const onRequestOptions=()=>new Response(JSON.stringify({ok:false,error:'Private source-only read.'}),{status:405,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export async function onRequestGet(ctx){
  const source=await source846(ctx);
  if(!source.ok)return source;
  const safe=await source.json();
  return new Response(JSON.stringify({ok:true,build:847,projection:{...safe.projection,contract:MASTER_CONTRACT_847},authority:{...safe.authority,post_closure_provider_conflicts_reopen_source_counts:true,independent_master_contract_decision:'HOLD_UNTIL_VERIFIED',master_signer_enrollment:'HOLD',master_runtime_ack:'HOLD',approved_cross_app_consumer:false}}),{status:200,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex,nofollow','Access-Control-Allow-Origin':'none'}});
}
export const onRequestPost=onRequestOptions;
export const onRequestPut=onRequestOptions;
export const onRequestDelete=onRequestOptions;
