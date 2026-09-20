// Build 438/448/458 — Authenticated Device & Visual Acceptance / current cross-device closure.
// Authenticated, read-only composition. No visual-capture action or business mutation.
import { requireStaffAccess, json } from "../_lib/staff-auth.js";
import { listLaunchEvidence } from "../_lib/launch-readiness-evidence.js";
import { onRequestGet as getProductionWorkflowEvidence } from "./production_workflow_evidence.js";
import { buildAuthenticatedDeviceVisualAcceptance } from "../_lib/authenticated-device-visual-acceptance.js";

export async function onRequestGet({request,env}){
  const access=await requireStaffAccess({request,env,capability:"it_diagnostics",allowLegacyAdminFallback:true});
  if(!access.ok)return access.response;

  const [launchResult,workflowResult]=await Promise.all([
    loadLaunchEvidence(env),
    collect(()=>getProductionWorkflowEvidence({request:request.clone(),env}))
  ]);
  if(workflowResult.status===401||workflowResult.status===403)return workflowResult.response;

  const generatedAt=new Date().toISOString();
  const workflowEvidence=workflowResult.data?.evidence||null;
  const evidence=buildAuthenticatedDeviceVisualAcceptance({
    launch_evidence:launchResult.items,
    workflow_evidence:workflowEvidence,
    source_available:launchResult.available&&workflowResult.ok&&Boolean(workflowEvidence),
    generated_at:generatedAt
  });

  return json({
    ok:true,
    build:438,
    current_build:448,
    closure_build:458,
    closure_authority:"authenticated_device_acceptance_closure",
    refresh_authority:"authenticated_cross_device_acceptance_refresh",
    authority:"authenticated_device_visual_acceptance",
    generated_at:generatedAt,
    retained_authority:"customer_staff_production_workflow_evidence",
    source_status:{
      launch_evidence:{available:launchResult.available,warning:launchResult.warning||null},
      production_workflow_evidence:{available:workflowResult.ok,http_status:workflowResult.status,error_class:workflowResult.error_class||null}
    },
    evidence
  });
}
export async function onRequestHead(context){const response=await onRequestGet(context);return new Response(null,{status:response.status,headers:response.headers})}
export async function onRequestOptions(){return new Response(null,{status:204,headers:{"Cache-Control":"no-store",Allow:"GET, HEAD, OPTIONS"}})}

async function loadLaunchEvidence(env){
  try{
    const result=await listLaunchEvidence(env);
    return{available:result?.ready===true,items:Array.isArray(result?.items)?result.items:[],warning:result?.warning||null};
  }catch(error){
    return{available:false,items:[],warning:error?.message||"Launch evidence is unavailable."};
  }
}
async function collect(runner){
  try{
    const response=await runner();
    const data=await response.json().catch(()=>null);
    return{ok:response.ok&&Boolean(data),status:response.status,data,response,error_class:null};
  }catch(error){
    return{ok:false,status:503,data:null,response:json({ok:false,error:"Workflow evidence is unavailable."},503),error_class:error?.name||"Error"};
  }
}
