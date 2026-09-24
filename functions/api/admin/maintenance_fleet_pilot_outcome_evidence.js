// Build 491 — admin-only, GET-only maintenance/fleet pilot outcome evidence.
// Current endpoint never fabricates execution evidence. Missing execution evidence remains owner action.

import { onRequestGet as getOwnerApproval } from "./maintenance_fleet_owner_approval.js";
import { buildMaintenanceFleetPilotOutcomeEvidence } from "../_lib/maintenance-fleet-pilot-outcome-evidence.js";

export async function onRequestGet({request,env}) {
  const source = await getOwnerApproval({request:request.clone(),env});
  const payload = await source.json().catch(()=>null);
  if ([401,403].includes(source.status)) {
    return json({ok:false,error:"Unauthorized.",build:491,authority:"maintenance_fleet_pilot_outcome_evidence"},source.status);
  }
  const generatedAt = new Date().toISOString();
  const outcome = buildMaintenanceFleetPilotOutcomeEvidence({
    owner_approval: payload || {},
    execution_evidence: [],
    execution_source_available: false,
    generated_at: generatedAt
  });
  return json({
    ok: source.ok && Boolean(payload?.ok),
    build:491,
    authority:"maintenance_fleet_pilot_outcome_evidence",
    generated_at:generatedAt,
    pilot_outcome_evidence:outcome,
    source_status:{
      owner_approval:{available:source.ok&&Boolean(payload),http_status:source.status},
      execution_evidence:{available:false,status:"not_recorded"}
    }
  });
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
    "X-Rosie-Maintenance-Fleet-Pilot-Outcome":"build-491-read-only"
  }});
}
