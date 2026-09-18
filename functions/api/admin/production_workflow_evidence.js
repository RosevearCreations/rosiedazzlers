// Build 419 — Customer & Staff Production Workflow Evidence
// Authenticated read-only composition. Existing evidence is classified; no customer/staff/business mutation occurs.

import { requireStaffAccess, json } from "../_lib/staff-auth.js";
import { listLaunchEvidence } from "../_lib/launch-readiness-evidence.js";
import { buildProductionWorkflowEvidence } from "../_lib/production-workflow-evidence.js";
import { onRequestPost as getJobHandoffEvidence } from "./job_handoff_evidence.js";

export async function onRequestGet({ request, env }) {
  const access = await requireStaffAccess({ request, env, capability: "it_diagnostics", allowLegacyAdminFallback: true });
  if (!access.ok) return access.response;
  const [launchResult, handoffResult] = await Promise.all([loadLaunchEvidence(env), loadJobHandoff(request, env)]);
  const evidence = buildProductionWorkflowEvidence({
    launch_evidence: launchResult.items,
    job_handoff: handoffResult,
    generated_at: new Date().toISOString()
  });
  return json({
    ok: true,
    build: 419,
    authority: "customer_staff_production_workflow_evidence",
    source_status: {
      launch_evidence: { available: launchResult.available, warning: launchResult.warning || null },
      job_handoff_evidence: { available: handoffResult.available, http_status: handoffResult.http_status, warning: handoffResult.warning || null }
    },
    evidence
  });
}
export async function onRequestHead(context) { const response=await onRequestGet(context); return new Response(null,{status:response.status,headers:response.headers}); }
export async function onRequestOptions() { return new Response(null,{status:204,headers:{"Cache-Control":"no-store",Allow:"GET, HEAD, OPTIONS"}}); }

async function loadLaunchEvidence(env) {
  try {
    const result=await listLaunchEvidence(env);
    return { available:result?.ready===true, items:Array.isArray(result?.items)?result.items:[], warning:result?.warning||null };
  } catch(error) {
    return { available:false, items:[], warning:error?.message||"Launch evidence is unavailable." };
  }
}
async function loadJobHandoff(request,env) {
  try {
    const headers=new Headers(request.headers);
    headers.set("Content-Type","application/json");
    const evidenceRequest=new Request(request.url,{method:"POST",headers,body:JSON.stringify({ days: 45 })});
    const response=await getJobHandoffEvidence({request:evidenceRequest,env});
    const data=await response.json().catch(()=>null);
    return {
      available:response.ok&&data?.ok===true,
      http_status:response.status,
      warning:response.ok?null:(data?.error||"Job-handoff evidence is unavailable to this operator/session."),
      summary:data?.summary||{},
      window:data?.window||{}
    };
  } catch(error) {
    return { available:false,http_status:503,warning:error?.message||"Job-handoff evidence is unavailable.",summary:{},window:{} };
  }
}
