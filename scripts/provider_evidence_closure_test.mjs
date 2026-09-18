import assert from "node:assert/strict";
import { buildProviderEvidenceClosure } from "../functions/api/_lib/provider-evidence-closure.js";

const readiness={items:[
  {id:"stripe_provider_outcome",classification:"runtime_proven",evidence:{reconciled_records:1,latest_accepted_at:"2026-09-18T12:00:00Z",replay_observed:0}},
  {id:"paypal_provider_outcome",classification:"runtime_proven",evidence:{reconciled_records:1,latest_accepted_at:"2026-09-18T12:05:00Z",replay_observed:1}}
]};
const refund={provider:"stripe",quote_deposit_payment_request_id:"req-1",provider_refund_id:"re_1",provider_event_id:"evt_1",refund_status:"refunded",refund_amount_cents:2500,currency:"CAD",refunded_at:"2026-09-18T12:10:00Z"};
const delivered={channel:"email",status:"delivered",delivered_at:"2026-09-18T12:15:00Z",provider_delivery_verified:true};
const ready=buildProviderEvidenceClosure({readiness,refunds:[refund],notifications:[delivered]});
assert.equal(ready.status,"ready");
assert.equal(ready.payments.stripe.observed,true);
assert.equal(ready.payments.paypal.observed,true);
assert.equal(ready.refunds.definitive_refunds,1);
assert.equal(ready.delivery.definitive_deliveries,1);
assert.equal(ready.truth_boundary.provider_contact_performed,false);
assert.equal(ready.truth_boundary.notification_send_performed,false);
assert.equal(ready.truth_boundary.customer_identity_exposed,false);

const sentOnly=buildProviderEvidenceClosure({readiness,refunds:[refund],notifications:[{channel:"email",status:"sent",sent_at:"2026-09-18T12:15:00Z"}]});
assert.equal(sentOnly.status,"hold");
assert.equal(sentOnly.delivery.provider_accepted,1);
assert.equal(sentOnly.delivery.definitive_deliveries,0);
assert.ok(sentOnly.outstanding.some((row)=>row.id==="delivery"));

const incompleteRefund=buildProviderEvidenceClosure({readiness,refunds:[{...refund,provider_event_id:null}],notifications:[delivered]});
assert.equal(incompleteRefund.status,"hold");
assert.equal(incompleteRefund.refunds.definitive_refunds,0);
assert.ok(incompleteRefund.outstanding.some((row)=>row.id==="refund"));

const missingPayPal=buildProviderEvidenceClosure({
  readiness:{items:[readiness.items[0],{id:"paypal_provider_outcome",classification:"provider_dependent",evidence:{reconciled_records:0}}]},
  refunds:[refund],
  notifications:[delivered]
});
assert.equal(missingPayPal.status,"hold");
assert.ok(missingPayPal.outstanding.some((row)=>row.id==="paypal_payment"));

console.log("PAYMENT REFUND DELIVERY PROVIDER EVIDENCE CLOSURE TEST: PASS");
