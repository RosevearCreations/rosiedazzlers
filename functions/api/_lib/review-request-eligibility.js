const PRESERVED_TERMINAL_STATUSES = new Set(["cancelled", "suppressed"]);
const UNSENT_ACTIVE_STATUSES = new Set(["queued", "blocked", "pending", "scheduled", "ready"]);

export function normalizeReviewRequestStatus(value) {
  return String(value || "").trim().toLowerCase();
}

export function bookingHasCompletionEvidence(row) {
  if (!row) return false;
  const status = String(row.status || "").trim().toLowerCase();
  const jobStatus = String(row.job_status || "").trim().toLowerCase();
  return status === "completed" && jobStatus === "completed" && Boolean(row.completed_at);
}

export function chooseCanonicalReviewRequest(rows) {
  const list = Array.isArray(rows) ? rows.filter(Boolean) : [];
  if (!list.length) return null;

  const delivered = list.find((row) => {
    const status = normalizeReviewRequestStatus(row?.status);
    return status === "sent" || Boolean(row?.sent_at);
  });
  return delivered || list[0];
}

export function decideReviewRequestLifecycle({ request = null, hasReview = false, blocked = false } = {}) {
  if (!request) {
    if (hasReview) return { action: "none", status: "review_exists", reason: "review_already_exists" };
    return { action: "create", status: blocked ? "blocked" : "queued", reason: blocked ? "eligibility_blocked" : "eligible" };
  }

  const current = normalizeReviewRequestStatus(request.status);

  if (PRESERVED_TERMINAL_STATUSES.has(current)) {
    return { action: "preserve", status: current, reason: `terminal_${current}` };
  }

  if (hasReview) {
    const delivered = current === "sent" || Boolean(request.sent_at);
    if (delivered) {
      return {
        action: current === "completed" ? "preserve" : "update",
        status: "completed",
        reason: "sent_request_has_review_evidence"
      };
    }
    return { action: "update", status: "suppressed", reason: "review_exists_before_send" };
  }

  if (current === "sent" || Boolean(request.sent_at)) {
    return { action: current === "sent" ? "preserve" : "update", status: "sent", reason: "delivery_evidence_without_review" };
  }

  const desired = blocked ? "blocked" : "queued";
  if (current === desired) return { action: "preserve", status: desired, reason: blocked ? "still_blocked" : "already_queued" };

  if (current === "completed") {
    return { action: "update", status: desired, reason: "completed_without_review_evidence_repaired" };
  }

  if (UNSENT_ACTIVE_STATUSES.has(current) || !current) {
    return { action: "update", status: desired, reason: blocked ? "eligibility_blocked" : "eligibility_cleared" };
  }

  return { action: "preserve", status: current, reason: "unknown_state_preserved" };
}

export function shouldSuppressDuplicateReviewRequest(row) {
  const status = normalizeReviewRequestStatus(row?.status);
  if (PRESERVED_TERMINAL_STATUSES.has(status) || status === "sent" || Boolean(row?.sent_at)) return false;
  return UNSENT_ACTIVE_STATUSES.has(status) || status === "completed" || !status;
}
