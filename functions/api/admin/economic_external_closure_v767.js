import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {reviewSignedFinal766} from './economic_final_disposition_v766.js';
import {readReceipt767,verifyExecution767,verifyInspection767,reconcile767}
  from '../_lib/economic-external-closure-v767.js';

const fail=(error,status=400)=>json({ok:false,build:767,error,
  post_closure_review_status:'HOLD_EXTERNAL_CLOSURE_OUTCOME_OR_STATE_READBACK',
  external_closure_executed_or_verified_by_app:false,production_db_connected_by_app:false,
  owner_acceptance_recorded_by_app:false,closure_allowed:false,automatic_business_write:false},status);
async function guard(request,env){
  const auth=await requireStaffAccess({request,env,capability:'manage_staff',
    allowLegacyAdminFallback:false});
  if(!auth.ok)return auth.response;
  return auth.auth_mode==='session'?null:fail('Signed-in owner session required.',403);
}
export async function onRequestGet({request,env}){
  const denied=await guard(request,env);if(denied)return denied;
  return json({ok:true,build:767,read_only:true,
    provider_configuration:{
      independent_operator_witness:!!env?.ROSIE_ECONOMIC_EXTERNAL_CLOSURE_OPERATOR_WITNESS_BASE_URL,
      independent_post_closure_inspector:!!env?.ROSIE_ECONOMIC_INDEPENDENT_POST_CLOSURE_INSPECTOR_BASE_URL
    },post_closure_review_status:'HOLD_EXTERNAL_CLOSURE_OUTCOME_OR_STATE_READBACK',
    closure_allowed:false,production_db_connected_by_app:false});
}
export async function onRequestPost({request,env}){
  const denied=await guard(request,env);if(denied)return denied;
  if(request.headers.get('origin')!==new URL(request.url).origin)
    return fail('Same-origin owner review only.',403);
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))
    return fail('JSON required.',415);
  if(Number(request.headers.get('content-length')||0)>48000)
    return fail('Evidence exceeds 48 KB.',413);
  let body;
  try{const raw=await request.text();if(raw.length>48000)throw Error('large');body=JSON.parse(raw);}
  catch{return fail('Submit valid JSON under 48 KB.');}
  const ids=['booking_id','source_record_id','change_ticket_id','execution_request_id'];
  if(!body||typeof body!=='object'||Array.isArray(body)||
    ids.some(k=>typeof body[k]!=='string')||
    !body.owner_postchange_decision||!body.owner_closure_readiness_decision||
    !body.owner_explicit_closure_authorization)
    return fail('Four exact identifiers and three original owner signed decisions required.');
  const record=Object.fromEntries(ids.map(k=>[k,body[k]]));
  return json((await reviewSignedExternal767({env,record,
    owner_postchange_decision:body.owner_postchange_decision,
    owner_closure_readiness_decision:body.owner_closure_readiness_decision,
    owner_explicit_closure_authorization:body.owner_explicit_closure_authorization})).summary);
}
// Internal chained verification. Callers must independently authorize the session,
// enforce same-origin and bound JSON before using this server-side readback.
export async function reviewSignedExternal767({env,record,owner_postchange_decision,
  owner_closure_readiness_decision,owner_explicit_closure_authorization}={}){
  // Directly reuse Build 766's independent validator with freshly fetched sources.
  // No caller-supplied Build 766 summary or unsigned packet is trusted.
  const chain=await reviewSignedFinal766({env,record,
    owner_postchange_decision,owner_closure_readiness_decision,
    owner_explicit_closure_authorization});
  const prior={...chain.summary,verified_scope:{
    trial_id:chain.prior.archive?.trial_id||null,
    production_project_ref:chain.prior.archive?.production_project_ref||null,
    db_inspection_receipt_sha256:chain.prior.db?.receipt_sha256||null,
    audit_inspection_receipt_sha256:chain.prior.audit?.receipt_sha256||null
  }};
  let execution=null,inspection=null;
  if(prior.final_disposition_status==='READY_FOR_SEPARATE_CONTROLLED_EXTERNAL_CLOSURE_HANDOFF'){
    execution=await verifyExecution767({env,record,prior,
      readback:await readReceipt767(env,'execution',record,prior)});
    if(execution.signature_authenticated)
      inspection=await verifyInspection767({env,record,prior,execution,
        readback:await readReceipt767(env,'inspection',record,prior,execution)});
  }
  return {chain,prior,execution,inspection,
    summary:await reconcile767({prior,execution,inspection})};
}
const readonly=()=>fail('Read-only independent source review only. No SQL, closure, source ledger writes, rollback or notification action.',405);
export async function onRequestPut(){return readonly();}
export async function onRequestPatch(){return readonly();}
export async function onRequestDelete(){return readonly();}
export async function onRequestOptions(){return new Response('',{status:204,
  headers:{Allow:'GET,POST,OPTIONS','Cache-Control':'no-store'}});}
