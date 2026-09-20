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
