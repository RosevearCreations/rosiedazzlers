// Build 501 — authenticated GET-only Maintenance & Fleet Pilot Outcome Continuity Review.
// Composes retained Build 491 evidence; does not activate a pilot, recurring billing or reserved capacity.

import { onRequestGet as getPilotOutcomeEvidence } from "./maintenance_fleet_pilot_outcome_evidence.js";
import { buildMaintenanceFleetPilotOutcomeContinuityReview } from "../_lib/maintenance-fleet-pilot-outcome-continuity-review.js";

export async function onRequestGet({ request, env }) {
  const source = await getPilotOutcomeEvidence({ request:request.clone(), env });
  const payload = await source.json().catch(()=>null);

  if ([401,403].includes(source.status)) {
    return json({
      ok:false,
      continuity_review_build:501,
      continuity_authority:"maintenance_fleet_pilot_outcome_continuity_review",
      error:"Unauthorized."
    },source.status);
  }

  const generatedAt = new Date().toISOString();
  const pilotOutcome = payload?.pilot_outcome_evidence || {};
  const continuity = buildMaintenanceFleetPilotOutcomeContinuityReview({
    pilot_outcome_evidence: pilotOutcome,
    generated_at: generatedAt
  });

  return json({
    ok: source.ok && Boolean(payload?.ok),
    continuity_review_build:501,
    continuity_authority:"maintenance_fleet_pilot_outcome_continuity_review",
    generated_at:generatedAt,
    pilot_outcome_evidence:pilotOutcome,
    pilot_outcome_continuity_review:continuity,
    source_status:{
      pilot_outcome_evidence:{available:source.ok&&Boolean(payload),http_status:source.status}
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
function json(value,status=200){
  return new Response(JSON.stringify(value),{status,headers:{
    "Content-Type":"application/json; charset=utf-8",
    "Cache-Control":"no-store",
    "X-Rosie-Maintenance-Fleet-Pilot-Continuity":"build-501-read-only"
  }});
}
