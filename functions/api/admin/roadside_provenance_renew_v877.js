// Rosie 877: owner-only newly issued Ed25519 provenance sidecar.
// Requires a newly, independently revalidated original artifact from Build 876.
import {onRequestPost as verifyOriginalArtifact} from './roadside_artifact_revalidate_v876.js';
import {issueOwnerClosureProvenance} from '../_lib/roadside-provenance-issuer-v877.js';
import {json} from '../_lib/staff-auth.js';
const h={'Cache-Control':'no-store, private','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const fail=(error,status=400)=>json({ok:false,build:877,error,provenance_renewed:false},status,h);
export async function onRequestPost({request,env}){
 const raw=await request.text().catch(()=>'');
 if(raw.length<20||raw.length>75000)return fail('Owner artifact outside original size limit',413);
 let packet;
 try{packet=JSON.parse(raw)}catch{return fail('Valid original JSON dossier required');}
 const {artifact,draft_id:draftId}=packet||{};
 if(!artifact?.integrity?.digest_sha256||!artifact?.closure?.id)return fail('Exact original closure dossier required',422);
 // Existing full owner authentication, digest check and private original-source
 // comparison is reused BEFORE any signature is issued. No external HTTP call.
 const verified=await verifyOriginalArtifact({request:new Request(request.url,{
  method:'POST',headers:request.headers,body:raw}),env});
 const source=await verified.json().catch(()=>null);
 if(!verified.ok||source?.historical_artifact_revalidated!==true)
  return fail('Original source-bound closure revalidation failed; no issuer proof signed',verified.status===403?403:409);
 let privateJwk,publicJwk;
 try{
  privateJwk=JSON.parse(env.ROSIE_CLOSURE_ISSUER_ED25519_PRIVATE_JWK||'null');
  publicJwk=JSON.parse(env.ROSIE_CLOSURE_ISSUER_ED25519_PUBLIC_JWK||'null');
 }catch{return fail('Dedicated original owner issuer keys malformed',503);}
 const proof=await issueOwnerClosureProvenance({privateJwk,publicJwk,
  draftId,closureId:artifact.closure.id,
  artifactDigest:artifact.integrity.digest_sha256});
 if(!proof.ok)return fail('Original owner Ed25519 issuer key not provisioned or unverified',503);
 const sidecar={...proof,build:877,
  original_source_revalidated:true,
  original_historical_closure_exists:true,
  new_provider_signed_receipt_not_inferred:true,
  physical_device_attestation_not_inferred:true,
  current_refund_case_hold:source.current_refund_case_hold,
  no_financial_status_mutated:true};
 return new Response(JSON.stringify(sidecar,null,2),{
  status:200,headers:{...h,'Content-Type':'application/json; charset=utf-8',
    'Content-Disposition':'attachment; filename="rosie-closure-provenance-v877.json"'}});
}
export const onRequestOptions=()=>fail('Signed-in owner POST required',405);
