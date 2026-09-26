// Build 511 — authenticated GET-only Maintenance & Fleet Pilot Continuation Decision.
// Composes retained Build 501 continuity evidence plus an optional explicit owner decision record.
// No decision returned here executes pilot continuation or mutates customer/business state.

import { onRequestGet as getContinuityReview } from "./maintenance_fleet_pilot_outcome_continuity_review.js";
import { buildMaintenanceFleetPilotContinuationDecision } from "../_lib/maintenance-fleet-pilot-continuation-decision.js";

export async function onRequestGet({ request, env }) {
  const source = await getContinuityReview({ request: request.clone(), env });
  const payload = await source.json().catch(()=>null);

  if ([401,403].includes(source.status)) {
    return json({
      ok:false,
      continuation_decision_build:511,
      continuation_decision_authority:"maintenance_fleet_pilot_continuation_decision",
      error:"Unauthorized."
    },source.status);
  }

  const generatedAt = new Date().toISOString();
  const continuity = payload?.pilot_outcome_continuity_review || {};
  const decisionRecord = parseDecisionRecord(env?.MAINTENANCE_FLEET_PILOT_CONTINUATION_DECISION_JSON);
  const decision = buildMaintenanceFleetPilotContinuationDecision({
    pilot_outcome_continuity_review: continuity,
    continuation_decision_record: decisionRecord,
    generated_at: generatedAt
  });

  return json({
    ok: source.ok && Boolean(payload?.ok),
    continuation_decision_build:511,
    continuation_decision_authority:"maintenance_fleet_pilot_continuation_decision",
    generated_at:generatedAt,
    pilot_outcome_continuity_review:continuity,
    continuation_decision_record:decisionRecord,
    maintenance_fleet_pilot_continuation_decision:decision,
    source_status:{
      pilot_outcome_continuity_review:{available:source.ok&&Boolean(payload),http_status:source.status},
      owner_continuation_decision:{available:Boolean(decisionRecord && Object.keys(decisionRecord).length)}
    }
  },200);
}
export async function onRequestHead(context){
  const response=await onRequestGet(context);
  return new Response(null,{status:response.status,headers:response.headers});
}
export async function onRequestOptions(){
  return new Response(null,{status:204,headers:{
    "Cache-Control":"no-store",
    "Access-Control-Allow-Methods":"GET,HEAD,OPTIONS",
    "Access-Control-Allow-Headers":"Content-Type"
  }});
}
function parseDecisionRecord(value){
  if (!value) return {};
  try {
    const parsed=JSON.parse(String(value));
    return parsed && typeof parsed==="object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}
function json(value,status=200){
  return new Response(JSON.stringify(value),{status,headers:{
    "Content-Type":"application/json; charset=utf-8",
    "Cache-Control":"no-store",
    "X-Rosie-Maintenance-Fleet-Pilot-Continuation-Decision":"build-511-read-only"
  }});
}
