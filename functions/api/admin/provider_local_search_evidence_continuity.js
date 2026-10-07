// Build 489 — authenticated GET-only Provider & Local Search Evidence Continuity.
// Composes retained provider-outcome/HOLD evidence with retained local-search snapshot continuity.
// No provider contact, payment/refund/message mutation, provider write, booking mutation or polling.

import { onRequestGet as getProviderEvidence } from "./provider_evidence_reconciliation_refresh.js";
import { onRequestGet as getLocalSearch } from "./local_search_measurement_conversion_attribution.js";
import { buildProviderLocalSearchEvidenceContinuity } from "../_lib/provider-local-search-evidence-continuity.js";
import { buildProviderLocalSearchOutcomeEvidenceRefresh } from "../_lib/provider-local-search-outcome-evidence-refresh.js";
import { buildProviderLocalSearchClosureEvidenceContinuityReview } from "../_lib/provider-local-search-closure-evidence-continuity-review.js";
import { buildProviderLocalSearchManualClosureOutcomeContinuity } from "../_lib/provider-local-search-manual-closure-outcome-continuity.js";
import { buildProviderLocalSearchClosureEvidenceFreshnessReview } from "../_lib/provider-local-search-closure-evidence-freshness-review.js";
import { buildProviderLocalSearchClosureEvidenceIntegrityReview } from "../_lib/provider-local-search-closure-evidence-integrity-review.js";

export async function onRequestGet({ request, env }) {
  const [providerResponse, localResponse] = await Promise.all([
    getProviderEvidence({ request: request.clone(), env }),
    getLocalSearch({ request: request.clone(), env })
  ]);
  const [providerPayload, localPayload] = await Promise.all([
    providerResponse.json().catch(() => null),
    localResponse.json().catch(() => null)
  ]);

  const authStatus = [providerResponse.status, localResponse.status].find((status) => status === 401 || status === 403);
  if (authStatus) {
    return json({ ok:false, continuity_enrichment_build:489, continuity_authority:"provider_local_search_evidence_continuity", error:"Unauthorized." }, authStatus);
  }

  const generatedAt = new Date().toISOString();
  const continuity = buildProviderLocalSearchEvidenceContinuity({
    provider: providerResponse.ok && providerPayload ? providerPayload : {},
    local_search: localResponse.ok && localPayload ? localPayload : {},
    generated_at: generatedAt
  });
  const outcomeRefresh = buildProviderLocalSearchOutcomeEvidenceRefresh({
    continuity,
    generated_at: generatedAt
  });
  const closureReview = buildProviderLocalSearchClosureEvidenceContinuityReview({
    outcome_refresh: outcomeRefresh,
    generated_at: generatedAt
  });
  const manualClosureOutcome = buildProviderLocalSearchManualClosureOutcomeContinuity({
    closure_review: closureReview,
    manual_hold_outcome: null,
    generated_at: generatedAt
  });
  const closureFreshness = buildProviderLocalSearchClosureEvidenceFreshnessReview({
    closure_review: closureReview,
    manual_closure_outcome: manualClosureOutcome,
    generated_at: generatedAt
  });
  const closureIntegrity = buildProviderLocalSearchClosureEvidenceIntegrityReview({
    closure_freshness: closureFreshness,
    manual_closure_outcome: manualClosureOutcome,
    generated_at: generatedAt
  });

  return json({
    ...(localPayload && typeof localPayload === "object" ? localPayload : {}),
    ok: localResponse.ok && Boolean(localPayload?.ok),
    continuity_enrichment_build: 489,
    continuity_authority: "provider_local_search_evidence_continuity",
    outcome_evidence_refresh_build: 499,
    outcome_evidence_refresh_authority: "provider_local_search_outcome_evidence_refresh",
    closure_evidence_continuity_review_build: 509,
    closure_evidence_continuity_review_authority: "provider_local_search_closure_evidence_continuity_review",
    manual_closure_outcome_build: 519,
    manual_closure_outcome_authority: "provider_local_search_manual_closure_outcome_continuity",
    provider_local_search_closure_freshness_build: 529,
    provider_local_search_closure_freshness_authority: "provider_local_search_closure_evidence_freshness_review",
    provider_local_search_closure_integrity_build: 539,
    provider_local_search_closure_integrity_authority: "provider_local_search_closure_evidence_integrity_review",
    generated_at: generatedAt,
    provider_local_search_evidence_continuity: continuity,
    provider_local_search_outcome_evidence_refresh: outcomeRefresh,
    provider_local_search_closure_evidence_continuity_review: closureReview,
    provider_local_search_manual_closure_outcome_continuity: manualClosureOutcome,
    provider_local_search_closure_evidence_freshness_review: closureFreshness,
    provider_local_search_closure_evidence_integrity_review: closureIntegrity,
    continuity_source_status: {
      provider_outcomes: { available: providerResponse.ok && Boolean(providerPayload?.ok), http_status: providerResponse.status },
      local_search: { available: localResponse.ok && Boolean(localPayload?.ok), http_status: localResponse.status }
    }
  }, localResponse.status === 401 || localResponse.status === 403 ? localResponse.status : 200);
}

export async function onRequestHead(context) {
  const response = await onRequestGet(context);
  return new Response(null, { status: response.status, headers: response.headers });
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Cache-Control":"no-store",
      "Access-Control-Allow-Methods":"GET,HEAD,OPTIONS",
      "Access-Control-Allow-Headers":"Content-Type"
    }
  });
}

function json(value,status=200){
  return new Response(JSON.stringify(value),{
    status,
    headers:{
      "Content-Type":"application/json; charset=utf-8",
      "Cache-Control":"no-store",
      "X-Rosie-Provider-Local-Search-Continuity":"build-489-read-only",
      "X-Rosie-Provider-Local-Search-Outcome-Refresh":"build-499-read-only",
      "X-Rosie-Provider-Local-Search-Closure-Review":"build-509-read-only",
      "X-Rosie-Provider-Local-Search-Manual-Closure":"build-519-read-only",
      "X-Rosie-Provider-Local-Search-Closure-Freshness":"build-529-read-only",
      "X-Rosie-Provider-Local-Search-Closure-Integrity":"build-539-read-only"
    }
  });
}
