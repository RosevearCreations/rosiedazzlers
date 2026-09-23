// Build 486 — Cold-Weather Service Capability Evidence Matrix.
// Read-only capability evidence over the retained Build 483 service/add-on seasonal-operability authority.
import { buildServiceAddOnAllocationEvidenceClosure } from "./service-addon-allocation-evidence-closure.js";

const CLASSIFICATIONS = new Set(["cold_snap_capable","temperature_limited_outdoor","controlled_environment_required"]);
const SOURCE_TYPES = new Set(["service","product","equipment","site","process"]);

export function buildColdWeatherServiceCapabilityEvidenceMatrix({
  economics = {}, fleet = {}, pricing = {}, source_status = {}, generated_at = null
} = {}) {
  const base = buildServiceAddOnAllocationEvidenceClosure({ economics, fleet, pricing, source_status, generated_at });
  const sourceRows = Array.isArray(economics?.seasonal_operability_evidence?.rows)
    ? economics.seasonal_operability_evidence.rows
    : [];
  const rows = [];
  const gaps = [];
  for (let index = 0; index < sourceRows.length; index += 1) {
    const source = sourceRows[index] || {};
    const entity = entityIdentity(source);
    const classification = clean(source.classification).toLowerCase();
    const evidenceSourceType = clean(source.evidence_source_type || source.source_type).toLowerCase();
    const evidenceReference = clean(source.evidence_source || source.source_reference || source.evidence_reference);
    const sourceTypeValid = SOURCE_TYPES.has(evidenceSourceType);
    const classificationValid = CLASSIFICATIONS.has(classification);
    const identityValid = Boolean(entity.code);
    const referenceValid = Boolean(evidenceReference);
    const exactTemperatureAuthorized = source.exact_temperature_claim_supported === true;
    const rawMin = finite(source.minimum_working_temperature_c);
    const rawMax = finite(source.maximum_working_temperature_c);
    const min = exactTemperatureAuthorized ? rawMin : null;
    const max = exactTemperatureAuthorized ? rawMax : null;
    const temperatureEvidenceValid = !exactTemperatureAuthorized || rawMin != null || rawMax != null;
    const valid = identityValid && classificationValid && sourceTypeValid && referenceValid && temperatureEvidenceValid;
    if (!valid) {
      const missing = [];
      if (!identityValid) missing.push("package_or_add_on_identity");
      if (!classificationValid) missing.push("allowed_classification");
      if (!sourceTypeValid) missing.push("explicit_evidence_source_type");
      if (!referenceValid) missing.push("evidence_reference");
      if (!temperatureEvidenceValid) missing.push("source_owned_temperature_limit");
      gaps.push(Object.freeze({ row_index:index, entity_type:entity.type, code:entity.code || null, missing }));
      continue;
    }
    rows.push(Object.freeze({
      entity_type: entity.type,
      code: entity.code,
      classification,
      evidence_source_type: evidenceSourceType,
      evidence_reference: evidenceReference,
      minimum_working_temperature_c: min,
      maximum_working_temperature_c: max,
      exact_temperature_claim_supported: exactTemperatureAuthorized && (min != null || max != null),
      temperature_limit_status:
        exactTemperatureAuthorized && (min != null || max != null)
          ? "source_owned_limit_recorded"
          : (rawMin != null || rawMax != null)
            ? "temperature_value_present_but_not_authorized"
            : "no_exact_limit_recorded",
      customer_facing_winter_claim_authorized: false,
      automatic_booking_change_authorized: false
    }));
  }

  const counts = {
    total: rows.length,
    package: rows.filter((row) => row.entity_type === "package").length,
    add_on: rows.filter((row) => row.entity_type === "add_on").length,
    service: rows.filter((row) => row.entity_type === "service").length,
    cold_snap_capable: rows.filter((row) => row.classification === "cold_snap_capable").length,
    temperature_limited_outdoor: rows.filter((row) => row.classification === "temperature_limited_outdoor").length,
    controlled_environment_required: rows.filter((row) => row.classification === "controlled_environment_required").length,
    exact_temperature_limit: rows.filter((row) => row.exact_temperature_claim_supported).length
  };
  const status = sourceRows.length === 0 ? "unavailable" : gaps.length === 0 ? "observed" : "review";

  return Object.freeze({
    ...base,
    cold_weather_capability_enrichment_build: 486,
    cold_weather_capability_authority: "cold_weather_service_capability_evidence_matrix",
    retained_seasonal_authority: "service_addon_allocation_evidence_closure",
    economics: Object.freeze({
      ...(base.economics || {}),
      cold_weather_capability_matrix: Object.freeze({
        status,
        source_row_count: sourceRows.length,
        valid_row_count: rows.length,
        gap_count: gaps.length,
        counts: Object.freeze(counts),
        rows: Object.freeze(rows),
        gaps: Object.freeze(gaps),
        allowed_classifications: Object.freeze([...CLASSIFICATIONS]),
        allowed_evidence_source_types: Object.freeze([...SOURCE_TYPES]),
        broad_winter_claim_authorized: false,
        automatic_booking_change_authorized: false,
        exact_temperature_limits_require_source_authority: true
      })
    }),
    truth_boundary: Object.freeze({
      ...(base.truth_boundary || {}),
      broad_winter_availability_claim_supported_by_matrix_presence: false,
      missing_source_type_may_be_inferred: false,
      missing_temperature_limit_may_be_inferred: false,
      weather_forecast_proves_service_capability: false,
      technical_availability_proves_field_operability: false,
      margin_or_booking_demand_proves_winter_capability: false
    }),
    boundaries: Object.freeze({
      ...(base.boundaries || {}),
      read_only: true,
      automatic_booking_availability_change_allowed: false,
      automatic_public_winter_claim_allowed: false,
      automatic_price_or_discount_change_allowed: false,
      schema_mutation_allowed: false,
      permanent_polling: false
    })
  });
}

function entityIdentity(row = {}) {
  if (clean(row.add_on_code)) return { type:"add_on", code:clean(row.add_on_code) };
  if (clean(row.package_code)) return { type:"package", code:clean(row.package_code) };
  if (clean(row.service_code)) return { type:"service", code:clean(row.service_code) };
  return { type:"unknown", code:"" };
}
function clean(value){ return String(value ?? "").trim(); }
function finite(value){
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const out = Number(value);
  return Number.isFinite(out) ? out : null;
}
