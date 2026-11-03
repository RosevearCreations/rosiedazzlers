import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {reviewSignedExternal767} from './economic_external_closure_v767.js';
import {verifyOwner768,readReceipt768,verifyCustody768,verifyReopen768,reconcile768}
  from '../_lib/economic-owner-acceptance-v768.js';

const fail=(error,status=400)=>json({ok:false,build:768,error,
  owner_acceptance_status:'HOLD_ORIGINAL_CUSTODY_OWNER_DECISION_OR_REOPEN_EXCEPTION',
  owner_acceptance_recorded_by_app:false,external_case_reopened_by_app:false,
  production_db_connected_by_app:false,automatic_business_write:false,
  closure_allowed:false},status);
async function guard(request,env){
  const auth=await requireStaffAccess({request,env,capability:'manage_staff',
    allowLegacyAdminFallback:false});
  if(!auth.ok)return auth.response;
  return auth.auth_mode==='session'?null:fail('Signed-in owner session required.',403);
}
export async function onRequestGet({request,env}){
  const denied=await guard(request,env);if(denied)return denied;
  return json({ok:true,build:768,read_only:true,
    provider_configuration:{
      independent_original_source_custodian:
        !!env?.ROSIE_ECONOMIC_ORIGINAL_SOURCE_CUSTODY_RECONCILER_BASE_URL,
      independent_exception_reopen_reviewer:
        !!env?.ROSIE_ECONOMIC_EXCEPTION_REOPEN_REVIEWER_BASE_URL
    },owner_acceptance_status:'HOLD_ORIGINAL_CUSTODY_OWNER_DECISION_OR_REOPEN_EXCEPTION',
    owner_acceptance_recorded_by_app:false,closure_allowed:false});
}
export async function onRequestPost({request,env}){
  const denied=await guard(request,env);if(denied)return denied;
  if(request.headers.get('origin')!==new URL(request.url).origin)
    return fail('Same-origin owner review only.',403);
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))
    return fail('JSON required.',415);
  if(Number(request.headers.get('content-length')||0)>64000)
    return fail('Evidence exceeds 64 KB.',413);
  let body;
  try{const raw=await request.text();if(raw.length>64000)throw Error('large');body=JSON.parse(raw);}
  catch{return fail('Submit valid signed JSON under 64 KB.');}
  const ids=['booking_id','source_record_id','change_ticket_id','execution_request_id'];
  if(!body||typeof body!=='object'||Array.isArray(body)||
    ids.some(k=>typeof body[k]!=='string')||
    !body.owner_postchange_decision||!body.owner_closure_readiness_decision||
    !body.owner_explicit_closure_authorization||!body.owner_postclosure_acceptance_decision)
    return fail('Exact scope and four original owner-signed envelopes are required.');
  const record=Object.fromEntries(ids.map(k=>[k,body[k]]));
  // Never trust browser-supplied Build 767 packets or external custody results.
  // Re-fetch all historical source claims and verify four owner signatures.
  const chain=await reviewSignedExternal767({env,record,
    owner_postchange_decision:body.owner_postchange_decision,
    owner_closure_readiness_decision:body.owner_closure_readiness_decision,
    owner_explicit_closure_authorization:body.owner_explicit_closure_authorization});
  const prior={...chain.summary,verified_scope:{
    trial_id:chain.prior.verified_scope.trial_id,
    production_project_ref:chain.prior.verified_scope.production_project_ref,
    db_inspection_receipt_sha256:chain.prior.verified_scope.db_inspection_receipt_sha256,
    audit_inspection_receipt_sha256:chain.prior.verified_scope.audit_inspection_receipt_sha256
  }};
  let owner=null,custody=null,reopen=null;
  if(prior.post_closure_review_status==='READY_FOR_SEPARATE_OWNER_FINAL_ACCEPTANCE_REVIEW'){
    owner=await verifyOwner768({env,record,prior,
      envelope:body.owner_postclosure_acceptance_decision});
    if(owner.signature_authenticated){
      custody=await verifyCustody768({env,record,prior,owner,
        readback:await readReceipt768(env,'custody',record,prior,owner)});
      if(custody.signature_authenticated)
        reopen=await verifyReopen768({env,record,prior,owner,custody,
          readback:await readReceipt768(env,'reopen',record,prior,owner,custody)});
    }
  }
  return json(await reconcile768({prior,owner,custody,reopen}));
}
const readonly=()=>fail('Build 768 only reviews independent signed evidence. No SQL, source writes, acceptance, reopen, closure or notification API.',405);
export async function onRequestPut(){return readonly();}
export async function onRequestPatch(){return readonly();}
export async function onRequestDelete(){return readonly();}
export async function onRequestOptions(){return new Response('',{status:204,
  headers:{Allow:'GET,POST,OPTIONS','Cache-Control':'no-store'}});}
