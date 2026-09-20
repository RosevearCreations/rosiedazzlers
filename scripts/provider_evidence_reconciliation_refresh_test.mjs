import assert from "node:assert/strict";
import { buildProviderEvidenceReconciliationRefresh } from "../functions/api/_lib/provider-evidence-reconciliation-refresh.js";
const closure={sources:{payment_readiness_available:true,refund_source_available:true,notification_source_available:true}};
const outcome={status:"closure_candidate",rows:[
{id:"stripe_payment",title:"Stripe",status:"observed_dated",evidence_at:"2026-09-19T12:00:00Z"},
{id:"paypal_payment",title:"PayPal",status:"observed_dated",evidence_at:"2026-09-10T12:00:00Z"},
{id:"refund",title:"Refund",status:"observed_dated",evidence_at:"2026-08-01T12:00:00Z"},
{id:"delivery",title:"Delivery",status:"observed_dated",evidence_at:"2026-05-01T12:00:00Z"}]};
const refresh=buildProviderEvidenceReconciliationRefresh({closure,outcome,generated_at:"2026-09-20T12:00:00Z"});
assert.equal(refresh.required_evidence_count,4);
assert.equal(refresh.dated_evidence_count,4);
assert.equal(refresh.rows.find(x=>x.id==="stripe_payment").freshness,"current");
assert.equal(refresh.rows.find(x=>x.id==="refund").freshness,"aging");
assert.equal(refresh.rows.find(x=>x.id==="delivery").freshness,"stale");
assert.equal(refresh.status,"stale_review");
assert.equal(refresh.canonical_hold.backlog_mutated,false);
assert.equal(refresh.truth_boundary.provider_contact_performed,false);
const missing=buildProviderEvidenceReconciliationRefresh({
closure:{sources:{payment_readiness_available:true,refund_source_available:false,notification_source_available:true}},
outcome:{status:"hold",rows:[
{id:"stripe_payment",status:"observed_dated",evidence_at:"2026-09-19T12:00:00Z"},
{id:"paypal_payment",status:"observed_undated",evidence_at:null},
{id:"refund",status:"unavailable",evidence_at:null},
{id:"delivery",status:"provider_dependent",evidence_at:null}]},
generated_at:"2026-09-20T12:00:00Z"});
assert.equal(missing.source_gap_count,3);
assert.equal(missing.status,"unavailable");
assert.equal(missing.rows.find(x=>x.id==="refund").freshness,"unavailable");
console.log("PROVIDER EVIDENCE RECONCILIATION REFRESH TEST: PASS");
