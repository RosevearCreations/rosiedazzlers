// Review-only Build 722 receipts. None of these functions contacts or changes a database.
const clean=v=>String(v??'').trim();
const sha=/^[a-f0-9]{64}$/;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const safeNote=v=>clean(v).length>=20&&clean(v).length<=300&&
  !/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(clean(v))&&
  !/\+?\d[\d().\-\s]{7,}\d/.test(clean(v));
const decode=v=>Uint8Array.from(atob(v),c=>c.charCodeAt(0));
const digest=async(bytes,provider)=>[...new Uint8Array(await provider.subtle.digest('SHA-256',bytes))]
  .map(n=>n.toString(16).padStart(2,'0')).join('');
const fresh=(timestamp,now)=>Number.isFinite(Date.parse(timestamp||''))&&
  Date.parse(timestamp)<=now.getTime()+300000&&now.getTime()-Date.parse(timestamp)<=30*86400000;

export const PRIVATE_LEDGER_DRY_RUN722=Object.freeze({
  artifact:'docs/schema/build722_private_ledger_rollback_dry_run.sql',
  target_schema:'rosie_private',target_table:'owner_evidence_ledger',
  second_table:'provider_source_drift_history',
  execution_mode:'REVIEW_ONLY_SQL_SCRIPT_NOT_EXECUTED',
  required_transaction_end:'ROLLBACK',
  requires_confirmed_nonproduction_database:true,
  requires_independent_role_and_rls_test:true,
  requires_security_advisors:true,
  service_role_bypass_is_not_rls_approval:true,
  forbidden_data:['original_device_images','raw_roster','bearer_tokens','customer_contact'],
  actual_migration_created:false,permanent_storage_enabled:false
});

// Unlike the Build 720 verifier, this recognizes a bounded Build 721 receipt.
// The public JWK in a file is never authority: it must match the *current* server pin.
export async function verifyScopedSignedReceipt722(envelope,kind,build,env,audit,
  provider=globalThis.crypto,now=new Date()){
  const fail=reason=>({ok:false,reason,status:'HELD',receipt_found_on_server:false});
  if(!audit?.server_signature_test_passed||!sha.test(audit.public_key_sha256||'')||
    ![720,721,722].includes(build)||!envelope||envelope.signature_algorithm!=='Ed25519'||
    !/^[A-Za-z0-9+/]{1,24000}={0,2}$/.test(envelope.receipt_base64||'')||
    !/^[A-Za-z0-9+/]{1,200}={0,2}$/.test(envelope.signature_base64||''))
    return fail('An original scoped current-key signed receipt and live signer audit are required.');
  try{
    const configured=JSON.parse(env.ROSIE_FOLLOWUP_EXPORT_ED25519_PRIVATE_JWK||'{}');
    if(configured.kty!=='OKP'||configured.crv!=='Ed25519'||!configured.x||
      envelope.signer_id!==env.ROSIE_FOLLOWUP_EXPORT_SIGNER_ID||
      envelope.public_key_jwk?.x!==configured.x||envelope.public_key_jwk?.d)
      return fail('Current signer key identity does not match the original envelope.');
    const bytes=decode(envelope.receipt_base64),sig=decode(envelope.signature_base64);
    if(bytes.length>16000||sig.length!==64)return fail('Receipt bounds exceeded.');
    const key=await provider.subtle.importKey('jwk',
      {kty:'OKP',crv:'Ed25519',x:configured.x},{name:'Ed25519'},false,['verify']);
    if(!await provider.subtle.verify('Ed25519',key,sig,bytes))return fail('Receipt signature invalid.');
    const receipt=JSON.parse(new TextDecoder().decode(bytes));
    if(receipt.kind!==kind||receipt.build!==build||receipt.proof_b_authorized!==false||
      !fresh(receipt.reviewed_at||receipt.checked_at,now))return fail('Receipt type, version, age or scope mismatch.');
    return {ok:true,receipt,receipt_sha256:await digest(bytes,provider),
      signer_fingerprint:audit.public_key_sha256};
  }catch{return fail('Receipt is malformed or cannot be verified securely.');}
}

export function privateLedgerDryRun722(security,gate,actor,env,policy,now=new Date()){
  const s=security?.receipt,g=gate?.receipt;
  if(!security?.ok||!gate?.ok||s?.kind!=='rosie_owner_evidence_ledger_security_review'||
    s.build!==721||s.status!=='OWNER_LEDGER_SECURITY_REVIEW_HELD'||
    g?.kind!=='rosie_owner_evidence_ledger_approval_gate'||g.build!==720||
    g.status!=='LEDGER_APPROVAL_GATE_HELD'||
    s.verified_signed_gate_sha256!==gate.receipt_sha256||
    s.source_owner_request_sha256!==g.signed_owner_request_sha256||
    s.proposed_retention_days!==g.proposed_retention_days||
    ![7,30,90].includes(g.proposed_retention_days)||
    !uuid.test(actor?.id)||actor.role_code!=='admin'||
    actor.id!==clean(env?.ROSIE_OWNER_EVIDENCE_LEDGER_SECURITY_REVIEWER_STAFF_ID)||
    actor.id!==s.independent_security_reviewer_staff_user_id||
    actor.id===g.owner_admin_staff_user_id||actor.id===g.reviewer_staff_user_id||
    s.ledger_activated!==false||s.schema_deployed!==false||g.ledger_activated!==false||
    !sha.test(g.signed_owner_request_sha256||'')||
    policy?.acknowledge_rollback_only!==true||!safeNote(policy?.review_note))return null;
  return {kind:'rosie_private_ledger_schema_dry_run_review',build:722,
    reviewed_at:now.toISOString(),status:'PRIVATE_LEDGER_SCHEMA_DRY_RUN_PREPARED_HELD',
    security_reviewer_staff_user_id:actor.id,
    signed_security_review_sha256:security.receipt_sha256,
    signed_original_gate_sha256:gate.receipt_sha256,
    original_owner_request_sha256:g.signed_owner_request_sha256,
    proposed_retention_days:g.proposed_retention_days,
    blueprint:PRIVATE_LEDGER_DRY_RUN722,review_note:clean(policy.review_note),
    sql_executed:false,transaction_started:false,transaction_rolled_back:false,
    db_instance_identified:false,actual_grants_checked:false,rls_policies_tested:false,
    advisors_checked:false,migration_applied:false,ledger_activated:false,
    owner_approval_verified:false,proof_b_authorized:false};
}

export function rotationWitnessProvenance722(signedException,rechecked,actor,env,policy,now=new Date()){
  const e=signedException?.receipt;
  if(!signedException?.ok||!rechecked?.ok||
    rechecked.status!=='PINNED_OLD_SIGNATURE_AND_ROTATION_WITNESS_VERIFIED_HELD'||
    e?.kind!=='rosie_rotated_custody_receipt_exception'||e.build!==721||
    e.status!=='PINNED_OLD_SIGNATURE_AND_ROTATION_WITNESS_VERIFIED_HELD'||
    e.independent_signature_valid!==true||e.external_custodian_approval_recorded!==false||
    !uuid.test(actor?.id)||actor.role_code!=='admin'||
    actor.id!==clean(env?.ROSIE_EXPORT_CUSTODY_ROTATION_REVIEWER_STAFF_ID)||
    e.reviewer_staff_user_id!==actor.id||
    e.subject_receipt_sha256!==rechecked.subject_receipt_sha256||
    e.witness_payload_sha256!==rechecked.witness_payload_sha256||
    e.current_signer_fingerprint!==rechecked.current_signer_fingerprint||
    e.previous_signer_fingerprint!==rechecked.previous_signer_fingerprint||
    e.witness_id!==rechecked.witness_id||
    !sha.test(e.witness_payload_sha256||'')||!sha.test(signedException.receipt_sha256||'')||
    policy?.acknowledge_no_external_identity!==true||!safeNote(policy.review_note))return null;
  return {kind:'rosie_rotation_witness_provenance_intake',build:722,
    reviewed_at:now.toISOString(),status:'ROTATION_WITNESS_PROVENANCE_VERIFIED_EXTERNAL_REVIEW_HELD',
    reviewer_staff_user_id:actor.id,original_exception_sha256:signedException.receipt_sha256,
    subject_receipt_sha256:e.subject_receipt_sha256,witness_payload_sha256:e.witness_payload_sha256,
    pinned_witness_id:e.witness_id,current_signer_fingerprint:e.current_signer_fingerprint,
    previous_signer_fingerprint:e.previous_signer_fingerprint,
    cryptographic_provenance_rechecked:true,review_note:clean(policy.review_note),
    independent_human_identity_verified:false,external_custody_accepted:false,
    old_signer_reauthorized:false,evidence_persisted:false,proof_b_authorized:false};
}

export function ownerRetentionReconciliation722(gate,security,actor,env,policy,now=new Date()){
  const g=gate?.receipt,s=security?.receipt,
    choice=clean(policy?.decision),days=Number(policy?.retention_days);
  if(!gate?.ok||!security?.ok||g?.kind!=='rosie_owner_evidence_ledger_approval_gate'||
    s?.kind!=='rosie_owner_evidence_ledger_security_review'||
    g.build!==720||s.build!==721||g.status!=='LEDGER_APPROVAL_GATE_HELD'||
    !['OWNER_LEDGER_SECURITY_REVIEW_HELD','OWNER_LEDGER_SECURITY_PROPOSAL_REJECTED'].includes(s.status)||
    s.verified_signed_gate_sha256!==gate.receipt_sha256||
    s.source_owner_request_sha256!==g.signed_owner_request_sha256||
    s.proposed_retention_days!==g.proposed_retention_days||
    !uuid.test(actor?.id)||actor.role_code!=='admin'||actor.id!==g.owner_admin_staff_user_id||
    actor.id===s.independent_security_reviewer_staff_user_id||
    s.independent_security_reviewer_staff_user_id!==
      clean(env?.ROSIE_OWNER_EVIDENCE_LEDGER_SECURITY_REVIEWER_STAFF_ID)||
    !['hold_for_external_approval','request_shorter_retention','reject_storage'].includes(choice)||
    ![7,30,90].includes(days)||days>g.proposed_retention_days||
    (choice==='request_shorter_retention'&&days>=g.proposed_retention_days)||
    (s.status==='OWNER_LEDGER_SECURITY_PROPOSAL_REJECTED'&&choice!=='reject_storage')||
    policy?.acknowledge_no_storage!==true||!safeNote(policy?.review_note)||
    g.ledger_activated!==false||s.ledger_activated!==false)return null;
  return {kind:'rosie_owner_ledger_retention_reconciliation',build:722,
    reviewed_at:now.toISOString(),status:choice==='reject_storage'? 'OWNER_STORAGE_REJECTED_NO_ACTIVATION':
      'OWNER_RETENTION_DECISION_RECONCILED_EXTERNAL_APPROVAL_HELD',
    owner_staff_user_id:actor.id,original_gate_sha256:gate.receipt_sha256,
    independent_security_review_sha256:security.receipt_sha256,
    original_owner_request_sha256:g.signed_owner_request_sha256,
    previously_proposed_days:g.proposed_retention_days,owner_requested_max_days:days,
    decision:choice,review_note:clean(policy.review_note),
    independent_security_reviewer_staff_user_id:s.independent_security_reviewer_staff_user_id,
    separate_security_approval_received:false,retention_purge_test_passed:false,
    backup_purge_approved:false,history_storage_enabled:false,
    schema_deployed:false,hashes_persisted:false,raw_files_persisted:false,
    ledger_activated:false,proof_b_authorized:false};
}
