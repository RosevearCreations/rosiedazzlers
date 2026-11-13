// Rosie 880: owner-authorized append-only receipt of an already verified,
// operator-deployed public-key roster (not an actual Cloudflare write/rotation).
import {requireStaffAccess,serviceHeaders,json,isUuid} from '../_lib/staff-auth.js';
import {onRequestPost as verifyRotation} from './roadside_rotation_execution_v879.js';
import {pinnedIssuerRoster878,pinnedKeyId878} from '../_lib/roadside-provenance-pin-v878.js';
const h={'Cache-Control':'no-store, private','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
const fail=(error,status=409)=>json({ok:false,build:880,state:'ROTATION_RECEIPT_HOLD',error,
 persisted:false,cloudflare_pin_rotated_by_request:false},status,h);
export async function onRequestPost({request,env}){
 if(request.headers.get('Origin')!==new URL(request.url).origin||
  !/application\/json/i.test(request.headers.get('Content-Type')||''))
  return fail('Exact same-origin owner ceremony POST required',403);
 const auth=await requireStaffAccess({request,env,body:{},capability:'manage_bookings',
  allowLegacyAdminFallback:false});
 if(!auth.ok)return auth.response;
 if(auth.auth_mode!=='session'||auth.actor?.is_admin!==true)
  return fail('Original signed-in owner required',403);
 if(!/^https:\/\//.test(env.SUPABASE_URL||'')||!env.SUPABASE_SERVICE_ROLE_KEY)
  return fail('Original private receipt authority unavailable',503);
 const raw=await request.text().catch(()=>'');
 if(raw.length<50||raw.length>125000)return fail('Original ceremony JSON outside bounds',413);
 let body;try{body=JSON.parse(raw)}catch{return fail('Original ceremony JSON required',400);}
 if(!isUuid(body?.draft_id)||!body.artifact||!body.sidecar||
  !/^[a-f0-9]{64}$/.test(body.artifact?.integrity?.digest_sha256||'')||
  body.owner_statement!=='I_SUPERVISE_POST_ROTATION_READBACK'||
  typeof body.owner_note!=='string'||body.owner_note.trim().length<12||
  body.owner_note.length>500)return fail('Original verified dossier and explicit owner note required',400);
 const actor=String(auth.actor?.email||auth.actor?.id||'').trim();
 if(actor.length<3||actor.length>140)return fail('Original signed-in owner identity unavailable',403);
 try{
  const verified=await verifyRotation({request:new Request(request.url,{
   method:'POST',headers:request.headers,body:raw}),env});
  const proof=verified.ok?await verified.json().catch(()=>null):null;
  if(proof?.rotation_verified!==true||proof.state!=='POST_ROTATION_OPERATOR_PIN_CONFIRMED')
   return fail('Original owner post-rotation readback not independently verified');
  // Independently bind receipt to exact operator-configured original grace cutoff.
  const roster=pinnedIssuerRoster878(env.ROSIE_CLOSURE_TRUSTED_ED25519_KEYS_JSON);
  if(!roster.ok)return fail('Operator pinned multi-key roster missing',503);
  const keys=await Promise.all(roster.rows.map(async x=>({...x,
   key_id:await pinnedKeyId878(x.public_jwk)})));
  const old=keys.find(x=>x.key_id===proof.previous_issuer_key_id&&x.status==='previous');
  const active=keys.find(x=>x.key_id===proof.active_issuer_key_id&&x.status==='active');
  if(!old||!active||old.verify_until!==proof.previous_grace_until||
    Date.parse(old.verify_until)<=Date.now())
   return fail('Current deployed grace interval or new active pin changed; HOLD');
  const r=await fetch(env.SUPABASE_URL.replace(/\/+$/,'')+
   '/rest/v1/rpc/rosie880_append_rotation_receipt',{method:'POST',redirect:'error',
   headers:{...serviceHeaders(env),Prefer:'return=representation'},
   body:JSON.stringify({p_id:crypto.randomUUID(),p_draft_id:body.draft_id,p_actor:actor,
    p_original_artifact_sha256:body.artifact.integrity.digest_sha256,
    p_previous_issuer_key_id:proof.previous_issuer_key_id,
    p_active_issuer_key_id:proof.active_issuer_key_id,
    p_owner_note:body.owner_note.trim(),p_grace_issued_before:old.issued_before,
    p_grace_verify_until:old.verify_until})});
  const val=await r.json().catch(()=>null);
  if(!r.ok||!Array.isArray(val)||val.length!==1||
    !['SUPERVISED_ROTATION_READBACK_APPENDED','EXISTING_VERIFIED_ROTATION_READBACK'].includes(val[0].outcome)||
    !/^[a-f0-9]{64}$/.test(val[0].record_sha256||''))
   return fail('Original immutable rotation readback receipt not committed',503);
  return json({ok:true,build:880,state:val[0].outcome,persisted:true,
   record_id:val[0].record_id,receipt_sha256:val[0].record_sha256,
   recorded_at:val[0].recorded_at,grace_verify_until:old.verify_until,
   existing_receipt_reused:val[0].outcome==='EXISTING_VERIFIED_ROTATION_READBACK',
   original_historical_proof_verified:true,
   cloudflare_change_or_external_witness_not_inferred:true,
   no_key_payment_or_case_mutation:true},200,h);
 }catch{return fail('Original signed ceremony receipt source unavailable; HOLD',503);}
}
export const onRequestOptions=()=>fail('Original owner POST required',405);
