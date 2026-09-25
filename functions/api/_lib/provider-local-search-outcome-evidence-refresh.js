// Build 499 — Provider & Local Search Outcome Evidence Refresh.
// Read-only classification over retained Build 489 provider/local-search continuity.
// Provider outcomes, local-search provider snapshots and first-party context remain separate populations.

export function buildProviderLocalSearchOutcomeEvidenceRefresh({
  continuity = {},
  generated_at = null
} = {}) {
  const provider = continuity?.provider_outcomes_and_communications || {};
  const local = continuity?.local_search || {};
  const providerRows = Array.isArray(provider?.rows) ? provider.rows : [];
  const localRows = Array.isArray(local?.rows) ? local.rows : [];

  const expectedProvider = [
    ["stripe_payment", "Stripe payment outcome"],
    ["paypal_payment", "PayPal payment outcome"],
    ["refund", "Linked definitive refund outcome"],
    ["delivery", "Definitive message-delivery outcome"]
  ];

  const paymentRefundMessage = expectedProvider.map(([id, label]) => {
    const row = providerRows.find((item) => clean(item?.id) === id) || {};
    const sourceAvailable = row?.source_available === true;
    const identityPresent = row?.provider_identity_present === true || Boolean(clean(row?.source));
    const timestampValid = row?.evidence_timestamp_valid === true && Boolean(validIso(row?.evidence_at));
    const current = clean(row?.freshness) === "current";
    const observed = !["", "provider_dependent", "unavailable", "missing"].includes(clean(row?.outcome_status));
    return Object.freeze({
      id,
      label,
      source: clean(row?.source) || null,
      source_available: sourceAvailable,
      provider_identity_present: identityPresent,
      evidence_at: validIso(row?.evidence_at),
      freshness: clean(row?.freshness) || "unknown",
      outcome_status: clean(row?.outcome_status) || "provider_dependent",
      source_contract_satisfied: sourceAvailable && identityPresent && timestampValid,
      current_attributable_outcome_present: sourceAvailable && identityPresent && timestampValid && current && observed
    });
  });

  const expectedLocal = [
    ["search_console", "Google Search Console", "property"],
    ["google_business_profile", "Google Business Profile", "location"]
  ];

  const searchRows = expectedLocal.map(([id, label, identityKind]) => {
    const row = localRows.find((item) => clean(item?.provider) === id) || {};
    const current = row?.current_snapshot || null;
    const previous = row?.previous_snapshot || null;
    const currentWindow = validWindow(current);
    const previousWindow = validWindow(previous);
    const equalLength = row?.comparable_window_length === true
      && positiveWhole(row?.current_window_days)
      && row?.current_window_days === row?.previous_window_days;
    const distinctWindow = currentWindow && previousWindow
      && (current.period_start !== previous.period_start || current.period_end !== previous.period_end);
    const identityMatch = row?.identity_match === true && Boolean(clean(current?.label)) && Boolean(clean(previous?.label));
    const descriptiveReady = clean(row?.continuity_state) === "descriptive_review_ready";
    return Object.freeze({
      provider: id,
      provider_label: label,
      identity_kind: identityKind,
      current_identity: clean(current?.label) || null,
      previous_identity: clean(previous?.label) || null,
      current_period_start: dateOnly(current?.period_start),
      current_period_end: dateOnly(current?.period_end),
      previous_period_start: dateOnly(previous?.period_start),
      previous_period_end: dateOnly(previous?.period_end),
      current_observed_at: validIso(current?.observed_at),
      continuity_state: clean(row?.continuity_state) || "continuity_incomplete",
      identity_match: identityMatch,
      equal_length_window: Boolean(equalLength),
      distinct_window: Boolean(distinctWindow),
      correct_provider_property_location_window_source:
        descriptiveReady && identityMatch && Boolean(equalLength) && Boolean(distinctWindow) && Boolean(validIso(current?.observed_at)),
      first_party_context_available: row?.first_party_context?.available === true
    });
  });

  const providerUnavailable = paymentRefundMessage.some((row) => !row.source_available);
  const providerCurrent = paymentRefundMessage.every((row) => row.current_attributable_outcome_present);
  const localUnavailable = searchRows.some((row) => !row.current_identity);
  const localCurrent = searchRows.every((row) => row.correct_provider_property_location_window_source);

  const providerStatus = providerUnavailable
    ? "provider_source_unavailable"
    : providerCurrent
      ? "provider_outcome_evidence_current"
      : "provider_outcome_refresh_required";

  const localStatus = localUnavailable
    ? "local_search_source_unavailable"
    : localCurrent
      ? "local_search_outcome_evidence_current"
      : "local_search_refresh_required";

  const status = providerStatus.endsWith("_unavailable") || localStatus.endsWith("_unavailable")
    ? "outcome_evidence_source_unavailable"
    : providerCurrent && localCurrent
      ? "outcome_evidence_refresh_review_ready"
      : "outcome_evidence_refresh_required";

  return Object.freeze({
    generated_at: validIso(generated_at) || new Date().toISOString(),
    outcome_evidence_refresh_build: 499,
    outcome_evidence_refresh_authority: "provider_local_search_outcome_evidence_refresh",
    retained_continuity_authority: "provider_local_search_evidence_continuity",
    status,
    provider_outcomes_and_communications: Object.freeze({
      status: providerStatus,
      rows: Object.freeze(paymentRefundMessage),
      required_count: expectedProvider.length,
      current_attributable_count: paymentRefundMessage.filter((row) => row.current_attributable_outcome_present).length,
      evidence_trace_key: clean(provider?.evidence_trace_key) || null
    }),
    local_search_provider_outcomes: Object.freeze({
      status: localStatus,
      rows: Object.freeze(searchRows),
      required_count: expectedLocal.length,
      correct_source_window_count: searchRows.filter((row) => row.correct_provider_property_location_window_source).length,
      first_party_context_available_count: searchRows.filter((row) => row.first_party_context_available).length
    }),
    source_contract: Object.freeze({
      payment_refund_message_provider_evidence_only: true,
      search_console_property_identity_required: true,
      google_business_profile_location_identity_required: true,
      current_and_prior_window_dates_required: true,
      equal_length_distinct_windows_required: true,
      first_party_context_remains_separate_descriptive_evidence: true,
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
      exact_service_temperature_limit_inferred: false
    }),
    boundaries: Object.freeze({
      read_only: true,
      manual_refresh_only: true,
      provider_contact_performed: false,
      payment_or_refund_mutation_performed: false,
      message_delivery_mutation_performed: false,
      search_console_or_gbp_write_performed: false,
      provider_snapshot_write_performed: false,
      booking_or_quote_mutation_performed: false,
      customer_outreach_performed: false,
      schema_or_storage_mutated: false,
      permanent_polling: false
    })
  });
}

function clean(value) { return String(value ?? "").trim(); }
function validIso(value) {
  const text = clean(value);
  return text && Number.isFinite(Date.parse(text)) ? new Date(text).toISOString() : null;
}
function dateOnly(value) {
  const text = clean(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) && Number.isFinite(Date.parse(text + "T00:00:00Z")) ? text : null;
}
function validWindow(row) {
  if (!row || typeof row !== "object") return false;
  const start = dateOnly(row?.period_start);
  const end = dateOnly(row?.period_end);
  return Boolean(start && end && start <= end);
}
function positiveWhole(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0;
}
