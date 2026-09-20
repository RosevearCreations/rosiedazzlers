// Build 451 — read-only Booking Funnel, Quote & Pricing Learning endpoint.
import { requireStaffAccess, json } from "../_lib/staff-auth.js";
import { onRequestGet as getBookingRebookingFunnel } from "./booking_rebooking_funnel.js";
import { onRequestGet as getQuotePipeline } from "./quote_pipeline_list.js";
import { buildBookingFunnelQuotePricingLearning } from "../_lib/booking-funnel-quote-pricing-learning.js";
const SOURCE_TIMEOUT_MS=9000;
export async function onRequestGet({request,env}){
  const access=await requireStaffAccess({request,env,body:{},capability:"manage_bookings",allowLegacyAdminFallback:true});
  if(!access.ok)return access.response;
  const url=new URL(request.url),days=boundedDays(url.searchParams.get("days")),funnelRequest=withQuery(request,"days",String(days));
  const [funnel,quotes]=await Promise.all([
    collect("booking_rebooking_funnel",()=>getBookingRebookingFunnel({request:funnelRequest,env})),
    collect("quote_pipeline_list",()=>getQuotePipeline({request:request.clone(),env}))
  ]);
  if(funnel.restricted||quotes.restricted)return json({ok:false,error:"Booking Funnel, Quote & Pricing Learning requires retained booking/quote evidence authorities.",source_status:sourceStatusMap(funnel,quotes)},403);
  const learning=buildBookingFunnelQuotePricingLearning({funnel:funnel.data||{},quote_rows:Array.isArray(quotes.data?.rows)?quotes.data.rows:[],source_status:sourceStatusMap(funnel,quotes),generated_at:new Date().toISOString()});
  return json({ok:learning.evidence_status!=="unavailable",window:{days},...learning});
}
export async function onRequestPost(){return readOnly()} export async function onRequestPut(){return readOnly()} export async function onRequestPatch(){return readOnly()} export async function onRequestDelete(){return readOnly()}
export async function onRequestOptions(){return new Response("",{status:204,headers:{"Access-Control-Allow-Methods":"GET,OPTIONS","Access-Control-Allow-Headers":"Content-Type","Cache-Control":"no-store"}})}
async function collect(name,runner){let timer;try{const response=await Promise.race([Promise.resolve().then(runner),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error("source_timeout")),SOURCE_TIMEOUT_MS)})]),data=await response.json().catch(()=>null);return{name,available:response.ok&&Boolean(data),restricted:response.status===401||response.status===403,status:response.status,data,error_class:null}}catch(error){return{name,available:false,restricted:false,status:503,data:null,error_class:error?.message==="source_timeout"?"timeout":(error?.name||"Error")}}finally{if(timer)clearTimeout(timer)}}
function sourceStatusMap(funnel,quotes){return{booking_rebooking_funnel:state(funnel),quote_pipeline_list:state(quotes)}} function state(row){return{available:row?.available===true,restricted:row?.restricted===true,http_status:Number(row?.status)||null,error_class:row?.error_class||null}} function boundedDays(v){const n=Number(v||90);return Number.isFinite(n)?Math.max(7,Math.min(365,Math.round(n))):90} function withQuery(request,key,value){const url=new URL(request.url);url.searchParams.set(key,value);return new Request(url.toString(),request)} function readOnly(){return json({ok:false,error:"Booking Funnel, Quote & Pricing Learning is read-only. Use existing owning workflows for explicit business action."},405)}
