import assert from "node:assert/strict";
import { buildProviderEvidenceClosureAvailabilityReview } from "../functions/api/_lib/provider-evidence-closure-availability-review.js";

const allCurrent = {
  canonical_hold: { closure_candidate: true },
  rows: [
    { id:"stripe_payment", source_available:true, evidence_at:"2026-09-20T12:00:00Z", age_days:0, freshness:"current", source_gap:false },
    { id:"paypal_payment", source_available:true, evidence_at:"2026-09-19T12:00:00Z", age_days:1, freshness:"current", source_gap:false },
    { id:"refund", source_available:true, evidence_at:"2026-09-18T12:00:00Z", age_days:2, freshness:"current", source_gap:false },
    { id:"delivery", source_available:true, evidence_at:"2026-09-17T12:00:00Z", age_days:3, freshness:"current", source_gap:false }
  ]
};
const ready = buildProviderEvidenceClosureAvailabilityReview({ reconciliation:allCurrent, outcome:{status:"closure_candidate"}, generated_at:"2026-09-20T12:00:00Z" });
assert.equal(ready.source_availability.available_count,4);
assert.equal(ready.evidence_freshness.dated_count,4);
assert.equal(ready.closure_candidate_review.retained_closure_candidate,true);
assert.equal(ready.status,"operator_review_ready");
assert.equal(ready.canonical_hold.backlog_mutated,false);
assert.equal(ready.truth_boundary.provider_contact_performed,false);

const stale = structuredClone(allCurrent);
stale.rows[3].freshness="stale";
stale.rows[3].age_days=120;
const staleReview = buildProviderEvidenceClosureAvailabilityReview({ reconciliation:stale, outcome:{status:"closure_candidate"}, generated_at:"2026-09-20T12:00:00Z" });
assert.equal(staleReview.status,"stale_revalidation_required");

const unavailable = structuredClone(allCurrent);
unavailable.canonical_hold.closure_candidate=false;
unavailable.rows[2]={ id:"refund", source_available:false, evidence_at:null, age_days:null, freshness:"unavailable", source_gap:true, reconciliation_status:"unavailable" };
const unavailableReview = buildProviderEvidenceClosureAvailabilityReview({ reconciliation:unavailable, outcome:{status:"hold"}, generated_at:"2026-09-20T12:00:00Z" });
assert.equal(unavailableReview.source_availability.unavailable_count,1);
assert.equal(unavailableReview.status,"not_candidate_unavailable_source");
assert.equal(unavailableReview.canonical_hold.classification,"unavailable");

const missing = structuredClone(allCurrent);
missing.canonical_hold.closure_candidate=false;
missing.rows[1]={ id:"paypal_payment", source_available:true, evidence_at:null, age_days:null, freshness:"undated", source_gap:true, reconciliation_status:"observed_undated" };
const missingReview = buildProviderEvidenceClosureAvailabilityReview({ reconciliation:missing, outcome:{status:"hold"}, generated_at:"2026-09-20T12:00:00Z" });
assert.equal(missingReview.status,"not_candidate_missing_evidence");
assert.equal(missingReview.evidence_freshness.missing_or_undated_count,1);

console.log("PROVIDER EVIDENCE CLOSURE & AVAILABILITY REVIEW TEST: PASS");
