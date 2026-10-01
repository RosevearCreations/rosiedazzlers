#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildSeasonalCapabilityPublicClaimOutcomeFreshnessReview } from "../functions/api/_lib/seasonal-capability-public-claim-outcome-freshness-review.js";

const common={capability_evidence_current:true,owner_review_decision:"approve_public_claim_review",owner_reviewed_at:"2026-09-26T09:00:00-04:00",owner_review_reference:"owner-review-496",activation_readiness_owner_decision:"approve_activation_readiness_review",activation_reviewed_at:"2026-09-26T09:10:00-04:00",activation_review_reference:"owner-review-497",public_claim_activation_decision:"approve_public_claim_activation",public_claim_activation_reviewed_at:"2026-09-26T10:00:00-04:00",public_claim_activation_reference:"owner-activation-506",public_claim_activation_wording_confirmed:true};
const economics={totals:{booking_count:0,ready_booking_count:0,review_booking_count:0,unavailable_booking_count:0,cogs_variance_booking_count:0},rows:[],seasonal_operability_evidence:{rows:[
{...common,package_code:"interior",classification:"cold_snap_capable",evidence_source_type:"process",evidence_source:"interior-process-record",public_claim_outcome:"published",public_claim_outcome_observed_at:"2026-09-29T08:30:00-04:00",public_claim_outcome_reference:"manual-publication-review-516-interior",public_claim_outcome_capability_classification:"cold_snap_capable",public_claim_outcome_published_wording:"This service has recorded cold-weather capability, but current site and weather conditions still need confirmation.",published_public_claim_wording:"This service has recorded cold-weather capability, but current site and weather conditions still need confirmation.",public_claim_published_at:"2026-09-29T08:20:00-04:00",public_claim_publication_reference:"content-change-516-interior"},
{...common,package_code:"premium_wash",classification:"temperature_limited_outdoor",evidence_source_type:"product",evidence_source:"wash-product-tds",minimum_working_temperature_c:5,exact_temperature_claim_supported:true,public_claim_activation_decision:"hold_public_claim_activation",public_claim_outcome:"retain_hold",public_claim_outcome_observed_at:"2026-09-28T08:35:00-04:00",public_claim_outcome_reference:"owner-retain-hold-516-wash",public_claim_outcome_capability_classification:"temperature_limited_outdoor",public_claim_outcome_minimum_working_temperature_c:5},
{...common,add_on_code:"ceramic",classification:"controlled_environment_required",evidence_source_type:"process",evidence_source:"ceramic-process",indoor_capable_workflow_supported:true,indoor_workflow_source_type:"process",indoor_workflow_reference:"ceramic-indoor-sop",public_claim_outcome:"no_action",public_claim_outcome_observed_at:"2026-08-01T08:40:00-04:00",public_claim_outcome_reference:"owner-no-action-516-ceramic",public_claim_outcome_capability_classification:"controlled_environment_required"},
{...common,add_on_code:"wax",classification:"temperature_limited_outdoor",evidence_source_type:"product",evidence_source:"wax-product-tds",minimum_working_temperature_c:10,exact_temperature_claim_supported:true,public_claim_activation_decision:"hold_public_claim_activation",public_claim_outcome:"retain_hold",public_claim_outcome_observed_at:"2026-09-30T08:45:00-04:00",public_claim_outcome_reference:"owner-retain-hold-516-wax",public_claim_outcome_capability_classification:"temperature_limited_outdoor",public_claim_outcome_minimum_working_temperature_c:5},
{...common,add_on_code:"polish",classification:"controlled_environment_required",evidence_source_type:"process",evidence_source:"polish-process",indoor_capable_workflow_supported:true,indoor_workflow_source_type:"process",indoor_workflow_reference:"polish-indoor-sop",public_claim_outcome:"published",public_claim_outcome_observed_at:"2026-09-30T09:00:00-04:00",public_claim_outcome_reference:"publication-review-516-polish",public_claim_outcome_capability_classification:"controlled_environment_required",public_claim_outcome_published_wording:"This service is available only when a suitable controlled environment is confirmed.",published_public_claim_wording:"This service is available all winter.",public_claim_published_at:"2026-09-30T08:55:00-04:00",public_claim_publication_reference:"content-change-516-polish"}
]}};

const report=buildSeasonalCapabilityPublicClaimOutcomeFreshnessReview({economics,generated_at:"2026-10-01T12:00:00-04:00",freshness_window_days:30});
const review=report.economics.seasonal_public_claim_outcome_freshness_review;
assert.equal(report.seasonal_public_claim_freshness_build,526);
assert.equal(report.seasonal_public_claim_freshness_authority,"seasonal_capability_public_claim_outcome_freshness_review");
assert.equal(review.row_count,5);
assert.equal(review.counts.publication_current,1);
assert.equal(review.counts.retain_hold_current,1);
assert.equal(review.counts.stale,1);
assert.equal(review.counts.drift,2);
assert.equal(review.counts.review_required,3);
assert.equal(review.rows.find((row)=>row.code==="interior")?.freshness_state,"publication_current");
assert.equal(review.rows.find((row)=>row.code==="premium_wash")?.freshness_state,"retain_hold_current");
assert.equal(review.rows.find((row)=>row.code==="ceramic")?.freshness_state,"stale_outcome_review_required");
assert.equal(review.rows.find((row)=>row.code==="wax")?.freshness_state,"source_owned_threshold_change_review_required");
assert.equal(review.rows.find((row)=>row.code==="polish")?.freshness_state,"public_wording_drift_review_required");
assert.equal(review.rows.find((row)=>row.code==="wax")?.source_owned_temperature_limit_may_be_widened,false);
assert.equal(review.broad_winter_availability_authorized,false);
assert.equal(report.boundaries.automatic_publication_allowed,false);
assert.equal(report.boundaries.canonical_hold_mutation_allowed,false);
assert.equal(report.truth_boundary.freshness_may_be_inferred_from_source_or_runtime_green,false);
console.log("BUILD 526 SEASONAL CAPABILITY & PUBLIC CLAIM OUTCOME FRESHNESS REVIEW TEST: PASS");
