// Build 476 — Provider HOLD Decision Traceability & Closure Review.
// Read-only traceability over retained Build 436/446/456/466 provider evidence.
// No provider transaction, message send, canonical-HOLD mutation, storage mutation or permanent polling.

const REQUIRED_IDS = ["stripe_payment", "paypal_payment", "refund", "delivery"];
const ALLOWED_DECISIONS = ["retain_hold", "narrow_hold_with_dated_provider_evidence"];

export function buildProviderHoldDecisionTraceabilityClosureReview({
  decision_readiness = {},
  availability_review = {},
  reconciliation = {},
  operator_review = null,
  generated_at = new Date().toISOString()
} = {}) {
  const decisionRows = Array.isArray(decision_readiness?.rows) ? decision_readiness.rows : [];
  const availabilityRows = Array.isArray(availability_review?.rows) ? availability_review.rows : [];
  const reconciliationRows = Array.isArray(reconciliation?.rows) ? reconciliation.rows : [];

  const rows = REQUIRED_IDS.map((id) => {
    const decisionRow = decisionRows.find((item) => item?.id === id) || {};
    const availabilityRow = availabilityRows.find((item) => item?.id === id) || {};
    const reconciliationRow = reconciliationRows.find((item) => item?.id === id) || {};
    const sourceAvailable =
      decisionRow?.source_available === true ||
      (decisionRow?.source_available == null && availabilityRow?.source_available === true) ||
      (decisionRow?.source_available == null && availabilityRow?.source_available == null && reconciliationRow?.source_available === true);
    const evidenceAt = decisionRow?.evidence_at || availabilityRow?.evidence_at || reconciliationRow?.evidence_at || null;
    const parsedAt = parseTimestamp(evidenceAt);
    const freshness = !sourceAvailable
      ? "unavailable"
      : String(decisionRow?.freshness || availabilityRow?.freshness || reconciliationRow?.freshness || (evidenceAt ? "unknown" : "missing"));
    return {
      id,
      title: decisionRow?.title || availabilityRow?.title || reconciliationRow?.title || id,
      source: decisionRow?.source || availabilityRow?.source || reconciliationRow?.source || "retained provider evidence",
      source_available: sourceAvailable,
      evidence_at: evidenceAt,
      evidence_timestamp_valid: parsedAt != null,
      age_days: Number.isFinite(decisionRow?.age_days)
        ? decisionRow.age_days
        : (Number.isFinite(availabilityRow?.age_days)
          ? availabilityRow.age_days
          : (Number.isFinite(reconciliationRow?.age_days) ? reconciliationRow.age_days : null)),
      freshness,
      outcome_status: decisionRow?.outcome_status || reconciliationRow?.reconciliation_status || "provider_dependent"
    };
  });

  const unavailableIds = rows.filter((row) => !row.source_available).map((row) => row.id);
  const missingOrInvalidIds = rows.filter((row) => row.source_available && !row.evidence_timestamp_valid).map((row) => row.id);
  const staleIds = rows.filter((row) => row.freshness === "stale").map((row) => row.id);
  const agingIds = rows.filter((row) => row.freshness === "aging").map((row) => row.id);
  const currentIds = rows.filter((row) => row.freshness === "current" && row.evidence_timestamp_valid).map((row) => row.id);
  const evidenceDates = rows.map((row) => parseTimestamp(row.evidence_at)).filter((value) => value != null);
  const oldestEvidenceAt = evidenceDates.length ? new Date(Math.min(...evidenceDates)).toISOString() : null;
  const latestEvidenceAt = evidenceDates.length ? new Date(Math.max(...evidenceDates)).toISOString() : null;

  let continuityStatus = "incomplete_missing_or_invalid_date";
  if (unavailableIds.length) continuityStatus = "unavailable_source";
  else if (missingOrInvalidIds.length) continuityStatus = "incomplete_missing_or_invalid_date";
  else if (staleIds.length) continuityStatus = "revalidation_required";
  else if (agingIds.length) continuityStatus = "aging_review_required";
  else if (currentIds.length === rows.length) continuityStatus = "current_complete";

  const evidenceTraceKey = traceKey(rows);
  const providerDecisionReady = Boolean(
    decision_readiness?.status === "operator_hold_decision_ready" &&
    decision_readiness?.decision_package?.narrowing_review_eligible === true &&
    decision_readiness?.decision_package?.retained_closure_candidate === true
  );

  const review = normalizeOperatorReview(operator_review, evidenceTraceKey, providerDecisionReady);
  const closurePrerequisites = {
    provider_decision_package_ready: providerDecisionReady,
    evidence_date_continuity_complete: continuityStatus === "current_complete",
    operator_review_record_required: true,
    operator_review_record_present: review.present,
    operator_review_record_valid: review.valid,
    operator_review_trace_match: review.trace_match,
    canonical_hold_manual_update_required: true
  };

  let closureStatus = "retain_hold_provider_package_not_ready";
  if (unavailableIds.length) closureStatus = "blocked_source_unavailable";
  else if (continuityStatus !== "current_complete") closureStatus = "blocked_evidence_date_continuity";
  else if (!providerDecisionReady) closureStatus = "retain_hold_provider_package_not_ready";
  else if (!review.valid) closureStatus = "retain_hold_operator_review_required";
  else if (review.decision === "retain_hold") closureStatus = "review_complete_retain_hold";
  else if (review.decision === "narrow_hold_with_dated_provider_evidence") closureStatus = "closure_review_ready_for_manual_hold_update";

  return {
    generated_at,
    authority: "provider_hold_decision_traceability_closure_review",
    status: closureStatus,
    evidence_date_continuity: {
      status: continuityStatus,
      required_count: rows.length,
      source_available_count: rows.length - unavailableIds.length,
      valid_dated_count: rows.filter((row) => row.evidence_timestamp_valid).length,
      current_count: currentIds.length,
      aging_count: agingIds.length,
      stale_count: staleIds.length,
      unavailable_ids: unavailableIds,
      missing_or_invalid_date_ids: missingOrInvalidIds,
      aging_ids: agingIds,
      stale_ids: staleIds,
      oldest_evidence_at: oldestEvidenceAt,
      latest_evidence_at: latestEvidenceAt,
      evidence_trace_key: evidenceTraceKey
    },
    operator_review_traceability: {
      status: review.status,
      required_fields: ["reviewed_at", "reviewer_role", "decision", "evidence_trace_key"],
      allowed_decisions: ALLOWED_DECISIONS,
      expected_evidence_trace_key: evidenceTraceKey,
      review_present: review.present,
      review_valid: review.valid,
      trace_match: review.trace_match,
      reviewed_at: review.reviewed_at,
      reviewer_role: review.reviewer_role,
      decision: review.decision
    },
    closure_review: {
      status: closureStatus,
      prerequisites: closurePrerequisites,
      manual_hold_update_candidate: closureStatus === "closure_review_ready_for_manual_hold_update",
      canonical_hold_mutated: false,
      default_if_no_operator_action: "retain_hold",
      detail: closureDetail(closureStatus)
    },
    rows,
    canonical_hold: {
      area: "Provider outcomes & communications",
      classification: unavailableIds.length ? "unavailable" : "provider_dependent",
      retain_hold: true,
      operator_review_required: true,
      explicit_manual_update_required: true,
      backlog_mutated: false
    },
    truth_boundary: {
      provider_contact_performed: false,
      payment_or_refund_mutation_performed: false,
      notification_send_performed: false,
      webhook_replay_performed: false,
      provider_configuration_mutated: false,
      operator_review_record_persisted: false,
      canonical_hold_mutated: false,
      schema_or_storage_mutated: false,
      permanent_polling: false
    }
  };
}

function parseTimestamp(value) {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

function traceKey(rows) {
  return rows
    .map((row) => [row.id, row.evidence_at || "undated", row.freshness || "unknown", row.outcome_status || "provider_dependent"].join(":"))
    .join("|");
}

function normalizeOperatorReview(review, expectedTraceKey, providerDecisionReady) {
  const present = Boolean(review && typeof review === "object" && Object.keys(review).length);
  if (!present) {
    return { present:false, valid:false, trace_match:false, status:"operator_review_not_recorded", reviewed_at:null, reviewer_role:null, decision:null };
  }
  const reviewedAt = typeof review.reviewed_at === "string" ? review.reviewed_at : null;
  const reviewerRole = typeof review.reviewer_role === "string" && review.reviewer_role.trim() ? review.reviewer_role.trim() : null;
  const decision = typeof review.decision === "string" ? review.decision : null;
  const traceMatch = typeof review.evidence_trace_key === "string" && review.evidence_trace_key === expectedTraceKey;
  const dateValid = parseTimestamp(reviewedAt) != null;
  const decisionValid = ALLOWED_DECISIONS.includes(decision);
  const eligibilityValid = decision !== "narrow_hold_with_dated_provider_evidence" || providerDecisionReady;
  const valid = Boolean(dateValid && reviewerRole && decisionValid && traceMatch && eligibilityValid);
  let status = "operator_review_invalid";
  if (valid && decision === "retain_hold") status = "operator_review_recorded_retain_hold";
  else if (valid && decision === "narrow_hold_with_dated_provider_evidence") status = "operator_review_recorded_narrowing_candidate";
  else if (!traceMatch) status = "operator_review_trace_mismatch";
  else if (!eligibilityValid) status = "operator_review_not_currently_eligible";
  return { present:true, valid, trace_match:traceMatch, status, reviewed_at:reviewedAt, reviewer_role:reviewerRole, decision };
}

function closureDetail(status) {
  if (status === "closure_review_ready_for_manual_hold_update") return "Current provider evidence, evidence-date continuity and a matching explicit operator review record satisfy closure-review prerequisites. The canonical HOLD still requires a separate manual update.";
  if (status === "review_complete_retain_hold") return "The explicit operator review record elects to retain the provider HOLD.";
  if (status === "retain_hold_operator_review_required") return "Provider evidence is current and review-eligible, but no valid operator review record is traceable to this evidence snapshot. Retain the HOLD.";
  if (status === "blocked_evidence_date_continuity") return "Required provider evidence dates are missing, invalid, aging or stale. Retain the HOLD until date continuity is current.";
  if (status === "blocked_source_unavailable") return "At least one authorized provider evidence source is unavailable. Retain the HOLD.";
  return "The retained provider decision package is not eligible for closure review. Retain the HOLD.";
}
