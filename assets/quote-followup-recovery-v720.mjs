// Authenticated verification and comparisons; no cross-app proof or permanent writes.
const clean=v=>String(v??'').trim();
const hex=/^[a-f0-9]{64}$/;
const noContactDetails=text=>!/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text)&&
  !/\+?\d[\d().\-\s]{7,}\d/.test(text);
const decode=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
const digest=async(bytes,cryptoProvider=globalThis.crypto)=>[...new Uint8Array(await cryptoProvider.subtle.digest('SHA-256',bytes))]
  .map(n=>n.toString(16).padStart(2,'0')).join('');
const validTime=(value,now)=>Number.isFinite(Date.parse(value||''))&&
  Date.parse(value)<=now.getTime()+300000&&now.getTime()-Date.parse(value)<=30*86400000;

export async function verifySignedEvidence720(envelope,expectedKind,env,audit,
  cryptoProvider=globalThis.crypto,now=new Date()){
  const fail=reason=>({ok:false,status:'HOLD',reason,build:720,server_record_found:false});
  if(!audit?.server_signature_test_passed||!hex.test(audit.public_key_sha256||''))
    return fail('A current internal signer self-test is required for exact-key recovery.');
  if(!envelope||envelope.signature_algorithm!=='Ed25519'||
    !/^[A-Za-z0-9+/]{1,24000}={0,2}$/.test(envelope.receipt_base64||'')||
    !/^[A-Za-z0-9+/]{1,200}={0,2}$/.test(envelope.signature_base64||''))
    return fail('An original signed export envelope is required.');
  try{
    const signer=JSON.parse(env.ROSIE_FOLLOWUP_EXPORT_ED25519_PRIVATE_JWK);
    if(!signer?.x||envelope.signer_id!==env.ROSIE_FOLLOWUP_EXPORT_SIGNER_ID||
      envelope.public_key_jwk?.x!==signer.x||envelope.public_key_jwk?.d)
      return fail('Signer identity or public key has drifted; exact-key recovery is HELD.');
    const bytes=decode(envelope.receipt_base64),sig=decode(envelope.signature_base64);
    if(bytes.length>16000||sig.length!==64)return fail('Signed evidence exceeds its bounded size.');
    const key=await cryptoProvider.subtle.importKey('jwk',{kty:'OKP',crv:'Ed25519',x:signer.x},
      {name:'Ed25519'},false,['verify']);
    if(!await cryptoProvider.subtle.verify('Ed25519',key,sig,bytes))
      return fail('The original signature is invalid.');
    const receipt=JSON.parse(new TextDecoder().decode(bytes));
    const stamp=receipt.checked_at||receipt.decided_at||receipt.decision_at;
    if(receipt.kind!==expectedKind||!validTime(stamp,now)||receipt.proof_b_authorized!==false||
      receipt.build<719||receipt.build>720)
      return fail('The signed receipt kind, scope, age or version is not acceptable.');
    return {ok:true,build:720,status:'EXACT_INTERNAL_SIGNATURE_VERIFIED',receipt,
      receipt_sha256:await digest(bytes,cryptoProvider),
      signer_id:envelope.signer_id,signer_fingerprint:audit.public_key_sha256,
      independently_custodied:false,server_record_found:false,proof_b_authorized:false};
  }catch{return fail('Cannot decode or verify the original signed evidence.');}
}

export function providerDriftComparison720(previous,current,now=new Date()){
  const base={kind:'rosie_provider_binding_drift_comparison',build:720,checked_at:now.toISOString(),
    status:'HOLD',alert_level:'hold',alerts_sent:false,automatic_monitoring_enabled:false,
    authorizes_reassignment:false,proof_b_authorized:false};
  if(previous?.kind!=='rosie_shift_provider_production_binding_readback'||
    previous.live_source_bound!==true||!validTime(previous.checked_at,now)||
    !previous.staff_user_id||previous.staff_user_id!==current?.staff_user_id||
    previous.window?.start_at!==current?.window?.start_at||
    previous.window?.end_at!==current?.window?.end_at||
    !hex.test(previous.pinned_origin_sha256||'')||!hex.test(previous.source_account_ref_sha256||'')||
    !hex.test(previous.source_payload_sha256||''))
    return {...base,status:'INVALID_OR_STALE_SIGNED_BASELINE'};
  const summary={...base,baseline_checked_at:previous.checked_at,
    baseline_source_revision:previous.source_revision,
    current_source_revision:current?.source_revision||null,
    baseline_source_sha256:previous.source_payload_sha256,
    current_source_sha256:current?.source_payload_sha256||null,
    current_source_generated_at:current?.source_generated_at||null};
  if(!current?.live_source_bound)return {...summary,status:'CURRENT_PROVIDER_BINDING_HOLD',alert_level:'critical'};
  if(previous.pinned_origin_sha256!==current.pinned_origin_sha256||
    previous.source_account_ref_sha256!==current.source_account_ref_sha256)
    return {...summary,status:'PROVIDER_OR_ACCOUNT_PIN_DRIFT',alert_level:'critical'};
  if(!validTime(current.source_generated_at,now)||
    now.getTime()-Date.parse(current.source_generated_at)>12*3600000)
    return {...summary,status:'CURRENT_PROVIDER_SOURCE_STALE',alert_level:'critical'};
  if(previous.source_payload_sha256!==current.source_payload_sha256||
    previous.source_revision!==current.source_revision)
    return {...summary,status:'ROSTER_CONTENT_OR_REVISION_CHANGED_REVIEW',alert_level:'review'};
  return {...summary,status:'NO_DRIFT_OBSERVED',alert_level:'none'};
}

export function recoverCustodyDisposition720(signed,actor,env,now=new Date()){
  const receipt=signed?.receipt;
  if(!signed?.ok||receipt?.kind!=='rosie_internal_export_custody_review_disposition'||
    receipt.reviewer_staff_user_id!==clean(actor?.id)||
    receipt.reviewer_staff_user_id!==clean(env?.ROSIE_EXPORT_CUSTODY_REVIEWER_STAFF_ID)||
    receipt.receipt_saved_on_server!==false||receipt.witness_signature_verified!==true||
    !hex.test(receipt.witness_signed_payload_sha256||'')||
    !['INTERNAL_EXPORT_REVIEW_ACCEPTED','INDEPENDENT_FOLLOWUP_REQUIRED'].includes(receipt.status))
    return null;
  return {kind:'rosie_custody_reviewer_receipt_recovery',build:720,
    recovered_at:now.toISOString(),status:'ORIGINAL_INTERNAL_SIGNATURE_AND_REVIEWER_MATCH',
    reviewer_staff_user_id:actor.id,original_disposition:receipt.status,
    original_receipt_sha256:signed.receipt_sha256,
    witness_signed_payload_sha256:receipt.witness_signed_payload_sha256,
    independent_evidence_reference:receipt.independent_evidence_reference,
    server_record_found:false,independent_human_identity_verified:false,
    re_signing_performed:false,proof_b_authorized:false,alerts_sent:false};
}

export function ownerLedgerApprovalGate720(signed,actor,env,policy,now=new Date()){
  const r=signed?.receipt,reviewer=clean(env?.ROSIE_OWNER_EVIDENCE_LEDGER_REVIEWER_STAFF_ID),
    uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if(!signed?.ok||r?.kind!=='rosie_owner_device_evidence_retention_decision'||
    r.decision!=='PROTECTED_HASH_LEDGER_REQUEST_HELD'||r.hashes_persisted!==false||
    ![r.source_feedback_sha256,r.desktop_feedback_sha256,r.mobile_feedback_sha256].every(x=>hex.test(x||''))||
    !uuid.test(reviewer)||actor?.id!==reviewer||reviewer===r.owner_admin_staff_user_id||
    actor.role_code!=='admin'||policy?.acknowledge_not_activated!==true||
    policy?.evidence_mode!=='hashes_only'||
    !Number.isInteger(policy.retention_days)||policy.retention_days<1||policy.retention_days>90||
    !['request_schema_security_review','reject_ledger_request'].includes(policy.review_decision)||
    clean(policy.review_note).length<20||clean(policy.review_note).length>300||
    !noContactDetails(clean(policy.review_note)))
    return null;
  return {kind:'rosie_owner_evidence_ledger_approval_gate',build:720,
    reviewed_at:now.toISOString(),status:policy.review_decision==='reject_ledger_request'?
      'LEDGER_REQUEST_REJECTED':'LEDGER_APPROVAL_GATE_HELD',
    reviewer_staff_user_id:reviewer,owner_admin_staff_user_id:r.owner_admin_staff_user_id,
    signed_owner_request_sha256:signed.receipt_sha256,
    proposed_retention_days:policy.retention_days,evidence_mode:'hashes_only',
    review_decision:policy.review_decision,review_note:clean(policy.review_note),
    security_and_rls_review_completed:false,append_only_store_approved:false,
    schema_deployed:false,independent_approval_persisted:false,
    raw_files_persisted:false,hashes_persisted:false,ledger_activated:false,
    grants_consent:false,proof_b_authorized:false};
}
