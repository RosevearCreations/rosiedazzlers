#!/usr/bin/env node
import assert from "node:assert/strict";
import { buildServiceAddOnAllocationEvidenceClosure } from "../functions/api/_lib/service-addon-allocation-evidence-closure.js";

const source_status={service_economics:{available:true},fleet_commercial:{available:true},pricing_learning:{available:true}};
const fleet={inquiry_demand:{},commercial_rules:{unresolved_domain_count:0,commercial_terms_complete:true},operations:{},capacity:{status:"observed",current_live_capacity_inferred:true}};
const pricing={evidence_status:"observed",quotes:{rows_observed:1,sent_quotes:1,accepted_quotes:1,declined_quotes:0,possibly_truncated:false,value_bands:[]}};
const readyRow={package_code:"complete",evidence_status:"ready",revenue_evidence_status:"ready",material_evidence_status:"ready",labor_evidence_status:"ready",cash_evidence_status:"ready",cogs_reconciliation_status:"ready",recognized_revenue_cad:400,recorded_material_cost_cad:70,estimated_direct_labor_cad:100,direct_cogs_cad:70,pricing_review_contribution_cad:230};

const complete=buildServiceAddOnAllocationEvidenceClosure({
  economics:{
    totals:{booking_count:1,ready_booking_count:1,review_booking_count:0,unavailable_booking_count:0,cogs_variance_booking_count:0},
    rows:[readyRow],
    add_on_allocation_evidence:{recorded_basis:true,rows:[{add_on_code:"pet_hair",recorded_add_on_revenue:true,material_usage_linked_to_add_on:true,labor_time_linked_to_add_on:true,cash_refund_linked_to_add_on:true,posted_cogs_linked_to_add_on:true}]},
    seasonal_operability_evidence:{rows:[
      {service_code:"interior",classification:"cold_snap_capable",evidence_source:"service-process-record"},
      {service_code:"exterior_wash",classification:"temperature_limited_outdoor",evidence_source:"product-label",minimum_working_temperature_c:5,exact_temperature_claim_supported:true},
      {service_code:"ceramic",classification:"controlled_environment_required",evidence_source:"manufacturer-tds"}
    ]}
  },fleet,pricing,source_status
});
assert.equal(complete.allocation_closure_enrichment_build,483);
assert.equal(complete.economics.allocation_evidence_closure.status,"observed");
assert.equal(complete.economics.allocation_evidence_closure.service_package_closed,true);
assert.equal(complete.economics.allocation_evidence_closure.add_on_closed,true);
assert.equal(complete.economics.seasonal_operability.counts.cold_snap_capable,1);
assert.equal(complete.economics.seasonal_operability.rows[1].minimum_working_temperature_c,5);
assert.equal(complete.truth_boundary.inferred_temperature_threshold_allowed,false);
assert.equal(complete.boundaries.seasonal_operability_is_separate_from_margin,true);

const partial=buildServiceAddOnAllocationEvidenceClosure({
  economics:{
    totals:{booking_count:1,ready_booking_count:0,review_booking_count:1,unavailable_booking_count:0,cogs_variance_booking_count:1},
    rows:[{...readyRow,material_evidence_status:"review",recorded_material_cost_cad:null,cogs_reconciliation_status:"review",direct_cogs_cad:null,pricing_review_contribution_cad:null}],
    add_on_allocation_evidence:{recorded_basis:true,rows:[{add_on_code:"pet_hair",recorded_add_on_revenue:true,material_usage_linked_to_add_on:false,labor_time_linked_to_add_on:true,cash_refund_linked_to_add_on:true,posted_cogs_linked_to_add_on:true}]},
    seasonal_operability_evidence:{rows:[{service_code:"wash",classification:"temperature_limited_outdoor",evidence_source:""}]}
  },fleet,pricing,source_status
});
assert.equal(partial.economics.allocation_evidence_closure.status,"review");
assert.equal(partial.economics.allocation_evidence_closure.service_package_gap_count,1);
assert.equal(partial.economics.allocation_evidence_closure.add_on_gap_count,1);
assert.equal(partial.economics.seasonal_operability.status,"review");
assert.equal(partial.economics.seasonal_operability.valid_explicit_row_count,0);
assert.equal(partial.truth_boundary.allocation_gap_can_be_closed_by_equal_split,false);
console.log("BUILD 483 SERVICE ADD-ON ALLOCATION EVIDENCE CLOSURE TEST: PASS");
