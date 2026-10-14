import assert from "node:assert/strict";
import {build556OwnerHoldIntake,HOLD_DEFINITIONS_556} from "../assets/hold-evidence-intake-556.js";
const at="2026-10-13T20:00:00Z",now="2026-10-13T22:00:00Z";
const target=id=>HOLD_DEFINITIONS_556.find(x=>x.id===id);
function make(d){
 return {hold_id:d.id,evidence_class:d.kind,scope_key:"internal-123",
 evidence:d.needs.map(type=>({type,source_system:d.kind==="provider_dependent"?"provider":"owner",
  source_reference:"evidence-123",scope_key:"internal-123",observed_at:at,outcome:"observed_pass"})),
 owner_review:{decision:"request_manual_closure_review",reviewer_reference:"owner-123",
  reviewed_at:"2026-10-13T21:00:00Z",scope_key:"internal-123"}};
}
const check=rows=>build556OwnerHoldIntake({schema:"rosie-hold-intake-556",rows},now);
const row=make(target("recovery_backup_evidence"));
assert.equal(check([row]).manual_review_candidate_count,1);
assert.equal(check([row]).items.every(x=>x.hold_closed===false),true);
assert.equal(check([row]).truth_boundary.all_canonical_holds_remain_open,true);
assert.equal(check([]).manual_review_candidate_count,0);
assert.equal(check([row,row]).manual_review_candidate_count,0);
let bad=structuredClone(row);bad.evidence[0].source_reference="someone@email.com";assert.equal(check([bad]).manual_review_candidate_count,0);
bad=structuredClone(row);bad.evidence[0].observed_at="2025-01-01T00:00:00Z";assert.equal(check([bad]).manual_review_candidate_count,0);
bad=structuredClone(row);bad.evidence[0].outcome="observed_failure";assert.equal(check([bad]).manual_review_candidate_count,0);
bad=structuredClone(row);bad.owner_review.reviewed_at="2026-10-13T19:00:00Z";assert.equal(check([bad]).manual_review_candidate_count,0);
bad=structuredClone(row);bad.hold_closed=true;assert.equal(check([bad]).manual_review_candidate_count,0);
bad=structuredClone(row);bad.owner_review.decision="retain_hold";assert.equal(check([bad]).items.find(x=>x.hold_id===row.hold_id).status,"owner_retained_hold");
assert.equal(check([make(target("evidence_source_unavailable"))]).manual_review_candidate_count,0);
const d=make(target("independent_device_visual_evidence"));
for(const e of d.evidence){e.device_type="desktop";e.browser_reference="chrome";e.route_reference="/admin";e.viewport_reference="1366x768";}
assert.equal(check([d]).manual_review_candidate_count,0);
d.evidence[0].device_type="phone";d.evidence[1].device_type="tablet";assert.equal(check([d]).manual_review_candidate_count,1);
assert.equal(check([make(target("provider_outcomes_communications"))]).manual_review_candidate_count,1);
console.log("BUILD 556 OWNER HOLD EVIDENCE INTAKE REGRESSION PASS");
