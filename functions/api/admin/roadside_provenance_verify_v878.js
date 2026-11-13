// Rosie 878: historical owner closure and independently operator-pinned
// Ed25519 issuer proof verification; never trusts the uploaded sidecar key alone.
import {onRequestPost as validateOriginalDossier} from './roadside_artifact_revalidate_v876.js';
import {pinnedIssuerRoster878,verifyPinnedProvenance878}
 from '../_lib/roadside-provenance-pin-v878.js';
import {json,isUuid} from '../_lib/staff-auth.js';
const h={'Cache-Control':'no-store, private','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const fail=(error,status=400)=>json({ok:false,build:878,error,pinned_provenance_verified:false,
 current_payment_clearance:false},status,h);
export async function onRequestPost({request,env}){
 const raw=await request.text().catch(()=>'');
 if(raw.length<50||raw.length>150000)return fail('Owner proof and dossier outside upload bounds',413);
 let packet;try{packet=JSON.parse(raw)}catch{return fail('Original closure and signed sidecar JSON required');}
 const {draft_id:draftId,artifact,sidecar}=packet||{};
 if(!isUuid(draftId)||!artifact||!sidecar)return fail('Exact original signed dossier pair required');
 const originalBody=JSON.stringify({draft_id:draftId,artifact});
 if(originalBody.length>75000)return fail('Original closure dossier outside independent review bounds',413);
 // Reuse all original owner session, digest and private source checks BEFORE
 // parsing trusted pins or verifying a submitted cryptographic signature.
 const headers=new Headers(request.headers);headers.delete('Content-Length');
 const response=await validateOriginalDossier({request:new Request(request.url,{
  method:'POST',headers,body:originalBody}),env});
 const source=await response.json().catch(()=>null);
 if(!response.ok||source?.historical_artifact_revalidated!==true)
  return fail('Original closure source and digest not independently revalidated',
   response.status===401||response.status===403?response.status:409);
 let fallback=null;
 try{fallback=JSON.parse(env.ROSIE_CLOSURE_ISSUER_ED25519_PUBLIC_JWK||'null');}
 catch{return fail('Original trusted Ed25519 issuer pin malformed',503);}
 const roster=pinnedIssuerRoster878(env.ROSIE_CLOSURE_TRUSTED_ED25519_KEYS_JSON,
  {fallbackPublicJwk:fallback});
 if(!roster.ok)return fail('Operator-pinned Ed25519 rotation roster unavailable: '+roster.reason,503);
 const verified=await verifyPinnedProvenance878({sidecar,artifact,roster});
 if(!verified.ok)return fail(verified.reason,409);
 return json({ok:true,build:878,...verified,
  original_source_revalidated:true,
  pinned_provenance_verified:true,
  owner_acknowledgment_not_inferred:true,physical_device_renewal_not_inferred:true,
  no_original_refund_or_case_mutation:true},200,h);
}
export const onRequestOptions=()=>fail('Signed-in owner POST required',405);
