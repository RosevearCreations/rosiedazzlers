import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {reviewFinalAttestation771} from './economic_final_attestation_v771.js';
import {ROLES772,verifyOwner772,readReceipt772,verifyResolution772,
  verifySignoff772,verifySLA772,reconcile772}
  from '../_lib/economic-resolution-sla-v772.js';

const reject=(error,status=400)=>json({ok:false,build:772,error,
  final_owner_resolution_status:'HOLD_EXTERNAL_RESOLUTION_SIGNOFF_OR_RETENTION_SLA',
  original_business_signoff_recorded_by_app:false,
  original_dispute_closed_by_app:false,retention_exception_cleared_by_app:false,
  automatic_owner_business_action:false,closure_allowed:false},status);
async function protect(request,env){
  const auth=await requireStaffAccess({request,env,capability:'manage_staff',
    allowLegacyAdminFallback:false});
  if(!auth.ok)return auth.response;
  return auth.auth_mode==='session'?null:
    reject('Signed-in original owner session required.',403);
}
export async function onRequestGet({request,env}){
  const denied=await protect(request,env);if(denied)return denied;
  return json({ok:true,build:772,read_only:true,
    provider_configuration:Object.fromEntries(ROLES772.map(role=>
      [role.toLowerCase(),!!env?.[`ROSIE_ECONOMIC_${role}_BASE_URL`]])),
    final_owner_resolution_status:'HOLD_EXTERNAL_RESOLUTION_SIGNOFF_OR_RETENTION_SLA',
    original_business_signoff_recorded_by_app:false,closure_allowed:false});
}
export async function onRequestPost({request,env}){
  const denied=await protect(request,env);if(denied)return denied;
  if(request.headers.get('origin')!==new URL(request.url).origin)
    return reject('Same-origin original owner review only.',403);
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))
    return reject('Original signed JSON required.',415);
  if(Number(request.headers.get('content-length')||0)>112000)
    return reject('Original evidence exceeds 112 KB.',413);
  let body;
  try{const raw=await request.text();if(raw.length>112000)throw Error('large');
    body=JSON.parse(raw);
  }catch{return reject('Submit six original signed JSON envelopes under 112 KB.');}
  const ids=['booking_id','source_record_id','change_ticket_id','execution_request_id'];
  const signed=['owner_postchange_decision','owner_closure_readiness_decision',
    'owner_explicit_closure_authorization','owner_postclosure_acceptance_decision',
    'original_owner_final_manual_decision','original_owner_signoff_continuity'];
  if(!body||typeof body!=='object'||Array.isArray(body)||
    ids.some(k=>typeof body[k]!=='string')||signed.some(k=>!body[k]))
    return reject('Exact case scope and six original signed owner decisions required.');
  const history=await reviewFinalAttestation771({env,body});
  let owner=null,resolution=null,signoff=null,sla=null;
  if(history.owner?.signature_authenticated&&
    history.attestation?.signature_authenticated&&
    history.dispute?.signature_authenticated&&
    history.escalation?.signature_authenticated){
    owner=await verifyOwner772({env,history,
      envelope:body.original_owner_signoff_continuity});
    if(owner.signature_authenticated){
      resolution=await verifyResolution772({env,history,owner,
        readback:await readReceipt772(env,'resolution',history,owner)});
      if(resolution.signature_authenticated){
        signoff=await verifySignoff772({env,history,owner,resolution,
          readback:await readReceipt772(env,'signoff',history,owner,resolution)});
        if(signoff.signature_authenticated)
          sla=await verifySLA772({env,history,owner,resolution,signoff,
            readback:await readReceipt772(env,'sla',history,owner,resolution,signoff)});
      }
    }
  }
  return json(await reconcile772({history,owner,resolution,signoff,sla}));
}
const readOnly=()=>reject('Build 772 is evidence-only. No original owner sign-off, case resolution, retention disposition, production SQL, audit append, archive or notification.',405);
export async function onRequestPut(){return readOnly();}
export async function onRequestPatch(){return readOnly();}
export async function onRequestDelete(){return readOnly();}
export async function onRequestOptions(){return new Response('',{status:204,
  headers:{Allow:'GET,POST,OPTIONS','Cache-Control':'no-store'}});}
