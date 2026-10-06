// Build 536 — bounded read-only Seasonal Capability & Public Claim Evidence Integrity Review endpoint.
// Retained Build 528/527/526 freshness authorities and earlier seasonal/routing evidence remain in the composed evidence base.
import { requireStaffAccess, json } from "../_lib/staff-auth.js";
import { onRequestGet as getAccountingStatement } from "./accounting_statement_report.js";
import { onRequestGet as getFleetLearning } from "./fleet_commercial_operations_learning.js";
import { onRequestGet as getPricingLearning } from "./booking_funnel_quote_pricing_learning.js";
import { buildSeasonalCapabilityPublicClaimEvidenceIntegrityReview } from "../_lib/seasonal-capability-public-claim-evidence-integrity-review.js";
// Retained Build 528 endpoint marker: buildControlledEnvironmentRoutingOutcomeFreshnessCapacityReview · authority:"controlled_environment_routing_outcome_freshness_capacity_review"
// Retained Build 527 endpoint markers: buildWinterBookingQuoteRuleOutcomeFreshnessReview · authority:"winter_booking_quote_rule_outcome_freshness_review" · retained_winter_rule_outcome_authority:"winter_booking_quote_rule_controlled_activation_outcome_continuity"
// Retained Build 526 endpoint markers: buildSeasonalCapabilityPublicClaimOutcomeFreshnessReview · authority:"seasonal_capability_public_claim_outcome_freshness_review" · retained_public_claim_outcome_authority:"seasonal_capability_public_claim_decision_outcome_continuity" · retained_controlled_environment_routing_outcome_authority:"controlled_environment_routing_outcome_evidence_continuity"
// Retained Build 518 runtime marker: buildControlledEnvironmentRoutingOutcomeEvidenceContinuity · authority:"controlled_environment_routing_outcome_evidence_continuity" · retained_predecessor_authority:"winter_booking_quote_rule_controlled_activation_outcome_continuity" · retained_operational_readiness_authority:"controlled_environment_operational_readiness_routing_continuity"
// Retained Build 517 marker: buildWinterBookingQuoteRuleControlledActivationOutcomeContinuity · authority:"winter_booking_quote_rule_controlled_activation_outcome_continuity"
// Retained Build 516 marker: buildSeasonalCapabilityPublicClaimDecisionOutcomeContinuity · authority:"seasonal_capability_public_claim_decision_outcome_continuity"
// Retained Build 508 compatibility marker: buildControlledEnvironmentOperationalReadinessRoutingContinuity · authority:"controlled_environment_operational_readiness_routing_continuity"
// Retained Build 507 marker: buildWinterBookingQuoteRuleControlledActivationDecision
// Retained Build 506 marker: buildSeasonalCapabilityPublicClaimActivationDecision
// Retained Build 498 marker: buildControlledEnvironmentSiteQualificationServiceRoutingEvidence
// Retained Build 497 marker: buildWinterBookingQuoteRuleActivationReadiness
// Retained Build 496 marker: buildSeasonalCapabilityOwnerReviewPublicClaimDecision
// Retained Build 488 marker: buildControlledEnvironmentWeatherSafeRouting
// Retained Build 487 marker: buildWinterBookingEligibilityCustomerTransparency
// Retained Build 486 marker: buildColdWeatherServiceCapabilityEvidenceMatrix
// Retained Build 483 marker: buildServiceAddOnAllocationEvidenceClosure
// Retained Build 473 marker: buildServiceEconomicsAllocationMarginReviewReadiness
 // Retained source-authority markers: buildServiceEconomicsCompletenessAddOnCostReadiness · release_authority:"service_economics_completeness_addon_cost_readiness"
 // Retained source-authority markers: buildServiceEconomicsCapacityPricingReview · authority:"service_economics_capacity_pricing_review"

const SOURCE_TIMEOUT_MS=12000;

export async function onRequestGet({request,env}){
  const access=await requireStaffAccess({request,env,body:{},capability:"manage_staff",allowLegacyAdminFallback:false});
  if(!access.ok)return access.response;
  const url=new URL(request.url),now=new Date(),month=Math.max(1,Math.min(12,Number(url.searchParams.get("month")||(now.getMonth()+1)))),year=Math.max(2020,Math.min(2100,Number(url.searchParams.get("year")||now.getFullYear()))),days=Math.max(7,Math.min(365,Number(url.searchParams.get("days")||90)));
  const accountingRequest=requestWithQuery(request,{month:String(month),year:String(year)}),pricingRequest=requestWithQuery(request,{days:String(days)});
  const [economicsSource,fleetSource,pricingSource]=await Promise.all([
    collect("service_economics",()=>getAccountingStatement({request:accountingRequest,env})),
    collect("fleet_commercial",()=>getFleetLearning({request:request.clone(),env})),
    collect("pricing_learning",()=>getPricingLearning({request:pricingRequest,env}))
  ]);
  if(economicsSource.restricted||fleetSource.restricted)return json({ok:false,error:"Controlled-Environment Routing Outcome Evidence Continuity requires the retained Administration/Finance and commercial evidence authorities.",source_status:sourceStatusMap(economicsSource,fleetSource,pricingSource)},403);
  const review=buildSeasonalCapabilityPublicClaimEvidenceIntegrityReview({
    economics:economicsSource.data?.operational_profitability||{},
    fleet:fleetSource.data?.learning||{},
    pricing:pricingSource.data||{},
    source_status:sourceStatusMap(economicsSource,fleetSource,pricingSource),
    generated_at:new Date().toISOString()
  });
  return json({
    ok:review.evidence_status!=="unavailable",
    month,
    year,
    pricing_window_days:days,
    ...review,
    authority:"seasonal_capability_public_claim_evidence_integrity_review",
    release_authority:"seasonal_capability_public_claim_evidence_integrity_review",
    retained_seasonal_public_claim_freshness_authority:"seasonal_capability_public_claim_outcome_freshness_review",
    retained_routing_outcome_authority:"controlled_environment_routing_outcome_evidence_continuity",
    retained_winter_rule_outcome_authority:"winter_booking_quote_rule_controlled_activation_outcome_continuity",
    retained_controlled_environment_routing_outcome_authority:"controlled_environment_routing_outcome_evidence_continuity",
    retained_predecessor_authority:"winter_booking_quote_rule_controlled_activation_outcome_continuity",
    retained_public_claim_outcome_authority:"seasonal_capability_public_claim_decision_outcome_continuity",
    retained_operational_readiness_authority:"controlled_environment_operational_readiness_routing_continuity",
    retained_controlled_activation_decision_authority:"winter_booking_quote_rule_controlled_activation_decision",
    retained_public_claim_activation_authority:"seasonal_capability_public_claim_activation_decision",
    retained_owner_public_claim_authority:"seasonal_capability_owner_review_public_claim_decision",
    retained_site_qualification_authority:"controlled_environment_site_qualification_service_routing_evidence",
    retained_activation_readiness_authority:"winter_booking_quote_rule_activation_readiness",
    retained_customer_transparency_authority:"winter_booking_eligibility_customer_transparency",
    retained_owner_review_authority:"seasonal_capability_owner_review_public_claim_decision",
    retained_availability_authority:"/api/availability",
    retained_checkout_collision_authority:"checkout_server_side_collision_revalidation",
    retained_weather_safe_routing_authority:"controlled_environment_alternatives_weather_safe_routing",
    retained_winter_eligibility_authority:"winter_booking_eligibility_customer_transparency",
    retained_capability_authority:"cold_weather_service_capability_evidence_matrix",
    retained_seasonal_authority:"service_addon_allocation_evidence_closure",
    retained_allocation_authority:"service_economics_allocation_margin_review_readiness",
    retained_authority:"service_economics_completeness_addon_cost_readiness"
  });
}
export async function onRequestPost(){return readOnly();}
export async function onRequestPut(){return readOnly();}
export async function onRequestPatch(){return readOnly();}
export async function onRequestDelete(){return readOnly();}
export async function onRequestOptions(){return new Response("",{status:204,headers:{"Access-Control-Allow-Methods":"GET,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"}});}
async function collect(name,runner){let timer;try{const response=await Promise.race([Promise.resolve().then(runner),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error("source_timeout")),SOURCE_TIMEOUT_MS);})]);const data=await response.json().catch(()=>null);return{name,available:response.ok&&Boolean(data),restricted:response.status===401||response.status===403,status:response.status,data,error_class:null};}catch(error){return{name,available:false,restricted:false,status:503,data:null,error_class:error?.message==="source_timeout"?"timeout":(error?.name||"Error")};}finally{if(timer)clearTimeout(timer);}}
function sourceStatusMap(economics,fleet,pricing){return{service_economics:sourceState(economics),fleet_commercial:sourceState(fleet),pricing_learning:sourceState(pricing)};}
function sourceState(row){return{available:row?.available===true,restricted:row?.restricted===true,http_status:Number(row?.status)||null,error_class:row?.error_class||null};}
function requestWithQuery(request,values){const url=new URL(request.url);for(const [key,value] of Object.entries(values))url.searchParams.set(key,value);return new Request(url.toString(),request);}
function readOnly(){return json({ok:false,error:"Seasonal Capability & Public Claim Evidence Integrity Review is read-only. Publication, booking/availability, quote rules, source-owned limits and canonical HOLD changes remain separate explicit manual actions."},405);}
