import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {onRequestPost as prior757} from './economic_history_preflight_v757.js';
import {auditPlanHash758,readIndependentRetention758,verifyIndependentRetention758,
  verifyOwnerAuditMigrationReview758,reconcileClosure758} from '../_lib/economic-retention-review-v758.js';

const fail=(error,status=400)=>json({ok:false,build:758,error,closure_reconciliation_status:'HOLD_CLOSURE_AUTHORIZATION',
  immutable_retention_verified:false,audit_migration_authorized:false,audit_migration_executed:false,
  owner_closure_audit_persisted:false,closure_allowed:false,automatic_business_write:false},status);
async function guard(request,env){
  const result=await requireStaffAccess({request,env,capability:'manage_staff',allowLegacyAdminFallback:false});
  if(!result.ok)return result.response;
  return result.auth_mode==='session'?null:fail('Signed-in owner finance review is required.',403);
}
export async function onRequestGet({request,env}){
  const denied=await guard(request,env);if(denied)return denied;
  return json({ok:true,build:758,read_only:true,provider_configured:!!env?.ROSIE_ECONOMIC_RETENTION_VERIFY_BASE_URL,
    audit_plan_sha256:await auditPlanHash758(),owner_migration_review_only:true,
    audit_migration_executed:false,immutable_retention_verified:false,closure_allowed:false,
    closure_reconciliation_status:'HOLD_CLOSURE_AUTHORIZATION'});
}
export async function onRequestPost({request,env,context}){
  const denied=await guard(request,env);if(denied)return denied;
  if(request.headers.get('origin')!==new URL(request.url).origin)return fail('Same-origin signed-in review required.',403);
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))return fail('Submit JSON only.',415);
  if(Number(request.headers.get('content-length')||0)>42000)return fail('Evidence exceeds 42 KB.',413);
  let body;
  try{const raw=await request.text();if(raw.length>42000)throw Error('large');body=JSON.parse(raw);}
  catch{return fail('Submit valid JSON under 42 KB.');}
  if(!body?.owner_migration_review||!body?.source_record||!body?.history_manifest)
    return fail('Source documents, custodian history and separately signed migration review are required.');
  const priorBody={period:body.period,booking_id:body.booking_id,source_record:body.source_record,
    source_attestation:body.source_attestation,owner_receipt:body.owner_receipt,
    history_manifest:body.history_manifest};
  const url=new URL('/api/admin/economic_history_preflight_v757',request.url);
  const upstream=new Request(url,{method:'POST',headers:{cookie:request.headers.get('cookie')||'',
    origin:url.origin,'content-type':'application/json'},body:JSON.stringify(priorBody)});
  const response=await prior757({request:upstream,env,context});
  if(!response.ok)return fail('Authenticated Build 757 source history preflight is unavailable.',503);
  let prior;
  try{prior=await response.json();}catch{return fail('Build 757 response was invalid.',503);}
  if(!prior?.ok)return fail('Source history preflight failed safely.',503);
  let retention=null,migration=null;
  const head=prior.history_verification?.history_head_sha256;
  if(prior.history_verification?.history_chain_integrity_verified&&
    prior.history_verification?.independent_history_head_signature_verified&&head){
    const provider=await readIndependentRetention758(env,body.source_record,head);
    retention=await verifyIndependentRetention758({env,record:body.source_record,head,provider});
    if(retention.independent_provider_receipt_authenticated)
      migration=await verifyOwnerAuditMigrationReview758({envelope:body.owner_migration_review,env,
        record:body.source_record,history_head:head,retention});
  }
  return json(await reconcileClosure758({prior,retention,migration}));
}
const readonly=()=>fail('Build 758 has no audit-migration, retention, payment or business-closure write endpoint.',405);
export async function onRequestPut(){return readonly();}
export async function onRequestPatch(){return readonly();}
export async function onRequestDelete(){return readonly();}
export async function onRequestOptions(){return new Response('',{status:204,headers:{Allow:'GET,POST,OPTIONS','Cache-Control':'no-store'}});}
