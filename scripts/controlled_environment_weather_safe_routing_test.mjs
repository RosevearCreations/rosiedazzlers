#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildControlledEnvironmentWeatherSafeRouting } from "../functions/api/_lib/controlled-environment-weather-safe-routing.js";

const economics={
  totals:{booking_count:0,ready_booking_count:0,review_booking_count:0,unavailable_booking_count:0,cogs_variance_booking_count:0},
  rows:[],
  seasonal_operability_evidence:{rows:[
    {package_code:"interior",classification:"cold_snap_capable",evidence_source_type:"process",evidence_source:"interior-process-record"},
    {package_code:"premium_wash",classification:"temperature_limited_outdoor",evidence_source_type:"product",evidence_source:"wash-chemical-tds",minimum_working_temperature_c:5,exact_temperature_claim_supported:true,controlled_environment_alternative_supported:true,controlled_environment_source_type:"site",controlled_environment_reference:"heated-bay-proof"},
    {add_on_code:"ceramic",classification:"controlled_environment_required",evidence_source_type:"site",evidence_source:"controlled-bay-requirement",indoor_capable_workflow_supported:true,indoor_workflow_source_type:"process",indoor_workflow_reference:"ceramic-indoor-process"},
    {add_on_code:"clay",classification:"temperature_limited_outdoor",evidence_source_type:"product",evidence_source:"clay-process-limit"}
  ]}
};

const report=buildControlledEnvironmentWeatherSafeRouting({economics});
const routing=report.economics.weather_safe_routing;
assert.equal(report.weather_safe_routing_enrichment_build,488);
assert.equal(report.weather_safe_routing_authority,"controlled_environment_alternatives_weather_safe_routing");
assert.equal(routing.status,"prepared");
assert.equal(routing.row_count,4);
assert.equal(routing.rows[0].routing_state,"conditional_field_review");
assert.equal(routing.rows[1].routing_state,"controlled_environment_alternative_available");
assert.equal(routing.rows[1].controlled_environment_reference,"heated-bay-proof");
assert.equal(routing.rows[2].routing_state,"controlled_environment_required_with_explicit_option");
assert.equal(routing.rows[2].indoor_capable_workflow_supported,true);
assert.equal(routing.rows[3].routing_state,"weather_safe_reschedule_review");
assert.equal(routing.rows[3].controlled_environment_alternative_supported,false);
assert.equal(report.truth_boundary.every_service_can_move_indoors,false);
assert.equal(report.truth_boundary.missing_controlled_environment_evidence_may_be_inferred,false);
assert.equal(report.boundaries.automatic_reschedule_allowed,false);
assert.equal(report.boundaries.automatic_route_change_allowed,false);

const controlledMissing=buildControlledEnvironmentWeatherSafeRouting({
  economics:{
    totals:economics.totals,rows:[],
    seasonal_operability_evidence:{rows:[
      {add_on_code:"ceramic",classification:"controlled_environment_required",evidence_source_type:"site",evidence_source:"controlled-bay-requirement"}
    ]}
  }
});
assert.equal(controlledMissing.economics.weather_safe_routing.status,"review");
assert.equal(controlledMissing.economics.weather_safe_routing.gap_count,1);
assert.equal(controlledMissing.economics.weather_safe_routing.rows[0].routing_state,"controlled_environment_site_confirmation_required");

console.log("BUILD 488 CONTROLLED-ENVIRONMENT ALTERNATIVES & WEATHER-SAFE ROUTING TEST: PASS");
