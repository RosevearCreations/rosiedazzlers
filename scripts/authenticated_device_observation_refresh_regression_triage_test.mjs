import assert from "node:assert/strict";
import { buildAuthenticatedDeviceVisualAcceptance } from "../functions/api/_lib/authenticated-device-visual-acceptance.js";

const launchEvidence=[
 {evidence_key:"booking_e2e",status:"verified",verified_at:"2026-09-22T12:00:00Z",evidence_note:"Authenticated customer account session on desktop Chrome route /book viewport 1440px passed with no errors."},
 {evidence_key:"mobile",status:"verified",verified_at:"2026-09-22T12:01:00Z",evidence_note:"Signed-in Detailer assigned job workflow on phone Safari route /app/detailer/ width 390px passed successfully."},
 {evidence_key:"operations",status:"verified",verified_at:"2026-09-22T12:02:00Z",evidence_note:"Authenticated Operations work queue on tablet Chrome route /app/operations/ viewport 1024px passed with no blocking errors."},
 {evidence_key:"accessibility",status:"verified",verified_at:"2026-09-22T12:03:00Z",evidence_note:"Logged-in Admin management workflow on desktop Edge route /admin-today.html screen width 1366px rendered successfully."}
];
const workflow={status:"ready",roles:[
 {id:"customer",status:"verified"},{id:"detailer",status:"verified"},{id:"operations",status:"verified"},{id:"admin",status:"verified"}
]};

const clean=buildAuthenticatedDeviceVisualAcceptance({
 launch_evidence:launchEvidence,workflow_evidence:workflow,source_available:true,
 generated_at:"2026-09-22T15:00:00Z",freshness_days:30
});
const cleanTriage=clean.observation_refresh_regression_triage;
assert.equal(cleanTriage.authority,"authenticated_device_observation_refresh_regression_triage");
assert.equal(cleanTriage.build,478);
assert.equal(cleanTriage.status,"current_observation_review_ready");
assert.equal(cleanTriage.current_observation_coverage_complete,true);
assert.deepEqual(cleanTriage.newly_observed_regression_role_ids,[]);
assert.equal(cleanTriage.regression_triage_count,0);
assert.equal(cleanTriage.bounded_remediation_triage_ready,false);
assert.equal(cleanTriage.source_checks_can_prove_absence_of_regression,false);
assert.equal(cleanTriage.automated_browser_farm_created,false);
assert.equal(cleanTriage.automated_remediation_performed,false);
assert.equal(cleanTriage.canonical_hold_mutated,false);

const regressionEvidence=launchEvidence.map(row=>row.evidence_key==="mobile"?{
 ...row,
 evidence_note:"Signed-in Detailer assigned job workflow on phone Safari route /app/detailer/ width 390px failed with a blocking error and is unusable."
}:row);
const regression=buildAuthenticatedDeviceVisualAcceptance({
 launch_evidence:regressionEvidence,workflow_evidence:workflow,source_available:true,
 generated_at:"2026-09-22T15:00:00Z",freshness_days:30
});
const triage=regression.observation_refresh_regression_triage;
assert.equal(triage.status,"regression_triage_required");
assert.deepEqual(triage.newly_observed_regression_role_ids,["detailer"]);
assert.equal(triage.newly_observed_means_current_negative_observation_not_first_occurrence,true);
assert.equal(triage.regression_triage_count,1);
assert.equal(triage.bounded_remediation_triage_ready,true);
assert.equal(triage.regression_triage_items[0].role_id,"detailer");
assert.equal(triage.regression_triage_items[0].remediation_state,"triage_required");
assert.equal(triage.regression_triage_items[0].remediation_execution_authorized,false);
assert.equal(triage.regression_triage_items[0].re_observation_required,true);
assert.deepEqual(triage.regression_device_ids,["phone"]);
assert.deepEqual(triage.regression_browser_ids,["safari"]);
assert.equal(triage.historical_acceptance_can_override_current_regression,false);

const incomplete=buildAuthenticatedDeviceVisualAcceptance({
 launch_evidence:launchEvidence.filter(row=>row.evidence_key!=="operations"),
 workflow_evidence:workflow,source_available:true,
 generated_at:"2026-09-22T15:00:00Z",freshness_days:30
}).observation_refresh_regression_triage;
assert.equal(incomplete.status,"observation_refresh_required");
assert.equal(incomplete.refresh_required_role_ids.includes("operations"),true);
assert.equal(incomplete.refresh_required_device_ids.includes("tablet"),true);
assert.equal(incomplete.bounded_remediation_triage_ready,false);

const unavailable=buildAuthenticatedDeviceVisualAcceptance({
 launch_evidence:[],workflow_evidence:null,source_available:false,
 generated_at:"2026-09-22T15:00:00Z",freshness_days:30
}).observation_refresh_regression_triage;
assert.equal(unavailable.status,"unavailable");
assert.equal(unavailable.bounded_remediation_triage_ready,false);
assert.equal(unavailable.operator_review_required,true);

console.log("AUTHENTICATED DEVICE OBSERVATION REFRESH REGRESSION TRIAGE TEST: PASS");
