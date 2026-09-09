import assert from 'node:assert/strict';
import {
  REVIEW_REQUEST_EVENT_TYPE,
  decideReviewRequestDispatch,
  reviewRequestIdFromNotification
} from '../functions/api/_lib/review-request-dispatch.js';

const now = Date.parse('2026-09-09T18:00:00.000Z');

// 1. A due queued review request is dispatchable.
assert.deepEqual(
  decideReviewRequestDispatch({ status: 'queued', sent_at: null, send_after: '2026-09-09T17:00:00.000Z' }, now),
  { dispatch: true, reason: 'ready' }
);

// 2. A future invitation remains queued for its real due time, including manual processor runs.
assert.deepEqual(
  decideReviewRequestDispatch({ status: 'queued', sent_at: null, send_after: '2026-09-09T20:00:00.000Z' }, now),
  { dispatch: false, reason: 'not_due', next_attempt_at: '2026-09-09T20:00:00.000Z' }
);

// 3. Terminal or blocked request states never dispatch stale notification events.
for (const status of ['blocked', 'cancelled', 'suppressed', 'completed']) {
  const result = decideReviewRequestDispatch({ status, sent_at: null, send_after: null }, now);
  assert.equal(result.dispatch, false, `${status} should not dispatch`);
  assert.equal(result.reason, `terminal_${status}`);
}

// 4. Existing delivery evidence prevents replay even if the row status drifted.
assert.deepEqual(
  decideReviewRequestDispatch({ status: 'queued', sent_at: '2026-09-09T17:30:00.000Z', send_after: null }, now),
  { dispatch: false, reason: 'already_sent' }
);
assert.deepEqual(
  decideReviewRequestDispatch({ status: 'sent', sent_at: null, send_after: null }, now),
  { dispatch: false, reason: 'already_sent' }
);

// 5. Invalid or unknown scheduling/state evidence fails closed.
assert.deepEqual(
  decideReviewRequestDispatch({ status: 'queued', sent_at: null, send_after: 'not-a-date' }, now),
  { dispatch: false, reason: 'invalid_send_after' }
);
assert.deepEqual(
  decideReviewRequestDispatch({ status: 'mystery', sent_at: null, send_after: null }, now),
  { dispatch: false, reason: 'unknown_state' }
);
assert.deepEqual(decideReviewRequestDispatch(null, now), { dispatch: false, reason: 'missing_review_request' });

// 6. Only the dedicated review invitation event type can claim a review-request lifecycle id.
const reviewEvent = {
  event_type: REVIEW_REQUEST_EVENT_TYPE,
  payload: { review_request_id: 'request-123' }
};
assert.equal(reviewRequestIdFromNotification(reviewEvent), 'request-123');
assert.equal(reviewRequestIdFromNotification({ ...reviewEvent, event_type: 'job_progress' }), null);
assert.equal(reviewRequestIdFromNotification({ event_type: REVIEW_REQUEST_EVENT_TYPE, payload: {} }), null);

// 7. Historical active aliases remain dispatchable, while delivery evidence still wins.
for (const status of ['pending', 'scheduled', 'ready']) {
  assert.equal(decideReviewRequestDispatch({ status, sent_at: null, send_after: null }, now).dispatch, true);
}

console.log('Build 364 review request dispatch regression cases: PASS');
