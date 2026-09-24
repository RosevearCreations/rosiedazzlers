#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildBookingQuoteControlledExperimentExecutionEvidence } from "../functions/api/_lib/booking-quote-controlled-experiment-execution-evidence.js";

const locked={
  definitions:[{
    key:"booking_stage_clarity",
    area:"booking_stage_clarity",
    state:"measurement_locked",
    lock:{measurement_locked:true,locked_at:"2026-09-20T12:00:00Z",revision:1},
    measurement_contract:{
      duration_days:14,
      allocation_rule:"50/50 bounded control vs treatment",
      weather_ineligible_handling:"exclude_from_conversion_denominator",
      stop_conditions:[
        "retained_evidence_unavailable_restricted_or_materially_truncated",
        "minimum_evidence_no_longer_met",
        "like_for_like_window_breaks",
        "price_discount_booking_rule_or_outreach_change_required",
        "owner_withdraws_approval",
        "material_confounder_breaks_comparability"
      ]
    }
  }]
};

const noAuth=buildBookingQuoteControlledExperimentExecutionEvidence({
  measurement_lock:locked,
  execution_authorization:{records:{}},
  execution_evidence:[],
  execution_source_available:false,
  generated_at:"2026-09-24T12:00:00Z"
});
assert.equal(noAuth.build,492);
assert.equal(noAuth.rows[0].status,"execution_authorization_required");
assert.equal(noAuth.rows[0].truth_boundary.measurement_lock_is_execution_authorization,false);
assert.equal(noAuth.boundaries.automatic_winner_selection_allowed,false);

const auth={records:{booking_stage_clarity:{
  authorized:true,
  authorized_at:"2026-09-21T12:00:00Z",
  authorized_by:"owner",
  duration_days:7,
  allocation_arms:["control","treatment"],
  weather_eligibility_required:true,
  outcome_capture_authorized:true,
  stop_conditions_acknowledged:true,
  measurement_lock_revision:1
}}};

const noSource=buildBookingQuoteControlledExperimentExecutionEvidence({
  measurement_lock:locked,execution_authorization:auth,execution_evidence:[],execution_source_available:false
});
assert.equal(noSource.rows[0].status,"execution_source_required");

const rows=[
  {
    evidence_id:"e1",experiment_key:"booking_stage_clarity",assignment_ref:"anon-a",allocation_arm:"control",
    allocated_at:"2026-09-21T13:00:00Z",observed_at:"2026-09-23T13:00:00Z",
    weather:{observed_at:"2026-09-21T12:55:00Z",eligible:true,rule_evidence:"explicit service/site constraints satisfied"},
    stop_condition:{observed_at:"2026-09-23T13:00:00Z",triggered:false,reason:"none"},
    outcome:{observed_at:"2026-09-23T13:00:00Z",metric_key:"checkout_completion",included_in_conversion_denominator:true}
  },
  {
    evidence_id:"e2",experiment_key:"booking_stage_clarity",assignment_ref:"anon-b",allocation_arm:"treatment",
    allocated_at:"2026-09-21T14:00:00Z",observed_at:"2026-09-24T14:00:00Z",
    weather:{observed_at:"2026-09-21T13:55:00Z",eligible:true,rule_evidence:"explicit service/site constraints satisfied"},
    stop_condition:{observed_at:"2026-09-24T14:00:00Z",triggered:false,reason:"none"},
    outcome:{observed_at:"2026-09-24T14:00:00Z",metric_key:"checkout_completion",included_in_conversion_denominator:true}
  },
  {
    evidence_id:"e3",experiment_key:"booking_stage_clarity",assignment_ref:"anon-c",allocation_arm:"control",
    allocated_at:"2026-09-22T13:00:00Z",observed_at:"2026-09-22T14:00:00Z",
    weather:{observed_at:"2026-09-22T12:55:00Z",eligible:false,rule_evidence:"explicit cold-weather/site constraint made service ineligible"},
    stop_condition:{observed_at:"2026-09-22T14:00:00Z",triggered:false,reason:"weather-ineligible exclusion"},
    outcome:{included_in_conversion_denominator:false}
  }
];
const ready=buildBookingQuoteControlledExperimentExecutionEvidence({
  measurement_lock:locked,execution_authorization:auth,execution_evidence:rows,execution_source_available:true
});
const review=ready.rows[0];
assert.equal(review.status,"bounded_execution_evidence_review_ready");
assert.equal(review.execution_evidence.weather_eligible_row_count,2);
assert.equal(review.execution_evidence.weather_ineligible_row_count,1);
assert.equal(review.execution_evidence.weather_ineligible_excluded_from_conversion_denominator_count,1);
assert.equal(review.execution_evidence.allocation_coverage_complete,true);
assert.equal(review.execution_evidence.duration_within_authorization,true);
assert.equal(review.truth_boundary.winner_selected,false);
assert.equal(review.truth_boundary.experiment_success_claimed,false);
assert.equal(review.truth_boundary.price_or_discount_changed,false);

const stopRows=structuredClone(rows);
stopRows[1].stop_condition.triggered=true;
stopRows[1].stop_condition.reason="owner stop condition";
const stopped=buildBookingQuoteControlledExperimentExecutionEvidence({
  measurement_lock:locked,execution_authorization:auth,execution_evidence:stopRows,execution_source_available:true
});
assert.equal(stopped.rows[0].status,"stop_condition_triggered_review_required");
assert.equal(stopped.rows[0].truth_boundary.booking_rule_changed,false);

const badWeather=structuredClone(rows);
badWeather[2].outcome.included_in_conversion_denominator=true;
const incomplete=buildBookingQuoteControlledExperimentExecutionEvidence({
  measurement_lock:locked,execution_authorization:auth,execution_evidence:badWeather,execution_source_available:true
});
assert.equal(incomplete.rows[0].status,"execution_evidence_incomplete");
assert.equal(incomplete.rows[0].truth_boundary.weather_ineligible_session_is_conversion_failure,false);

console.log("BUILD 492 BOOKING & QUOTE CONTROLLED EXPERIMENT EXECUTION EVIDENCE TEST: PASS");
