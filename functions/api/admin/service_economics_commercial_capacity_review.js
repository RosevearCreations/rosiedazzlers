// Build 443 — bounded read-only Service Economics & Commercial Capacity Review endpoint.
import { requireStaffAccess, json } from "../_lib/staff-auth.js";
import { onRequestGet as getAccountingStatement } from "./accounting_statement_report.js";
import { onRequestGet as getFleetLearning } from "./fleet_commercial_operations_learning.js";
import { buildServiceEconomicsCommercialCapacityReview } from "../_lib/service-economics-commercial-capacity-review.js";
const SOURCE_TIMEOUT_MS=12000;
export async function onRequestGet({request,env}){
  const access=await requireStaffAccess({request,env,body:{},capability:"manage_staff",allowLegacyAdminFallback:false});
  if(!access.ok)return access.response;
  const url=new URL(request.url),now=new Date(),month=Math.max(1,Math.min(12,Number(url.searchParams.get("month")||(now.getMonth()+1)))),year=Math.max(2020,Math.min(2100,Number(url.searchParams.get("year")||now.getFullYear())));
  const accountingRequest=requestWithQuery(request,{month:String(month),year:String(year)});
  const [economicsSource,fleetSource]=await Promise.all([
    collect("service_economics",()=>getAccountingStatement({request:accountingRequest,env})),
    collect("fleet_commercial",()=>getFleetLearning({request:request.clone(),env}))
  ]);
  if(economicsSource.restricted||fleetSource.restricted)return json({ok:false,error:"Service economics and commercial-capacity review requires the retained Administration/Finance and commercial booking evidence authorities.",source_status:sourceStatusMap(economicsSource,fleetSource)},403);
  const review=buildServiceEconomicsCommercialCapacityReview({economics:economicsSource.data?.operational_profitability||{},fleet:fleetSource.data?.learning||{},source_status:sourceStatusMap(economicsSource,fleetSource),generated_at:new Date().toISOString()});
  return json({ok:review.evidence_status!=="partial",authority:"service_economics_commercial_capacity_review",month,year,...review});
}
export async function onRequestPost(){return readOnly();}
export async function onRequestPut(){return readOnly();}
export async function onRequestPatch(){return readOnly();}
export async function onRequestDelete(){return readOnly();}
export async function onRequestOptions(){return new Response("",{status:204,headers:{"Access-Control-Allow-Methods":"GET,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"}});}
async function collect(name,runner){let timer;try{const response=await Promise.race([Promise.resolve().then(runner),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error("source_timeout")),SOURCE_TIMEOUT_MS);})]);const data=await response.json().catch(()=>null);return{name,available:response.ok&&Boolean(data),restricted:response.status===401||response.status===403,status:response.status,data,error_class:null};}catch(error){return{name,available:false,restricted:false,status:503,data:null,error_class:error?.message==="source_timeout"?"timeout":(error?.name||"Error")};}finally{if(timer)clearTimeout(timer);}}
function sourceStatusMap(economics,fleet){return{service_economics:sourceState(economics),fleet_commercial:sourceState(fleet)};}
function sourceState(row){return{available:row?.available===true,restricted:row?.restricted===true,http_status:Number(row?.status)||null,error_class:row?.error_class||null};}
function requestWithQuery(request,values){const url=new URL(request.url);for(const [key,value] of Object.entries(values))url.searchParams.set(key,value);return new Request(url.toString(),request);}
function readOnly(){return json({ok:false,error:"Service economics and commercial-capacity review is read-only. Use the owning Finance, fleet, quote, booking and accounting workflows for any explicit action."},405);}
