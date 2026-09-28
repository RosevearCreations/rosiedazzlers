// Build 519 — Provider & Local Search Manual Closure Outcome Continuity.
// Read-only reconciliation over retained Build 509 closure-review evidence.
// Explicit operator-reviewed manual HOLD outcomes are observed, never manufactured or persisted here.

const ALLOWED_OUTCOMES = ["retain_hold", "narrow_hold_with_dated_evidence"];

export function buildProviderLocalSearchManualClosureOutcomeContinuity({
  closure_review = {},
  manual_hold_outcome = null,
  generated_at = null
} = {}) {
  const provider = closure_review?.provider_closure_evidence || {};
  const local = closure_review?.local_search_closure_evidence || {};
  const closureReady =
    clean(closure_review?.status) === "closure_evidence_continuity_review_ready" &&
    clean(provider?.status) === "provider_closure_evidence_review_ready" &&
    clean(local?.status) === "local_search_closure_evidence_review_ready" &&
    Number(provider?.closure_review_ready_count) === Number(provider?.required_count || 4) &&
    Number(local?.closure_review_ready_count) === Number(local?.required_count || 2);

  const providerTraceKey = clean(provider?.evidence_trace_key);
  const localTraceKey = buildLocalSearchTraceKey(local?.rows);
  const expectedEvidenceTraceKey = [
    "provider", providerTraceKey || "missing",
    "local_search", localTraceKey || "missing"
  ].join(":");

  const review = normalizeManualOutcome(manual_hold_outcome, expectedEvidenceTraceKey, closureReady);

  let status = "manual_closure_operator_outcome_required";
  if (review.present && !review.valid) status = "manual_closure_evidence_conflict";
  else if (review.valid && review.outcome === "retain_hold") status = "manual_hold_retained_observed";
  else if (review.valid && review.outcome === "narrow_hold_with_dated_evidence" && closureReady) {
    status = "manual_closure_outcome_observed";
  } else if (review.valid && review.outcome === "narrow_hold_with_dated_evidence") {
    status = "manual_closure_evidence_conflict";
  }

  return Object.freeze({
    generated_at: validIso(generated_at) || new Date().toISOString(),
    manual_closure_outcome_build: 519,
    manual_closure_outcome_authority: "provider_local_search_manual_closure_outcome_continuity",
    retained_closure_review_authority: "provider_local_search_closure_evidence_continuity_review",
    retained_outcome_refresh_authority: "provider_local_search_outcome_evidence_refresh",
    status,
    evidence_continuity: Object.freeze({
      closure_review_ready: closureReady,
      provider_status: clean(provider?.status) || "unavailable",
      provider_required_count: Number(provider?.required_count || 4),
      provider_review_ready_count: Number(provider?.closure_review_ready_count || 0),
      local_search_status: clean(local?.status) || "unavailable",
      local_search_required_count: Number(local?.required_count || 2),
      local_search_review_ready_count: Number(local?.closure_review_ready_count || 0),
      provider_evidence_trace_key: providerTraceKey || null,
      local_search_evidence_trace_key: localTraceKey || null,
      expected_evidence_trace_key: expectedEvidenceTraceKey,
      matching_fresh_provider_property_location_window_evidence_required: true,
      first_party_context_is_separate_descriptive_evidence: true
    }),
    manual_hold_outcome: Object.freeze({
      status: review.status,
      required_fields: Object.freeze(["reviewed_at","reviewer_role","outcome","evidence_trace_key","outcome_reference"]),
      allowed_outcomes: Object.freeze([...ALLOWED_OUTCOMES]),
      present: review.present,
      valid: review.valid,
      trace_match: review.trace_match,
      reviewed_at: review.reviewed_at,
      reviewer_role: review.reviewer_role,
      outcome: review.outcome,
      outcome_reference: review.outcome_reference,
      operator_reviewed: review.valid,
      observed_not_inferred: true,
      canonical_hold_mutated_by_this_authority: false
    }),
    closure_contract: Object.freeze({
      build509_closure_review_required: true,
      matching_fresh_provider_payment_refund_message_evidence_required: true,
      matching_search_console_property_window_evidence_required: true,
      matching_google_business_profile_location_window_evidence_required: true,
      explicit_operator_reviewed_manual_hold_outcome_required: true,
      manual_outcome_must_match_current_evidence_trace: true,
      first_party_context_remains_separate_descriptive_evidence: true,
      automatic_canonical_hold_narrowing_performed: false,
      manual_canonical_hold_update_remains_separate: true
    }),
    truth_boundary: Object.freeze({
      ranking_outcome_inferred: false,
      indexing_outcome_inferred: false,
      maps_visibility_inferred: false,
      demand_causation_inferred: false,
      weather_causation_inferred: false,
      booking_conversion_causation_inferred: false,
      service_availability_inferred: false,
      exact_service_temperature_limit_inferred: false
    }),
    boundaries: Object.freeze({
      read_only: true,
      operator_outcome_persisted: false,
      payment_or_refund_mutation_performed: false,
      message_delivery_mutation_performed: false,
      provider_contact_performed: false,
      search_console_or_gbp_write_performed: false,
      provider_snapshot_write_performed: false,
      booking_or_quote_mutation_performed: false,
      customer_outreach_performed: false,
      content_publication_performed: false,
      hold_inventory_mutated: false,
      schema_or_storage_mutated: false,
      permanent_polling: false
    })
  });
}

function normalizeManualOutcome(value, expectedTraceKey, closureReady) {
  const present = Boolean(value && typeof value === "object" && Object.keys(value).length);
  if (!present) {
    return { present:false, valid:false, trace_match:false, status:"operator_outcome_not_recorded", reviewed_at:null, reviewer_role:null, outcome:null, outcome_reference:null };
  }
  const reviewedAt = validIso(value?.reviewed_at);
  const reviewerRole = clean(value?.reviewer_role) || null;
  const outcome = clean(value?.outcome) || null;
  const outcomeReference = clean(value?.outcome_reference) || null;
  const traceMatch = clean(value?.evidence_trace_key) === expectedTraceKey;
  const allowed = ALLOWED_OUTCOMES.includes(outcome);
  const narrowingEligible = outcome !== "narrow_hold_with_dated_evidence" || closureReady;
  const valid = Boolean(reviewedAt && reviewerRole && outcomeReference && traceMatch && allowed && narrowingEligible);
  let status = "operator_outcome_invalid";
  if (!traceMatch) status = "operator_outcome_trace_mismatch";
  else if (!narrowingEligible) status = "operator_outcome_not_currently_eligible";
  else if (valid && outcome === "retain_hold") status = "operator_reviewed_retain_hold_observed";
  else if (valid && outcome === "narrow_hold_with_dated_evidence") status = "operator_reviewed_manual_closure_observed";
  return { present:true, valid, trace_match:traceMatch, status, reviewed_at:reviewedAt, reviewer_role:reviewerRole, outcome, outcome_reference:outcomeReference };
}

function buildLocalSearchTraceKey(rows) {
  const items = Array.isArray(rows) ? rows : [];
  if (!items.length) return null;
  return items
    .map((row) => [
      clean(row?.provider) || "unknown",
      clean(row?.identity_kind) || "provider",
      clean(row?.current_identity) || "missing",
      clean(row?.current_period_start) || "missing",
      clean(row?.current_period_end) || "missing",
      clean(row?.previous_period_start) || "missing",
      clean(row?.previous_period_end) || "missing",
      clean(row?.current_observed_at) || "missing"
    ].join("|"))
    .sort()
    .join("||");
}
function clean(value) { return String(value ?? "").trim(); }
function validIso(value) {
  const text = clean(value);
  return text && Number.isFinite(Date.parse(text)) ? new Date(text).toISOString() : null;
}
