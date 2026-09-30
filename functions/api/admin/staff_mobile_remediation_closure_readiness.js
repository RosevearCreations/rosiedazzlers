// Build 513/523 — authenticated GET-only Staff & Mobile Remediation Closure Readiness + Outcome Continuity.
// Reuses retained Build 503 learning evidence, optional attributable closure follow-up evidence and explicit manual closure outcomes.
// No route method performs remediation, automatic closure, role changes, outreach, HOLD mutation, or telemetry.

import { onRequestGet as getLearning } from "./staff_support_mobile_efficiency_learning.js";
import { buildStaffMobileRemediationClosureReadiness } from "../_lib/staff-mobile-remediation-closure-readiness.js";
import { buildStaffMobileRemediationClosureOutcomeContinuity } from "../_lib/staff-mobile-remediation-closure-outcome-continuity.js";

export async function onRequestGet({ request, env }) {
  const source = await getLearning({ request: request.clone(), env });
  const payload = await source.json().catch(() => null);

  if ([401,403].includes(source.status)) {
    return json({ ok:false, error:"Unauthorized.", closure_readiness_build:513, closure_outcome_build:523 }, source.status);
  }

  const evidence = parseEvidence(env?.STAFF_MOBILE_REMEDIATION_CLOSURE_EVIDENCE_JSON);
  const closure = buildStaffMobileRemediationClosureReadiness({
    interpretation_summary: payload?.remediation_outcome_interpretation_follow_up_summary || {},
    interpretation_rows: payload?.remediation_outcome_interpretation_follow_up || [],
    closure_evidence: evidence,
    closure_source_available: Boolean(env?.STAFF_MOBILE_REMEDIATION_CLOSURE_EVIDENCE_JSON),
    generated_at: new Date().toISOString()
  });
  const outcomeRecords = parseObject(env?.STAFF_MOBILE_REMEDIATION_CLOSURE_OUTCOME_JSON);
  const closureOutcome = buildStaffMobileRemediationClosureOutcomeContinuity({
    closure_readiness: closure,
    closure_outcome_records: outcomeRecords,
    generated_at: new Date().toISOString()
  });

  return json({
    ok: source.ok && Boolean(payload?.ok),
    closure_readiness_build:513,
    closure_readiness_authority:"staff_mobile_remediation_closure_readiness",
    staff_mobile_remediation_closure_readiness:closure,
    closure_outcome_build:523,
    closure_outcome_authority:"staff_mobile_remediation_closure_outcome_continuity",
    staff_mobile_remediation_closure_outcome_continuity:closureOutcome,
    source_status:{
      retained_interpretation:{available:source.ok&&Boolean(payload),http_status:source.status},
      closure_evidence:{available:Boolean(env?.STAFF_MOBILE_REMEDIATION_CLOSURE_EVIDENCE_JSON)},
      owner_closure_outcome:{available:Boolean(env?.STAFF_MOBILE_REMEDIATION_CLOSURE_OUTCOME_JSON)}
    }
  });
}
export async function onRequestHead(context){
  const response=await onRequestGet(context);
  return new Response(null,{status:response.status,headers:response.headers});
}
export async function onRequestOptions(){
  return new Response("",{status:204,headers:{
    "Access-Control-Allow-Methods":"GET,HEAD,OPTIONS",
    "Access-Control-Allow-Headers":"Content-Type",
    "Cache-Control":"no-store"
  }});
}
function parseEvidence(value){
  if(!value) return [];
  try{
    const parsed=JSON.parse(String(value));
    return Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.rows) ? parsed.rows : []);
  }catch{return [];}
}
function parseObject(value){
  if(!value) return {};
  try{
    const parsed=JSON.parse(String(value));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  }catch{return {};}
}
function json(value,status=200){
  return new Response(JSON.stringify(value),{status,headers:{
    "Content-Type":"application/json; charset=utf-8",
    "Cache-Control":"no-store",
    "X-Rosie-Staff-Mobile-Closure-Readiness":"build-513-read-only",
    "X-Rosie-Staff-Mobile-Closure-Outcome":"build-523-read-only"
  }});
}
