// Build 729: compare original signed LOCAL review snapshots only. These pure
// functions never contact a provider, accept outside identity, or mutate state.
const clean=v=>String(v??'').trim();
const sha=/^[0-9a-f]{64}$/;
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const signed=(e,kind,build)=>e?.ok===true&&e.receipt?.kind===kind&&
  e.receipt.build===build&&sha.test(e.receipt_sha256||'')&&
  e.receipt.proof_b_authorized===false;
const admin=(actor,id)=>actor?.role_code==='admin'&&uuid.test(id||'')&&actor.id===id;
const noteOk=v=>clean(v).length>=20&&clean(v).length<=300&&
  !/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(clean(v))&&
  !/\+?\d[\d().\-\s]{7,}\d/.test(clean(v));
const nonprod=(project,env)=>{
  try{const url=new URL(env?.SUPABASE_URL);return url.protocol==='https:'&&
    url.hostname.endsWith('.supabase.co')&&project&&
    project===clean(env?.ROSIE_LEDGER_NONPROD_PROJECT_REF)&&
    project!==url.hostname.split('.')[0];}catch{return false;}
};
const chronology=(before,after,source,now)=>{
  const a=Date.parse(before||''),b=Date.parse(after||''),s=Date.parse(source||'');
  return Number.isFinite(a)&&Number.isFinite(b)&&Number.isFinite(s)&&
    s<=a&&a<b&&b<=now.getTime()+300000&&a>=now.getTime()-365*86400000;
};
const reviewReady=(before,after,source,kind,actor,staff,policy,now)=>
  signed(before,kind,728)&&signed(after,kind,728)&&signed(source,
    kind==='rosie_owner_followup_aging_review'?'rosie_owner_exception_evidence_followup_queue':
    kind==='rosie_witness_audit_exception_review'?'rosie_witness_priority_disposition_audit':
    'rosie_nonproduction_trial_source_provenance_recheck',727)&&
  admin(actor,staff)&&policy?.acknowledge_local_comparison_only===true&&
  noteOk(policy?.review_note)&&chronology(before.receipt.reviewed_at,
    after.receipt.reviewed_at,source.receipt.reviewed_at,now);

export function ownerAgingDelta729(before,after,queue,actor,env,policy,now=new Date()){
  const a=before?.receipt,b=after?.receipt,q=queue?.receipt;
  if(!reviewReady(before,after,queue,'rosie_owner_followup_aging_review',actor,
    q?.owner_staff_user_id,policy,now)||
    actor.id!==a.owner_staff_user_id||actor.id!==b.owner_staff_user_id||
    actor.id===clean(env?.ROSIE_FOLLOWUP_EXPORT_SIGNER_STAFF_ID)||
    actor.id===clean(env?.ROSIE_LEDGER_NONPROD_EXECUTION_REVIEWER_STAFF_ID)||
    a.signed_followup_queue_sha256!==queue.receipt_sha256||
    b.signed_followup_queue_sha256!==queue.receipt_sha256||
    a.signed_exception_sha256!==q.signed_exception_sha256||
    b.signed_exception_sha256!==q.signed_exception_sha256||
    a.signed_reconciliation_sha256!==q.signed_reconciliation_sha256||
    b.signed_reconciliation_sha256!==q.signed_reconciliation_sha256||
    !nonprod(q.nonproduction_project_ref,env)||
    q.external_message_sent!==false||q.genuine_external_receipt_received!==false||
    q.independent_approval_received!==false||q.sql_executed!==false||
    a.nonproduction_project_ref!==q.nonproduction_project_ref||
    b.nonproduction_project_ref!==q.nonproduction_project_ref||
    ![24,72,168].includes(a.local_review_window_hours)||
    a.local_review_window_hours!==b.local_review_window_hours||
    !Number.isSafeInteger(a.local_queue_age_hours)||a.local_queue_age_hours<0||
    !Number.isSafeInteger(b.local_queue_age_hours)||b.local_queue_age_hours<a.local_queue_age_hours||
    b.local_queue_age_hours-a.local_queue_age_hours>
      Math.ceil((Date.parse(b.reviewed_at)-Date.parse(a.reviewed_at))/3600000)+1||
    a.local_queue_window_exceeded!==(a.local_queue_age_hours>=a.local_review_window_hours)||
    b.local_queue_window_exceeded!==(b.local_queue_age_hours>=b.local_review_window_hours)||
    !validOwner(a)||!validOwner(b))return null;
  return {kind:'rosie_owner_followup_aging_delta',build:729,reviewed_at:now.toISOString(),
    status:'OWNER_LOCAL_AGING_DELTA_EXTERNAL_RECEIPT_HELD',
    owner_staff_user_id:actor.id,review_note:clean(policy.review_note),
    signed_before_sha256:before.receipt_sha256,signed_after_sha256:after.receipt_sha256,
    signed_queue_sha256:queue.receipt_sha256,
    previous_local_age_hours:a.local_queue_age_hours,
    current_local_age_hours:b.local_queue_age_hours,
    local_age_delta_hours:b.local_queue_age_hours-a.local_queue_age_hours,
    local_review_window_hours:b.local_review_window_hours,
    local_window_crossed:!a.local_queue_window_exceeded&&b.local_queue_window_exceeded,
    previous_decision:a.decision,current_decision:b.decision,
    nonproduction_project_ref:q.nonproduction_project_ref,
    authentic_delivery_verified:false,independent_challenge_verified:false,
    external_message_sent:false,sql_executed:false,ledger_activated:false,
    proof_b_authorized:false};
}
function validOwner(r){
  const status={flag_aged_external_receipt_gap:r.local_queue_window_exceeded?
    'OWNER_FOLLOWUP_LOCAL_AGING_OVERDUE_EXTERNAL_RECEIPT_HELD':
    'OWNER_FOLLOWUP_LOCAL_AGING_OPEN_EXTERNAL_RECEIPT_HELD',
  defer_aging:'OWNER_FOLLOWUP_AGING_REVIEW_DEFERRED',
  reject_aging:'OWNER_FOLLOWUP_AGING_REVIEW_REJECTED'};
  return r.status===status[r.decision]&&r.authentic_external_receipt_received===false&&
    r.independent_challenge_verified===false&&r.external_message_sent===false&&
    r.sql_executed===false&&r.ledger_activated===false;
}

export function witnessExceptionContinuity729(before,after,audit,actor,env,policy,now=new Date()){
  const a=before?.receipt,b=after?.receipt,w=audit?.receipt,
    reviewer=clean(env?.ROSIE_EXPORT_WITNESS_AUDIT_EXCEPTION_REVIEWER_STAFF_ID);
  if(!reviewReady(before,after,audit,'rosie_witness_audit_exception_review',actor,
    reviewer,policy,now)||reviewer===w.priority_auditor_staff_user_id||
    w.authentic_disposition_received!==false||
    w.independent_human_identity_verified!==false||w.custody_approved!==false||
    reviewer===clean(env?.ROSIE_FOLLOWUP_EXPORT_SIGNER_STAFF_ID)||
    a.exception_reviewer_staff_user_id!==reviewer||
    b.exception_reviewer_staff_user_id!==reviewer||
    a.signed_disposition_audit_sha256!==audit.receipt_sha256||
    b.signed_disposition_audit_sha256!==audit.receipt_sha256||
    a.signed_priority_sha256!==w.signed_priority_sha256||
    b.signed_priority_sha256!==w.signed_priority_sha256||
    a.signed_aging_sha256!==w.signed_aging_sha256||
    b.signed_aging_sha256!==w.signed_aging_sha256||
    a.audited_local_priority!==w.audited_local_priority||
    b.audited_local_priority!==w.audited_local_priority||
    !validWitness(a)||!validWitness(b))return null;
  return {kind:'rosie_witness_audit_exception_continuity',build:729,
    reviewed_at:now.toISOString(),status:'WITNESS_EXCEPTION_CONTINUITY_EXTERNAL_RESOLUTION_HELD',
    continuity_reviewer_staff_user_id:reviewer,review_note:clean(policy.review_note),
    signed_before_sha256:before.receipt_sha256,signed_after_sha256:after.receipt_sha256,
    signed_audit_sha256:audit.receipt_sha256,
    previous_decision:a.decision,current_decision:b.decision,
    decision_changed:a.decision!==b.decision,
    local_priority:w.audited_local_priority,
    authentic_witness_identity_verified:false,independent_disposition_received:false,
    custody_approved:false,external_message_sent:false,proof_b_authorized:false};
}
function validWitness(r){
  const status={flag_external_resolution_missing:
    'WITNESS_AUDIT_EXCEPTION_EXTERNAL_RESOLUTION_MISSING_HELD',
  defer_exception:'WITNESS_AUDIT_EXCEPTION_DEFERRED',
  reject_exception:'WITNESS_AUDIT_EXCEPTION_REJECTED'};
  return r.status===status[r.decision]&&
    r.exception_resolution==='PENDING_AUTHENTIC_EXTERNAL_EVIDENCE'&&
    r.genuine_independent_witness_disposition_received===false&&
    r.witness_identity_verified===false&&r.custody_approved===false&&
    r.external_message_sent===false;
}

export function nonproductionGapDrift729(before,after,recheck,actor,env,policy,now=new Date()){
  const a=before?.receipt,b=after?.receipt,p=recheck?.receipt,
    reviewer=clean(env?.ROSIE_LEDGER_NONPROD_EVIDENCE_GAP_REVIEWER_STAFF_ID);
  if(!reviewReady(before,after,recheck,
    'rosie_nonproduction_provenance_evidence_gap_tracking',actor,reviewer,policy,now)||
    reviewer===p.provenance_reviewer_staff_user_id||
    reviewer===clean(env?.ROSIE_LEDGER_NONPROD_EXECUTION_REVIEWER_STAFF_ID)||
    reviewer===clean(env?.ROSIE_FOLLOWUP_EXPORT_SIGNER_STAFF_ID)||
    a.gap_reviewer_staff_user_id!==reviewer||b.gap_reviewer_staff_user_id!==reviewer||
    a.signed_provenance_recheck_sha256!==recheck.receipt_sha256||
    b.signed_provenance_recheck_sha256!==recheck.receipt_sha256||
    a.signed_intake_sha256!==p.signed_intake_sha256||
    b.signed_intake_sha256!==p.signed_intake_sha256||
    a.signed_readiness_sha256!==p.signed_readiness_sha256||
    b.signed_readiness_sha256!==p.signed_readiness_sha256||
    a.nonproduction_project_ref!==p.nonproduction_project_ref||
    b.nonproduction_project_ref!==p.nonproduction_project_ref||
    a.original_local_metadata_match!==p.local_metadata_integrity_matches||
    b.original_local_metadata_match!==p.local_metadata_integrity_matches||
    !nonprod(p.nonproduction_project_ref,env)||
    p.authentic_external_provenance_verified!==false||
    p.independent_approval_received!==false||p.sql_executed!==false||
    !validGap(a)||!validGap(b))return null;
  return {kind:'rosie_nonproduction_provenance_gap_drift',build:729,
    reviewed_at:now.toISOString(),status:'NONPROD_GAP_DRIFT_EXTERNAL_PROVENANCE_HELD',
    gap_reviewer_staff_user_id:reviewer,review_note:clean(policy.review_note),
    signed_before_sha256:before.receipt_sha256,signed_after_sha256:after.receipt_sha256,
    signed_recheck_sha256:recheck.receipt_sha256,
    nonproduction_project_ref:p.nonproduction_project_ref,
    previous_decision:a.decision,current_decision:b.decision,
    decision_changed:a.decision!==b.decision,
    local_metadata_match:p.local_metadata_integrity_matches,
    gaps_still_unresolved:Object.keys(a.readiness_gaps).sort(),
    original_artifact_verified:false,independent_approval_received:false,
    connected_to_database:false,sql_executed:false,backup_accessed:false,
    actual_records_deleted:0,ledger_activated:false,proof_b_authorized:false};
}
function validGap(r){
  const expected=r.decision==='reject_gaps'?'NONPROD_PROVENANCE_GAPS_REJECTED':
    r.decision==='quarantine_gaps'||!r.original_local_metadata_match?
      'NONPROD_PROVENANCE_GAPS_QUARANTINED':'NONPROD_PROVENANCE_EXTERNAL_EVIDENCE_GAPS_HELD';
  const fields=['authentic_external_source_origin','verified_original_artifact',
    'independent_custodian_approval','disposable_environment_and_rls_grants',
    'retention_backup_observation'];
  return r.status===expected&&r.readiness_gaps&&
    Object.keys(r.readiness_gaps).length===fields.length&&
    fields.every(k=>r.readiness_gaps[k]===true)&&
    r.external_provenance_verified===false&&r.independent_approval_received===false&&
    r.document_uploaded===false&&
    r.connected_to_database===false&&r.sql_executed===false&&
    r.backup_accessed===false&&r.actual_records_deleted===0&&r.ledger_activated===false;
}
