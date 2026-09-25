#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildProviderLocalSearchOutcomeEvidenceRefresh } from "../functions/api/_lib/provider-local-search-outcome-evidence-refresh.js";

const continuity = {
  provider_outcomes_and_communications: {
    evidence_trace_key: "stripe_payment:2026-09-24|paypal_payment:2026-09-24|refund:2026-09-24|delivery:2026-09-24",
    rows: [
      {id:"stripe_payment",source:"Stripe provider evidence",source_available:true,evidence_at:"2026-09-24T10:00:00Z",evidence_timestamp_valid:true,freshness:"current",outcome_status:"observed",provider_identity_present:true},
      {id:"paypal_payment",source:"PayPal provider evidence",source_available:true,evidence_at:"2026-09-24T10:05:00Z",evidence_timestamp_valid:true,freshness:"current",outcome_status:"observed",provider_identity_present:true},
      {id:"refund",source:"Provider refund evidence",source_available:true,evidence_at:"2026-09-24T10:10:00Z",evidence_timestamp_valid:true,freshness:"current",outcome_status:"observed",provider_identity_present:true},
      {id:"delivery",source:"Message delivery provider evidence",source_available:true,evidence_at:"2026-09-24T10:15:00Z",evidence_timestamp_valid:true,freshness:"current",outcome_status:"observed",provider_identity_present:true}
    ]
  },
  local_search: {
    rows: [
      {provider:"search_console",continuity_state:"descriptive_review_ready",identity_match:true,comparable_window_length:true,current_window_days:30,previous_window_days:30,current_snapshot:{label:"https://rosiedazzlers.ca/",period_start:"2026-08-26",period_end:"2026-09-24",observed_at:"2026-09-25T10:00:00Z"},previous_snapshot:{label:"https://rosiedazzlers.ca/",period_start:"2026-07-27",period_end:"2026-08-25",observed_at:"2026-08-26T10:00:00Z"},first_party_context:{available:true}},
      {provider:"google_business_profile",continuity_state:"descriptive_review_ready",identity_match:true,comparable_window_length:true,current_window_days:30,previous_window_days:30,current_snapshot:{label:"Rosie Dazzlers Tillsonburg",period_start:"2026-08-26",period_end:"2026-09-24",observed_at:"2026-09-25T10:05:00Z"},previous_snapshot:{label:"Rosie Dazzlers Tillsonburg",period_start:"2026-07-27",period_end:"2026-08-25",observed_at:"2026-08-26T10:05:00Z"},first_party_context:{available:true}}
    ]
  }
};

const report = buildProviderLocalSearchOutcomeEvidenceRefresh({continuity,generated_at:"2026-09-25T12:00:00Z"});
assert.equal(report.outcome_evidence_refresh_build,499);
assert.equal(report.status,"outcome_evidence_refresh_review_ready");
assert.equal(report.provider_outcomes_and_communications.current_attributable_count,4);
assert.equal(report.local_search_provider_outcomes.correct_source_window_count,2);
assert.equal(report.source_contract.cross_family_identity_join_performed,false);
assert.equal(report.truth_boundary.weather_causation_inferred,false);
assert.equal(report.truth_boundary.booking_conversion_causation_inferred,false);
assert.equal(report.boundaries.search_console_or_gbp_write_performed,false);
assert.equal(report.boundaries.permanent_polling,false);

const wrongWindow = structuredClone(continuity);
wrongWindow.local_search.rows[0].comparable_window_length = false;
const incomplete = buildProviderLocalSearchOutcomeEvidenceRefresh({continuity:wrongWindow});
assert.equal(incomplete.status,"outcome_evidence_refresh_required");
assert.equal(incomplete.local_search_provider_outcomes.status,"local_search_refresh_required");

const unavailable = structuredClone(continuity);
unavailable.provider_outcomes_and_communications.rows[1].source_available = false;
const blocked = buildProviderLocalSearchOutcomeEvidenceRefresh({continuity:unavailable});
assert.equal(blocked.status,"outcome_evidence_source_unavailable");
assert.equal(blocked.provider_outcomes_and_communications.status,"provider_source_unavailable");

console.log("BUILD 499 PROVIDER & LOCAL SEARCH OUTCOME EVIDENCE REFRESH TEST: PASS");
