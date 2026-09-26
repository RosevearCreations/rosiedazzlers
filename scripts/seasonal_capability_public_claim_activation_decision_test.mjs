#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildSeasonalCapabilityPublicClaimActivationDecision } from "../functions/api/_lib/seasonal-capability-public-claim-activation-decision.js";

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
      public_claim_activation_wording_confirmed:true
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
      public_claim_activation_wording_confirmed:true
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
      public_claim_activation_reference:"owner-activation-506-ceramic",
      public_claim_activation_wording_confirmed:false
    }
  ]}
};

const report=buildSeasonalCapabilityPublicClaimActivationDecision({economics});
const decision=report.economics.seasonal_public_claim_activation_decision;
assert.equal(report.seasonal_public_claim_activation_build,506);
assert.equal(report.seasonal_public_claim_activation_authority,"seasonal_capability_public_claim_activation_decision");
assert.equal(decision.row_count,3);
assert.equal(decision.counts.public_claim_activation_decision_ready,1);
assert.equal(decision.counts.owner_hold,1);
assert.equal(decision.counts.activation_owner_review_required,1);

const interior=decision.rows.find(row=>row.code==="interior");
assert.equal(interior.activation_decision_state,"public_claim_activation_decision_ready");
assert.equal(interior.public_claim_activation_decision_ready,true);
assert.equal(interior.manual_publication_required,true);
assert.equal(interior.automatic_publication_authorized,false);

const wash=decision.rows.find(row=>row.code==="premium_wash");
assert.equal(wash.activation_decision_state,"owner_hold");
assert.equal(wash.source_owned_temperature_limit_text,"recorded working limit: minimum 5°C");

const ceramic=decision.rows.find(row=>row.code==="ceramic");
assert.equal(ceramic.activation_decision_state,"activation_owner_review_required");
assert.ok(decision.gaps.find(g=>g.code==="ceramic")?.missing.includes("final_service_specific_wording_confirmation"));
assert.ok(decision.gaps.find(g=>g.code==="ceramic")?.missing.includes("dated_public_claim_activation_review"));

assert.equal(decision.broad_winter_availability_authorized,false);
assert.equal(report.truth_boundary.activation_decision_ready_is_publication,false);
assert.equal(report.truth_boundary.final_owner_decision_may_widen_source_owned_temperature_limit,false);
assert.equal(report.boundaries.automatic_publication_allowed,false);
assert.equal(report.boundaries.automatic_booking_availability_change_allowed,false);

console.log("BUILD 506 SEASONAL CAPABILITY & PUBLIC CLAIM ACTIVATION DECISION TEST: PASS");
