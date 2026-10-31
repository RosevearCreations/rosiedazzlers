// Build 725: signature-linked reconciliation and readiness-gap review only.
// Never connect to a ledger, persist an uploaded document or interpret a receipt as external approval.
import {NONPRODUCTION_LEDGER_SQL723} from './quote-followup-authorization-v723.mjs';
const clean=value=>String(value??'').trim();
const sha=/^[a-f0-9]{64}$/;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const noteOK=value=>clean(value).length>=20&&clean(value).length<=300&&
  !/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(clean(value))&&
  !/\+?\d[\d().\-\s]{7,}\d/.test(clean(value));
const signed=(item,kind,build)=>item?.ok===true&&item.receipt?.kind===kind&&
  item.receipt.build===build&&sha.test(item.receipt_sha256||'')&&
  item.receipt.proof_b_authorized===false;
const admin=(actor,id)=>actor?.role_code==='admin'&&uuid.test(id||'')&&actor.id===id;
const distinct=(id,others)=>others.every(other=>!other||id!==other);
const productionRef=env=>{
  try{const url=new URL(env?.SUPABASE_URL);
    return url.protocol==='https:'&&url.hostname.endsWith('.supabase.co')?
      url.hostname.split('.')[0]:null;
  }catch{return null;}
};

export function reconcilePrivateOwnerHandoff725(handoff,checklist,dry,gate,actor,env,
  policy,now=new Date()){
  const h=handoff?.receipt,c=checklist?.receipt,d=dry?.receipt,g=gate?.receipt;
  const ref=clean(env?.ROSIE_LEDGER_NONPROD_PROJECT_REF),prod=productionRef(env);
  if(!signed(handoff,'rosie_owner_nonproduction_authorization_handoff',724)||
    !signed(checklist,'rosie_nonproduction_ledger_execution_authorization_checklist',723)||
    !signed(dry,'rosie_private_ledger_schema_dry_run_review',722)||
    !signed(gate,'rosie_owner_evidence_ledger_approval_gate',720)||
    !admin(actor,h.owner_staff_user_id)||actor.id!==g.owner_admin_staff_user_id||
    !distinct(actor.id,[c.execution_reviewer_staff_user_id,d.security_reviewer_staff_user_id,
      clean(env?.ROSIE_FOLLOWUP_EXPORT_SIGNER_STAFF_ID)])||
    h.signed_execution_checklist_sha256!==checklist.receipt_sha256||
    h.signed_dry_run_sha256!==dry.receipt_sha256||
    h.signed_owner_gate_sha256!==gate.receipt_sha256||
    c.signed_dry_run_receipt_sha256!==dry.receipt_sha256||
    c.signed_owner_gate_sha256!==gate.receipt_sha256||
    c.signed_security_review_sha256!==d.signed_security_review_sha256||
    d.signed_original_gate_sha256!==gate.receipt_sha256||
    d.original_owner_request_sha256!==g.signed_owner_request_sha256||
    !ref||!prod||ref===prod||h.nonproduction_project_ref!==ref||
    c.nonproduction_project_ref!==ref||
    h.reviewed_sql_sha256!==NONPRODUCTION_LEDGER_SQL723.sha256||
    c.sql_artifact?.sha256!==NONPRODUCTION_LEDGER_SQL723.sha256||
    d.status!=='PRIVATE_LEDGER_SCHEMA_DRY_RUN_PREPARED_HELD'||
    h.handoff_channel!=='OWNER_CONTROLLED_PRIVATE_MANUAL_TRANSFER_ONLY'||
    !['OWNER_NONPROD_HANDOFF_PACKET_PREPARED_EXTERNAL_APPROVAL_HELD',
      'OWNER_NONPROD_HANDOFF_DEFERRED','OWNER_NONPROD_HANDOFF_REJECTED'].includes(h.status)||
    h.external_reviewer_identity_verified!==false||
    h.external_authorization_received!==false||h.protected_file_transmitted!==false||
    h.sql_executed!==false||h.ledger_activated!==false||c.sql_executed!==false||
    !['reconcile_private_handoff','defer_reconciliation','reject_reconciliation'].includes(policy?.decision)||
    (h.status!=='OWNER_NONPROD_HANDOFF_PACKET_PREPARED_EXTERNAL_APPROVAL_HELD'&&
      policy.decision==='reconcile_private_handoff')||
    policy?.acknowledge_no_private_delivery_or_external_receipt!==true||
    !noteOK(policy?.review_note))return null;
  const statuses={reconcile_private_handoff:'OWNER_HANDOFF_RECEIPT_CHAIN_RECONCILED_EXTERNAL_APPROVAL_HELD',
    defer_reconciliation:'OWNER_HANDOFF_RECEIPT_RECONCILIATION_DEFERRED',
    reject_reconciliation:'OWNER_HANDOFF_RECEIPT_RECONCILIATION_REJECTED'};
  return {kind:'rosie_private_owner_handoff_receipt_reconciliation',build:725,
    reviewed_at:now.toISOString(),status:statuses[policy.decision],decision:policy.decision,
    owner_staff_user_id:actor.id,review_note:clean(policy.review_note),
    signed_handoff_sha256:handoff.receipt_sha256,
    signed_checklist_sha256:checklist.receipt_sha256,
    signed_dry_run_sha256:dry.receipt_sha256,signed_gate_sha256:gate.receipt_sha256,
    nonproduction_project_ref:ref,reviewed_sql_sha256:h.reviewed_sql_sha256,
    private_packet_downloadable:true,packet_delivered_to_external_custodian:false,
    authentic_external_receipt_received:false,original_reviewer_signature_challenge_passed:false,
    database_access_authorized:false,sql_executed:false,ledger_activated:false,
    proof_b_authorized:false};
}

export function witnessConflictAging725(reference,identity,provenance,actor,env,
  policy,now=new Date()){
  const r=reference?.receipt,i=identity?.receipt,p=provenance?.receipt,
    reviewer=clean(env?.ROSIE_EXPORT_WITNESS_CONFLICT_AGING_REVIEWER_STAFF_ID);
  const deadline=Number(policy?.response_window_hours),t=Date.parse(r?.reviewed_at||''),
    elapsed=now.getTime()-t;
  if(!signed(reference,'rosie_witness_reference_conflict_review',724)||
    !signed(identity,'rosie_independent_witness_identity_disposition',723)||
    !signed(provenance,'rosie_rotation_witness_provenance_intake',722)||
    !admin(actor,reviewer)||!distinct(reviewer,[r.reference_reviewer_staff_user_id,
      i.identity_reviewer_staff_user_id,p.reviewer_staff_user_id,
      clean(env?.ROSIE_EXPORT_CUSTODY_REVIEWER_STAFF_ID),
      clean(env?.ROSIE_FOLLOWUP_EXPORT_SIGNER_STAFF_ID)])||
    r.signed_identity_disposition_sha256!==identity.receipt_sha256||
    r.signed_provenance_sha256!==provenance.receipt_sha256||
    i.signed_provenance_receipt_sha256!==provenance.receipt_sha256||
    i.pinned_witness_id!==p.pinned_witness_id||r.pinned_witness_id!==p.pinned_witness_id||
    i.signed_witness_payload_sha256!==p.witness_payload_sha256||
    r.signed_rotation_exception_sha256!==i.signed_rotation_exception_sha256||
    r.witness_id_reference_matches!==(r.observed_witness_id===p.pinned_witness_id)||
    r.witness_payload_reference_matches!==
      (r.observed_witness_payload_sha256===p.witness_payload_sha256)||
    r.reference_conflict_detected!==
      (!r.witness_id_reference_matches||!r.witness_payload_reference_matches)||
    !['WITNESS_REFERENCE_CONFLICT_PENDING_EXTERNAL_REVIEW',
      'WITNESS_REFERENCE_CRYPTOGRAPHIC_MATCH_IDENTITY_HELD',
      'WITNESS_REFERENCE_REVIEW_DEFERRED','WITNESS_REFERENCE_REJECTED'].includes(r.status)||
    r.external_human_identity_verified!==false||r.custody_approved!==false||
    !Number.isFinite(elapsed)||elapsed< -300000||
    ![24,72,168].includes(deadline)||
    !['request_external_resolution','defer_followup','reject_reference_evidence'].includes(policy?.decision)||
    policy?.acknowledge_age_is_local_receipt_only!==true||!noteOK(policy?.review_note))return null;
  const hours=Math.floor(Math.max(0,elapsed)/3600000),
    conflict=r.reference_conflict_detected;
  const status=policy.decision==='reject_reference_evidence'||
    r.status==='WITNESS_REFERENCE_REJECTED'?'WITNESS_CONFLICT_EVIDENCE_REJECTED_HELD':
    policy.decision==='defer_followup'||r.status==='WITNESS_REFERENCE_REVIEW_DEFERRED'?
      'WITNESS_CONFLICT_AGING_FOLLOWUP_DEFERRED':
      conflict?(hours>=deadline?'WITNESS_CONFLICT_LOCAL_REVIEW_OVERDUE_EXTERNAL_RESOLUTION_HELD':
        'WITNESS_CONFLICT_LOCAL_REVIEW_OPEN_EXTERNAL_RESOLUTION_HELD'):
        'WITNESS_REFERENCE_MATCH_EXTERNAL_IDENTITY_STILL_HELD';
  return {kind:'rosie_witness_reference_conflict_aging',build:725,
    reviewed_at:now.toISOString(),status,decision:policy.decision,
    aging_reviewer_staff_user_id:reviewer,review_note:clean(policy.review_note),
    signed_reference_review_sha256:reference.receipt_sha256,
    signed_identity_disposition_sha256:identity.receipt_sha256,
    signed_provenance_sha256:provenance.receipt_sha256,
    local_reference_reviewed_at:r.reviewed_at,local_review_age_hours:hours,
    local_response_window_hours:deadline,local_review_window_exceeded:hours>=deadline,
    witness_reference_conflict_detected:conflict,
    independently_verified_external_witness_identity:false,
    independent_resolution_record_received:false,custody_approved:false,
    external_message_sent:false,proof_b_authorized:false};
}

export function nonproductionRetentionReadiness725(handoff,purge,expiry,reconciliation,
  actor,env,policy,now=new Date()){
  const h=handoff?.receipt,p=purge?.receipt,e=expiry?.receipt,r=reconciliation?.receipt,
    reviewer=clean(env?.ROSIE_LEDGER_NONPROD_TRIAL_READINESS_REVIEWER_STAFF_ID),
    project=clean(env?.ROSIE_LEDGER_NONPROD_PROJECT_REF),prod=productionRef(env);
  if(!signed(handoff,'rosie_owner_nonproduction_authorization_handoff',724)||
    !signed(purge,'rosie_retention_backup_purge_trial_preconditions',724)||
    !signed(expiry,'rosie_owner_retention_expiry_policy_verification',723)||
    !signed(reconciliation,'rosie_owner_ledger_retention_reconciliation',722)||
    !admin(actor,reviewer)||!distinct(reviewer,[h.owner_staff_user_id,p.owner_staff_user_id,
      clean(env?.ROSIE_LEDGER_NONPROD_EXECUTION_REVIEWER_STAFF_ID),
      clean(env?.ROSIE_OWNER_EVIDENCE_LEDGER_SECURITY_REVIEWER_STAFF_ID),
      clean(env?.ROSIE_FOLLOWUP_EXPORT_SIGNER_STAFF_ID)])||
    h.owner_staff_user_id!==p.owner_staff_user_id||
    p.owner_staff_user_id!==e.owner_staff_user_id||e.owner_staff_user_id!==r.owner_staff_user_id||
    !project||!prod||project===prod||h.nonproduction_project_ref!==project||
    h.reviewed_sql_sha256!==NONPRODUCTION_LEDGER_SQL723.sha256||
    !sha.test(h.signed_execution_checklist_sha256||'')||
    p.original_signed_expiry_sha256!==expiry.receipt_sha256||
    p.original_signed_reconciliation_sha256!==reconciliation.receipt_sha256||
    e.original_signed_reconciliation_sha256!==reconciliation.receipt_sha256||
    e.original_signed_gate_sha256!==r.original_gate_sha256||
    e.original_signed_security_review_sha256!==r.independent_security_review_sha256||
    p.requested_max_retention_days!==e.maximum_retention_days||
    e.maximum_retention_days!==r.owner_requested_max_days||
    ![7,30,90].includes(e.maximum_retention_days)||
    !['OWNER_NONPROD_HANDOFF_PACKET_PREPARED_EXTERNAL_APPROVAL_HELD',
      'OWNER_NONPROD_HANDOFF_DEFERRED','OWNER_NONPROD_HANDOFF_REJECTED'].includes(h.status)||
    !['RETENTION_BACKUP_PURGE_TRIAL_PRECONDITIONS_HELD',
      'RETENTION_BACKUP_PURGE_TRIAL_DEFERRED','RETENTION_BACKUP_PURGE_TRIAL_REJECTED',
      'OWNER_STORAGE_REJECTED_PURGE_TRIAL_NOT_APPLICABLE'].includes(p.status)||
    h.external_authorization_received!==false||h.protected_file_transmitted!==false||
    p.real_purge_executed!==false||p.backup_accessed!==false||
    p.actual_rows_queried!==0||e.actual_rows_queried!==0||
    p.trial_preconditions?.disposable_environment_independently_approved!==false||
    p.trial_preconditions?.backup_inventory_verified!==false||
    e.ledger_activated!==false||r.ledger_activated!==false||
    !['request_independent_readiness_review','defer_readiness','reject_readiness'].includes(policy?.decision)||
    (policy.decision==='request_independent_readiness_review'&&
      (h.status!=='OWNER_NONPROD_HANDOFF_PACKET_PREPARED_EXTERNAL_APPROVAL_HELD'||
       p.status!=='RETENTION_BACKUP_PURGE_TRIAL_PRECONDITIONS_HELD'))||
    policy?.acknowledge_no_live_trial_or_external_approval!==true||
    !noteOK(policy?.review_note))return null;
  const statuses={request_independent_readiness_review:'NONPRODUCTION_RETENTION_TRIAL_GAPS_DOCUMENTED_EXTERNAL_APPROVAL_HELD',
    defer_readiness:'NONPRODUCTION_RETENTION_TRIAL_READINESS_DEFERRED',
    reject_readiness:'NONPRODUCTION_RETENTION_TRIAL_READINESS_REJECTED'};
  return {kind:'rosie_nonproduction_retention_trial_readiness_review',build:725,
    reviewed_at:now.toISOString(),status:statuses[policy.decision],decision:policy.decision,
    trial_reviewer_staff_user_id:reviewer,review_note:clean(policy.review_note),
    signed_owner_handoff_sha256:handoff.receipt_sha256,
    signed_purge_preconditions_sha256:purge.receipt_sha256,
    signed_expiry_policy_sha256:expiry.receipt_sha256,
    signed_retention_reconciliation_sha256:reconciliation.receipt_sha256,
    nonproduction_project_ref:project,sql_sha256:h.reviewed_sql_sha256,
    maximum_retention_days:e.maximum_retention_days,
    declared_unverified_backup_scope:p.declared_backup_scope,
    readiness_gaps:{real_independent_owner_and_custodian_authorization:true,
      verified_disposable_project_and_isolation:true,live_rls_grants_data_api_advisors:true,
      controlled_rollback_and_restore_evidence:true,real_row_retention_and_backup_purge_observation:true},
    external_approval_received:false,connected_to_database:false,sql_executed:false,
    backup_accessed:false,actual_records_deleted:0,ledger_activated:false,
    proof_b_authorized:false};
}
