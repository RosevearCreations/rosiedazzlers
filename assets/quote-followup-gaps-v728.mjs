// Build 728: read-only signed follow-up and evidence gap reviews. Never resolve
// external identity, deliver messages, persist queues, run SQL or touch backups.
import {NONPRODUCTION_LEDGER_SQL723} from './quote-followup-authorization-v723.mjs';
const clean=v=>String(v??'').trim();
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const sha=/^[0-9a-f]{64}$/;
const signed=(e,k,b)=>e?.ok===true&&e.receipt?.kind===k&&e.receipt.build===b&&
  sha.test(e.receipt_sha256||'')&&e.receipt.proof_b_authorized===false;
const admin=(actor,id)=>actor?.role_code==='admin'&&uuid.test(id||'')&&actor.id===id;
const distinct=(id,others)=>others.every(other=>!other||id!==other);
const noteOk=v=>clean(v).length>=20&&clean(v).length<=300&&
  !/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(clean(v))&&
  !/\+?\d[\d().\-\s]{7,}\d/.test(clean(v));
const ageHours=(at,now)=>{
  const t=Date.parse(at||'');return Number.isFinite(t)&&t<=now.getTime()+300000?
    Math.floor(Math.max(0,now.getTime()-t)/3600000):null;
};
const nonprod=(project,env)=>{
  try{const url=new URL(env?.SUPABASE_URL);return url.protocol==='https:'&&
    url.hostname.endsWith('.supabase.co')&&project&&
    project===clean(env?.ROSIE_LEDGER_NONPROD_PROJECT_REF)&&
    project!==url.hostname.split('.')[0];}catch{return false;}
};

export function ownerFollowupAgingReview728(queue,exception,reconciliation,actor,env,
  policy,now=new Date()){
  const q=queue?.receipt,x=exception?.receipt,r=reconciliation?.receipt,
    age=ageHours(q?.reviewed_at,now),window=Number(policy?.review_window_hours);
  if(!signed(queue,'rosie_owner_exception_evidence_followup_queue',727)||
    !signed(exception,'rosie_owner_handoff_exception_followup',726)||
    !signed(reconciliation,'rosie_private_owner_handoff_receipt_reconciliation',725)||
    !admin(actor,q.owner_staff_user_id)||q.owner_staff_user_id!==x.owner_staff_user_id||
    q.owner_staff_user_id!==r.owner_staff_user_id||
    !distinct(actor.id,[clean(env?.ROSIE_LEDGER_NONPROD_EXECUTION_REVIEWER_STAFF_ID),
      clean(env?.ROSIE_FOLLOWUP_EXPORT_SIGNER_STAFF_ID)])||
    q.signed_exception_sha256!==exception.receipt_sha256||
    q.signed_reconciliation_sha256!==reconciliation.receipt_sha256||
    x.signed_reconciliation_sha256!==reconciliation.receipt_sha256||
    q.signed_handoff_sha256!==x.signed_handoff_sha256||
    r.signed_handoff_sha256!==x.signed_handoff_sha256||
    !nonprod(q.nonproduction_project_ref,env)||
    q.nonproduction_project_ref!==x.nonproduction_project_ref||
    x.nonproduction_project_ref!==r.nonproduction_project_ref||
    r.reviewed_sql_sha256!==NONPRODUCTION_LEDGER_SQL723.sha256||
    !['OWNER_EXCEPTION_FOLLOWUP_QUEUE_EXTERNAL_EVIDENCE_HELD',
      'OWNER_EXCEPTION_FOLLOWUP_QUEUE_DEFERRED',
      'OWNER_EXCEPTION_FOLLOWUP_QUEUE_REJECTED'].includes(q.status)||
    q.queue_mode!=='ON_DEMAND_LOCAL_SIGNED_ITEM_NO_PERSISTENCE'||
    q.unresolved_delivery_receipt!==true||q.unresolved_independent_challenge!==true||
    q.external_message_sent!==false||q.genuine_external_receipt_received!==false||
    q.independent_approval_received!==false||q.sql_executed!==false||
    x.genuine_external_receipt_received!==false||r.authentic_external_receipt_received!==false||
    age===null||![24,72,168].includes(window)||
    !['flag_aged_external_receipt_gap','defer_aging','reject_aging'].includes(policy?.decision)||
    (policy.decision==='flag_aged_external_receipt_gap'&&
      q.status!=='OWNER_EXCEPTION_FOLLOWUP_QUEUE_EXTERNAL_EVIDENCE_HELD')||
    policy?.acknowledge_local_receipt_age_only!==true||!noteOk(policy?.review_note))return null;
  const statuses={flag_aged_external_receipt_gap:age>=window?
    'OWNER_FOLLOWUP_LOCAL_AGING_OVERDUE_EXTERNAL_RECEIPT_HELD':
    'OWNER_FOLLOWUP_LOCAL_AGING_OPEN_EXTERNAL_RECEIPT_HELD',
    defer_aging:'OWNER_FOLLOWUP_AGING_REVIEW_DEFERRED',
    reject_aging:'OWNER_FOLLOWUP_AGING_REVIEW_REJECTED'};
  return {kind:'rosie_owner_followup_aging_review',build:728,
    reviewed_at:now.toISOString(),status:statuses[policy.decision],decision:policy.decision,
    owner_staff_user_id:actor.id,review_note:clean(policy.review_note),
    signed_followup_queue_sha256:queue.receipt_sha256,
    signed_exception_sha256:exception.receipt_sha256,
    signed_reconciliation_sha256:reconciliation.receipt_sha256,
    local_queue_age_hours:age,local_review_window_hours:window,
    local_queue_window_exceeded:age>=window,
    nonproduction_project_ref:q.nonproduction_project_ref,
    authentic_external_receipt_received:false,independent_challenge_verified:false,
    external_message_sent:false,sql_executed:false,ledger_activated:false,
    proof_b_authorized:false};
}

export function witnessAuditExceptionReview728(audit,priority,aging,actor,env,
  policy,now=new Date()){
  const a=audit?.receipt,p=priority?.receipt,g=aging?.receipt,
    reviewer=clean(env?.ROSIE_EXPORT_WITNESS_AUDIT_EXCEPTION_REVIEWER_STAFF_ID);
  if(!signed(audit,'rosie_witness_priority_disposition_audit',727)||
    !signed(priority,'rosie_witness_conflict_priority_queue',726)||
    !signed(aging,'rosie_witness_reference_conflict_aging',725)||
    !admin(actor,reviewer)||!distinct(reviewer,[a.priority_auditor_staff_user_id,
      p.priority_reviewer_staff_user_id,g.aging_reviewer_staff_user_id,
      clean(env?.ROSIE_EXPORT_CUSTODY_REVIEWER_STAFF_ID),
      clean(env?.ROSIE_FOLLOWUP_EXPORT_SIGNER_STAFF_ID)])||
    a.signed_priority_sha256!==priority.receipt_sha256||
    a.signed_aging_sha256!==aging.receipt_sha256||
    p.signed_aging_sha256!==aging.receipt_sha256||
    a.signed_reference_sha256!==p.signed_reference_sha256||
    a.audited_local_priority!==p.priority||
    !['WITNESS_PRIORITY_AUDIT_EXTERNAL_DISPOSITION_MISSING_HELD',
      'WITNESS_PRIORITY_DISPOSITION_AUDIT_DEFERRED',
      'WITNESS_PRIORITY_DISPOSITION_AUDIT_REJECTED'].includes(a.status)||
    a.local_priority_audit_only!==true||a.authentic_disposition_received!==false||
    a.independent_human_identity_verified!==false||a.custody_approved!==false||
    p.independently_verified_external_witness_identity!==false||
    g.independently_verified_external_witness_identity!==false||
    ageHours(a.reviewed_at,now)===null||
    !['flag_external_resolution_missing','defer_exception','reject_exception'].includes(policy?.decision)||
    (policy.decision==='flag_external_resolution_missing'&&
      a.status!=='WITNESS_PRIORITY_AUDIT_EXTERNAL_DISPOSITION_MISSING_HELD')||
    policy?.acknowledge_no_original_external_witness_resolution!==true||
    !noteOk(policy?.review_note))return null;
  const statuses={flag_external_resolution_missing:
      'WITNESS_AUDIT_EXCEPTION_EXTERNAL_RESOLUTION_MISSING_HELD',
    defer_exception:'WITNESS_AUDIT_EXCEPTION_DEFERRED',
    reject_exception:'WITNESS_AUDIT_EXCEPTION_REJECTED'};
  return {kind:'rosie_witness_audit_exception_review',build:728,
    reviewed_at:now.toISOString(),status:statuses[policy.decision],decision:policy.decision,
    exception_reviewer_staff_user_id:reviewer,review_note:clean(policy.review_note),
    signed_disposition_audit_sha256:audit.receipt_sha256,
    signed_priority_sha256:priority.receipt_sha256,
    signed_aging_sha256:aging.receipt_sha256,audited_local_priority:a.audited_local_priority,
    exception_codes:['AUTHENTIC_INDEPENDENT_DISPOSITION_NOT_RECEIVED',
      'HUMAN_IDENTITY_NOT_INDEPENDENTLY_VERIFIED'],
    exception_resolution:'PENDING_AUTHENTIC_EXTERNAL_EVIDENCE',
    genuine_independent_witness_disposition_received:false,
    witness_identity_verified:false,custody_approved:false,
    external_message_sent:false,proof_b_authorized:false};
}

export function nonproductionProvenanceGapTracking728(recheck,intake,readiness,
  actor,env,policy,now=new Date()){
  const p=recheck?.receipt,i=intake?.receipt,r=readiness?.receipt,
    reviewer=clean(env?.ROSIE_LEDGER_NONPROD_EVIDENCE_GAP_REVIEWER_STAFF_ID);
  if(!signed(recheck,'rosie_nonproduction_trial_source_provenance_recheck',727)||
    !signed(intake,'rosie_nonproduction_trial_evidence_intake_guardrails',726)||
    !signed(readiness,'rosie_nonproduction_retention_trial_readiness_review',725)||
    !admin(actor,reviewer)||!distinct(reviewer,[p.provenance_reviewer_staff_user_id,
      i.intake_reviewer_staff_user_id,r.trial_reviewer_staff_user_id,
      clean(env?.ROSIE_LEDGER_NONPROD_EXECUTION_REVIEWER_STAFF_ID),
      clean(env?.ROSIE_OWNER_EVIDENCE_LEDGER_SECURITY_REVIEWER_STAFF_ID),
      clean(env?.ROSIE_FOLLOWUP_EXPORT_SIGNER_STAFF_ID)])||
    p.signed_intake_sha256!==intake.receipt_sha256||
    p.signed_readiness_sha256!==readiness.receipt_sha256||
    i.signed_readiness_sha256!==readiness.receipt_sha256||
    p.signed_handoff_sha256!==i.signed_handoff_sha256||
    p.nonproduction_project_ref!==i.nonproduction_project_ref||
    p.nonproduction_project_ref!==r.nonproduction_project_ref||
    !nonprod(p.nonproduction_project_ref,env)||
    r.sql_sha256!==NONPRODUCTION_LEDGER_SQL723.sha256||
    p.local_metadata_integrity_matches!==(p.source_reference_matches&&p.source_hash_matches)||
    !['TRIAL_SOURCE_METADATA_MATCH_EXTERNAL_PROVENANCE_HELD',
      'TRIAL_SOURCE_METADATA_DRIFT_QUARANTINED',
      'TRIAL_SOURCE_PROVENANCE_REFERENCE_REJECTED'].includes(p.status)||
    (p.status==='TRIAL_SOURCE_METADATA_MATCH_EXTERNAL_PROVENANCE_HELD'&&
      !p.local_metadata_integrity_matches)||
    p.authentic_external_provenance_verified!==false||
    p.cryptographic_original_artifact_verified!==false||
    p.independent_approval_received!==false||p.sql_executed!==false||
    i.metadata_only!==true||r.external_approval_received!==false||
    ageHours(p.reviewed_at,now)===null||
    !['request_original_provenance','quarantine_gaps','reject_gaps'].includes(policy?.decision)||
    (policy.decision==='request_original_provenance'&&
      p.status!=='TRIAL_SOURCE_METADATA_MATCH_EXTERNAL_PROVENANCE_HELD')||
    policy?.acknowledge_gaps_not_live_verification!==true||!noteOk(policy?.review_note))return null;
  const status=policy.decision==='reject_gaps'?'NONPROD_PROVENANCE_GAPS_REJECTED':
    policy.decision==='quarantine_gaps'||!p.local_metadata_integrity_matches?
      'NONPROD_PROVENANCE_GAPS_QUARANTINED':
      'NONPROD_PROVENANCE_EXTERNAL_EVIDENCE_GAPS_HELD';
  return {kind:'rosie_nonproduction_provenance_evidence_gap_tracking',build:728,
    reviewed_at:now.toISOString(),decision:policy.decision,status,
    gap_reviewer_staff_user_id:reviewer,review_note:clean(policy.review_note),
    signed_provenance_recheck_sha256:recheck.receipt_sha256,
    signed_intake_sha256:intake.receipt_sha256,
    signed_readiness_sha256:readiness.receipt_sha256,
    nonproduction_project_ref:p.nonproduction_project_ref,
    original_local_metadata_match:p.local_metadata_integrity_matches,
    readiness_gaps:{authentic_external_source_origin:true,
      verified_original_artifact:true,independent_custodian_approval:true,
      disposable_environment_and_rls_grants:true,
      retention_backup_observation:true},
    external_provenance_verified:false,independent_approval_received:false,
    document_uploaded:false,connected_to_database:false,sql_executed:false,
    backup_accessed:false,actual_records_deleted:0,ledger_activated:false,
    proof_b_authorized:false};
}
