// Build 512 — authenticated GET-only Booking & Quote Experiment Follow-Up Decision.
// Build 522 exact Pages preview marker v2; retained compatibility repair only, with no runtime behavior or mutation authority changes.
// Composes the retained Build 502 outcome interpretation and an optional explicit owner follow-up record.
// No response from this route executes an experiment, selects a winner, or mutates business state.

import { onRequestGet as getLearning } from "./booking_funnel_quote_pricing_learning.js";
import { buildBookingQuoteExperimentFollowUpDecision } from "../_lib/booking-quote-experiment-follow-up-decision.js";
import { buildBookingQuoteExperimentFollowUpOutcomeContinuity } from "../_lib/booking-quote-experiment-follow-up-outcome-continuity.js";
import { buildBookingQuoteFollowUpEvidenceFreshnessReview } from "../_lib/booking-quote-follow-up-evidence-freshness-review.js";

export async function onRequestGet({ request, env }) {
  const source = await getLearning({ request: request.clone(), env });
  const payload = await source.json().catch(()=>null);

  if ([401,403].includes(source.status)) {
    return json({
      ok:false,
      follow_up_decision_build:512,
      follow_up_decision_authority:"booking_quote_experiment_follow_up_decision",
      follow_up_outcome_build:522,
      follow_up_outcome_authority:"booking_quote_experiment_follow_up_outcome_continuity",
      booking_quote_follow_up_freshness_build:532,
      booking_quote_follow_up_freshness_authority:"booking_quote_follow_up_evidence_freshness_review",
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
  const outcomeRecords = parseDecisionRecords(env?.BOOKING_QUOTE_EXPERIMENT_FOLLOW_UP_OUTCOME_JSON);
  const continuity = buildBookingQuoteExperimentFollowUpOutcomeContinuity({
    follow_up_decision: decision,
    outcome_interpretation: outcome,
    follow_up_outcome_records: outcomeRecords,
    generated_at: generatedAt
  });
  const freshness = buildBookingQuoteFollowUpEvidenceFreshnessReview({
    follow_up_outcome_continuity: continuity,
    generated_at: generatedAt,
    freshness_window_days: 30
  });

  return json({
    ok: source.ok && Boolean(payload?.ok),
    follow_up_decision_build:512,
    follow_up_decision_authority:"booking_quote_experiment_follow_up_decision",
    follow_up_outcome_build:522,
    follow_up_outcome_authority:"booking_quote_experiment_follow_up_outcome_continuity",
    booking_quote_follow_up_freshness_build:532,
    booking_quote_follow_up_freshness_authority:"booking_quote_follow_up_evidence_freshness_review",
    generated_at:generatedAt,
    controlled_experiment_outcome_interpretation:outcome,
    follow_up_decision_records:records,
    booking_quote_experiment_follow_up_decision:decision,
    follow_up_outcome_records:outcomeRecords,
    booking_quote_experiment_follow_up_outcome_continuity:continuity,
    booking_quote_follow_up_evidence_freshness_review:freshness,
    source_status:{
      outcome_interpretation:{available:source.ok&&Boolean(payload),http_status:source.status},
      owner_follow_up_decision:{available:Boolean(records && Object.keys(records).length)},
      owner_follow_up_outcome:{available:Boolean(outcomeRecords && Object.keys(outcomeRecords).length)}
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
    "X-Rosie-Booking-Quote-Experiment-Follow-Up-Decision":"build-512-read-only",
    "X-Rosie-Booking-Quote-Experiment-Follow-Up-Outcome":"build-522-read-only",
    "X-Rosie-Booking-Quote-Follow-Up-Freshness":"build-532-read-only"
  }});
}
