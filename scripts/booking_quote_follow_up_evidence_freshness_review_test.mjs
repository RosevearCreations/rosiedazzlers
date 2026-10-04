#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildBookingQuoteExperimentFollowUpOutcomeContinuity } from "../functions/api/_lib/booking-quote-experiment-follow-up-outcome-continuity.js";
import { buildBookingQuoteFollowUpEvidenceFreshnessReview } from "../functions/api/_lib/booking-quote-follow-up-evidence-freshness-review.js";

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
const decision={
  follow_up_decision_build:512,
  follow_up_decision_authority:"booking_quote_experiment_follow_up_decision",
  rows:[{
    key:"booking_stage_clarity",
    area:"booking_stage_clarity",
    status:"continued_observation_decision_recorded",
    owner_follow_up:{decision:"continue_observation",decided_by:"owner-review",decided_at:"2026-09-28T14:00:00Z",accepted:true}
  }]
};

const probe=buildBookingQuoteExperimentFollowUpOutcomeContinuity({follow_up_decision:decision,outcome_interpretation:interpretation});
const trace=probe.rows[0].retained_follow_up_decision.expected_decision_trace_key;
const record={
  outcome:"continue_observation",
  reviewed_by:"owner-review",
  reviewed_at:"2026-10-01T12:10:00Z",
  outcome_reference:"follow-up-532",
  decision_trace_key:trace,
  follow_up_authorized_at:"2026-09-28T14:05:00Z",
  follow_up_observed_at:"2026-10-01T11:30:00Z",
  measurement_lock_revision:1,
  primary_metric:"checkout_completion",
  duration_days:7,
  observed_duration_days:3,
  allocation_arms:["control","treatment"],
  weather_eligibility_observed:true,
  weather_ineligible_excluded:true,
  comparable_allocation_observations:true,
  outcome_observed:true,
  stop_condition_triggered:false
};
const continuity=buildBookingQuoteExperimentFollowUpOutcomeContinuity({
  follow_up_decision:decision,
  outcome_interpretation:interpretation,
  follow_up_outcome_records:{records:{booking_stage_clarity:record}},
  generated_at:"2026-10-02T12:00:00Z"
});
const current=buildBookingQuoteFollowUpEvidenceFreshnessReview({
  follow_up_outcome_continuity:continuity,
  generated_at:"2026-10-03T12:00:00Z",
  freshness_window_days:30
});
assert.equal(current.booking_quote_follow_up_freshness_build,532);
assert.equal(current.rows[0].freshness_state,"bounded_follow_up_observation_outcome_current");
assert.equal(current.rows[0].owner_outcome_freshness.measurement_matches_retained,true);
assert.equal(current.rows[0].owner_outcome_freshness.allocation_matches_retained,true);
assert.equal(current.rows[0].outcome_boundary.winner_selected,false);
assert.equal(current.truth_boundary.booking_rule_changed,false);

const stale=structuredClone(continuity);
stale.rows[0].owner_outcome.follow_up_observed_at="2026-07-01T11:30:00Z";
assert.equal(buildBookingQuoteFollowUpEvidenceFreshnessReview({
  follow_up_outcome_continuity:stale,
  generated_at:"2026-10-03T12:00:00Z"
}).rows[0].freshness_state,"follow_up_observation_freshness_review_required");

const staleReview=structuredClone(continuity);
staleReview.rows[0].owner_outcome.reviewed_at="2026-07-01T12:10:00Z";
assert.equal(buildBookingQuoteFollowUpEvidenceFreshnessReview({
  follow_up_outcome_continuity:staleReview,
  generated_at:"2026-10-03T12:00:00Z"
}).rows[0].freshness_state,"owner_outcome_freshness_review_required");

const drift=structuredClone(continuity);
drift.rows[0].owner_outcome.measurement_lock_revision=2;
drift.rows[0].owner_outcome.follow_up_activity_complete=false;
assert.equal(buildBookingQuoteFollowUpEvidenceFreshnessReview({
  follow_up_outcome_continuity:drift,
  generated_at:"2026-10-03T12:00:00Z"
}).rows[0].freshness_state,"follow_up_evidence_freshness_review_required");

const stopped=structuredClone(continuity);
stopped.rows[0].owner_outcome.stop_condition_triggered=true;
stopped.rows[0].outcome_boundary.triggered_stop_condition_requires_review=true;
assert.equal(buildBookingQuoteFollowUpEvidenceFreshnessReview({
  follow_up_outcome_continuity:stopped,
  generated_at:"2026-10-03T12:00:00Z"
}).rows[0].freshness_state,"follow_up_stop_condition_review_required");

const unavailable=buildBookingQuoteFollowUpEvidenceFreshnessReview({});
assert.equal(unavailable.source_recognized,false);
assert.equal(unavailable.truth_boundary.canonical_hold_mutated,false);

console.log("BUILD 532 BOOKING & QUOTE FOLLOW-UP EVIDENCE FRESHNESS REVIEW TEST: PASS");
