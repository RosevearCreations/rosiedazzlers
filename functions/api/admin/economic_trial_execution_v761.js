import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {onRequestPost as prior760} from './economic_nonprod_trial_v760.js';
import {readReceipt761,verifyOperator761,verifyOutcome761,reconcileExecution761}
  from '../_lib/economic-trial-execution-v761.js';

const fail=(error,status=400)=>json({ok:false,build:761,error,
  trial_review_status:'HOLD_NONPROD_TRIAL_EVIDENCE',external_execution_claim_authenticated:false,
  trial_executed_by_app:false,migration_executed_by_app:false,rollback_executed_by_app:false,
  closure_allowed:false,automatic_business_write:false},status);
async function guard(request,env){
  const auth=await requireStaffAccess({request,env,capability:'manage_staff',allowLegacyAdminFallback:false});
  if(!auth.ok)return auth.response;
  return auth.auth_mode==='session'?null:fail('Signed-in owner access required.',403);
}
export async function onRequestGet({request,env}){
  const denied=await guard(request,env);if(denied)return denied;
  return json({ok:true,build:761,read_only:true,
    operator_provider_configured:!!env?.ROSIE_ECONOMIC_TRIAL_OPERATOR_BASE_URL,
    reconciler_provider_configured:!!env?.ROSIE_ECONOMIC_TRIAL_RECONCILE_BASE_URL,
    trial_review_status:'HOLD_NONPROD_TRIAL_EVIDENCE',trial_executed_by_app:false,
    migration_executed_by_app:false,rollback_executed_by_app:false,closure_allowed:false});
}
export async function onRequestPost({request,env,context}){
  const denied=await guard(request,env);if(denied)return denied;
  if(request.headers.get('origin')!==new URL(request.url).origin)return fail('Same-origin private review only.',403);
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))return fail('JSON required.',415);
  if(Number(request.headers.get('content-length')||0)>72000)return fail('Evidence exceeds 72 KB.',413);
  let body;
  try{const raw=await request.text();if(raw.length>72000)throw Error('large');body=JSON.parse(raw);}
  catch{return fail('Submit valid JSON under 72 KB.');}
  if(!body?.source_record||!body?.source_attestation||!body?.owner_receipt||
    !body?.history_manifest||!body?.owner_migration_review||!body?.dba_review||
    !body?.security_review||!body?.owner_trial_handoff)
    return fail('Original source, signed witness, owner, trial and security evidence are required.');

  // Re-evaluate Build 760 on every request; never accept a browser-supplied readiness packet.
  const upstreamUrl=new URL('/api/admin/economic_nonprod_trial_v760',request.url);
  const upstream=new Request(upstreamUrl,{method:'POST',
    headers:{cookie:request.headers.get('cookie')||'',origin:upstreamUrl.origin,
      'content-type':'application/json'},body:JSON.stringify(body)});
  const response=await prior760({request:upstream,env,context});
  if(!response.ok)return fail('Authenticated Build 760 chain unavailable.',503);
  let handoff;try{handoff=await response.json();}catch{return fail('Build 760 review invalid.',503);}
  if(!handoff?.ok)return fail('Earlier evidence failed closed.',503);
  let operator=null,outcome=null;
  if(handoff.trial_handoff_status==='SCOPED_NONPROD_OPERATOR_HANDOFF_READY'){
    const readback=await readReceipt761(env,'operator',body.source_record,handoff);
    operator=await verifyOperator761({env,record:body.source_record,handoff,readback});
    if(operator.signature_authenticated){
      const independent=await readReceipt761(env,'outcome',body.source_record,handoff);
      outcome=await verifyOutcome761({env,record:body.source_record,handoff,operator,readback:independent});
    }
  }
  return json(await reconcileExecution761({handoff,operator,outcome}));
}
const readonly=()=>fail('Build 761 only reviews externally signed receipts. No SQL, rollback, notifications, or business closure endpoint.',405);
export async function onRequestPut(){return readonly();}
export async function onRequestPatch(){return readonly();}
export async function onRequestDelete(){return readonly();}
export async function onRequestOptions(){return new Response('',{
  status:204,headers:{Allow:'GET,POST,OPTIONS','Cache-Control':'no-store'}});}
