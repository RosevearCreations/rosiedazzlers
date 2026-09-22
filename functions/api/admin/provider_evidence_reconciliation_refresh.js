// Build 446 — Provider Evidence Reconciliation Refresh.
// Read-only provider evidence refresh. No provider/payment/refund/message mutation.
import { onRequestGet as getProviderEvidenceClosure } from "./provider_evidence_closure.js";
import { buildProviderOutcomeDeliveryEvidence } from "../_lib/provider-outcome-delivery-evidence.js";
import { buildProviderEvidenceReconciliationRefresh } from "../_lib/provider-evidence-reconciliation-refresh.js";
import { buildProviderEvidenceClosureAvailabilityReview } from "../_lib/provider-evidence-closure-availability-review.js";
import { buildProviderOutcomeReviewHoldDecisionReadiness } from "../_lib/provider-outcome-review-hold-decision-readiness.js";
import { buildProviderHoldDecisionTraceabilityClosureReview } from "../_lib/provider-hold-decision-traceability-closure-review.js";

export async function onRequestGet({ request, env }) {
  const response = await getProviderEvidenceClosure({ request: request.clone(), env });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.closure) {
    return json({ ok:false, build:446, authority:"provider_evidence_reconciliation_refresh",
      error: response.status===401||response.status===403 ? "Unauthorized." : "Retained provider evidence is unavailable.",
      source_http_status: response.status }, response.status===401||response.status===403 ? response.status : 503);
  }
  const generatedAt = new Date().toISOString();
  const outcome = buildProviderOutcomeDeliveryEvidence({ closure: payload.closure, generated_at: generatedAt });
  const refresh = buildProviderEvidenceReconciliationRefresh({ closure: payload.closure, outcome, generated_at: generatedAt });
  const closureAvailabilityReview = buildProviderEvidenceClosureAvailabilityReview({
    reconciliation: refresh, outcome, generated_at: generatedAt
  });
  const holdDecisionReadiness = buildProviderOutcomeReviewHoldDecisionReadiness({
    outcome,
    reconciliation: refresh,
    availability_review: closureAvailabilityReview,
    generated_at: generatedAt
  });
  const holdDecisionTraceabilityClosureReview = buildProviderHoldDecisionTraceabilityClosureReview({
    decision_readiness: holdDecisionReadiness,
    availability_review: closureAvailabilityReview,
    reconciliation: refresh,
    operator_review: null,
    generated_at: generatedAt
  });
  return json({ ok:true, build:446, authority:"provider_evidence_reconciliation_refresh", generated_at:generatedAt,
    retained_authority: payload.authority || "payment_refund_delivery_provider_evidence_closure",
    current_review_authority: "provider_evidence_closure_availability_review",
    current_hold_decision_build: 466,
    current_hold_decision_authority: "provider_outcome_review_hold_decision_readiness",
    current_hold_traceability_build: 476,
    current_hold_traceability_authority: "provider_hold_decision_traceability_closure_review",
    refresh, closure_availability_review: closureAvailabilityReview,
    hold_decision_readiness: holdDecisionReadiness,
    hold_decision_traceability_closure_review: holdDecisionTraceabilityClosureReview });
}
export async function onRequestHead(context) {
  const response = await onRequestGet(context);
  return new Response(null, { status: response.status, headers: response.headers });
}
export async function onRequestOptions() {
  return new Response(null, { status:204, headers:{ "Cache-Control":"no-store", Allow:"GET, HEAD, OPTIONS" } });
}
function json(value,status=200){
  return new Response(JSON.stringify(value),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Rosie-Provider-Evidence":"build-446-read-only"}});
}
