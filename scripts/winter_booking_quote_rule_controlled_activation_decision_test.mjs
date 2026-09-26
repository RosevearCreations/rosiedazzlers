#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildWinterBookingQuoteRuleControlledActivationDecision } from "../functions/api/_lib/winter-booking-quote-rule-controlled-activation-decision.js";

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

const economics={
  totals:{booking_count:0,ready_booking_count:0,review_booking_count:0,unavailable_booking_count:0,cogs_variance_booking_count:0},
  rows:[],
  seasonal_operability_evidence:{rows:[
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
      winter_rule_controlled_activation_reference:"owner-review-507-interior"
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
      winter_rule_controlled_activation_reference:"owner-review-507-wash"
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
      winter_rule_customer_transparency_confirmed:false,
      winter_rule_controlled_activation_decision:"approve_controlled_activation",
      winter_rule_controlled_activation_reviewed_at:"2026-09-26T11:40:00-04:00",
      winter_rule_controlled_activation_reference:"owner-review-507-ceramic"
    }
  ]}
};

const report=buildWinterBookingQuoteRuleControlledActivationDecision({economics});
const decision=report.economics.winter_booking_quote_controlled_activation_decision;
assert.equal(report.winter_booking_quote_controlled_activation_build,507);
assert.equal(report.winter_booking_quote_controlled_activation_authority,"winter_booking_quote_rule_controlled_activation_decision");
assert.equal(report.retained_availability_authority,"/api/availability");
assert.equal(decision.row_count,3);
assert.equal(decision.counts.controlled_activation_decision_ready,1);
assert.equal(decision.counts.owner_hold,1);
assert.equal(decision.counts.owner_review_required,1);

const interior=decision.rows.find(row=>row.code==="interior");
assert.equal(interior.controlled_activation_decision_state,"controlled_activation_decision_ready");
assert.equal(interior.controlled_activation_decision_ready,true);
assert.equal(interior.manual_rule_activation_required,true);
assert.equal(interior.automatic_rule_activation_authorized,false);
assert.ok(interior.customer_limitation_text);

const wash=decision.rows.find(row=>row.code==="premium_wash");
assert.equal(wash.controlled_activation_decision_state,"owner_hold");
assert.equal(wash.source_owned_temperature_limit_text,"recorded working limit: minimum 5°C");

const ceramic=decision.rows.find(row=>row.code==="ceramic");
assert.equal(ceramic.controlled_activation_decision_state,"controlled_activation_owner_review_required");
assert.ok(decision.gaps.find(g=>g.code==="ceramic")?.missing.includes("explicit_customer_transparency_confirmation"));

assert.equal(decision.broad_winter_availability_authorized,false);
assert.equal(decision.weather_ineligible_sessions_excluded_from_ordinary_conversion_interpretation,true);
assert.equal(report.truth_boundary.controlled_activation_decision_ready_is_live_activation,false);
assert.equal(report.truth_boundary.weather_ineligible_session_is_conversion_failure,false);
assert.equal(report.boundaries.automatic_booking_availability_change_allowed,false);
assert.equal(report.boundaries.automatic_quote_rule_change_allowed,false);
console.log("BUILD 507 WINTER BOOKING & QUOTE RULE CONTROLLED ACTIVATION DECISION TEST: PASS");
