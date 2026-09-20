// Build 457 — Recovery Evidence Closure & Drill Readiness.
// Read-only convergence over retained Build 437/447 recovery evidence.
// No restore, rollback, DNS/secret/R2/provider mutation or permanent polling occurs here.

const REQUIRED_IDS = ["backup_artifact", "retention_location", "recovery_drill"];

export function buildRecoveryEvidenceClosureDrillReadiness({
  closure = {},
  review = {},
  source_available = true,
  generated_at = new Date().toISOString()
} = {}) {
  const closureRows = Array.isArray(closure?.required) ? closure.required : [];
  const reviewRows = Array.isArray(review?.rows) ? review.rows : [];
  const overallSourceAvailable = source_available === true;

  const rows = REQUIRED_IDS.map((id) => {
    const closureRow = closureRows.find((item) => item?.id === id) || {};
    const reviewRow = reviewRows.find((item) => item?.id === id) || {};
    const sourceAvailable = overallSourceAvailable && closureRow?.status !== "unavailable";
    const evidenceAt = reviewRow?.observed_at || closureRow?.observed_at || null;
    const freshness = sourceAvailable
      ? String(reviewRow?.freshness || (evidenceAt ? "unknown" : "missing"))
      : "unavailable";
    const dated = Boolean(evidenceAt);
    return {
      id,
      title: closureRow?.title || reviewRow?.title || id,
      source_available: sourceAvailable,
      status: closureRow?.status || (sourceAvailable ? "owner_action" : "unavailable"),
      classification: closureRow?.classification || (sourceAvailable ? "owner_action" : "unavailable"),
      observed_at: evidenceAt,
      dated,
      age_days: Number.isFinite(reviewRow?.evidence_age_days)
        ? reviewRow.evidence_age_days
        : (Number.isFinite(closureRow?.age_days) ? closureRow.age_days : null),
      freshness,
      detail: String(closureRow?.detail || "").trim() || "Required retained recovery evidence is not currently attributable."
    };
  });

  const unavailableCount = rows.filter((row) => !row.source_available).length;
  const datedCount = rows.filter((row) => row.dated).length;
  const missingCount = rows.filter((row) => row.source_available && !row.dated).length;
  const currentCount = rows.filter((row) => row.freshness === "current").length;
  const agingCount = rows.filter((row) => row.freshness === "aging").length;
  const staleCount = rows.filter((row) => row.freshness === "stale").length;

  const retainedCandidate = Boolean(
    closure?.closure_candidate === true &&
    review?.closure_candidate === true &&
    unavailableCount === 0 &&
    missingCount === 0 &&
    datedCount === rows.length
  );

  let status = "not_ready_owner_action";
  if (unavailableCount > 0) status = "not_ready_unavailable_source";
  else if (!retainedCandidate) status = "not_ready_owner_action";
  else if (staleCount > 0) status = "stale_revalidation_required";
  else if (agingCount > 0) status = "aging_review_required";
  else status = "operator_review_ready";

  const drill = rows.find((row) => row.id === "recovery_drill") || {};
  const drillStatus = !drill.source_available ? "unavailable"
    : !drill.dated ? "owner_action"
    : drill.freshness === "stale" ? "stale_revalidation_required"
    : drill.freshness === "aging" ? "aging_review_required"
    : "bounded_drill_ready";

  return {
    generated_at,
    authority: "recovery_evidence_closure_drill_readiness",
    status,
    source_availability: {
      required_count: rows.length,
      available_count: rows.length - unavailableCount,
      unavailable_count: unavailableCount,
      all_required_sources_available: unavailableCount === 0
    },
    evidence_freshness: {
      dated_count: datedCount,
      current_count: currentCount,
      aging_count: agingCount,
      stale_count: staleCount,
      missing_count: missingCount
    },
    closure_readiness: {
      retained_closure_candidate: retainedCandidate,
      status,
      operator_review_required: true,
      canonical_hold_mutated: false,
      detail: detailFor(status)
    },
    drill_readiness: {
      status: drillStatus,
      observed_at: drill.observed_at || null,
      age_days: drill.age_days ?? null,
      freshness: drill.freshness || (drill.source_available ? "missing" : "unavailable"),
      real_production_restore_authorized: false
    },
    rows,
    canonical_hold: {
      area: "Recovery / backup evidence",
      classification: unavailableCount > 0 ? "unavailable" : "owner_action",
      retain_hold: true,
      operator_review_required: true,
      backlog_mutated: false
    },
    truth_boundary: {
      production_restore_performed: false,
      rollback_performed: false,
      dns_mutation_performed: false,
      secret_rotation_performed: false,
      destructive_r2_performed: false,
      provider_recovery_performed: false,
      schema_mutation_performed: false,
      business_data_mutation_performed: false,
      export_generation_performed: false,
      canonical_hold_mutated: false,
      permanent_polling: false
    }
  };
}

function detailFor(status) {
  if (status === "operator_review_ready") return "All required recovery evidence is dated and current; explicit operator review is still required before HOLD narrowing.";
  if (status === "aging_review_required") return "All required recovery evidence is dated, but at least one item is aging and requires review before HOLD narrowing.";
  if (status === "stale_revalidation_required") return "All required recovery evidence is dated, but at least one item is stale and requires revalidation before HOLD narrowing.";
  if (status === "not_ready_unavailable_source") return "The authorized retained recovery evidence source is unavailable; retain the canonical HOLD.";
  return "Required backup, retention or bounded-drill evidence is missing or undated; retain the canonical HOLD.";
}
