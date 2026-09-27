#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildWinterBookingQuoteRuleControlledActivationDecision } from "../functions/api/_lib/winter-booking-quote-rule-controlled-activation-decision.js";
import { buildWinterBookingQuoteRuleControlledActivationOutcomeContinuity } from "../functions/api/_lib/winter-booking-quote-rule-controlled-activation-outcome-continuity.js";

const common={
  capability_evidence_current:true,
  owner_review_decision:"approve_public_claim_review",
  owner_reviewed_at:"2026-09-26T11:00:00-04:00",
  owner_review_reference:"owner-review-496",
  activation_readiness_owner_decision:"approve_activation_readiness_review",
  activation_reviewed_at:"2026-09-26T11:10:00-04:00",
  activation_review_reference:"owner-review-497",
  public_claim_activation_decision:"approve_public_claim_activation",
  public_claim_activation_reviewed_at:"2026-09-26T11:20:00-04:00",
  public_claim_activation_reference:"owner-review-506",
  public_claim_activation_wording_confirmed:true
};

const rows=[
  {
    ...common,
    package_code:"interior",
    classification:"cold_snap_capable",
    evidence_source_type:"process",
    evidence_source:"interior-process-record",
    booking_rule_candidate:"allow_with_current_conditions_check",
    quote_rule_candidate:"quote_with_current_conditions_disclosure",
    winter_rule_customer_transparency_confirmed:true,
    winter_rule_controlled_activation_decision:"approve_controlled_activation",
    winter_rule_controlled_activation_reviewed_at:"2026-09-26T11:30:00-04:00",
    winter_rule_controlled_activation_reference:"owner-review-507-interior",
    winter_rule_controlled_activation_outcome:"activated",
    winter_rule_controlled_activation_outcome_observed_at:"2026-09-27T09:00:00-04:00",
    winter_rule_controlled_activation_outcome_reference:"manual-rule-change-517-interior",
    winter_rule_applied_booking_rule:"allow_with_current_conditions_check",
    winter_rule_applied_quote_rule:"quote_with_current_conditions_disclosure",
    winter_rule_availability_revalidated:true,
    winter_rule_checkout_collision_revalidated:true,
    winter_rule_runtime_revalidated_at:"2026-09-27T09:05:00-04:00",
    winter_rule_runtime_revalidation_reference:"runtime-proof-517-interior"
  },
  {
    ...common,
    package_code:"premium_wash",
    classification:"temperature_limited_outdoor",
    evidence_source_type:"product",
    evidence_source:"wash-product-tds",
    minimum_working_temperature_c:5,
    exact_temperature_claim_supported:true,
    booking_rule_candidate:"temperature_limited_current_conditions_check",
    quote_rule_candidate:"quote_with_source_owned_temperature_limit",
    winter_rule_customer_transparency_confirmed:true,
    winter_rule_controlled_activation_decision:"hold_controlled_activation",
    winter_rule_controlled_activation_reviewed_at:"2026-09-26T11:35:00-04:00",
    winter_rule_controlled_activation_reference:"owner-review-507-wash",
    winter_rule_controlled_activation_outcome:"retain_hold",
    winter_rule_controlled_activation_outcome_observed_at:"2026-09-27T09:10:00-04:00",
    winter_rule_controlled_activation_outcome_reference:"manual-hold-517-wash",
    winter_rule_availability_revalidated:true,
    winter_rule_checkout_collision_revalidated:true,
    winter_rule_runtime_revalidated_at:"2026-09-27T09:15:00-04:00",
    winter_rule_runtime_revalidation_reference:"runtime-proof-517-wash"
  },
  {
    ...common,
    add_on_code:"ceramic",
    classification:"controlled_environment_required",
    evidence_source_type:"site",
    evidence_source:"controlled-bay-requirement",
    indoor_capable_workflow_supported:true,
    indoor_workflow_source_type:"process",
    indoor_workflow_reference:"ceramic-indoor-process",
    controlled_environment_site_supported:true,
    controlled_environment_site_reference:"qualified-indoor-bay",
    booking_rule_candidate:"controlled_environment_only",
    quote_rule_candidate:"quote_for_controlled_environment_only",
    winter_rule_customer_transparency_confirmed:true,
    winter_rule_controlled_activation_decision:"approve_controlled_activation",
    winter_rule_controlled_activation_reviewed_at:"2026-09-26T11:40:00-04:00",
    winter_rule_controlled_activation_reference:"owner-review-507-ceramic",
    winter_rule_controlled_activation_outcome:"activated",
    winter_rule_controlled_activation_outcome_observed_at:"2026-09-27T09:20:00-04:00",
    winter_rule_controlled_activation_outcome_reference:"manual-rule-change-517-ceramic",
    winter_rule_applied_booking_rule:"controlled_environment_only",
    winter_rule_applied_quote_rule:"quote_for_controlled_environment_only",
    winter_rule_availability_revalidated:true,
    winter_rule_checkout_collision_revalidated:false,
    winter_rule_runtime_revalidated_at:"2026-09-27T09:25:00-04:00",
    winter_rule_runtime_revalidation_reference:"runtime-proof-517-ceramic"
  }
];

const economics={
  totals:{booking_count:0,ready_booking_count:0,review_booking_count:0,unavailable_booking_count:0,cogs_variance_booking_count:0},
  rows:[],
  seasonal_operability_evidence:{rows}
};

const pre=buildWinterBookingQuoteRuleControlledActivationDecision({economics});
for(const source of rows){
  const code=source.package_code||source.add_on_code||source.service_code;
  const retained=pre.economics.winter_booking_quote_controlled_activation_decision.rows.find(row=>row.code===code);
  source.winter_rule_outcome_customer_transparency_wording=retained?.customer_limitation_text||"";
}

const report=buildWinterBookingQuoteRuleControlledActivationOutcomeContinuity({economics});
const continuity=report.economics.winter_booking_quote_controlled_activation_outcome_continuity;
assert.equal(report.winter_booking_quote_controlled_activation_outcome_build,517);
assert.equal(report.winter_booking_quote_controlled_activation_outcome_authority,"winter_booking_quote_rule_controlled_activation_outcome_continuity");
assert.equal(report.retained_availability_authority,"/api/availability");
assert.equal(continuity.row_count,3);
assert.equal(continuity.counts.controlled_activation_observed,1);
assert.equal(continuity.counts.retain_hold_observed,1);
assert.equal(continuity.counts.activation_evidence_conflict,1);

const interior=continuity.rows.find(row=>row.code==="interior");
assert.equal(interior.outcome_state,"controlled_activation_observed");
assert.equal(interior.controlled_activation_observed,true);
assert.equal(interior.current_service_classification_matches_build507,true);
assert.equal(interior.customer_transparency_wording_matches_build507,true);
assert.equal(interior.applied_booking_rule_matches_build507,true);
assert.equal(interior.applied_quote_rule_matches_build507,true);
assert.equal(interior.availability_revalidated,true);
assert.equal(interior.checkout_collision_revalidated,true);

const wash=continuity.rows.find(row=>row.code==="premium_wash");
assert.equal(wash.outcome_state,"retain_hold_observed");
assert.equal(wash.retain_hold_observed,true);
assert.equal(wash.source_owned_temperature_limit_text,"recorded working limit: minimum 5°C");

const ceramic=continuity.rows.find(row=>row.code==="ceramic");
assert.equal(ceramic.outcome_state,"controlled_activation_evidence_conflict");
assert.ok(continuity.gaps.find(g=>g.code==="ceramic")?.missing.includes("checkout_collision_revalidated"));

assert.equal(continuity.broad_winter_availability_authorized,false);
assert.equal(continuity.automatic_rule_activation_authorized,false);
assert.equal(report.truth_boundary.controlled_activation_decision_ready_is_live_activation,false);
assert.equal(report.truth_boundary.weather_ineligible_session_is_conversion_failure,false);
assert.equal(report.boundaries.automatic_booking_availability_change_allowed,false);
assert.equal(report.boundaries.automatic_quote_rule_change_allowed,false);
console.log("BUILD 517 WINTER BOOKING & QUOTE RULE CONTROLLED-ACTIVATION OUTCOME CONTINUITY TEST: PASS");
