#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildBookingQuoteExperimentFollowUpDecision } from "../functions/api/_lib/booking-quote-experiment-follow-up-decision.js";

const ready={
  build:502,
  authority:"booking_quote_experiment_outcome_interpretation",
  rows:[{
    key:"booking_stage_clarity",
    area:"booking_stage_clarity",
    status:"descriptive_outcome_interpretation_ready",
    execution_context:{weather_ineligible_row_count:2,stop_condition_triggered_count:0},
    interpretation_evidence:{attributable_metric_row_count:8,allocation_comparison_complete:true},
    interpretation:{threshold_evaluation:"owner_review_required",success:null,winner:null}
  }]
};

const missing=buildBookingQuoteExperimentFollowUpDecision({outcome_interpretation:ready,generated_at:"2026-09-26T23:55:00Z"});
assert.equal(missing.follow_up_decision_build,512);
assert.equal(missing.rows[0].status,"owner_follow_up_decision_required");
assert.equal(missing.rows[0].retained_outcome_interpretation.weather_ineligible_row_count,2);
assert.equal(missing.rows[0].retained_outcome_interpretation.success,null);
assert.equal(missing.rows[0].retained_outcome_interpretation.winner,null);
assert.equal(missing.rows[0].truth_boundary.weather_ineligible_session_is_conversion_failure,false);
assert.equal(missing.boundaries.automatic_winner_selection_allowed,false);

for (const decision of ["hold","continue_observation","close_no_change","separate_change_review"]) {
  const result=buildBookingQuoteExperimentFollowUpDecision({
    outcome_interpretation:ready,
    follow_up_decision_records:{records:{booking_stage_clarity:{
      decision,decided_by:"owner-review",decided_at:"2026-09-26T23:58:00Z",note:"bounded owner follow-up"
    }}}
  });
  assert.equal(result.rows[0].owner_follow_up.accepted,true);
  assert.equal(result.rows[0].owner_follow_up.decision,decision);
  assert.equal(result.rows[0].decision_boundary.business_change_authorized,false);
  assert.equal(result.rows[0].decision_boundary.winner_selection_authorized,false);
  assert.equal(result.rows[0].truth_boundary.price_or_discount_changed,false);
  assert.equal(result.rows[0].truth_boundary.booking_rule_changed,false);
  assert.equal(result.rows[0].truth_boundary.availability_rule_changed,false);
  assert.equal(result.rows[0].truth_boundary.outreach_sent,false);
}

const stopped=structuredClone(ready);
stopped.rows[0].status="stop_condition_review_required";
stopped.rows[0].execution_context.stop_condition_triggered_count=1;
const stoppedResult=buildBookingQuoteExperimentFollowUpDecision({
  outcome_interpretation:stopped,
  follow_up_decision_records:{records:{booking_stage_clarity:{
    decision:"separate_change_review",decided_by:"owner-review",decided_at:"2026-09-26T23:59:00Z"
  }}}
});
assert.equal(stoppedResult.rows[0].status,"stop_condition_review_required");
assert.equal(stoppedResult.rows[0].owner_follow_up.accepted,false);

const incomplete=structuredClone(ready);
incomplete.rows[0].status="allocation_comparison_incomplete";
incomplete.rows[0].interpretation_evidence.allocation_comparison_complete=false;
const incompleteResult=buildBookingQuoteExperimentFollowUpDecision({outcome_interpretation:incomplete});
assert.equal(incompleteResult.rows[0].status,"comparable_outcomes_required");

const unavailable=buildBookingQuoteExperimentFollowUpDecision({outcome_interpretation:{}});
assert.equal(unavailable.source_recognized,false);
assert.equal(unavailable.boundaries.permanent_polling_allowed,false);

console.log("BUILD 512 BOOKING & QUOTE EXPERIMENT FOLLOW-UP DECISION TEST: PASS");
