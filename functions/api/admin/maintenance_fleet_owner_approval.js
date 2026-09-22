// Build 439/449/459/469/479 — admin-only, GET-only owner approval, activation readiness + explicit pilot decision record.
import { requireStaffAccess } from "../_lib/staff-auth.js";
import { requireActionAccess } from "../_lib/action-permissions.js";
import { buildMaintenanceFleetOwnerApprovalConvergence } from "../_lib/maintenance-fleet-owner-approval.js";
import { onRequestGet as getCommercialActivation } from "./commercial_activation.js";
import { onRequestGet as getFleetLearning } from "./fleet_commercial_operations_learning.js";

export async function onRequestGet({request,env}) {
  const access=await requireStaffAccess({request,env,capability:null,allowLegacyAdminFallback:false});
  if(!access.ok) return access.response;
  const action=requireActionAccess(access.actor,"admin.settings.manage");
  if(!action.ok) return action.response;

  const generatedAt=new Date().toISOString();
  const [activation,fleet]=await Promise.all([
    collect("commercial_activation",()=>getCommercialActivation({request:request.clone(),env})),
    collect("fleet_commercial_operations_learning",()=>getFleetLearning({request:request.clone(),env}))
  ]);

  const report=buildMaintenanceFleetOwnerApprovalConvergence({
    commercial_activation:activation.data?.commercial_activation||{},
    fleet_learning:fleet.data?.learning||{},
    generated_at:generatedAt
  });

  return json({
    ok:activation.restricted!==true&&fleet.restricted!==true,
    authority:"maintenance_fleet_owner_approval_convergence",
    current_build:449,
    activation_readiness_build:459,
    controlled_pilot_readiness_build:469,
    pilot_decision_build:479,
    refresh_authority:"fleet_maintenance_commercial_decision_closure",
    activation_authority:"fleet_maintenance_commercial_activation_readiness",
    controlled_pilot_authority:"maintenance_fleet_controlled_pilot_activation_readiness",
    pilot_decision_authority:"maintenance_fleet_owner_approval_pilot_decision",
    generated_at:generatedAt,
    source_status:{
      commercial_activation:sourceState(activation),
      fleet_commercial_operations_learning:sourceState(fleet)
    },
    ...report
  });
}

export async function onRequestHead(context){
  const response=await onRequestGet(context);
  return new Response(null,{status:response.status,headers:response.headers});
}
export async function onRequestOptions(){
  return new Response(null,{status:204,headers:{"Cache-Control":"no-store","Access-Control-Allow-Methods":"GET,HEAD,OPTIONS"}});
}

async function collect(name,runner){
  try{
    const response=await runner();
    const data=await response.json().catch(()=>null);
    return {name,available:response.ok&&Boolean(data),restricted:[401,403].includes(response.status),status:response.status,data};
  }catch(error){
    return {name,available:false,restricted:false,status:503,data:null,error_class:error?.name||"Error"};
  }
}
function sourceState(value){
  return {available:value?.available===true,restricted:value?.restricted===true,http_status:Number(value?.status)||null,error_class:value?.error_class||null};
}
function json(value,status=200){
  return new Response(JSON.stringify(value),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Rosie-Owner-Approval":"build-439-449-459-469-479-read-only"}});
}
