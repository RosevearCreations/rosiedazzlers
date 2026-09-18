import assert from "node:assert/strict";
import { buildProductionWorkflowEvidence } from "../functions/api/_lib/production-workflow-evidence.js";

const evidence=[
  {evidence_key:"booking_e2e",status:"verified",verified_at:"2026-09-18T18:00:00Z",evidence_note:"Customer booking and account workflow observed on desktop viewport 1440px."},
  {evidence_key:"mobile",status:"verified",verified_at:"2026-09-18T18:01:00Z",evidence_note:"Detailer assigned job field workflow observed on phone width 390px."},
  {evidence_key:"operations",status:"verified",verified_at:"2026-09-18T18:02:00Z",evidence_note:"Operations work queue and dispatch workflow observed on tablet viewport 1024px."},
  {evidence_key:"accessibility",status:"verified",verified_at:"2026-09-18T18:03:00Z",evidence_note:"Admin management workflow observed on desktop screen width 1366px."}
];
const handoff={available:true,http_status:200,window:{days:45},summary:{jobs_observed:2,evidence_ready:1,completion_evidence_open:1}};

const ready=buildProductionWorkflowEvidence({launch_evidence:evidence,job_handoff:handoff});
assert.equal(ready.status,"ready");
assert.equal(ready.decision,"production_workflow_evidence_complete");
assert.equal(ready.roles.length,4);
assert.equal(ready.observed_real_jobs,2);
assert.equal(ready.roles.find((row)=>row.id==="detailer")?.real_job_observed,true);
assert.equal(ready.truth_boundary.customer_identity_exposed,false);
assert.equal(ready.truth_boundary.role_access_changed,false);
assert.equal(ready.truth_boundary.consent_inferred,false);
assert.ok(ready.roles.every((row)=>row.evidence_note_exposed===false));
assert.ok(ready.roles.every((row)=>!Object.prototype.hasOwnProperty.call(row,"evidence_note")));

const missingDevice=evidence.map((row)=>row.evidence_key==="accessibility"?{...row,evidence_note:"Admin management workflow observed and reviewed."}:row);
const deviceHold=buildProductionWorkflowEvidence({launch_evidence:missingDevice,job_handoff:handoff});
assert.equal(deviceHold.status,"hold");
assert.equal(deviceHold.roles.find((row)=>row.id==="admin")?.device_or_viewport_language_present,false);

const noJobs=buildProductionWorkflowEvidence({launch_evidence:evidence,job_handoff:{...handoff,summary:{jobs_observed:0,evidence_ready:0,completion_evidence_open:0}}});
assert.equal(noJobs.status,"hold");
assert.equal(noJobs.roles.find((row)=>row.id==="detailer")?.status,"owner_action");

const unavailable=buildProductionWorkflowEvidence({launch_evidence:evidence,job_handoff:{available:false,http_status:403,summary:{},window:{}}});
assert.equal(unavailable.status,"hold");
assert.equal(unavailable.roles.find((row)=>row.id==="detailer")?.status,"unavailable");

console.log("CUSTOMER STAFF PRODUCTION WORKFLOW EVIDENCE TEST: PASS");
