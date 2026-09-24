#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildMaintenanceFleetPilotOutcomeEvidence } from "../functions/api/_lib/maintenance-fleet-pilot-outcome-evidence.js";

const heldOwner={
  pilot_decision_record:{
    status:"owner_action",decision:"not_recorded",
    owner_pilot_authorization_recorded:false,commercial_rulebooks_approved:false,
    owner_bounds:{participant_limit:null,duration_days:null,complete:false}
  }
};
const held=buildMaintenanceFleetPilotOutcomeEvidence({
  owner_approval:heldOwner,execution_evidence:[],execution_source_available:false,
  generated_at:"2026-09-24T15:00:00Z"
});
assert.equal(held.build,491);
assert.equal(held.status,"owner_action_authorization_required");
assert.equal(held.authorization.attributable_outcome_capture_allowed,false);
assert.equal(held.execution_source.missing_execution_evidence_is_owner_action,true);
assert.equal(held.truth_boundary.capacity_reserved,false);
assert.equal(held.truth_boundary.execution_success_inferred_from_source_green,false);

const approvedOwner={
  pilot_decision_record:{
    status:"pilot_decision_recorded",decision:"approve",
    owner_pilot_authorization_recorded:true,commercial_rulebooks_approved:true,
    owner_bounds:{participant_limit:2,duration_days:14,complete:true}
  }
};
const noEvidence=buildMaintenanceFleetPilotOutcomeEvidence({
  owner_approval:approvedOwner,execution_evidence:[],execution_source_available:true
});
assert.equal(noEvidence.status,"owner_action_execution_evidence_required");
assert.equal(noEvidence.authorization.participant_limit,2);
assert.equal(noEvidence.authorization.duration_days,14);

const completeRows=[
  {
    evidence_id:"pilot-1",participant_ref:"maintenance-001",participant_type:"maintenance",
    started_at:"2026-09-01T12:00:00Z",ended_at:"2026-09-04T12:00:00Z",
    availability_revalidated_at:"2026-09-01T11:00:00Z",checkout_revalidated_at:"2026-09-01T11:30:00Z",
    invoice_evidence:{observed_at:"2026-09-04T13:00:00Z",status:"issued"},
    travel_evidence:{observed_at:"2026-09-04T12:30:00Z",distance_km:18.4},
    stop_condition:{observed_at:"2026-09-04T12:05:00Z",triggered:false,reason:"none"}
  },
  {
    evidence_id:"pilot-2",participant_ref:"fleet-001",participant_type:"fleet",
    started_at:"2026-09-02T12:00:00Z",ended_at:"2026-09-08T12:00:00Z",
    availability_revalidated_at:"2026-09-02T11:00:00Z",checkout_revalidated_at:"2026-09-02T11:30:00Z",
    invoice_evidence:{observed_at:"2026-09-08T13:00:00Z",status:"issued"},
    travel_evidence:{observed_at:"2026-09-08T12:30:00Z",distance_km:32.6},
    stop_condition:{observed_at:"2026-09-08T12:05:00Z",triggered:true,reason:"owner stop condition"}
  }
];
const ready=buildMaintenanceFleetPilotOutcomeEvidence({
  owner_approval:approvedOwner,execution_evidence:completeRows,execution_source_available:true
});
assert.equal(ready.status,"bounded_pilot_outcome_review_ready");
assert.equal(ready.participants.observed_count,2);
assert.equal(ready.participants.bound_satisfied,true);
assert.equal(ready.duration.observed_duration_days,7);
assert.equal(ready.duration.bound_satisfied,true);
assert.equal(ready.capacity.every_attributed_row_has_capacity_evidence,true);
assert.equal(ready.invoicing.every_attributed_row_has_invoice_evidence,true);
assert.equal(ready.travel.observed_distance_km,51);
assert.equal(ready.stop_conditions.triggered_count,1);
assert.equal(ready.truth_boundary.customer_activation_performed,false);
assert.equal(ready.truth_boundary.automatic_invoice_created,false);

const incomplete=structuredClone(completeRows);
incomplete[1].checkout_revalidated_at=null;
const review=buildMaintenanceFleetPilotOutcomeEvidence({
  owner_approval:approvedOwner,execution_evidence:incomplete,execution_source_available:true
});
assert.equal(review.status,"outcome_evidence_incomplete");
assert.equal(review.capacity.every_attributed_row_has_capacity_evidence,false);
assert.equal(review.truth_boundary.guaranteed_capacity_inferred,false);

console.log("BUILD 491 MAINTENANCE & FLEET PILOT OUTCOME EVIDENCE TEST: PASS");
