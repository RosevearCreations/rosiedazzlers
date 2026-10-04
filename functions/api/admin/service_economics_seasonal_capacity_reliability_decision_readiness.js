// Build 514/524/534 — authenticated GET-only Service Economics, Seasonal Capacity & Reliability Decision Readiness + Decision Outcome Continuity + Evidence Freshness Review.
// Reuses retained Build 504 continuity plus optional explicit human decision outcomes. No route method changes business/provider state.

import { onRequestGet as getTrendContinuity } from "./service_economics_seasonal_capacity_reliability_trend_continuity.js";
import { buildServiceEconomicsSeasonalCapacityReliabilityDecisionReadiness } from "../_lib/service-economics-seasonal-capacity-reliability-decision-readiness.js";
import { buildServiceEconomicsSeasonalCapacityReliabilityDecisionOutcomeContinuity } from "../_lib/service-economics-seasonal-capacity-reliability-decision-outcome-continuity.js";
import { buildServiceEconomicsSeasonalCapacityReliabilityEvidenceFreshnessReview } from "../_lib/service-economics-seasonal-capacity-reliability-evidence-freshness-review.js";

export async function onRequestGet({ request, env }) {
  const source = await getTrendContinuity({ request:request.clone(), env });
  const payload = await source.json().catch(() => null);

  if ([401,403].includes(source.status)) {
    return json({ ok:false, error:"Unauthorized.", decision_readiness_build:514, decision_outcome_build:524, service_economics_seasonal_capacity_reliability_freshness_build:534 }, source.status);
  }

  const generatedAt=new Date().toISOString();
  const readiness = buildServiceEconomicsSeasonalCapacityReliabilityDecisionReadiness({
    trend_continuity:payload || {},
    generated_at:generatedAt
  });
  const outcomeRecords=parseObject(env?.SERVICE_ECONOMICS_SEASONAL_CAPACITY_RELIABILITY_DECISION_OUTCOME_JSON);
  const outcomeContinuity=buildServiceEconomicsSeasonalCapacityReliabilityDecisionOutcomeContinuity({
    decision_readiness:readiness,
    decision_outcome_records:outcomeRecords,
    generated_at:generatedAt
  });
  const freshnessReview=buildServiceEconomicsSeasonalCapacityReliabilityEvidenceFreshnessReview({
    decision_outcome_continuity:outcomeContinuity,
    decision_readiness:readiness,
    trend_continuity:payload || {},
    generated_at:generatedAt,
    freshness_window_days:30
  });

  return json({
    ok:source.ok && Boolean(payload) && readiness.status !== "evidence_sources_unavailable",
    decision_readiness_build:514,
    decision_readiness_authority:"service_economics_seasonal_capacity_reliability_decision_readiness",
    service_economics_seasonal_capacity_reliability_decision_readiness:readiness,
    decision_outcome_build:524,
    decision_outcome_authority:"service_economics_seasonal_capacity_reliability_decision_outcome_continuity",
    service_economics_seasonal_capacity_reliability_decision_outcome_continuity:outcomeContinuity,
    service_economics_seasonal_capacity_reliability_freshness_build:534,
    service_economics_seasonal_capacity_reliability_freshness_authority:"service_economics_seasonal_capacity_reliability_evidence_freshness_review",
    service_economics_seasonal_capacity_reliability_evidence_freshness_review:freshnessReview,
    source_status:{
      retained_build504_continuity:{
        available:source.ok && Boolean(payload),
        http_status:source.status,
        retained_status:payload?.review_status || null
      },
      human_decision_outcome:{available:Boolean(env?.SERVICE_ECONOMICS_SEASONAL_CAPACITY_RELIABILITY_DECISION_OUTCOME_JSON)}
    }
  });
}

export async function onRequestHead(context) {
  const response=await onRequestGet(context);
  return new Response(null,{status:response.status,headers:response.headers});
}
export async function onRequestOptions() {
  return new Response("",{status:204,headers:{
    "Access-Control-Allow-Methods":"GET,HEAD,OPTIONS",
    "Access-Control-Allow-Headers":"Content-Type",
    "Cache-Control":"no-store"
  }});
}

function parseObject(value){
  if(!value) return {};
  try{
    const parsed=JSON.parse(String(value));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  }catch{return {};}
}

function json(value,status=200) {
  return new Response(JSON.stringify(value),{status,headers:{
    "Content-Type":"application/json; charset=utf-8",
    "Cache-Control":"no-store",
    "X-Rosie-Service-Economics-Decision-Readiness":"build-514-read-only",
    "X-Rosie-Service-Economics-Decision-Outcome":"build-524-read-only",
    "X-Rosie-Service-Economics-Evidence-Freshness":"build-534-read-only"
  }});
}
