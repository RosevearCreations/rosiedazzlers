import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {reviewOwnerRegister770} from './economic_owner_register_v770.js';
import {ROLES771,verifyOwner771,readReceipt771,verifyAttest771,
  verifyDispute771,verifyEscalation771,reconcile771}
  from '../_lib/economic-final-attestation-v771.js';

const reject=(error,status=400)=>json({ok:false,build:771,error,
  final_owner_review_status:'HOLD_FINAL_OWNER_DISPUTE_OR_RETENTION_ESCALATION',
  original_business_acceptance_recorded_by_app:false,
  external_case_reopened_by_app:false,automatic_business_write:false,
  production_db_connected_by_app:false,closure_allowed:false},status);
async function protect(request,env){
  const auth=await requireStaffAccess({request,env,capability:'manage_staff',
    allowLegacyAdminFallback:false});
  if(!auth.ok)return auth.response;
  return auth.auth_mode==='session'?null:reject('Signed-in original owner session required.',403);
}
export async function onRequestGet({request,env}){
  const denied=await protect(request,env);if(denied)return denied;
  return json({ok:true,build:771,read_only:true,
    provider_configuration:Object.fromEntries(ROLES771.map(role=>
      [role.toLowerCase(),!!env?.[`ROSIE_ECONOMIC_${role}_BASE_URL`]])),
    final_owner_review_status:'HOLD_FINAL_OWNER_DISPUTE_OR_RETENTION_ESCALATION',
    original_business_acceptance_recorded_by_app:false,closure_allowed:false});
}
export async function onRequestPost({request,env}){
  const denied=await protect(request,env);if(denied)return denied;
  if(request.headers.get('origin')!==new URL(request.url).origin)
    return reject('Same-origin original owner review only.',403);
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))
    return reject('Signed JSON required.',415);
  if(Number(request.headers.get('content-length')||0)>96000)
    return reject('Signed original evidence exceeds 96 KB.',413);
  let body;
  try{const raw=await request.text();if(raw.length>96000)throw Error('large');
    body=JSON.parse(raw);}catch{return reject('Submit valid signed original JSON under 96 KB.');}
  const ids=['booking_id','source_record_id','change_ticket_id','execution_request_id'];
  if(!body||typeof body!=='object'||Array.isArray(body)||
    ids.some(k=>typeof body[k]!=='string')||
    !body.owner_postchange_decision||!body.owner_closure_readiness_decision||
    !body.owner_explicit_closure_authorization||!body.owner_postclosure_acceptance_decision||
    !body.original_owner_final_manual_decision)
    return reject('Exact scope and five original owner-signed JSON envelopes required.');
  // Original signed history is fetched from server-pinned independent issuers,
  // never accepted from a browser-supplied Build 770 packet.
  const history=await reviewOwnerRegister770({env,body});
  const {report}=await reviewFinalAttestation771({env,body,history});
  return json(report);
}
// Revalidate the complete original Build 771 evidence chain for later
// independent readbacks; never trust a browser-supplied predecessor packet.
export async function reviewFinalAttestation771({env,body,history}={}){
  const prior=history||await reviewOwnerRegister770({env,body});
  let owner=null,attestation=null,dispute=null,escalation=null;
  if(prior.register?.signature_authenticated&&prior.ack?.signature_authenticated&&
    prior.aging?.signature_authenticated){
    owner=await verifyOwner771({env,history:prior,
      envelope:body.original_owner_final_manual_decision});
    if(owner.signature_authenticated){
      attestation=await verifyAttest771({env,history:prior,owner,
        readback:await readReceipt771(env,'attest',prior,owner)});
      if(attestation.signature_authenticated){
        dispute=await verifyDispute771({env,history:prior,owner,attestation,
          readback:await readReceipt771(env,'dispute',prior,owner,attestation)});
        if(dispute.signature_authenticated)
          escalation=await verifyEscalation771({env,history:prior,owner,attestation,dispute,
            readback:await readReceipt771(env,'escalation',prior,owner,attestation,dispute)});
      }
    }
  }
  return {report:await reconcile771({history:prior,owner,attestation,dispute,escalation}),
    history:prior,owner,attestation,dispute,escalation};
}
const readOnly=()=>reject('Build 771 only authenticates external evidence. No production SQL, case reopening, business acceptance, audit append, archival or notification.',405);
export async function onRequestPut(){return readOnly();}
export async function onRequestPatch(){return readOnly();}
export async function onRequestDelete(){return readOnly();}
export async function onRequestOptions(){return new Response('',{status:204,
  headers:{Allow:'GET,POST,OPTIONS','Cache-Control':'no-store'}});}
