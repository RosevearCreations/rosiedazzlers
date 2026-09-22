#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildServiceEconomicsAllocationMarginReviewReadiness } from "../functions/api/_lib/service-economics-allocation-margin-review-readiness.js";

const source_status = {
  service_economics: { available: true, restricted: false, http_status: 200 },
  fleet_commercial: { available: true, restricted: false, http_status: 200 },
  pricing_learning: { available: true, restricted: false, http_status: 200 }
};
const fleet = { inquiry_demand:{}, commercial_rules:{unresolved_domain_count:0,commercial_terms_complete:true}, operations:{}, capacity:{status:"observed",current_live_capacity_inferred:true} };
const pricing = { evidence_status:"observed", quotes:{rows_observed:5,sent_quotes:5,accepted_quotes:3,declined_quotes:1,possibly_truncated:false,value_bands:[{key:"250_399",label:"$250-$399",sent_quotes:5,accepted_quotes:3,declined_quotes:1,unresolved_quotes:1,review_cohort_sufficient:true}]} };

const complete = buildServiceEconomicsAllocationMarginReviewReadiness({
  generated_at:"2026-09-22T02:00:00.000Z",
  economics:{
    totals:{booking_count:2,ready_booking_count:2,review_booking_count:0,unavailable_booking_count:0,cogs_variance_booking_count:0,recognized_revenue_cad:700,recorded_material_cost_cad:120,estimated_direct_labor_cad:180,pricing_review_contribution_cad:400},
    rows:[
      {package_code:"complete",evidence_status:"ready",revenue_evidence_status:"ready",material_evidence_status:"ready",labor_evidence_status:"ready",cash_evidence_status:"ready",cogs_reconciliation_status:"ready",recognized_revenue_cad:400,recorded_material_cost_cad:70,estimated_direct_labor_cad:100,direct_cogs_cad:70,pricing_review_contribution_cad:230},
      {package_code:"basic",evidence_status:"ready",revenue_evidence_status:"ready",material_evidence_status:"ready",labor_evidence_status:"ready",cash_evidence_status:"ready",cogs_reconciliation_status:"ready",recognized_revenue_cad:300,recorded_material_cost_cad:50,estimated_direct_labor_cad:80,direct_cogs_cad:50,pricing_review_contribution_cad:170}
    ],
    add_on_allocation_evidence:{recorded_basis:true,rows:[
      {add_on_code:"pet_hair",recorded_add_on_revenue:true,material_usage_linked_to_add_on:true,labor_time_linked_to_add_on:true,cash_refund_linked_to_add_on:true,posted_cogs_linked_to_add_on:true},
      {add_on_code:"pet_hair",recorded_add_on_revenue:true,material_usage_linked_to_add_on:true,labor_time_linked_to_add_on:true,cash_refund_linked_to_add_on:true,posted_cogs_linked_to_add_on:true}
    ]}
  }, fleet, pricing, source_status
});
assert.equal(complete.allocation_enrichment_build,473);
assert.equal(complete.allocation_authority,"service_economics_allocation_margin_review_readiness");
assert.equal(complete.release_enrichment_build,463);
assert.equal(complete.economics.allocation_margin_readiness.service_package.service_package_margin_review_ready,true);
assert.equal(complete.economics.allocation_margin_readiness.service_package.review_ready_cohort_count,2);
assert.equal(complete.economics.allocation_margin_readiness.add_on.add_on_margin_review_ready,true);
assert.equal(complete.economics.allocation_margin_readiness.add_on.review_ready_add_on_count,1);
assert.equal(complete.truth_boundary.booking_total_proves_component_allocation,false);
assert.equal(complete.boundaries.inferred_service_or_add_on_allocation_allowed,false);

const partial = buildServiceEconomicsAllocationMarginReviewReadiness({
  economics:{
    totals:{booking_count:2,ready_booking_count:1,review_booking_count:1,unavailable_booking_count:0,cogs_variance_booking_count:1},
    rows:[
      {package_code:"basic",evidence_status:"ready",revenue_evidence_status:"ready",material_evidence_status:"ready",labor_evidence_status:"ready",cash_evidence_status:"ready",cogs_reconciliation_status:"ready",recognized_revenue_cad:300,recorded_material_cost_cad:40,estimated_direct_labor_cad:70,direct_cogs_cad:40,pricing_review_contribution_cad:190},
      {package_code:"complete",evidence_status:"review",revenue_evidence_status:"ready",material_evidence_status:"review",labor_evidence_status:"ready",cash_evidence_status:"ready",cogs_reconciliation_status:"review",recognized_revenue_cad:400,recorded_material_cost_cad:null,estimated_direct_labor_cad:90,direct_cogs_cad:null,pricing_review_contribution_cad:null}
    ],
    add_on_allocation_evidence:{recorded_basis:true,recorded_add_on_revenue:true,material_usage_linked_to_add_on:true,labor_time_linked_to_add_on:true,cash_refund_linked_to_add_on:true,posted_cogs_linked_to_add_on:true}
  }, fleet, pricing, source_status
});
assert.equal(partial.economics.allocation_margin_readiness.service_package.review_ready_cohort_count,1);
assert.equal(partial.economics.allocation_margin_readiness.service_package.blocked_cohort_count,1);
assert.equal(partial.economics.allocation_margin_readiness.service_package.service_package_margin_review_ready,false);
assert.equal(partial.economics.allocation_margin_readiness.add_on.status,"review");
assert.equal(partial.economics.allocation_margin_readiness.add_on.add_on_margin_review_ready,false);
assert.equal(partial.economics.allocation_margin_readiness.add_on.aggregate_flags_prove_add_on_allocation,false);
assert.ok(partial.review_candidates.some((row)=>row.area==="add_on_allocation_readiness"));

const unclassified = buildServiceEconomicsAllocationMarginReviewReadiness({
  economics:{totals:{booking_count:1,ready_booking_count:1,review_booking_count:0,unavailable_booking_count:0,cogs_variance_booking_count:0},rows:[
    {package_code:"",evidence_status:"ready",revenue_evidence_status:"ready",material_evidence_status:"ready",labor_evidence_status:"ready",cash_evidence_status:"ready",cogs_reconciliation_status:"ready",recognized_revenue_cad:100,recorded_material_cost_cad:10,estimated_direct_labor_cad:20,direct_cogs_cad:10,pricing_review_contribution_cad:70}
  ]}, fleet, pricing, source_status
});
assert.equal(unclassified.economics.allocation_margin_readiness.service_package.unclassified_booking_count,1);
assert.equal(unclassified.economics.allocation_margin_readiness.service_package.service_package_margin_review_ready,false);
console.log("BUILD 473 SERVICE ECONOMICS ALLOCATION MARGIN REVIEW READINESS TEST: PASS");
