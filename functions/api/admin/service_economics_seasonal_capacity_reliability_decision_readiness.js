// Build 514 — authenticated GET-only Service Economics, Seasonal Capacity & Reliability Decision Readiness.
// Reuses the retained Build 504 continuity endpoint. No route method changes business/provider state.

import { onRequestGet as getTrendContinuity } from "./service_economics_seasonal_capacity_reliability_trend_continuity.js";
import { buildServiceEconomicsSeasonalCapacityReliabilityDecisionReadiness } from "../_lib/service-economics-seasonal-capacity-reliability-decision-readiness.js";

export async function onRequestGet({ request, env }) {
  const source = await getTrendContinuity({ request:request.clone(), env });
  const payload = await source.json().catch(() => null);

  if ([401,403].includes(source.status)) {
    return json({ ok:false, error:"Unauthorized.", decision_readiness_build:514 }, source.status);
  }

  const readiness = buildServiceEconomicsSeasonalCapacityReliabilityDecisionReadiness({
    trend_continuity:payload || {},
    generated_at:new Date().toISOString()
  });

  return json({
    ok:source.ok && Boolean(payload) && readiness.status !== "evidence_sources_unavailable",
    decision_readiness_build:514,
    decision_readiness_authority:"service_economics_seasonal_capacity_reliability_decision_readiness",
    service_economics_seasonal_capacity_reliability_decision_readiness:readiness,
    source_status:{
      retained_build504_continuity:{
        available:source.ok && Boolean(payload),
        http_status:source.status,
        retained_status:payload?.review_status || null
      }
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

function json(value,status=200) {
  return new Response(JSON.stringify(value),{status,headers:{
    "Content-Type":"application/json; charset=utf-8",
    "Cache-Control":"no-store",
    "X-Rosie-Service-Economics-Decision-Readiness":"build-514-read-only"
  }});
}
