import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LIMITS898,projectFinance898} from '../assets/build898-finance-reconciliation.mjs';
const P='5fd62295-1f83-4507-bf6f-bd5e1abb9fed',B='166cd852-784d-4244-a793-3dde8d273348';
const E='e97e48bf-4571-4e48-973f-285edda643ca',R='0a84b1d8-8a98-45dc-b5c1-3eaabce7b0cd';
const A='d7aa9520-5108-441d-bb69-45cd854e5ca0',F='8a35d3a2-1a5c-4aa0-8f6a-3d67304650ce';
const money={id:P,booking_id:B,confirmed_booking_id:B,provider:'stripe',payment_status:'paid',status:'paid',currency:'CAD',amount_cents:10000,paid_amount_cents:10000,refunded_amount_cents:2000,processor_fee_cents:300,provider_event_id:'evt_good'};
const refund={id:R,quote_deposit_payment_request_id:P,booking_id:B,provider:'stripe',currency:'CAD',refund_status:'succeeded',refund_amount_cents:2000,provider_event_id:'evt_ref'};
const event={id:E,quote_deposit_payment_request_id:P,provider:'stripe',provider_event_id:'evt_good',provider_event_type:'checkout.session.completed',status:'processed'};
const refundEvent={id:F,quote_deposit_payment_request_id:P,provider:'stripe',provider_event_id:'evt_ref',provider_event_type:'charge.refunded',status:'processed'};
const app={id:A,booking_id:B,source_type:'deposit',source_id:P,target_type:'booking',target_id:B,amount_cents:8000,currency:'CAD',application_status:'applied'};
const acct={id:'e64a0482-6c9d-4863-a8ca-3dc8465d95ff',booking_id:B,tax_cad:'13.00',deposit_paid_cad:'80.00',total_cad:'113.00',balance_due_cad:'33.00'};
const args=()=>({payments:[{...money}],refunds:[{...refund}],events:[{...event},{...refundEvent}],applications:[{...app}],accounting:[{...acct}],finalBalances:[]});
test('bounded, read-only and pending original acceptance',()=>{
 assert.equal(LIMITS898.payments,60);const r=projectFinance898(args());
 assert.equal(r.disposition,'BUSINESS_ACCEPTANCE_HOLD');assert.equal(r.scope.no_mutation,true);
 assert.equal(r.scope.no_tax_rate_assumed,true);assert.equal(r.scope.no_master_export,true);
});
test('matched callback is source evidence, not independent bank settlement',()=>{
 const r=projectFinance898(args()), row=r.items[0];
 assert.equal(row.callback_recorded,true);assert.equal(row.provider_settlement_verified,false);
 assert.equal(row.bank_match_verified,false);assert.equal(row.issued_invoice_verified,false);
 assert.equal(row.source_paid_cents,10000);assert.equal(row.source_refunded_cents,2000);
 assert.equal(r.totals.source_reported_paid_cents,10000);
 assert.equal(r.totals.source_reported_refunded_cents,2000);
 assert.equal(r.totals.recorded_hst_cents,1300);
 assert.deepEqual(row.exception_codes,[]);
});
test('missing provider callback and payment application stay unverified',()=>{
 const a=args();a.events=[];a.applications=[];
 const row=projectFinance898(a).items[0];
 assert.ok(row.exception_codes.includes('NO_EXACT_PROCESSED_PROVIDER_CALLBACK'));
 assert.ok(row.exception_codes.includes('REFUND_PROVIDER_RECEIPT_UNVERIFIED'));
 assert.ok(row.exception_codes.includes('NO_PAYMENT_APPLICATION'));
});
test('pending refund cannot become completed cash refund',()=>{
 const a=args();a.refunds[0].refund_status='pending';a.payments[0].refunded_amount_cents=0;
 const r=projectFinance898(a);
 assert.equal(r.totals.source_reported_refunded_cents,0);
 assert.ok(r.items[0].exception_codes.includes('REFUND_PENDING_OR_FAILED'));
});
test('over-refund and currency drift flagged',()=>{
 const a=args();a.refunds[0].refund_amount_cents=12000;a.payments[0].currency='USD';
 const row=projectFinance898(a).items[0];
 assert.ok(row.exception_codes.includes('REFUND_EXCEEDS_PAYMENT'));
 assert.ok(row.exception_codes.includes('CURRENCY_OR_MISSING_CAD'));
});
test('original event replay collisions and fractional-cent source fail closed',()=>{
 const a=args();a.events.push({...event,id:'93d910c6-5387-43d3-af48-0f4e9b889d5a'});
 assert.throws(()=>projectFinance898(a),/Duplicate/);
 const b=args();b.payments[0].paid_amount_cents='100.50';
 assert.throws(()=>projectFinance898(b),/integer-cent/);
});
test('orphan refund and possible duplicate application are review-only',()=>{
 const a=args();a.refunds[0].quote_deposit_payment_request_id='bb366df9-af43-40cb-b522-8bbd71f15ea0';
 a.applications.push({...app,id:'7ec9a16c-2d02-4669-89e7-5a8a73d16426'});
 const r=projectFinance898(a);assert.equal(r.orphan_refund_suffixes.length,1);
 assert.equal(r.duplicate_application_suffixes.length,1);
});
test('empty source is NOT accountant acceptance',()=>{
 const r=projectFinance898();assert.equal(r.items.length,0);
 assert.equal(r.disposition,'BUSINESS_ACCEPTANCE_HOLD');
});
test('private finance API enforces signed-session finance role and no provider changes',()=>{
 const s=readFileSync(new URL('../functions/api/admin/finance_reconciliation_v898.js',import.meta.url),'utf8');
 assert.match(s,/auth_mode!=='session'/);
 assert.match(s,/finance\.view/);assert.match(s,/finance\.reconcile/);
 assert.match(s,/allowLegacyAdminFallback:false/);assert.match(s,/onRequestPost=no/);
 assert.match(s,/final_balance_payment_requests\?select=id,booking_id,status,amount_cents/);
 assert.doesNotMatch(s,/api\.stripe\.com|api-m\.paypal\.com|method:'PATCH'|method:'POST'/);
 const ui=readFileSync(new URL('../admin-finance-reconciliation.html',import.meta.url),'utf8');
 assert.match(ui,/data-build898/);assert.match(ui,/BUSINESS ACCEPTANCE HOLD/);
});
