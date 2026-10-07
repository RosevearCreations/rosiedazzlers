#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildWinterBookingQuoteRuleControlledActivationDecision } from "../functions/api/_lib/winter-booking-quote-rule-controlled-activation-decision.js";
import { buildWinterBookingQuoteRuleEvidenceIntegrityReview } from "../functions/api/_lib/winter-booking-quote-rule-evidence-integrity-review.js";

const common={capability_evidence_current:true,owner_review_decision:"approve_public_claim_review",owner_reviewed_at:"2026-09-26T11:00:00-04:00",owner_review_reference:"owner-review-496",activation_readiness_owner_decision:"approve_activation_readiness_review",activation_reviewed_at:"2026-09-26T11:10:00-04:00",activation_review_reference:"owner-review-497",public_claim_activation_decision:"approve_public_claim_activation",public_claim_activation_reviewed_at:"2026-09-26T11:20:00-04:00",public_claim_activation_reference:"owner-review-506",public_claim_activation_wording_confirmed:true};
const rows=[
{...common,package_code:"interior",classification:"cold_snap_capable",evidence_source_type:"process",evidence_source:"interior-process",booking_rule_candidate:"allow_with_current_conditions_check",quote_rule_candidate:"quote_with_current_conditions_disclosure",winter_rule_customer_transparency_confirmed:true,winter_rule_controlled_activation_decision:"approve_controlled_activation",winter_rule_controlled_activation_reviewed_at:"2026-09-26T11:30:00-04:00",winter_rule_controlled_activation_reference:"owner-507-interior",winter_rule_controlled_activation_outcome:"activated",winter_rule_controlled_activation_outcome_observed_at:"2026-10-02T09:00:00-04:00",winter_rule_controlled_activation_outcome_reference:"outcome-517-interior",winter_rule_applied_booking_rule:"allow_with_current_conditions_check",winter_rule_applied_quote_rule:"quote_with_current_conditions_disclosure",winter_rule_availability_revalidated:true,winter_rule_checkout_collision_revalidated:true,winter_rule_runtime_revalidated_at:"2026-10-03T09:00:00-04:00",winter_rule_runtime_revalidation_reference:"runtime-517-interior"},
{...common,package_code:"premium_wash",classification:"temperature_limited_outdoor",evidence_source_type:"product",evidence_source:"wash-tds",minimum_working_temperature_c:5,exact_temperature_claim_supported:true,booking_rule_candidate:"temperature_limited_current_conditions_check",quote_rule_candidate:"quote_with_source_owned_temperature_limit",winter_rule_customer_transparency_confirmed:true,winter_rule_controlled_activation_decision:"hold_controlled_activation",winter_rule_controlled_activation_reviewed_at:"2026-09-26T11:35:00-04:00",winter_rule_controlled_activation_reference:"owner-507-wash",winter_rule_controlled_activation_outcome:"retain_hold",winter_rule_controlled_activation_outcome_observed_at:"2026-10-02T09:10:00-04:00",winter_rule_controlled_activation_outcome_reference:"hold-517-wash",winter_rule_availability_revalidated:true,winter_rule_checkout_collision_revalidated:true,winter_rule_runtime_revalidated_at:"2026-10-03T09:10:00-04:00",winter_rule_runtime_revalidation_reference:"runtime-517-wash"},
{...common,add_on_code:"ceramic",classification:"controlled_environment_required",evidence_source_type:"site",evidence_source:"ceramic-site",indoor_capable_workflow_supported:true,indoor_workflow_source_type:"process",indoor_workflow_reference:"ceramic-indoor",controlled_environment_site_supported:true,controlled_environment_site_reference:"qualified-bay",booking_rule_candidate:"controlled_environment_only",quote_rule_candidate:"quote_for_controlled_environment_only",winter_rule_customer_transparency_confirmed:true,winter_rule_controlled_activation_decision:"approve_controlled_activation",winter_rule_controlled_activation_reviewed_at:"2026-09-26T11:40:00-04:00",winter_rule_controlled_activation_reference:"owner-507-ceramic",winter_rule_controlled_activation_outcome:"activated",winter_rule_controlled_activation_outcome_observed_at:"2026-10-02T09:20:00-04:00",winter_rule_controlled_activation_outcome_reference:"outcome-517-ceramic",winter_rule_applied_booking_rule:"controlled_environment_only",winter_rule_applied_quote_rule:"quote_for_controlled_environment_only",winter_rule_availability_revalidated:true,winter_rule_checkout_collision_revalidated:true,winter_rule_runtime_revalidated_at:"2026-10-03T09:20:00-04:00",winter_rule_runtime_revalidation_reference:"runtime-517-ceramic"},
{...common,add_on_code:"wax",classification:"temperature_limited_outdoor",evidence_source_type:"product",evidence_source:"wax-tds",minimum_working_temperature_c:5,exact_temperature_claim_supported:true,booking_rule_candidate:"temperature_limited_current_conditions_check",quote_rule_candidate:"quote_with_source_owned_temperature_limit",winter_rule_customer_transparency_confirmed:true,winter_rule_controlled_activation_decision:"approve_controlled_activation",winter_rule_controlled_activation_reviewed_at:"2026-09-26T11:45:00-04:00",winter_rule_controlled_activation_reference:"owner-507-wax",winter_rule_controlled_activation_outcome:"activated",winter_rule_controlled_activation_outcome_observed_at:"2026-10-02T09:30:00-04:00",winter_rule_controlled_activation_outcome_reference:"outcome-517-wax",winter_rule_applied_booking_rule:"temperature_limited_current_conditions_check",winter_rule_applied_quote_rule:"quote_with_source_owned_temperature_limit",winter_rule_availability_revalidated:true,winter_rule_checkout_collision_revalidated:true,winter_rule_runtime_revalidated_at:"2026-10-03T09:30:00-04:00",winter_rule_runtime_revalidation_reference:"runtime-517-wax"},
{...common,add_on_code:"polish",classification:"controlled_environment_required",evidence_source_type:"site",evidence_source:"polish-site",indoor_capable_workflow_supported:true,indoor_workflow_source_type:"process",indoor_workflow_reference:"polish-indoor",controlled_environment_site_supported:true,controlled_environment_site_reference:"qualified-bay",booking_rule_candidate:"controlled_environment_only",quote_rule_candidate:"quote_for_controlled_environment_only",winter_rule_customer_transparency_confirmed:true,winter_rule_controlled_activation_decision:"approve_controlled_activation",winter_rule_controlled_activation_reviewed_at:"2026-09-26T11:50:00-04:00",winter_rule_controlled_activation_reference:"owner-507-polish",winter_rule_controlled_activation_outcome:"activated",winter_rule_controlled_activation_outcome_observed_at:"2026-10-02T09:40:00-04:00",winter_rule_controlled_activation_outcome_reference:"outcome-517-polish",winter_rule_applied_booking_rule:"controlled_environment_only",winter_rule_applied_quote_rule:"quote_for_controlled_environment_only",winter_rule_availability_revalidated:true,winter_rule_checkout_collision_revalidated:true,winter_rule_runtime_revalidated_at:"2026-10-03T09:40:00-04:00",winter_rule_runtime_revalidation_reference:"runtime-517-polish"}
];
const economics={totals:{booking_count:0,ready_booking_count:0,review_booking_count:0,unavailable_booking_count:0,cogs_variance_booking_count:0},rows:[],seasonal_operability_evidence:{rows}};
const pre=buildWinterBookingQuoteRuleControlledActivationDecision({economics});
for(const source of rows){
  const code=source.package_code||source.add_on_code||source.service_code;
  const retained=pre.economics.winter_booking_quote_controlled_activation_decision.rows.find(row=>row.code===code);
  source.winter_rule_outcome_customer_transparency_wording=retained?.customer_limitation_text||"";
  source.winter_rule_outcome_decision_reference=source.winter_rule_controlled_activation_reference;
  source.winter_rule_outcome_owner_action_reference=source.winter_rule_controlled_activation_outcome_reference;
  source.winter_rule_outcome_service_classification=source.classification;
  source.winter_rule_outcome_customer_transparency_wording_snapshot=source.winter_rule_outcome_customer_transparency_wording;
  source.winter_rule_outcome_booking_rule_snapshot=source.booking_rule_candidate;
  source.winter_rule_outcome_quote_rule_snapshot=source.quote_rule_candidate;
  source.winter_rule_outcome_runtime_revalidation_reference=source.winter_rule_runtime_revalidation_reference;
  source.winter_rule_outcome_availability_authority="/api/availability";
  source.winter_rule_outcome_checkout_collision_authority="checkout_server_side_collision_revalidation";
}
rows[1].winter_rule_outcome_decision_reference="";
rows[2].winter_rule_outcome_service_classification="temperature_limited_outdoor";
rows[3].winter_rule_outcome_customer_transparency_wording_snapshot="Different customer wording";
rows[4].winter_rule_outcome_runtime_revalidation_reference="different-runtime-proof";

const report=buildWinterBookingQuoteRuleEvidenceIntegrityReview({economics,generated_at:"2026-10-06T12:00:00-04:00",freshness_window_days:30});
const review=report.economics.winter_booking_quote_rule_evidence_integrity_review;
assert.equal(report.winter_booking_quote_rule_integrity_build,537);
assert.equal(report.winter_booking_quote_rule_integrity_authority,"winter_booking_quote_rule_evidence_integrity_review");
assert.equal(review.row_count,5);
assert.equal(review.counts.integrity_current,1);
assert.equal(review.counts.decision_trace_identity_review,1);
assert.equal(review.counts.service_classification_review,1);
assert.equal(review.counts.customer_transparency_review,1);
assert.equal(review.counts.runtime_safety_identity_review,1);
assert.equal(review.counts.review_required,4);
assert.equal(review.rows.find(r=>r.code==="interior")?.integrity_state,"integrity_current");
assert.equal(review.rows.find(r=>r.code==="premium_wash")?.integrity_state,"decision_trace_identity_review_required");
assert.equal(review.rows.find(r=>r.code==="ceramic")?.integrity_state,"service_classification_integrity_review_required");
assert.equal(review.rows.find(r=>r.code==="wax")?.integrity_state,"customer_transparency_integrity_review_required");
assert.equal(review.rows.find(r=>r.code==="polish")?.integrity_state,"runtime_safety_identity_drift_review_required");
assert.equal(review.weather_ineligible_sessions_excluded_from_ordinary_conversion_interpretation,true);
assert.equal(report.retained_availability_authority,"/api/availability");
assert.equal(report.boundaries.automatic_rule_activation_allowed,false);
assert.equal(report.boundaries.storage_mutation_allowed,false);
assert.equal(report.truth_boundary.winter_rule_identity_may_be_inferred_from_source_or_runtime_green,false);
console.log("BUILD 537 WINTER BOOKING & QUOTE RULE EVIDENCE INTEGRITY REVIEW TEST: PASS");
