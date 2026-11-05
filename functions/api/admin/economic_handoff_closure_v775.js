import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {reviewHandoffAging774} from './economic_owner_handoff_aging_v774.js';
import {ROLES775,verifyOwner775,readReceipt775,verifyDecision775,
  verifyEscalation775,verifyRetention775,reconcile775}
  from '../_lib/economic-handoff-closure-retention-v775.js';

const reject=(error,status=400)=>json({ok:false,build:775,error,
  handoff_closure_decision_status:'HOLD_HANDOFF_DECISION_AGING_OR_RETENTION_CONTINUITY',
  original_owner_business_signoff_by_app:false,
  production_database_written_by_app:false,closure_allowed:false},status);
async function protect(request,env){
  const auth=await requireStaffAccess({request,env,capability:'manage_staff',
    allowLegacyAdminFallback:false});
  if(!auth.ok)return auth.response;
  return auth.auth_mode==='session'?null:reject('Signed-in owner session required.',403);
}
export async function onRequestGet({request,env}){
  const denied=await protect(request,env);if(denied)return denied;
  return json({ok:true,build:775,read_only:true,
    provider_configuration:Object.fromEntries(ROLES775.map(role=>
      [role.toLowerCase(),!!env?.[`ROSIE_ECONOMIC_${role}_BASE_URL`]])),
    handoff_closure_decision_status:'HOLD_HANDOFF_DECISION_AGING_OR_RETENTION_CONTINUITY',
    original_owner_business_signoff_by_app:false,closure_allowed:false});
}
export async function onRequestPost({request,env}){
  const denied=await protect(request,env);if(denied)return denied;
  if(request.headers.get('origin')!==new URL(request.url).origin)
    return reject('Same-origin original-owner evidence review only.',403);
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))
    return reject('Signed JSON required.',415);
  if(Number(request.headers.get('content-length')||0)>180000)
    return reject('Original signed evidence exceeds 180 KB.',413);
  let body;
  try{const raw=await request.text();if(raw.length>180000)throw Error('large');
    body=JSON.parse(raw);
  }catch{return reject('Submit nine authentic original signed owner JSON envelopes.');}
  const ids=['booking_id','source_record_id','change_ticket_id','execution_request_id'];
  const signed=['owner_postchange_decision','owner_closure_readiness_decision',
    'owner_explicit_closure_authorization','owner_postclosure_acceptance_decision',
    'original_owner_final_manual_decision','original_owner_signoff_continuity',
    'original_owner_disposition_renewal_review','original_owner_renewal_handoff',
    'original_owner_handoff_closure_review'];
  if(!body||typeof body!=='object'||Array.isArray(body)||
    ids.some(k=>typeof body[k]!=='string')||signed.some(k=>!body[k]))
    return reject('Exact original scope and nine owner-signed envelopes required.');
  // Every prior external Build 774 source is fetched again by the server; a
  // browser-provided readiness flag can never authorize the next claim.
  const history=await reviewHandoffAging774({env,body});
  let owner=null,decision=null,escalation=null,retention=null;
  if(history.report?.owner_renewal_handoff_status===
    'READY_FOR_SEPARATE_ORIGINAL_OWNER_RENEWAL_HANDOFF'){
    owner=await verifyOwner775({env,history,
      envelope:body.original_owner_handoff_closure_review});
    if(owner.signature_authenticated){
      decision=await verifyDecision775({env,history,owner,
        readback:await readReceipt775(env,'decision',history,owner)});
      if(decision.signature_authenticated){
        escalation=await verifyEscalation775({env,history,owner,decision,
          readback:await readReceipt775(env,'escalation',history,owner,decision)});
        if(escalation.signature_authenticated)
          retention=await verifyRetention775({env,history,owner,decision,escalation,
            readback:await readReceipt775(env,'retention',history,owner,decision,escalation)});
      }
    }
  }
  return json(await reconcile775({history,owner,decision,escalation,retention}));
}
const readonly=()=>reject('Build 775 is signed original-source review only: no owner sign-off, real handoff, dispute closure, retention change, SQL, archive, audit append or notification.',405);
export async function onRequestPut(){return readonly();}
export async function onRequestPatch(){return readonly();}
export async function onRequestDelete(){return readonly();}
export async function onRequestOptions(){return new Response('',{status:204,
  headers:{Allow:'GET,POST,OPTIONS','Cache-Control':'no-store'}});}
