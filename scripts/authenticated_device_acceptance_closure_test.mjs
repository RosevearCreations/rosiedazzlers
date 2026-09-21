import assert from "node:assert/strict";
import { buildAuthenticatedDeviceVisualAcceptance } from "../functions/api/_lib/authenticated-device-visual-acceptance.js";

const launchEvidence=[
 {evidence_key:"booking_e2e",status:"verified",verified_at:"2026-09-20T12:00:00Z",evidence_note:"Authenticated customer account session on desktop Chrome route /book viewport 1440px passed with no errors."},
 {evidence_key:"mobile",status:"verified",verified_at:"2026-09-20T12:01:00Z",evidence_note:"Signed-in Detailer assigned job workflow on phone Safari route /app/detailer/ width 390px passed successfully."},
 {evidence_key:"operations",status:"verified",verified_at:"2026-09-20T12:02:00Z",evidence_note:"Authenticated Operations work queue on tablet Chrome route /app/operations/ viewport 1024px passed with no blocking errors."},
 {evidence_key:"accessibility",status:"verified",verified_at:"2026-09-20T12:03:00Z",evidence_note:"Logged-in Admin management workflow on desktop Edge route /admin-today.html screen width 1366px rendered successfully."}
];
const workflow={status:"ready",roles:[
 {id:"customer",status:"verified"},{id:"detailer",status:"verified"},{id:"operations",status:"verified"},{id:"admin",status:"verified"}
]};

const current=buildAuthenticatedDeviceVisualAcceptance({launch_evidence:launchEvidence,workflow_evidence:workflow,source_available:true,generated_at:"2026-09-20T15:00:00Z",freshness_days:30});
assert.equal(current.status,"closure_candidate");
assert.equal(current.acceptance_closure.authority,"authenticated_device_acceptance_closure");
assert.equal(current.acceptance_closure.status,"operator_review_ready");
assert.equal(current.acceptance_closure.current_role_count,4);
assert.equal(current.acceptance_closure.current_device_count,3);
assert.deepEqual(current.acceptance_closure.stale_role_ids,[]);
assert.deepEqual(current.acceptance_closure.missing_role_ids,[]);
assert.equal(current.acceptance_closure.operator_review_required,true);
assert.equal(current.acceptance_closure.canonical_hold_mutated,false);

const staleEvidence=launchEvidence.map(row=>row.evidence_key==="mobile"?{...row,verified_at:"2026-07-01T12:01:00Z"}:row);
const stale=buildAuthenticatedDeviceVisualAcceptance({launch_evidence:staleEvidence,workflow_evidence:workflow,source_available:true,generated_at:"2026-09-20T15:00:00Z",freshness_days:30});
assert.equal(stale.acceptance_closure.status,"owner_action");
assert.deepEqual(stale.acceptance_closure.stale_role_ids,["detailer"]);
assert.deepEqual(stale.acceptance_closure.stale_device_ids,["phone"]);
assert.equal(stale.acceptance_closure.closure_candidate,false);

const missingEvidence=launchEvidence.filter(row=>row.evidence_key!=="accessibility");
const missing=buildAuthenticatedDeviceVisualAcceptance({launch_evidence:missingEvidence,workflow_evidence:workflow,source_available:true,generated_at:"2026-09-20T15:00:00Z",freshness_days:30});
assert.deepEqual(missing.acceptance_closure.missing_role_ids,["admin"]);
assert.equal(missing.acceptance_closure.status,"owner_action");

const unavailable=buildAuthenticatedDeviceVisualAcceptance({launch_evidence:[],workflow_evidence:null,source_available:false,generated_at:"2026-09-20T15:00:00Z",freshness_days:30});
assert.equal(unavailable.acceptance_closure.status,"unavailable");
assert.equal(unavailable.acceptance_closure.current_role_count,0);
assert.equal(unavailable.acceptance_closure.current_device_count,0);

console.log("AUTHENTICATED DEVICE ACCEPTANCE CLOSURE TEST: PASS");
