import assert from "node:assert/strict";
import {buildMaintenanceFleetOwnerApprovalConvergence} from "../functions/api/_lib/maintenance-fleet-owner-approval.js";

const current=buildMaintenanceFleetOwnerApprovalConvergence({
  generated_at:"2026-09-20T16:00:00.000Z",
  commercial_activation:{
    maintenance:{rulebook_status:"awaiting_business_approval",metrics:{total:9,interested:4,contacted:2}},
    fleet:{rulebook_status:"awaiting_business_approval",metrics:{total:5,vehicles_requested:24,quoted:2}}
  },
  fleet_learning:{
    commercial_rules:{source_status:"awaiting_business_approval"},
    inquiry_demand:{inquiry_count:5,vehicles_requested:24,service_area_counts:{Tillsonburg:3,Simcoe:2}},
    operations:{fleet_account_count:1,completed_work_evidence_count:3},
    capacity:{status:"source_ready",availability_authority:"/api/availability",collision_revalidation_authority:"/api/checkout"}
  }
});

assert.equal(current.build,439);
assert.equal(current.current_build,449);
assert.equal(current.authority,"fleet_maintenance_commercial_decision_closure");
assert.equal(current.status,"owner_action");
assert.equal(current.decision_closure.status,"owner_action");
assert.equal(current.decision_closure.closure_candidate,false);
assert.equal(current.decision_closure.decision_count,13);
assert.equal(current.decision_closure.owner_action_count,13);
assert.equal(current.decision_closure.automatic_approval_performed,false);
assert.equal(current.decision_closure.approval_timestamp_inferred,false);
assert.equal(current.maintenance.decisions.every(row=>row.required_fields.length>0),true);
assert.equal(current.fleet.decisions.every(row=>row.required_fields.length>0),true);
assert.equal(current.maintenance.decisions.every(row=>row.owner_decision_path.includes("#decisions.")),true);
assert.equal(current.fleet.decisions.every(row=>row.owner_decision_path.includes("#decisions.")),true);
assert.equal(current.capacity.live_capacity_is_separate_from_commercial_policy,true);
assert.equal(current.capacity.current_live_capacity_inferred,false);
assert.equal(current.boundaries.commercial_decision_write_performed,false);
assert.equal(current.boundaries.automatic_discount_allowed,false);
assert.equal(current.boundaries.invoice_creation_allowed,false);
assert.equal(current.boundaries.booking_creation_allowed,false);
assert.equal(current.boundaries.recurring_billing_allowed,false);

const ready=buildMaintenanceFleetOwnerApprovalConvergence({
  commercial_activation:{
    maintenance:{rulebook_status:"rules_ready"},
    fleet:{rulebook_status:"rules_ready"}
  },
  fleet_learning:{
    commercial_rules:{source_status:"rules_ready"},
    capacity:{status:"source_ready",availability_authority:"/api/availability",collision_revalidation_authority:"/api/checkout"}
  }
});

assert.equal(ready.status,"source_approved");
assert.equal(ready.decision_closure.status,"owner_review_candidate");
assert.equal(ready.decision_closure.closure_candidate,true);
assert.equal(ready.decision_closure.source_approved_count,13);
assert.equal(ready.decision_closure.owner_review_required,true);
assert.equal(ready.boundaries.owner_decision_mutation_available,false);
assert.equal(ready.boundaries.automatic_approval_performed,false);
assert.equal(ready.boundaries.booking_creation_allowed,false);
assert.equal(ready.boundaries.invoice_creation_allowed,false);
assert.equal(ready.boundaries.provider_mutation_allowed,false);

console.log("FLEET & MAINTENANCE COMMERCIAL DECISION CLOSURE TEST: PASS");
