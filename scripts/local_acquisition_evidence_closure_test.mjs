import assert from "node:assert/strict";
import { buildLocalAcquisitionEvidenceClosure } from "../functions/api/_lib/local-acquisition-evidence-closure.js";

const baseReport = {
  generated_at: "2026-09-18T22:00:00Z",
  first_party: { classification: "source_ready", evidence_state: "observed_window" },
  local_proof: { classification: "source_ready", evidence_state: "published_proof" },
  providers: {
    search_console: {
      classification: "owner_action",
      evidence_state: "observed_snapshot",
      observed_at: "2026-09-18T21:00:00Z",
      period_start: "2026-08-18",
      period_end: "2026-09-18",
      label: "https://rosiedazzlers.ca/",
      metrics: { clicks: 12, impressions: 150, ctr_percent: 8, average_position: 11.2 }
    },
    google_business_profile: {
      classification: "owner_action",
      evidence_state: "observed_snapshot",
      observed_at: "2026-09-18T21:05:00Z",
      period_start: "2026-08-18",
      period_end: "2026-09-18",
      label: "Rosie Dazzlers · Ontario",
      metrics: { profile_views: 80, website_clicks: 10, calls: 3, direction_requests: 2 }
    }
  }
};

const ready = buildLocalAcquisitionEvidenceClosure(baseReport);
assert.equal(ready.status, "ready");
assert.equal(ready.decision, "local_acquisition_evidence_complete");
assert.equal(ready.counts.observed, 4);
assert.equal(ready.remaining_actions.length, 0);
assert.equal(ready.truth_boundary.ranking_inferred, false);
assert.equal(ready.truth_boundary.google_credentials_exposed, false);

const missingSearchConsole = structuredClone(baseReport);
missingSearchConsole.providers.search_console = {
  classification: "provider_dependent",
  evidence_state: "missing",
  action: "Record Search Console evidence."
};
const providerHold = buildLocalAcquisitionEvidenceClosure(missingSearchConsole);
assert.equal(providerHold.status, "hold");
assert.equal(providerHold.counts.provider_dependent, 1);
assert.equal(providerHold.items.find((row) => row.id === "search_console")?.state, "hold");

const staleGbp = structuredClone(baseReport);
staleGbp.providers.google_business_profile = {
  classification: "owner_action",
  evidence_state: "stale_observed_snapshot",
  action: "Refresh Google Business Profile evidence."
};
const ownerHold = buildLocalAcquisitionEvidenceClosure(staleGbp);
assert.equal(ownerHold.status, "hold");
assert.equal(ownerHold.counts.owner_action, 1);

const unavailableFirstParty = structuredClone(baseReport);
unavailableFirstParty.first_party = {
  classification: "unavailable",
  evidence_state: "unavailable",
  reason: "Analytics unavailable."
};
const unavailableHold = buildLocalAcquisitionEvidenceClosure(unavailableFirstParty);
assert.equal(unavailableHold.status, "hold");
assert.equal(unavailableHold.counts.unavailable, 1);

console.log("LOCAL ACQUISITION EVIDENCE CLOSURE TEST: PASS");
