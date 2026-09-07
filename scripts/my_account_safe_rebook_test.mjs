import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  cleanDate,
  cleanPackage,
  isRepeatableBooking,
  rebookHref
} from '../assets/customer-rebook-v285.js';

const eligible = {
  package_code: 'complete_detail',
  service_date: '2000-01-15',
  completed_at: '2000-01-15T18:00:00Z',
  price_total_cents: 41900,
  deposit_cents: 5000,
  start_slot: 'AM',
  customer_email: 'should-not-cross@example.invalid',
  status: 'completed',
  job_status: 'completed'
};

assert.equal(cleanPackage('  complete_detail  '), 'complete_detail');
assert.equal(cleanDate('2000-01-15T18:00:00Z'), '2000-01-15');
assert.equal(isRepeatableBooking(eligible), true, 'completed historical service with package/date should be repeatable');
assert.equal(isRepeatableBooking({ ...eligible, status: 'refunded' }), false, 'refunded history must not receive a rebook action');
assert.equal(isRepeatableBooking({ ...eligible, package_code: '' }), false, 'package-less history must fail closed');
assert.equal(isRepeatableBooking({ ...eligible, service_date: '' }), false, 'date-less history must fail closed');

const href = rebookHref(eligible);
assert.ok(href.startsWith('/book?'), 'safe rebook must enter the current /book shell');
const parsed = new URL(href, 'https://www.rosiedazzlers.ca');
assert.deepEqual([...parsed.searchParams.keys()].sort(), ['rebook_date', 'rebook_package'], 'handoff must contain only package/date verification evidence');
assert.equal(parsed.searchParams.get('rebook_package'), 'complete_detail');
assert.equal(parsed.searchParams.get('rebook_date'), '2000-01-15');
assert.equal(rebookHref({ package_code: 'complete_detail' }), '', 'missing history date must produce no rebook URL');
assert.equal(rebookHref({ service_date: '2000-01-15' }), '', 'missing package must produce no rebook URL');

for (const forbidden of ['price', 'deposit', 'slot', 'customer', 'email', 'phone', 'booking_id', 'payment', 'addon', 'status']) {
  assert.equal([...parsed.searchParams.keys()].some((key) => key.toLowerCase().includes(forbidden)), false, `handoff must not carry ${forbidden}`);
}

const rebookSource = await readFile(new URL('../assets/customer-rebook-v285.js', import.meta.url), 'utf8');
const bookingHoursSource = await readFile(new URL('../assets/booking-hours.js', import.meta.url), 'utf8');
const accountHistorySource = await readFile(new URL('../assets/my-account-v355.js', import.meta.url), 'utf8');
const clientAuthSource = await readFile(new URL('../assets/client-auth.js', import.meta.url), 'utf8');

assert.ok(rebookSource.includes('data-build355-completed-service'), 'safe rebook must attach to canonical completed-service cards');
assert.ok(rebookSource.includes('data.service_history'), 'safe rebook must use canonical dashboard service_history on My Account');
assert.ok(rebookSource.includes('[data-choose-package]'), 'retained verifier must understand the current unified service selector');
assert.ok(rebookSource.includes('DASHBOARD_API = "/api/client/dashboard"'), 'book handoff must still verify against the authenticated dashboard');
assert.ok(rebookSource.includes('That request does not match a repeatable booking in your authenticated history'), 'unverified history must fail closed');
assert.ok(rebookSource.includes('will not silently substitute another service'), 'retired service must fail closed');
assert.ok(bookingHoursSource.includes('loadBuild356SafeRebookHandoff'), 'current /book shell must bootstrap safe rebook verification');
assert.ok(bookingHoursSource.includes("query.get('rebook_package')"));
assert.ok(bookingHoursSource.includes("query.get('rebook_date')"));
assert.ok(bookingHoursSource.includes('/assets/customer-rebook-v285.js?v=20260907build356'));
assert.ok(accountHistorySource.includes('payload?.service_history'), 'completed service cards must remain sourced from canonical service_history');
assert.ok(clientAuthSource.includes('/assets/customer-rebook-v285.js?v=20260907build356'), 'My Account must request the successor-compatible rebook helper');

for (const forbiddenSourceToken of ['rebook_price', 'rebook_deposit', 'rebook_slot', 'rebook_customer', 'rebook_email', 'rebook_phone', 'rebook_booking_id', 'rebook_payment', 'rebook_addons']) {
  assert.equal(rebookSource.includes(forbiddenSourceToken), false, `rebook helper must not introduce ${forbiddenSourceToken}`);
}

console.log('MY ACCOUNT SAFE REBOOK: PASS');
console.log('- canonical completed-service cards expose only package/date rebook verification evidence');
console.log('- current unified /book shell loads the retained authenticated verifier');
console.log('- current service selector is recognized and retired/unverified services fail closed');
console.log('- historical price, schedule, payment, identity, add-ons and booking state are not carried forward');
