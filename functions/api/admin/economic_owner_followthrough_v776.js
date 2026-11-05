import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {reviewHandoffClosure775} from './economic_handoff_closure_v775.js';
import {ROLES776,verifyOwner776,readReceipt776,verifyFollowthrough776,
  verifyException776,verifyCustody776,reconcile776}
  from '../_lib/economic-owner-followthrough-retention-v776.js';

const reject=(error,status=400)=>json({ok:false,build:776,error,
  owner_followthrough_status:'HOLD_OWNER_FOLLOWTHROUGH_AGING_OR_RETENTION_CUSTODY',
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
  return json({ok:true,build:776,read_only:true,
    provider_configuration:Object.fromEntries(ROLES776.map(role=>
      [role.toLowerCase(),!!env?.[`ROSIE_ECONOMIC_${role}_BASE_URL`]])),
    owner_followthrough_status:'HOLD_OWNER_FOLLOWTHROUGH_AGING_OR_RETENTION_CUSTODY',
    original_owner_business_signoff_by_app:false,closure_allowed:false});
}
export async function reviewOwnerFollowthrough776({env,body}){
  const required=['booking_id','source_record_id','change_ticket_id','execution_request_id'];
  const envelopes=['owner_postchange_decision','owner_closure_readiness_decision',
    'owner_explicit_closure_authorization','owner_postclosure_acceptance_decision',
    'original_owner_final_manual_decision','original_owner_signoff_continuity',
    'original_owner_disposition_renewal_review','original_owner_renewal_handoff',
    'original_owner_handoff_closure_review','original_owner_followthrough_review'];
  if(!body||typeof body!=='object'||Array.isArray(body)||
    required.some(k=>typeof body[k]!=='string')||envelopes.some(k=>!body[k]))
    return {report:{ok:false,build:776,
      owner_followthrough_status:'HOLD_OWNER_FOLLOWTHROUGH_AGING_OR_RETENTION_CUSTODY',
      error:'Original scope and ten signed owner envelopes required.'}};
  // The server re-fetches each prior independent original issuer source.
  // A browser-supplied readiness label or fabricated success cannot authorize it.
  const history=await reviewHandoffClosure775({env,body});
  let owner=null,followthrough=null,exception=null,custody=null;
  if(history.report?.handoff_closure_decision_status===
    'READY_FOR_SEPARATE_ORIGINAL_OWNER_HANDOFF_CLOSURE_DECISION'){
    owner=await verifyOwner776({env,history,
      envelope:body.original_owner_followthrough_review});
    if(owner.signature_authenticated){
      followthrough=await verifyFollowthrough776({env,history,owner,
        readback:await readReceipt776(env,'followthrough',history,owner)});
      if(followthrough.signature_authenticated){
        exception=await verifyException776({env,history,owner,followthrough,
          readback:await readReceipt776(env,'exception',history,owner,followthrough)});
        if(exception.signature_authenticated)
          custody=await verifyCustody776({env,history,owner,followthrough,exception,
            readback:await readReceipt776(env,'custody',history,owner,followthrough,exception)});
      }
    }
  }
  const report=await reconcile776({history,owner,followthrough,exception,custody});
  return {report,history,owner,followthrough,exception,custody};
}
export async function onRequestPost({request,env}){
  const denied=await protect(request,env);if(denied)return denied;
  if(request.headers.get('origin')!==new URL(request.url).origin)
    return reject('Same-origin original owner review only.',403);
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))
    return reject('Signed JSON required.',415);
  if(Number(request.headers.get('content-length')||0)>210000)
    return reject('Signed original evidence exceeds 210 KB.',413);
  let body;
  try{const raw=await request.text();if(raw.length>210000)throw Error('large');
    body=JSON.parse(raw);
  }catch{return reject('Submit ten authentic original signed owner JSON envelopes.');}
  const result=await reviewOwnerFollowthrough776({env,body});
  return result.report?.ok?json(result.report):reject(result.report?.error||'Invalid original signed evidence.');
}
const readonly=()=>reject('Build 776 verifies original signed evidence only; it never signs off, closes disputes, renews custody, writes audit, deletes retention, sends notices or alters production data.',405);
export async function onRequestPut(){return readonly();}
export async function onRequestPatch(){return readonly();}
export async function onRequestDelete(){return readonly();}
export async function onRequestOptions(){return new Response('',{status:204,
  headers:{Allow:'GET,POST,OPTIONS','Cache-Control':'no-store'}});}
