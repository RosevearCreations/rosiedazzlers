export function unresolvedOwnerFeedback716(input){
  if(!input||input.app!=='Rosie Dazzlers'||![715,716].includes(input.build)||
    input.receipt_kind!=='owner_self_attested_local_visual_review'||
    input.feedback_disposition!=='needs_changes'||
    input.server_acceptance_recorded!==false||
    !String(input.device_findings_note||'').trim())return null;
  return {build:input.build,generated_at:String(input.generated_at||''),
    findings:String(input.device_findings_note).slice(0,300)};
}

export function remediationReceipt716(originalHash,original,owner,remedy,checks,timestamp){
  if(!/^[a-f0-9]{64}$/.test(originalHash)||!original||
    !owner?.trim()||remedy?.trim().length<20||remedy.trim().length>300||
    !checks||Object.values(checks).length!==5||!Object.values(checks).every(Boolean))
    return null;
  return {app:'Rosie Dazzlers',build:716,
    receipt_kind:'owner_local_visual_remediation_followup',generated_at:timestamp,
    original_unresolved_feedback_sha256:originalHash,
    original_feedback_generated_at:original.generated_at,
    original_feedback_build:original.build,
    owner_name:owner.trim().slice(0,120),remediation_and_retest_note:remedy.trim(),
    checked:checks,feedback_disposition:'accepted_after_real_retest',
    locally_self_attested_closure:true,server_acceptance_recorded:false,
    independent_reviewer_or_signature_verified:false,
    production_deployment_independently_verified_by_this_receipt:false,
    customer_contacted:false,grants_consent:false,closes_audit:false};
}
