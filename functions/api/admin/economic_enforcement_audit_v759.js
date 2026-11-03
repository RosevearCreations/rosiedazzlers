import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {onRequestPost as prior758} from './economic_retention_review_v758.js';
import {readIndependentEnforcement759,verifyEnforcement759,nonprodEnvironment759,
  verifyTrialApproval759,reconcileReadiness759} from '../_lib/economic-enforcement-audit-v759.js';

const fail=(error,status=400)=>json({ok:false,build:759,error,
  trial_readiness_status:'HOLD_NONPROD_TRIAL_READINESS',
  migration_authorized:false,migration_executed:false,closure_allowed:false,
  automatic_business_write:false},status);
async function guard(request,env){
  const result=await requireStaffAccess({request,env,capability:'manage_staff',allowLegacyAdminFallback:false});
  if(!result.ok)return result.response;
  return result.auth_mode==='session'?null:fail('Signed-in owner session required.',403);
}
export async function onRequestGet({request,env}){
  const denied=await guard(request,env);if(denied)return denied;
  const target=nonprodEnvironment759(env);
  return json({ok:true,build:759,read_only:true,
    independent_storage_audit_origin_configured:!!env?.ROSIE_ECONOMIC_STORAGE_AUDIT_BASE_URL,
    nonprod_target_configured:target.configured,nonprod_target_status:target.status,
    dba_and_security_review_only:true,migration_authorized:false,migration_executed:false,
    closure_allowed:false,trial_readiness_status:'HOLD_NONPROD_TRIAL_READINESS'});
}
export async function onRequestPost({request,env,context}){
  const denied=await guard(request,env);if(denied)return denied;
  if(request.headers.get('origin')!==new URL(request.url).origin)return fail('Same-origin private session required.',403);
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))return fail('JSON required.',415);
  if(Number(request.headers.get('content-length')||0)>60000)return fail('Evidence exceeds 60 KB.',413);
  let body;
  try{const raw=await request.text();if(raw.length>60000)throw Error('large');body=JSON.parse(raw);}
  catch{return fail('Submit valid JSON under 60 KB.');}
  if(!body?.source_record||!body?.history_manifest||!body?.owner_migration_review||
    !body?.dba_review||!body?.security_review)
    return fail('Five evidence stages must be supplied, including a DBA and later security review.');
  const upstreamUrl=new URL('/api/admin/economic_retention_review_v758',request.url);
  const priorPayload={period:body.period,booking_id:body.booking_id,source_record:body.source_record,
    source_attestation:body.source_attestation,owner_receipt:body.owner_receipt,
    history_manifest:body.history_manifest,owner_migration_review:body.owner_migration_review};
  const upstream=new Request(upstreamUrl,{method:'POST',headers:{
    cookie:request.headers.get('cookie')||'',origin:upstreamUrl.origin,'content-type':'application/json'},
    body:JSON.stringify(priorPayload)});
  const response=await prior758({request:upstream,env,context});
  if(!response.ok)return fail('Previous authenticated source and retention preflight is unavailable.',503);
  let prior;try{prior=await response.json();}catch{return fail('Previous preflight response invalid.',503);}
  if(!prior?.ok)return fail('Previous source preflight failed safely.',503);
  const environment=nonprodEnvironment759(env),head=prior.history_head_sha256;
  let enforcement=null,dba=null,security=null;
  if(prior.retention_review?.independent_provider_receipt_authenticated&&
    prior.owner_migration_review?.owner_migration_signature_authenticated&&head){
    const audit=await readIndependentEnforcement759(env,body.source_record,head,
      prior.retention_review.retention_receipt_sha256);
    enforcement=await verifyEnforcement759({env,record:body.source_record,historyHead:head,
      retention:prior.retention_review,readback:audit});
    if(enforcement.independent_storage_audit_authenticated){
      dba=await verifyTrialApproval759({role:'dba',envelope:body.dba_review,env,record:body.source_record,
        historyHead:head,retention:prior.retention_review,enforcement,environment});
      if(dba.signature_authenticated)
        security=await verifyTrialApproval759({role:'security',envelope:body.security_review,env,
          record:body.source_record,historyHead:head,retention:prior.retention_review,
          enforcement,environment,dba});
    }
  }
  return json(await reconcileReadiness759({prior,enforcement,dba,security,environment}));
}
const readonly=()=>fail('No SQL, trial execution, deletion, payment or owner closure endpoint exists in Build 759.',405);
export async function onRequestPut(){return readonly();}
export async function onRequestPatch(){return readonly();}
export async function onRequestDelete(){return readonly();}
export async function onRequestOptions(){return new Response('',{status:204,headers:{Allow:'GET,POST,OPTIONS','Cache-Control':'no-store'}});}
