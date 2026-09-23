#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildReliabilityCostRecoveryEvidenceContinuity } from "../functions/api/_lib/reliability-cost-recovery-evidence-continuity.js";

const reassessment={
  generated_at:"2026-09-23T12:00:00Z",
  counts:{green_retained_controls:1,operational_pressure:0,stale_evidence:0,owner_action:0,provider_dependency:1,unavailable_evidence:0},
  buckets:{green_retained_controls:[],operational_pressure:[],stale_evidence:[],owner_action:[],provider_dependency:[],unavailable_evidence:[]},
  metrics:{traffic_events_24h:120,traffic_events_7d:600,traffic_recent_to_prior_ratio:1.5},
  evidence_age_review:{current_count:3,aging_count:0,stale_count:0,undated_count:0},
  operational_guardrails:{}
};
const reliability={
  traffic:{events_24h:120,events_7d:600,prior_six_day_average:80,recent_to_prior_ratio:1.5},
  provider_cost_evidence:{rows:[
    {provider_owned:true,observed_at:"2026-09-20T00:00:00Z",metric:"quota",unit:"rows_read",value:300000,source_reference:"provider-snapshot-1"},
    {provider_owned:true,observed_at:"2026-09-21T00:00:00Z",metric:"quota",unit:"rows_read",value:350000,source_reference:"provider-snapshot-2"}
  ]},
  field_operability_evidence:{rows:[
    {service_code:"interior",classification:"cold_snap_capable",source_reference:"process-record"},
    {service_code:"wash",classification:"temperature_limited_outdoor",source_reference:"product-tds",minimum_working_temperature_c:5,exact_temperature_claim_supported:true}
  ]}
};
const recovery={recovery_continuity_evidence:{rows:[
  {observed_at:"2026-09-20T10:00:00Z",observation_kind:"bounded_restore_drill",environment:"nonproduction",outcome:"success",source_reference:"drill-1"},
  {observed_at:"2026-09-22T10:00:00Z",observation_kind:"bounded_restore_drill",environment:"nonproduction",outcome:"success",source_reference:"drill-2"}
]}};

const report=buildReliabilityCostRecoveryEvidenceContinuity({reassessment,reliability,recovery,generated_at:"2026-09-23T12:00:00Z"});
assert.equal(report.continuity_enrichment_build,484);
assert.equal(report.continuity_authority,"reliability_cost_recovery_evidence_continuity");
assert.equal(report.continuity_review.provider_cost_quota.comparable_window_evidence,true);
assert.equal(report.continuity_review.provider_cost_quota.first_party_traffic_used_as_proxy,false);
assert.equal(report.continuity_review.recovery.comparable_window_evidence,true);
assert.equal(report.continuity_review.recovery.real_production_recovery_established,false);
assert.equal(report.continuity_review.field_operability.counts.cold_snap_capable,1);
assert.equal(report.continuity_review.field_operability.rows[1].minimum_working_temperature_c,5);
assert.equal(report.truth_boundary.cold_weather_limitation_is_application_reliability_failure,false);
assert.equal(report.truth_boundary.technical_availability_proves_field_operability,false);
assert.equal(report.boundaries.production_restore_allowed,false);

const unavailable=buildReliabilityCostRecoveryEvidenceContinuity({reassessment,reliability:{traffic:{events_24h:10,events_7d:70}},recovery:{}});
assert.equal(unavailable.continuity_review.provider_cost_quota.status,"external_provider_evidence_required");
assert.equal(unavailable.continuity_review.recovery.status,"recovery_observation_evidence_required");
assert.equal(unavailable.continuity_review.field_operability.status,"unavailable");
assert.equal(unavailable.truth_boundary.first_party_traffic_proves_cloudflare_billing,false);

const badProvider=buildReliabilityCostRecoveryEvidenceContinuity({
  reassessment,
  reliability:{provider_cost_evidence:{rows:[{provider_owned:false,observed_at:"2026-09-20T00:00:00Z",metric:"billing",unit:"cad",value:12,source_reference:"internal-guess"}]}}
});
assert.equal(badProvider.continuity_review.provider_cost_quota.valid_provider_owned_row_count,0);
assert.equal(badProvider.continuity_review.provider_cost_quota.status,"external_provider_evidence_required");

console.log("BUILD 484 RELIABILITY COST RECOVERY EVIDENCE CONTINUITY TEST: PASS");
