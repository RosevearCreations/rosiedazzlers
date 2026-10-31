// Build 724 intentionally constructs signed review packets only: no storage, SQL or external approval.
const clean=value=>String(value??'').trim();
const sha=/^[a-f0-9]{64}$/;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const safeNote=value=>clean(value).length>=20&&clean(value).length<=300&&
  !/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(clean(value))&&
  !/\+?\d[\d().\-\s]{7,}\d/.test(clean(value));
const admin=(actor,id)=>actor?.role_code==='admin'&&uuid.test(id||'')&&actor?.id===id;
const signed=(item,kind,build)=>item?.ok===true&&item.receipt?.kind===kind&&
  item.receipt.build===build&&sha.test(item.receipt_sha256||'')&&
  item.receipt.proof_b_authorized===false;

export function ownerAuthorizationHandoff724(checklist,dry,gate,actor,env,policy,now=new Date()){
  const c=checklist?.receipt,d=dry?.receipt,g=gate?.receipt;
  const project=clean(env?.ROSIE_LEDGER_NONPROD_PROJECT_REF);
  let production='';
  try{production=new URL(env.SUPABASE_URL).hostname.split('.')[0];}catch{return null;}
  if(!signed(checklist,'rosie_nonproduction_ledger_execution_authorization_checklist',723)||
    !signed(dry,'rosie_private_ledger_schema_dry_run_review',722)||
    !signed(gate,'rosie_owner_evidence_ledger_approval_gate',720)||
    !admin(actor,g.owner_admin_staff_user_id)||
    actor.id===c.execution_reviewer_staff_user_id||
    actor.id===d.security_reviewer_staff_user_id||
    actor.id===clean(env.ROSIE_FOLLOWUP_EXPORT_SIGNER_STAFF_ID)||
    !['NONPRODUCTION_LEDGER_EXECUTION_AUTHORIZATION_CHECKLIST_HELD',
      'NONPRODUCTION_LEDGER_EXECUTION_PROPOSAL_REJECTED'].includes(c.status)||
    d.status!=='PRIVATE_LEDGER_SCHEMA_DRY_RUN_PREPARED_HELD'||
    g.status!=='LEDGER_APPROVAL_GATE_HELD'||
    c.signed_dry_run_receipt_sha256!==dry.receipt_sha256||
    c.signed_owner_gate_sha256!==gate.receipt_sha256||
    d.signed_original_gate_sha256!==gate.receipt_sha256||
    d.original_owner_request_sha256!==g.signed_owner_request_sha256||
    c.signed_security_review_sha256!==d.signed_security_review_sha256||
    c.nonproduction_project_ref!==project||!project||project===production||
    !sha.test(c.sql_artifact?.sha256||'')||
    c.sql_artifact.script!=='docs/schema/build722_private_ledger_rollback_dry_run.sql'||
    c.sql_artifact.transaction_end!=='ROLLBACK'||
    c.checklist?.sql_execution_approved!==false||
    c.connected_to_database!==false||c.sql_executed!==false||
    c.ledger_activated!==false||d.sql_executed!==false||g.ledger_activated!==false||
    !['prepare_private_owner_handoff','defer_owner_handoff','reject_owner_handoff'].includes(policy?.decision)||
    (c.status==='NONPRODUCTION_LEDGER_EXECUTION_PROPOSAL_REJECTED'&&
      policy.decision==='prepare_private_owner_handoff')||
    policy?.acknowledge_private_transfer_only!==true||!safeNote(policy?.review_note))return null;
  const statuses={prepare_private_owner_handoff:'OWNER_NONPROD_HANDOFF_PACKET_PREPARED_EXTERNAL_APPROVAL_HELD',
    defer_owner_handoff:'OWNER_NONPROD_HANDOFF_DEFERRED',
    reject_owner_handoff:'OWNER_NONPROD_HANDOFF_REJECTED'};
  return {kind:'rosie_owner_nonproduction_authorization_handoff',build:724,
    reviewed_at:now.toISOString(),status:statuses[policy.decision],decision:policy.decision,
    owner_staff_user_id:actor.id,review_note:clean(policy.review_note),
    signed_execution_checklist_sha256:checklist.receipt_sha256,
    signed_dry_run_sha256:dry.receipt_sha256,signed_owner_gate_sha256:gate.receipt_sha256,
    nonproduction_project_ref:project,reviewed_sql_sha256:c.sql_artifact.sha256,
    handoff_channel:'OWNER_CONTROLLED_PRIVATE_MANUAL_TRANSFER_ONLY',
    external_reviewer_identity_verified:false,external_authorization_received:false,
    protected_file_transmitted:false,nonproduction_database_connected:false,
    sql_executed:false,migration_applied:false,ledger_activated:false,proof_b_authorized:false};
}

export function witnessReferenceConflict724(identity,provenance,exception,actor,env,policy,now=new Date()){
  const i=identity?.receipt,p=provenance?.receipt,e=exception?.receipt;
  const reviewer=clean(env?.ROSIE_EXPORT_WITNESS_REFERENCE_REVIEWER_STAFF_ID);
  const observed=clean(policy?.observed_witness_id);
  const observedHash=clean(policy?.observed_witness_payload_sha256);
  if(!signed(identity,'rosie_independent_witness_identity_disposition',723)||
    !signed(provenance,'rosie_rotation_witness_provenance_intake',722)||
    !signed(exception,'rosie_rotated_custody_receipt_exception',721)||
    !admin(actor,reviewer)||reviewer===i.identity_reviewer_staff_user_id||
    reviewer===p.reviewer_staff_user_id||reviewer===clean(env.ROSIE_EXPORT_CUSTODY_REVIEWER_STAFF_ID)||
    reviewer===clean(env.ROSIE_FOLLOWUP_EXPORT_SIGNER_STAFF_ID)||
    i.signed_provenance_receipt_sha256!==provenance.receipt_sha256||
    i.signed_rotation_exception_sha256!==exception.receipt_sha256||
    p.original_exception_sha256!==exception.receipt_sha256||
    i.pinned_witness_id!==p.pinned_witness_id||p.pinned_witness_id!==e.witness_id||
    i.signed_witness_payload_sha256!==p.witness_payload_sha256||
    p.witness_payload_sha256!==e.witness_payload_sha256||
    p.subject_receipt_sha256!==e.subject_receipt_sha256||
    p.current_signer_fingerprint!==e.current_signer_fingerprint||
    p.previous_signer_fingerprint!==e.previous_signer_fingerprint||
    !['WITNESS_IDENTITY_EXTERNAL_VERIFICATION_PENDING','WITNESS_IDENTITY_REVIEW_DEFERRED',
      'WITNESS_IDENTITY_EVIDENCE_REJECTED'].includes(i.status)||
    i.external_human_identity_verified!==false||i.independent_authority_accepted!==false||
    !/^[a-zA-Z0-9][a-zA-Z0-9_.:-]{2,79}$/.test(observed)||!sha.test(observedHash)||
    !['compare_reference','reject_reference','defer_reference'].includes(policy?.decision)||
    policy?.acknowledge_reference_is_not_identity!==true||!safeNote(policy?.review_note))return null;
  const idMatches=observed===i.pinned_witness_id,
    payloadMatches=observedHash===i.signed_witness_payload_sha256,
    conflict=!idMatches||!payloadMatches;
  const status=policy.decision==='reject_reference'?'WITNESS_REFERENCE_REJECTED':
    policy.decision==='defer_reference'?'WITNESS_REFERENCE_REVIEW_DEFERRED':
    conflict?'WITNESS_REFERENCE_CONFLICT_PENDING_EXTERNAL_REVIEW':
      'WITNESS_REFERENCE_CRYPTOGRAPHIC_MATCH_IDENTITY_HELD';
  return {kind:'rosie_witness_reference_conflict_review',build:724,
    reviewed_at:now.toISOString(),status,decision:policy.decision,
    reference_reviewer_staff_user_id:reviewer,review_note:clean(policy.review_note),
    signed_identity_disposition_sha256:identity.receipt_sha256,
    signed_provenance_sha256:provenance.receipt_sha256,
    signed_rotation_exception_sha256:exception.receipt_sha256,
    pinned_witness_id:i.pinned_witness_id,observed_witness_id:observed,
    observed_witness_payload_sha256:observedHash,
    witness_id_reference_matches:idMatches,witness_payload_reference_matches:payloadMatches,
    reference_conflict_detected:conflict,
    external_human_identity_verified:false,third_party_witness_appointment_verified:false,
    custody_approved:false,original_evidence_persisted:false,proof_b_authorized:false};
}

export function retentionBackupPurgeTrial724(expiry,reconciliation,actor,policy,now=new Date()){
  const e=expiry?.receipt,r=reconciliation?.receipt;
  const rejected=e?.status==='OWNER_STORAGE_REJECTION_CONFIRMED_NO_EXPIRY_REQUIRED';
  if(!signed(expiry,'rosie_owner_retention_expiry_policy_verification',723)||
    !signed(reconciliation,'rosie_owner_ledger_retention_reconciliation',722)||
    !admin(actor,e.owner_staff_user_id)||actor.id!==r.owner_staff_user_id||
    e.original_signed_reconciliation_sha256!==reconciliation.receipt_sha256||
    e.original_signed_gate_sha256!==r.original_gate_sha256||
    e.original_signed_security_review_sha256!==r.independent_security_review_sha256||
    ![7,30,90].includes(e.maximum_retention_days)||
    e.maximum_retention_days!==r.owner_requested_max_days||
    !['RETENTION_EXPIRY_POLICY_PREVIEW_HELD',
      'OWNER_STORAGE_REJECTION_CONFIRMED_NO_EXPIRY_REQUIRED'].includes(e.status)||
    (rejected!==(r.status==='OWNER_STORAGE_REJECTED_NO_ACTIVATION'))||
    e.illustrative_only!==true||e.actual_rows_queried!==0||
    e.actual_row_expiration_verified!==false||e.retention_purge_job_verified!==false||
    e.backup_purge_verified!==false||e.ledger_activated!==false||r.ledger_activated!==false||
    !['request_independent_trial','defer_trial','reject_trial'].includes(policy?.decision)||
    !['unverified','provider_managed','application_controlled'].includes(policy?.backup_scope)||
    (rejected&&policy.decision==='request_independent_trial')||
    policy?.acknowledge_no_live_purge_or_backup_access!==true||!safeNote(policy?.review_note))return null;
  if(rejected){if(e.illustrative_expiry_utc!==null)return null;}
  else{
    const t=Date.parse(e.illustrative_new_row_timestamp_utc||''),
      end=Date.parse(e.illustrative_expiry_utc||'');
    if(!Number.isFinite(t)||!Number.isFinite(end)||
      end-t!==e.maximum_retention_days*86400000)return null;
  }
  const status=rejected?'OWNER_STORAGE_REJECTED_PURGE_TRIAL_NOT_APPLICABLE':
    policy.decision==='reject_trial'?'RETENTION_BACKUP_PURGE_TRIAL_REJECTED':
    policy.decision==='defer_trial'?'RETENTION_BACKUP_PURGE_TRIAL_DEFERRED':
      'RETENTION_BACKUP_PURGE_TRIAL_PRECONDITIONS_HELD';
  return {kind:'rosie_retention_backup_purge_trial_preconditions',build:724,
    reviewed_at:now.toISOString(),status,decision:policy.decision,
    owner_staff_user_id:actor.id,review_note:clean(policy.review_note),
    original_signed_expiry_sha256:expiry.receipt_sha256,
    original_signed_reconciliation_sha256:reconciliation.receipt_sha256,
    requested_max_retention_days:e.maximum_retention_days,
    illustrative_expiry_utc:rejected?null:e.illustrative_expiry_utc,
    declared_backup_scope:policy.backup_scope,
    trial_preconditions:{disposable_environment_independently_approved:false,
      live_row_expiration_observed:false,backup_inventory_verified:false,
      backup_retention_period_verified:false,restoration_and_purge_evidence_verified:false,
      restore_test_authorized:false,public_data_api_exposure_reviewed:false,
      role_grants_rls_and_security_advisors_verified:false},
    backup_accessed:false,actual_rows_queried:0,real_purge_executed:false,
    sql_executed:false,ledger_activated:false,proof_b_authorized:false};
}
