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
assert.equal(current.freshness_days,30);
assert.equal(current.stale_role_count,0);
assert.equal(current.roles.every(row=>row.current===true&&row.fresh===true&&!row.stale),true);
assert.equal(current.dated_device_count,3);

const staleEvidence=launchEvidence.map(row=>row.evidence_key==="mobile"?{...row,verified_at:"2026-07-01T12:01:00Z"}:row);
const stale=buildAuthenticatedDeviceVisualAcceptance({launch_evidence:staleEvidence,workflow_evidence:workflow,source_available:true,generated_at:"2026-09-20T15:00:00Z",freshness_days:30});
const detailer=stale.roles.find(row=>row.id==="detailer");
assert.equal(stale.status,"hold");
assert.equal(stale.stale_role_count,1);
assert.equal(detailer.observed,true);
assert.equal(detailer.current,false);
assert.equal(detailer.stale,true);
assert.equal(detailer.status,"owner_action");
assert.equal(stale.devices.find(row=>row.id==="phone")?.status,"owner_action");
assert.equal(stale.truth_boundary.stale_observation_is_not_current_release_proof,true);

console.log("AUTHENTICATED CROSS-DEVICE ACCEPTANCE REFRESH TEST: PASS");
