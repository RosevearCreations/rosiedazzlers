#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildSeasonalCapabilityPublicClaimDecisionOutcomeContinuity } from "../functions/api/_lib/seasonal-capability-public-claim-decision-outcome-continuity.js";

const common={
  capability_evidence_current:true,
  owner_review_decision:"approve_public_claim_review",
  owner_reviewed_at:"2026-09-26T09:00:00-04:00",
  owner_review_reference:"owner-review-496",
  activation_readiness_owner_decision:"approve_activation_readiness_review",
  activation_reviewed_at:"2026-09-26T09:10:00-04:00",
  activation_review_reference:"owner-review-497"
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
      public_claim_activation_decision:"approve_public_claim_activation",
      public_claim_activation_reviewed_at:"2026-09-26T10:00:00-04:00",
      public_claim_activation_reference:"owner-activation-506-interior",
      public_claim_activation_wording_confirmed:true,
      public_claim_outcome:"published",
      public_claim_outcome_observed_at:"2026-09-27T08:30:00-04:00",
      public_claim_outcome_reference:"manual-publication-review-516-interior",
      published_public_claim_wording:"Interior detailing can be scheduled during cold snaps when the working environment remains suitable.",
      public_claim_published_at:"2026-09-27T08:20:00-04:00",
      public_claim_publication_reference:"content-change-516-interior"
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
      public_claim_activation_decision:"hold_public_claim_activation",
      public_claim_activation_reviewed_at:"2026-09-26T10:05:00-04:00",
      public_claim_activation_reference:"owner-activation-506-wash",
      public_claim_activation_wording_confirmed:true,
      public_claim_outcome:"retain_hold",
      public_claim_outcome_observed_at:"2026-09-27T08:35:00-04:00",
      public_claim_outcome_reference:"owner-retain-hold-516-wash"
    },
    {
      ...common,
      add_on_code:"ceramic",
      classification:"controlled_environment_required",
      evidence_source_type:"process",
      evidence_source:"ceramic-process",
      indoor_capable_workflow_supported:true,
      indoor_workflow_source_type:"process",
      indoor_workflow_reference:"ceramic-indoor-sop",
      booking_rule_candidate:"controlled_environment_only",
      quote_rule_candidate:"quote_for_controlled_environment_only",
      public_claim_activation_decision:"approve_public_claim_activation",
      public_claim_activation_reviewed_at:"2026-09-26T10:15:00-04:00",
      public_claim_activation_reference:"owner-activation-506-ceramic",
      public_claim_activation_wording_confirmed:true,
      public_claim_outcome:"no_action",
      public_claim_outcome_observed_at:"2026-09-27T08:40:00-04:00",
      public_claim_outcome_reference:"owner-no-action-516-ceramic"
    },
    {
      ...common,
      add_on_code:"wax",
      classification:"temperature_limited_outdoor",
      evidence_source_type:"product",
      evidence_source:"wax-product-tds",
      minimum_working_temperature_c:10,
      exact_temperature_claim_supported:true,
      booking_rule_candidate:"temperature_limited_current_conditions_check",
      quote_rule_candidate:"quote_with_source_owned_temperature_limit",
      public_claim_activation_decision:"hold_public_claim_activation",
      public_claim_activation_reviewed_at:"2026-09-26T10:20:00-04:00",
      public_claim_activation_reference:"owner-activation-506-wax",
      public_claim_activation_wording_confirmed:true,
      public_claim_outcome:"published",
      public_claim_outcome_observed_at:"2026-09-27T08:45:00-04:00",
      public_claim_outcome_reference:"claimed-publication-516-wax",
      published_public_claim_wording:"Wax is available all winter.",
      public_claim_published_at:"2026-09-27T08:44:00-04:00",
      public_claim_publication_reference:"content-change-516-wax"
    }
  ]}
};

const report=buildSeasonalCapabilityPublicClaimDecisionOutcomeContinuity({economics});
const continuity=report.economics.seasonal_public_claim_outcome_continuity;
assert.equal(report.seasonal_public_claim_outcome_build,516);
assert.equal(report.seasonal_public_claim_outcome_authority,"seasonal_capability_public_claim_decision_outcome_continuity");
assert.equal(continuity.row_count,4);
assert.equal(continuity.counts.publication_observed,1);
assert.equal(continuity.counts.retain_hold_observed,1);
assert.equal(continuity.counts.no_action_observed,1);
assert.equal(continuity.counts.publication_evidence_conflict,1);

const interior=continuity.rows.find(row=>row.code==="interior");
assert.equal(interior.outcome_state,"publication_observed");
assert.equal(interior.publication_observed,true);
assert.equal(interior.published_wording_matches_reviewed_wording,true);
assert.equal(interior.manual_publication_only,true);

const wash=continuity.rows.find(row=>row.code==="premium_wash");
assert.equal(wash.outcome_state,"retain_hold_observed");
assert.equal(wash.source_owned_temperature_limit_text,"recorded working limit: minimum 5°C");

const ceramic=continuity.rows.find(row=>row.code==="ceramic");
assert.equal(ceramic.outcome_state,"no_action_observed");
assert.equal(ceramic.public_claim_outcome_observed,true);

const wax=continuity.rows.find(row=>row.code==="wax");
assert.equal(wax.outcome_state,"publication_evidence_conflict");
assert.equal(wax.publication_observed,false);
assert.ok(continuity.gaps.find(g=>g.code==="wax")?.missing.includes("build506_public_claim_activation_decision_ready"));
assert.ok(continuity.gaps.find(g=>g.code==="wax")?.missing.includes("published_wording_matches_reviewed_service_specific_wording"));

assert.equal(continuity.broad_winter_availability_authorized,false);
assert.equal(report.truth_boundary.publication_state_may_be_inferred_from_decision_readiness,false);
assert.equal(report.truth_boundary.source_owned_temperature_limit_may_be_widened,false);
assert.equal(report.boundaries.automatic_publication_allowed,false);
assert.equal(report.boundaries.automatic_booking_availability_change_allowed,false);
assert.equal(report.boundaries.canonical_hold_mutation_allowed,false);

console.log("BUILD 516 SEASONAL CAPABILITY & PUBLIC CLAIM DECISION OUTCOME CONTINUITY TEST: PASS");
