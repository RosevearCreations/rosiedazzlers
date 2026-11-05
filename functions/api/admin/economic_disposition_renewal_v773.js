import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {reviewResolutionSLA772} from './economic_resolution_sla_v772.js';
import {ROLES773,verifyOwner773,readReceipt773,verifyDisposition773,
  verifyRenewal773,verifyRemediation773,reconcile773}
  from '../_lib/economic-disposition-renewal-v773.js';

const reject=(error,status=400)=>json({ok:false,build:773,error,
  external_disposition_signoff_status:'HOLD_DISPOSITION_RENEWAL_OR_RETENTION_REMEDIATION',
  original_owner_business_signoff_by_app:false,external_case_mutated_by_app:false,
  retention_exception_cleared_by_app:false,automatic_business_action:false,
  closure_allowed:false},status);
async function protect(request,env){
  const auth=await requireStaffAccess({request,env,capability:'manage_staff',
    allowLegacyAdminFallback:false});
  if(!auth.ok)return auth.response;
  return auth.auth_mode==='session'?null:reject('Signed-in original owner session required.',403);
}
export async function onRequestGet({request,env}){
  const denied=await protect(request,env);if(denied)return denied;
  return json({ok:true,build:773,read_only:true,
    provider_configuration:Object.fromEntries(ROLES773.map(role=>
      [role.toLowerCase(),!!env?.[`ROSIE_ECONOMIC_${role}_BASE_URL`]])),
    external_disposition_signoff_status:'HOLD_DISPOSITION_RENEWAL_OR_RETENTION_REMEDIATION',
    original_owner_business_signoff_by_app:false,closure_allowed:false});
}
export async function onRequestPost({request,env}){
  const denied=await protect(request,env);if(denied)return denied;
  if(request.headers.get('origin')!==new URL(request.url).origin)
    return reject('Same-origin owner evidence review only.',403);
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))
    return reject('Signed JSON required.',415);
  if(Number(request.headers.get('content-length')||0)>128000)
    return reject('Original evidence exceeds 128 KB.',413);
  let body;
  try{const raw=await request.text();if(raw.length>128000)throw Error('large');
    body=JSON.parse(raw);
  }catch{return reject('Submit seven original signed owner JSON envelopes under 128 KB.');}
  const ids=['booking_id','source_record_id','change_ticket_id','execution_request_id'];
  const signed=['owner_postchange_decision','owner_closure_readiness_decision',
    'owner_explicit_closure_authorization','owner_postclosure_acceptance_decision',
    'original_owner_final_manual_decision','original_owner_signoff_continuity',
    'original_owner_disposition_renewal_review'];
  if(!body||typeof body!=='object'||Array.isArray(body)||
    ids.some(k=>typeof body[k]!=='string')||signed.some(k=>!body[k]))
    return reject('Exact case scope and seven original owner-signed envelopes required.');
  return json((await reviewDispositionRenewal773({env,body})).report);
}
// Build 774 replays all Build 773 witnesses at their original sources. Never
// trust a browser-submitted predecessor readiness flag or cached packet.
export async function reviewDispositionRenewal773({env,body}){
  // The browser cannot assert a Build 772 readiness packet. Its original
  // issuer history is refetched and independently authenticated server-side.
  const history=await reviewResolutionSLA772({env,body});
  let owner=null,disposition=null,renewal=null,remediation=null;
  if(history.owner?.signature_authenticated&&
    history.resolution?.signature_authenticated&&
    history.signoff?.signature_authenticated&&history.sla?.signature_authenticated){
    owner=await verifyOwner773({env,history,
      envelope:body.original_owner_disposition_renewal_review});
    if(owner.signature_authenticated){
      disposition=await verifyDisposition773({env,history,owner,
        readback:await readReceipt773(env,'disposition',history,owner)});
      if(disposition.signature_authenticated){
        renewal=await verifyRenewal773({env,history,owner,disposition,
          readback:await readReceipt773(env,'renewal',history,owner,disposition)});
        if(renewal.signature_authenticated)
          remediation=await verifyRemediation773({env,history,owner,disposition,renewal,
            readback:await readReceipt773(env,'remediation',history,owner,disposition,renewal)});
      }
    }
  }
  return {report:await reconcile773({history,owner,disposition,renewal,remediation}),
    history,owner,disposition,renewal,remediation};
}
const readOnly=()=>reject('Build 773 is original-source evidence review only. No real owner sign-off, case disposition, source retention, production SQL, archive, audit append or notification.',405);
export async function onRequestPut(){return readOnly();}
export async function onRequestPatch(){return readOnly();}
export async function onRequestDelete(){return readOnly();}
export async function onRequestOptions(){return new Response('',{status:204,
  headers:{Allow:'GET,POST,OPTIONS','Cache-Control':'no-store'}});}
