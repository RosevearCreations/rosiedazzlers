#!/usr/bin/env node
import assert from "node:assert/strict";
import {buildControlledSiteCapacityOwnerVerification as build} from "../functions/api/_lib/controlled-site-routing-capacity-owner-verification.js";
const now="2026-10-11T18:00:00Z";
const row={entity_type:"package",code:"ceramic",controlled_environment_candidate_present:true,evidence_integrity_current:true,
 service_site_workflow_identity_matches_outcome_snapshot:true,routing_outcome_identity_matches_outcome_snapshot:true,
 site_confirmation_identity_matches_outcome_snapshot:true,current_routing_outcome:"routed_to_confirmed_site",
 current_site_reference:"bay-A",current_workflow_reference:"ceramic-controlled",current_site_confirmation_reference:"s-1",
 current_capacity_state:"bounded_observed_capacity_current",bounded_capacity_context_identity_matches_outcome_snapshot:true,
 observed_capacity_jobs:2,capacity_observation_window_days:7,capacity_observation_site_reference:"bay-A",
 capacity_observation_reference:"owner-observed-2"};
const source={package_code:"ceramic",controlled_environment_owner_verification_reference:"manual-owner-1",
 controlled_environment_owner_verified_at:"2026-10-10T12:00:00Z",
 controlled_environment_owner_verified_site_reference:"bay-A",controlled_environment_owner_verified_workflow_reference:"ceramic-controlled"};
const base={report:{economics:{controlled_environment_routing_capacity_evidence_integrity_review:{rows:[row]}}},
 economics:{seasonal_operability_evidence:{rows:[source]}},generated_at:now};
const good=build(base);assert.equal(good.status,"manual_review_ready");assert.equal(good.manual_review_ready_count,1);
assert.equal(good.rows[0].observed_capacity_jobs,2);assert.equal(good.future_capacity_authorized,false);
const missing=build({...base,economics:{seasonal_operability_evidence:{rows:[{...source,controlled_environment_owner_verification_reference:""}]}}});
assert.equal(missing.rows[0].missing.includes("dated_attributable_owner_verification_missing_or_stale"),true);
const stale=build({...base,economics:{seasonal_operability_evidence:{rows:[{...source,controlled_environment_owner_verified_at:"2026-08-01T12:00:00Z"}]}}});
assert.equal(stale.status,"review_required");
const wrong=build({...base,report:{economics:{controlled_environment_routing_capacity_evidence_integrity_review:{rows:[{...row,capacity_observation_site_reference:"bay-B"}]}}}});
assert.equal(wrong.rows[0].missing.includes("bounded_site_capacity_evidence_mismatch"),true);
const dup=build({...base,economics:{seasonal_operability_evidence:{rows:[source,source]}}});
assert.equal(dup.rows[0].missing.includes("duplicate_service_specific_source"),true);
assert.equal(build({}).status,"unavailable");
console.log("BUILD 548 CONTROLLED SITE OWNER VERIFICATION: PASS");
