// Build 489 — Provider & Local Search Evidence Continuity.
// Read-only composition over retained provider outcome/HOLD traceability and local-search snapshot continuity.
// Provider outcome evidence and local-search provider evidence remain separate populations.

export function buildProviderLocalSearchEvidenceContinuity({
  provider = {},
  local_search = {},
  generated_at = null
} = {}) {
  const providerTrace = provider?.hold_decision_traceability_closure_review || {};
  const localContinuity = local_search?.provider_snapshot_continuity || {};
  const providerRows = normalizeProviderRows(providerTrace?.rows);
  const localRows = normalizeLocalRows(localContinuity?.providers);

  const providerStatus = providerContinuityStatus(providerTrace, providerRows);
  const localStatus = localSearchContinuityStatus(localContinuity, localRows);
  const overallStatus =
    providerStatus === "current_complete" && localStatus === "descriptive_review_ready"
      ? "bounded_continuity_review_ready"
      : providerStatus === "unavailable_source" || localStatus === "unavailable"
        ? "continuity_source_unavailable"
        : "continuity_review_incomplete";

  return Object.freeze({
    generated_at: validIso(generated_at) || new Date().toISOString(),
    continuity_enrichment_build: 489,
    continuity_authority: "provider_local_search_evidence_continuity",
    retained_provider_authority: "provider_hold_decision_traceability_closure_review",
    retained_local_search_authority: "local_search_provider_snapshot_continuity_descriptive_review",
    status: overallStatus,
    provider_outcomes_and_communications: Object.freeze({
      status: providerStatus,
      evidence_trace_key: clean(providerTrace?.evidence_date_continuity?.evidence_trace_key) || null,
      rows: Object.freeze(providerRows),
      required_count: providerRows.length,
      current_count: providerRows.filter((row) => row.freshness === "current" && row.evidence_timestamp_valid).length,
      provider_owned_evidence_required: true,
      operator_hold_review_remains_separate: true
    }),
    local_search: Object.freeze({
      status: localStatus,
      rows: Object.freeze(localRows),
      total_provider_rows: localRows.length,
      descriptive_review_ready_count: localRows.filter((row) => row.continuity_state === "descriptive_review_ready").length,
      search_console_and_gbp_remain_provider_owned: true,
      provider_metric_deltas_are_descriptive_only: true
    }),
    continuity_rules: Object.freeze({
      provider_outcome_identity_and_date_required: true,
      local_search_property_or_location_identity_required: true,
      local_search_equal_length_distinct_windows_required: true,
      cross_family_identity_join_performed: false,
      payment_or_message_provider_outcome_joined_to_search_provider: false,
      provider_metric_to_booking_join_performed: false,
      first_party_referral_to_provider_metric_join_performed: false
    }),
    truth_boundary: Object.freeze({
      ranking_outcome_inferred: false,
      indexing_outcome_inferred: false,
      maps_visibility_inferred: false,
      provider_payment_or_delivery_outcome_causes_search_movement: false,
      local_search_metric_movement_causes_booking_conversion: false,
      referral_movement_causes_booking_conversion: false,
      seasonal_message_causes_search_movement: false,
      search_or_referral_movement_is_weather_causation: false,
      search_or_referral_movement_proves_winter_demand: false,
      search_or_referral_movement_proves_service_availability: false,
      exact_service_temperature_limit_inferred: false,
      customer_identity_joined_across_evidence_families: false
    }),
    boundaries: Object.freeze({
      read_only: true,
      manual_refresh_only: true,
      provider_contact_performed: false,
      provider_snapshot_write_performed: false,
      payment_or_refund_mutation_performed: false,
      message_delivery_mutation_performed: false,
      booking_or_quote_mutation_performed: false,
      customer_outreach_performed: false,
      content_or_seasonal_message_published: false,
      schema_or_storage_mutated: false,
      permanent_polling: false
    })
  });
}

function normalizeProviderRows(rows) {
  return safeArray(rows).map((row) => Object.freeze({
    id: clean(row?.id) || "unknown",
    title: clean(row?.title) || clean(row?.id) || "Provider evidence",
    source: clean(row?.source) || "retained provider evidence",
    source_available: row?.source_available === true,
    evidence_at: validIso(row?.evidence_at),
    evidence_timestamp_valid: row?.evidence_timestamp_valid === true || Boolean(validIso(row?.evidence_at)),
    freshness: clean(row?.freshness) || "unknown",
    outcome_status: clean(row?.outcome_status) || "provider_dependent",
    provider_identity_present: Boolean(clean(row?.id) && clean(row?.source))
  }));
}

function normalizeLocalRows(rows) {
  return safeArray(rows).map((row) => Object.freeze({
    provider: clean(row?.provider) || "unknown",
    provider_label: clean(row?.provider_label) || clean(row?.provider) || "Provider",
    continuity_state: clean(row?.continuity_state) || "continuity_incomplete",
    identity_match: row?.identity_match === true,
    comparable_window_length: row?.comparable_window_length === true,
    current_window_days: finiteWhole(row?.current_window_days),
    previous_window_days: finiteWhole(row?.previous_window_days),
    current_snapshot: normalizeLocalSnapshot(row?.current_snapshot),
    previous_snapshot: normalizeLocalSnapshot(row?.previous_snapshot),
    metric_deltas: objectOrEmpty(row?.metric_deltas),
    first_party_context: Object.freeze({
      available: row?.first_party_context?.available === true,
      window_start: clean(row?.first_party_context?.window_start) || null,
      window_end: clean(row?.first_party_context?.window_end) || null,
      google_referral_sessions: finiteWhole(row?.first_party_context?.google_referral_sessions)
    })
  }));
}

function normalizeLocalSnapshot(row) {
  if (!row || typeof row !== "object") return null;
  return Object.freeze({
    label: clean(row?.label) || null,
    period_start: dateOnly(row?.period_start),
    period_end: dateOnly(row?.period_end),
    observed_at: validIso(row?.observed_at),
    metrics: objectOrEmpty(row?.metrics)
  });
}

function providerContinuityStatus(trace, rows) {
  const status = clean(trace?.evidence_date_continuity?.status);
  if (status) return status;
  if (!rows.length) return "unavailable_source";
  if (rows.some((row) => !row.source_available)) return "unavailable_source";
  if (rows.every((row) => row.evidence_timestamp_valid && row.freshness === "current" && row.provider_identity_present)) return "current_complete";
  return "incomplete_missing_or_invalid_date";
}

function localSearchContinuityStatus(continuity, rows) {
  const status = clean(continuity?.status);
  if (status) return status;
  if (!rows.length) return "unavailable";
  return rows.every((row) => row.continuity_state === "descriptive_review_ready")
    ? "descriptive_review_ready"
    : "continuity_incomplete";
}

function safeArray(value) { return Array.isArray(value) ? value : []; }
function objectOrEmpty(value) { return value && typeof value === "object" && !Array.isArray(value) ? Object.freeze({...value}) : Object.freeze({}); }
function clean(value) { return String(value ?? "").trim(); }
function validIso(value) {
  const text = clean(value);
  return text && Number.isFinite(Date.parse(text)) ? new Date(text).toISOString() : null;
}
function dateOnly(value) {
  const text = clean(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) && Number.isFinite(Date.parse(text+"T00:00:00Z")) ? text : null;
}
function finiteWhole(value) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
}
