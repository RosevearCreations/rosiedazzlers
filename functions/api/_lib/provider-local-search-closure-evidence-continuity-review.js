// Build 509 — Provider & Local Search Closure Evidence Continuity Review.
// Read-only review over retained Build 499 outcome evidence refresh.
// Provider outcomes, Search Console/GBP observations and first-party context remain separate evidence populations.

export function buildProviderLocalSearchClosureEvidenceContinuityReview({
  outcome_refresh = {},
  generated_at = null
} = {}) {
  const provider = outcome_refresh?.provider_outcomes_and_communications || {};
  const local = outcome_refresh?.local_search_provider_outcomes || {};
  const providerRows = safeArray(provider?.rows).map((row) => Object.freeze({
    id: clean(row?.id) || "unknown",
    label: clean(row?.label) || clean(row?.id) || "Provider evidence",
    source: clean(row?.source) || null,
    source_available: row?.source_available === true,
    provider_identity_present: row?.provider_identity_present === true,
    evidence_at: validIso(row?.evidence_at),
    freshness: clean(row?.freshness) || "unknown",
    outcome_status: clean(row?.outcome_status) || "provider_dependent",
    source_contract_satisfied: row?.source_contract_satisfied === true,
    current_attributable_outcome_present: row?.current_attributable_outcome_present === true
  }));
  const localRows = safeArray(local?.rows).map((row) => Object.freeze({
    provider: clean(row?.provider) || "unknown",
    provider_label: clean(row?.provider_label) || clean(row?.provider) || "Provider",
    identity_kind: clean(row?.identity_kind) || "provider",
    current_identity: clean(row?.current_identity) || null,
    previous_identity: clean(row?.previous_identity) || null,
    current_period_start: dateOnly(row?.current_period_start),
    current_period_end: dateOnly(row?.current_period_end),
    previous_period_start: dateOnly(row?.previous_period_start),
    previous_period_end: dateOnly(row?.previous_period_end),
    current_observed_at: validIso(row?.current_observed_at),
    continuity_state: clean(row?.continuity_state) || "continuity_incomplete",
    identity_match: row?.identity_match === true,
    equal_length_window: row?.equal_length_window === true,
    distinct_window: row?.distinct_window === true,
    correct_provider_property_location_window_source: row?.correct_provider_property_location_window_source === true,
    first_party_context_available: row?.first_party_context_available === true
  }));

  const providerUnavailable =
    clean(provider?.status) === "provider_source_unavailable" ||
    providerRows.some((row) => !row.source_available);
  const providerReady =
    providerRows.length === 4 &&
    providerRows.every((row) =>
      row.source_available &&
      row.provider_identity_present &&
      Boolean(row.evidence_at) &&
      row.freshness === "current" &&
      row.source_contract_satisfied &&
      row.current_attributable_outcome_present
    ) &&
    Boolean(clean(provider?.evidence_trace_key));

  const localUnavailable =
    clean(local?.status) === "local_search_source_unavailable" ||
    localRows.some((row) => !row.current_identity);
  const localReady =
    localRows.length === 2 &&
    localRows.every((row) =>
      row.identity_match &&
      row.equal_length_window &&
      row.distinct_window &&
      Boolean(row.current_observed_at) &&
      row.correct_provider_property_location_window_source
    );

  const providerStatus = providerUnavailable
    ? "provider_closure_source_unavailable"
    : providerReady
      ? "provider_closure_evidence_review_ready"
      : "provider_closure_evidence_review_required";
  const localStatus = localUnavailable
    ? "local_search_closure_source_unavailable"
    : localReady
      ? "local_search_closure_evidence_review_ready"
      : "local_search_closure_evidence_review_required";
  const status =
    providerStatus.endsWith("_source_unavailable") || localStatus.endsWith("_source_unavailable")
      ? "closure_evidence_source_unavailable"
      : providerReady && localReady
        ? "closure_evidence_continuity_review_ready"
        : "closure_evidence_continuity_review_required";

  return Object.freeze({
    generated_at: validIso(generated_at) || new Date().toISOString(),
    closure_evidence_continuity_review_build: 509,
    closure_evidence_continuity_review_authority: "provider_local_search_closure_evidence_continuity_review",
    retained_outcome_refresh_authority: "provider_local_search_outcome_evidence_refresh",
    status,
    provider_closure_evidence: Object.freeze({
      status: providerStatus,
      rows: Object.freeze(providerRows),
      required_count: 4,
      closure_review_ready_count: providerRows.filter((row) => row.current_attributable_outcome_present && row.source_contract_satisfied).length,
      evidence_trace_key: clean(provider?.evidence_trace_key) || null,
      provider_owned_evidence_required: true
    }),
    local_search_closure_evidence: Object.freeze({
      status: localStatus,
      rows: Object.freeze(localRows),
      required_count: 2,
      closure_review_ready_count: localRows.filter((row) => row.correct_provider_property_location_window_source).length,
      search_console_property_identity_required: true,
      google_business_profile_location_identity_required: true
    }),
    closure_contract: Object.freeze({
      matching_provider_property_location_window_sources_required: true,
      build499_freshness_and_attribution_retained: true,
      first_party_context_remains_separate_descriptive_evidence: true,
      first_party_context_used_as_provider_substitute: false,
      source_owned_manual_closure_required: true,
      manual_hold_update_required: true,
      automatic_hold_closure_performed: false,
      cross_family_identity_join_performed: false
    }),
    truth_boundary: Object.freeze({
      ranking_outcome_inferred: false,
      indexing_outcome_inferred: false,
      maps_visibility_inferred: false,
      weather_causation_inferred: false,
      winter_demand_inferred: false,
      service_availability_inferred: false,
      booking_conversion_causation_inferred: false,
      provider_outcome_causation_inferred: false,
      exact_service_temperature_limit_inferred: false
    }),
    boundaries: Object.freeze({
      read_only: true,
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

function safeArray(value) { return Array.isArray(value) ? value : []; }
function clean(value) { return String(value ?? "").trim(); }
function validIso(value) {
  const text = clean(value);
  return text && Number.isFinite(Date.parse(text)) ? new Date(text).toISOString() : null;
}
function dateOnly(value) {
  const text = clean(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) && Number.isFinite(Date.parse(text + "T00:00:00Z")) ? text : null;
}
