// Build 446 — Provider Evidence Reconciliation Refresh.
// Read-only provider evidence refresh. No provider/payment/refund/message mutation.
import { onRequestGet as getProviderEvidenceClosure } from "./provider_evidence_closure.js";
import { buildProviderOutcomeDeliveryEvidence } from "../_lib/provider-outcome-delivery-evidence.js";
import { buildProviderEvidenceReconciliationRefresh } from "../_lib/provider-evidence-reconciliation-refresh.js";

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
  return json({ ok:true, build:446, authority:"provider_evidence_reconciliation_refresh", generated_at:generatedAt,
    retained_authority: payload.authority || "payment_refund_delivery_provider_evidence_closure", refresh });
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
