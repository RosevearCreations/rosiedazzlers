// Build 437 — Backup & Recovery Evidence Closure.
// Read-only wrapper over retained recovery/export operational proof.
import { onRequestGet as getRecoveryExportOperationalProof } from "./recovery_export_operational_proof.js";
import { buildBackupRecoveryEvidenceClosure } from "../_lib/backup-recovery-evidence-closure.js";
export async function onRequestGet({request,env}){
  const response=await getRecoveryExportOperationalProof({request:request.clone(),env});
  const payload=await response.json().catch(()=>null);
  if(response.status===401||response.status===403)return json({ok:false,build:437,authority:"backup_recovery_evidence_closure",error:"Unauthorized."},response.status);
  const generatedAt=new Date().toISOString();
  const evidence=buildBackupRecoveryEvidenceClosure({proof:response.ok?payload?.proof:null,source_available:response.ok&&Boolean(payload?.proof),generated_at:generatedAt});
  return json({ok:response.ok&&Boolean(payload?.proof),build:437,authority:"backup_recovery_evidence_closure",generated_at:generatedAt,retained_authority:payload?.authority||"backup_restore_accountant_export_operational_proof",source_status:{available:response.ok&&Boolean(payload?.proof),http_status:response.status,launch_evidence_available:payload?.source_status?.launch_evidence?.available===true,finance_acceptance_available:payload?.source_status?.finance_acceptance?.available===true},evidence},response.ok&&payload?.proof?200:503);
}
export async function onRequestHead(context){const response=await onRequestGet(context);return new Response(null,{status:response.status,headers:response.headers})}
export async function onRequestOptions(){return new Response(null,{status:204,headers:{"Cache-Control":"no-store",Allow:"GET, HEAD, OPTIONS"}})}
function json(value,status=200){return new Response(JSON.stringify(value),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Rosie-Backup-Recovery-Evidence":"build-437-read-only"}})}
