#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildBookingQuoteFollowUpEvidenceIntegrityReview as integrity } from "../functions/api/_lib/booking-quote-follow-up-evidence-integrity-review.js";
import { buildBookingQuoteFollowUpEvidenceFreshnessReview as freshnessReview } from "../functions/api/_lib/booking-quote-follow-up-evidence-freshness-review.js";

const now="2026-10-08T12:00:00Z";
function fixture(outcome="continue_observation") {
  const arms=["control","treatment"];
  const trace="decision-trace-512";
  const reviewed="2026-10-07T12:00:00Z";
  const retained={
    follow_up_outcome_build:522,follow_up_outcome_authority:"booking_quote_experiment_follow_up_outcome_continuity",
    source_recognized:true,rows:[{
      key:"booking_stage_clarity",area:"booking_stage_clarity",
      status:({continue_observation:"bounded_follow_up_observation_outcome_observed",hold:"follow_up_hold_outcome_observed",close_no_change:"no_change_closure_outcome_observed",separate_change_review:"separate_change_review_outcome_observed"})[outcome],
      retained_follow_up_decision:{build:512,status:"recorded",decision:outcome,accepted:true,expected_decision_trace_key:trace},
      retained_measurement_and_comparison:{build:502,source_recognized:true,measurement_lock_revision:1,primary_metric:"checkout_completion",authorized_duration_days:7,allocation_arms:arms,duration_within_authorization:true,allocation_coverage_complete:true,allocation_comparison_complete:true,weather_ineligible_row_count:2,stop_condition_triggered_count:0,current_comparable:true},
      owner_outcome:{outcome,reviewed_by:"owner",reviewed_at:reviewed,outcome_reference:"owner-522",decision_trace_key:trace,attributable:true,trace_matches:true,outcome_matches_source_decision:true,measurement_lock_revision:1,primary_metric:"checkout_completion",allocation_arms:arms,allocation_matches_retained:true,follow_up_authorized_at:"2026-10-06T14:00:00Z",follow_up_observed_at:"2026-10-07T11:00:00Z",authorization_follows_decision:true,observation_follows_authorization:true,duration_within_retained_authorization:true,observed_duration_within_follow_up:true,weather_eligibility_observed:true,weather_ineligible_excluded:true,comparable_allocation_observations:true,outcome_observed:true,follow_up_activity_complete:true,stop_condition_triggered:false},
      outcome_boundary:{triggered_stop_condition_requires_review:false}
    }]
  };
  const freshness=freshnessReview({follow_up_outcome_continuity:retained,generated_at:now});
  return {retained,freshness};
}
let {retained,freshness}=fixture();
const result=integrity({follow_up_freshness:freshness,follow_up_outcome_continuity:retained,generated_at:now});
assert.equal(result.booking_quote_follow_up_integrity_build,542);
assert.equal(result.status,"booking_quote_follow_up_integrity_current");
assert.equal(result.rows[0].measurement_allocation_duration_identity.exact,true);
assert.equal(result.rows[0].owner_follow_up_identity.decision_trace_matches,true);
assert.equal(result.truth_boundary.price_or_discount_changed,false);
assert.equal(result.truth_boundary.booking_created_or_changed,false);
assert.equal(result.truth_boundary.canonical_hold_mutated,false);
for(const outcome of ["hold","close_no_change","separate_change_review"]) {
  const item=fixture(outcome);
  assert.equal(integrity({follow_up_freshness:item.freshness,follow_up_outcome_continuity:item.retained,generated_at:now}).status,"booking_quote_follow_up_integrity_current",outcome);
}
function check(mutator, expected) {
  const item=structuredClone(fixture());mutator(item);
  assert.equal(integrity({follow_up_freshness:item.freshness,follow_up_outcome_continuity:item.retained,generated_at:now}).status,expected);
}
check(x=>{x.freshness.rows[0].retained_measurement.primary_metric="different";},"measurement_allocation_duration_identity_review_required");
check(x=>{x.retained.rows[0].retained_measurement_and_comparison.allocation_arms=["control","changed"]; },"measurement_allocation_duration_identity_review_required");
check(x=>{x.retained.rows[0].owner_outcome.decision_trace_key="different";},"owner_follow_up_identity_review_required");
check(x=>{x.retained.rows[0].owner_outcome.outcome_reference="different";},"owner_follow_up_identity_review_required");
check(x=>{x.retained.rows[0].owner_outcome.follow_up_observed_at="2026-10-07T10:00:00Z";},"follow_up_authorization_observation_identity_review_required");
check(x=>{x.retained.rows[0].owner_outcome.follow_up_observed_at="2026-10-09T12:00:00Z";},"follow_up_authorization_observation_identity_review_required");
check(x=>{x.freshness.rows[0].owner_outcome_freshness.weather_ineligible_excluded=false;},"weather_or_stop_condition_review_required");
check(x=>{x.retained.rows[0].owner_outcome.stop_condition_triggered=true;},"weather_or_stop_condition_review_required");
check(x=>{x.freshness.rows[0].freshness_state="owner_outcome_freshness_review_required";},"retained_freshness_review_required");
check(x=>{x.freshness.rows[0].key="different";},"follow_up_row_set_identity_review_required");
check(x=>{x.freshness.generated_at="2026-10-01T12:00:00Z";},"retained_freshness_review_required");
const empty=integrity({});
assert.equal(empty.status,"follow_up_integrity_source_unavailable");
console.log("BUILD 542 BOOKING & QUOTE FOLLOW-UP EVIDENCE INTEGRITY REVIEW TEST: PASS");
