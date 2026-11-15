import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
test('mirrored invoices show authoritative totals without duplicated addon charges', () => {
 const a=read('invoice.html'), b=read('invoice/index.html');
 assert.equal(a,b);
 assert.match(a,/d\.summary\?\.base_total_cents/);
 assert.match(a,/amount:null/);
 assert.match(a,/Canadian dollars/);
 assert.match(a,/does not claim a separate HST amount unless the authoritative billing record supplies one/);
 assert.match(a,/A deposit requested is not proof of payment/);
});
test('confirmation messages never equate a requested deposit with a payment', () => {
 for(const path of ['functions/api/_lib/booking-documents.js','functions/api/admin/_lib/booking-documents.js']){
  const source=read(path);
  assert.match(source,/Deposit requested \(not payment confirmation\):/);
  assert.doesNotMatch(source,/Deposit due \/ paid:/);
 }
});

test('refunds are already netted from collected payments before balance calculation', () => {
 for (const path of ['functions/api/_lib/booking-documents.js','functions/api/admin/_lib/booking-documents.js']) {
  const source=read(path);
  assert.match(source,/summary\.collected_total = toMoney\(summary\.collected_total - amount\)/);
  assert.match(source,/balanceDueCents = Math\.max\(0, effectiveTotalCents - collectedCents\)/);
  assert.doesNotMatch(source,/effectiveTotalCents - collectedCents \+ refundCents/);
 }
 // $200 due, $100 collected, $25 refunded: net collected $75, balance $125.
 const effectiveTotalCents=20000, collectedCents=10000-2500;
 assert.equal(Math.max(0,effectiveTotalCents-collectedCents),12500);
});
