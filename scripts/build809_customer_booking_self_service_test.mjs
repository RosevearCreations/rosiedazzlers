import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { appointmentState809, appointmentTimeline809, changeRequestChoices809, changeRequestPreview809,
  pendingBookingRequest809, torontoToday809, validServiceDate809 } from '../assets/customer-booking-self-service-v809.mjs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const b1 = '00112233-4455-4677-8899-aabbccddeeff';
const b2 = '10112233-4455-4677-8899-aabbccddeeff';
const b3 = '20112233-4455-4677-8899-aabbccddeeff';
const booking = (id, overrides = {}) => ({ id, service_date: '2030-07-09', start_slot: 'Morning', status: 'confirmed', job_status: 'scheduled', package_code: 'basic_detail', ...overrides });
const active = booking(b1);
const closed = booking(b2, { detailing_completed_at: '2030-07-09T15:00:00Z', job_status: 'completed' });
const pending = { id: b3, booking_id: b1, status: 'pending_review', request_type: 'reschedule', preferred_service_date: '2030-07-11' };
const now = new Date('2026-11-08T06:30:00Z');

assert.equal(torontoToday809(now), '2026-11-08', 'Date validation uses Toronto local date (EST)');
assert.equal(torontoToday809(new Date('2026-07-01T03:30:00Z')), '2026-06-30', 'Handles EDT date boundary');
assert.equal(validServiceDate809('2030-02-28', '2030-02-01'), true);
for (const date of ['2030-02-30', '2030-00-12', '2020-01-01', '2030-3-05', '<svg/onload=alert(1)>']) {
  assert.equal(validServiceDate809(date, '2030-02-01'), false, `Invalid date ${date} denied`);
}

assert.deepEqual(appointmentState809({ ...active, id: 'not-a-uuid' }), null);
assert.equal(appointmentState809(active).label, 'Booking confirmed');
assert.equal(appointmentState809(closed).can_request, false);
assert.equal(appointmentState809(booking(b2, { status: 'pending', job_status: 'scheduled' })).confirmed, false);
assert.match(appointmentState809(booking(b2, { status: 'unknown' })).label, /needs confirmation/);
assert.equal(appointmentState809(booking(b2, { status: 'cancelled', job_status: 'scheduled' })).closed, true);
assert.equal(pendingBookingRequest809(b1, [pending]), pending);
assert.equal(pendingBookingRequest809(b2, [pending]), null);
assert.deepEqual(changeRequestChoices809([active, closed], [pending]), []);
assert.deepEqual(changeRequestChoices809([active, closed], []).map(x => x.id), [b1]);
const timeline = appointmentTimeline809([closed, active, { ...active, id: 'invalid' }], [pending]);
assert.equal(timeline.length, 2);
assert.equal(timeline[0].id, b1);
assert.equal(timeline[0].request, pending);
assert.equal(timeline[1].closed, true);

const preview = (values, rows = [active], requests = []) => changeRequestPreview809(values, rows, requests, '2030-07-01');
assert.equal(preview({ booking_id: b2, request_type: 'cancel' }).ok, false, 'Only account bookings may be changed');
assert.equal(preview({ booking_id: b1, request_type: 'cancel' }, [closed]).ok, false, 'Closed bookings blocked');
assert.equal(preview({ booking_id: b1, request_type: 'cancel' }, [active], [pending]).ok, false, 'One pending request at a time');
assert.equal(preview({ booking_id: b1, request_type: 'cancel' }).ok, true);
assert.match(preview({ booking_id: b1, request_type: 'cancel' }).message, /unchanged until Rosie reviews/);
assert.equal(preview({ booking_id: b1, request_type: 'reschedule', preferred_service_date: '2030-02-31' }).ok, false);
assert.equal(preview({ booking_id: b1, request_type: 'reschedule', preferred_service_date: '2030-07-09' }).ok, false, 'Identical date and time blocked');
assert.equal(preview({ booking_id: b1, request_type: 'reschedule', preferred_service_date: '2030-07-09', preferred_start_slot: 'Afternoon' }).ok, true);
assert.equal(preview({ booking_id: b1, request_type: 'reschedule', preferred_service_date: '2030-07-10' }).ok, true);
assert.match(preview({ booking_id: b1, request_type: 'reschedule', preferred_service_date: '2030-07-10' }).message, /not reserved/);

const html = read('../my-account.html');
const mirror = read('../my-account/index.html');
const ui = read('../assets/my-account-history-v742.js');
assert.equal(html, mirror, 'Both customer routes stay byte-for-byte identical');
for (const id of ['build809AppointmentStatus', 'build809AppointmentList', 'build809RequestPreview', 'build742RequestForm']) {
  assert.match(html, new RegExp(`id="${id}"`));
}
assert.match(html, /customer-booking-self-service-v809\.css/);
assert.match(html, /existing appointment stays unchanged/i);
assert.match(html, /Contact Rosie for urgent changes/);
assert.match(read('../assets/my-account-v355.js'), /my-account-history-v742\.js\?v=20261108build813/);
assert.match(ui, /changeRequestChoices809\(accountBookings, accountRequests\)/);
assert.match(ui, /previewRequest809\(\)/);
assert.match(ui, /renderAppointments809\(\)/);
assert.match(ui, /esc\(item\.start_slot\)/, 'Appointment text escaped before DOM rendering');
assert.match(ui, /historyReady = false/, 'Fail-closed loading state');
assert.match(ui, /client_request_id: lastSubmittedKey|body\.client_request_id = lastSubmittedKey/, 'Stable server idempotency reference');
assert.doesNotMatch(ui, /localStorage|sessionStorage|setInterval\s*\(/, 'No persisted account data or background polling');
assert.doesNotMatch(ui, /\/api\/admin\/(booking_update|send_message)|fetch\(['"]\/api\/client\/dashboard['"],\s*\{\s*method:\s*['"]POST/, 'No unauthorized schedule mutation');
const handler = read('../functions/api/client/account_history_v742.js');
assert.match(handler, /sameOriginPost\(request\)/);
assert.match(handler, /getCurrentCustomerSession/);
assert.match(handler, /client_request_id/);
assert.match(handler, /customer_profile_id/);
assert.match(handler, /appointment_changed: false/);
assert.doesNotMatch(handler, /api\.stripe\.com|api-m\.paypal\.com|sendgrid|twilio/);
const gate = read('./current_booking_wizard_regression.sh');
assert.match(gate, /build742_account_history_change_requests_test\.mjs/);
assert.match(gate, /build809_customer_booking_self_service_test\.mjs/);
console.log('Build 809 PASS: authenticated appointment projection, pending request guard, date/slot validation, safe preview, route parity, XSS escaping and no automatic change/payment/outreach.');
