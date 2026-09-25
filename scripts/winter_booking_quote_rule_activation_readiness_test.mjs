#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildWinterBookingQuoteRuleActivationReadiness } from "../functions/api/_lib/winter-booking-quote-rule-activation-readiness.js";

const economics={totals:{booking_count:0,ready_booking_count:0,review_booking_count:0,unavailable_booking_count:0,cogs_variance_booking_count:0},rows:[],seasonal_operability_evidence:{rows:[
  {package_code:"interior",classification:"cold_snap_capable",evidence_source_type:"process",evidence_source:"interior-process-record",capability_evidence_current:true,owner_review_decision:"approve_public_claim_review",owner_reviewed_at:"2026-09-24T18:00:00-04:00",owner_review_reference:"owner-review-496-interior",activation_readiness_owner_decision:"approve_activation_readiness_review",activation_reviewed_at:"2026-09-24T20:00:00-04:00",activation_review_reference:"owner-review-497-interior",booking_rule_candidate:"allow_with_current_conditions_check",quote_rule_candidate:"quote_with_current_conditions_disclosure"},
  {package_code:"premium_wash",classification:"temperature_limited_outdoor",evidence_source_type:"product",evidence_source:"wash-chemical-tds",minimum_working_temperature_c:5,exact_temperature_claim_supported:true,capability_evidence_current:true,owner_review_decision:"approve_public_claim_review",owner_reviewed_at:"2026-09-24T18:05:00-04:00",owner_review_reference:"owner-review-496-premium",activation_readiness_owner_decision:"hold_activation",activation_reviewed_at:"2026-09-24T20:05:00-04:00",activation_review_reference:"owner-review-497-premium",booking_rule_candidate:"hold_winter_booking",quote_rule_candidate:"hold_winter_quote"},
  {add_on_code:"ceramic",classification:"controlled_environment_required",evidence_source_type:"site",evidence_source:"controlled-bay-requirement",capability_evidence_current:true,indoor_capable_workflow_supported:true,indoor_workflow_source_type:"process",indoor_workflow_reference:"ceramic-indoor-process",owner_review_decision:"approve_public_claim_review",owner_reviewed_at:"2026-09-24T18:10:00-04:00",owner_review_reference:"owner-review-496-ceramic",activation_readiness_owner_decision:"approve_activation_readiness_review",activation_reviewed_at:"2026-09-24T20:10:00-04:00",activation_review_reference:"owner-review-497-ceramic",booking_rule_candidate:"allow_with_current_conditions_check",quote_rule_candidate:"quote_with_current_conditions_disclosure"}
]}};

const report=buildWinterBookingQuoteRuleActivationReadiness({economics});
const readiness=report.economics.winter_booking_quote_activation_readiness;
assert.equal(report.winter_booking_quote_activation_readiness_build,497);
assert.equal(report.winter_booking_quote_activation_readiness_authority,"winter_booking_quote_rule_activation_readiness");
assert.equal(report.retained_availability_authority,"/api/availability");
assert.equal(readiness.status,"review");
assert.equal(readiness.row_count,3);
assert.equal(readiness.counts.activation_readiness_review_ready,1);
assert.equal(readiness.counts.owner_hold,1);
assert.equal(readiness.counts.owner_review_required,1);
assert.equal(readiness.rows[0].activation_state,"activation_readiness_review_ready");
assert.equal(readiness.rows[0].automatic_activation_authorized,false);
assert.equal(readiness.rows[1].activation_state,"owner_hold");
assert.equal(readiness.rows[1].source_owned_temperature_limit_text,"recorded working limit: minimum 5°C");
assert.equal(readiness.rows[2].activation_state,"owner_review_required");
assert.ok(readiness.gaps.find(g=>g.code==="ceramic")?.missing.includes("classification_compatible_rule_pair"));
assert.equal(readiness.broad_winter_availability_authorized,false);
assert.equal(readiness.weather_ineligible_sessions_excluded_from_ordinary_conversion_interpretation,true);
assert.equal(report.truth_boundary.activation_readiness_review_ready_is_live_activation,false);
assert.equal(report.boundaries.automatic_availability_mutation_allowed,false);
console.log("BUILD 497 WINTER BOOKING & QUOTE RULE ACTIVATION READINESS TEST: PASS");
