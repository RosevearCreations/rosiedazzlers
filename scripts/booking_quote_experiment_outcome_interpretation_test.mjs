#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildBookingQuoteControlledExperimentExecutionEvidence } from "../functions/api/_lib/booking-quote-controlled-experiment-execution-evidence.js";
import { buildBookingQuoteExperimentOutcomeInterpretation } from "../functions/api/_lib/booking-quote-experiment-outcome-interpretation.js";

const measurementLock={
  definitions:[{
    key:"booking_stage_clarity",
    area:"booking_stage_clarity",
    state:"measurement_locked",
    lock:{measurement_locked:true,locked_at:"2026-09-20T12:00:00Z",revision:1},
    measurement_contract:{
      primary_metric:"checkout_completion",
      baseline_rule:"retained like-for-like aggregate baseline",
      success_threshold:"owner-defined threshold retained as text",
      target_direction:"increase",
      winner_rule:"owner reviews the locked rule after evidence collection",
      duration_days:14,
      allocation_rule:"50/50 bounded control vs treatment",
      weather_ineligible_handling:"exclude_from_conversion_denominator",
      stop_conditions:["material_confounder_breaks_comparability"]
    }
  }]
};
const auth={records:{booking_stage_clarity:{
  authorized:true,authorized_at:"2026-09-21T12:00:00Z",authorized_by:"owner",
  duration_days:7,allocation_arms:["control","treatment"],weather_eligibility_required:true,
  outcome_capture_authorized:true,stop_conditions_acknowledged:true,measurement_lock_revision:1
}}};
const evidence=[
 {evidence_id:"e1",experiment_key:"booking_stage_clarity",assignment_ref:"anon-a",allocation_arm:"control",allocated_at:"2026-09-21T13:00:00Z",observed_at:"2026-09-23T13:00:00Z",weather:{observed_at:"2026-09-21T12:55:00Z",eligible:true,rule_evidence:"service/site eligible"},stop_condition:{observed_at:"2026-09-23T13:00:00Z",triggered:false,reason:"none"},outcome:{observed_at:"2026-09-23T13:00:00Z",metric_key:"checkout_completion",metric_value:0,metric_unit:"binary",included_in_conversion_denominator:true}},
 {evidence_id:"e2",experiment_key:"booking_stage_clarity",assignment_ref:"anon-b",allocation_arm:"control",allocated_at:"2026-09-21T14:00:00Z",observed_at:"2026-09-23T14:00:00Z",weather:{observed_at:"2026-09-21T13:55:00Z",eligible:true,rule_evidence:"service/site eligible"},stop_condition:{observed_at:"2026-09-23T14:00:00Z",triggered:false,reason:"none"},outcome:{observed_at:"2026-09-23T14:00:00Z",metric_key:"checkout_completion",metric_value:1,metric_unit:"binary",included_in_conversion_denominator:true}},
 {evidence_id:"e3",experiment_key:"booking_stage_clarity",assignment_ref:"anon-c",allocation_arm:"treatment",allocated_at:"2026-09-21T15:00:00Z",observed_at:"2026-09-24T15:00:00Z",weather:{observed_at:"2026-09-21T14:55:00Z",eligible:true,rule_evidence:"service/site eligible"},stop_condition:{observed_at:"2026-09-24T15:00:00Z",triggered:false,reason:"none"},outcome:{observed_at:"2026-09-24T15:00:00Z",metric_key:"checkout_completion",metric_value:1,metric_unit:"binary",included_in_conversion_denominator:true}},
 {evidence_id:"e4",experiment_key:"booking_stage_clarity",assignment_ref:"anon-d",allocation_arm:"treatment",allocated_at:"2026-09-22T15:00:00Z",observed_at:"2026-09-24T16:00:00Z",weather:{observed_at:"2026-09-22T14:55:00Z",eligible:false,rule_evidence:"explicit cold-weather/site restriction"},stop_condition:{observed_at:"2026-09-24T16:00:00Z",triggered:false,reason:"weather exclusion"},outcome:{included_in_conversion_denominator:false}}
];
const execution=buildBookingQuoteControlledExperimentExecutionEvidence({
  measurement_lock:measurementLock,
  execution_authorization:auth,
  execution_evidence:evidence,
  execution_source_available:true,
  generated_at:"2026-09-25T12:00:00Z"
});
assert.equal(execution.rows[0].status,"bounded_execution_evidence_review_ready");
assert.equal(execution.rows[0].execution_evidence.rows[0].outcome.metric_value,0);

const interpretation=buildBookingQuoteExperimentOutcomeInterpretation({
  measurement_lock:measurementLock,
  controlled_execution_evidence:execution,
  generated_at:"2026-09-25T12:01:00Z"
});
const row=interpretation.rows[0];
assert.equal(interpretation.build,502);
assert.equal(row.status,"descriptive_outcome_interpretation_ready");
assert.equal(row.interpretation_evidence.arm_summaries.length,2);
assert.equal(row.interpretation_evidence.arm_summaries[0].mean_metric_value,0.5);
assert.equal(row.interpretation_evidence.arm_summaries[1].mean_metric_value,1);
assert.equal(row.interpretation.success,null);
assert.equal(row.interpretation.winner,null);
assert.equal(row.interpretation.threshold_evaluation,"owner_review_required");
assert.equal(row.truth_boundary.winner_selected,false);
assert.equal(row.truth_boundary.price_or_discount_changed,false);
assert.equal(row.truth_boundary.booking_rule_changed,false);
assert.equal(row.truth_boundary.availability_rule_changed,false);
assert.equal(interpretation.boundaries.automatic_winner_selection_allowed,false);

const missingMetric=structuredClone(evidence);
delete missingMetric[0].outcome.metric_value;
const incompleteExecution=buildBookingQuoteControlledExperimentExecutionEvidence({
  measurement_lock:measurementLock,execution_authorization:auth,execution_evidence:missingMetric,execution_source_available:true
});
const incomplete=buildBookingQuoteExperimentOutcomeInterpretation({
  measurement_lock:measurementLock,controlled_execution_evidence:incompleteExecution
});
assert.equal(incomplete.rows[0].status,"outcome_measurement_incomplete");
assert.equal(incomplete.rows[0].interpretation.winner,null);

const stoppedEvidence=structuredClone(evidence);
stoppedEvidence[2].stop_condition.triggered=true;
stoppedEvidence[2].stop_condition.reason="owner stop condition";
const stoppedExecution=buildBookingQuoteControlledExperimentExecutionEvidence({
  measurement_lock:measurementLock,execution_authorization:auth,execution_evidence:stoppedEvidence,execution_source_available:true
});
const stopped=buildBookingQuoteExperimentOutcomeInterpretation({
  measurement_lock:measurementLock,controlled_execution_evidence:stoppedExecution
});
assert.equal(stopped.rows[0].status,"stop_condition_review_required");
assert.equal(stopped.rows[0].interpretation.success,null);
assert.equal(stopped.rows[0].truth_boundary.incomplete_or_incomparable_evidence_selects_winner,false);

const noExecution=buildBookingQuoteExperimentOutcomeInterpretation({
  measurement_lock:measurementLock,
  controlled_execution_evidence:{build:492,authority:"booking_quote_controlled_experiment_execution_evidence",rows:[]}
});
assert.equal(noExecution.rows[0].status,"execution_evidence_not_ready");
assert.equal(noExecution.rows[0].truth_boundary.permanent_polling,false);

console.log("BUILD 502 BOOKING & QUOTE EXPERIMENT OUTCOME INTERPRETATION TEST: PASS");
