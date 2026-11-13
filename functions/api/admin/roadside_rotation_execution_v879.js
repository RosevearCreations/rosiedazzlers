// Rosie 879: supervised post-configuration pinned issuer rotation verification.
// No endpoint may write Cloudflare secrets, trust pins, payments or owner approvals.
import {requireStaffAccess,json,isUuid} from '../_lib/staff-auth.js';
import {onRequestPost as verifyOriginal} from './roadside_provenance_verify_v878.js';
import {pinnedIssuerRoster878,pinnedKeyId878} from '../_lib/roadside-provenance-pin-v878.js';
import {checkRotation879} from '../_lib/roadside-watch-rotation-v879.js';
const h={'Cache-Control':'no-store, private','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const fail=(error,status=409)=>json({ok:false,build:879,state:'ROTATION_HOLD',error,
 rotation_verified:false,operator_pin_changed_by_request:false},status,h);
export async function onRequestPost({request,env}){
 if(request.headers.get('Origin')!==new URL(request.url).origin ||
  !/application\/json/i.test(request.headers.get('Content-Type')||''))
  return fail('Exact same-origin owner JSON ceremony required',403);
 const access=await requireStaffAccess({request,env,body:{},capability:'manage_bookings',
  allowLegacyAdminFallback:false});
 if(!access.ok)return access.response;
 if(access.auth_mode!=='session'||access.actor?.is_admin!==true)
  return fail('Signed-in original owner/Admin required',403);
 const raw=await request.text().catch(()=>'');
 if(raw.length<50||raw.length>125000)return fail('Original ceremony proof outside bounded size',413);
 let body;try{body=JSON.parse(raw);}catch{return fail('Original ceremony JSON required',400);}
 const {draft_id,artifact,sidecar,previous_issuer_key_id,active_issuer_key_id,
   owner_statement,owner_note}=body||{};
 if(!isUuid(draft_id)||!artifact||!sidecar ||
  owner_statement!=='I_SUPERVISE_POST_ROTATION_READBACK' ||
  typeof owner_note!=='string'||owner_note.trim().length<12||owner_note.length>500 ||
  typeof previous_issuer_key_id!=='string'||previous_issuer_key_id.length>130 ||
  typeof active_issuer_key_id!=='string'||active_issuer_key_id.length>130)
  return fail('Exact original owner consent, original dossier pair and key IDs required',400);
 // The Build 878 original private source check MUST precede pin configuration claims.
 const original=new Request(request.url,{method:'POST',headers:request.headers,
   body:JSON.stringify({draft_id,artifact,sidecar})});
 const response=await verifyOriginal({request:original,env});
 if(!response.ok)return fail('Original historical signed dossier not independently verified',409);
 const proof=await response.json().catch(()=>null);
 if(proof?.pinned_provenance_verified!==true)
  return fail('Original pinned historical issuer could not be verified');
 const fallback=(()=>{try{return JSON.parse(env.ROSIE_CLOSURE_ISSUER_ED25519_PUBLIC_JWK||'null');}
  catch{return null;}})();
 // Rotation requires explicit operator-managed multi-key roster, never legacy fallback.
 if(!env.ROSIE_CLOSURE_TRUSTED_ED25519_KEYS_JSON)
  return fail('Supervised operator multi-key pin configuration not enrolled',503);
 const roster=pinnedIssuerRoster878(env.ROSIE_CLOSURE_TRUSTED_ED25519_KEYS_JSON,
   {fallbackPublicJwk:fallback});
 if(!roster.ok)return fail('Operator trusted issuer roster unavailable',503);
 const rows=await Promise.all(roster.rows.map(async k=>({...k,
   issuer_id:await pinnedKeyId878(k.public_jwk)})));
 const decision=checkRotation879({roster:{...roster,rows},priorKeyId:previous_issuer_key_id,
  newKeyId:active_issuer_key_id,verifiedPrevious:proof});
 if(!decision.verified)return fail(decision.reason);
 return json({ok:true,build:879,rotation_verified:true,...decision,
   owner_review_record_persisted:false,
   rotation_requires_separately_authorized_cloudflare_environment_update:true,
   private_signing_material_never_accepted:true,no_issuer_key_changed_by_request:true,
   no_original_payment_or_case_mutation:true},200,h);
}
export const onRequestOptions=()=>fail('Signed-in original owner POST required',405);
