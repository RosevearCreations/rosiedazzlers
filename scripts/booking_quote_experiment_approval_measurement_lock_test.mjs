import assert from "node:assert/strict";
import {
  buildBookingFunnelQuotePricingLearning,
  buildBookingQuoteExperimentApprovalMeasurementLock
} from "../functions/api/_lib/booking-funnel-quote-pricing-learning.js";

const evidence=buildBookingFunnelQuotePricingLearning({
  source_status:{booking_rebooking_funnel:{available:true},quote_pipeline_list:{available:true}},
  funnel:{window:{days:90},booking_funnel:{
    funnel_start_sessions:100,checkout_started_sessions:40,checkout_completed_sessions:34,
    stages:[
      {key:"step_1",label:"Date + vehicle",drop_from_previous:null},
      {key:"step_2",label:"Package",drop_from_previous:28,drop_from_previous_pct:28},
      {key:"step_3",label:"Add-ons",drop_from_previous:10,drop_from_previous_pct:13.9}
    ]
  },coverage:{analytics_possibly_truncated:false}},
  quote_rows:[
    {status:"accepted",quoted_amount_cents:26900,accepted_amount_cents:26900,sent_at:"x",accepted_at:"x"},
    {status:"declined",quoted_amount_cents:29900,sent_at:"x",declined_at:"x"},
    {status:"accepted",quoted_amount_cents:31900,accepted_amount_cents:31900,sent_at:"x",accepted_at:"x"},
    {status:"declined",quoted_amount_cents:34900,sent_at:"x",declined_at:"x"},
    {status:"accepted",quoted_amount_cents:36900,accepted_amount_cents:36900,sent_at:"x",accepted_at:"x"}
  ]
});

assert.equal(evidence.experiment_approval_measurement_lock_build,481);
assert.equal(evidence.experiment_approval_measurement_lock_authority,"booking_quote_experiment_approval_measurement_lock");
assert.equal(evidence.experiment_approval_measurement_lock.measurement_locked_count,0);
assert.equal(evidence.experiment_approval_measurement_lock.boundaries.experiment_execution_authorized,false);

const framework=evidence.controlled_experiment_framework;
const stopConditions=[
  "retained_evidence_unavailable_restricted_or_materially_truncated",
  "minimum_evidence_no_longer_met",
  "like_for_like_window_breaks",
  "price_discount_booking_rule_or_outreach_change_required",
  "owner_withdraws_approval",
  "material_confounder_breaks_comparability"
];
const approved={
  records:{
    booking_stage_clarity:{
      approval_status:"approved",approved:true,approved_by:"owner@example.invalid",approved_at:"2026-09-22T22:00:00-04:00",
      success_threshold:"At least 5 percentage-point improvement",target_direction:"increase",
      winner_rule:"Declared variant must meet the threshold without a stop condition.",
      duration_days:21,allocation_rule:"Compare two like-for-like bounded 21-day windows.",
      stop_conditions:stopConditions,
      seasonal_eligibility_rule:"Exclude sessions where the selected service is weather-ineligible under explicit service/product/equipment/site constraints.",
      weather_ineligible_handling:"exclude_from_conversion_denominator",
      measurement_locked:true,locked_at:"2026-09-22T22:01:00-04:00",locked_by:"owner@example.invalid",revision:1
    }
  }
};
const locked=buildBookingQuoteExperimentApprovalMeasurementLock(framework,approved);
const row=locked.definitions.find(r=>r.key==="booking_stage_clarity");
assert.equal(row.state,"measurement_locked");
assert.equal(row.owner_approval.approved,true);
assert.equal(row.lock.measurement_locked,true);
assert.equal(row.lock.immutable_after_lock,true);
assert.equal(row.measurement_contract.duration_days,21);
assert.equal(row.measurement_contract.weather_ineligible_handling,"exclude_from_conversion_denominator");
assert.equal(row.seasonal_truth_boundary.region,"Southern Ontario, Canada");
assert.equal(row.seasonal_truth_boundary.weather_ineligible_sessions_excluded_from_conversion_denominator,true);
assert.equal(row.seasonal_truth_boundary.cold_weather_restriction_counts_as_conversion_failure,false);
assert.equal(row.seasonal_truth_boundary.service_temperature_limit_inferred,false);
assert.equal(row.execution.execution_authorized,false);
assert.equal(row.execution.experiment_started,false);
assert.equal(row.execution.pricing_mutation_allowed,false);
assert.equal(row.execution.discount_mutation_allowed,false);
assert.equal(row.execution.booking_rule_mutation_allowed,false);
assert.equal(row.execution.availability_mutation_allowed,false);
assert.equal(row.execution.outreach_allowed,false);

const noSeasonal=JSON.parse(JSON.stringify(approved));
noSeasonal.records.booking_stage_clarity.seasonal_eligibility_rule="";
const blocked=buildBookingQuoteExperimentApprovalMeasurementLock(framework,noSeasonal);
assert.equal(blocked.definitions.find(r=>r.key==="booking_stage_clarity").state,"owner_approval_required");
assert.equal(blocked.definitions.find(r=>r.key==="booking_stage_clarity").lock.measurement_locked,false);

const noApproval=JSON.parse(JSON.stringify(approved));
noApproval.records.booking_stage_clarity.approved=false;
noApproval.records.booking_stage_clarity.approval_status="not_recorded";
const unapproved=buildBookingQuoteExperimentApprovalMeasurementLock(framework,noApproval);
assert.equal(unapproved.definitions.find(r=>r.key==="booking_stage_clarity").state,"owner_approval_required");

const withRecord=buildBookingFunnelQuotePricingLearning({
  source_status:{booking_rebooking_funnel:{available:true},quote_pipeline_list:{available:true}},
  funnel:{window:{days:90},booking_funnel:{
    funnel_start_sessions:100,
    stages:[{key:"step_2",label:"Package",drop_from_previous:20,drop_from_previous_pct:20}]
  },coverage:{analytics_possibly_truncated:false}},
  quote_rows:[],
  approval_records:approved
});
assert.equal(withRecord.truth_boundary.measurement_lock_inferred,false);
assert.equal(withRecord.truth_boundary.weather_ineligible_session_is_conversion_failure,false);
assert.equal(withRecord.truth_boundary.service_temperature_limit_inferred,false);

console.log("BUILD 481 BOOKING & QUOTE EXPERIMENT APPROVAL & MEASUREMENT LOCK TEST: PASS");
