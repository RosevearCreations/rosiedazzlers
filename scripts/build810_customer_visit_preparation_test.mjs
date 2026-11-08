import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PREPARATION_ITEMS_810, preparationCandidates810, preparationProgress810,
  preparationSummary810, clearCustomerVisitPreparation810, loadCustomerVisitPreparation810 } from '../assets/customer-visit-preparation-v810.mjs';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');
const a = '00000001-0001-4001-8001-000000000001';
const b = '00000002-0002-4002-8002-000000000002';
const c = '00000003-0003-4003-8003-000000000003';
const makeBooking = (id, date, extra = {}) => ({ id, service_date: date, start_slot: 'Afternoon',
  package_code: 'complete_detail', status: 'confirmed', job_status: 'scheduled', ...extra });
const active = makeBooking(a, '2030-03-10');
const review = makeBooking(b, '2030-03-12', { status: 'pending' });
const pending = { booking_id: b, request_type: 'reschedule', status: 'pending_review' };
const today = '2030-03-09';

assert.equal(PREPARATION_ITEMS_810.length, 6);
assert.equal(new Set(PREPARATION_ITEMS_810.map(item => item.id)).size, 6, 'Checklist ids are unique');
const candidates = preparationCandidates810([
  makeBooking(c, '2030-03-08'), active, review,
  makeBooking(c, '2030-03-15', { job_status: 'completed' }),
  makeBooking(c, '2030-03-15', { job_status: 'cancelled' }),
  makeBooking(c, '2030-03-15', { job_status: 'in_progress' }),
  makeBooking(c, '2030-02-30'),
  makeBooking('not-a-uuid', '2030-03-15')
], [pending], today);
assert.deepEqual(candidates.map(item => item.id), [a,b], 'Only genuine upcoming, open appointments receive preparation guidance');
assert.equal(candidates[0].confirmed, true);
assert.equal(candidates[1].request, pending);
assert.equal(candidates[1].confirmed, false);
assert.deepEqual(preparationCandidates810(null, [], today), []);
assert.deepEqual(preparationCandidates810([active], [], 'not-date'), []);

let progress = preparationProgress810(['space','space','invalid','water']);
assert.equal(progress.done, 1, 'Only known checklist items count; duplicates do not');
assert.equal(progress.total, 6);
assert.equal(progress.outstanding.length, 5);
progress = preparationProgress810(PREPARATION_ITEMS_810.map(item => item.id));
assert.equal(progress.done, 6);
assert.deepEqual(progress.outstanding, []);

const summary = preparationSummary810(candidates[0], ['space','utilities'], { has_water_hookup: true, has_power_hookup: false,
  email: 'private@example.com', phone: '99999999', address_line1: 'Private Street' });
assert.equal(summary.progress.done, 2);
assert.match(summary.status, /confirmed on current account record/);
assert.match(summary.hookupNote, /Rosie brings standard detailing water and power/);
assert.match(summary.hookupNote, /power hookup not marked available/);
assert.doesNotMatch(summary.message + summary.hookupNote, /private@example|99999999|Private Street/);
assert.match(summary.message, /not sent automatically/);
assert.match(summary.message, /not a staff acknowledgment/);
assert.match(preparationSummary810(candidates[1], [], {}).status, /requires confirmation|pending staff review/);
assert.match(preparationSummary810(candidates[1], [], {}).message, /staff confirmation required/);
assert.equal(preparationSummary810({ service_date: '2030-02-30', id: a }, [], {}), null);

// No authenticated dashboard means no private visit data is shown.
const elements = new Map();
const element = id => elements.get(id) || null;
for (const id of ['build810Preparation','build810Booking','build810VisitStatus','build810VisitGuidance',
  'build810Checklist','build810Copy','build810Reset','build810Progress','build810CopyStatus','build810CopyNote','build810CopyFallback']) {
  elements.set(id, { value: '', innerHTML: '', textContent: '', hidden: false, disabled: false,
    addEventListener() {}, replaceChildren() { this.innerHTML = ''; } });
}
globalThis.document = { getElementById: element };
try {
  loadCustomerVisitPreparation810({ ok:true, authenticated:false, customer:{ id:a }, bookings:[active] });
  assert.equal(element('build810Booking').disabled, true);
  assert.equal(element('build810VisitGuidance').innerHTML, '');
  assert.equal(element('build810Copy').disabled, true);
  loadCustomerVisitPreparation810({ ok:true, authenticated:true, customer:{ id:'malformed' }, bookings:[active] });
  assert.equal(element('build810Booking').disabled, true);
  clearCustomerVisitPreparation810();
  assert.equal(element('build810CopyNote').value, '');
} finally { delete globalThis.document; }

const html = read('../my-account.html'), mirror = read('../my-account/index.html');
assert.equal(html, mirror, 'Both My Account aliases must be exactly identical');
for (const id of ['build810Preparation','build810Booking','build810VisitStatus','build810VisitGuidance',
  'build810Checklist','build810Progress','build810Copy','build810Reset','build810CopyNote','build810CopyFallback']) {
  assert.match(html, new RegExp(`id="${id}"`));
}
assert.match(html, /customer-visit-preparation-v810\.css/);
assert.match(html, /my-account-v355\.js\?v=20261108build810/);
assert.match(html, /Rosie brings standard detailing water and power/);
assert.match(html, /they are not saved or sent/);
assert.match(read('../assets/site-policies.js'), /Rosie brings standard detailing water and power/);
assert.match(read('../data/site_policies.json'), /Rosie brings standard detailing water and power/);

const history = read('../assets/my-account-history-v742.js');
assert.match(history, /loadCustomerVisitPreparation810\(dashboard, accountRequests\)/);
assert.match(history, /clearCustomerVisitPreparation810\(\)/);
assert.match(history, /data-build810-select/);
assert.match(read('../assets/my-account-v355.js'), /my-account-history-v742\.js\?v=20261108build809&build810=1/);
const client = read('../assets/customer-visit-preparation-v810.mjs');
assert.doesNotMatch(client, /\bfetch\s*\(|localStorage|sessionStorage|indexedDB|sendBeacon|setInterval\s*\(/,
  'Preparation is client-only and does not create hidden storage, network writes or polling');
assert.match(client, /esc\(appointment\.start_slot\)/, 'Account-sourced appointment text is HTML-escaped');
assert.match(client, /profileId !== accountKey/, 'Checklist state resets for a new signed-in account');
assert.match(client, /currentChecks\.clear\(\)/, 'Signed-out/reset path scrubs previous account state');
assert.match(read('./current_booking_wizard_regression.sh'), /build810_customer_visit_preparation_test\.mjs/);
console.log('Build 810 PASS: safe upcoming appointment selection, Toronto date handling, personal checklist, accurate water/power policy, account privacy, and no automatic change or outreach.');
