// Build 550 — bounded recovery and direct authenticated-device field closure review.
// This is NOT a recovery drill, real-device test, Production restore or canonical HOLD mutation.
const clean=x=>String(x??"").trim();
export function build550RecoveryDeviceFieldClosure({integrity={},freshness={},manual={},source_status={}}={}){
 const ri=integrity.recovery_identity||{},di=integrity.authenticated_device_identity||{};
 const recoverySourceOK=source_status?.execution_evidence?.available===true;
 const recoveryCurrent=recoverySourceOK&&ri.identity_complete===true&&ri.trace_match===true&&
   ri.operator_review_identity_complete===true&&freshness?.recovery?.evidence_current===true;
 const deviceCurrent=recoverySourceOK&&di.identity_complete===true&&di.trace_match===true&&
   di.operator_review_identity_complete===true&&freshness?.authenticated_device?.evidence_current===true&&
   Array.isArray(di.current_regression_role_ids)&&di.current_regression_role_ids.length===0;
 const recoveryGaps=[];
 if(!recoverySourceOK)recoveryGaps.push("recovery_source_observation_unavailable");
 if(!ri.identity_complete)recoveryGaps.push("dated_successful_nonproduction_restore_trace_required");
 if(!ri.trace_match)recoveryGaps.push("recovery_evidence_trace_mismatch");
 if(!ri.operator_review_identity_complete)recoveryGaps.push("current_attributable_recovery_operator_review_required");
 if(!freshness?.recovery?.evidence_current)recoveryGaps.push("recovery_observation_freshness_required");
 const deviceGaps=[];
 if(!recoverySourceOK)deviceGaps.push("authenticated_device_observation_unavailable");
 if(!di.identity_complete)deviceGaps.push("direct_customer_detailer_operations_admin_role_device_browser_observations_required");
 if(!di.trace_match)deviceGaps.push("device_evidence_trace_mismatch");
 if(!di.operator_review_identity_complete)deviceGaps.push("separate_current_device_operator_review_required");
 if(!freshness?.authenticated_device?.evidence_current)deviceGaps.push("authenticated_device_freshness_required");
 if((di.current_regression_role_ids||[]).length)deviceGaps.push("current_negative_device_regression_blocks_closure");
 const report=Object.freeze({build:550,authority:"recovery_authenticated_device_field_closure",
   recovery:Object.freeze({status:recoveryCurrent?"field_evidence_ready_for_separate_owner_hold_decision":"retain_recovery_hold",
    evidence_current:recoveryCurrent,required_scope:"bounded_nonproduction",gaps:Object.freeze(recoveryGaps),
    manual_outcome:clean(manual?.recovery?.status)||"not_recorded"}),
   authenticated_device:Object.freeze({status:deviceCurrent?"field_evidence_ready_for_separate_owner_hold_decision":"retain_device_hold",
    evidence_current:deviceCurrent,required_roles:Object.freeze(["customer","detailer","operations","admin"]),
    required_devices:Object.freeze(["phone","tablet","desktop"]),observed_browsers:Object.freeze(di.current_browser_ids||[]),
    gaps:Object.freeze(deviceGaps),manual_outcome:clean(manual?.authenticated_device?.status)||"not_recorded"}),
   independent_hold_outcomes:true,source_review_only:true,live_restore_performed:false,
   authenticated_logins_performed:false,device_screenshots_collected:false,
   credentials_recorded:false,automatic_hold_change:false,booking_or_customer_mutation:false});
 return report;
}
