// Build 483 — additive Service & Add-On Allocation Evidence Closure authority.
import { buildServiceEconomicsAllocationMarginReviewReadiness } from "./service-economics-allocation-margin-review-readiness.js";

const OPERABILITY = new Set(["cold_snap_capable","temperature_limited_outdoor","controlled_environment_required"]);

function clean(value){ return String(value ?? "").trim(); }
function explicitRows(economics){
  const source=economics?.seasonal_operability_evidence;
  return Array.isArray(source?.rows)?source.rows:[];
}
function seasonalOperability(economics={}){
  const rows=explicitRows(economics);
  const items=[];
  let invalid=0;
  for(const row of rows){
    const serviceCode=clean(row?.service_code || row?.package_code || row?.add_on_code);
    const classification=clean(row?.classification).toLowerCase();
    const sourceRef=clean(row?.evidence_source || row?.source_reference);
    if(!serviceCode || !OPERABILITY.has(classification) || !sourceRef){ invalid+=1; continue; }
    const minTemp = row?.minimum_working_temperature_c;
    const maxTemp = row?.maximum_working_temperature_c;
    items.push({
      service_code:serviceCode,
      classification,
      evidence_source:sourceRef,
      minimum_working_temperature_c:Number.isFinite(Number(minTemp))?Number(minTemp):null,
      maximum_working_temperature_c:Number.isFinite(Number(maxTemp))?Number(maxTemp):null,
      exact_temperature_claim_supported:
        row?.exact_temperature_claim_supported===true &&
        (Number.isFinite(Number(minTemp)) || Number.isFinite(Number(maxTemp))),
      automatic_booking_change_authorized:false,
      public_claim_authorized:false
    });
  }
  const counts={cold_snap_capable:0,temperature_limited_outdoor:0,controlled_environment_required:0};
  for(const item of items) counts[item.classification]+=1;
  return {
    status:rows.length===0?"unavailable":invalid===0?"observed":"review",
    recorded_row_count:rows.length,
    valid_explicit_row_count:items.length,
    invalid_or_unattributed_row_count:invalid,
    counts,
    rows:items,
    source_required:true,
    inferred_temperature_thresholds_allowed:false,
    weather_classification_proves_margin:false,
    margin_evidence_proves_winter_operability:false
  };
}

function missingServiceLinks(service={}){
  const out=[];
  for(const cohort of service.cohorts||[]){
    if(cohort.margin_review_ready) continue;
    const missing=[];
    for(const [key,count] of Object.entries(cohort.component_linked_booking_counts||{})){
      if(Number(count||0)<Number(cohort.booking_count||0)) missing.push(key);
    }
    out.push({service_code:cohort.package_code,booking_count:cohort.booking_count||0,missing_components:missing});
  }
  return out;
}
function missingAddOnLinks(addOn={}){
  const out=[];
  for(const cohort of addOn.cohorts||[]){
    if(cohort.margin_review_ready) continue;
    const missing=[];
    for(const [key,count] of Object.entries(cohort.component_linked_row_counts||{})){
      if(Number(count||0)<Number(cohort.evidence_row_count||0)) missing.push(key);
    }
    out.push({add_on_code:cohort.add_on_code,evidence_row_count:cohort.evidence_row_count||0,missing_components:missing});
  }
  return out;
}

export function buildServiceAddOnAllocationEvidenceClosure({
  economics={}, fleet={}, pricing={}, source_status={}, generated_at=null
}={}){
  const base=buildServiceEconomicsAllocationMarginReviewReadiness({economics,fleet,pricing,source_status,generated_at});
  const service=base.economics?.allocation_margin_readiness?.service_package||{};
  const addOn=base.economics?.allocation_margin_readiness?.add_on||{};
  const serviceGaps=missingServiceLinks(service);
  const addOnGaps=missingAddOnLinks(addOn);
  const serviceClosed=service.service_package_margin_review_ready===true && serviceGaps.length===0;
  const addOnClosed=addOn.add_on_margin_review_ready===true && addOnGaps.length===0;
  const closureStatus=
    service.status==="unavailable" && addOn.status==="unavailable" ? "unavailable" :
    serviceClosed && addOnClosed ? "observed" : "review";
  const seasonal=seasonalOperability(economics);
  const candidates=(base.review_candidates||[]).slice();
  candidates.push({
    area:"service_add_on_allocation_evidence_closure",
    state:closureStatus,
    finding:serviceClosed&&addOnClosed
      ?"Recorded service/package and add-on allocation linkage is complete for the observed bounded cohorts."
      :"One or more service/package or add-on cohorts still lack explicit recorded allocation linkage.",
    bounded_operator_review:"Close only the explicitly evidenced cohort gaps. Do not allocate from booking totals, percentages, equal splits or price weighting.",
    dependency:serviceClosed&&addOnClosed?"owner_action":"observed_evidence",
    automatic_action_authorized:false
  });
  candidates.push({
    area:"seasonal_operability_evidence",
    state:seasonal.status,
    finding:seasonal.status==="observed"
      ?seasonal.valid_explicit_row_count+" explicitly sourced seasonal-operability row(s) are available for separate review."
      :"Seasonal operability remains unavailable or incomplete without explicit service/product/equipment/site evidence.",
    bounded_operator_review:"Keep cold-snap capability, temperature-limited outdoor work and controlled-environment requirements separate from margin evidence. Never invent a working-temperature threshold.",
    dependency:seasonal.status==="observed"?"owner_action":"observed_evidence",
    automatic_action_authorized:false
  });
  return {
    ...base,
    allocation_closure_enrichment_build:483,
    allocation_closure_authority:"service_addon_allocation_evidence_closure",
    retained_allocation_authority:"service_economics_allocation_margin_review_readiness",
    evidence_status:closureStatus==="unavailable"?base.evidence_status:closureStatus,
    economics:{
      ...base.economics,
      allocation_evidence_closure:{
        status:closureStatus,
        service_package_closed:serviceClosed,
        add_on_closed:addOnClosed,
        service_package_gap_count:serviceGaps.length,
        add_on_gap_count:addOnGaps.length,
        service_package_gaps:serviceGaps,
        add_on_gaps:addOnGaps,
        automatic_margin_conclusion_authorized:false
      },
      seasonal_operability:seasonal
    },
    review_candidates:candidates,
    truth_boundary:{
      ...base.truth_boundary,
      allocation_gap_can_be_closed_by_booking_total:false,
      allocation_gap_can_be_closed_by_equal_split:false,
      allocation_gap_can_be_closed_by_percentage:false,
      allocation_gap_can_be_closed_by_price_weighting:false,
      seasonal_operability_proves_margin:false,
      margin_proves_seasonal_operability:false,
      inferred_temperature_threshold_allowed:false
    },
    boundaries:{
      ...base.boundaries,
      read_only:true,
      seasonal_operability_is_separate_from_margin:true,
      automatic_booking_availability_change_allowed:false,
      automatic_public_winter_claim_allowed:false,
      automatic_price_or_discount_change_allowed:false,
      schema_mutation_allowed:false,
      permanent_polling:false
    }
  };
}
