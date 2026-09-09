import assert from 'node:assert/strict';
import {
  bookingHasCompletionEvidence,
  chooseCanonicalReviewRequest,
  decideReviewRequestLifecycle,
  shouldSuppressDuplicateReviewRequest
} from '../functions/api/_lib/review-request-eligibility.js';

const completedBooking = {
  status: 'completed',
  job_status: 'completed',
  completed_at: '2026-09-09T18:00:00.000Z'
};

// 1. genuine completed work requires both completion states plus completion timestamp.
assert.equal(bookingHasCompletionEvidence(completedBooking), true);
assert.equal(bookingHasCompletionEvidence({ ...completedBooking, status: 'confirmed' }), false);
assert.equal(bookingHasCompletionEvidence({ ...completedBooking, job_status: 'in_progress' }), false);
assert.equal(bookingHasCompletionEvidence({ ...completedBooking, completed_at: null }), false);

// 2. a new eligible booking creates exactly one queued lifecycle.
{
  const result = decideReviewRequestLifecycle({ request: null, hasReview: false, blocked: false });
  assert.deepEqual(result, { action: 'create', status: 'queued', reason: 'eligible' });
}

// 3. blocked work stays blocked rather than looking sent or complete.
{
  const result = decideReviewRequestLifecycle({ request: null, hasReview: false, blocked: true });
  assert.equal(result.status, 'blocked');
  assert.equal(result.action, 'create');
}

// 4. replay of an already queued request is idempotent.
{
  const result = decideReviewRequestLifecycle({ request: { status: 'queued', sent_at: null }, hasReview: false, blocked: false });
  assert.equal(result.status, 'queued');
  assert.equal(result.action, 'preserve');
}

// 5. a previously blocked request reuses the same lifecycle after blockers clear.
{
  const result = decideReviewRequestLifecycle({ request: { status: 'blocked', sent_at: null }, hasReview: false, blocked: false });
  assert.equal(result.status, 'queued');
  assert.equal(result.action, 'update');
}

// 6. review evidence before delivery suppresses the unsent invitation.
{
  const result = decideReviewRequestLifecycle({ request: { status: 'queued', sent_at: null }, hasReview: true, blocked: false });
  assert.equal(result.status, 'suppressed');
  assert.equal(result.reason, 'review_exists_before_send');
}

// 7. review evidence after real delivery completes the sent lifecycle.
{
  const result = decideReviewRequestLifecycle({ request: { status: 'sent', sent_at: '2026-09-09T19:00:00.000Z' }, hasReview: true, blocked: false });
  assert.equal(result.status, 'completed');
  assert.equal(result.reason, 'sent_request_has_review_evidence');
}

// 8. a false completed state without review evidence is repaired instead of trusted.
{
  const unsent = decideReviewRequestLifecycle({ request: { status: 'completed', sent_at: null }, hasReview: false, blocked: false });
  assert.equal(unsent.status, 'queued');
  assert.equal(unsent.reason, 'completed_without_review_evidence_repaired');

  const delivered = decideReviewRequestLifecycle({ request: { status: 'completed', sent_at: '2026-09-09T19:00:00.000Z' }, hasReview: false, blocked: false });
  assert.equal(delivered.status, 'sent');
}

// 9. suppression and cancellation are terminal and never auto-reactivated.
for (const status of ['suppressed', 'cancelled']) {
  const result = decideReviewRequestLifecycle({ request: { status, sent_at: null }, hasReview: false, blocked: false });
  assert.equal(result.status, status);
  assert.equal(result.action, 'preserve');
}

// 10. historical duplicate rows are neutralized only when they are unsent.
assert.equal(shouldSuppressDuplicateReviewRequest({ status: 'queued', sent_at: null }), true);
assert.equal(shouldSuppressDuplicateReviewRequest({ status: 'blocked', sent_at: null }), true);
assert.equal(shouldSuppressDuplicateReviewRequest({ status: 'sent', sent_at: '2026-09-09T19:00:00.000Z' }), false);
assert.equal(shouldSuppressDuplicateReviewRequest({ status: 'cancelled', sent_at: null }), false);

// 11. canonical selection prefers a lifecycle with delivery evidence.
{
  const rows = [
    { id: 'queued-row', status: 'queued', sent_at: null },
    { id: 'sent-row', status: 'sent', sent_at: '2026-09-09T19:00:00.000Z' }
  ];
  assert.equal(chooseCanonicalReviewRequest(rows).id, 'sent-row');
}

console.log('Build 363 review request eligibility regression cases: PASS');
