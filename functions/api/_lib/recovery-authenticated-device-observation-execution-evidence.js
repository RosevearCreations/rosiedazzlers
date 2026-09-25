// Build 500 — Recovery Drill & Authenticated Device Observation Execution Evidence.
const REQUIRED_ROLE_IDS = Object.freeze(["customer","detailer","operations","admin"]);
const REQUIRED_DEVICE_IDS = Object.freeze(["phone","tablet","desktop"]);
export function buildRecoveryAuthenticatedDeviceObservationExecutionEvidence({recovery={},authenticated_device={},continuity={},generated_at=new Date().toISOString()}={}){
  const proof=recovery?.recovery_export_operational_proof||recovery?.proof||{};
  const refresh=recovery?.refresh_closure_review||recovery?.recovery_drill_evidence_refresh_closure_review||{};
  const validation=recovery?.validation_drill_decision_readiness||recovery?.recovery_evidence_validation_drill_decision_readiness||{};
  const recoveryRows=safeArray(refresh?.rows).length?safeArray(refresh?.rows):safeArray(validation?.rows);
  const drillRow=recoveryRows.find(row=>clean(row?.id)==="recovery_drill")||{};
  const drillProof=proof?.recovery_drill||{};
  const observedAt=validIso(drillRow?.observed_at||drillProof?.verified_at);
  const sourceAvailable=drillRow?.source_available!==false&&clean(refresh?.status)!=="blocked_source_unavailable"&&clean(validation?.status)!=="retain_hold_unavailable_source";
  const observed=sourceAvailable&&(drillProof?.observed===true||clean(drillRow?.classification)==="owner_action_observed");
  const freshness=clean(drillRow?.freshness)||(observedAt?"unknown":"missing");
  const current=observed&&Boolean(observedAt)&&freshness==="current";
  const boundedNonproduction=drillProof?.bounded_nonproduction_scope_explicit===true;
  const observerPresent=drillProof?.observer_role_present===true;
  const backupReferencePresent=drillProof?.backup_reference_present===true;
  const retentionReferencePresent=drillProof?.retention_reference_present===true;
  const outcomeRecorded=drillProof?.outcome_recorded===true;
  const outcomeClassification=outcomeRecorded?(clean(drillProof?.outcome_classification)||"recorded"):"not_recorded";
  const abortOrDeviationRecorded=drillProof?.abort_or_deviation_recorded===true;
  const evidenceTraceKey=clean(refresh?.evidence_traceability?.evidence_trace_key)||null;
  const postObservationRequirementsComplete=Boolean(current&&boundedNonproduction&&observerPresent&&backupReferencePresent&&retentionReferencePresent&&outcomeRecorded&&abortOrDeviationRecorded&&evidenceTraceKey);
  let recoveryStatus="current_execution_observation_required";
  if(!sourceAvailable)recoveryStatus="source_unavailable";
  else if(!current)recoveryStatus="current_execution_observation_required";
  else if(!boundedNonproduction)recoveryStatus="bounded_nonproduction_scope_not_explicit";
  else if(!observerPresent||!outcomeRecorded)recoveryStatus="execution_attribution_incomplete";
  else if(!postObservationRequirementsComplete)recoveryStatus="post_observation_evidence_incomplete";
  else recoveryStatus="bounded_nonproduction_execution_observation_recorded";

  const deviceEvidence=authenticated_device?.evidence||authenticated_device?.authenticated_device_visual_acceptance||authenticated_device||{};
  const triage=deviceEvidence?.observation_refresh_regression_triage||{};
  const deviceSourceAvailable=clean(triage?.status)!=="unavailable";
  const roleRows=REQUIRED_ROLE_IDS.map(id=>{
    const row=safeArray(deviceEvidence?.roles).find(item=>clean(item?.id)===id)||{};
    const at=validIso(row?.observed_at);
    const explicitCurrent=Boolean(deviceSourceAvailable&&row?.current_observation===true&&at&&row?.authentication_evidence_present===true&&row?.browser_evidence_present===true&&row?.route_evidence_present===true&&row?.viewport_evidence_present===true&&row?.outcome_evidence_present===true);
    return Object.freeze({id,observed:explicitCurrent,observed_at:explicitCurrent?at:null,outcome:explicitCurrent?(row?.current_regression===true?"regression":row?.current_pass===true?"pass":"recorded"):"not_current",device_ids:Object.freeze(strings(row?.device_classes)),browser_ids:Object.freeze(strings(row?.browser_classes)),routes:Object.freeze(strings(row?.routes).slice(0,6)),viewport_widths:Object.freeze(safeArray(row?.viewport_widths).map(Number).filter(n=>Number.isFinite(n)&&n>=240&&n<=3840).slice(0,4))});
  });
  const currentRoleIds=roleRows.filter(row=>row.observed).map(row=>row.id);
  const observedDeviceIds=unique(roleRows.filter(row=>row.observed).flatMap(row=>row.device_ids));
  const observedBrowserIds=unique(roleRows.filter(row=>row.observed).flatMap(row=>row.browser_ids));
  const regressionRoleIds=roleRows.filter(row=>row.outcome==="regression").map(row=>row.id);
  const currentCoverageComplete=deviceSourceAvailable&&REQUIRED_ROLE_IDS.every(id=>currentRoleIds.includes(id))&&REQUIRED_DEVICE_IDS.every(id=>observedDeviceIds.includes(id));
  let deviceStatus="observation_execution_evidence_required";
  if(!deviceSourceAvailable)deviceStatus="source_unavailable";
  else if(regressionRoleIds.length)deviceStatus="current_regression_observed";
  else if(currentCoverageComplete)deviceStatus="current_authenticated_observation_execution_evidence_recorded";

  let status="execution_evidence_review_incomplete";
  if(recoveryStatus==="source_unavailable"||deviceStatus==="source_unavailable")status="execution_evidence_source_unavailable";
  else if(recoveryStatus!=="bounded_nonproduction_execution_observation_recorded")status="recovery_execution_evidence_incomplete";
  else if(deviceStatus==="current_regression_observed")status="authenticated_device_regression_observed";
  else if(deviceStatus!=="current_authenticated_observation_execution_evidence_recorded")status="authenticated_device_observation_execution_evidence_incomplete";
  else status="execution_evidence_review_ready";

  return Object.freeze({
    generated_at:validIso(generated_at)||new Date().toISOString(),
    execution_evidence_build: 500,
    execution_evidence_authority: "recovery_authenticated_device_observation_execution_evidence",
    retained_continuity_authority:"recovery_authenticated_device_evidence_continuity",
    retained_recovery_authority:"recovery_drill_evidence_refresh_closure_review",
    retained_device_authority:"authenticated_device_observation_refresh_regression_triage",
    status,
    recovery:Object.freeze({status:recoveryStatus,source_available:sourceAvailable,observed,observed_at:observedAt,freshness,bounded_nonproduction_scope_explicit:boundedNonproduction,observer_role_present:observerPresent,backup_reference_present:backupReferencePresent,retention_reference_present:retentionReferencePresent,outcome_recorded:outcomeRecorded,outcome_classification:outcomeClassification,abort_or_deviation_recorded:abortOrDeviationRecorded,evidence_trace_key:evidenceTraceKey,post_observation_requirements_complete:postObservationRequirementsComplete}),
    authenticated_device:Object.freeze({status:deviceStatus,source_available:deviceSourceAvailable,current_observation_coverage_complete:currentCoverageComplete,required_role_ids:REQUIRED_ROLE_IDS,current_role_ids:Object.freeze(currentRoleIds),refresh_required_role_ids:Object.freeze(REQUIRED_ROLE_IDS.filter(id=>!currentRoleIds.includes(id))),required_device_ids:REQUIRED_DEVICE_IDS,observed_device_ids:Object.freeze(observedDeviceIds),refresh_required_device_ids:Object.freeze(REQUIRED_DEVICE_IDS.filter(id=>!observedDeviceIds.includes(id))),observed_browser_ids:Object.freeze(observedBrowserIds),regression_role_ids:Object.freeze(regressionRoleIds),rows:Object.freeze(roleRows)}),
    retained_continuity_status:clean(continuity?.status)||"continuity_review_incomplete",
    separation_rules:Object.freeze({recovery_and_device_populations_joined: false,recovery_execution_observation_must_be_explicit:true,recovery_drill_must_remain_bounded_nonproduction:true,direct_authenticated_role_device_browser_observation_required: true,current_negative_device_observation_overrides_historical_acceptance:true,source_checks_can_prove_observation_execution: false,historical_acceptance_can_prove_current_device_observation:false}),
    canonical_holds:Object.freeze({recovery:Object.freeze({area:"Recovery / backup evidence",retain_hold:true,automatic_narrowing:false}),authenticated_device:Object.freeze({area:"Independent device / visual evidence",retain_hold:true,automatic_narrowing:false})}),
    truth_boundary:Object.freeze({production_restore_performed: false,recovery_drill_executed_by_this_build: false,automated_browser_farm_created: false,automated_screenshot_capture_performed:false,automated_remediation_performed:false,raw_evidence_note_exposed:false,historical_acceptance_overrode_current_negative:false,recovery_and_device_evidence_joined:false,canonical_hold_mutated: false,schema_or_storage_mutated:false,business_data_mutated:false,provider_action_performed:false,permanent_polling: false})
  });
}
function safeArray(v){return Array.isArray(v)?v:[]}
function strings(v){return safeArray(v).map(clean).filter(Boolean)}
function unique(v){return [...new Set(safeArray(v).map(clean).filter(Boolean))]}
function clean(v){return String(v??"").trim()}
function validIso(v){const t=clean(v);return t&&Number.isFinite(Date.parse(t))?new Date(t).toISOString():null}
