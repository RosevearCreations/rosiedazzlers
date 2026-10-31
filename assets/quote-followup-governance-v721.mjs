// Security-design receipts only. No database migrations, writes, activation or Proof-B.
const clean=value=>String(value??'').trim();
const sha=/^[a-f0-9]{64}$/;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const contact=text=>/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text)||
  /\+?\d[\d().\-\s]{7,}\d/.test(text);
const validNote=text=>clean(text).length>=20&&clean(text).length<=300&&!contact(clean(text));
const decode=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
const digest=async(bytes,cryptoProvider)=>[...new Uint8Array(await cryptoProvider.subtle.digest('SHA-256',bytes))]
  .map(n=>n.toString(16).padStart(2,'0')).join('');
const fresh=(value,age,now)=>Number.isFinite(Date.parse(value||''))&&
  Date.parse(value)<=now.getTime()+300000&&now.getTime()-Date.parse(value)<=age;
const isEnvelope=e=>e?.signature_algorithm==='Ed25519'&&
  /^[A-Za-z0-9+/]{1,24000}={0,2}$/.test(e.receipt_base64||e.payload_base64||'')&&
  /^[A-Za-z0-9+/]{1,200}={0,2}$/.test(e.signature_base64||'');

export const SOURCE_DRIFT_HISTORY_DESIGN721=Object.freeze({
  proposed_private_schema:'rosie_private',proposed_table:'provider_source_drift_history',
  schema_exposed_to_data_api:false,backend_only_access:true,
  columns:['id','occurred_at','staff_user_id','window_start_at','window_end_at',
    'baseline_receipt_sha256','current_source_sha256','provider_origin_pin_sha256',
    'provider_account_pin_sha256','drift_status','severity','retention_expires_at',
    'actor_staff_user_id','server_signer_fingerprint'],
  raw_provider_response_allowed:false,api_secrets_allowed:false,customer_contact_allowed:false,
  recommended_append_only:true,deny_update_delete_to_application:true,
  require_separate_rls_and_grants_review:true,require_retention_cleanup_review:true,
  require_restoration_test:true,require_db_advisors:true,
  deployment_status:'DESIGN_ONLY_NOT_MIGRATED'});

export function sourceHistoryDesign721(signed,comparison,actor,policy,now=new Date()){
  if(!signed?.ok||signed.receipt?.kind!=='rosie_shift_provider_production_binding_readback'||
    !uuid.test(actor?.id)||actor.role_code!=='admin'||
    comparison?.kind!=='rosie_provider_binding_drift_comparison'||
    comparison.status==='INVALID_OR_STALE_SIGNED_BASELINE'||
    comparison.alert_level==='hold'||!sha.test(signed.receipt_sha256||'')||
    ![7,30,90].includes(policy?.retention_days)||
    policy?.acknowledge_no_storage!==true||!validNote(policy?.review_note))return null;
  return {kind:'rosie_provider_source_drift_history_design_review',build:721,
    reviewed_at:now.toISOString(),status:'HISTORY_PERSISTENCE_DESIGN_HELD',
    reviewer_staff_user_id:actor.id,
    original_signed_baseline_sha256:signed.receipt_sha256,
    staff_user_id:signed.receipt.staff_user_id,window:signed.receipt.window,
    latest_drift_status:comparison.status,latest_alert_level:comparison.alert_level,
    baseline_source_sha256:comparison.baseline_source_sha256||null,
    current_source_sha256:comparison.current_source_sha256||null,
    proposed_retention_days:policy.retention_days,review_note:clean(policy.review_note),
    schema_design:SOURCE_DRIFT_HISTORY_DESIGN721,
    database_deployed:false,history_rows_persisted:0,approval_persisted:false,
    automation_enabled:false,alerts_sent:false,customer_notified:false,
    owner_approval_verified:false,independent_privacy_review_verified:false,
    proof_b_authorized:false};
}

// A historical key is never trusted just because it appears in an uploaded file.
// It must be explicitly pinned by the operator *and* accompanied by a scoped,
// fresh rotation witness signature from an independently configured public key.
export async function rotatedCustodyException721(oldEnvelope,witnessEnvelope,actor,env,
  currentAudit,cryptoProvider=globalThis.crypto,now=new Date()){
  const fail=reason=>({ok:false,kind:'rosie_rotated_custody_receipt_exception',build:721,
    status:'ROTATED_SIGNER_RECOVERY_HELD',reason,proof_b_authorized:false,
    custodian_approved:false,previous_key_automatically_trusted:false});
  if(!currentAudit?.server_signature_test_passed||!sha.test(currentAudit.public_key_sha256||''))
    return fail('A live current signer self-test must pass.');
  const reviewer=clean(env?.ROSIE_EXPORT_CUSTODY_ROTATION_REVIEWER_STAFF_ID);
  if(!uuid.test(reviewer)||actor?.role_code!=='admin'||actor.id!==reviewer||
    reviewer===clean(env?.ROSIE_FOLLOWUP_EXPORT_SIGNER_STAFF_ID))
    return fail('A separately pinned, signed-in rotation reviewer is required.');
  if(!isEnvelope(oldEnvelope)||!isEnvelope(witnessEnvelope)||
    !env?.ROSIE_FOLLOWUP_EXPORT_PREVIOUS_ED25519_PUBLIC_JWK||
    !env?.ROSIE_FOLLOWUP_EXPORT_PREVIOUS_SIGNER_ID||
    !env?.ROSIE_EXPORT_CUSTODY_WITNESS_PUBLIC_JWK||
    !env?.ROSIE_EXPORT_CUSTODY_WITNESS_ID)
    return fail('Original receipt, witness and pinned prior/current key references are required.');
  try{
    const old=JSON.parse(env.ROSIE_FOLLOWUP_EXPORT_PREVIOUS_ED25519_PUBLIC_JWK),
      witness=JSON.parse(env.ROSIE_EXPORT_CUSTODY_WITNESS_PUBLIC_JWK),
      current=JSON.parse(env.ROSIE_FOLLOWUP_EXPORT_ED25519_PRIVATE_JWK);
    if([old,witness].some(k=>k?.kty!=='OKP'||k.crv!=='Ed25519'||!k.x||k.d)||
      old.x===current.x||witness.x===old.x||witness.x===current.x||
      clean(env.ROSIE_FOLLOWUP_EXPORT_PREVIOUS_SIGNER_ID)===currentAudit.signer_id||
      oldEnvelope.signer_id!==clean(env.ROSIE_FOLLOWUP_EXPORT_PREVIOUS_SIGNER_ID)||
      oldEnvelope.public_key_jwk?.x!==old.x||oldEnvelope.public_key_jwk?.d)
      return fail('Prior signing key, current signer or independent witness pin is invalid.');
    const oldBytes=decode(oldEnvelope.receipt_base64),oldSig=decode(oldEnvelope.signature_base64),
      witnessBytes=decode(witnessEnvelope.payload_base64),witnessSig=decode(witnessEnvelope.signature_base64);
    if(oldBytes.length>16000||oldSig.length!==64||witnessBytes.length>12000||witnessSig.length!==64)
      return fail('Original files exceed the bounded signed-evidence limits.');
    const oldKey=await cryptoProvider.subtle.importKey('jwk',old,{name:'Ed25519'},false,['verify']);
    if(!await cryptoProvider.subtle.verify('Ed25519',oldKey,oldSig,oldBytes))
      return fail('Prior-key signature was altered or could not be verified.');
    const receipt=JSON.parse(new TextDecoder().decode(oldBytes));
    if(receipt.kind!=='rosie_internal_export_custody_review_disposition'||receipt.build!==719||
      receipt.reviewer_staff_user_id!==clean(env.ROSIE_EXPORT_CUSTODY_REVIEWER_STAFF_ID)||
      receipt.receipt_saved_on_server!==false||receipt.witness_signature_verified!==true||
      !sha.test(receipt.witness_signed_payload_sha256||'')||
      !['INTERNAL_EXPORT_REVIEW_ACCEPTED','INDEPENDENT_FOLLOWUP_REQUIRED'].includes(receipt.status)||
      receipt.proof_b_authorized!==false||!fresh(receipt.decided_at,90*86400000,now)||
      !fresh(env.ROSIE_FOLLOWUP_EXPORT_PREVIOUS_KEY_RETIRED_AT,90*86400000,now)||
      Date.parse(receipt.decided_at)>Date.parse(env.ROSIE_FOLLOWUP_EXPORT_PREVIOUS_KEY_RETIRED_AT)+300000)
      return fail('The historical receipt or configured key-retirement window is outside the approved scope.');
    const witnessKey=await cryptoProvider.subtle.importKey('jwk',witness,{name:'Ed25519'},false,['verify']);
    if(!await cryptoProvider.subtle.verify('Ed25519',witnessKey,witnessSig,witnessBytes))
      return fail('Independent rotation witness signature is invalid.');
    const payload=JSON.parse(new TextDecoder().decode(witnessBytes));
    const priorFingerprint=await digest(new TextEncoder().encode(JSON.stringify({
      kty:'OKP',crv:'Ed25519',x:old.x})),cryptoProvider),
      oldReceiptHash=await digest(oldBytes,cryptoProvider);
    if(payload.type!=='rosie_export_signer_rotation_exception_witness'||
      payload.scope!=='internal_export_custody_receipt_only'||
      payload.witness_id!==env.ROSIE_EXPORT_CUSTODY_WITNESS_ID||
      payload.previous_signer_id!==env.ROSIE_FOLLOWUP_EXPORT_PREVIOUS_SIGNER_ID||
      payload.previous_public_key_sha256!==priorFingerprint||
      payload.current_signer_id!==currentAudit.signer_id||
      payload.current_public_key_sha256!==currentAudit.public_key_sha256||
      payload.subject_receipt_sha256!==oldReceiptHash||
      payload.rotation_reviewer_staff_user_id!==reviewer||
      !fresh(payload.witnessed_at,7*86400000,now))
      return fail('Rotation witness did not authorize this exact old receipt and current signer.');
    return {ok:true,kind:'rosie_rotated_custody_receipt_exception',build:721,
      status:'PINNED_OLD_SIGNATURE_AND_ROTATION_WITNESS_VERIFIED_HELD',
      checked_at:now.toISOString(),reviewer_staff_user_id:reviewer,
      original_disposition:receipt.status,subject_receipt_sha256:oldReceiptHash,
      previous_signer_id:oldEnvelope.signer_id,previous_signer_fingerprint:priorFingerprint,
      current_signer_fingerprint:currentAudit.public_key_sha256,
      witness_id:payload.witness_id,witness_payload_sha256:await digest(witnessBytes,cryptoProvider),
      independent_signature_valid:true,independent_person_verified:false,
      previous_key_automatically_trusted:false,new_key_reissued_old_receipt:false,
      server_history_found:false,external_custodian_approval_recorded:false,
      authorizes_history_migration:false,proof_b_authorized:false,
      grants_consent:false,alerts_sent:false};
  }catch{return fail('Historical receipt or rotation witness could not be decoded securely.');}
}

export function ownerLedgerSecurityReview721(signed,actor,env,policy,now=new Date()){
  const r=signed?.receipt,reviewer=clean(env?.ROSIE_OWNER_EVIDENCE_LEDGER_SECURITY_REVIEWER_STAFF_ID);
  if(!signed?.ok||r?.kind!=='rosie_owner_evidence_ledger_approval_gate'||r.build!==720||
    r.status!=='LEDGER_APPROVAL_GATE_HELD'||r.ledger_activated!==false||
    r.hashes_persisted!==false||r.security_and_rls_review_completed!==false||
    !sha.test(r.signed_owner_request_sha256||'')||
    ![7,30,90].includes(r.proposed_retention_days)||!sha.test(signed.receipt_sha256||'')||
    !uuid.test(reviewer)||actor?.role_code!=='admin'||actor.id!==reviewer||
    reviewer===r.reviewer_staff_user_id||reviewer===r.owner_admin_staff_user_id||
    reviewer===clean(env?.ROSIE_FOLLOWUP_EXPORT_SIGNER_STAFF_ID)||
    policy?.acknowledge_no_activation!==true||!validNote(policy?.review_note)||
    !['request_private_schema_review','reject_ledger_proposal'].includes(policy?.review_decision))return null;
  return {kind:'rosie_owner_evidence_ledger_security_review',build:721,
    reviewed_at:now.toISOString(),status:policy.review_decision==='reject_ledger_proposal'?
      'OWNER_LEDGER_SECURITY_PROPOSAL_REJECTED':'OWNER_LEDGER_SECURITY_REVIEW_HELD',
    independent_security_reviewer_staff_user_id:reviewer,
    prior_reviewer_staff_user_id:r.reviewer_staff_user_id,
    owner_staff_user_id:r.owner_admin_staff_user_id,
    verified_signed_gate_sha256:signed.receipt_sha256,
    source_owner_request_sha256:r.signed_owner_request_sha256,
    proposed_retention_days:r.proposed_retention_days,
    review_decision:policy.review_decision,review_note:clean(policy.review_note),
    required_security_controls:{private_schema_not_exposed:true,deny_anon_authenticated:true,
      backend_only_scoped_reads:true,append_only_required:true,raw_file_storage_prohibited:true,
      rls_and_grants_review_required:true,retention_purge_and_backup_policy_required:true,
      separate_owner_authorization_required:true,db_advisors_and_live_sql_verification_required:true},
    schema_deployed:false,rls_inspected_live:false,grants_inspected_live:false,
    independent_human_identity_verified:false,approval_persisted:false,
    raw_files_persisted:false,hashes_persisted:false,ledger_activated:false,
    any_gateway_get_authorized:false,proof_b_authorized:false};
}
