// Build 727: signed, on-demand local follow-up evidence only. Never call external
// witness services, persist a queue, execute SQL, approve a trial, or validate a person.
import {NONPRODUCTION_LEDGER_SQL723} from './quote-followup-authorization-v723.mjs';
const clean=v=>String(v??'').trim();
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const sha=/^[0-9a-f]{64}$/;
const signed=(e,k,b)=>e?.ok===true&&e.receipt?.kind===k&&e.receipt?.build===b&&
  sha.test(e.receipt_sha256||'')&&e.receipt.proof_b_authorized===false;
const admin=(a,id)=>a?.role_code==='admin'&&uuid.test(id||'')&&a.id===id;
const distinct=(id,ids)=>ids.every(other=>!other||other!==id);
const noteOk=v=>clean(v).length>=20&&clean(v).length<=300&&
  !/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(clean(v))&&
  !/\+?\d[\d().\-\s]{7,}\d/.test(clean(v));
const projectOK=(project,env)=>{
  try{const url=new URL(env?.SUPABASE_URL);return url.protocol==='https:'&&
    url.hostname.endsWith('.supabase.co')&&project&&
    project===clean(env?.ROSIE_LEDGER_NONPROD_PROJECT_REF)&&
    project!==url.hostname.split('.')[0];}catch{return false;}
};
const localAge=(source,now)=>{
  const t=Date.parse(source?.reviewed_at||'');
  if(!Number.isFinite(t)||t>now.getTime()+300000)return null;
  return Math.floor(Math.max(0,now.getTime()-t)/3600000);
};

export function ownerExceptionEvidenceFollowup727(exception,reconciliation,handoff,
  actor,env,policy,now=new Date()){
  const x=exception?.receipt,r=reconciliation?.receipt,h=handoff?.receipt,
    age=localAge(x,now),window=Number(policy?.local_response_window_hours);
  if(!signed(exception,'rosie_owner_handoff_exception_followup',726)||
    !signed(reconciliation,'rosie_private_owner_handoff_receipt_reconciliation',725)||
    !signed(handoff,'rosie_owner_nonproduction_authorization_handoff',724)||
    !admin(actor,h.owner_staff_user_id)||x.owner_staff_user_id!==actor.id||
    r.owner_staff_user_id!==actor.id||
    !distinct(actor.id,[clean(env?.ROSIE_LEDGER_NONPROD_EXECUTION_REVIEWER_STAFF_ID),
      clean(env?.ROSIE_FOLLOWUP_EXPORT_SIGNER_STAFF_ID)])||
    x.signed_reconciliation_sha256!==reconciliation.receipt_sha256||
    x.signed_handoff_sha256!==handoff.receipt_sha256||
    r.signed_handoff_sha256!==handoff.receipt_sha256||
    x.signed_checklist_sha256!==r.signed_checklist_sha256||
    !sha.test(x.signed_checklist_sha256||'')||
    x.signed_gate_sha256!==r.signed_gate_sha256||
    x.reviewed_sql_sha256!==NONPRODUCTION_LEDGER_SQL723.sha256||
    r.reviewed_sql_sha256!==NONPRODUCTION_LEDGER_SQL723.sha256||
    h.reviewed_sql_sha256!==NONPRODUCTION_LEDGER_SQL723.sha256||
    !projectOK(x.nonproduction_project_ref,env)||
    x.nonproduction_project_ref!==r.nonproduction_project_ref||
    r.nonproduction_project_ref!==h.nonproduction_project_ref||
    !['OWNER_HANDOFF_EXCEPTION_EXTERNAL_RECEIPT_PENDING_HELD',
      'OWNER_HANDOFF_EXCEPTION_FOLLOWUP_DEFERRED',
      'OWNER_HANDOFF_EXCEPTION_REJECTED'].includes(x.status)||
    x.genuine_external_receipt_received!==false||x.independent_approval_received!==false||
    x.external_notification_sent!==false||x.sql_executed!==false||
    h.external_authorization_received!==false||r.packet_delivered_to_external_custodian!==false||
    age===null||![24,72,168].includes(window)||
    !['flag_authentic_receipt_missing','defer_exception','reject_exception'].includes(policy?.decision)||
    (policy.decision==='flag_authentic_receipt_missing'&&
      x.status!=='OWNER_HANDOFF_EXCEPTION_EXTERNAL_RECEIPT_PENDING_HELD')||
    policy?.acknowledge_no_external_receipt_or_delivery!==true||!noteOk(policy?.review_note))return null;
  const priority=age>=window?'overdue':'open';
  const statuses={flag_authentic_receipt_missing:'OWNER_EXCEPTION_FOLLOWUP_QUEUE_EXTERNAL_EVIDENCE_HELD',
    defer_exception:'OWNER_EXCEPTION_FOLLOWUP_QUEUE_DEFERRED',
    reject_exception:'OWNER_EXCEPTION_FOLLOWUP_QUEUE_REJECTED'};
  return {kind:'rosie_owner_exception_evidence_followup_queue',build:727,
    reviewed_at:now.toISOString(),decision:policy.decision,status:statuses[policy.decision],
    queue_mode:'ON_DEMAND_LOCAL_SIGNED_ITEM_NO_PERSISTENCE',local_followup_priority:priority,
    local_exception_age_hours:age,local_response_window_hours:window,
    owner_staff_user_id:actor.id,review_note:clean(policy.review_note),
    signed_exception_sha256:exception.receipt_sha256,
    signed_reconciliation_sha256:reconciliation.receipt_sha256,
    signed_handoff_sha256:handoff.receipt_sha256,
    nonproduction_project_ref:x.nonproduction_project_ref,
    unresolved_delivery_receipt:true,unresolved_independent_challenge:true,
    external_message_sent:false,genuine_external_receipt_received:false,
    independent_approval_received:false,database_accessed:false,sql_executed:false,
    ledger_activated:false,proof_b_authorized:false};
}

export function witnessPriorityDispositionAudit727(priority,aging,reference,
  actor,env,policy,now=new Date()){
  const p=priority?.receipt,a=aging?.receipt,r=reference?.receipt,
    reviewer=clean(env?.ROSIE_EXPORT_WITNESS_DISPOSITION_AUDITOR_STAFF_ID);
  if(!signed(priority,'rosie_witness_conflict_priority_queue',726)||
    !signed(aging,'rosie_witness_reference_conflict_aging',725)||
    !signed(reference,'rosie_witness_reference_conflict_review',724)||
    !admin(actor,reviewer)||!distinct(reviewer,[p.priority_reviewer_staff_user_id,
      a.aging_reviewer_staff_user_id,r.reference_reviewer_staff_user_id,
      clean(env?.ROSIE_EXPORT_CUSTODY_REVIEWER_STAFF_ID),
      clean(env?.ROSIE_FOLLOWUP_EXPORT_SIGNER_STAFF_ID)])||
    p.signed_aging_sha256!==aging.receipt_sha256||
    p.signed_reference_sha256!==reference.receipt_sha256||
    a.signed_reference_review_sha256!==reference.receipt_sha256||
    p.signed_identity_sha256!==a.signed_identity_disposition_sha256||
    p.witness_reference_conflict_detected!==r.reference_conflict_detected||
    p.local_review_age_hours!==a.local_review_age_hours||
    p.local_response_window_hours!==a.local_response_window_hours||
    p.local_review_window_exceeded!==a.local_review_window_exceeded||
    p.queue_mode!=='ON_DEMAND_SIGNED_ITEM_NO_PERSISTENCE'||
    !['urgent','high','review','under_review'].includes(p.priority)||
    p.priority!==(a.status==='WITNESS_CONFLICT_LOCAL_REVIEW_OVERDUE_EXTERNAL_RESOLUTION_HELD'? 'urgent':
      a.status==='WITNESS_CONFLICT_LOCAL_REVIEW_OPEN_EXTERNAL_RESOLUTION_HELD'?'high':
      a.status==='WITNESS_REFERENCE_MATCH_EXTERNAL_IDENTITY_STILL_HELD'?'review':'under_review')||
    !['WITNESS_PRIORITY_QUEUED_LOCAL_ONLY_EXTERNAL_IDENTITY_HELD',
      'WITNESS_PRIORITY_REVIEW_DEFERRED','WITNESS_PRIORITY_EVIDENCE_REJECTED_HELD'].includes(p.status)||
    p.independently_verified_external_witness_identity!==false||
    p.custody_approved!==false||p.external_notification_sent!==false||
    r.external_human_identity_verified!==false||
    localAge(p,now)===null||
    !['flag_missing_independent_disposition','defer_audit','reject_audit'].includes(policy?.decision)||
    (policy.decision==='flag_missing_independent_disposition'&&
      p.status!=='WITNESS_PRIORITY_QUEUED_LOCAL_ONLY_EXTERNAL_IDENTITY_HELD')||
    policy?.acknowledge_no_real_witness_disposition!==true||!noteOk(policy?.review_note))return null;
  const statuses={flag_missing_independent_disposition:'WITNESS_PRIORITY_AUDIT_EXTERNAL_DISPOSITION_MISSING_HELD',
    defer_audit:'WITNESS_PRIORITY_DISPOSITION_AUDIT_DEFERRED',
    reject_audit:'WITNESS_PRIORITY_DISPOSITION_AUDIT_REJECTED'};
  return {kind:'rosie_witness_priority_disposition_audit',build:727,
    reviewed_at:now.toISOString(),decision:policy.decision,status:statuses[policy.decision],
    audited_local_priority:p.priority,priority_auditor_staff_user_id:reviewer,
    review_note:clean(policy.review_note),signed_priority_sha256:priority.receipt_sha256,
    signed_aging_sha256:aging.receipt_sha256,signed_reference_sha256:reference.receipt_sha256,
    original_aging_hours:a.local_review_age_hours,
    local_priority_audit_only:true,authentic_disposition_received:false,
    independent_human_identity_verified:false,external_message_sent:false,
    custody_approved:false,proof_b_authorized:false};
}

export function trialSourceProvenanceRecheck727(intake,readiness,handoff,
  actor,env,policy,now=new Date()){
  const i=intake?.receipt,r=readiness?.receipt,h=handoff?.receipt,
    reviewer=clean(env?.ROSIE_LEDGER_NONPROD_PROVENANCE_RECHECK_REVIEWER_STAFF_ID);
  const observedRef=clean(policy?.observed_source_reference_id),
    observedHash=clean(policy?.observed_source_sha256);
  if(!signed(intake,'rosie_nonproduction_trial_evidence_intake_guardrails',726)||
    !signed(readiness,'rosie_nonproduction_retention_trial_readiness_review',725)||
    !signed(handoff,'rosie_owner_nonproduction_authorization_handoff',724)||
    !admin(actor,reviewer)||!distinct(reviewer,[i.intake_reviewer_staff_user_id,
      r.trial_reviewer_staff_user_id,h.owner_staff_user_id,
      clean(env?.ROSIE_LEDGER_NONPROD_EXECUTION_REVIEWER_STAFF_ID),
      clean(env?.ROSIE_OWNER_EVIDENCE_LEDGER_SECURITY_REVIEWER_STAFF_ID),
      clean(env?.ROSIE_FOLLOWUP_EXPORT_SIGNER_STAFF_ID)])||
    i.signed_readiness_sha256!==readiness.receipt_sha256||
    i.signed_handoff_sha256!==handoff.receipt_sha256||
    i.signed_purge_preconditions_sha256!==r.signed_purge_preconditions_sha256||
    !sha.test(i.signed_purge_preconditions_sha256||'')||
    !projectOK(i.nonproduction_project_ref,env)||
    i.nonproduction_project_ref!==r.nonproduction_project_ref||
    i.nonproduction_project_ref!==h.nonproduction_project_ref||
    i.sql_sha256!==NONPRODUCTION_LEDGER_SQL723.sha256||
    r.sql_sha256!==NONPRODUCTION_LEDGER_SQL723.sha256||
    i.metadata_only!==true||i.authentic_source_verified!==false||
    i.independent_approval_received!==false||i.document_uploaded!==false||
    r.external_approval_received!==false||r.sql_executed!==false||
    i.actual_records_deleted!==0||i.backup_accessed!==false||
    !['NONPRODUCTION_TRIAL_EVIDENCE_REFERENCE_UNVERIFIED_HELD',
      'NONPRODUCTION_TRIAL_EVIDENCE_REFERENCE_QUARANTINED',
      'NONPRODUCTION_TRIAL_EVIDENCE_REFERENCE_REJECTED'].includes(i.status)||
    !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{5,79}$/.test(observedRef)||!sha.test(observedHash)||
    !['compare_local_metadata','quarantine','reject'].includes(policy?.decision)||
    (policy.decision==='compare_local_metadata'&&
      i.status!=='NONPRODUCTION_TRIAL_EVIDENCE_REFERENCE_UNVERIFIED_HELD')||
    localAge(i,now)===null||
    policy?.acknowledge_metadata_is_not_external_provenance!==true||!noteOk(policy?.review_note))return null;
  const refMatch=observedRef===i.unverified_source_reference_id,
    hashMatch=observedHash===i.unverified_source_sha256;
  const status=policy.decision==='reject'?'TRIAL_SOURCE_PROVENANCE_REFERENCE_REJECTED':
    policy.decision==='quarantine'||!refMatch||!hashMatch?
      'TRIAL_SOURCE_METADATA_DRIFT_QUARANTINED':
      'TRIAL_SOURCE_METADATA_MATCH_EXTERNAL_PROVENANCE_HELD';
  return {kind:'rosie_nonproduction_trial_source_provenance_recheck',build:727,
    reviewed_at:now.toISOString(),status,decision:policy.decision,
    provenance_reviewer_staff_user_id:reviewer,review_note:clean(policy.review_note),
    signed_intake_sha256:intake.receipt_sha256,
    signed_readiness_sha256:readiness.receipt_sha256,
    signed_handoff_sha256:handoff.receipt_sha256,
    source_type:i.source_type,observed_source_reference_id:observedRef,
    observed_source_sha256:observedHash,source_reference_matches:refMatch,
    source_hash_matches:hashMatch,local_metadata_integrity_matches:refMatch&&hashMatch,
    nonproduction_project_ref:i.nonproduction_project_ref,
    cryptographic_original_artifact_verified:false,authentic_external_provenance_verified:false,
    independent_approval_received:false,document_uploaded:false,
    database_accessed:false,sql_executed:false,backup_accessed:false,
    actual_records_deleted:0,ledger_activated:false,proof_b_authorized:false};
}
