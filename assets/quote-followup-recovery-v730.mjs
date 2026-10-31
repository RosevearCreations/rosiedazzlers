// Build 730. Pure review of verified local evidence; no persistence or external authority.
import {ownerAgingDelta729,witnessExceptionContinuity729,
  nonproductionGapDrift729} from './quote-followup-comparison-v729.mjs';

export const RECOVERY_SCOPES730=Object.freeze({
  owner:Object.freeze({comparison:'rosie_owner_followup_aging_delta',
    snapshot:'rosie_owner_followup_aging_review',
    source:'rosie_owner_exception_evidence_followup_queue',
    result:'rosie_owner_aging_recovery_summary',pointer:'signed_queue_sha256'}),
  witness:Object.freeze({comparison:'rosie_witness_audit_exception_continuity',
    snapshot:'rosie_witness_audit_exception_review',
    source:'rosie_witness_priority_disposition_audit',
    result:'rosie_witness_exception_followup_timeline',pointer:'signed_audit_sha256'}),
  nonproduction:Object.freeze({comparison:'rosie_nonproduction_provenance_gap_drift',
    snapshot:'rosie_nonproduction_provenance_evidence_gap_tracking',
    source:'rosie_nonproduction_trial_source_provenance_recheck',
    result:'rosie_nonproduction_evidence_gap_recovery_summary',pointer:'signed_recheck_sha256'})
});
const evaluators={owner:ownerAgingDelta729,witness:witnessExceptionContinuity729,
  nonproduction:nonproductionGapDrift729};
const sha=/^[a-f0-9]{64}$/;
const clean=v=>String(v??'').trim();
const safeNote=v=>clean(v).length>=20&&clean(v).length<=300&&
  !/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(clean(v))&&
  !/\+?\d[\d().\-\s]{7,}\d/.test(clean(v));
const signed=(v,kind,build)=>v?.ok===true&&v.receipt?.kind===kind&&
  v.receipt.build===build&&sha.test(v.receipt_sha256||'')&&
  v.receipt.proof_b_authorized===false;

export function recoverLocalComparison730(scope,comparison,before,after,source,
  actor,env,policy,now=new Date()){
  const config=Object.hasOwn(RECOVERY_SCOPES730,scope)?RECOVERY_SCOPES730[scope]:null;
  if(!config||!signed(comparison,config.comparison,729)||
    !signed(before,config.snapshot,728)||!signed(after,config.snapshot,728)||
    !signed(source,config.source,727)||
    actor?.role_code!=='admin'||policy?.acknowledge_local_recovery_only!==true||
    !safeNote(policy?.review_note))return null;
  const c=comparison.receipt;
  if(c.signed_before_sha256!==before.receipt_sha256||
    c.signed_after_sha256!==after.receipt_sha256||
    c[config.pointer]!==source.receipt_sha256||
    !Number.isFinite(Date.parse(c.reviewed_at||''))||
    Date.parse(c.reviewed_at)<Date.parse(after.receipt.reviewed_at)||
    Date.parse(c.reviewed_at)>now.getTime()+300000)return null;
  // Recompute every stable claim, not just the pointers. Detect even a validly
  // signed but semantically inconsistent comparison instead of trusting its text.
  const expected=evaluators[scope](before,after,source,actor,env,
    {acknowledge_local_comparison_only:true,review_note:policy.review_note},now);
  if(!expected||Object.keys(expected).length!==Object.keys(c).length||
    Object.keys(expected).some(key=>
    key!=='reviewed_at'&&key!=='review_note'&&
    JSON.stringify(expected[key])!==JSON.stringify(c[key])))return null;
  const timeline=[
    {stage:'Earlier local review',at:before.receipt.reviewed_at,
      decision:before.receipt.decision,status:before.receipt.status},
    {stage:'Later local review',at:after.receipt.reviewed_at,
      decision:after.receipt.decision,status:after.receipt.status},
    {stage:'Signed comparison',at:c.reviewed_at,
      decision:c.current_decision,status:c.status}
  ];
  const gaps=scope==='nonproduction'?[...c.gaps_still_unresolved]:[];
  const base={kind:config.result,build:730,reviewed_at:now.toISOString(),
    status:scope==='owner'?'OWNER_LOCAL_RECOVERY_EXTERNAL_RECEIPT_HELD':
      scope==='witness'?'WITNESS_EXCEPTION_TIMELINE_EXTERNAL_RESOLUTION_HELD':
      'NONPROD_EVIDENCE_GAP_SUMMARY_EXTERNAL_PROVENANCE_HELD',
    reviewer_staff_user_id:actor.id,review_note:clean(policy.review_note),
    signed_comparison_sha256:comparison.receipt_sha256,
    signed_before_sha256:before.receipt_sha256,
    signed_after_sha256:after.receipt_sha256,
    signed_source_sha256:source.receipt_sha256,
    source_reviewed_at:source.receipt.reviewed_at,
    timeline,unresolved_gap_codes:gaps,
    external_receipt_verified:false,independent_witness_verified:false,
    external_provenance_verified:false,independent_approval_received:false,
    external_message_sent:false,connected_to_database:false,sql_executed:false,
    backup_accessed:false,actual_records_deleted:0,ledger_activated:false,
    proof_b_authorized:false};
  if(scope==='owner')Object.assign(base,{previous_local_age_hours:c.previous_local_age_hours,
    current_local_age_hours:c.current_local_age_hours,
    local_age_delta_hours:c.local_age_delta_hours,
    local_review_window_hours:c.local_review_window_hours,
    local_window_crossed:c.local_window_crossed});
  if(scope==='witness')Object.assign(base,{local_priority:c.local_priority,
    decision_changed:c.decision_changed});
  if(scope==='nonproduction')Object.assign(base,{local_metadata_match:c.local_metadata_match,
    decision_changed:c.decision_changed,
    nonproduction_project_ref:c.nonproduction_project_ref});
  return base;
}
