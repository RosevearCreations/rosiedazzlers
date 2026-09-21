// Build 466 — Provider Outcome Review & HOLD Decision Readiness.
// Read-only convergence over retained provider evidence.

const REQUIRED_IDS = ["stripe_payment", "paypal_payment", "refund", "delivery"];

export function buildProviderOutcomeReviewHoldDecisionReadiness({
  outcome = {},
  reconciliation = {},
  availability_review = {},
  generated_at = new Date().toISOString()
} = {}) {
  const reviewRows = Array.isArray(availability_review?.rows) ? availability_review.rows : [];
  const reconciliationRows = Array.isArray(reconciliation?.rows) ? reconciliation.rows : [];
  const outcomeRows = Array.isArray(outcome?.rows) ? outcome.rows : [];

  const rows = REQUIRED_IDS.map((id) => {
    const reviewRow = reviewRows.find((item) => item?.id === id) || {};
    const reconciliationRow = reconciliationRows.find((item) => item?.id === id) || {};
    const outcomeRow = outcomeRows.find((item) => item?.id === id) || {};
    const sourceAvailable = reviewRow?.source_available === true || (
      reviewRow?.source_available == null && reconciliationRow?.source_available === true
    );
    const evidenceAt = reviewRow?.evidence_at || reconciliationRow?.evidence_at || outcomeRow?.evidence_at || null;
    const freshness = !sourceAvailable
      ? "unavailable"
      : String(reviewRow?.freshness || reconciliationRow?.freshness || (evidenceAt ? "unknown" : "missing"));
    const dated = Boolean(evidenceAt);
    return {
      id,
      title: reviewRow?.title || reconciliationRow?.title || outcomeRow?.title || id,
      source: reviewRow?.source || reconciliationRow?.source || "retained provider evidence",
      source_available: sourceAvailable,
      evidence_at: evidenceAt,
      age_days: Number.isFinite(reviewRow?.age_days)
        ? reviewRow.age_days
        : (Number.isFinite(reconciliationRow?.age_days) ? reconciliationRow.age_days : null),
      freshness,
      dated,
      outcome_status: outcomeRow?.status || reconciliationRow?.reconciliation_status || "provider_dependent",
      decision_blocker: blockerFor({ sourceAvailable, dated, freshness })
    };
  });

  const unavailableCount = rows.filter((row) => !row.source_available).length;
  const missingCount = rows.filter((row) => row.source_available && (!row.dated || ["missing", "undated", "unknown"].includes(row.freshness))).length;
  const currentCount = rows.filter((row) => row.freshness === "current").length;
  const agingCount = rows.filter((row) => row.freshness === "aging").length;
  const staleCount = rows.filter((row) => row.freshness === "stale").length;
  const blockerIds = rows.filter((row) => row.decision_blocker).map((row) => row.id);

  const retainedCandidate = Boolean(
    availability_review?.closure_candidate_review?.retained_closure_candidate === true &&
    outcome?.status === "closure_candidate" &&
    unavailableCount === 0 &&
    missingCount === 0
  );

  let status = "retain_hold_missing_evidence";
  if (unavailableCount > 0) status = "retain_hold_unavailable_source";
  else if (!retainedCandidate || missingCount > 0) status = "retain_hold_missing_evidence";
  else if (staleCount > 0) status = "revalidate_before_hold_decision";
  else if (agingCount > 0) status = "aging_evidence_review_required";
  else if (currentCount === rows.length) status = "operator_hold_decision_ready";

  const narrowingEligible = status === "operator_hold_decision_ready";

  return {
    generated_at,
    authority: "provider_outcome_review_hold_decision_readiness",
    status,
    decision_package: {
      status,
      operator_review_required: true,
      default_if_no_operator_action: "retain_hold",
      narrowing_review_eligible: narrowingEligible,
      permitted_operator_actions: narrowingEligible
        ? ["retain_hold", "narrow_hold_with_dated_provider_evidence"]
        : ["retain_hold"],
      blocker_ids: blockerIds,
      retained_closure_candidate: retainedCandidate,
      canonical_hold_mutated: false,
      detail: detailFor(status)
    },
    evidence_summary: {
      required_count: rows.length,
      source_available_count: rows.length - unavailableCount,
      unavailable_count: unavailableCount,
      dated_count: rows.filter((row) => row.dated).length,
      current_count: currentCount,
      aging_count: agingCount,
      stale_count: staleCount,
      missing_or_undated_count: missingCount,
      blocker_count: blockerIds.length
    },
    rows,
    canonical_hold: {
      area: "Provider outcomes & communications",
      classification: unavailableCount > 0 ? "unavailable" : "provider_dependent",
      retain_hold: true,
      operator_review_required: true,
      narrowing_review_eligible: narrowingEligible,
      backlog_mutated: false
    },
    truth_boundary: {
      provider_contact_performed: false,
      payment_or_refund_mutation_performed: false,
      notification_send_performed: false,
      webhook_replay_performed: false,
      provider_configuration_mutated: false,
      canonical_hold_mutated: false,
      permanent_polling: false
    }
  };
}

function blockerFor({ sourceAvailable, dated, freshness }) {
  if (!sourceAvailable) return "source_unavailable";
  if (!dated || freshness === "missing" || freshness === "undated" || freshness === "unknown") return "evidence_missing_or_undated";
  if (freshness === "stale") return "stale_revalidation_required";
  if (freshness === "aging") return "aging_review_required";
  if (freshness !== "current") return "freshness_unresolved";
  return null;
}

function detailFor(status) {
  if (status === "operator_hold_decision_ready") return "All four required provider evidence classes are source-available, dated and current. An operator may review whether the canonical HOLD should remain or be narrowed; no change occurs automatically.";
  if (status === "aging_evidence_review_required") return "All required provider evidence is dated, but at least one class is aging. Retain the HOLD until the operator reviews evidence age.";
  if (status === "revalidate_before_hold_decision") return "At least one required provider evidence class is stale. Retain the HOLD until provider evidence is revalidated.";
  if (status === "retain_hold_unavailable_source") return "At least one authorized provider evidence source is unavailable. Retain the canonical HOLD.";
  return "Required provider evidence is missing, undated or not a retained closure candidate. Retain the canonical HOLD.";
}
