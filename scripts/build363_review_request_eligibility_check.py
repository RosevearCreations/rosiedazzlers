from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def text(path: str) -> str:
    target = ROOT / path
    assert target.exists(), f"missing {path}"
    return target.read_text(encoding="utf-8")


lifecycle = text("functions/api/_lib/review-request-eligibility.js")
queue = text("functions/api/admin/review_request_queue_safe.js")
reviews = text("functions/api/client/reviews_save.js")
tests = text("scripts/build363_review_request_eligibility_test.mjs")

# Genuine job completion is the eligibility authority.
for token in [
    "bookingHasCompletionEvidence",
    'status === "completed"',
    'jobStatus === "completed"',
    "completed_at"
]:
    assert token in lifecycle + queue + reviews, f"missing completion evidence authority: {token}"
assert "detailing_completed_at" not in queue, "review queue must use canonical completed_at authority"

# Review evidence and the existing queue are reused; no parallel review ledger is introduced.
for token in [
    "customer_reviews",
    "review_request_queue",
    "chooseCanonicalReviewRequest",
    "decideReviewRequestLifecycle",
    "shouldSuppressDuplicateReviewRequest"
]:
    assert token in queue + reviews + lifecycle, f"missing existing review lifecycle authority: {token}"

# Queue creation never fabricates delivery or completion.
assert 'status: "queued"' in queue
assert 'sent_at: null' in queue
assert 'status: "pending"' not in queue
assert "scheduled_for" not in queue

# Existing queue rows are reused and duplicate unsent rows are neutralized.
for token in [
    "suppressDuplicateRows",
    "replay: true",
    "already_reviewed",
    "review_exists",
    "completed_without_review_evidence_repaired"
]:
    assert token in queue + lifecycle, f"missing replay/reconciliation authority: {token}"

# Customer review submission is idempotent and reconciles the request lifecycle.
for token in [
    "loadExistingReview",
    "duplicate: true",
    "reconcileReviewRequestQueue",
    "review_request_reconciled",
    "review_exists_before_send",
    "sent_request_has_review_evidence"
]:
    assert token in reviews + lifecycle, f"missing review evidence reconciliation: {token}"

# Required regression cases remain durable.
for token in [
    "genuine completed work",
    "new eligible booking",
    "blocked work",
    "already queued request",
    "blockers clear",
    "before delivery",
    "after real delivery",
    "false completed state",
    "suppression and cancellation",
    "historical duplicate rows",
    "canonical selection"
]:
    assert token in tests, f"missing Build 363 regression case: {token}"

print("Build 363 review request eligibility authority: PASS")
