import assert from "node:assert/strict";
import { buildAuthenticatedDeviceVisualAcceptance } from "../functions/api/_lib/authenticated-device-visual-acceptance.js";

const launchEvidence=[
 {evidence_key:"booking_e2e",status:"verified",verified_at:"2026-09-18T18:00:00Z",evidence_note:"Authenticated customer account session on desktop Chrome route /book viewport 1440px passed with no errors."},
 {evidence_key:"mobile",status:"verified",verified_at:"2026-09-18T18:01:00Z",evidence_note:"Signed-in Detailer assigned job workflow on phone Safari route /app/detailer/ width 390px passed successfully."},
 {evidence_key:"operations",status:"verified",verified_at:"2026-09-18T18:02:00Z",evidence_note:"Authenticated Operations work queue on tablet Chrome route /app/operations/ viewport 1024px passed with no blocking errors."},
 {evidence_key:"accessibility",status:"verified",verified_at:"2026-09-18T18:03:00Z",evidence_note:"Logged-in Admin management workflow on desktop Edge route /admin-today.html screen width 1366px rendered successfully."}
];
const workflow={status:"ready",roles:[
 {id:"customer",status:"verified"},{id:"detailer",status:"verified"},{id:"operations",status:"verified"},{id:"admin",status:"verified"}
]};
const ready=buildAuthenticatedDeviceVisualAcceptance({launch_evidence:launchEvidence,workflow_evidence:workflow,source_available:true,generated_at:"2026-09-19T18:00:00Z"});
assert.equal(ready.status,"closure_candidate");
assert.equal(ready.closure_candidate,true);
assert.equal(ready.dated_role_count,4);
assert.equal(ready.dated_device_count,3);
assert.equal(ready.devices.find(row=>row.id==="phone")?.observed,true);
assert.equal(ready.devices.find(row=>row.id==="tablet")?.observed,true);
assert.equal(ready.devices.find(row=>row.id==="desktop")?.observed,true);
assert.equal(ready.roles.find(row=>row.id==="detailer")?.routes.includes("/app/detailer/"),true);
assert.equal(ready.roles.every(row=>row.evidence_note_exposed===false),true);
assert.equal(ready.truth_boundary.automated_screenshot_polling,false);
assert.equal(ready.truth_boundary.customer_or_booking_mutation_performed,false);

const noTablet=launchEvidence.map(row=>row.evidence_key==="operations"?{...row,evidence_note:"Authenticated Operations work queue on desktop Chrome route /app/operations/ viewport 1366px passed."}:row);
const hold=buildAuthenticatedDeviceVisualAcceptance({launch_evidence:noTablet,workflow_evidence:workflow,source_available:true});
assert.equal(hold.status,"hold");
assert.equal(hold.devices.find(row=>row.id==="tablet")?.status,"owner_action");

const missingBrowser=launchEvidence.map(row=>row.evidence_key==="accessibility"?{...row,evidence_note:"Logged-in Admin management workflow on desktop route /admin-today.html screen width 1366px rendered successfully."}:row);
const browserHold=buildAuthenticatedDeviceVisualAcceptance({launch_evidence:missingBrowser,workflow_evidence:workflow,source_available:true});
assert.equal(browserHold.roles.find(row=>row.id==="admin")?.status,"owner_action");
assert.equal(browserHold.roles.find(row=>row.id==="admin")?.browser_evidence_present,false);

const unavailable=buildAuthenticatedDeviceVisualAcceptance({launch_evidence:[],workflow_evidence:null,source_available:false});
assert.equal(unavailable.status,"hold");
assert.equal(unavailable.roles.every(row=>row.status==="unavailable"),true);
assert.equal(unavailable.devices.every(row=>row.status==="unavailable"),true);

console.log("AUTHENTICATED DEVICE & VISUAL ACCEPTANCE TEST: PASS");
