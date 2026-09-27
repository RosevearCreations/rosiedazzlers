// Build 512 — authenticated GET-only Booking & Quote Experiment Follow-Up Decision.
// Composes the retained Build 502 outcome interpretation and an optional explicit owner follow-up record.
// No response from this route executes an experiment, selects a winner, or mutates business state.

import { onRequestGet as getLearning } from "./booking_funnel_quote_pricing_learning.js";
import { buildBookingQuoteExperimentFollowUpDecision } from "../_lib/booking-quote-experiment-follow-up-decision.js";

export async function onRequestGet({ request, env }) {
  const source = await getLearning({ request: request.clone(), env });
  const payload = await source.json().catch(()=>null);

  if ([401,403].includes(source.status)) {
    return json({
      ok:false,
      follow_up_decision_build:512,
      follow_up_decision_authority:"booking_quote_experiment_follow_up_decision",
      error:"Unauthorized."
    },source.status);
  }

  const generatedAt = new Date().toISOString();
  const outcome = payload?.controlled_experiment_outcome_interpretation || {};
  const records = parseDecisionRecords(env?.BOOKING_QUOTE_EXPERIMENT_FOLLOW_UP_DECISION_JSON);
  const decision = buildBookingQuoteExperimentFollowUpDecision({
    outcome_interpretation: outcome,
    follow_up_decision_records: records,
    generated_at: generatedAt
  });

  return json({
    ok: source.ok && Boolean(payload?.ok),
    follow_up_decision_build:512,
    follow_up_decision_authority:"booking_quote_experiment_follow_up_decision",
    generated_at:generatedAt,
    controlled_experiment_outcome_interpretation:outcome,
    follow_up_decision_records:records,
    booking_quote_experiment_follow_up_decision:decision,
    source_status:{
      outcome_interpretation:{available:source.ok&&Boolean(payload),http_status:source.status},
      owner_follow_up_decision:{available:Boolean(records && Object.keys(records).length)}
    }
  },200);
}
export async function onRequestHead(context){
  const response=await onRequestGet(context);
  return new Response(null,{status:response.status,headers:response.headers});
}
export async function onRequestOptions(){
  return new Response(null,{status:204,headers:{
    "Cache-Control":"no-store",
    "Access-Control-Allow-Methods":"GET,HEAD,OPTIONS",
    "Access-Control-Allow-Headers":"Content-Type"
  }});
}
function parseDecisionRecords(value){
  if (!value) return {};
  try {
    const parsed=JSON.parse(String(value));
    return parsed && typeof parsed==="object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}
function json(value,status=200){
  return new Response(JSON.stringify(value),{status,headers:{
    "Content-Type":"application/json; charset=utf-8",
    "Cache-Control":"no-store",
    "X-Rosie-Booking-Quote-Experiment-Follow-Up-Decision":"build-512-read-only"
  }});
}
