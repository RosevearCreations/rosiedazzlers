import assert from "node:assert/strict";
import {buildStaffMobileClosureEvidenceIntegrityReview as review} from "../functions/api/_lib/staff-mobile-closure-evidence-integrity-review.js";
const original={closure_outcome_build:523,closure_outcome_authority:"staff_mobile_remediation_closure_outcome_continuity",source_recognized:true,rows:[{evidence_id:"sample",status:"closure_outcome_observed",retained_closure_readiness:{expected_readiness_trace_key:"trace",latest_evidence_observed_at:"2026-10-07T10:00:00Z",matching_row_count:1,attributable_row_count:1,materially_like_for_like_row_count:1,unconfounded_like_for_like_row_count:1,context:{measure_definition:"time",owning_workflow_scope:"staff",role_scope:"detailer",device_browser_context:"mobile safari",window_or_sample_definition:"one week"}},owner_closure_outcome:{outcome:"close",readiness_trace_key:"trace",trace_matches:true,attributable:true,outcome_reference:"owner-review",reviewed_at:"2026-10-07T12:00:00Z",review_complete:true,context_reviewed:true,material_confounders_reviewed:true,weather_site_context_reviewed:true}}]};
const row=original.rows[0], f={staff_mobile_closure_freshness_build:533,staff_mobile_closure_freshness_authority:"staff_mobile_closure_evidence_freshness_review",source_recognized:true,generated_at:"2026-10-08T12:00:00Z",rows:[{evidence_id:"sample",freshness_state:"closure_outcome_current",comparison_context:{...row.retained_closure_readiness.context,matching_row_count:1,attributable_row_count:1,materially_like_for_like_row_count:1,unconfounded_like_for_like_row_count:1},freshness:{trace_current:true,owner_outcome_reference:"owner-review",owner_reviewed_at:"2026-10-07T12:00:00Z",latest_retained_evidence_observed_at:"2026-10-07T10:00:00Z",owner_outcome:"close",review_complete:true,context_reviewed:true,material_confounders_reviewed:true,weather_site_context_reviewed:true,retained_evidence_current:true,owner_review_current:true},outcome_boundary:{current:true,review_required:false}}]};
function run(a=f,b=original){return review({closure_freshness:a,closure_outcome_continuity:b,generated_at:"2026-10-08T12:00:00Z"});}
assert.equal(run().status,"staff_mobile_closure_integrity_current");
const wrong=structuredClone(f);wrong.rows[0].comparison_context.role_scope="admin";
assert.equal(run(wrong).status,"workflow_role_device_sample_identity_review_required");
const stale=structuredClone(f);stale.generated_at="2026-10-01T12:00:00Z";
assert.equal(run(stale).status,"retained_closure_freshness_review_required");
const duplicate=structuredClone(f);duplicate.rows.push(duplicate.rows[0]);
assert.equal(run(duplicate).status,"staff_mobile_row_set_identity_review_required");
const bad=structuredClone(f);bad.rows[0].freshness.weather_site_context_reviewed=false;
assert.equal(run(bad).status,"weather_confounder_owner_review_required");
assert.equal(run({}).status,"staff_mobile_integrity_source_unavailable");
assert.equal(run().truth_boundary.canonical_hold_mutated,false);
console.log("BUILD 543 STAFF & MOBILE CLOSURE INTEGRITY: PASS");
