// Build 723: verification and disposition only. No SQL, database rows, files or authorizations.
const clean=value=>String(value??'').trim();
const sha=/^[a-f0-9]{64}$/;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const noteOK=value=>clean(value).length>=20&&clean(value).length<=300&&
  !/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(clean(value))&&
  !/\+?\d[\d().\-\s]{7,}\d/.test(clean(value));
const hasRole=(actor,id)=>actor?.role_code==='admin'&&uuid.test(actor?.id||'')&&
  uuid.test(id||'')&&actor.id===id;
export const NONPRODUCTION_LEDGER_SQL723=Object.freeze({
  script:'docs/schema/build722_private_ledger_rollback_dry_run.sql',
  sha256:'f61261377dc79742a95077199265f5d8096f6e34ac1d4089a55473dc4a35e207',
  migration:false,transaction_end:'ROLLBACK',
  production_execution_allowed:false,automatic_execution_allowed:false,
  genuine_independent_review_required:true,private_schema_data_api_check_required:true,
  rls_and_grants_test_required:true,backup_and_purge_review_required:true
});

export function nonproductionExecutionChecklist723(dry,actor,env,policy,now=new Date()){
  const receipt=dry?.receipt,
    reviewer=clean(env?.ROSIE_LEDGER_NONPROD_EXECUTION_REVIEWER_STAFF_ID),
    project=clean(env?.ROSIE_LEDGER_NONPROD_PROJECT_REF),
    proposed=clean(policy?.project_ref);
  let productionProject='';
  try{productionProject=new URL(env?.SUPABASE_URL).hostname.split('.')[0];}catch{return null;}
  if(!dry?.ok||receipt?.kind!=='rosie_private_ledger_schema_dry_run_review'||
    receipt.build!==722||receipt.status!=='PRIVATE_LEDGER_SCHEMA_DRY_RUN_PREPARED_HELD'||
    receipt.sql_executed!==false||receipt.migration_applied!==false||
    receipt.ledger_activated!==false||receipt.owner_approval_verified!==false||
    receipt.blueprint?.artifact!==NONPRODUCTION_LEDGER_SQL723.script||
    receipt.blueprint?.required_transaction_end!=='ROLLBACK'||
    !sha.test(receipt.signed_original_gate_sha256||'')||
    !sha.test(receipt.signed_security_review_sha256||'')||
    !sha.test(dry.receipt_sha256||'')||
    !hasRole(actor,reviewer)||reviewer===receipt.security_reviewer_staff_user_id||
    reviewer===clean(env?.ROSIE_FOLLOWUP_EXPORT_SIGNER_STAFF_ID)||
    !/^[a-z0-9][a-z0-9-]{6,38}[a-z0-9]$/.test(project)||
    proposed!==project||project===productionProject||
    !['request_independent_nonproduction_approval','reject_nonproduction_execution'].includes(policy?.decision)||
    policy?.confirm_no_execution!==true||policy?.confirm_sql_sha256_reviewed!==true||
    !noteOK(policy?.review_note))return null;
  return {kind:'rosie_nonproduction_ledger_execution_authorization_checklist',build:723,
    reviewed_at:now.toISOString(),status:policy.decision==='reject_nonproduction_execution'?
      'NONPRODUCTION_LEDGER_EXECUTION_PROPOSAL_REJECTED':
      'NONPRODUCTION_LEDGER_EXECUTION_AUTHORIZATION_CHECKLIST_HELD',
    execution_reviewer_staff_user_id:reviewer,review_note:clean(policy.review_note),
    signed_dry_run_receipt_sha256:dry.receipt_sha256,
    signed_owner_gate_sha256:receipt.signed_original_gate_sha256,
    signed_security_review_sha256:receipt.signed_security_review_sha256,
    nonproduction_project_ref:project,sql_artifact:NONPRODUCTION_LEDGER_SQL723,
    checklist:{project_pin_matches:true,project_ref_is_not_production:true,
      exact_sql_fingerprint_acknowledged:true,rollback_only_acknowledged:true,
      independently_authorized_to_connect:false,disposable_database_identity_independently_verified:false,
      sql_execution_approved:false,actual_sql_run_verified:false,
      rollback_observed_live:false,rls_grants_verified_live:false,
      data_api_exposure_verified_live:false,supabase_security_advisors_passed:false},
    connected_to_database:false,sql_executed:false,migration_applied:false,
    rows_created:0,ledger_activated:false,proof_b_authorized:false};
}

export function witnessIdentityDisposition723(provenance,exception,actor,env,policy,now=new Date()){
  const p=provenance?.receipt,e=exception?.receipt,
    reviewer=clean(env?.ROSIE_EXPORT_WITNESS_IDENTITY_REVIEWER_STAFF_ID);
  if(!provenance?.ok||!exception?.ok||p?.kind!=='rosie_rotation_witness_provenance_intake'||
    p.build!==722||p.status!=='ROTATION_WITNESS_PROVENANCE_VERIFIED_EXTERNAL_REVIEW_HELD'||
    p.cryptographic_provenance_rechecked!==true||
    e?.kind!=='rosie_rotated_custody_receipt_exception'||e.build!==721||
    e.status!=='PINNED_OLD_SIGNATURE_AND_ROTATION_WITNESS_VERIFIED_HELD'||
    p.original_exception_sha256!==exception.receipt_sha256||
    p.subject_receipt_sha256!==e.subject_receipt_sha256||
    p.witness_payload_sha256!==e.witness_payload_sha256||
    p.pinned_witness_id!==e.witness_id||
    p.current_signer_fingerprint!==e.current_signer_fingerprint||
    p.previous_signer_fingerprint!==e.previous_signer_fingerprint||
    !sha.test(provenance.receipt_sha256||'')||
    !hasRole(actor,reviewer)||reviewer===p.reviewer_staff_user_id||
    reviewer===clean(env?.ROSIE_FOLLOWUP_EXPORT_SIGNER_STAFF_ID)||
    reviewer===clean(env?.ROSIE_EXPORT_CUSTODY_REVIEWER_STAFF_ID)||
    !['request_external_identity_review','defer_external_identity_review','reject_witness_identity_evidence'].includes(policy?.decision)||
    policy?.acknowledge_no_identity_acceptance!==true||!noteOK(policy?.review_note))return null;
  const statuses={request_external_identity_review:'WITNESS_IDENTITY_EXTERNAL_VERIFICATION_PENDING',
    defer_external_identity_review:'WITNESS_IDENTITY_REVIEW_DEFERRED',
    reject_witness_identity_evidence:'WITNESS_IDENTITY_EVIDENCE_REJECTED'};
  return {kind:'rosie_independent_witness_identity_disposition',build:723,
    reviewed_at:now.toISOString(),status:statuses[policy.decision],
    identity_reviewer_staff_user_id:reviewer,
    rotation_reviewer_staff_user_id:p.reviewer_staff_user_id,
    signed_provenance_receipt_sha256:provenance.receipt_sha256,
    signed_rotation_exception_sha256:exception.receipt_sha256,
    pinned_witness_id:p.pinned_witness_id,
    signed_witness_payload_sha256:p.witness_payload_sha256,
    decision:policy.decision,review_note:clean(policy.review_note),
    original_cryptographic_lineage_matches:true,
    external_human_identity_verified:false,independent_authority_accepted:false,
    witness_authorized_to_sign_proof_b:false,custody_approved:false,
    original_evidence_persisted:false,proof_b_authorized:false};
}

export function ownerRetentionExpiry723(reconciliation,gate,security,actor,env,policy,now=new Date()){
  const r=reconciliation?.receipt,g=gate?.receipt,s=security?.receipt,
    days=r?.owner_requested_max_days;
  const rejection=r?.status==='OWNER_STORAGE_REJECTED_NO_ACTIVATION';
  if(!reconciliation?.ok||!gate?.ok||!security?.ok||
    r?.kind!=='rosie_owner_ledger_retention_reconciliation'||r.build!==722||
    !['OWNER_RETENTION_DECISION_RECONCILED_EXTERNAL_APPROVAL_HELD',
      'OWNER_STORAGE_REJECTED_NO_ACTIVATION'].includes(r.status)||
    g?.kind!=='rosie_owner_evidence_ledger_approval_gate'||g.build!==720||
    s?.kind!=='rosie_owner_evidence_ledger_security_review'||s.build!==721||
    g.status!=='LEDGER_APPROVAL_GATE_HELD'||
    !['OWNER_LEDGER_SECURITY_REVIEW_HELD','OWNER_LEDGER_SECURITY_PROPOSAL_REJECTED'].includes(s.status)||
    r.original_gate_sha256!==gate.receipt_sha256||
    r.independent_security_review_sha256!==security.receipt_sha256||
    r.original_owner_request_sha256!==g.signed_owner_request_sha256||
    r.independent_security_reviewer_staff_user_id!==
      clean(env?.ROSIE_OWNER_EVIDENCE_LEDGER_SECURITY_REVIEWER_STAFF_ID)||
    s.verified_signed_gate_sha256!==gate.receipt_sha256||
    s.source_owner_request_sha256!==g.signed_owner_request_sha256||
    !hasRole(actor,g.owner_admin_staff_user_id)||actor.id!==r.owner_staff_user_id||
    ![7,30,90].includes(days)||days>g.proposed_retention_days||
    r.ledger_activated!==false||r.hashes_persisted!==false||
    (rejection!== (r.decision==='reject_storage'))||
    (s.status==='OWNER_LEDGER_SECURITY_PROPOSAL_REJECTED'&&!rejection)||
    policy?.acknowledge_no_rows_or_purge_execution!==true||!noteOK(policy?.review_note))return null;
  return {kind:'rosie_owner_retention_expiry_policy_verification',build:723,
    reviewed_at:now.toISOString(),status:rejection?
      'OWNER_STORAGE_REJECTION_CONFIRMED_NO_EXPIRY_REQUIRED':'RETENTION_EXPIRY_POLICY_PREVIEW_HELD',
    owner_staff_user_id:actor.id,
    original_signed_gate_sha256:gate.receipt_sha256,
    original_signed_security_review_sha256:security.receipt_sha256,
    original_signed_reconciliation_sha256:reconciliation.receipt_sha256,
    decision:r.decision,maximum_retention_days:days,
    illustrative_new_row_timestamp_utc:rejection?null:now.toISOString(),
    illustrative_expiry_utc:rejection?null:new Date(now.getTime()+days*86400000).toISOString(),
    illustrative_only:true,expiry_calculation_verified:!rejection,
    review_note:clean(policy.review_note),
    actual_rows_queried:0,actual_row_expiration_verified:false,
    retention_purge_job_verified:false,backup_purge_verified:false,
    retention_policy_approved:false,sql_executed:false,hashes_persisted:false,
    ledger_activated:false,proof_b_authorized:false};
}
