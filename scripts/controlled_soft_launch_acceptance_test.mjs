import assert from "node:assert/strict";
import { buildLaunchReadinessConsolidation } from "../functions/api/_lib/launch-readiness-consolidation.js";

const readiness={items:[
  {id:"runtime_identity",classification:"runtime_proven",required_for_runtime:true,evidence:{commit_sha:"b".repeat(40),branch:"main",host:"rosiedazzlers.ca"}},
  {id:"supabase_runtime",classification:"runtime_proven",required_for_runtime:true}
]};
const support={alert_counts:{critical:0,warning:0}};
const required=["booking_e2e","backups","legal","mobile","accessibility","analytics","security","monitoring","operations","rollback_drill","email_delivery","incident_closeout"];
const notes={
  operations:"Controlled invite-only known-customer soft launch approved by operator.",
  booking_e2e:"Real controlled Production customer booking observed.",
  email_delivery:"Controlled email delivery observed for consent-safe pilot.",
  mobile:"Detailer mobile field job observed on controlled pilot device."
};
const evidence=required.map((evidence_key)=>({evidence_key,status:"verified",verified_at:"2026-09-18T12:00:00Z",evidence_note:notes[evidence_key]||"Observed controlled evidence with operator review."}));
const job_handoff={available:true,http_status:200,window:{days:45},summary:{jobs_observed:2,evidence_ready:1,completion_evidence_open:1}};

const ready=buildLaunchReadinessConsolidation({readiness,support,launch_evidence:evidence,job_handoff});
assert.equal(ready.source_runtime_status,"green");
assert.equal(ready.controlled_soft_launch.status,"ready");
assert.equal(ready.controlled_soft_launch.observed_real_jobs,2);
assert.equal(ready.controlled_soft_launch.evidence_ready_jobs,1);
assert.equal(ready.controlled_soft_launch.customer_identity_exposed,false);
assert.equal(ready.controlled_soft_launch.participant_authorization_inferred,false);
assert.equal(ready.truth_boundary.real_customer_journey_inferred,false);
assert.equal(ready.truth_boundary.automatic_outreach_performed,false);

const weakScope=buildLaunchReadinessConsolidation({readiness,support,launch_evidence:evidence.map((row)=>row.evidence_key==="operations"?{...row,evidence_note:"Routine operations evidence."}:row),job_handoff});
assert.equal(weakScope.controlled_soft_launch.status,"hold");
assert.ok(weakScope.controlled_soft_launch.outstanding.some((row)=>row.id==="invite_scope"));

const noJobs=buildLaunchReadinessConsolidation({readiness,support,launch_evidence:evidence,job_handoff:{available:true,http_status:200,window:{days:45},summary:{jobs_observed:0,evidence_ready:0,completion_evidence_open:0}}});
assert.equal(noJobs.controlled_soft_launch.status,"hold");
assert.ok(noJobs.controlled_soft_launch.outstanding.some((row)=>row.id==="field_observation"));
assert.ok(noJobs.controlled_soft_launch.outstanding.some((row)=>row.id==="completion_observation"));

const inaccessible=buildLaunchReadinessConsolidation({readiness,support,launch_evidence:evidence,job_handoff:{available:false,http_status:403,summary:{},window:{}}});
assert.equal(inaccessible.controlled_soft_launch.status,"hold");
assert.ok(inaccessible.controlled_soft_launch.stages.some((row)=>row.status==="unavailable"));

console.log("CONTROLLED SOFT LAUNCH ACCEPTANCE TEST: PASS");
