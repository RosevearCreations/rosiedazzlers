import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {reviewHandoff769} from './economic_handoff_retention_v769.js';
import {ROLES770,readReceipt770,verifyRegister770,verifyAck770,
  verifyAging770,reconcile770} from '../_lib/economic-owner-register-aging-v770.js';

const reject=(error,status=400)=>json({ok:false,build:770,error,
  owner_register_status:'HOLD_OWNER_REGISTER_HANDOFF_ACK_OR_RETENTION_AGING',
  original_business_acceptance_recorded_by_app:false,
  external_case_reopened_by_app:false,automatic_business_write:false,
  production_db_connected_by_app:false,closure_allowed:false},status);
async function protect(request,env){
  const auth=await requireStaffAccess({request,env,capability:'manage_staff',
    allowLegacyAdminFallback:false});
  if(!auth.ok)return auth.response;
  return auth.auth_mode==='session'?null:reject('Signed-in owner session required.',403);
}
export async function onRequestGet({request,env}){
  const denied=await protect(request,env);if(denied)return denied;
  return json({ok:true,build:770,read_only:true,
    provider_configuration:Object.fromEntries(ROLES770.map(role=>
      [role.toLowerCase(),!!env?.[`ROSIE_ECONOMIC_${role}_BASE_URL`]])),
    owner_register_status:'HOLD_OWNER_REGISTER_HANDOFF_ACK_OR_RETENTION_AGING',
    original_business_acceptance_recorded_by_app:false,
    closure_allowed:false});
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
  catch{return reject('Submit valid signed original JSON evidence under 64 KB.');}
  const ids=['booking_id','source_record_id','change_ticket_id','execution_request_id'];
  if(!body||typeof body!=='object'||Array.isArray(body)||
    ids.some(k=>typeof body[k]!=='string')||
    !body.owner_postchange_decision||!body.owner_closure_readiness_decision||
    !body.owner_explicit_closure_authorization||!body.owner_postclosure_acceptance_decision)
    return reject('Exact scope and four original signed owner envelopes required.');
  // No browser-controlled previous readiness claims; rebuild every original
  // signed Build 764–769 source and verifier claim before reading Build 770.
  const history=await reviewHandoff769({env,body});
  let register=null,ack=null,aging=null;
  if(history.handoff?.signature_authenticated&&
    history.outcome?.signature_authenticated&&
    history.retention?.signature_authenticated){
    register=await verifyRegister770({env,history,
      readback:await readReceipt770(env,'register',history)});
    if(register.signature_authenticated){
      ack=await verifyAck770({env,history,register,
        readback:await readReceipt770(env,'ack',history,register)});
      if(ack.signature_authenticated)
        aging=await verifyAging770({env,history,register,ack,
          readback:await readReceipt770(env,'aging',history,register,ack)});
    }
  }
  return json(await reconcile770({history,register,ack,aging}));
}
const readOnly=()=>reject('Build 770 is read-only. No case mutation, SQL, owner acceptance, audit write, archival or notification API.',405);
export async function onRequestPut(){return readOnly();}
export async function onRequestPatch(){return readOnly();}
export async function onRequestDelete(){return readOnly();}
export async function onRequestOptions(){return new Response('',{status:204,
  headers:{Allow:'GET,POST,OPTIONS','Cache-Control':'no-store'}});}
