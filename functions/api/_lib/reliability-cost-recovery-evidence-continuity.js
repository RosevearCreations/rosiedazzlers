// Build 484 — Reliability, Cost & Recovery Evidence Continuity.
// Additive read-only continuity review over retained Build 474 trend authority.
import { buildReliabilityCostResilienceTrendReview } from "./reliability-cost-resilience-trend-review.js";

const FIELD_CLASSES = new Set(["cold_snap_capable","temperature_limited_outdoor","controlled_environment_required"]);

export function buildReliabilityCostRecoveryEvidenceContinuity({
  reassessment = {},
  reliability = {},
  recovery = {},
  generated_at = null
} = {}) {
  const base = buildReliabilityCostResilienceTrendReview({ reassessment, reliability, generated_at });
  const providerCost = buildProviderCostContinuity(reliability?.provider_cost_evidence || {});
  const recoveryContinuity = buildRecoveryContinuity(recovery?.recovery_continuity_evidence || {});
  const fieldOperability = buildFieldOperability(reliability?.field_operability_evidence || {});
  const technicalAvailability = Object.freeze({
    status: base?.trend_review?.first_party_traffic?.comparable_window_evidence === true
      ? "bounded_first_party_continuity_observed"
      : "insufficient_comparable_history",
    source: "retained_first_party_reliability_evidence",
    first_party_only: true,
    provider_billing_proxy: false,
    field_operability_proxy: false,
    scaling_need_established: false,
    conclusion: "Technical availability/activity evidence remains separate from provider cost and outdoor field operability."
  });

  return Object.freeze({
    ...base,
    continuity_enrichment_build: 484,
    continuity_authority: "reliability_cost_recovery_evidence_continuity",
    retained_continuity_authority: "reliability_cost_resilience_trend_review",
    continuity_review: Object.freeze({
      status: continuityStatus(providerCost, recoveryContinuity, technicalAvailability, fieldOperability),
      technical_availability: technicalAvailability,
      provider_cost_quota: providerCost,
      recovery: recoveryContinuity,
      field_operability: fieldOperability,
      provider_cost_or_quota_inferred_from_first_party_traffic: false,
      real_recovery_inferred_from_source_readiness: false,
      field_operability_inferred_from_technical_availability: false,
      automatic_action_authorized: false
    }),
    truth_boundary: Object.freeze({
      ...(base?.truth_boundary || {}),
      first_party_traffic_proves_cloudflare_billing: false,
      first_party_traffic_proves_cloudflare_cpu_or_quota: false,
      source_or_runtime_green_proves_recovery_outcome: false,
      nonproduction_drill_proves_production_restore: false,
      technical_availability_proves_field_operability: false,
      cold_weather_limitation_is_application_reliability_failure: false,
      field_operability_proves_technical_availability: false,
      inferred_working_temperature_threshold_allowed: false
    }),
    boundaries: Object.freeze({
      ...(base?.boundaries || {}),
      read_only: true,
      manual_refresh_only: true,
      automatic_scaling_allowed: false,
      provider_mutation_allowed: false,
      production_restore_allowed: false,
      automatic_booking_availability_change_allowed: false,
      automatic_public_winter_claim_allowed: false,
      schema_migration_allowed: false,
      business_mutation_allowed: false,
      permanent_polling: false
    })
  });
}

function buildProviderCostContinuity(evidence = {}) {
  const rows = Array.isArray(evidence?.rows) ? evidence.rows : [];
  const valid = rows
    .map((row) => normalizeProviderRow(row))
    .filter(Boolean)
    .sort((a,b) => Date.parse(a.observed_at) - Date.parse(b.observed_at));
  const comparable = valid.length >= 2 && valid.every((row) => row.metric === valid[0].metric && row.unit === valid[0].unit);
  return Object.freeze({
    status: comparable ? "provider_owned_comparable_history_observed" : (valid.length ? "insufficient_comparable_provider_history" : "external_provider_evidence_required"),
    recorded_row_count: rows.length,
    valid_provider_owned_row_count: valid.length,
    comparable_window_evidence: comparable,
    metric: comparable ? valid[0].metric : null,
    unit: comparable ? valid[0].unit : null,
    rows: Object.freeze(valid),
    provider_owned_evidence_required: true,
    cloudflare_billing_observed: comparable && valid[0].metric === "billing",
    cloudflare_cpu_observed: comparable && valid[0].metric === "cpu",
    cloudflare_quota_observed: comparable && valid[0].metric === "quota",
    first_party_traffic_used_as_proxy: false,
    scaling_need_established: false,
    automatic_provider_action_authorized: false,
    conclusion: comparable
      ? "Comparable provider-owned cost/quota evidence is present. It remains descriptive and does not authorize scaling or provider changes."
      : "Provider billing, CPU, quota or dollar-cost continuity remains unavailable until comparable provider-owned evidence is recorded."
  });
}

function normalizeProviderRow(row = {}) {
  if (row?.provider_owned !== true) return null;
  const observedAt = clean(row?.observed_at);
  const metric = clean(row?.metric).toLowerCase();
  const unit = clean(row?.unit).toLowerCase();
  const value = finiteNonNegative(row?.value);
  const sourceReference = clean(row?.source_reference || row?.evidence_reference);
  if (!observedAt || !Number.isFinite(Date.parse(observedAt)) || !metric || !unit || value == null || !sourceReference) return null;
  return Object.freeze({ observed_at: observedAt, metric, unit, value, source_reference: sourceReference, provider_owned: true });
}

function buildRecoveryContinuity(evidence = {}) {
  const rows = Array.isArray(evidence?.rows) ? evidence.rows : [];
  const valid = rows
    .map((row) => normalizeRecoveryRow(row))
    .filter(Boolean)
    .sort((a,b) => Date.parse(a.observed_at) - Date.parse(b.observed_at));
  const comparable = valid.length >= 2 && valid.every((row) =>
    row.observation_kind === valid[0].observation_kind &&
    row.environment === valid[0].environment
  );
  const productionRows = valid.filter((row) => row.environment === "production" && row.production_restore_observed === true);
  return Object.freeze({
    status: comparable ? "comparable_recovery_history_observed" : (valid.length ? "insufficient_comparable_recovery_history" : "recovery_observation_evidence_required"),
    recorded_row_count: rows.length,
    valid_attributable_row_count: valid.length,
    comparable_window_evidence: comparable,
    rows: Object.freeze(valid),
    production_observation_count: productionRows.length,
    real_production_recovery_established: comparable && valid.length >= 2 && productionRows.length === valid.length && productionRows.every((row) => row.outcome === "success"),
    source_readiness_used_as_recovery_proxy: false,
    nonproduction_drill_used_as_production_proxy: false,
    automatic_restore_authorized: false,
    conclusion: comparable
      ? "Comparable attributable recovery observations are present for the same observation kind and environment."
      : "Recovery continuity remains unproven until at least two attributable observations use the same observation kind and environment."
  });
}

function normalizeRecoveryRow(row = {}) {
  const observedAt = clean(row?.observed_at);
  const observationKind = clean(row?.observation_kind).toLowerCase();
  const environment = clean(row?.environment).toLowerCase();
  const outcome = clean(row?.outcome).toLowerCase();
  const sourceReference = clean(row?.source_reference || row?.evidence_reference);
  if (!observedAt || !Number.isFinite(Date.parse(observedAt)) || !observationKind || !environment || !["success","partial","failed"].includes(outcome) || !sourceReference) return null;
  return Object.freeze({
    observed_at: observedAt,
    observation_kind: observationKind,
    environment,
    outcome,
    source_reference: sourceReference,
    production_restore_observed: row?.production_restore_observed === true
  });
}

function buildFieldOperability(evidence = {}) {
  const rows = Array.isArray(evidence?.rows) ? evidence.rows : [];
  let invalid = 0;
  const valid = [];
  for (const row of rows) {
    const serviceCode = clean(row?.service_code || row?.package_code || row?.add_on_code);
    const classification = clean(row?.classification).toLowerCase();
    const sourceReference = clean(row?.source_reference || row?.evidence_source);
    if (!serviceCode || !FIELD_CLASSES.has(classification) || !sourceReference) { invalid += 1; continue; }
    const min = finite(row?.minimum_working_temperature_c);
    const max = finite(row?.maximum_working_temperature_c);
    valid.push(Object.freeze({
      service_code: serviceCode,
      classification,
      source_reference: sourceReference,
      minimum_working_temperature_c: min,
      maximum_working_temperature_c: max,
      exact_temperature_claim_supported: row?.exact_temperature_claim_supported === true && (min != null || max != null),
      technical_availability_claim: false
    }));
  }
  const counts = { cold_snap_capable:0, temperature_limited_outdoor:0, controlled_environment_required:0 };
  for (const row of valid) counts[row.classification] += 1;
  return Object.freeze({
    status: rows.length === 0 ? "unavailable" : (invalid === 0 ? "observed" : "review"),
    recorded_row_count: rows.length,
    valid_explicit_row_count: valid.length,
    invalid_or_unattributed_row_count: invalid,
    counts: Object.freeze(counts),
    rows: Object.freeze(valid),
    explicit_service_product_equipment_or_site_evidence_required: true,
    technical_availability_used_as_proxy: false,
    inferred_temperature_thresholds_allowed: false,
    automatic_booking_change_authorized: false,
    automatic_public_claim_authorized: false
  });
}

function continuityStatus(providerCost, recovery, technical, field) {
  const observed = [providerCost, recovery, technical, field].filter((row) =>
    String(row?.status || "").includes("observed")
  ).length;
  if (observed >= 2) return "bounded_continuity_evidence_available";
  if (observed === 1) return "partial_continuity_evidence";
  return "insufficient_comparable_continuity_evidence";
}
function clean(value){ return String(value ?? "").trim(); }
function finite(value){
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const out = Number(value);
  return Number.isFinite(out) ? out : null;
}
function finiteNonNegative(value){
  const out = finite(value);
  return out != null && out >= 0 ? out : null;
}
