import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  cleanDate,
  cleanPackage,
  isRepeatableBooking,
  isCurrentCatalogPackageBookable,
  resolveCurrentCatalogPackage,
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

const currentPackage = {
  code: 'complete_detail',
  name: 'Complete Detail',
  prices_cad: { small: 319, mid: 369, oversize: 419 },
  deposit_cad: 100
};
assert.equal(isCurrentCatalogPackageBookable(currentPackage), true, 'current package with live pricing should be bookable');
assert.equal(isCurrentCatalogPackageBookable({ ...currentPackage, active: false }), false, 'explicitly inactive package must fail closed');
assert.equal(isCurrentCatalogPackageBookable({ ...currentPackage, enabled: false }), false, 'explicitly disabled package must fail closed');
assert.equal(isCurrentCatalogPackageBookable({ ...currentPackage, bookable: false }), false, 'explicitly non-bookable package must fail closed');
assert.equal(isCurrentCatalogPackageBookable({ ...currentPackage, status: 'retired' }), false, 'retired catalog package must fail closed');
assert.equal(isCurrentCatalogPackageBookable({ ...currentPackage, prices_cad: { small: null, mid: null, oversize: null } }), false, 'package without current vehicle-size pricing must fail closed');
assert.equal(resolveCurrentCatalogPackage({ packages: [currentPackage] }, 'complete_detail')?.name, 'Complete Detail', 'requested service must resolve from the current catalog');
assert.equal(resolveCurrentCatalogPackage({ packages: [{ ...currentPackage, status: 'retired' }] }, 'complete_detail'), null, 'retired current-catalog service must not resolve');
assert.equal(resolveCurrentCatalogPackage({ packages: [currentPackage] }, 'legacy_detail'), null, 'missing current-catalog service must not resolve');
assert.equal(resolveCurrentCatalogPackage(null, 'complete_detail'), null, 'missing current catalog must fail closed');

const rebookSource = await readFile(new URL('../assets/customer-rebook-v285.js', import.meta.url), 'utf8');
const bookingHoursSource = await readFile(new URL('../assets/booking-hours.js', import.meta.url), 'utf8');
const accountHistorySource = await readFile(new URL('../assets/my-account-v355.js', import.meta.url), 'utf8');
const clientAuthSource = await readFile(new URL('../assets/client-auth.js', import.meta.url), 'utf8');

assert.ok(rebookSource.includes('data-build355-completed-service'), 'safe rebook must attach to canonical completed-service cards');
assert.ok(rebookSource.includes('data.service_history'), 'safe rebook must use canonical dashboard service_history on My Account');
assert.ok(rebookSource.includes('[data-choose-package]'), 'retained verifier must understand the current unified service selector');
assert.ok(rebookSource.includes('DASHBOARD_API = "/api/client/dashboard"'), 'book handoff must still verify against the authenticated dashboard');
assert.ok(rebookSource.includes('CURRENT_CATALOG_API = "/api/pricing_catalog_public"'), 'Build 357 must revalidate against the current public pricing catalog');
assert.ok(rebookSource.includes('loadCurrentPricingCatalog()'), 'Build 357 must load current catalog state before selecting a service');
assert.ok(rebookSource.includes('resolveCurrentCatalogPackage(currentCatalog, requestedPackage)'), 'historical service code must resolve through the current catalog');
assert.ok(rebookSource.includes('The current service catalog and pricing could not be verified'), 'catalog read failure must fail closed');
assert.ok(rebookSource.includes('retired, unavailable, or no longer has current bookable pricing'), 'retired/unpriced services must fail closed');
assert.ok(rebookSource.includes('data-build357-current-catalog-verified'), 'successful rebook context must expose explicit current-catalog verification evidence');
assert.ok(rebookSource.includes('current_catalog_verified: true'), 'analytics may record only bounded verification evidence');
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
assert.equal(rebookSource.includes('rosie_services_pricing_and_packages.json'), false, 'Build 357 revalidation must not silently fall back to bundled historical catalog data');
assert.equal(rebookSource.includes('/api/checkout'), false, 'revalidation helper must not create a checkout authority');
assert.equal(rebookSource.includes('/api/availability'), false, 'revalidation helper must not create an availability authority');

console.log('MY ACCOUNT SAFE REBOOK + CURRENT CATALOG REVALIDATION: PASS');
console.log('- canonical completed-service cards expose only package/date rebook verification evidence');
console.log('- current unified /book shell loads the retained authenticated verifier');
console.log('- historical package/date must match authenticated history and resolve through the current public catalog');
console.log('- missing, disabled, retired, unavailable or unpriced current services fail closed without substitution');
console.log('- historical price, schedule, payment, identity, add-ons and booking state are not carried forward');
console.log('- current vehicle size, catalog price, availability, add-ons, deposit and payment rules remain authoritative');
