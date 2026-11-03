import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {onRequestPost as prior761} from './economic_trial_execution_v761.js';
import {readReview762,verifyRollbackDisposition762,verifyOwnerSignoff762,
  verifyChangeControl762,reconcileChangeControl762} from '../_lib/economic-change-control-v762.js';

const fail=(error,status=400)=>json({ok:false,build:762,error,
  change_control_status:'HOLD_PRODUCTION_CHANGE_CONTROL_PREFLIGHT',
  production_execution_authorized:false,production_migration_executed:false,
  rollback_executed_by_app:false,closure_allowed:false,automatic_business_write:false},status);
async function guard(request,env){
  const auth=await requireStaffAccess({request,env,capability:'manage_staff',allowLegacyAdminFallback:false});
  if(!auth.ok)return auth.response;
  return auth.auth_mode==='session'?null:fail('Signed-in owner access required.',403);
}
export async function onRequestGet({request,env}){
  const denied=await guard(request,env);if(denied)return denied;
  return json({ok:true,build:762,read_only:true,
    rollback_review_provider_configured:!!env?.ROSIE_ECONOMIC_ROLLBACK_EXCEPTION_BASE_URL,
    change_control_provider_configured:!!env?.ROSIE_ECONOMIC_CHANGE_CONTROL_BASE_URL,
    change_control_status:'HOLD_PRODUCTION_CHANGE_CONTROL_PREFLIGHT',
    production_execution_authorized:false,production_migration_executed:false,
    closure_allowed:false});
}
export async function onRequestPost({request,env,context}){
  const denied=await guard(request,env);if(denied)return denied;
  if(request.headers.get('origin')!==new URL(request.url).origin)return fail('Same-origin private review only.',403);
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))return fail('JSON required.',415);
  if(Number(request.headers.get('content-length')||0)>84000)return fail('Evidence exceeds 84 KB.',413);
  let body;
  try{const raw=await request.text();if(raw.length>84000)throw Error('large');body=JSON.parse(raw);}
  catch{return fail('Submit valid JSON under 84 KB.');}
  if(!body?.source_record||!body?.source_attestation||!body?.owner_receipt||
    !body?.history_manifest||!body?.owner_migration_review||!body?.dba_review||
    !body?.security_review||!body?.owner_trial_handoff||!body?.owner_trial_signoff)
    return fail('All eight original documents and a separately signed owner trial decision are required.');

  // Re-evaluate the entire signed Build 761 chain. Never trust a browser-supplied review packet.
  const upstreamUrl=new URL('/api/admin/economic_trial_execution_v761',request.url);
  const {owner_trial_signoff:signoff,...earlier}=body;
  const upstream=new Request(upstreamUrl,{method:'POST',
    headers:{cookie:request.headers.get('cookie')||'',origin:upstreamUrl.origin,
      'content-type':'application/json'},body:JSON.stringify(earlier)});
  const response=await prior761({request:upstream,env,context});
  if(!response.ok)return fail('Authenticated Build 761 evidence review unavailable.',503);
  let prior;try{prior=await response.json();}catch{return fail('Build 761 review invalid.',503);}
  if(!prior?.ok)return fail('Earlier evidence failed closed.',503);
  let rollback=null,owner=null,change=null;
  if(prior.external_execution_claim_authenticated&&prior.external_reconciliation_claim_authenticated){
    const external=await readReview762(env,'rollback',body.source_record,prior);
    rollback=await verifyRollbackDisposition762({env,record:body.source_record,prior,readback:external});
    if(rollback.signature_authenticated){
      owner=await verifyOwnerSignoff762({env,record:body.source_record,prior,rollback,envelope:signoff});
      if(owner.signature_authenticated&&owner.clean_acceptance){
        const changeReadback=await readReview762(env,'change',body.source_record,prior,rollback,owner);
        change=await verifyChangeControl762({env,record:body.source_record,prior,rollback,owner,readback:changeReadback});
      }
    }
  }
  return json(await reconcileChangeControl762({prior,rollback,owner,change}));
}
const readonly=()=>fail('Build 762 is review only; production SQL, rollback, grants, notifications and business closure are not available.',405);
export async function onRequestPut(){return readonly();}
export async function onRequestPatch(){return readonly();}
export async function onRequestDelete(){return readonly();}
export async function onRequestOptions(){return new Response('',{
  status:204,headers:{Allow:'GET,POST,OPTIONS','Cache-Control':'no-store'}});}
