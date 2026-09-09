from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def text(path: str) -> str:
    target = ROOT / path
    assert target.exists(), f"missing {path}"
    return target.read_text(encoding="utf-8")


review_dispatch = text("functions/api/_lib/review-request-dispatch.js")
notification_hooks = text("functions/api/_lib/notification-hooks.js")
review_queue = text("functions/api/admin/review_request_queue_safe.js")
processor = text("functions/api/notifications_process.js")
tests = text("scripts/build364_review_request_dispatch_test.mjs")

# Completed-job review invitations use their own authority rather than the active-job live-alert gate.
assert "queueReviewRequestInvitation" in review_queue
assert "queueCustomerLiveAlert" not in review_queue
assert 'REVIEW_REQUEST_EVENT_TYPE = "review_request_invitation"' in review_dispatch
assert 'source: "review_request_queue"' in review_dispatch
assert "review_request_id: request.id" in review_dispatch

# Exactly one selected notification channel is queued and its real review send_after becomes next_attempt_at.
for token in [
    "queueNotificationEvent",
    "SUPPORTED_CHANNELS",
    "notification_opt_in",
    "hasActivePushSubscription",
    "next_attempt_at: request.send_after || null"
]:
    assert token in review_dispatch, f"missing review invitation queue authority: {token}"
assert "next_attempt_at = null" in notification_hooks
assert "next_attempt_at: next_attempt_at || new Date().toISOString()" in notification_hooks

# Dispatch re-checks the review lifecycle before any provider call.
assert "loadReviewRequestDispatchGate" in processor
assert processor.index("loadReviewRequestDispatchGate") < processor.index("dispatchNotificationThroughProvider(env, item)")
for token in [
    'status: "cancelled"',
    'status: "deferred"',
    'reason: "review_request_not_due"'
]:
    assert token in processor, f"missing stale/delayed dispatch protection: {token}"

# Provider success creates delivery evidence first; review lifecycle reconciliation happens only afterward.
success_pos = processor.index("if (dispatch.ok)")
sent_pos = processor.index('status: "sent"', success_pos)
sent_at_pos = processor.index("sent_at: deliveredAt", success_pos)
reconcile_pos = processor.index("reconcileReviewRequestSent", success_pos)
assert success_pos < sent_pos < reconcile_pos
assert success_pos < sent_at_pos < reconcile_pos
assert "reconcileReviewRequestSent" in review_dispatch
assert "status=in.(queued,pending,scheduled,ready)&sent_at=is.null" in review_dispatch
assert 'body: JSON.stringify({ status: "sent", sent_at: deliveredAt, updated_at: deliveredAt })' in review_dispatch

# Failures continue to retry without fabricating review delivery evidence.
failure_pos = processor.index("} else {", success_pos)
assert processor.index('status: "failed"', failure_pos) > failure_pos
assert "nextAttemptAt" in processor[failure_pos:]

# Regression cases cover due time, terminal cancellation/suppression, sent replay, invalid scheduling, and aliases.
for token in [
    "due queued review request",
    "future invitation",
    "Terminal or blocked",
    "Existing delivery evidence",
    "Invalid or unknown",
    "dedicated review invitation event type",
    "Historical active aliases"
]:
    assert token in tests, f"missing Build 364 regression case: {token}"

print("Build 364 review request dispatch authority: PASS")
