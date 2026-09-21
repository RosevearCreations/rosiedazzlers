// Build 467 — Recovery Evidence Validation & Drill Decision Readiness.
// Read-only decision support over retained Build 437/447/457 recovery evidence.
// No restore, rollback, drill execution, DNS/secret/R2/provider/schema/business mutation or permanent polling.

const REQUIRED_IDS = ["backup_artifact", "retention_location", "recovery_drill"];

export function buildRecoveryEvidenceValidationDrillDecisionReadiness({
  closure = {},
  review = {},
  readiness = {},
  source_available = true,
  generated_at = new Date().toISOString()
} = {}) {
  const closureRows = Array.isArray(closure?.required) ? closure.required : [];
  const reviewRows = Array.isArray(review?.rows) ? review.rows : [];
  const readinessRows = Array.isArray(readiness?.rows) ? readiness.rows : [];
  const overallSourceAvailable = source_available === true;

  const rows = REQUIRED_IDS.map((id) => {
    const closureRow = closureRows.find((item) => item?.id === id) || {};
    const reviewRow = reviewRows.find((item) => item?.id === id) || {};
    const readinessRow = readinessRows.find((item) => item?.id === id) || {};
    const sourceAvailable = overallSourceAvailable &&
      readinessRow?.source_available !== false &&
      closureRow?.status !== "unavailable";
    const observedAt = readinessRow?.observed_at || reviewRow?.observed_at || closureRow?.observed_at || null;
    const freshness = sourceAvailable
      ? String(readinessRow?.freshness || reviewRow?.freshness || (observedAt ? "unknown" : "missing"))
      : "unavailable";
    const dated = Boolean(observedAt);
    return {
      id,
      title: closureRow?.title || readinessRow?.title || reviewRow?.title || id,
      source_available: sourceAvailable,
      observed_at: observedAt,
      dated,
      age_days: Number.isFinite(readinessRow?.age_days)
        ? readinessRow.age_days
        : (Number.isFinite(reviewRow?.evidence_age_days) ? reviewRow.evidence_age_days : null),
      freshness,
      classification: readinessRow?.classification || closureRow?.classification || (sourceAvailable ? "owner_action" : "unavailable")
    };
  });

  const unavailableIds = rows.filter((row) => !row.source_available).map((row) => row.id);
  const missingIds = rows.filter((row) => row.source_available && !row.dated).map((row) => row.id);
  const agingIds = rows.filter((row) => row.freshness === "aging").map((row) => row.id);
  const staleIds = rows.filter((row) => row.freshness === "stale").map((row) => row.id);
  const currentIds = rows.filter((row) => row.freshness === "current").map((row) => row.id);

  const retainedCandidate = Boolean(
    closure?.closure_candidate === true &&
    review?.closure_candidate === true &&
    readiness?.closure_readiness?.retained_closure_candidate === true
  );

  let status = "retain_hold_missing_evidence";
  if (unavailableIds.length) status = "retain_hold_unavailable_source";
  else if (missingIds.length || !retainedCandidate) status = "retain_hold_missing_evidence";
  else if (staleIds.length) status = "revalidate_before_drill_decision";
  else if (agingIds.length) status = "aging_evidence_review_required";
  else if (
    currentIds.length === rows.length &&
    readiness?.status === "operator_review_ready" &&
    readiness?.drill_readiness?.status === "bounded_drill_ready"
  ) status = "operator_recovery_decision_ready";

  const drill = rows.find((row) => row.id === "recovery_drill") || {};
  let drillDecision = "retain_hold_missing_drill_evidence";
  if (!drill.source_available) drillDecision = "blocked_source_unavailable";
  else if (!drill.dated || drill.freshness === "stale") drillDecision = "bounded_nonproduction_drill_candidate";
  else if (drill.freshness === "aging") drillDecision = "review_aging_drill_evidence";
  else if (drill.freshness === "current") drillDecision = "no_new_drill_required_for_validation";

  const narrowingReviewEligible = status === "operator_recovery_decision_ready";
  const permittedOperatorActions = narrowingReviewEligible
    ? ["retain_hold", "narrow_hold_with_dated_recovery_evidence"]
    : status === "aging_evidence_review_required"
      ? ["retain_hold", "review_aging_recovery_evidence"]
      : status === "revalidate_before_drill_decision" || drillDecision === "bounded_nonproduction_drill_candidate"
        ? ["retain_hold", "review_bounded_nonproduction_drill_plan"]
        : ["retain_hold"];

  return {
    generated_at,
    authority: "recovery_evidence_validation_drill_decision_readiness",
    status,
    evidence_validation: {
      required_count: rows.length,
      source_available_count: rows.length - unavailableIds.length,
      dated_count: rows.filter((row) => row.dated).length,
      current_count: currentIds.length,
      aging_count: agingIds.length,
      stale_count: staleIds.length,
      missing_count: missingIds.length,
      unavailable_ids: unavailableIds,
      missing_ids: missingIds,
      aging_ids: agingIds,
      stale_ids: staleIds,
      retained_closure_candidate: retainedCandidate
    },
    decision_package: {
      operator_review_required: true,
      default_if_no_operator_action: "retain_hold",
      narrowing_review_eligible: narrowingReviewEligible,
      permitted_operator_actions: permittedOperatorActions,
      canonical_hold_mutated: false,
      detail: detailFor(status)
    },
    drill_decision: {
      status: drillDecision,
      observed_at: drill.observed_at || null,
      age_days: drill.age_days ?? null,
      freshness: drill.freshness || (drill.source_available ? "missing" : "unavailable"),
      operator_decision_required: drillDecision !== "no_new_drill_required_for_validation",
      automatic_drill_execution: false,
      production_restore_authorized: false
    },
    rows,
    canonical_hold: {
      area: "Recovery / backup evidence",
      classification: unavailableIds.length ? "unavailable" : "owner_action",
      retain_hold: true,
      operator_review_required: true,
      backlog_mutated: false
    },
    truth_boundary: {
      production_restore_performed: false,
      rollback_performed: false,
      drill_executed: false,
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
  if (status === "operator_recovery_decision_ready") return "All required recovery evidence is source-available, dated and current; explicit operator review may consider evidence-backed HOLD narrowing.";
  if (status === "aging_evidence_review_required") return "Recovery evidence is complete but includes aging observations; review them explicitly before any HOLD decision.";
  if (status === "revalidate_before_drill_decision") return "At least one recovery observation is stale; revalidate it and review whether a bounded non-Production drill is warranted.";
  if (status === "retain_hold_unavailable_source") return "An authorized retained recovery evidence source is unavailable; retain the canonical HOLD.";
  return "Required recovery evidence is missing, undated or not a retained closure candidate; retain the canonical HOLD.";
}
