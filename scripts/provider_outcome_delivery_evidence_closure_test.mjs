import assert from "node:assert/strict";
import { buildProviderOutcomeDeliveryEvidence } from "../functions/api/_lib/provider-outcome-delivery-evidence.js";

const closure={
  sources:{payment_readiness_available:true,refund_source_available:true,notification_source_available:true},
  payments:{
    stripe:{observed:true,latest_accepted_at:"2026-09-18T12:00:00Z"},
    paypal:{observed:true,latest_accepted_at:"2026-09-18T12:05:00Z"}
  },
  refunds:{definitive_refunds:1,latest_refunded_at:"2026-09-18T12:10:00Z"},
  delivery:{definitive_deliveries:1,latest_definitive_delivery_at:"2026-09-18T12:15:00Z"},
  required:[
    {id:"stripe_payment",detail:"Stripe evidence"},
    {id:"paypal_payment",detail:"PayPal evidence"},
    {id:"refund",detail:"Refund evidence"},
    {id:"delivery",detail:"Delivery evidence"}
  ]
};
const ready=buildProviderOutcomeDeliveryEvidence({closure,generated_at:"2026-09-19T12:00:00Z"});
assert.equal(ready.status,"closure_candidate");
assert.equal(ready.dated_evidence_count,4);
assert.equal(ready.canonical_hold.closure_candidate,true);
assert.equal(ready.canonical_hold.backlog_mutated,false);
assert.equal(ready.truth_boundary.provider_contact_performed,false);
assert.equal(ready.truth_boundary.notification_send_performed,false);

const undated=buildProviderOutcomeDeliveryEvidence({
  closure:{...closure,payments:{...closure.payments,paypal:{observed:true,latest_accepted_at:null}}},
  generated_at:"2026-09-19T12:00:00Z"
});
assert.equal(undated.status,"hold");
assert.equal(undated.rows.find((row)=>row.id==="paypal_payment").status,"observed_undated");

const unavailable=buildProviderOutcomeDeliveryEvidence({
  closure:{...closure,sources:{...closure.sources,notification_source_available:false}},
  generated_at:"2026-09-19T12:00:00Z"
});
assert.equal(unavailable.status,"unavailable");
assert.equal(unavailable.rows.find((row)=>row.id==="delivery").classification,"unavailable");

console.log("PROVIDER OUTCOME & DELIVERY EVIDENCE CLOSURE TEST: PASS");
