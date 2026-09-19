import assert from "node:assert/strict";
import { buildLocalSearchProviderEvidenceRefresh } from "../functions/api/_lib/local-search-provider-evidence-refresh.js";

const generatedAt = "2026-09-19T20:00:00.000Z";
const firstParty = {
  classification: "runtime_proven",
  evidence_state: "first_party_observed",
  source: "Rosie Dazzlers site activity rollups",
  window_start: "2026-08-21",
  window_end: "2026-09-19",
  google_referral_events: 18,
  target_local_service_page_views: 47,
  target_pages_with_observed_views: 7
};
const proof = {
  classification: "runtime_proven",
  evidence_state: "approved_public_proof_observed",
  source: "Published customer-approved before/after evidence",
  approved_public_non_sample_pairs: 9,
  towns_with_published_proof: 4,
  services_with_published_proof: 5
};

const missing = buildLocalSearchProviderEvidenceRefresh({
  generated_at: generatedAt,
  measurement: { first_party: firstParty, local_proof: proof, providers: {} }
});
assert.equal(missing.status, "provider_dependent");
assert.equal(missing.counts.provider_dependent, 2);
assert.equal(missing.boundaries.google_provider_contact_performed, false);
assert.equal(missing.boundaries.provider_snapshot_write_performed, false);
assert.equal(missing.boundaries.ranking_outcome_inferred, false);

const fresh = buildLocalSearchProviderEvidenceRefresh({
  generated_at: generatedAt,
  measurement: {
    first_party: firstParty,
    local_proof: proof,
    providers: {
      search_console: {
        evidence_state: "observed_snapshot",
        label: "https://rosiedazzlers.ca/",
        period_start: "2026-08-20",
        period_end: "2026-09-18",
        observed_at: "2026-09-19T12:00:00.000Z",
        freshness_days: 0,
        freshness_limit_days: 45,
        metrics: { clicks: 14, impressions: 620, ctr_percent: 2.26, average_position: 18.4 }
      },
      google_business_profile: {
        evidence_state: "observed_snapshot",
        label: "Rosie Dazzlers · Ontario",
        period_start: "2026-08-20",
        period_end: "2026-09-18",
        observed_at: "2026-09-19T12:05:00.000Z",
        freshness_days: 0,
        freshness_limit_days: 45,
        metrics: { profile_views: 72, website_clicks: 11, calls: 3, direction_requests: 4 }
      }
    }
  }
});
assert.equal(fresh.status, "observed");
assert.equal(fresh.counts.observed, 2);
assert.equal(fresh.counts.refresh_required, 0);
assert.equal(fresh.providers.every((row) => row.identity.explicit === true), true);
assert.equal(fresh.providers.every((row) => row.first_party_window_overlap === true), true);

const stale = buildLocalSearchProviderEvidenceRefresh({
  generated_at: generatedAt,
  measurement: {
    first_party: firstParty,
    local_proof: proof,
    providers: {
      search_console: {
        evidence_state: "stale_observed_snapshot",
        label: "https://rosiedazzlers.ca/",
        period_start: "2026-05-01",
        period_end: "2026-05-31",
        observed_at: "2026-06-01T12:00:00.000Z",
        freshness_days: 110,
        freshness_limit_days: 45,
        metrics: { clicks: 2 }
      },
      google_business_profile: fresh.providers[1] ? {
        evidence_state: "observed_snapshot",
        label: "Rosie Dazzlers · Ontario",
        period_start: "2026-08-20",
        period_end: "2026-09-18",
        observed_at: "2026-09-19T12:05:00.000Z",
        freshness_days: 0,
        freshness_limit_days: 45,
        metrics: { profile_views: 72 }
      } : {}
    }
  }
});
assert.equal(stale.status, "owner_action");
assert.equal(stale.counts.owner_action, 1);
assert.equal(stale.counts.refresh_required, 1);
console.log("local-search provider evidence refresh test: PASS");
