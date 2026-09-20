// Build 456 — Provider Evidence Closure & Availability Review.
// Composes retained Build 436/446 read-only evidence into an explicit availability + closure-candidate review.
// No provider contact, transaction, message send, backlog mutation or permanent polling occurs here.

const REQUIRED_IDS = ["stripe_payment", "paypal_payment", "refund", "delivery"];

export function buildProviderEvidenceClosureAvailabilityReview({
  reconciliation = {},
  outcome = {},
  generated_at = new Date().toISOString()
} = {}) {
  const sourceRows = Array.isArray(reconciliation?.rows) ? reconciliation.rows : [];
  const rows = REQUIRED_IDS.map((id) => {
    const row = sourceRows.find((item) => item?.id === id) || {};
    const sourceAvailable = row?.source_available === true;
    const freshness = String(row?.freshness || (sourceAvailable ? "missing" : "unavailable"));
    const dated = Boolean(row?.evidence_at);
    return {
      id,
      title: row?.title || id,
      source: row?.source || "retained provider evidence",
      source_available: sourceAvailable,
      evidence_at: row?.evidence_at || null,
      age_days: Number.isFinite(row?.age_days) ? row.age_days : null,
      freshness,
      dated,
      source_gap: row?.source_gap !== false,
      reconciliation_status: row?.reconciliation_status || (sourceAvailable ? "provider_dependent" : "unavailable")
    };
  });

  const availableCount = rows.filter((row) => row.source_available).length;
  const unavailableCount = rows.length - availableCount;
  const datedCount = rows.filter((row) => row.dated).length;
  const currentCount = rows.filter((row) => row.freshness === "current").length;
  const agingCount = rows.filter((row) => row.freshness === "aging").length;
  const staleCount = rows.filter((row) => row.freshness === "stale").length;
  const missingCount = rows.filter((row) => ["missing", "undated"].includes(row.freshness)).length;
  const sourceGapCount = rows.filter((row) => row.source_gap).length;

  const retainedCandidate = Boolean(
    reconciliation?.canonical_hold?.closure_candidate === true ||
    (outcome?.status === "closure_candidate" && sourceGapCount === 0)
  );

  let reviewStatus = "not_candidate_missing_evidence";
  if (unavailableCount > 0) reviewStatus = "not_candidate_unavailable_source";
  else if (!retainedCandidate || sourceGapCount > 0 || datedCount < rows.length) reviewStatus = "not_candidate_missing_evidence";
  else if (staleCount > 0) reviewStatus = "stale_revalidation_required";
  else if (agingCount > 0) reviewStatus = "aging_review_required";
  else reviewStatus = "operator_review_ready";

  return {
    generated_at,
    authority: "provider_evidence_closure_availability_review",
    status: reviewStatus,
    source_availability: {
      required_count: rows.length,
      available_count: availableCount,
      unavailable_count: unavailableCount,
      all_required_sources_available: unavailableCount === 0,
      unavailable_ids: rows.filter((row) => !row.source_available).map((row) => row.id)
    },
    evidence_freshness: {
      dated_count: datedCount,
      current_count: currentCount,
      aging_count: agingCount,
      stale_count: staleCount,
      missing_or_undated_count: missingCount,
      source_gap_count: sourceGapCount
    },
    closure_candidate_review: {
      retained_closure_candidate: retainedCandidate,
      status: reviewStatus,
      operator_review_required: true,
      canonical_hold_mutated: false,
      detail: reviewDetail(reviewStatus)
    },
    rows,
    canonical_hold: {
      area: "Provider outcomes & communications",
      classification: unavailableCount > 0 ? "unavailable" : "provider_dependent",
      retain_hold: true,
      operator_review_required: true,
      backlog_mutated: false
    },
    truth_boundary: {
      provider_contact_performed: false,
      payment_or_refund_mutation_performed: false,
      notification_send_performed: false,
      webhook_replay_performed: false,
      provider_configuration_mutated: false,
      secret_mutated: false,
      customer_mutated: false,
      canonical_hold_mutated: false,
      permanent_polling: false
    }
  };
}

function reviewDetail(status) {
  if (status === "operator_review_ready") return "All required provider evidence classes are dated and current; explicit operator review is still required before any HOLD narrowing.";
  if (status === "aging_review_required") return "All required evidence is dated, but at least one item is aging and should be reviewed before any HOLD narrowing.";
  if (status === "stale_revalidation_required") return "All required evidence is dated, but at least one item is stale and requires revalidation before any HOLD narrowing.";
  if (status === "not_candidate_unavailable_source") return "At least one authorized provider evidence source is unavailable; retain the canonical HOLD.";
  return "Required provider evidence is missing or undated; retain the canonical HOLD.";
}
