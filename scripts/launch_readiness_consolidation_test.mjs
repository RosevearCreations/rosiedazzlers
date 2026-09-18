import assert from "node:assert/strict";
import { buildLaunchReadinessConsolidation } from "../functions/api/_lib/launch-readiness-consolidation.js";

const baseReadiness={
  items:[
    {id:"runtime_identity",title:"Runtime",classification:"runtime_proven",required_for_runtime:true,evidence:{commit_sha:"a".repeat(40),branch:"main",host:"rosiedazzlers.ca"}},
    {id:"supabase_runtime",title:"Supabase",classification:"runtime_proven",required_for_runtime:true},
    {id:"search_local_proof",title:"Search proof",classification:"owner_action",detail:"Review provider evidence."}
  ]
};
const support={alert_counts:{critical:0,warning:1}};
const evidence=[
  "booking_e2e","backups","legal","mobile","accessibility","analytics","security","monitoring","operations","rollback_drill"
].map((evidence_key)=>({evidence_key,status:"verified",verified_at:"2026-09-18T00:00:00Z",evidence_note:"Observed controlled evidence."}));

const ready=buildLaunchReadinessConsolidation({readiness:baseReadiness,support,launch_evidence:evidence,generated_at:"2026-09-18T00:00:00Z"});
assert.equal(ready.source_runtime_status,"green");
assert.equal(ready.controlled_launch_status,"ready");
assert.equal(ready.unrestricted_launch_status,"hold");
assert.equal(ready.recovery.backup_evidence_observed,true);
assert.equal(ready.recovery.rollback_drill_observed,true);
assert.equal(ready.external_holds.length,1);
assert.equal(ready.truth_boundary.export_performed,false);
assert.equal(ready.exports.every((row)=>row.classification==="source_ready"),true);

const blocked=buildLaunchReadinessConsolidation({
  readiness:{items:[{id:"runtime_identity",title:"Runtime",classification:"unavailable",required_for_runtime:true}]},
  support:{alert_counts:{critical:1,warning:0}},
  launch_evidence:[]
});
assert.equal(blocked.source_runtime_status,"blocked");
assert.equal(blocked.controlled_launch_status,"hold");
assert.equal(blocked.decision,"runtime_blocked");
assert.ok(blocked.launch_evidence.required_outstanding.length>0);

const ownerHold=buildLaunchReadinessConsolidation({
  readiness:{items:baseReadiness.items.slice(0,2)},
  support:{alert_counts:{critical:0,warning:0}},
  launch_evidence:evidence.filter((row)=>row.evidence_key!=="backups")
});
assert.equal(ownerHold.controlled_launch_status,"hold");
assert.equal(ownerHold.recovery.backup_evidence_observed,false);
assert.ok(ownerHold.next_actions.some((row)=>row.action.includes("backup/export evidence")));

console.log("LAUNCH READINESS CONSOLIDATION TEST: PASS");
