import assert from "node:assert/strict";
import { buildLocalAcquisitionContentProof } from "../functions/api/_lib/local-acquisition-content-proof.js";

const result = buildLocalAcquisitionContentProof({
  generated_at: "2026-09-19T14:00:00Z",
  window_days: 30,
  measurement: {
    providers: {
      search_console: { evidence_state: "observed_snapshot" },
      google_business_profile: { evidence_state: "stale_observed_snapshot" }
    }
  },
  page_rows: [
    { dimension_value: "/tillsonburg-auto-detailing", count: 2 },
    { dimension_value: "/ceramic-coating", count: 8 },
    { dimension_value: "/ceramic-coating", count: 4 }
  ],
  proof_items: [
    {
      town: "Tillsonburg",
      service: "Complete detail",
      publication_status: "published",
      proof_kind: "customer_work",
      consent_status: "customer_approved_public",
      before_url: "/before.jpg",
      after_url: "/after.jpg"
    },
    {
      town: "Tillsonburg",
      service: "Ceramic coating",
      publication_status: "published",
      proof_kind: "sample",
      consent_status: "sample",
      before_url: "/sample-before.jpg",
      after_url: "/sample-after.jpg"
    }
  ],
  tasks: [
    { status: "needed", town: "Tillsonburg", title: "Refresh Tillsonburg local proof" },
    { status: "completed", service: "Ceramic coating", title: "Old ceramic task" }
  ]
});

assert.equal(result.build, 431);
assert.equal(result.mode, "local_acquisition_content_proof");
assert.equal(result.evidence.search_console, "dated_observed");
assert.equal(result.evidence.google_business_profile, "stale_owner_action");
assert.equal(result.counts.genuine_public_proof_items, 1);

const tillsonburg = result.content_candidates.find((row) => row.path === "/tillsonburg-auto-detailing");
assert.equal(tillsonburg.observed_views_30d, 2);
assert.equal(tillsonburg.genuine_public_proof_count, 1);
assert.equal(tillsonburg.related_open_task_count, 1);
assert.ok(tillsonburg.reasons.includes("low_observed_page_views_in_window"));
assert.equal(tillsonburg.source_review.thin_copy_inferred, false);

const ceramic = result.content_candidates.find((row) => row.path === "/ceramic-coating");
assert.equal(ceramic.observed_views_30d, 12);
assert.equal(ceramic.genuine_public_proof_count, 0, "sample proof must not count as genuine public proof");
assert.ok(ceramic.reasons.includes("no_current_genuine_public_proof"));

assert.equal(result.truth_boundary.ranking_outcome_inferred, false);
assert.equal(result.truth_boundary.indexing_outcome_inferred, false);
assert.equal(result.truth_boundary.automatic_content_publishing_allowed, false);
assert.equal(result.truth_boundary.third_party_provider_mutation_allowed, false);
assert.equal(result.truth_boundary.schema_authority, false);

const unavailable = buildLocalAcquisitionContentProof({
  measurement: {},
  page_evidence_available: false,
  proof_evidence_available: false,
  tasks_evidence_available: false
});
assert.equal(unavailable.evidence.first_party_page_traffic, "unavailable");
assert.equal(unavailable.counts.pages_without_observed_views, null);
assert.equal(unavailable.counts.pages_without_genuine_proof, null);
assert.equal(unavailable.content_candidates[0].source_review.duplicate_copy_inferred, false);

console.log("LOCAL ACQUISITION & CONTENT PROOF TEST: PASS");
console.log(" - first-party page traffic is bounded and separate from provider outcomes");
console.log(" - sample/private proof does not become genuine local proof");
console.log(" - source-copy review starts as heuristic review, never a ranking assertion");
console.log(" - no publishing, outreach, provider, DNS, ad-spend or schema mutation is authorized");
