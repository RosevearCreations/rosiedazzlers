// Build 500 — authenticated GET-only Recovery Drill & Authenticated Device Observation Execution Evidence.
import { onRequestGet as getRecoveryEvidence } from "./recovery_artifact_drill_evidence_review.js";
import { onRequestGet as getRecoveryOperationalProof } from "./recovery_export_operational_proof.js";
import { onRequestGet as getAuthenticatedDeviceEvidence } from "./authenticated_device_visual_acceptance.js";
import { buildRecoveryAuthenticatedDeviceObservationExecutionEvidence } from "../_lib/recovery-authenticated-device-observation-execution-evidence.js";
export async function onRequestGet({request,env}){
  const [recoveryResponse,proofResponse,deviceResponse]=await Promise.all([getRecoveryEvidence({request:request.clone(),env}),getRecoveryOperationalProof({request:request.clone(),env}),getAuthenticatedDeviceEvidence({request:request.clone(),env})]);
  const [recoveryPayload,proofPayload,devicePayload]=await Promise.all([recoveryResponse.json().catch(()=>null),proofResponse.json().catch(()=>null),deviceResponse.json().catch(()=>null)]);
  const authStatus=[recoveryResponse.status,proofResponse.status,deviceResponse.status].find(status=>status===401||status===403);
  if(authStatus)return json({ok:false,execution_evidence_build:500,execution_evidence_authority:"recovery_authenticated_device_observation_execution_evidence",error:"Unauthorized."},authStatus);
  const generatedAt=new Date().toISOString();
  const evidence=buildRecoveryAuthenticatedDeviceObservationExecutionEvidence({recovery:{recovery_export_operational_proof:proofPayload?.proof||{},refresh_closure_review:recoveryPayload?.refresh_closure_review||{},validation_drill_decision_readiness:recoveryPayload?.validation_drill_decision_readiness||{}},authenticated_device:devicePayload?.evidence||devicePayload||{},generated_at:generatedAt});
  return json({ok:recoveryResponse.ok&&proofResponse.ok&&deviceResponse.ok&&Boolean(recoveryPayload?.ok)&&Boolean(proofPayload?.ok)&&Boolean(devicePayload?.ok),execution_evidence_build:500,execution_evidence_authority:"recovery_authenticated_device_observation_execution_evidence",generated_at:generatedAt,recovery_authenticated_device_observation_execution_evidence:evidence,source_status:{recovery:{available:recoveryResponse.ok&&Boolean(recoveryPayload?.ok),http_status:recoveryResponse.status},recovery_operational_proof:{available:proofResponse.ok&&Boolean(proofPayload?.ok),http_status:proofResponse.status},authenticated_device:{available:deviceResponse.ok&&Boolean(devicePayload?.ok),http_status:deviceResponse.status}}},200);
}
export async function onRequestHead(context){const response=await onRequestGet(context);return new Response(null,{status:response.status,headers:response.headers})}
export async function onRequestOptions(){return new Response(null,{status:204,headers:{"Cache-Control":"no-store","Access-Control-Allow-Methods":"GET,HEAD,OPTIONS","Access-Control-Allow-Headers":"Content-Type"}})}
function json(value,status=200){return new Response(JSON.stringify(value),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Rosie-Recovery-Device-Execution-Evidence":"build-500-read-only"}})}
