// Build 726: on-demand, signed local exception dispositions only. No evidence upload,
// independent identity assertion, external delivery, live SQL or retention execution.
import {NONPRODUCTION_LEDGER_SQL723} from './quote-followup-authorization-v723.mjs';
const clean=value=>String(value??'').trim();
const sha=/^[a-f0-9]{64}$/;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const safeNote=value=>clean(value).length>=20&&clean(value).length<=300&&
  !/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(clean(value))&&
  !/\+?\d[\d().\-\s]{7,}\d/.test(clean(value));
const signed=(item,kind,build)=>item?.ok===true&&item.receipt?.kind===kind&&
  item.receipt.build===build&&sha.test(item.receipt_sha256||'')&&
  item.receipt.proof_b_authorized===false;
const owner=(actor,id)=>actor?.role_code==='admin'&&uuid.test(id||'')&&actor.id===id;
const separate=(id,others)=>others.every(other=>!other||other!==id);
const prodRef=env=>{
  try{const url=new URL(env?.SUPABASE_URL);
    return url.protocol==='https:'&&url.hostname.endsWith('.supabase.co')?
      url.hostname.split('.')[0]:null;
  }catch{return null;}
};
const safeProject=(project,env)=>project&&project===clean(env?.ROSIE_LEDGER_NONPROD_PROJECT_REF)&&
  !!prodRef(env)&&project!==prodRef(env);

export function ownerHandoffExceptionFollowup726(reconciliation,handoff,checklist,
  actor,env,policy,now=new Date()){
  const r=reconciliation?.receipt,h=handoff?.receipt,c=checklist?.receipt;
  if(!signed(reconciliation,'rosie_private_owner_handoff_receipt_reconciliation',725)||
    !signed(handoff,'rosie_owner_nonproduction_authorization_handoff',724)||
    !signed(checklist,'rosie_nonproduction_ledger_execution_authorization_checklist',723)||
    !owner(actor,h.owner_staff_user_id)||r.owner_staff_user_id!==actor.id||
    !separate(actor.id,[c.execution_reviewer_staff_user_id,
      clean(env?.ROSIE_FOLLOWUP_EXPORT_SIGNER_STAFF_ID)])||
    r.signed_handoff_sha256!==handoff.receipt_sha256||
    r.signed_checklist_sha256!==checklist.receipt_sha256||
    h.signed_execution_checklist_sha256!==checklist.receipt_sha256||
    !sha.test(r.signed_gate_sha256||'')||!sha.test(r.signed_dry_run_sha256||'')||
    h.signed_owner_gate_sha256!==r.signed_gate_sha256||
    h.signed_dry_run_sha256!==r.signed_dry_run_sha256||
    !safeProject(r.nonproduction_project_ref,env)||
    h.nonproduction_project_ref!==r.nonproduction_project_ref||
    c.nonproduction_project_ref!==r.nonproduction_project_ref||
    r.reviewed_sql_sha256!==NONPRODUCTION_LEDGER_SQL723.sha256||
    h.reviewed_sql_sha256!==NONPRODUCTION_LEDGER_SQL723.sha256||
    c.sql_artifact?.sha256!==NONPRODUCTION_LEDGER_SQL723.sha256||
    !['OWNER_HANDOFF_RECEIPT_CHAIN_RECONCILED_EXTERNAL_APPROVAL_HELD',
      'OWNER_HANDOFF_RECEIPT_RECONCILIATION_DEFERRED',
      'OWNER_HANDOFF_RECEIPT_RECONCILIATION_REJECTED'].includes(r.status)||
    r.authentic_external_receipt_received!==false||r.packet_delivered_to_external_custodian!==false||
    r.original_reviewer_signature_challenge_passed!==false||r.sql_executed!==false||
    h.external_authorization_received!==false||h.protected_file_transmitted!==false||
    !['request_external_handoff_receipt','defer_followup','reject_handoff_exception'].includes(policy?.decision)||
    (policy.decision==='request_external_handoff_receipt'&&
      r.status!=='OWNER_HANDOFF_RECEIPT_CHAIN_RECONCILED_EXTERNAL_APPROVAL_HELD')||
    policy?.acknowledge_no_authenticated_external_delivery!==true||!safeNote(policy?.review_note))return null;
  const statuses={request_external_handoff_receipt:'OWNER_HANDOFF_EXCEPTION_EXTERNAL_RECEIPT_PENDING_HELD',
    defer_followup:'OWNER_HANDOFF_EXCEPTION_FOLLOWUP_DEFERRED',
    reject_handoff_exception:'OWNER_HANDOFF_EXCEPTION_REJECTED'};
  return {kind:'rosie_owner_handoff_exception_followup',build:726,reviewed_at:now.toISOString(),
    decision:policy.decision,status:statuses[policy.decision],owner_staff_user_id:actor.id,
    review_note:clean(policy.review_note),signed_reconciliation_sha256:reconciliation.receipt_sha256,
    signed_handoff_sha256:handoff.receipt_sha256,signed_checklist_sha256:checklist.receipt_sha256,
    signed_gate_sha256:r.signed_gate_sha256,nonproduction_project_ref:r.nonproduction_project_ref,
    reviewed_sql_sha256:r.reviewed_sql_sha256,
    unresolved_exception_codes:['EXTERNAL_DELIVERY_RECEIPT_NOT_VERIFIED',
      'INDEPENDENT_APPROVER_NOT_VERIFIED','ORIGINAL_REVIEWER_CHALLENGE_NOT_PASSED'],
    external_notification_sent:false,genuine_external_receipt_received:false,
    independent_approval_received:false,sql_executed:false,ledger_activated:false,
    proof_b_authorized:false};
}

export function witnessConflictPriorityQueue726(aging,reference,identity,actor,env,
  policy,now=new Date()){
  const a=aging?.receipt,r=reference?.receipt,i=identity?.receipt,
    reviewer=clean(env?.ROSIE_EXPORT_WITNESS_PRIORITY_REVIEWER_STAFF_ID),
    localElapsed=Date.parse(a?.reviewed_at||'')-Date.parse(r?.reviewed_at||'');
  if(!signed(aging,'rosie_witness_reference_conflict_aging',725)||
    !signed(reference,'rosie_witness_reference_conflict_review',724)||
    !signed(identity,'rosie_independent_witness_identity_disposition',723)||
    !owner(actor,reviewer)||!separate(reviewer,[a.aging_reviewer_staff_user_id,
      r.reference_reviewer_staff_user_id,i.identity_reviewer_staff_user_id,
      clean(env?.ROSIE_EXPORT_CUSTODY_REVIEWER_STAFF_ID),
      clean(env?.ROSIE_FOLLOWUP_EXPORT_SIGNER_STAFF_ID)])||
    a.signed_reference_review_sha256!==reference.receipt_sha256||
    a.signed_identity_disposition_sha256!==identity.receipt_sha256||
    r.signed_identity_disposition_sha256!==identity.receipt_sha256||
    a.signed_provenance_sha256!==r.signed_provenance_sha256||
    !sha.test(a.signed_provenance_sha256||'')||
    a.witness_reference_conflict_detected!==r.reference_conflict_detected||
    !Number.isFinite(localElapsed)||localElapsed< -300000||
    Math.floor(Math.max(0,localElapsed)/3600000)!==a.local_review_age_hours||
    !Number.isInteger(a.local_review_age_hours)||a.local_review_age_hours<0||
    ![24,72,168].includes(a.local_response_window_hours)||
    a.local_review_window_exceeded!==(a.local_review_age_hours>=a.local_response_window_hours)||
    !['WITNESS_CONFLICT_LOCAL_REVIEW_OVERDUE_EXTERNAL_RESOLUTION_HELD',
      'WITNESS_CONFLICT_LOCAL_REVIEW_OPEN_EXTERNAL_RESOLUTION_HELD',
      'WITNESS_REFERENCE_MATCH_EXTERNAL_IDENTITY_STILL_HELD',
      'WITNESS_CONFLICT_AGING_FOLLOWUP_DEFERRED',
      'WITNESS_CONFLICT_EVIDENCE_REJECTED_HELD'].includes(a.status)||
    (a.status==='WITNESS_CONFLICT_LOCAL_REVIEW_OVERDUE_EXTERNAL_RESOLUTION_HELD'&&
      (!r.reference_conflict_detected||!a.local_review_window_exceeded))||
    (a.status==='WITNESS_CONFLICT_LOCAL_REVIEW_OPEN_EXTERNAL_RESOLUTION_HELD'&&
      (!r.reference_conflict_detected||a.local_review_window_exceeded))||
    (a.status==='WITNESS_REFERENCE_MATCH_EXTERNAL_IDENTITY_STILL_HELD'&&r.reference_conflict_detected)||
    a.independently_verified_external_witness_identity!==false||
    a.independent_resolution_record_received!==false||a.custody_approved!==false||
    r.external_human_identity_verified!==false||
    !['request_independent_priority_review','defer_priority','reject_priority'].includes(policy?.decision)||
    (policy.decision==='request_independent_priority_review'&&
      ['WITNESS_CONFLICT_AGING_FOLLOWUP_DEFERRED','WITNESS_CONFLICT_EVIDENCE_REJECTED_HELD'].includes(a.status))||
    policy?.acknowledge_local_priority_only!==true||!safeNote(policy?.review_note))return null;
  const priority=a.status==='WITNESS_CONFLICT_LOCAL_REVIEW_OVERDUE_EXTERNAL_RESOLUTION_HELD'?'urgent':
    a.status==='WITNESS_CONFLICT_LOCAL_REVIEW_OPEN_EXTERNAL_RESOLUTION_HELD'?'high':
      a.status==='WITNESS_REFERENCE_MATCH_EXTERNAL_IDENTITY_STILL_HELD'?'review':'under_review';
  const status=policy.decision==='reject_priority'?'WITNESS_PRIORITY_EVIDENCE_REJECTED_HELD':
    policy.decision==='defer_priority'?'WITNESS_PRIORITY_REVIEW_DEFERRED':
      'WITNESS_PRIORITY_QUEUED_LOCAL_ONLY_EXTERNAL_IDENTITY_HELD';
  return {kind:'rosie_witness_conflict_priority_queue',build:726,reviewed_at:now.toISOString(),
    decision:policy.decision,status,priority,queue_mode:'ON_DEMAND_SIGNED_ITEM_NO_PERSISTENCE',
    priority_reviewer_staff_user_id:reviewer,review_note:clean(policy.review_note),
    signed_aging_sha256:aging.receipt_sha256,signed_reference_sha256:reference.receipt_sha256,
    signed_identity_sha256:identity.receipt_sha256,
    local_review_age_hours:a.local_review_age_hours,
    local_response_window_hours:a.local_response_window_hours,
    local_review_window_exceeded:a.local_review_window_exceeded,
    witness_reference_conflict_detected:r.reference_conflict_detected,
    independently_verified_external_witness_identity:false,external_notification_sent:false,
    independent_resolution_record_received:false,custody_approved:false,proof_b_authorized:false};
}

export function nonproductionTrialEvidenceGuardrails726(readiness,purge,handoff,
  actor,env,policy,now=new Date()){
  const r=readiness?.receipt,p=purge?.receipt,h=handoff?.receipt,
    reviewer=clean(env?.ROSIE_LEDGER_NONPROD_EVIDENCE_INTAKE_REVIEWER_STAFF_ID);
  const source=clean(policy?.source_reference_id),hash=clean(policy?.source_sha256);
  if(!signed(readiness,'rosie_nonproduction_retention_trial_readiness_review',725)||
    !signed(purge,'rosie_retention_backup_purge_trial_preconditions',724)||
    !signed(handoff,'rosie_owner_nonproduction_authorization_handoff',724)||
    !owner(actor,reviewer)||!separate(reviewer,[r.trial_reviewer_staff_user_id,
      h.owner_staff_user_id,p.owner_staff_user_id,
      clean(env?.ROSIE_LEDGER_NONPROD_EXECUTION_REVIEWER_STAFF_ID),
      clean(env?.ROSIE_OWNER_EVIDENCE_LEDGER_SECURITY_REVIEWER_STAFF_ID),
      clean(env?.ROSIE_FOLLOWUP_EXPORT_SIGNER_STAFF_ID)])||
    r.signed_purge_preconditions_sha256!==purge.receipt_sha256||
    r.signed_owner_handoff_sha256!==handoff.receipt_sha256||
    p.owner_staff_user_id!==h.owner_staff_user_id||
    r.maximum_retention_days!==p.requested_max_retention_days||
    r.declared_unverified_backup_scope!==p.declared_backup_scope||
    !sha.test(r.signed_expiry_policy_sha256||'')||
    !sha.test(r.signed_retention_reconciliation_sha256||'')||
    !safeProject(r.nonproduction_project_ref,env)||
    h.nonproduction_project_ref!==r.nonproduction_project_ref||
    r.sql_sha256!==NONPRODUCTION_LEDGER_SQL723.sha256||
    h.reviewed_sql_sha256!==NONPRODUCTION_LEDGER_SQL723.sha256||
    !['NONPRODUCTION_RETENTION_TRIAL_GAPS_DOCUMENTED_EXTERNAL_APPROVAL_HELD',
      'NONPRODUCTION_RETENTION_TRIAL_READINESS_DEFERRED',
      'NONPRODUCTION_RETENTION_TRIAL_READINESS_REJECTED'].includes(r.status)||
    r.external_approval_received!==false||r.connected_to_database!==false||
    r.sql_executed!==false||r.backup_accessed!==false||r.actual_records_deleted!==0||
    p.real_purge_executed!==false||p.backup_accessed!==false||
    h.external_authorization_received!==false||h.protected_file_transmitted!==false||
    !['disposable_project_authorization','rls_grants_review','backup_retention_inventory',
      'rollback_restore_witness','purge_observation'].includes(policy?.source_type)||
    !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{5,79}$/.test(source)||!sha.test(hash)||
    !['request_independent_provenance','quarantine','reject'].includes(policy?.decision)||
    (policy.decision==='request_independent_provenance'&&
      r.status!=='NONPRODUCTION_RETENTION_TRIAL_GAPS_DOCUMENTED_EXTERNAL_APPROVAL_HELD')||
    policy?.acknowledge_unverified_metadata_only!==true||!safeNote(policy?.review_note))return null;
  const statuses={request_independent_provenance:'NONPRODUCTION_TRIAL_EVIDENCE_REFERENCE_UNVERIFIED_HELD',
    quarantine:'NONPRODUCTION_TRIAL_EVIDENCE_REFERENCE_QUARANTINED',
    reject:'NONPRODUCTION_TRIAL_EVIDENCE_REFERENCE_REJECTED'};
  return {kind:'rosie_nonproduction_trial_evidence_intake_guardrails',build:726,
    reviewed_at:now.toISOString(),status:statuses[policy.decision],decision:policy.decision,
    intake_reviewer_staff_user_id:reviewer,review_note:clean(policy.review_note),
    signed_readiness_sha256:readiness.receipt_sha256,
    signed_purge_preconditions_sha256:purge.receipt_sha256,
    signed_handoff_sha256:handoff.receipt_sha256,nonproduction_project_ref:r.nonproduction_project_ref,
    sql_sha256:r.sql_sha256,source_type:policy.source_type,
    unverified_source_reference_id:source,unverified_source_sha256:hash,
    metadata_only:true,authentic_source_verified:false,independent_approval_received:false,
    document_uploaded:false,connected_to_database:false,sql_executed:false,
    backup_accessed:false,actual_records_deleted:0,ledger_activated:false,proof_b_authorized:false};
}
