// Build 496 — bounded read-only Seasonal Capability Owner Review & Public Claim Decision endpoint.
// Retained Build 463 completeness/add-on-cost authority remains the base.
import { requireStaffAccess, json } from "../_lib/staff-auth.js";
import { onRequestGet as getAccountingStatement } from "./accounting_statement_report.js";
import { onRequestGet as getFleetLearning } from "./fleet_commercial_operations_learning.js";
import { onRequestGet as getPricingLearning } from "./booking_funnel_quote_pricing_learning.js";
import { buildSeasonalCapabilityOwnerReviewPublicClaimDecision } from "../_lib/seasonal-capability-owner-review-public-claim-decision.js";
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
  if(economicsSource.restricted||fleetSource.restricted)return json({ok:false,error:"Seasonal Capability Owner Review & Public Claim Decision requires the retained Administration/Finance and commercial evidence authorities.",source_status:sourceStatusMap(economicsSource,fleetSource,pricingSource)},403);
  const review=buildSeasonalCapabilityOwnerReviewPublicClaimDecision({
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
    authority:"seasonal_capability_owner_review_public_claim_decision",
    release_authority:"seasonal_capability_owner_review_public_claim_decision",
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
function readOnly(){return json({ok:false,error:"Seasonal Capability Owner Review & Public Claim Decision is read-only. Use the owning Finance, fleet, quote, booking and accounting workflows for explicit action."},405);}
