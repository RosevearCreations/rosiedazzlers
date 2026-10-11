#!/usr/bin/env node
import assert from "node:assert/strict";
import {buildWinterBookingObservedSafetyTransparency as build} from "../functions/api/_lib/winter-booking-rule-observed-safety-transparency.js";
const winterRow={entity_type:"package",code:"wash",evidence_integrity_current:true,
  decision_trace_identity_matches_outcome_snapshot:true,booking_quote_rule_integrity_current:true,customer_transparency_integrity_current:true,
  current_customer_transparency_wording:"Exterior washing depends on source limits and actual weather.",
  availability_revalidated:true,checkout_collision_revalidated:true,runtime_safety_identity_matches_outcome_snapshot:true,
  retained_booking_rule_candidate:"hold_for_weather",retained_quote_rule_candidate:"manual_recheck"};
const capability={package_code:"wash",classification:"temperature_limited_outdoor",capability_evidence_current:true,minimum_working_temperature_c:5,exact_temperature_claim_supported:true,
  winter_rule_observed_collision_count:0,winter_rule_observed_collision_reference:"observed-window-1",winter_rule_observed_collision_observed_at:"2026-10-10"};
const e={entity_type:"package",code:"wash",owner_review_required:true,eligibility_state:"weather_condition_check_required"};
const report={economics:{winter_booking_quote_rule_evidence_integrity_review:{rows:[winterRow]},winter_booking_eligibility:{rows:[e]}}};
const economics={seasonal_operability_evidence:{rows:[capability]}};
const pricing={booking:{weather_eligibility_evidence:{rows:[{eligibility_state:"weather_eligible",session_count:3},{eligibility_state:"weather_ineligible",session_count:2}]}}};
const good=build({report,economics,pricing});
assert.equal(good.status,"manual_review_ready");assert.equal(good.row_count,1);assert.equal(good.rows[0].observed_collision_count,0);
assert.equal(good.weather_evidence.ineligible,2);assert.equal(good.weather_evidence.weather_ineligible_is_conversion_failure,false);
assert.equal(good.booking_mutation_allowed,false);assert.equal(good.hold_narrowing_allowed,false);
const unsafe=build({report:{economics:{winter_booking_quote_rule_evidence_integrity_review:{rows:[{...winterRow,current_customer_transparency_wording:"Available all winter"}]},winter_booking_eligibility:{rows:[e]}}},economics,pricing});
assert.equal(unsafe.rows[0].gaps.includes("supported_customer_disclosure_not_verified"),true);
const noCollision=build({report,economics:{seasonal_operability_evidence:{rows:[{...capability,winter_rule_observed_collision_reference:null}]}},pricing});
assert.equal(noCollision.rows[0].gaps.includes("observed_reservation_collision_outcome_unavailable"),true);
const unknown=build({report,economics,pricing:{booking:{weather_eligibility_evidence:{rows:[{eligibility_state:"unknown",session_count:1}]}}}});
assert.equal(unknown.rows[0].gaps.includes("unknown_weather_sessions_need_separate_review"),true);
const duplicate=build({report,economics:{seasonal_operability_evidence:{rows:[capability,capability]}},pricing});
assert.equal(duplicate.rows[0].gaps.includes("duplicate_service_identity"),true);
assert.equal(build({}).status,"unavailable");
console.log("BUILD 547 WINTER OBSERVED SAFETY & TRANSPARENCY TEST: PASS");
