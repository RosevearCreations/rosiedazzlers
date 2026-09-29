#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildBookingQuoteExperimentFollowUpOutcomeContinuity } from "../functions/api/_lib/booking-quote-experiment-follow-up-outcome-continuity.js";

const interpretation={
  build:502,
  authority:"booking_quote_experiment_outcome_interpretation",
  rows:[{
    key:"booking_stage_clarity",
    area:"booking_stage_clarity",
    status:"descriptive_outcome_interpretation_ready",
    measurement_contract:{revision:1,primary_metric:"checkout_completion",duration_days:14},
    execution_context:{authorized_duration_days:7,allocation_arms:["control","treatment"],observed_duration_days:4,duration_within_authorization:true,allocation_coverage_complete:true,weather_ineligible_row_count:2,stop_condition_triggered_count:0},
    interpretation_evidence:{allocation_comparison_complete:true,attributable_metric_row_count:8},
    interpretation:{threshold_evaluation:"owner_review_required",success:null,winner:null}
  }]
};
const followUp={
  follow_up_decision_build:512,
  follow_up_decision_authority:"booking_quote_experiment_follow_up_decision",
  rows:[{
    key:"booking_stage_clarity",
    area:"booking_stage_clarity",
    status:"continued_observation_decision_recorded",
    owner_follow_up:{decision:"continue_observation",decided_by:"owner-review",decided_at:"2026-09-28T14:00:00Z",accepted:true}
  }]
};

const missing=buildBookingQuoteExperimentFollowUpOutcomeContinuity({follow_up_decision:followUp,outcome_interpretation:interpretation,generated_at:"2026-09-29T12:00:00Z"});
assert.equal(missing.follow_up_outcome_build,522);
assert.equal(missing.rows[0].status,"owner_follow_up_outcome_required");
assert.ok(missing.rows[0].retained_follow_up_decision.expected_decision_trace_key);
assert.equal(missing.rows[0].retained_measurement_and_comparison.winner,null);
assert.equal(missing.boundaries.automatic_winner_selection_allowed,false);

const trace=missing.rows[0].retained_follow_up_decision.expected_decision_trace_key;
const noAuth=buildBookingQuoteExperimentFollowUpOutcomeContinuity({
  follow_up_decision:followUp,outcome_interpretation:interpretation,
  follow_up_outcome_records:{records:{booking_stage_clarity:{
    outcome:"continue_observation",reviewed_by:"owner-review",reviewed_at:"2026-09-29T12:10:00Z",outcome_reference:"follow-up-522",decision_trace_key:trace
  }}}
});
assert.equal(noAuth.rows[0].status,"follow_up_activity_authorization_required");

const completeRecord={
  outcome:"continue_observation",reviewed_by:"owner-review",reviewed_at:"2026-09-29T12:10:00Z",outcome_reference:"follow-up-522",decision_trace_key:trace,
  follow_up_authorized_at:"2026-09-28T14:05:00Z",follow_up_observed_at:"2026-09-29T11:30:00Z",
  measurement_lock_revision:1,primary_metric:"checkout_completion",duration_days:7,observed_duration_days:2,
  allocation_arms:["control","treatment"],weather_eligibility_observed:true,weather_ineligible_excluded:true,
  comparable_allocation_observations:true,outcome_observed:true,stop_condition_triggered:false
};
const observed=buildBookingQuoteExperimentFollowUpOutcomeContinuity({
  follow_up_decision:followUp,outcome_interpretation:interpretation,
  follow_up_outcome_records:{records:{booking_stage_clarity:completeRecord}}
});
assert.equal(observed.rows[0].status,"bounded_follow_up_observation_outcome_observed");
assert.equal(observed.rows[0].owner_outcome.follow_up_activity_complete,true);
assert.equal(observed.rows[0].truth_boundary.price_or_discount_changed,false);
assert.equal(observed.rows[0].truth_boundary.booking_rule_changed,false);
assert.equal(observed.rows[0].truth_boundary.availability_rule_changed,false);

const wrongTrace=structuredClone(completeRecord); wrongTrace.decision_trace_key="wrong-trace";
assert.equal(buildBookingQuoteExperimentFollowUpOutcomeContinuity({
  follow_up_decision:followUp,outcome_interpretation:interpretation,
  follow_up_outcome_records:{records:{booking_stage_clarity:wrongTrace}}
}).rows[0].status,"follow_up_outcome_evidence_conflict");

const followUpStopped=structuredClone(completeRecord); followUpStopped.stop_condition_triggered=true;
assert.equal(buildBookingQuoteExperimentFollowUpOutcomeContinuity({
  follow_up_decision:followUp,outcome_interpretation:interpretation,
  follow_up_outcome_records:{records:{booking_stage_clarity:followUpStopped}}
}).rows[0].status,"follow_up_activity_stop_condition_review_required");

const sourceStopped=structuredClone(interpretation);
sourceStopped.rows[0].execution_context.stop_condition_triggered_count=1;
sourceStopped.rows[0].status="stop_condition_review_required";
assert.equal(buildBookingQuoteExperimentFollowUpOutcomeContinuity({follow_up_decision:followUp,outcome_interpretation:sourceStopped}).rows[0].status,"stop_condition_review_required");

const holdDecision=structuredClone(followUp);
holdDecision.rows[0].status="follow_up_hold_recorded";
holdDecision.rows[0].owner_follow_up.decision="hold";
const holdProbe=buildBookingQuoteExperimentFollowUpOutcomeContinuity({follow_up_decision:holdDecision,outcome_interpretation:interpretation});
const held=buildBookingQuoteExperimentFollowUpOutcomeContinuity({
  follow_up_decision:holdDecision,outcome_interpretation:interpretation,
  follow_up_outcome_records:{records:{booking_stage_clarity:{
    outcome:"hold",reviewed_by:"owner-review",reviewed_at:"2026-09-29T12:20:00Z",outcome_reference:"hold-522",decision_trace_key:holdProbe.rows[0].retained_follow_up_decision.expected_decision_trace_key
  }}}
});
assert.equal(held.rows[0].status,"follow_up_hold_outcome_observed");

const unavailable=buildBookingQuoteExperimentFollowUpOutcomeContinuity({});
assert.equal(unavailable.source_recognized,false);
assert.equal(unavailable.boundaries.permanent_polling_allowed,false);

console.log("BUILD 522 BOOKING & QUOTE EXPERIMENT FOLLOW-UP OUTCOME CONTINUITY TEST: PASS");
