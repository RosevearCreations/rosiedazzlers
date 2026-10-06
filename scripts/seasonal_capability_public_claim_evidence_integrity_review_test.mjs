#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildSeasonalCapabilityPublicClaimEvidenceIntegrityReview } from "../functions/api/_lib/seasonal-capability-public-claim-evidence-integrity-review.js";

const common={
  capability_evidence_current:true,
  owner_review_decision:"approve_public_claim_review",
  owner_reviewed_at:"2026-09-26T09:00:00-04:00",
  owner_review_reference:"owner-review-496",
  activation_readiness_owner_decision:"approve_activation_readiness_review",
  activation_reviewed_at:"2026-09-26T09:10:00-04:00",
  activation_review_reference:"owner-review-497",
  public_claim_activation_decision:"approve_public_claim_activation",
  public_claim_activation_reviewed_at:"2026-09-26T10:00:00-04:00",
  public_claim_activation_reference:"owner-activation-506",
  public_claim_activation_wording_confirmed:true
};
const snapshots=(sourceType,sourceRef,outcomeRef,publicationRef=null)=>({
  public_claim_outcome_owning_evidence_source_type:sourceType,
  public_claim_outcome_owning_evidence_source:sourceRef,
  public_claim_outcome_owner_action_reference:outcomeRef,
  ...(publicationRef?{public_claim_outcome_publication_reference:publicationRef}:{})
});
const economics={
  totals:{booking_count:0,ready_booking_count:0,review_booking_count:0,unavailable_booking_count:0,cogs_variance_booking_count:0},
  rows:[],
  seasonal_operability_evidence:{rows:[
    {
      ...common,...snapshots("process","interior-process-record","manual-publication-review-516-interior","content-change-516-interior"),
      package_code:"interior",classification:"cold_snap_capable",evidence_source_type:"process",evidence_source:"interior-process-record",
      public_claim_outcome:"published",public_claim_outcome_observed_at:"2026-09-29T08:30:00-04:00",
      public_claim_outcome_reference:"manual-publication-review-516-interior",
      public_claim_outcome_capability_classification:"cold_snap_capable",
      public_claim_outcome_published_wording:"This service has recorded cold-weather capability, but current site and weather conditions still need confirmation.",
      published_public_claim_wording:"This service has recorded cold-weather capability, but current site and weather conditions still need confirmation.",
      public_claim_published_at:"2026-09-29T08:20:00-04:00",public_claim_publication_reference:"content-change-516-interior"
    },
    {
      ...common,...snapshots("product","different-wash-source","owner-retain-hold-516-wash"),
      package_code:"premium_wash",classification:"temperature_limited_outdoor",evidence_source_type:"product",evidence_source:"wash-product-tds",
      minimum_working_temperature_c:5,exact_temperature_claim_supported:true,
      public_claim_activation_decision:"hold_public_claim_activation",public_claim_outcome:"retain_hold",
      public_claim_outcome_observed_at:"2026-09-28T08:35:00-04:00",public_claim_outcome_reference:"owner-retain-hold-516-wash",
      public_claim_outcome_capability_classification:"temperature_limited_outdoor",
      public_claim_outcome_minimum_working_temperature_c:5
    },
    {
      ...common,...snapshots("process","ceramic-process","owner-no-action-516-ceramic"),
      add_on_code:"ceramic",classification:"controlled_environment_required",evidence_source_type:"process",evidence_source:"ceramic-process",
      indoor_capable_workflow_supported:true,indoor_workflow_source_type:"process",indoor_workflow_reference:"ceramic-indoor-sop",
      public_claim_outcome:"no_action",public_claim_outcome_observed_at:"2026-08-01T08:40:00-04:00",
      public_claim_outcome_reference:"owner-no-action-516-ceramic",
      public_claim_outcome_capability_classification:"controlled_environment_required"
    },
    {
      ...common,...snapshots("product","wax-product-tds","owner-retain-hold-516-wax"),
      add_on_code:"wax",classification:"temperature_limited_outdoor",evidence_source_type:"product",evidence_source:"wax-product-tds",
      minimum_working_temperature_c:10,exact_temperature_claim_supported:true,
      public_claim_activation_decision:"hold_public_claim_activation",public_claim_outcome:"retain_hold",
      public_claim_outcome_observed_at:"2026-09-30T08:45:00-04:00",public_claim_outcome_reference:"owner-retain-hold-516-wax",
      public_claim_outcome_capability_classification:"temperature_limited_outdoor",
      public_claim_outcome_minimum_working_temperature_c:5
    },
    {
      ...common,...snapshots("process","polish-process","publication-review-516-polish","content-change-516-polish"),
      add_on_code:"polish",classification:"controlled_environment_required",evidence_source_type:"process",evidence_source:"polish-process",
      indoor_capable_workflow_supported:true,indoor_workflow_source_type:"process",indoor_workflow_reference:"polish-indoor-sop",
      public_claim_outcome:"published",public_claim_outcome_observed_at:"2026-09-30T09:00:00-04:00",
      public_claim_outcome_reference:"publication-review-516-polish",
      public_claim_outcome_capability_classification:"controlled_environment_required",
      public_claim_outcome_published_wording:"This service is available only when a suitable controlled environment is confirmed.",
      published_public_claim_wording:"This service is available all winter.",
      public_claim_published_at:"2026-09-30T08:55:00-04:00",public_claim_publication_reference:"content-change-516-polish"
    }
  ]}
};

const report=buildSeasonalCapabilityPublicClaimEvidenceIntegrityReview({
  economics,generated_at:"2026-10-01T12:00:00-04:00",freshness_window_days:30
});
const review=report.economics.seasonal_public_claim_evidence_integrity_review;
assert.equal(report.seasonal_public_claim_integrity_build,536);
assert.equal(report.seasonal_public_claim_integrity_authority,"seasonal_capability_public_claim_evidence_integrity_review");
assert.equal(review.row_count,5);
assert.equal(review.counts.integrity_current,1);
assert.equal(review.counts.owning_evidence_identity_review,1);
assert.equal(review.counts.freshness_window_review,1);
assert.equal(review.counts.source_owned_limit_review,1);
assert.equal(review.counts.wording_review,1);
assert.equal(review.counts.review_required,4);
assert.equal(review.rows.find((row)=>row.code==="interior")?.integrity_state,"integrity_current");
assert.equal(review.rows.find((row)=>row.code==="premium_wash")?.integrity_state,"owning_evidence_identity_drift_review_required");
assert.equal(review.rows.find((row)=>row.code==="ceramic")?.integrity_state,"freshness_window_integrity_review_required");
assert.equal(review.rows.find((row)=>row.code==="wax")?.integrity_state,"source_owned_limit_integrity_review_required");
assert.equal(review.rows.find((row)=>row.code==="polish")?.integrity_state,"public_claim_wording_integrity_review_required");
assert.equal(review.rows.find((row)=>row.code==="interior")?.owner_action_identity_matches_outcome_snapshot,true);
assert.equal(review.rows.find((row)=>row.code==="premium_wash")?.owning_evidence_identity_matches_outcome_snapshot,false);
assert.equal(review.broad_winter_availability_authorized,false);
assert.equal(report.boundaries.storage_mutation_allowed,false);
assert.equal(report.boundaries.persistent_telemetry_allowed,false);
assert.equal(report.truth_boundary.evidence_identity_may_be_inferred_from_source_or_runtime_green,false);
console.log("BUILD 536 SEASONAL CAPABILITY & PUBLIC CLAIM EVIDENCE INTEGRITY REVIEW TEST: PASS");
