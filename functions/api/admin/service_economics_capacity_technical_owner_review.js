// Authenticated GET-only Build 554 owner review; uses retained Build 544 source contract.
import {onRequestGet as getCurrentEvidence} from "./service_economics_seasonal_capacity_reliability_decision_readiness.js";
import {build554ServiceEconomicsCapacityTechnicalOwnerReview} from "../_lib/service-economics-capacity-technical-owner-review-554.js";
function safeObject(input){try{const v=JSON.parse(String(input||""));return v&&typeof v==="object"&&!Array.isArray(v)?v:{}}catch{return {}}}
function output(body,status=200){return new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Rosie-Service-Economics-Owner-Review":"build-554-read-only"}})}
export async function onRequestGet({request,env}){
 const previous=await getCurrentEvidence({request:request.clone(),env});
 if(previous.status===401||previous.status===403)return output({ok:false,error:"Unauthorized.",build:554},previous.status);
 const source=await previous.json().catch(()=>null);
 const review=build554ServiceEconomicsCapacityTechnicalOwnerReview({
  integrity_review:source?.service_economics_seasonal_capacity_reliability_evidence_integrity_review||{},
  owner_review_records:safeObject(env?.SERVICE_ECONOMICS_CAPACITY_TECHNICAL_OWNER_REVIEW_554_JSON)});
 return output({ok:previous.ok&&Boolean(source),build:554,authority:review.authority,review,
  source_status:{retained_build544_available:previous.ok&&Boolean(source),
  owner_record_source_configured:Boolean(env?.SERVICE_ECONOMICS_CAPACITY_TECHNICAL_OWNER_REVIEW_554_JSON)},
  publication_or_automatic_mutation_performed:false},previous.ok?200:503);
}
export async function onRequestHead(context){const r=await onRequestGet(context);return new Response(null,{status:r.status,headers:r.headers})}
export async function onRequestOptions(){return new Response("",{status:204,headers:{"Access-Control-Allow-Methods":"GET,HEAD,OPTIONS","Cache-Control":"no-store"}})}
