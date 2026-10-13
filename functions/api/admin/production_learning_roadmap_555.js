// Build 555: authenticated read-only Production learning / owner HOLD reconciliation.
import {onRequestGet as getOwnerReview} from "./service_economics_capacity_technical_owner_review.js";
import {build555ProductionLearning} from "../_lib/production-learning-roadmap-555.js";
function decode(text){try{const j=JSON.parse(String(text||""));return j&&typeof j==="object"&&!Array.isArray(j)?j:{}}catch{return {}}}
function response(body,status=200){return new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Rosie-Production-Learning":"build-555-read-only"}})}
export async function onRequestGet({request,env}){
 const previous=await getOwnerReview({request:request.clone(),env});
 if(previous.status===401||previous.status===403)return response({ok:false,error:"Unauthorized.",build:555},previous.status);
 const source=await previous.json().catch(()=>null);
 const review=build555ProductionLearning({owner_review:source?.review||{},release_records:decode(env?.ROSIE_PRODUCTION_LEARNING_555_JSON)});
 return response({ok:previous.ok&&Boolean(source),build:555,review,source_status:{owner_review_source_available:previous.ok&&Boolean(source),
  release_record_source_configured:Boolean(env?.ROSIE_PRODUCTION_LEARNING_555_JSON)},
  automatic_hold_closure_or_business_action:false},previous.ok?200:503);
}
export async function onRequestHead(context){const r=await onRequestGet(context);return new Response(null,{status:r.status,headers:r.headers})}
export async function onRequestOptions(){return new Response("",{status:204,headers:{"Access-Control-Allow-Methods":"GET,HEAD,OPTIONS","Cache-Control":"no-store"}})}
