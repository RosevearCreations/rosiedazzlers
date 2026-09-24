// Build 490 — authenticated GET-only Recovery & Authenticated Device Evidence Continuity.
// Composes retained Build 477 recovery evidence and Build 478 authenticated device observations.
// No Production restore, drill execution, browser farm, remediation, HOLD mutation or business mutation.

import { onRequestGet as getRecoveryEvidence } from "./recovery_artifact_drill_evidence_review.js";
import { onRequestGet as getAuthenticatedDeviceEvidence } from "./authenticated_device_visual_acceptance.js";
import { buildRecoveryAuthenticatedDeviceEvidenceContinuity } from "../_lib/recovery-authenticated-device-evidence-continuity.js";

export async function onRequestGet({ request, env }) {
  const [recoveryResponse, deviceResponse] = await Promise.all([
    getRecoveryEvidence({ request: request.clone(), env }),
    getAuthenticatedDeviceEvidence({ request: request.clone(), env })
  ]);
  const [recoveryPayload, devicePayload] = await Promise.all([
    recoveryResponse.json().catch(()=>null),
    deviceResponse.json().catch(()=>null)
  ]);

  const authStatus=[recoveryResponse.status,deviceResponse.status].find(status=>status===401||status===403);
  if(authStatus){
    return json({
      ok:false,
      continuity_enrichment_build:490,
      continuity_authority:"recovery_authenticated_device_evidence_continuity",
      error:"Unauthorized."
    },authStatus);
  }

  const generatedAt=new Date().toISOString();
  const continuity=buildRecoveryAuthenticatedDeviceEvidenceContinuity({
    recovery: recoveryPayload || {},
    authenticated_device: devicePayload?.evidence || devicePayload || {},
    generated_at: generatedAt
  });

  return json({
    ok: recoveryResponse.ok && deviceResponse.ok && Boolean(recoveryPayload?.ok) && Boolean(devicePayload?.ok),
    continuity_enrichment_build:490,
    continuity_authority:"recovery_authenticated_device_evidence_continuity",
    generated_at:generatedAt,
    recovery_authenticated_device_evidence_continuity:continuity,
    source_status:{
      recovery:{available:recoveryResponse.ok&&Boolean(recoveryPayload?.ok),http_status:recoveryResponse.status},
      authenticated_device:{available:deviceResponse.ok&&Boolean(devicePayload?.ok),http_status:deviceResponse.status}
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
    "X-Rosie-Recovery-Device-Continuity":"build-490-read-only"
  }});
}
