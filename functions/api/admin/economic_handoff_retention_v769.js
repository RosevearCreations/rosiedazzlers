import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {reviewOriginalOwner768} from './economic_owner_acceptance_v768.js';
import {ROLES769,readReceipt769,verifyHandoff769,verifyOutcome769,
  verifyRetention769,reconcile769}
  from '../_lib/economic-handoff-retention-v769.js';

const reject=(message,status=400)=>json({ok:false,build:769,error:message,
  handoff_retention_status:'HOLD_ORIGINAL_HANDOFF_REOPEN_OUTCOME_OR_RETENTION',
  owner_acceptance_recorded_by_app:false,external_case_reopened_by_app:false,
  production_db_connected_by_app:false,automatic_business_write:false,
  closure_allowed:false},status);
async function protect(request,env){
  const auth=await requireStaffAccess({request,env,capability:'manage_staff',
    allowLegacyAdminFallback:false});
  if(!auth.ok)return auth.response;
  return auth.auth_mode==='session'?null:reject('Signed-in owner session required.',403);
}
export async function onRequestGet({request,env}){
  const denied=await protect(request,env);if(denied)return denied;
  return json({ok:true,build:769,read_only:true,
    provider_configuration:Object.fromEntries(ROLES769.map(role=>
      [role.toLowerCase(),!!env?.[`ROSIE_ECONOMIC_${role}_BASE_URL`]])),
    handoff_retention_status:'HOLD_ORIGINAL_HANDOFF_REOPEN_OUTCOME_OR_RETENTION',
    owner_acceptance_recorded_by_app:false,closure_allowed:false});
}
export async function onRequestPost({request,env}){
  const denied=await protect(request,env);if(denied)return denied;
  if(request.headers.get('origin')!==new URL(request.url).origin)
    return reject('Same-origin owner review only.',403);
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))
    return reject('JSON required.',415);
  if(Number(request.headers.get('content-length')||0)>64000)
    return reject('Evidence exceeds 64 KB.',413);
  let body;
  try{const raw=await request.text();if(raw.length>64000)throw Error('large');body=JSON.parse(raw);}
  catch{return reject('Submit valid signed original evidence JSON under 64 KB.');}
  const ids=['booking_id','source_record_id','change_ticket_id','execution_request_id'];
  if(!body||typeof body!=='object'||Array.isArray(body)||
    ids.some(k=>typeof body[k]!=='string')||
    !body.owner_postchange_decision||!body.owner_closure_readiness_decision||
    !body.owner_explicit_closure_authorization||!body.owner_postclosure_acceptance_decision)
    return reject('Exact scope and four original signed owner decisions are required.');
  const {report}=await reviewHandoff769({env,body});
  return json(report);
}
// Shared original-source re-fetch for Build 770 and later read-only reviews.
export async function reviewHandoff769({env,body}){
  // Every request reconstructs all external source claims from Builds 764–768.
  // Never trust a client-supplied ready packet or unsigned external handoff data.
  const history=await reviewOriginalOwner768({env,body});
  const ctx={record:history.record,prior:history.prior,report:history.report};
  let handoff=null,outcome=null,retention=null;
  if(history.report.owner_postclosure_decision?.signature_authenticated&&
    history.report.independent_original_source_custody?.signature_authenticated&&
    history.report.independent_exception_reopening?.signature_authenticated){
    handoff=await verifyHandoff769({env,ctx,
      readback:await readReceipt769(env,'handoff',ctx)});
    if(handoff.signature_authenticated){
      outcome=await verifyOutcome769({env,ctx,handoff,
        readback:await readReceipt769(env,'outcome',ctx,handoff)});
      if(outcome.signature_authenticated)
        retention=await verifyRetention769({env,ctx,handoff,outcome,
          readback:await readReceipt769(env,'retention',ctx,handoff,outcome)});
    }
  }
  return {report:await reconcile769({ctx,handoff,outcome,retention}),
    ctx,handoff,outcome,retention};
}
const readOnly=()=>reject('Build 769 cannot write, close, reopen, accept, archive or notify.',405);
export async function onRequestPut(){return readOnly();}
export async function onRequestPatch(){return readOnly();}
export async function onRequestDelete(){return readOnly();}
export async function onRequestOptions(){return new Response('',{status:204,
  headers:{Allow:'GET,POST,OPTIONS','Cache-Control':'no-store'}});}
