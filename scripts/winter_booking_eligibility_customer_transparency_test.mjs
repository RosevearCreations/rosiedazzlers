#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildWinterBookingEligibilityCustomerTransparency } from "../functions/api/_lib/winter-booking-eligibility-customer-transparency.js";

const economics={
  totals:{booking_count:0,ready_booking_count:0,review_booking_count:0,unavailable_booking_count:0,cogs_variance_booking_count:0},
  rows:[],
  seasonal_operability_evidence:{rows:[
    {package_code:"interior",classification:"cold_snap_capable",evidence_source_type:"process",evidence_source:"interior-process-record"},
    {package_code:"premium_wash",classification:"temperature_limited_outdoor",evidence_source_type:"product",evidence_source:"wash-chemical-tds",minimum_working_temperature_c:5,exact_temperature_claim_supported:true},
    {add_on_code:"ceramic",classification:"controlled_environment_required",evidence_source_type:"site",evidence_source:"controlled-bay-requirement"}
  ]}
};
const pricing={booking:{weather_eligibility_evidence:{rows:[
  {eligibility_state:"weather_eligible",session_count:12},
  {eligibility_state:"weather_ineligible",session_count:3}
]}}};
const report=buildWinterBookingEligibilityCustomerTransparency({economics,pricing});
const eligibility=report.economics.winter_booking_eligibility;
assert.equal(report.winter_booking_eligibility_enrichment_build,487);
assert.equal(report.winter_booking_eligibility_authority,"winter_booking_eligibility_customer_transparency");
assert.equal(eligibility.status,"prepared");
assert.equal(eligibility.row_count,3);
assert.equal(eligibility.rows[0].eligibility_state,"conditional_winter_consideration");
assert.equal(eligibility.rows[1].eligibility_state,"weather_condition_check_required");
assert.ok(eligibility.rows[1].customer_limitation_text.includes("recorded working limit: minimum 5°C"));
assert.equal(eligibility.rows[2].eligibility_state,"controlled_environment_required");
assert.equal(eligibility.customer_copy_status,"draft_owner_review_required");
assert.equal(eligibility.broad_winter_claim_authorized,false);
assert.equal(eligibility.weather_ineligible_conversion_interpretation.weather_ineligible_session_count,3);
assert.equal(eligibility.weather_ineligible_conversion_interpretation.ordinary_conversion_denominator_excludes_weather_ineligible,true);
assert.equal(eligibility.weather_ineligible_conversion_interpretation.adjusted_conversion_metric_available,false);
assert.equal(report.truth_boundary.weather_ineligible_session_is_conversion_failure,false);
assert.equal(report.boundaries.automatic_booking_availability_change_allowed,false);

const noWeather=buildWinterBookingEligibilityCustomerTransparency({economics,pricing:{}});
assert.equal(noWeather.economics.winter_booking_eligibility.weather_ineligible_conversion_interpretation.status,"unavailable");
assert.equal(noWeather.economics.winter_booking_eligibility.weather_ineligible_conversion_interpretation.adjusted_conversion_metric_value,null);

console.log("BUILD 487 WINTER BOOKING ELIGIBILITY & CUSTOMER TRANSPARENCY TEST: PASS");
