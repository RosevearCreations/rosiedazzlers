import assert from "node:assert/strict";
import {buildMaintenanceFleetOwnerApprovalConvergence} from "../functions/api/_lib/maintenance-fleet-owner-approval.js";

const report=buildMaintenanceFleetOwnerApprovalConvergence({
  generated_at:"2026-09-19T00:00:00.000Z",
  commercial_activation:{
    maintenance:{rulebook_status:"awaiting_business_approval",metrics:{total:8,interested:3,contacted:2}},
    fleet:{rulebook_status:"awaiting_business_approval",metrics:{total:4,vehicles_requested:19,quoted:1}}
  },
  fleet_learning:{
    commercial_rules:{source_status:"awaiting_business_approval"},
    inquiry_demand:{inquiry_count:4,vehicles_requested:19,service_area_counts:{Tillsonburg:2,Simcoe:2}},
    operations:{fleet_account_count:1,completed_work_evidence_count:2},
    capacity:{status:"unavailable",availability_authority:"/api/availability",collision_revalidation_authority:"/api/checkout"}
  }
});
assert.equal(report.build,439);
assert.equal(report.status,"owner_action");
assert.equal(report.summary.decision_count,13);
assert.equal(report.summary.owner_action_count,13);
assert.equal(report.maintenance.decisions.every(x=>x.approval_action_available===false),true);
assert.equal(report.fleet.decisions.every(x=>x.status==="owner_action"),true);
assert.equal(report.capacity.current_live_capacity_inferred,false);
assert.equal(report.boundaries.rulebook_write_performed,false);
assert.equal(report.boundaries.automatic_discount_allowed,false);
assert.equal(report.boundaries.invoice_creation_allowed,false);
assert.equal(report.boundaries.booking_creation_allowed,false);
assert.equal(report.boundaries.provider_mutation_allowed,false);

const ready=buildMaintenanceFleetOwnerApprovalConvergence({
 commercial_activation:{maintenance:{rulebook_status:"rules_ready"},fleet:{rulebook_status:"rules_ready"}},
 fleet_learning:{commercial_rules:{source_status:"rules_ready"},capacity:{}}
});
assert.equal(ready.summary.source_approved_count,13);
assert.equal(ready.boundaries.booking_creation_allowed,false);
console.log("maintenance/fleet owner approval convergence test: PASS");
