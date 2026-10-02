// Build 529 — Provider & Local Search Closure Evidence Freshness Review.
export function buildProviderLocalSearchClosureEvidenceFreshnessReview({
  closure_review = {}, manual_closure_outcome = {}, generated_at = null, freshness_window_days = 30
} = {}) {
  const generatedAt = validDate(generated_at) ? new Date(generated_at) : new Date();
  const windowDays = Math.max(1, Math.min(365, Number(freshness_window_days) || 30));
  const provider = closure_review?.provider_closure_evidence || {};
  const local = closure_review?.local_search_closure_evidence || {};
  const providerRows = safeArray(provider?.rows).map((row) => normalizeProviderRow(row, generatedAt, windowDays));
  const localRows = safeArray(local?.rows).map((row) => normalizeLocalRow(row, generatedAt, windowDays));

  const providerSourceUnavailable = clean(provider?.status) === "provider_closure_source_unavailable" || providerRows.some((row) => !row.source_available);
  const providerCurrent = providerRows.length === 4 && providerRows.every((row) => row.freshness_state === "provider_evidence_current") && Boolean(clean(provider?.evidence_trace_key));
  const localSourceUnavailable = clean(local?.status) === "local_search_closure_source_unavailable" || localRows.some((row) => !row.current_identity);
  const localCurrent = localRows.length === 2 && localRows.every((row) => row.freshness_state === "local_search_evidence_current");

  const evidenceTraceKey = clean(manual_closure_outcome?.evidence_continuity?.expected_evidence_trace_key) || null;
  const providerTraceKey = clean(provider?.evidence_trace_key) || null;
  const retainedProviderTraceKey = clean(manual_closure_outcome?.evidence_continuity?.provider_evidence_trace_key) || null;
  const retainedLocalTraceKey = clean(manual_closure_outcome?.evidence_continuity?.local_search_evidence_trace_key) || null;
  const currentLocalTraceKey = buildLocalSearchTraceKey(safeArray(local?.rows));
  const traceMatchesCurrent = Boolean(evidenceTraceKey && providerTraceKey && retainedProviderTraceKey && retainedLocalTraceKey && currentLocalTraceKey) &&
    providerTraceKey === retainedProviderTraceKey && currentLocalTraceKey === retainedLocalTraceKey;

  const operator = normalizeOperatorOutcome(manual_closure_outcome?.manual_hold_outcome, generatedAt, windowDays);
  const operatorCurrent = operator.valid && operator.trace_match && operator.freshness_state === "operator_review_current";

  let status = "closure_evidence_operator_review_required";
  if (providerSourceUnavailable || localSourceUnavailable) status = "closure_evidence_source_unavailable";
  else if (!providerCurrent) status = "provider_evidence_freshness_review_required";
  else if (!localCurrent) status = "local_search_evidence_freshness_review_required";
  else if (!traceMatchesCurrent && operator.present) status = "closure_evidence_trace_conflict_review_required";
  else if (!operator.present) status = "closure_evidence_current_operator_review_required";
  else if (!operatorCurrent) status = "operator_review_freshness_required";
  else if (operator.outcome === "retain_hold") status = "manual_hold_retained_current";
  else if (operator.outcome === "narrow_hold_with_dated_evidence") status = "manual_closure_outcome_current";

  const reviewReady = providerCurrent && localCurrent && (!operator.present || traceMatchesCurrent);

  return Object.freeze({
    generated_at: generatedAt.toISOString(),
    provider_local_search_closure_freshness_build: 529,
    provider_local_search_closure_freshness_authority: "provider_local_search_closure_evidence_freshness_review",
    retained_closure_review_authority: "provider_local_search_closure_evidence_continuity_review",
    retained_manual_closure_outcome_authority: "provider_local_search_manual_closure_outcome_continuity",
    status,
    freshness_window_days: windowDays,
    provider_evidence: Object.freeze({
      status: providerSourceUnavailable ? "provider_source_unavailable" : providerCurrent ? "provider_evidence_current" : "provider_evidence_freshness_review_required",
      required_count: 4,
      current_count: providerRows.filter((row) => row.freshness_state === "provider_evidence_current").length,
      rows: Object.freeze(providerRows),
      evidence_trace_key: providerTraceKey,
      provider_payment_refund_message_evidence_must_be_current_and_attributable: true
    }),
    local_search_evidence: Object.freeze({
      status: localSourceUnavailable ? "local_search_source_unavailable" : localCurrent ? "local_search_evidence_current" : "local_search_evidence_freshness_review_required",
      required_count: 2,
      current_count: localRows.filter((row) => row.freshness_state === "local_search_evidence_current").length,
      rows: Object.freeze(localRows),
      current_evidence_trace_key: currentLocalTraceKey,
      retained_evidence_trace_key: retainedLocalTraceKey,
      search_console_property_identity_required: true,
      google_business_profile_location_identity_required: true,
      equal_length_distinct_windows_required: true
    }),
    operator_review: Object.freeze({
      ...operator,
      expected_evidence_trace_key: evidenceTraceKey,
      trace_matches_current_evidence: traceMatchesCurrent,
      current_operator_review_required_for_manual_closure_or_hold_outcome: true,
      operator_review_never_inferred_from_source_or_runtime_green: true
    }),
    review_contract: Object.freeze({
      closure_review_ready: reviewReady,
      matching_current_provider_property_location_window_evidence_required: true,
      explicit_current_operator_review_required_to_treat_manual_outcome_as_current: true,
      stale_operator_outcome_never_narrows_current_hold: true,
      first_party_context_remains_separate_descriptive_evidence: true,
      first_party_context_used_as_provider_substitute: false,
      provider_and_local_search_evidence_joined_to_customer_identity: false,
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
      provider_outcome_causation_inferred: false,
      service_availability_inferred: false,
      exact_service_temperature_limit_inferred: false,
      stale_evidence_may_be_treated_as_current: false
    }),
    boundaries: Object.freeze({
      read_only: true,
      operator_outcome_persisted: false,
      provider_contact_performed: false,
      payment_or_refund_mutation_performed: false,
      message_delivery_mutation_performed: false,
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
function normalizeProviderRow(row, generatedAt, windowDays) {
  const evidenceAt = validDate(row?.evidence_at) ? new Date(row.evidence_at).toISOString() : null;
  const age = ageDays(evidenceAt, generatedAt);
  const current = row?.source_available === true && row?.provider_identity_present === true && Boolean(evidenceAt) && age !== null && age <= windowDays &&
    clean(row?.freshness) === "current" && row?.source_contract_satisfied === true && row?.current_attributable_outcome_present === true;
  return Object.freeze({
    id: clean(row?.id) || "unknown", label: clean(row?.label) || clean(row?.id) || "Provider evidence",
    source: clean(row?.source) || null, source_available: row?.source_available === true,
    provider_identity_present: row?.provider_identity_present === true, evidence_at: evidenceAt, evidence_age_days: age,
    retained_freshness: clean(row?.freshness) || "unknown", source_contract_satisfied: row?.source_contract_satisfied === true,
    current_attributable_outcome_present: row?.current_attributable_outcome_present === true,
    freshness_state: current ? "provider_evidence_current" : "provider_evidence_freshness_review_required"
  });
}
function normalizeLocalRow(row, generatedAt, windowDays) {
  const observedAt = validDate(row?.current_observed_at) ? new Date(row.current_observed_at).toISOString() : null;
  const age = ageDays(observedAt, generatedAt);
  const currentIdentity = clean(row?.current_identity) || null;
  const current = Boolean(currentIdentity) && row?.identity_match === true && row?.equal_length_window === true && row?.distinct_window === true &&
    Boolean(observedAt) && age !== null && age <= windowDays && row?.correct_provider_property_location_window_source === true;
  return Object.freeze({
    provider: clean(row?.provider) || "unknown", provider_label: clean(row?.provider_label) || clean(row?.provider) || "Provider",
    identity_kind: clean(row?.identity_kind) || "provider", current_identity: currentIdentity, previous_identity: clean(row?.previous_identity) || null,
    current_period_start: dateOnly(row?.current_period_start), current_period_end: dateOnly(row?.current_period_end),
    previous_period_start: dateOnly(row?.previous_period_start), previous_period_end: dateOnly(row?.previous_period_end),
    current_observed_at: observedAt, evidence_age_days: age, identity_match: row?.identity_match === true,
    equal_length_window: row?.equal_length_window === true, distinct_window: row?.distinct_window === true,
    correct_provider_property_location_window_source: row?.correct_provider_property_location_window_source === true,
    first_party_context_available: row?.first_party_context_available === true,
    freshness_state: current ? "local_search_evidence_current" : "local_search_evidence_freshness_review_required"
  });
}
function normalizeOperatorOutcome(outcome = {}, generatedAt, windowDays) {
  const present = outcome?.present === true;
  const reviewedAt = validDate(outcome?.reviewed_at) ? new Date(outcome.reviewed_at).toISOString() : null;
  const age = ageDays(reviewedAt, generatedAt);
  const valid = outcome?.valid === true, traceMatch = outcome?.trace_match === true;
  const current = present && valid && traceMatch && reviewedAt && age !== null && age <= windowDays;
  return Object.freeze({
    present, valid, trace_match: traceMatch, reviewed_at: reviewedAt, review_age_days: age,
    reviewer_role: clean(outcome?.reviewer_role) || null, outcome: clean(outcome?.outcome) || null,
    outcome_reference: clean(outcome?.outcome_reference) || null,
    freshness_state: current ? "operator_review_current" : present ? "operator_review_freshness_required" : "operator_review_not_recorded"
  });
}
function buildLocalSearchTraceKey(rows) {
  const items = safeArray(rows);
  if (!items.length) return null;
  return items.map((row) => [
    clean(row?.provider) || "unknown", clean(row?.identity_kind) || "provider", clean(row?.current_identity) || "missing",
    clean(row?.current_period_start) || "missing", clean(row?.current_period_end) || "missing",
    clean(row?.previous_period_start) || "missing", clean(row?.previous_period_end) || "missing",
    clean(row?.current_observed_at) || "missing"
  ].join("|")).sort().join("||");
}
function ageDays(value, generatedAt) { if (!validDate(value)) return null; const ms=generatedAt.getTime()-new Date(value).getTime(); return Number.isFinite(ms)?Math.max(0,Math.floor(ms/86400000)):null; }
function safeArray(value) { return Array.isArray(value) ? value : []; }
function clean(value) { return String(value ?? "").trim(); }
function validDate(value) { const text=clean(value); return Boolean(text) && Number.isFinite(Date.parse(text)); }
function dateOnly(value) { const text=clean(value); return /^\d{4}-\d{2}-\d{2}$/.test(text) && Number.isFinite(Date.parse(text+"T00:00:00Z")) ? text : null; }
