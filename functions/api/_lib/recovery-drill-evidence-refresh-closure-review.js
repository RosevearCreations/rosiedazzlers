// Build 477 — Recovery Drill Evidence Refresh & Closure Review.
// Read-only closure-review planning over retained Build 437/447/457/467 recovery evidence.
// No restore, rollback, drill execution, canonical-HOLD mutation, schema/storage mutation or permanent polling.

const REQUIRED_IDS = ["backup_artifact", "retention_location", "recovery_drill"];
const ALLOWED_DECISIONS = [
  "retain_hold",
  "approve_evidence_refresh_plan",
  "approve_bounded_nonproduction_drill_plan",
  "narrow_hold_with_dated_recovery_evidence"
];

export function buildRecoveryDrillEvidenceRefreshClosureReview({
  validation = {},
  closure = {},
  review = {},
  readiness = {},
  owner_review = null,
  generated_at = new Date().toISOString()
} = {}) {
  const validationRows = Array.isArray(validation?.rows) ? validation.rows : [];
  const closureRows = Array.isArray(closure?.required) ? closure.required : [];
  const reviewRows = Array.isArray(review?.rows) ? review.rows : [];
  const readinessRows = Array.isArray(readiness?.rows) ? readiness.rows : [];

  const rows = REQUIRED_IDS.map((id) => {
    const validationRow = validationRows.find((item) => item?.id === id) || {};
    const closureRow = closureRows.find((item) => item?.id === id) || {};
    const reviewRow = reviewRows.find((item) => item?.id === id) || {};
    const readinessRow = readinessRows.find((item) => item?.id === id) || {};
    const sourceAvailable =
      validationRow?.source_available === true ||
      (validationRow?.source_available == null && readinessRow?.source_available === true) ||
      (validationRow?.source_available == null && readinessRow?.source_available == null && closureRow?.status !== "unavailable");
    const observedAt =
      validationRow?.observed_at ||
      readinessRow?.observed_at ||
      reviewRow?.observed_at ||
      closureRow?.observed_at ||
      null;
    const dated = Boolean(observedAt && Number.isFinite(Date.parse(observedAt)));
    const freshness = !sourceAvailable
      ? "unavailable"
      : String(validationRow?.freshness || readinessRow?.freshness || reviewRow?.freshness || (dated ? "unknown" : "missing"));
    return {
      id,
      title: validationRow?.title || closureRow?.title || readinessRow?.title || reviewRow?.title || id,
      source_available: sourceAvailable,
      observed_at: observedAt,
      dated,
      age_days: Number.isFinite(validationRow?.age_days)
        ? validationRow.age_days
        : (Number.isFinite(readinessRow?.age_days)
          ? readinessRow.age_days
          : (Number.isFinite(reviewRow?.evidence_age_days) ? reviewRow.evidence_age_days : null)),
      freshness,
      classification:
        validationRow?.classification ||
        readinessRow?.classification ||
        closureRow?.classification ||
        (sourceAvailable ? "owner_action" : "unavailable")
    };
  });

  const unavailableIds = rows.filter((row) => !row.source_available).map((row) => row.id);
  const missingIds = rows.filter((row) => row.source_available && !row.dated).map((row) => row.id);
  const staleIds = rows.filter((row) => row.source_available && row.freshness === "stale").map((row) => row.id);
  const agingIds = rows.filter((row) => row.source_available && row.freshness === "aging").map((row) => row.id);
  const refreshIds = [...new Set([...missingIds, ...staleIds])];
  const drillRow = rows.find((row) => row.id === "recovery_drill") || {};
  const boundedDrillPlanNeeded = Boolean(
    drillRow.source_available &&
    (!drillRow.dated || drillRow.freshness === "stale")
  );
  const traceKey = evidenceTraceKey(rows);

  const currentClosureEligible = Boolean(
    validation?.status === "operator_recovery_decision_ready" &&
    validation?.decision_package?.narrowing_review_eligible === true
  );

  const ownerReview = normalizeOwnerReview(owner_review, traceKey, {
    currentClosureEligible,
    refreshNeeded: refreshIds.length > 0,
    boundedDrillPlanNeeded
  });

  let status = "retain_hold_recovery_package_not_ready";
  if (unavailableIds.length) {
    status = "blocked_source_unavailable";
  } else if (currentClosureEligible) {
    if (!ownerReview.valid) status = "retain_hold_closure_review_required";
    else if (ownerReview.decision === "retain_hold") status = "closure_review_complete_retain_hold";
    else if (ownerReview.decision === "narrow_hold_with_dated_recovery_evidence") status = "closure_review_ready_for_manual_hold_update";
    else status = "retain_hold_closure_review_required";
  } else if (boundedDrillPlanNeeded) {
    if (!ownerReview.valid) status = "retain_hold_bounded_drill_plan_review_required";
    else if (ownerReview.decision === "retain_hold") status = "review_complete_retain_hold";
    else if (ownerReview.decision === "approve_bounded_nonproduction_drill_plan") status = "bounded_nonproduction_drill_plan_ready_for_separate_execution";
    else if (ownerReview.decision === "approve_evidence_refresh_plan") status = "evidence_refresh_plan_ready_for_separate_execution";
    else status = "retain_hold_bounded_drill_plan_review_required";
  } else if (refreshIds.length) {
    if (!ownerReview.valid) status = "retain_hold_evidence_refresh_review_required";
    else if (ownerReview.decision === "retain_hold") status = "review_complete_retain_hold";
    else if (ownerReview.decision === "approve_evidence_refresh_plan") status = "evidence_refresh_plan_ready_for_separate_execution";
    else status = "retain_hold_evidence_refresh_review_required";
  } else if (agingIds.length) {
    status = ownerReview.valid && ownerReview.decision === "retain_hold"
      ? "review_complete_retain_hold"
      : "retain_hold_aging_evidence_review_required";
  }

  const planKind = boundedDrillPlanNeeded ? "bounded_nonproduction_drill" : (refreshIds.length ? "evidence_refresh" : "none");
  const planReady =
    status === "bounded_nonproduction_drill_plan_ready_for_separate_execution" ||
    status === "evidence_refresh_plan_ready_for_separate_execution";

  return {
    generated_at,
    authority: "recovery_drill_evidence_refresh_closure_review",
    status,
    evidence_traceability: {
      evidence_trace_key: traceKey,
      required_count: rows.length,
      source_available_count: rows.length - unavailableIds.length,
      dated_count: rows.filter((row) => row.dated).length,
      current_count: rows.filter((row) => row.freshness === "current").length,
      aging_count: agingIds.length,
      stale_count: staleIds.length,
      missing_count: missingIds.length,
      unavailable_ids: unavailableIds,
      missing_ids: missingIds,
      stale_ids: staleIds,
      aging_ids: agingIds,
      refresh_required_ids: refreshIds
    },
    owner_review_traceability: {
      status: ownerReview.status,
      required_fields: ["reviewed_at", "reviewer_role", "decision", "evidence_trace_key"],
      allowed_decisions: ALLOWED_DECISIONS,
      expected_evidence_trace_key: traceKey,
      review_present: ownerReview.present,
      review_valid: ownerReview.valid,
      trace_match: ownerReview.trace_match,
      reviewed_at: ownerReview.reviewed_at,
      reviewer_role: ownerReview.reviewer_role,
      decision: ownerReview.decision
    },
    refresh_or_drill_plan: {
      kind: planKind,
      status: planReady ? "owner_reviewed_plan_ready" : (planKind === "none" ? "no_refresh_or_drill_plan_required" : "owner_review_required"),
      evidence_ids: boundedDrillPlanNeeded ? ["recovery_drill"] : refreshIds,
      prerequisites: planPrerequisites(planKind),
      post_observation_evidence_requirements: postObservationRequirements(planKind),
      owner_review_required: planKind !== "none",
      owner_review_valid: ownerReview.valid,
      requires_separate_execution_authorization: planKind !== "none",
      execution_authorized_by_this_package: false,
      automatic_execution: false,
      production_restore_authorized: false
    },
    closure_review: {
      status,
      current_evidence_closure_eligible: currentClosureEligible,
      manual_hold_update_candidate: status === "closure_review_ready_for_manual_hold_update",
      default_if_no_owner_action: "retain_hold",
      canonical_hold_mutated: false,
      detail: detailFor(status)
    },
    rows,
    canonical_hold: {
      area: "Recovery / backup evidence",
      classification: unavailableIds.length ? "unavailable" : "owner_action",
      retain_hold: true,
      explicit_manual_update_required: true,
      backlog_mutated: false
    },
    truth_boundary: {
      production_restore_performed: false,
      rollback_performed: false,
      drill_executed: false,
      evidence_refresh_executed: false,
      owner_review_record_persisted: false,
      dns_mutation_performed: false,
      secret_rotation_performed: false,
      destructive_r2_performed: false,
      provider_recovery_performed: false,
      schema_or_storage_mutated: false,
      business_data_mutated: false,
      canonical_hold_mutated: false,
      permanent_polling: false
    }
  };
}

function evidenceTraceKey(rows) {
  return rows
    .map((row) => [
      row.id,
      row.source_available ? "available" : "unavailable",
      row.observed_at || "undated",
      row.freshness || "unknown",
      row.classification || "owner_action"
    ].join(":"))
    .join("|");
}

function normalizeOwnerReview(ownerReview, expectedTraceKey, eligibility) {
  const present = Boolean(ownerReview && typeof ownerReview === "object" && Object.keys(ownerReview).length);
  if (!present) {
    return {present:false,valid:false,trace_match:false,status:"owner_review_not_recorded",reviewed_at:null,reviewer_role:null,decision:null};
  }
  const reviewedAt = typeof ownerReview.reviewed_at === "string" ? ownerReview.reviewed_at : null;
  const reviewerRole = typeof ownerReview.reviewer_role === "string" && ownerReview.reviewer_role.trim() ? ownerReview.reviewer_role.trim() : null;
  const decision = typeof ownerReview.decision === "string" ? ownerReview.decision : null;
  const traceMatch = typeof ownerReview.evidence_trace_key === "string" && ownerReview.evidence_trace_key === expectedTraceKey;
  const dateValid = Boolean(reviewedAt && Number.isFinite(Date.parse(reviewedAt)));
  const decisionAllowed = ALLOWED_DECISIONS.includes(decision);
  const decisionEligible =
    decision === "retain_hold" ||
    (decision === "approve_evidence_refresh_plan" && eligibility.refreshNeeded) ||
    (decision === "approve_bounded_nonproduction_drill_plan" && eligibility.boundedDrillPlanNeeded) ||
    (decision === "narrow_hold_with_dated_recovery_evidence" && eligibility.currentClosureEligible);
  const valid = Boolean(dateValid && reviewerRole && decisionAllowed && traceMatch && decisionEligible);
  let status = "owner_review_invalid";
  if (!traceMatch) status = "owner_review_trace_mismatch";
  else if (!decisionEligible) status = "owner_review_decision_not_currently_eligible";
  else if (valid && decision === "retain_hold") status = "owner_review_recorded_retain_hold";
  else if (valid) status = "owner_review_recorded_plan_or_closure_candidate";
  return {present:true,valid,trace_match:traceMatch,status,reviewed_at:reviewedAt,reviewer_role:reviewerRole,decision};
}

function planPrerequisites(kind) {
  if (kind === "bounded_nonproduction_drill") {
    return [
      "explicit owner review matched to the current evidence trace key",
      "non-Production target/environment identified",
      "current backup artifact and retention location identified before drill start",
      "bounded recovery/rollback runbook and responsible operator identified",
      "abort criteria and no-Production-restore boundary recorded"
    ];
  }
  if (kind === "evidence_refresh") {
    return [
      "explicit owner review matched to the current evidence trace key",
      "authorized retained evidence source identified for each refresh item",
      "non-destructive observation method and responsible operator identified",
      "observation timestamp/source/reference fields prepared before refresh"
    ];
  }
  return [];
}

function postObservationRequirements(kind) {
  if (kind === "bounded_nonproduction_drill") {
    return [
      "observed_at",
      "observer_role",
      "environment_or_target",
      "backup_artifact_reference",
      "retention_location_reference",
      "recovery_or_rollback_outcome",
      "abort_or_deviation_notes",
      "evidence_trace_key_after_observation"
    ];
  }
  if (kind === "evidence_refresh") {
    return [
      "observed_at",
      "observer_role",
      "evidence_source",
      "artifact_or_location_reference",
      "observation_outcome",
      "evidence_trace_key_after_observation"
    ];
  }
  return [];
}

function detailFor(status) {
  if (status === "closure_review_ready_for_manual_hold_update") return "Current attributable recovery evidence and a matching explicit owner review satisfy closure-review prerequisites; the canonical HOLD still requires a separate manual update.";
  if (status === "closure_review_complete_retain_hold" || status === "review_complete_retain_hold") return "The explicit owner review records retain_hold; no recovery action or HOLD narrowing occurs.";
  if (status === "bounded_nonproduction_drill_plan_ready_for_separate_execution") return "A matching owner review has accepted the bounded non-Production drill plan. This package does not execute the drill and does not authorize a Production restore.";
  if (status === "evidence_refresh_plan_ready_for_separate_execution") return "A matching owner review has accepted the evidence-refresh plan. This package does not perform the refresh.";
  if (status === "retain_hold_bounded_drill_plan_review_required") return "Recovery-drill evidence is stale or missing. Retain the HOLD until an owner reviews a bounded non-Production drill plan and its prerequisites.";
  if (status === "retain_hold_evidence_refresh_review_required") return "Retained recovery evidence is stale or missing. Retain the HOLD until an owner reviews a bounded evidence-refresh plan.";
  if (status === "retain_hold_aging_evidence_review_required") return "Recovery evidence is aging and requires explicit owner review before any closure decision.";
  if (status === "retain_hold_closure_review_required") return "Recovery evidence is currently closure-eligible, but an explicit matching owner review is still required before any manual HOLD update can be considered.";
  if (status === "blocked_source_unavailable") return "An authorized retained recovery evidence source is unavailable. Retain the canonical HOLD.";
  return "The retained recovery package is not ready for closure review. Retain the canonical HOLD.";
}
