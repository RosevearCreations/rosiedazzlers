import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {onRequestPost as prior762} from './economic_change_control_v762.js';
import {readAuthorization763,verifyApproval763,verifyOwnerProduction763,
  verifyOperatorGate763,verifyRollbackReady763,reconcileAuthorization763}
  from '../_lib/economic-production-authorization-v763.js';

const fail=(error,status=400)=>json({ok:false,build:763,error,
  authorization_status:'HOLD_PRODUCTION_OPERATOR_AUTHORIZATION_GATE',
  production_execution_authorized:false,production_migration_executed:false,
  rollback_executed_by_app:false,closure_allowed:false,automatic_business_write:false},status);
async function guard(request,env){
  const auth=await requireStaffAccess({request,env,capability:'manage_staff',allowLegacyAdminFallback:false});
  if(!auth.ok)return auth.response;
  return auth.auth_mode==='session'?null:fail('Signed-in owner session required.',403);
}
export async function onRequestGet({request,env}){
  const denied=await guard(request,env);if(denied)return denied;
  const providers=['DBA_AUTH','SECURITY_AUTH','OPERATOR_GATE','ROLLBACK_READY'].map(name=>
    [name,!!env?.[`ROSIE_ECONOMIC_PRODUCTION_${name}_BASE_URL`]]);
  return json({ok:true,build:763,read_only:true,
    provider_configuration:Object.fromEntries(providers),
    authorization_status:'HOLD_PRODUCTION_OPERATOR_AUTHORIZATION_GATE',
    production_execution_authorized:false,production_migration_executed:false,
    rollback_executed_by_app:false,closure_allowed:false});
}
export async function onRequestPost({request,env,context}){
  const denied=await guard(request,env);if(denied)return denied;
  if(request.headers.get('origin')!==new URL(request.url).origin)return fail('Same-origin private review only.',403);
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))return fail('JSON required.',415);
  if(Number(request.headers.get('content-length')||0)>100000)return fail('Evidence exceeds 100 KB.',413);
  let body;
  try{const raw=await request.text();if(raw.length>100000)throw Error('large');body=JSON.parse(raw);}
  catch{return fail('Submit valid JSON under 100 KB.');}
  const required=['source_record','source_attestation','owner_receipt','history_manifest',
    'owner_migration_review','dba_review','security_review','owner_trial_handoff',
    'owner_trial_signoff','owner_production_decision'];
  if(!body||typeof body!=='object'||Array.isArray(body)||required.some(k=>!body[k]))
    return fail('All nine Build 762 documents and a new signed owner production decision are required.');

  // Re-evaluate Build 762, which re-evaluates the entire independent Build 761 chain.
  // Never accept client-supplied upstream readiness, SQL, credentials or authorization results.
  const upstreamUrl=new URL('/api/admin/economic_change_control_v762',request.url);
  const {owner_production_decision:ownerEnvelope,...earlier}=body;
  const upstream=new Request(upstreamUrl,{method:'POST',
    headers:{cookie:request.headers.get('cookie')||'',origin:upstreamUrl.origin,
      'content-type':'application/json'},body:JSON.stringify(earlier)});
  const response=await prior762({request:upstream,env,context});
  if(!response.ok)return fail('Authenticated Build 762 signed preflight unavailable.',503);
  let prior;
  try{prior=await response.json();}catch{return fail('Build 762 response invalid.',503);}
  if(!prior?.ok)return fail('Earlier signed evidence failed closed.',503);

  let dba=null,security=null,owner=null,operator=null,rollback=null;
  if(prior.change_control_status==='READY_FOR_SEPARATE_PRODUCTION_CHANGE_AUTHORIZATION'){
    // Both independent reviews originate from fixed server-owned HTTPS endpoints.
    const [dbaRead,securityRead]=await Promise.all([
      readAuthorization763(env,'dba',body.source_record,prior),
      readAuthorization763(env,'security',body.source_record,prior)]);
    [dba,security]=await Promise.all([
      verifyApproval763({env,role:'dba',record:body.source_record,prior,readback:dbaRead}),
      verifyApproval763({env,role:'security',record:body.source_record,prior,readback:securityRead})]);
    if(dba.signature_authenticated&&security.signature_authenticated){
      owner=await verifyOwnerProduction763({env,record:body.source_record,prior,dba,security,
        envelope:ownerEnvelope});
      if(dba.approved&&security.approved&&owner?.clean_authorization){
        const operatorRead=await readAuthorization763(env,'operator',body.source_record,prior,
          {dba,security},owner);
        operator=await verifyOperatorGate763({env,record:body.source_record,prior,dba,security,owner,
          readback:operatorRead});
        if(operator.ready_claim){
          const rollbackRead=await readAuthorization763(env,'rollback',body.source_record,prior,
            {dba,security},owner,operator);
          rollback=await verifyRollbackReady763({env,record:body.source_record,prior,owner,operator,
            readback:rollbackRead});
        }
      }
    }
  }
  return json(await reconcileAuthorization763({prior,dba,security,owner,operator,rollback}));
}
const readonly=()=>fail('Build 763 verifies external claims only. No production SQL, rollback, credential, dispatch or closure operation exists.',405);
export async function onRequestPut(){return readonly();}
export async function onRequestPatch(){return readonly();}
export async function onRequestDelete(){return readonly();}
export async function onRequestOptions(){return new Response('',{
  status:204,headers:{Allow:'GET,POST,OPTIONS','Cache-Control':'no-store'}});}
