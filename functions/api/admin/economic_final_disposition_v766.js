import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {reviewSignedClosureReadiness765} from './economic_database_closure_v765.js';
import {verifyOwnerAuthorization766,readReceipt766,verifyLedger766,
  verifyDisposition766,reconcileFinal766}
  from '../_lib/economic-final-disposition-v766.js';

const fail=(error,status=400)=>json({ok:false,build:766,error,
  final_disposition_status:'HOLD_FINAL_OWNER_AUTHORIZATION_CUSTODY_OR_DISPOSITION',
  immutable_ledger_verified_by_app:false,production_db_connected_by_app:false,
  external_closure_executed_or_verified_by_app:false,closure_allowed:false,
  automatic_business_write:false},status);
async function guard(request,env){
  const auth=await requireStaffAccess({request,env,capability:'manage_staff',allowLegacyAdminFallback:false});
  if(!auth.ok)return auth.response;
  return auth.auth_mode==='session'?null:fail('Signed-in owner session required.',403);
}
export async function onRequestGet({request,env}){
  const denied=await guard(request,env);if(denied)return denied;
  return json({ok:true,build:766,read_only:true,
    provider_configuration:{
      independent_closure_decision_custodian:!!env?.ROSIE_ECONOMIC_CLOSURE_DECISION_CUSTODIAN_BASE_URL,
      independent_final_exception_reviewer:
        !!env?.ROSIE_ECONOMIC_FINAL_EXCEPTION_DISPOSITION_REVIEWER_BASE_URL
    },
    final_disposition_status:'HOLD_FINAL_OWNER_AUTHORIZATION_CUSTODY_OR_DISPOSITION',
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
    return fail('Four exact identifiers and three authentic owner-signed decisions required.');
  const record=Object.fromEntries(ids.map(k=>[k,body[k]]));
  return json((await reviewSignedFinal766({env,record,
    owner_postchange_decision:body.owner_postchange_decision,
    owner_closure_readiness_decision:body.owner_closure_readiness_decision,
    owner_explicit_closure_authorization:body.owner_explicit_closure_authorization})).summary);
}
// Reusable only after each caller performs its own session, origin and body checks.
// Each invocation re-fetches the original independently signed outside-source chain.
export async function reviewSignedFinal766({env,record,owner_postchange_decision,
  owner_closure_readiness_decision,owner_explicit_closure_authorization,now=Date.now()}={}){
  const prior=await reviewSignedClosureReadiness765({env,record,
    owner_postchange_decision,owner_closure_readiness_decision,now});
  const owner=await verifyOwnerAuthorization766({env,record,prior,
    envelope:owner_explicit_closure_authorization,now});
  let ledger=null,disposition=null;
  if(owner.signature_authenticated){
    ledger=await verifyLedger766({env,record,prior,owner,
      readback:await readReceipt766(env,'ledger',record,prior,owner),now});
    if(ledger.signature_authenticated)
      disposition=await verifyDisposition766({env,record,prior,owner,ledger,
        readback:await readReceipt766(env,'disposition',record,prior,owner,ledger),now});
  }
  return {prior,owner,ledger,disposition,
    summary:await reconcileFinal766({prior,owner,ledger,disposition})};
}
const readonly=()=>fail('Build 766 only checks external owner and independent custody/disposition claims. No SQL, ledger write, closure or notification endpoint exists.',405);
export async function onRequestPut(){return readonly();}
export async function onRequestPatch(){return readonly();}
export async function onRequestDelete(){return readonly();}
export async function onRequestOptions(){return new Response('',{status:204,
  headers:{Allow:'GET,POST,OPTIONS','Cache-Control':'no-store'}});}
