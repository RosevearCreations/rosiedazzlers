import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {reviewDispositionRenewal773} from './economic_disposition_renewal_v773.js';
import {ROLES774,verifyOwner774,readReceipt774,verifyHandoff774,
  verifyAging774,verifyClosure774,reconcile774}
  from '../_lib/economic-owner-handoff-aging-v774.js';

const reject=(error,status=400)=>json({ok:false,build:774,error,
  owner_renewal_handoff_status:'HOLD_OWNER_RENEWAL_DISPUTE_AGING_OR_RETENTION_CLOSURE',
  original_owner_business_signoff_by_app:false,external_handoff_executed_by_app:false,
  production_database_written_by_app:false,closure_allowed:false},status);
async function protect(request,env){
  const auth=await requireStaffAccess({request,env,capability:'manage_staff',
    allowLegacyAdminFallback:false});
  if(!auth.ok)return auth.response;
  return auth.auth_mode==='session'?null:reject('Signed-in owner session required.',403);
}
export async function onRequestGet({request,env}){
  const denied=await protect(request,env);if(denied)return denied;
  return json({ok:true,build:774,read_only:true,
    provider_configuration:Object.fromEntries(ROLES774.map(role=>
      [role.toLowerCase(),!!env?.[`ROSIE_ECONOMIC_${role}_BASE_URL`]])),
    owner_renewal_handoff_status:'HOLD_OWNER_RENEWAL_DISPUTE_AGING_OR_RETENTION_CLOSURE',
    original_owner_business_signoff_by_app:false,closure_allowed:false});
}
export async function onRequestPost({request,env}){
  const denied=await protect(request,env);if(denied)return denied;
  if(request.headers.get('origin')!==new URL(request.url).origin)
    return reject('Same-origin original owner evidence review only.',403);
  if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')||''))
    return reject('Signed JSON required.',415);
  if(Number(request.headers.get('content-length')||0)>160000)
    return reject('Original signed evidence exceeds 160 KB.',413);
  let body;
  try{const raw=await request.text();if(raw.length>160000)throw Error('large');
    body=JSON.parse(raw);
  }catch{return reject('Submit eight authentic original owner signed JSON envelopes.');}
  const ids=['booking_id','source_record_id','change_ticket_id','execution_request_id'];
  const signed=['owner_postchange_decision','owner_closure_readiness_decision',
    'owner_explicit_closure_authorization','owner_postclosure_acceptance_decision',
    'original_owner_final_manual_decision','original_owner_signoff_continuity',
    'original_owner_disposition_renewal_review','original_owner_renewal_handoff'];
  if(!body||typeof body!=='object'||Array.isArray(body)||
    ids.some(k=>typeof body[k]!=='string')||signed.some(k=>!body[k]))
    return reject('Exact original case scope and eight owner-signed envelopes required.');
  // Re-read all prior external sources: no browser-supplied readiness packet.
  const history=await reviewDispositionRenewal773({env,body});
  let owner=null,handoff=null,aging=null,closure=null;
  if(history.report?.external_disposition_signoff_status===
    'READY_FOR_SEPARATE_ORIGINAL_OWNER_MANUAL_DISPOSITION_REVIEW'){
    owner=await verifyOwner774({env,history,envelope:body.original_owner_renewal_handoff});
    if(owner.signature_authenticated){
      handoff=await verifyHandoff774({env,history,owner,
        readback:await readReceipt774(env,'handoff',history,owner)});
      if(handoff.signature_authenticated){
        aging=await verifyAging774({env,history,owner,handoff,
          readback:await readReceipt774(env,'aging',history,owner,handoff)});
        if(aging.signature_authenticated)
          closure=await verifyClosure774({env,history,owner,handoff,aging,
            readback:await readReceipt774(env,'closure',history,owner,handoff,aging)});
      }
    }
  }
  return json(await reconcile774({history,owner,handoff,aging,closure}));
}
const readonly=()=>reject('Build 774 is original-source evidence review only. No original owner renewal, handoff, dispute disposition, retention, SQL, audit or notification changes.',405);
export async function onRequestPut(){return readonly();}
export async function onRequestPatch(){return readonly();}
export async function onRequestDelete(){return readonly();}
export async function onRequestOptions(){return new Response('',{status:204,
  headers:{Allow:'GET,POST,OPTIONS','Cache-Control':'no-store'}});}
