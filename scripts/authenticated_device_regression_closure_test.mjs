import assert from "node:assert/strict";
import { buildAuthenticatedDeviceVisualAcceptance } from "../functions/api/_lib/authenticated-device-visual-acceptance.js";

const launchEvidence=[
 {evidence_key:"booking_e2e",status:"verified",verified_at:"2026-09-21T12:00:00Z",evidence_note:"Authenticated customer account session on desktop Chrome route /book viewport 1440px passed with no errors."},
 {evidence_key:"mobile",status:"verified",verified_at:"2026-09-21T12:01:00Z",evidence_note:"Signed-in Detailer assigned job workflow on phone Safari route /app/detailer/ width 390px passed successfully."},
 {evidence_key:"operations",status:"verified",verified_at:"2026-09-21T12:02:00Z",evidence_note:"Authenticated Operations work queue on tablet Chrome route /app/operations/ viewport 1024px passed with no blocking errors."},
 {evidence_key:"accessibility",status:"verified",verified_at:"2026-09-21T12:03:00Z",evidence_note:"Logged-in Admin management workflow on desktop Edge route /admin-today.html screen width 1366px rendered successfully."}
];
const workflow={status:"ready",roles:[
 {id:"customer",status:"verified"},{id:"detailer",status:"verified"},{id:"operations",status:"verified"},{id:"admin",status:"verified"}
]};

const clean=buildAuthenticatedDeviceVisualAcceptance({
 launch_evidence:launchEvidence,workflow_evidence:workflow,source_available:true,
 generated_at:"2026-09-21T15:00:00Z",freshness_days:30
});
assert.equal(clean.regression_closure.authority,"authenticated_device_regression_closure");
assert.equal(clean.regression_closure.status,"no_current_regression_observed");
assert.equal(clean.regression_closure.current_coverage_complete,true);
assert.deepEqual(clean.regression_closure.current_pass_role_ids,["customer","detailer","operations","admin"]);
assert.deepEqual(clean.regression_closure.current_regression_role_ids,[]);
assert.deepEqual(clean.regression_closure.historical_only_role_ids,[]);
assert.deepEqual(clean.regression_closure.current_device_ids.sort(),["desktop","phone","tablet"]);
assert.deepEqual(clean.regression_closure.current_regression_device_ids,[]);
assert.equal(clean.regression_closure.historical_acceptance_is_not_current_regression_proof,true);
assert.equal(clean.regression_closure.operator_review_required,true);
assert.equal(clean.regression_closure.canonical_hold_mutated,false);

const regressionEvidence=launchEvidence.map(row=>row.evidence_key==="mobile"?{
 ...row,
 evidence_note:"Signed-in Detailer assigned job workflow on phone Safari route /app/detailer/ width 390px failed with a blocking error and is unusable."
}:row);
const regression=buildAuthenticatedDeviceVisualAcceptance({
 launch_evidence:regressionEvidence,workflow_evidence:workflow,source_available:true,
 generated_at:"2026-09-21T15:00:00Z",freshness_days:30
});
assert.equal(regression.status,"hold");
assert.equal(regression.roles.find(row=>row.id==="detailer")?.current_regression,true);
assert.equal(regression.roles.find(row=>row.id==="detailer")?.status,"regression_observed");
assert.equal(regression.regression_closure.status,"current_regression_observed");
assert.equal(regression.regression_closure.current_coverage_complete,true);
assert.deepEqual(regression.regression_closure.current_regression_role_ids,["detailer"]);
assert.deepEqual(regression.regression_closure.current_regression_device_ids,["phone"]);
assert.deepEqual(regression.regression_closure.current_regression_browser_ids,["safari"]);
assert.equal(regression.regression_closure.retained_historical_acceptance_role_ids.includes("detailer"),true);
assert.equal(regression.regression_closure.historical_acceptance_overrides_current_regression,false);
assert.equal(regression.acceptance_closure.closure_candidate,false);

const staleEvidence=launchEvidence.map(row=>row.evidence_key==="mobile"?{...row,verified_at:"2026-07-01T12:01:00Z"}:row);
const stale=buildAuthenticatedDeviceVisualAcceptance({
 launch_evidence:staleEvidence,workflow_evidence:workflow,source_available:true,
 generated_at:"2026-09-21T15:00:00Z",freshness_days:30
});
assert.equal(stale.regression_closure.status,"refresh_required");
assert.equal(stale.regression_closure.current_coverage_complete,false);
assert.deepEqual(stale.regression_closure.historical_only_role_ids,["detailer"]);
assert.deepEqual(stale.regression_closure.current_regression_role_ids,[]);
assert.equal(stale.roles.find(row=>row.id==="detailer")?.historical_acceptance,true);

const regressionAndMissing=regressionEvidence.filter(row=>row.evidence_key!=="operations");
const partial=buildAuthenticatedDeviceVisualAcceptance({
 launch_evidence:regressionAndMissing,workflow_evidence:workflow,source_available:true,
 generated_at:"2026-09-21T15:00:00Z",freshness_days:30
});
assert.equal(partial.regression_closure.status,"current_regression_observed_refresh_incomplete");
assert.equal(partial.regression_closure.current_coverage_complete,false);
assert.equal(partial.regression_closure.current_regression_role_ids.includes("detailer"),true);
assert.equal(partial.regression_closure.refresh_required_role_ids.includes("operations"),true);

const unavailable=buildAuthenticatedDeviceVisualAcceptance({
 launch_evidence:[],workflow_evidence:null,source_available:false,
 generated_at:"2026-09-21T15:00:00Z",freshness_days:30
});
assert.equal(unavailable.regression_closure.status,"unavailable");
assert.equal(unavailable.regression_closure.current_coverage_complete,false);
assert.equal(unavailable.regression_closure.operator_review_required,true);

console.log("AUTHENTICATED DEVICE REGRESSION CLOSURE TEST: PASS");
