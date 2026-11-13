// Rosie 881 — signed scheduler only; original digest candidates, never identifiers.
// GitHub action signs receipts with an independently held Ed25519 key.
import {json} from './_lib/staff-auth.js';
import {pinnedIssuerRoster878} from './_lib/roadside-provenance-pin-v878.js';
import {readOriginalRows881,signedJob881} from './_lib/roadside-watch-source-v881.js';
import {validateAnchorPublic881,verifyAnchorCandidate881} from './_lib/roadside-operational-v881.js';
const h={'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
export async function onRequestPost({request,env}){
 if(env.ROSIE881_EXTERNAL_ANCHOR_ENABLED!=='true'||
  !await signedJob881(env,request.headers.get('Authorization'),'ROSIE881_ANCHOR_JOB_SECRET'))
  return json({ok:false,build:881,state:'NOT_ENROLLED_OR_UNAUTHORIZED'},403,h);
 let verifier;try{verifier=JSON.parse(env.ROSIE881_EXTERNAL_ANCHOR_PUBLIC_JWK||'null');}
 catch{return json({ok:false,build:881,state:'EXTERNAL_WITNESS_KEY_HOLD'},503,h);}
 const roster=pinnedIssuerRoster878(env.ROSIE_CLOSURE_TRUSTED_ED25519_KEYS_JSON);
 if(!validateAnchorPublic881(verifier,roster))
  return json({ok:false,build:881,state:'SEPARATE_PINNED_WITNESS_REQUIRED_HOLD'},503,h);
 try{
  const all=await readOriginalRows881(env,'rosie_roadside_rotation_receipts_v880',26);
  if(all.length>25)return json({ok:false,build:881,state:'UNBOUNDED_ANCHOR_COVERAGE_HOLD'},409,h);
  if(all.some(x=>!verifyAnchorCandidate881(x)))
   return json({ok:false,build:881,state:'ORIGINAL_RECEIPT_INVALID_HOLD'},409,h);
  return json({ok:true,build:881,state:all.length?'ORIGINAL_RECEIPT_DIGESTS_READY':
   'NO_ORIGINAL_ROTATION_RECEIPTS_HOLD',
   independent_anchor_verified:false,external_witness_public_jwk:verifier,
   receipt_digests:all.map(x=>x.receipt_sha256),
   receipt_count:all.length,no_customer_identifiers:true,
   no_proof_of_actual_key_change:true,no_financial_mutation:true},200,h);
 }catch{return json({ok:false,build:881,state:'ORIGINAL_RECEIPT_SOURCE_UNAVAILABLE_HOLD'},503,h);}
}
export const onRequestOptions=()=>json({ok:false,error:'Bearer-authenticated POST only'},405,h);
