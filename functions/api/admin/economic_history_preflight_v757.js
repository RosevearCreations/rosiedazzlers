import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {onRequestPost as review756} from './economic_closure_review_v756.js';
import {readSourceHistory757,verifyHistoryPreflight757,reconcileHistoryAuthorization757} from '../_lib/economic-history-preflight-v757.js';

const fail=(error,status=400)=>json({ok:false,build:757,error,closure_preflight_status:'HOLD_CLOSURE_AUTHORIZATION',
  source_record_custody_verified:false,owner_closure_audit_persisted:false,closure_authorized:false,
  closure_recorded:false,closure_allowed:false,automatic_business_write:false},status);
async function guard(request,env){
  const result=await requireStaffAccess({request,env,capability:'manage_staff',allowLegacyAdminFallback:false});
  if(!result.ok)return result.response;
  return result.auth_mode==='session'?null:fail('A signed-in capability-bound owner reviewer is required.',403);
}
export async function onRequestGet({request,env}){
  const denied=await guard(request,env);if(denied)return denied;
  return json({ok:true,build:757,read_only:true,closure_preflight_status:'HOLD_CLOSURE_AUTHORIZATION',
    source_history_table:'economic_source_revision_history',history_max_revisions:64,
    signed_independent_history_custodian_required:true,immutable_retention_policy_verified:false,
    owner_audit_design_status:'DESIGN_ONLY_NOT_APPLIED',owner_closure_audit_persisted:false,
    closure_allowed:false,automatic_business_write:false});
}
export async function onRequestPost({request,env,context}){
  const denied=await guard(request,env);if(denied)return denied;
  if(request.headers.get('origin')!==new URL(request.url).origin)return fail('Same-origin signed-in review required.',403);
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))return fail('Submit JSON only.',415);
  if(Number(request.headers.get('content-length')||0)>36000)return fail('Evidence exceeds 36 KB.',413);
  let body;
  try{const raw=await request.text();if(raw.length>36000)throw Error('large');body=JSON.parse(raw);}
  catch{return fail('Submit valid evidence JSON under 36 KB.');}
  if(!body||typeof body!=='object'||!body.history_manifest||!body.source_record)return fail('Supply canonical source evidence and independent history-custodian manifest.');
  const priorBody={period:body.period,booking_id:body.booking_id,source_record:body.source_record,
    source_attestation:body.source_attestation,owner_receipt:body.owner_receipt};
  const url=new URL('/api/admin/economic_closure_review_v756',request.url);
  const upstream=new Request(url,{method:'POST',headers:{cookie:request.headers.get('cookie')||'',
    origin:url.origin,'content-type':'application/json'},body:JSON.stringify(priorBody)});
  const response=await review756({request:upstream,env,context});
  if(!response.ok)return fail('Fresh Build 756 evidence and authenticated source readback are unavailable.',503);
  let prior;
  try{prior=await response.json();}catch{return fail('Source review returned invalid evidence.',503);}
  if(!prior?.ok)return fail('Source review failed safely.',503);
  // Only signed, matched current-source reviews may query original source history.
  let history_verification;
  if(prior.source_readback?.source_row_identity_matched&&
    prior.prior_review_status==='MATCHED_SOURCE_DOCUMENT_MANUAL_CLOSURE_HOLD'){
    const history=await readSourceHistory757(env,body.source_record);
    history_verification=await verifyHistoryPreflight757({record:body.source_record,
      manifest:body.history_manifest,history,env});
  }
  const result=await reconcileHistoryAuthorization757({prior_review:prior,history_verification,
    audit_readiness:prior.owner_persistence_readiness});
  return json(result);
}
const readonly=()=>fail('Build 757 is a preflight; no audit writes or closure mutations are authorized.',405);
export async function onRequestPut(){return readonly();}
export async function onRequestPatch(){return readonly();}
export async function onRequestDelete(){return readonly();}
export async function onRequestOptions(){return new Response('',{status:204,headers:{Allow:'GET,POST,OPTIONS','Cache-Control':'no-store'}});}
