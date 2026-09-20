#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildServiceEconomicsCapacityPricingReview } from "../functions/api/_lib/service-economics-commercial-capacity-review.js";

const result=buildServiceEconomicsCapacityPricingReview({
  generated_at:"2026-09-20T18:30:00.000Z",
  economics:{
    totals:{booking_count:3,ready_booking_count:3,review_booking_count:0,unavailable_booking_count:0,cogs_variance_booking_count:0,recognized_revenue_cad:960,recorded_material_cost_cad:150,estimated_direct_labor_cad:240,pricing_review_contribution_cad:570},
    rows:[
      {package_code:"complete",evidence_status:"ready",recognized_revenue_cad:420,pricing_review_contribution_cad:250},
      {package_code:"complete",evidence_status:"ready",recognized_revenue_cad:360,pricing_review_contribution_cad:210},
      {package_code:"basic",evidence_status:"ready",recognized_revenue_cad:180,pricing_review_contribution_cad:110}
    ]
  },
  fleet:{
    inquiry_demand:{inquiry_count:4,vehicles_requested:11},
    commercial_rules:{unresolved_domain_count:0,commercial_terms_complete:true},
    operations:{fleet_account_count:1,active_vehicle_count:7,request_job_count:5,completed_work_evidence_count:3},
    capacity:{status:"observed",availability_authority:"/api/availability",collision_revalidation_authority:"/api/checkout",current_live_capacity_inferred:true}
  },
  pricing:{
    evidence_status:"observed",
    booking:{largest_price_adjacent_stage_drop:{key:"step_3",stage:"Add-ons",sessions_lost:4,drop_pct:18.2}},
    quotes:{rows_observed:8,sent_quotes:8,accepted_quotes:4,declined_quotes:3,possibly_truncated:false,value_bands:[
      {key:"250_399",label:"$250–$399",sent_quotes:5,accepted_quotes:3,declined_quotes:2,unresolved_quotes:0,accepted_of_sent_pct:60,declined_of_sent_pct:40,review_cohort_sufficient:true},
      {key:"400_599",label:"$400–$599",sent_quotes:2,accepted_quotes:1,declined_quotes:1,unresolved_quotes:0,accepted_of_sent_pct:50,declined_of_sent_pct:50,review_cohort_sufficient:false}
    ]}
  },
  source_status:{
    service_economics:{available:true,restricted:false,http_status:200},
    fleet_commercial:{available:true,restricted:false,http_status:200},
    pricing_learning:{available:true,restricted:false,http_status:200}
  }
});
assert.equal(result.build,453);
assert.equal(result.authority,"service_economics_capacity_pricing_review");
assert.deepEqual(result.retained_authorities,[428,443,451]);
assert.equal(result.economics.service_package_cohorts.length,2);
assert.equal(result.economics.service_package_cohorts.find(r=>r.package_code==="complete").pricing_review_contribution_cad,460);
assert.equal(result.economics.add_on_cost_attribution_status,"unavailable");
assert.equal(result.economics.add_on_margin_inferred,false);
assert.equal(result.pricing_review.sufficient_value_band_count,1);
assert.equal(result.pricing_review.review_ready,true);
assert.equal(result.pricing_review.causal_price_sensitivity_claimed,false);
assert.equal(result.pricing_review.service_margin_to_quote_band_join,false);
assert.equal(result.capacity.current_live_capacity_inferred,false);
assert.equal(result.truth_boundary.demand_proves_capacity,false);
assert.equal(result.truth_boundary.add_on_margin_without_attribution_allowed,false);
assert.ok(result.review_candidates.some(r=>r.area==="pricing_review_context"));
assert.ok(result.review_candidates.some(r=>r.area==="add_on_cost_attribution"));
assert.ok(result.review_candidates.every(r=>r.automatic_action_authorized===false));

const partial=buildServiceEconomicsCapacityPricingReview({
  economics:{totals:{booking_count:1,ready_booking_count:0,review_booking_count:1,unavailable_booking_count:0,cogs_variance_booking_count:1},rows:[{package_code:"basic",evidence_status:"review"}]},
  fleet:{commercial_rules:{unresolved_domain_count:1,commercial_terms_complete:false},capacity:{status:"unavailable",current_live_capacity_inferred:false}},
  source_status:{service_economics:{available:true},fleet_commercial:{available:true},pricing_learning:{available:false,restricted:true,http_status:403}}
});
assert.equal(partial.evidence_status,"partial");
assert.equal(partial.pricing_review.review_ready,false);
assert.equal(partial.economics.service_package_cohorts[0].pricing_review_contribution_cad,null);
console.log("BUILD 453 SERVICE ECONOMICS CAPACITY PRICING REVIEW TEST: PASS");
