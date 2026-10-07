// Build 539 — Provider & Local Search Closure Evidence Integrity Review.
// Read-only fail-closed integrity review over retained Build 529 freshness.
// Provider/payment/refund/message evidence and Search Console/GBP evidence remain source-owned.
// First-party context remains descriptive and is never used to infer ranking, demand or conversion causation.

export function buildProviderLocalSearchClosureEvidenceIntegrityReview({
  closure_freshness = {},
  manual_closure_outcome = {},
  generated_at = null
} = {}) {
  const generatedAt = validIso(generated_at) || new Date().toISOString();
  const provider = closure_freshness?.provider_evidence || {};
  const local = closure_freshness?.local_search_evidence || {};
  const operator = closure_freshness?.operator_review || {};
  const providerRows = safeArray(provider?.rows);
  const localRows = safeArray(local?.rows);

  const retainedBuildCurrent = Number(closure_freshness?.provider_local_search_closure_freshness_build) === 529;
  const sourceUnavailable = clean(closure_freshness?.status) === "closure_evidence_source_unavailable" ||
    clean(provider?.status) === "provider_source_unavailable" ||
    clean(local?.status) === "local_search_source_unavailable";

  const freshnessCurrent = retainedBuildCurrent &&
    ["manual_hold_retained_current","manual_closure_outcome_current"].includes(clean(closure_freshness?.status));

  const currentProviderTrace = clean(provider?.evidence_trace_key) || null;
  const retainedProviderTrace = clean(manual_closure_outcome?.evidence_continuity?.provider_evidence_trace_key) || null;
  const providerIdentityComplete = providerRows.length === Number(provider?.required_count || 4) && providerRows.every((row) =>
    Boolean(clean(row?.id)) && Boolean(clean(row?.source)) && Boolean(validIso(row?.evidence_at)) &&
    row?.source_available === true && row?.provider_identity_present === true
  );
  const providerTracePresent = Boolean(currentProviderTrace && retainedProviderTrace);
  const providerTraceMatch = providerTracePresent && currentProviderTrace === retainedProviderTrace;

  const currentLocalTrace = clean(local?.current_evidence_trace_key) || null;
  const retainedLocalTrace = clean(local?.retained_evidence_trace_key) ||
    clean(manual_closure_outcome?.evidence_continuity?.local_search_evidence_trace_key) || null;
  const localIdentityComplete = localRows.length === Number(local?.required_count || 2) && localRows.every((row) =>
    Boolean(clean(row?.provider)) && Boolean(clean(row?.identity_kind)) && Boolean(clean(row?.current_identity)) &&
    Boolean(dateOnly(row?.current_period_start)) && Boolean(dateOnly(row?.current_period_end)) &&
    Boolean(dateOnly(row?.previous_period_start)) && Boolean(dateOnly(row?.previous_period_end)) &&
    Boolean(validIso(row?.current_observed_at)) && row?.identity_match === true &&
    row?.equal_length_window === true && row?.distinct_window === true &&
    row?.correct_provider_property_location_window_source === true
  );
  const localTracePresent = Boolean(currentLocalTrace && retainedLocalTrace);
  const localTraceMatch = localTracePresent && currentLocalTrace === retainedLocalTrace;

  const manual = manual_closure_outcome?.manual_hold_outcome || {};
  const operatorIdentityComplete = operator?.present === true &&
    Boolean(validIso(operator?.reviewed_at)) && Boolean(clean(operator?.reviewer_role)) &&
    Boolean(clean(operator?.outcome_reference)) && Boolean(clean(operator?.expected_evidence_trace_key)) &&
    manual?.valid === true && manual?.trace_match === true;
  const operatorCurrent = operatorIdentityComplete &&
    clean(operator?.freshness_state) === "operator_review_current" &&
    operator?.trace_matches_current_evidence === true;

  let status = "retained_freshness_review_required";
  if (sourceUnavailable) status = "integrity_source_unavailable";
  else if (!freshnessCurrent) status = "retained_freshness_review_required";
  else if (!providerIdentityComplete || !providerTracePresent) status = "provider_source_identity_review_required";
  else if (!providerTraceMatch) status = "provider_source_identity_drift_review_required";
  else if (!localIdentityComplete || !localTracePresent) status = "local_search_identity_review_required";
  else if (!localTraceMatch) status = "local_search_identity_drift_review_required";
  else if (!operatorIdentityComplete) status = "operator_review_identity_review_required";
  else if (!operatorCurrent) status = "operator_review_identity_drift_review_required";
  else status = "closure_integrity_current";

  return Object.freeze({
    generated_at: generatedAt,
    provider_local_search_closure_integrity_build: 539,
    provider_local_search_closure_integrity_authority: "provider_local_search_closure_evidence_integrity_review",
    retained_freshness_authority: "provider_local_search_closure_evidence_freshness_review",
    retained_manual_closure_authority: "provider_local_search_manual_closure_outcome_continuity",
    status,
    provider_source_identity: Object.freeze({
      identity_complete: providerIdentityComplete,
      current_evidence_trace_key: currentProviderTrace,
      retained_evidence_trace_key: retainedProviderTrace,
      trace_present: providerTracePresent,
      trace_match: providerTraceMatch,
      provider_payment_refund_message_sources_must_remain_exact_and_attributable: true
    }),
    local_search_identity: Object.freeze({
      identity_complete: localIdentityComplete,
      current_evidence_trace_key: currentLocalTrace,
      retained_evidence_trace_key: retainedLocalTrace,
      trace_present: localTracePresent,
      trace_match: localTraceMatch,
      search_console_property_identity_required: true,
      google_business_profile_location_identity_required: true,
      exact_equal_length_distinct_window_identity_required: true
    }),
    operator_review_identity: Object.freeze({
      identity_complete: operatorIdentityComplete,
      current: operatorCurrent,
      reviewed_at: validIso(operator?.reviewed_at),
      reviewer_role: clean(operator?.reviewer_role) || null,
      outcome: clean(operator?.outcome) || null,
      outcome_reference: clean(operator?.outcome_reference) || null,
      trace_matches_current_evidence: operator?.trace_matches_current_evidence === true,
      explicit_manual_review_required: true
    }),
    integrity_contract: Object.freeze({
      closure_integrity_current: status === "closure_integrity_current",
      retained_build529_freshness_must_remain_current: true,
      exact_provider_source_trace_required: true,
      exact_search_console_property_window_trace_required: true,
      exact_google_business_profile_location_window_trace_required: true,
      explicit_current_operator_review_required: true,
      first_party_context_remains_separate_descriptive_evidence: true,
      first_party_context_used_as_provider_or_local_search_substitute: false,
      source_or_runtime_green_may_manufacture_missing_identity: false,
      automatic_canonical_hold_narrowing_performed: false
    }),
    truth_boundary: Object.freeze({
      ranking_outcome_inferred: false,
      indexing_outcome_inferred: false,
      maps_visibility_inferred: false,
      demand_causation_inferred: false,
      weather_causation_inferred: false,
      booking_conversion_causation_inferred: false,
      provider_outcome_causation_inferred: false,
      service_availability_inferred: false
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
      persistent_telemetry: false,
      permanent_polling: false
    })
  });
}

function safeArray(value){ return Array.isArray(value) ? value : []; }
function clean(value){ return String(value ?? "").trim(); }
function validIso(value){
  const text=clean(value);
  return text && Number.isFinite(Date.parse(text)) ? new Date(text).toISOString() : null;
}
function dateOnly(value){
  const text=clean(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) && Number.isFinite(Date.parse(text+"T00:00:00Z")) ? text : null;
}
