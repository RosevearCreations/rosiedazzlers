// Build 510 — authenticated GET-only Recovery Drill & Authenticated Device Closure Review.
import { onRequestGet as getExecutionEvidence } from "./recovery_authenticated_device_observation_execution_evidence.js";
import { buildRecoveryAuthenticatedDeviceClosureReview } from "../_lib/recovery-authenticated-device-closure-review.js";

export async function onRequestGet({request,env}) {
  const executionResponse = await getExecutionEvidence({request:request.clone(),env});
  const executionPayload = await executionResponse.json().catch(()=>null);
  if (executionResponse.status === 401 || executionResponse.status === 403) {
    return json({ok:false,closure_review_build:510,closure_review_authority:"recovery_authenticated_device_closure_review",error:"Unauthorized."},executionResponse.status);
  }
  const generatedAt = new Date().toISOString();
  const closureReview = buildRecoveryAuthenticatedDeviceClosureReview({
    execution_evidence: executionPayload?.recovery_authenticated_device_observation_execution_evidence || {},
    generated_at: generatedAt
  });
  return json({
    ok: executionResponse.ok && Boolean(executionPayload?.ok),
    closure_review_build:510,
    closure_review_authority:"recovery_authenticated_device_closure_review",
    generated_at:generatedAt,
    recovery_authenticated_device_closure_review:closureReview,
    source_status:{
      execution_evidence:{
        available:executionResponse.ok && Boolean(executionPayload?.ok),
        http_status:executionResponse.status
      }
    }
  },200);
}
export async function onRequestHead(context){const response=await onRequestGet(context);return new Response(null,{status:response.status,headers:response.headers})}
export async function onRequestOptions(){return new Response(null,{status:204,headers:{"Cache-Control":"no-store","Access-Control-Allow-Methods":"GET,HEAD,OPTIONS","Access-Control-Allow-Headers":"Content-Type"}})}
function json(value,status=200){return new Response(JSON.stringify(value),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Rosie-Recovery-Device-Closure-Review":"build-510-read-only"}})}
