#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildColdWeatherServiceCapabilityEvidenceMatrix } from "../functions/api/_lib/cold-weather-service-capability-evidence-matrix.js";

const economics={
  totals:{booking_count:0,ready_booking_count:0,review_booking_count:0,unavailable_booking_count:0,cogs_variance_booking_count:0},
  rows:[],
  seasonal_operability_evidence:{rows:[
    {package_code:"interior",classification:"cold_snap_capable",evidence_source_type:"process",evidence_source:"interior-process-record"},
    {package_code:"premium_wash",classification:"temperature_limited_outdoor",evidence_source_type:"product",evidence_source:"wash-chemical-tds",minimum_working_temperature_c:5,exact_temperature_claim_supported:true},
    {add_on_code:"ceramic",classification:"controlled_environment_required",evidence_source_type:"site",evidence_source:"controlled-bay-requirement",minimum_working_temperature_c:10,exact_temperature_claim_supported:true}
  ]}
};
const report=buildColdWeatherServiceCapabilityEvidenceMatrix({economics});
const matrix=report.economics.cold_weather_capability_matrix;
assert.equal(report.cold_weather_capability_enrichment_build,486);
assert.equal(report.cold_weather_capability_authority,"cold_weather_service_capability_evidence_matrix");
assert.equal(matrix.status,"observed");
assert.equal(matrix.valid_row_count,3);
assert.equal(matrix.counts.package,2);
assert.equal(matrix.counts.add_on,1);
assert.equal(matrix.counts.cold_snap_capable,1);
assert.equal(matrix.counts.temperature_limited_outdoor,1);
assert.equal(matrix.counts.controlled_environment_required,1);
assert.equal(matrix.rows[1].minimum_working_temperature_c,5);
assert.equal(matrix.rows[1].temperature_limit_status,"source_owned_limit_recorded");
assert.equal(matrix.broad_winter_claim_authorized,false);
assert.equal(report.truth_boundary.weather_forecast_proves_service_capability,false);
assert.equal(report.boundaries.automatic_booking_availability_change_allowed,false);

const unsupportedThreshold=buildColdWeatherServiceCapabilityEvidenceMatrix({
  economics:{...economics,seasonal_operability_evidence:{rows:[
    {package_code:"wash",classification:"temperature_limited_outdoor",evidence_source_type:"product",evidence_source:"product-note",minimum_working_temperature_c:2,exact_temperature_claim_supported:false}
  ]}}
});
assert.equal(unsupportedThreshold.economics.cold_weather_capability_matrix.rows[0].minimum_working_temperature_c,null);
assert.equal(unsupportedThreshold.economics.cold_weather_capability_matrix.rows[0].temperature_limit_status,"temperature_value_present_but_not_authorized");

const gap=buildColdWeatherServiceCapabilityEvidenceMatrix({
  economics:{...economics,seasonal_operability_evidence:{rows:[
    {add_on_code:"wax",classification:"temperature_limited_outdoor",evidence_source:"operator-memory"}
  ]}}
});
assert.equal(gap.economics.cold_weather_capability_matrix.status,"review");
assert.equal(gap.economics.cold_weather_capability_matrix.valid_row_count,0);
assert.deepEqual(gap.economics.cold_weather_capability_matrix.gaps[0].missing,["explicit_evidence_source_type"]);

const empty=buildColdWeatherServiceCapabilityEvidenceMatrix({economics:{...economics,seasonal_operability_evidence:{rows:[]}}});
assert.equal(empty.economics.cold_weather_capability_matrix.status,"unavailable");
assert.equal(empty.economics.cold_weather_capability_matrix.broad_winter_claim_authorized,false);

console.log("BUILD 486 COLD-WEATHER SERVICE CAPABILITY EVIDENCE MATRIX TEST: PASS");
