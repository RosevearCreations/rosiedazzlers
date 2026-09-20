import { onRequestGet as getBackupRecoveryEvidenceClosure } from "./backup_recovery_evidence_closure.js";
import { buildRecoveryArtifactDrillEvidenceReview } from "../_lib/recovery-artifact-drill-evidence-review.js";
import { buildRecoveryEvidenceClosureDrillReadiness } from "../_lib/recovery-evidence-closure-drill-readiness.js";
export async function onRequestGet({request,env}){
 const response=await getBackupRecoveryEvidenceClosure({request:request.clone(),env});
 const payload=await response.json().catch(()=>null);
 if(response.status===401||response.status===403)return json({ok:false,build:447,authority:"recovery_artifact_drill_evidence_review",error:"Unauthorized."},response.status);
 const generatedAt=new Date().toISOString();
 const closure=payload?.evidence||{};
 const review=buildRecoveryArtifactDrillEvidenceReview({closure,generated_at:generatedAt});
 const closureReadiness=buildRecoveryEvidenceClosureDrillReadiness({
  closure,review,source_available:response.ok&&Boolean(payload?.evidence),generated_at:generatedAt
 });
 return json({ok:response.ok&&Boolean(payload?.evidence),build:447,authority:"recovery_artifact_drill_evidence_review",generated_at:generatedAt,
  retained_authority:payload?.authority||"backup_recovery_evidence_closure",
  current_readiness_authority:"recovery_evidence_closure_drill_readiness",
  review,closure_readiness:closureReadiness},response.ok&&payload?.evidence?200:503);
}
export async function onRequestHead(context){const response=await onRequestGet(context);return new Response(null,{status:response.status,headers:response.headers})}
export async function onRequestOptions(){return new Response(null,{status:204,headers:{"Cache-Control":"no-store",Allow:"GET, HEAD, OPTIONS"}})}
function json(value,status=200){return new Response(JSON.stringify(value),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Rosie-Recovery-Evidence":"build-447-read-only"}})}
