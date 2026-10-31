import {unresolvedOwnerFeedback716} from './quote-owner-feedback-v716.mjs';
import {crossDeviceReceipt717} from './quote-owner-crossdevice-v717.mjs';

const bytes=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
const sha256=async(input,provider)=>[...new Uint8Array(await provider.subtle.digest('SHA-256',input))]
  .map(v=>v.toString(16).padStart(2,'0')).join('');

export function shiftConnectionTrial718(shift,availability,staffId,window,attempted,now=new Date()){
  return {kind:'rosie_actual_shift_provider_connection_trial',schema:1,build:718,
    observed_at:now.toISOString(),staff_user_id:staffId,window,
    provider_configured:shift?.source!=='not_configured',
    provider_get_attempted:Boolean(attempted),
    provider_response_received:Boolean(attempted&&shift?.provider_fetch_completed),
    provider_payload_sha256:shift?.provider_payload_sha256||null,
    provider_source_revision:shift?.source_revision||null,
    shift_verified:shift?.shift_schedule_verified===true,
    absence_block_hold:availability?.hard_hold===true,
    verdict:!attempted?'NOT_CONFIGURED':
      shift?.shift_schedule_verified===true&&!availability?.hard_hold?'SOURCE_REPORTED_APPROVED_SHIFT':'HOLD',
    real_provider_authority_independently_certified:false,
    credentials_exposed:false,booking_mutated:false,customer_notified:false,
    grants_consent:false,proof_b_authorized:false};
}

export async function verifyCustodyWitness718(envelope,env,signerAudit,provider=globalThis.crypto,now=new Date()){
  const fail=reason=>({ok:false,reason,build:718,independent_person_verified:false,
    proof_b_authorized:false,any_custody_transfer_authorized:false});
  if(!signerAudit?.server_signature_test_passed||!signerAudit?.public_key_sha256)
    return fail('The server export key is unavailable or failed its self-test.');
  if(!env?.ROSIE_EXPORT_CUSTODY_WITNESS_PUBLIC_JWK||!env?.ROSIE_EXPORT_CUSTODY_WITNESS_ID)
    return fail('A separately controlled, pinned witness public key and witness ID are not configured.');
  if(!envelope||envelope.signature_algorithm!=='Ed25519'||
    !/^[A-Za-z0-9+/]{1,16000}={0,2}$/.test(envelope.payload_base64||'')||
    !/^[A-Za-z0-9+/]{1,200}={0,2}$/.test(envelope.signature_base64||''))
    return fail('The actual signed witness envelope is missing or malformed.');
  try{
    const witness=JSON.parse(env.ROSIE_EXPORT_CUSTODY_WITNESS_PUBLIC_JWK);
    const signer=JSON.parse(env.ROSIE_FOLLOWUP_EXPORT_ED25519_PRIVATE_JWK);
    if(witness.kty!=='OKP'||witness.crv!=='Ed25519'||!witness.x||witness.d||
      witness.x===signer.x||env.ROSIE_EXPORT_CUSTODY_WITNESS_ID===signerAudit.signer_id)
      return fail('Witness key is invalid or not distinct from the server signing key.');
    const message=bytes(envelope.payload_base64),signature=bytes(envelope.signature_base64);
    if(message.length>12000||signature.length!==64)return fail('The signed witness payload is too large or malformed.');
    const key=await provider.subtle.importKey('jwk',witness,{name:'Ed25519'},false,['verify']);
    if(!await provider.subtle.verify('Ed25519',key,signature,message))
      return fail('Signature could not be verified against the configured witness key.');
    const payload=JSON.parse(new TextDecoder().decode(message)),when=Date.parse(payload.witnessed_at||'');
    if(payload.type!=='rosie_export_signer_custody_witness'||
      payload.scope!=='internal_export_key_only'||
      payload.witness_id!==env.ROSIE_EXPORT_CUSTODY_WITNESS_ID||
      payload.subject_signer_id!==signerAudit.signer_id||
      payload.subject_public_key_sha256!==signerAudit.public_key_sha256||
      !Number.isFinite(when)||when>now.getTime()+300000||
      now.getTime()-when>30*86400000)
      return fail('Witness scope, signer fingerprint, identity or freshness does not match the live server key.');
    return {ok:true,kind:'rosie_verified_witness_signature_intake',build:718,
      verified_at:now.toISOString(),witnessed_at:payload.witnessed_at,
      witness_id:payload.witness_id,subject_signer_id:payload.subject_signer_id,
      subject_public_key_sha256:payload.subject_public_key_sha256,
      signed_payload_sha256:await sha256(message,provider),
      signature_verified_against_pinned_key:true,
      independent_person_verified:false,legal_custody_attested_by_application:false,
      proof_b_authorized:false,any_custody_transfer_authorized:false,
      grants_consent:false};
  }catch{return fail('Unable to parse or verify the actual witness envelope.');}
}

export async function evaluateOwnerDevices718(body,actor,provider=globalThis.crypto,now=new Date()){
  if(!body||body.explicit_owner_retest_confirmed!==true)return null;
  const keys=['original_feedback_json','desktop_feedback_json','mobile_feedback_json'];
  if(!keys.every(k=>typeof body[k]==='string'&&body[k].length>0&&body[k].length<=100000))return null;
  try{
    const original=unresolvedOwnerFeedback716(JSON.parse(body.original_feedback_json));
    const desktop=JSON.parse(body.desktop_feedback_json),mobile=JSON.parse(body.mobile_feedback_json);
    const hash=async str=>sha256(new TextEncoder().encode(str),provider);
    const review=crossDeviceReceipt717(await hash(body.original_feedback_json),original,
      {receipt:desktop,hash:await hash(body.desktop_feedback_json)},
      {receipt:mobile,hash:await hash(body.mobile_feedback_json)},body.remediation_note,now);
    if(!review||!actor?.id||actor.role_code!=='admin')return null;
    return {...review,kind:'owner_authenticated_cross_device_receipt_review',
      manager_staff_user_id:actor.id,server_receipt_structure_checked:true,
      server_acceptance_persisted:false,device_origin_independently_verified:false,
      any_publication_approval_recorded:false,source_receipts_locally_supplied:true,
      independent_witness_verified:false};
  }catch{return null;}
}
