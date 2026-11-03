import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {onRequestPost as prior759} from './economic_enforcement_audit_v759.js';
import {nonprodProjectIdentity760,readAuditor760,verifyIsolation760,verifyRollback760,
  verifyOwnerTrial760,reconcileNonprodTrial760} from '../_lib/economic-nonprod-trial-v760.js';

const fail=(error,status=400)=>json({ok:false,build:760,error,
  trial_handoff_status:'HOLD_NONPROD_TRIAL_HANDOFF',trial_execution_authorized:false,
  trial_executed:false,migration_authorized:false,migration_executed:false,
  closure_allowed:false,automatic_business_write:false},status);
async function guard(request,env){
  const auth=await requireStaffAccess({request,env,capability:'manage_staff',allowLegacyAdminFallback:false});
  if(!auth.ok)return auth.response;
  return auth.auth_mode==='session'?null:fail('Signed-in owner access required.',403);
}
export async function onRequestGet({request,env}){
  const denied=await guard(request,env);if(denied)return denied;
  const identity=nonprodProjectIdentity760(env);
  return json({ok:true,build:760,read_only:true,nonprod_target_status:identity.status,
    independent_isolation_provider_configured:!!env?.ROSIE_ECONOMIC_ISOLATION_AUDIT_BASE_URL,
    independent_rollback_provider_configured:!!env?.ROSIE_ECONOMIC_ROLLBACK_VERIFY_BASE_URL,
    trial_handoff_status:'HOLD_NONPROD_TRIAL_HANDOFF',trial_execution_authorized:false,
    trial_executed:false,migration_executed:false,closure_allowed:false});
}
export async function onRequestPost({request,env,context}){
  const denied=await guard(request,env);if(denied)return denied;
  if(request.headers.get('origin')!==new URL(request.url).origin)return fail('Same-origin private review only.',403);
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))return fail('JSON required.',415);
  if(Number(request.headers.get('content-length')||0)>72000)return fail('Review exceeds 72 KB.',413);
  let body;
  try{const raw=await request.text();if(raw.length>72000)throw Error('large');body=JSON.parse(raw);}
  catch{return fail('Submit valid JSON under 72 KB.');}
  if(!body?.source_record||!body?.history_manifest||!body?.owner_migration_review||
    !body?.dba_review||!body?.security_review||!body?.owner_trial_handoff)
    return fail('Source, witness, owner, DBA/security and signed trial-handoff evidence are required.');
  const upstreamUrl=new URL('/api/admin/economic_enforcement_audit_v759',request.url);
  const upstreamBody={period:body.period,booking_id:body.booking_id,
    source_record:body.source_record,source_attestation:body.source_attestation,
    owner_receipt:body.owner_receipt,history_manifest:body.history_manifest,
    owner_migration_review:body.owner_migration_review,
    dba_review:body.dba_review,security_review:body.security_review};
  const upstream=new Request(upstreamUrl,{method:'POST',headers:{cookie:request.headers.get('cookie')||'',
    origin:upstreamUrl.origin,'content-type':'application/json'},body:JSON.stringify(upstreamBody)});
  const response=await prior759({request:upstream,env,context});
  if(!response.ok)return fail('Authenticated prior storage/DBA review is unavailable.',503);
  let prior;try{prior=await response.json();}catch{return fail('Previous review response invalid.',503);}
  if(!prior?.ok)return fail('Prior evidence preflight failed safely.',503);
  const identity=nonprodProjectIdentity760(env),head=prior.history_head_sha256;
  let isolation=null,rollback=null,owner=null;
  if(identity.configured&&prior.independent_review_chain_authenticated&&head){
    const isolationReadback=await readAuditor760(env,'isolation',body.source_record,head,identity);
    isolation=await verifyIsolation760({env,record:body.source_record,head,identity,readback:isolationReadback});
    if(isolation.signature_authenticated){
      const artifacts=body.owner_trial_handoff?.payload;
      const rollbackReadback=await readAuditor760(env,'rollback',body.source_record,head,identity,artifacts);
      rollback=await verifyRollback760({env,record:body.source_record,head,identity,artifacts,readback:rollbackReadback});
      if(rollback.signature_authenticated)
        owner=await verifyOwnerTrial760({env,record:body.source_record,prior,identity,isolation,rollback,
          envelope:body.owner_trial_handoff});
    }
  }
  return json(await reconcileNonprodTrial760({prior,identity,isolation,rollback,owner}));
}
const readonly=()=>fail('Build 760 is read-only. No SQL execution, rollback, storage mutation or business closure endpoint.',405);
export async function onRequestPut(){return readonly();}
export async function onRequestPatch(){return readonly();}
export async function onRequestDelete(){return readonly();}
export async function onRequestOptions(){return new Response('',{status:204,headers:{Allow:'GET,POST,OPTIONS','Cache-Control':'no-store'}});}
