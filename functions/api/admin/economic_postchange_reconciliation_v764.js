import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {readReceipt764,verifyArchive764,verifyExecution764,verifyStandby764,
  verifyReconciliation764,verifyOwnerPostchange764,reconcilePostchange764}
  from '../_lib/economic-production-outcome-v764.js';

const fail=(error,status=400)=>json({ok:false,build:764,error,
  postchange_status:'HOLD_POSTCHANGE_EXTERNAL_EVIDENCE_RECONCILIATION',
  production_db_state_independently_verified_by_app:false,
  production_migration_executed_by_app:false,rollback_executed_by_app:false,
  closure_allowed:false,automatic_business_write:false},status);
async function guard(request,env){
  const auth=await requireStaffAccess({request,env,capability:'manage_staff',allowLegacyAdminFallback:false});
  if(!auth.ok)return auth.response;
  return auth.auth_mode==='session'?null:fail('Signed-in owner session required.',403);
}
export async function onRequestGet({request,env}){
  const denied=await guard(request,env);if(denied)return denied;
  return json({ok:true,build:764,read_only:true,
    provider_configuration:{
      historical_gate_archive:!!env?.ROSIE_ECONOMIC_PRODUCTION_GATE_ARCHIVIST_BASE_URL,
      external_operator:!!env?.ROSIE_ECONOMIC_PRODUCTION_OPERATOR_GATE_BASE_URL,
      independent_rollback_witness:!!env?.ROSIE_ECONOMIC_PRODUCTION_ROLLBACK_READY_BASE_URL,
      independent_postchange_reconciler:!!env?.ROSIE_ECONOMIC_PRODUCTION_OUTCOME_RECONCILER_BASE_URL
    },
    postchange_status:'HOLD_POSTCHANGE_EXTERNAL_EVIDENCE_RECONCILIATION',
    production_migration_executed_by_app:false,closure_allowed:false});
}
export async function onRequestPost({request,env}){
  const denied=await guard(request,env);if(denied)return denied;
  if(request.headers.get('origin')!==new URL(request.url).origin)return fail('Same-origin owner review only.',403);
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))return fail('JSON required.',415);
  if(Number(request.headers.get('content-length')||0)>32000)return fail('Evidence exceeds 32 KB.',413);
  let body;
  try{const raw=await request.text();if(raw.length>32000)throw Error('large');body=JSON.parse(raw);}
  catch{return fail('Submit valid JSON under 32 KB.');}
  const ids=['booking_id','source_record_id','change_ticket_id','execution_request_id'];
  if(!body||typeof body!=='object'||Array.isArray(body)||!body.owner_postchange_decision||
    ids.some(k=>typeof body[k]!=='string'))return fail('Exact booking, source, ticket, execution request and signed owner decision required.');
  const record=Object.fromEntries(ids.map(k=>[k,body[k]]));
  // Authenticated, fixed-origin independent readbacks only. No historical unsigned
  // Build 763 packet can be supplied by the browser as a trusted execution permit.
  let archive=null,execution=null,standby=null,reconciliation=null,owner=null;
  const historical=await readReceipt764(env,'archive',record);
  archive=await verifyArchive764({env,record,readback:historical});
  if(archive.signature_authenticated){
    const receipt=await readReceipt764(env,'execution',record,archive);
    execution=await verifyExecution764({env,record,archive,readback:receipt});
    if(execution.signature_authenticated){
      const standbyRead=await readReceipt764(env,'standby',record,archive,execution);
      standby=await verifyStandby764({env,record,archive,execution,readback:standbyRead});
      if(standby.signature_authenticated){
        const review=await readReceipt764(env,'reconciliation',record,archive,execution,standby);
        reconciliation=await verifyReconciliation764({env,record,archive,execution,standby,readback:review});
        if(reconciliation.signature_authenticated)
          owner=await verifyOwnerPostchange764({env,record,archive,execution,standby,reconciliation,
            envelope:body.owner_postchange_decision});
      }
    }
  }
  return json(await reconcilePostchange764({archive,execution,standby,reconciliation,owner}));
}
const readonly=()=>fail('Build 764 only verifies externally signed observations. No SQL, rollback, grants, notifications or business closure endpoint exists.',405);
export async function onRequestPut(){return readonly();}
export async function onRequestPatch(){return readonly();}
export async function onRequestDelete(){return readonly();}
export async function onRequestOptions(){return new Response('',{
  status:204,headers:{Allow:'GET,POST,OPTIONS','Cache-Control':'no-store'}});}
