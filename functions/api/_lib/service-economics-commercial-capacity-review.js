// Build 443 — aggregate, read-only service economics & commercial capacity review.
function n(value){const out=Number(value);return Number.isFinite(out)?out:0;}
function bool(value){return value===true;}
function clean(value){return String(value??"").trim();}
function sourceAvailable(source){return source?.available===true&&source?.restricted!==true;}

export function buildServiceEconomicsCommercialCapacityReview({economics={},fleet={},source_status={},generated_at=null}={}){
  const totals=economics?.totals||{},demand=fleet?.inquiry_demand||{},rules=fleet?.commercial_rules||{},operations=fleet?.operations||{},capacity=fleet?.capacity||{};
  const bookingCount=Math.max(0,n(totals.booking_count)),ready=Math.max(0,n(totals.ready_booking_count)),review=Math.max(0,n(totals.review_booking_count)),unavailable=Math.max(0,n(totals.unavailable_booking_count));
  const completenessPct=bookingCount>0?Math.round((ready/bookingCount)*1000)/10:null;
  const economicsAvailable=sourceAvailable(source_status?.service_economics),fleetAvailable=sourceAvailable(source_status?.fleet_commercial);
  const candidates=[];
  if(!economicsAvailable)candidates.push(candidate("profitability_source","unavailable","Profitability completeness evidence is unavailable.","Restore the authorized accounting statement evidence before drawing margin conclusions.","internal_evidence"));
  else if(bookingCount===0)candidates.push(candidate("profitability_sample","unavailable","No completed-job economics rows are available in the selected month.","Review another observed month or wait for completed-job evidence; do not infer margin from an empty sample.","observed_evidence"));
  else if(ready<bookingCount)candidates.push(candidate("profitability_completeness","review",ready+" of "+bookingCount+" job-economics rows are evidence-ready.","Resolve missing recorded material cost, labour-rate, cash/refund or COGS reconciliation evidence before relying on contribution figures.","observed_evidence"));
  if(economicsAvailable&&n(totals.cogs_variance_booking_count)>0)candidates.push(candidate("cogs_reconciliation","review",n(totals.cogs_variance_booking_count)+" job(s) have recorded job-use cost versus posted COGS variance.","Review existing Finance and inventory evidence; do not post an automatic correction from this review.","owner_action"));
  if(!fleetAvailable)candidates.push(candidate("commercial_source","unavailable","Fleet/commercial evidence is unavailable.","Restore the authorized fleet learning evidence before drawing demand or commercial-fit conclusions.","internal_evidence"));
  else{
    const unresolved=Math.max(0,n(rules.unresolved_domain_count));
    if(unresolved>0||rules.commercial_terms_complete!==true)candidates.push(candidate("commercial_rules","owner_action",unresolved+" commercial rule domain(s) remain unresolved.","Complete explicit owner review of cadence, pricing, discount, travel, invoicing and related terms before expanding commercial automation.","owner_action"));
    if(clean(capacity.status)!=="observed"||capacity.current_live_capacity_inferred!==true)candidates.push(candidate("live_capacity","unavailable","Current live capacity is not established by fleet demand or historical work.","Use the authoritative availability and checkout collision-revalidation flows for real scheduling decisions.","observed_evidence"));
    if(n(demand.inquiry_count)>0)candidates.push(candidate("commercial_demand","observed",n(demand.inquiry_count)+" fleet/commercial inquiry record(s) and "+n(demand.vehicles_requested)+" requested vehicle(s) are observed.","Treat demand as demand evidence only; do not convert it into signed business, margin or capacity claims.","observed_evidence"));
  }
  const sourcesReady=economicsAvailable&&fleetAvailable;
  const economicsComplete=economicsAvailable&&bookingCount>0&&ready===bookingCount&&review===0&&unavailable===0&&n(totals.cogs_variance_booking_count)===0;
  const commercialRulesComplete=fleetAvailable&&bool(rules.commercial_terms_complete)&&n(rules.unresolved_domain_count)===0;
  const liveCapacityObserved=fleetAvailable&&clean(capacity.status)==="observed"&&capacity.current_live_capacity_inferred===true;
  const evidenceStatus=!sourcesReady?"partial":economicsComplete&&commercialRulesComplete&&liveCapacityObserved?"observed":"review";
  return {
    build:443,mode:"service_economics_commercial_capacity_review",generated_at:generated_at||new Date().toISOString(),evidence_status:evidenceStatus,
    economics:{booking_count:bookingCount,ready_booking_count:ready,review_booking_count:review,unavailable_booking_count:unavailable,evidence_completeness_pct:completenessPct,cogs_variance_booking_count:Math.max(0,n(totals.cogs_variance_booking_count)),recognized_revenue_cad:n(totals.recognized_revenue_cad),recorded_material_cost_cad:n(totals.recorded_material_cost_cad),estimated_direct_labor_cad:n(totals.estimated_direct_labor_cad),pricing_review_contribution_cad:economicsComplete?n(totals.pricing_review_contribution_cad):null,contribution_reliable_for_review:economicsComplete,missing_evidence_blocks_margin_conclusion:!economicsComplete},
    commercial:{inquiry_count:Math.max(0,n(demand.inquiry_count)),vehicles_requested:Math.max(0,n(demand.vehicles_requested)),fleet_account_count:Math.max(0,n(operations.fleet_account_count)),active_vehicle_count:Math.max(0,n(operations.active_vehicle_count)),request_job_count:Math.max(0,n(operations.request_job_count)),completed_work_evidence_count:Math.max(0,n(operations.completed_work_evidence_count)),unresolved_rule_domain_count:Math.max(0,n(rules.unresolved_domain_count)),commercial_terms_complete:bool(rules.commercial_terms_complete),signed_business_inferred:false},
    capacity:{evidence_status:clean(capacity.status)||"unavailable",availability_authority:clean(capacity.availability_authority)||"/api/availability",collision_revalidation_authority:clean(capacity.collision_revalidation_authority)||"/api/checkout",current_live_capacity_inferred:false,booking_slot_reserved:false,capacity_claim_allowed:liveCapacityObserved},
    review_candidates:candidates,source_status,
    boundaries:{read_only:true,aggregate_only:true,customer_identity_exposed:false,raw_booking_ids_exposed:false,pricing_mutation_allowed:false,discount_mutation_allowed:false,fleet_approval_allowed:false,quote_acceptance_allowed:false,invoice_creation_allowed:false,booking_mutation_allowed:false,accounting_posting_allowed:false,inventory_posting_allowed:false,provider_transaction_allowed:false,permanent_polling_allowed:false,margin_inference_from_missing_evidence_allowed:false,capacity_inference_from_demand_allowed:false}
  };
}
function candidate(area,state,finding,bounded_operator_review,dependency){return{area,state,finding,bounded_operator_review,dependency,automatic_action_authorized:false};}


// Build 453 — additive service economics, capacity & pricing review over retained Build 443/451 authorities.
export function buildServiceEconomicsCapacityPricingReview({economics={},fleet={},pricing={},source_status={},generated_at=null}={}){
  const base=buildServiceEconomicsCommercialCapacityReview({economics,fleet,source_status,generated_at});
  const pricingAvailable=sourceAvailable(source_status?.pricing_learning);
  const quotes=pricing?.quotes||{}, bands=Array.isArray(quotes?.value_bands)?quotes.value_bands:[];
  const sufficientBands=bands.filter(row=>row?.review_cohort_sufficient===true).map(row=>({
    key:clean(row?.key)||"unclassified",label:clean(row?.label)||clean(row?.key)||"Unclassified",
    sent_quotes:Math.max(0,n(row?.sent_quotes)),accepted_quotes:Math.max(0,n(row?.accepted_quotes)),
    declined_quotes:Math.max(0,n(row?.declined_quotes)),unresolved_quotes:Math.max(0,n(row?.unresolved_quotes)),
    accepted_of_sent_pct:Number.isFinite(Number(row?.accepted_of_sent_pct))?Number(row.accepted_of_sent_pct):null,
    declined_of_sent_pct:Number.isFinite(Number(row?.declined_of_sent_pct))?Number(row.declined_of_sent_pct):null,
    review_cohort_sufficient:true
  }));
  const pricingEvidenceStatus=clean(pricing?.evidence_status)||(pricingAvailable?"partial":"unavailable");
  const pricingComplete=pricingAvailable&&pricingEvidenceStatus==="observed"&&quotes?.possibly_truncated!==true&&sufficientBands.length>0;
  const servicePackageCohorts=servicePackageEconomics(economics?.rows||[]);
  const candidates=[...(base.review_candidates||[])];

  if(!pricingAvailable)candidates.push(candidate("pricing_learning_source","unavailable","Aggregate booking/quote pricing-learning evidence is unavailable.","Restore the retained read-only booking/quote learning authority before combining pricing context with economics evidence.","internal_evidence"));
  else if(pricingEvidenceStatus!=="observed"||quotes?.possibly_truncated===true)candidates.push(candidate("pricing_learning_completeness","review","Pricing-learning evidence is partial or may be truncated.","Use the retained quote/funnel review as bounded context only; do not infer price sensitivity or change prices from incomplete evidence.","observed_evidence"));
  else if(!sufficientBands.length)candidates.push(candidate("pricing_sample","review","No quote-value band has the retained minimum review cohort.","Keep observing existing quote evidence; do not infer a price-band conversion pattern from very small samples.","observed_evidence"));
  else if(base.economics?.contribution_reliable_for_review)candidates.push(candidate("pricing_review_context","observed","Recorded economics are complete enough for review and at least one aggregate quote-value cohort is sufficiently observed.","Review economics and quote cohorts side by side only. They are not causally joined, and no price or discount change is authorized.","owner_action"));
  else candidates.push(candidate("pricing_review_blocked","review","Quote/pricing context exists, but recorded economics are not complete enough for a margin-backed pricing review.","Resolve missing material, labour, cash/refund and COGS evidence before relying on contribution figures.","observed_evidence"));

  if(Math.max(0,n(economics?.totals?.booking_count))>0)candidates.push(candidate("add_on_cost_attribution","unavailable","Retained profitability evidence does not allocate recorded material, labour or COGS to individual add-ons.","Treat add-on economics as unavailable until an owning evidence source records defensible add-on-level attribution; do not divide booking-level costs by assumption.","internal_evidence"));

  const allSourcesReady=sourceAvailable(source_status?.service_economics)&&sourceAvailable(source_status?.fleet_commercial)&&pricingAvailable;
  const evidenceStatus=!allSourcesReady?"partial":(base.evidence_status==="observed"&&pricingComplete?"observed":"review");
  return {
    build:453,authority:"service_economics_capacity_pricing_review",mode:"service_economics_capacity_pricing_review",
    retained_authorities:[428,443,451],generated_at:generated_at||new Date().toISOString(),evidence_status:evidenceStatus,
    economics:{...base.economics,service_package_cohorts:servicePackageCohorts,add_on_cost_attribution_status:"unavailable",add_on_margin_inferred:false},
    pricing_review:{
      evidence_status:pricingEvidenceStatus,
      quote_rows_observed:Math.max(0,n(quotes?.rows_observed)),
      sent_quotes:Math.max(0,n(quotes?.sent_quotes)),
      accepted_quotes:Math.max(0,n(quotes?.accepted_quotes)),
      declined_quotes:Math.max(0,n(quotes?.declined_quotes)),
      sufficient_value_band_count:sufficientBands.length,
      sufficient_value_bands:sufficientBands,
      booking_price_adjacent_stage:pricing?.booking?.largest_price_adjacent_stage_drop||null,
      review_ready:base.economics?.contribution_reliable_for_review===true&&pricingComplete,
      causal_price_sensitivity_claimed:false,
      service_margin_to_quote_band_join:false,
      pricing_change_authorized:false
    },
    commercial:base.commercial,capacity:base.capacity,review_candidates:candidates,source_status,
    truth_boundary:{
      missing_material_labor_cash_refund_cogs_blocks_margin:true,
      quote_decline_proves_price_sensitivity:false,
      stage_drop_proves_price_friction:false,
      demand_proves_capacity:false,
      demand_proves_signed_business:false,
      add_on_margin_without_attribution_allowed:false
    },
    boundaries:{...base.boundaries,read_only:true,aggregate_only:true,pricing_learning_causal_join_allowed:false,add_on_cost_inference_allowed:false,automatic_price_change_allowed:false,automatic_discount_allowed:false}
  };
}

function servicePackageEconomics(rows){
  const map=new Map();
  for(const row of Array.isArray(rows)?rows:[]){
    const key=clean(row?.package_code)||"unclassified";
    const current=map.get(key)||{package_code:key,booking_count:0,ready_booking_count:0,recognized_revenue_cad:0,pricing_review_contribution_cad:0,contribution_rows:0};
    current.booking_count+=1;
    if(clean(row?.evidence_status)==="ready")current.ready_booking_count+=1;
    const revenue=Number(row?.recognized_revenue_cad); if(Number.isFinite(revenue))current.recognized_revenue_cad+=revenue;
    const contribution=Number(row?.pricing_review_contribution_cad); if(Number.isFinite(contribution)){current.pricing_review_contribution_cad+=contribution;current.contribution_rows+=1;}
    map.set(key,current);
  }
  return [...map.values()].map(row=>({
    package_code:row.package_code,booking_count:row.booking_count,ready_booking_count:row.ready_booking_count,
    recognized_revenue_cad:Math.round(row.recognized_revenue_cad*100)/100,
    pricing_review_contribution_cad:row.booking_count>0&&row.ready_booking_count===row.booking_count&&row.contribution_rows===row.booking_count?Math.round(row.pricing_review_contribution_cad*100)/100:null,
    contribution_reliable_for_review:row.booking_count>0&&row.ready_booking_count===row.booking_count&&row.contribution_rows===row.booking_count
  })).sort((a,b)=>b.booking_count-a.booking_count||String(a.package_code).localeCompare(String(b.package_code))).slice(0,12);
}
