// Builds 511/521 — authenticated GET-only Maintenance & Fleet continuation decision + outcome continuity.
// Composes retained Build 501 evidence, an optional explicit Build 511 owner decision and an optional Build 521 outcome record.
// No response from this endpoint executes continuation or mutates customer/business state.

import { onRequestGet as getContinuityReview } from "./maintenance_fleet_pilot_outcome_continuity_review.js";
import { buildMaintenanceFleetPilotContinuationDecision } from "../_lib/maintenance-fleet-pilot-continuation-decision.js";
import { buildMaintenanceFleetContinuationOutcomeContinuity } from "../_lib/maintenance-fleet-continuation-outcome-continuity.js";
import { buildMaintenanceFleetContinuationEvidenceFreshnessReview } from "../_lib/maintenance-fleet-continuation-evidence-freshness-review.js";

export async function onRequestGet({ request, env }) {
  const source = await getContinuityReview({ request: request.clone(), env });
  const payload = await source.json().catch(()=>null);

  if ([401,403].includes(source.status)) {
    return json({
      ok:false,
      continuation_decision_build:511,
      continuation_decision_authority:"maintenance_fleet_pilot_continuation_decision",
      continuation_outcome_build:521,
      continuation_outcome_authority:"maintenance_fleet_continuation_outcome_continuity",
      maintenance_fleet_continuation_freshness_build:531,
      maintenance_fleet_continuation_freshness_authority:"maintenance_fleet_continuation_evidence_freshness_review",
      error:"Unauthorized."
    },source.status);
  }

  const generatedAt = new Date().toISOString();
  const continuity = payload?.pilot_outcome_continuity_review || {};
  const pilotOutcomeEvidence = payload?.pilot_outcome_evidence || {};
  const decisionRecord = parseJsonObject(env?.MAINTENANCE_FLEET_PILOT_CONTINUATION_DECISION_JSON);
  const decision = buildMaintenanceFleetPilotContinuationDecision({
    pilot_outcome_continuity_review: continuity,
    continuation_decision_record: decisionRecord,
    generated_at: generatedAt
  });
  const outcomeRecord = parseJsonObject(env?.MAINTENANCE_FLEET_CONTINUATION_OUTCOME_JSON);
  const outcome = buildMaintenanceFleetContinuationOutcomeContinuity({
    pilot_continuation_decision: decision,
    continuation_outcome_record: outcomeRecord,
    generated_at: generatedAt
  });
  const freshness = buildMaintenanceFleetContinuationEvidenceFreshnessReview({
    continuation_outcome: outcome,
    pilot_outcome_evidence: pilotOutcomeEvidence,
    generated_at: generatedAt,
    freshness_window_days: 30
  });

  return json({
    ok: source.ok && Boolean(payload?.ok),
    continuation_decision_build:511,
    continuation_decision_authority:"maintenance_fleet_pilot_continuation_decision",
    continuation_outcome_build:521,
    continuation_outcome_authority:"maintenance_fleet_continuation_outcome_continuity",
    maintenance_fleet_continuation_freshness_build:531,
    maintenance_fleet_continuation_freshness_authority:"maintenance_fleet_continuation_evidence_freshness_review",
    generated_at:generatedAt,
    pilot_outcome_evidence:pilotOutcomeEvidence,
    pilot_outcome_continuity_review:continuity,
    continuation_decision_record:decisionRecord,
    maintenance_fleet_pilot_continuation_decision:decision,
    continuation_outcome_record:outcomeRecord,
    maintenance_fleet_continuation_outcome_continuity:outcome,
    maintenance_fleet_continuation_evidence_freshness_review:freshness,
    source_status:{
      pilot_outcome_continuity_review:{available:source.ok&&Boolean(payload),http_status:source.status},
      pilot_outcome_evidence:{available:Boolean(pilotOutcomeEvidence && Object.keys(pilotOutcomeEvidence).length),status:pilotOutcomeEvidence?.status||"unavailable"},
      owner_continuation_decision:{available:Boolean(decisionRecord && Object.keys(decisionRecord).length)},
      owner_continuation_outcome:{available:Boolean(outcomeRecord && Object.keys(outcomeRecord).length)}
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
function parseJsonObject(value){
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
    "X-Rosie-Maintenance-Fleet-Pilot-Continuation-Decision":"build-511-read-only",
    "X-Rosie-Maintenance-Fleet-Continuation-Outcome":"build-521-read-only",
    "X-Rosie-Maintenance-Fleet-Continuation-Freshness":"build-531-read-only"
  }});
}
