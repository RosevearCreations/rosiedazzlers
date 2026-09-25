#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildSeasonalCapabilityOwnerReviewPublicClaimDecision } from "../functions/api/_lib/seasonal-capability-owner-review-public-claim-decision.js";

const economics={
  totals:{booking_count:0,ready_booking_count:0,review_booking_count:0,unavailable_booking_count:0,cogs_variance_booking_count:0},
  rows:[],
  seasonal_operability_evidence:{rows:[
    {package_code:"interior",classification:"cold_snap_capable",evidence_source_type:"process",evidence_source:"interior-process-record",capability_evidence_current:true,owner_review_decision:"approve_public_claim_review",owner_reviewed_at:"2026-09-24T18:00:00-04:00",owner_review_reference:"owner-review-496-interior"},
    {package_code:"premium_wash",classification:"temperature_limited_outdoor",evidence_source_type:"product",evidence_source:"wash-chemical-tds",minimum_working_temperature_c:5,exact_temperature_claim_supported:true,capability_evidence_current:true,owner_review_decision:"hold_public_claim",owner_reviewed_at:"2026-09-24T18:05:00-04:00",owner_review_reference:"owner-review-496-premium"},
    {add_on_code:"ceramic",classification:"controlled_environment_required",evidence_source_type:"site",evidence_source:"controlled-bay-requirement",indoor_capable_workflow_supported:true,indoor_workflow_source_type:"process",indoor_workflow_reference:"ceramic-indoor-process"}
  ]}
};

const report=buildSeasonalCapabilityOwnerReviewPublicClaimDecision({economics});
const review=report.economics.seasonal_owner_review_public_claim;
assert.equal(report.seasonal_owner_review_enrichment_build,496);
assert.equal(report.seasonal_owner_review_authority,"seasonal_capability_owner_review_public_claim_decision");
assert.equal(review.status,"review");
assert.equal(review.row_count,3);
assert.equal(review.counts.publication_review_ready,1);
assert.equal(review.counts.owner_hold,1);
assert.equal(review.counts.owner_review_required,1);
assert.equal(review.rows[0].decision_state,"publication_review_ready");
assert.equal(review.rows[0].publication_review_ready,true);
assert.equal(review.rows[1].decision_state,"owner_hold");
assert.equal(review.rows[1].source_owned_temperature_limit_text,"recorded working limit: minimum 5°C");
assert.equal(review.rows[2].decision_state,"owner_review_required");
assert.equal(review.broad_winter_availability_claim_authorized,false);
assert.equal(review.automatic_publication_authorized,false);
assert.equal(report.truth_boundary.service_specific_review_ready_authorizes_broad_winter_claim,false);
assert.equal(report.boundaries.automatic_publication_allowed,false);

const invalidApproval=buildSeasonalCapabilityOwnerReviewPublicClaimDecision({
  economics:{totals:economics.totals,rows:[],seasonal_operability_evidence:{rows:[{
    package_code:"interior",classification:"cold_snap_capable",evidence_source_type:"process",evidence_source:"interior-process-record",
    capability_evidence_current:true,owner_review_decision:"approve_public_claim_review",owner_review_reference:"owner-review-without-date"
  }]}}
});
const invalidRow=invalidApproval.economics.seasonal_owner_review_public_claim.rows[0];
assert.equal(invalidRow.publication_review_ready,false);
assert.equal(invalidRow.decision_state,"owner_review_required");
assert.ok(invalidApproval.economics.seasonal_owner_review_public_claim.gaps[0].missing.includes("dated_owner_review"));

console.log("BUILD 496 SEASONAL CAPABILITY OWNER REVIEW & PUBLIC CLAIM DECISION TEST: PASS");
