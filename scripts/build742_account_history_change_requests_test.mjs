import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { onRequestGet, onRequestPost } from '../functions/api/client/account_history_v742.js';
import { accountHistorySnapshot, requestableBookings } from '../assets/my-account-history-v742.js';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const customerId = 'c7524d89-49b9-4ec2-a44e-f695c146e7af';
const bookingId = '479608a1-4fd8-42e6-a6a4-42094513ce17';
const requestId = 'e8a0f599-cd22-44c0-9fa4-c992998a9a4c';
const foreignCustomer = '72c8ae08-6501-4231-a401-495a4e6d32b4';
const api = 'https://rosiedazzlers.ca/api/client/account_history_v742';
const env = { SUPABASE_URL: 'https://supabase-mock.invalid', SUPABASE_SERVICE_ROLE_KEY: 'test-key-only' };
const authenticatedSession = [{ id: requestId, expires_at: '2031-01-01T00:00:00Z', revoked_at: null,
  customer_profile: { id: customerId, email: 'owner@example.com', is_active: true } }];
const ownedBooking = { id: bookingId, customer_profile_id: customerId, customer_email: 'owner@example.com',
  service_date: '2030-07-11', status: 'confirmed', job_status: 'scheduled', detailing_completed_at: null };
const suppliedRows = {
  customer_booking_change_requests: [],
  quote_proposal_drafts: [{ id: requestId, title: '<script>Bad quote</script>', status: 'sent', acceptance_status: 'pending', sent_at: '2030-05-01', internal_note: 'SECRET STAFF NOTE' }],
  membership_interest_requests: [{ id: requestId, status: 'interested', preferred_cycle: '8_weeks', vehicle_count: 1, private_note: 'SECRET' }],
  quote_deposit_payment_requests: [{ id: requestId, paid_at: '2030-05-02', payment_status: 'paid', paid_amount_cents: 4000, currency: 'CAD', internal_note: 'SECRET' }],
  final_balance_payment_requests: [{ id: requestId, paid_at: '2030-05-03', status: 'paid', paid_amount_cents: 20000, currency: 'CAD', notes: 'SECRET' }],
  bookings: [ownedBooking]
};
let postCount = 0;
let postedBody = null;
let sessionPresent = true;
let overriddenBooking = null;
const originalFetch = globalThis.fetch;

function routeFetch(url, options = {}) {
  const path = new URL(url).pathname.split('/').pop();
  if (path === 'customer_auth_sessions') return Promise.resolve(new Response(JSON.stringify(sessionPresent ? authenticatedSession : []), { status: 200 }));
  if (options.method === 'POST') {
    assert.equal(path, 'customer_booking_change_requests');
    postCount++;
    postedBody = JSON.parse(options.body)[0];
    return Promise.resolve(new Response(JSON.stringify([{
      id: requestId, booking_id: bookingId, request_type: postedBody.request_type,
      status: 'pending_review', preferred_service_date: postedBody.preferred_service_date,
      preferred_start_slot: postedBody.preferred_start_slot, customer_reason: postedBody.customer_reason,
      submitted_at: '2030-06-01T12:00:00Z', staff_private_note: 'NEVER EXPOSE'
    }]), { status: 201 }));
  }
  const rows = path === 'bookings' && overriddenBooking ? [overriddenBooking] : suppliedRows[path];
  assert.ok(Array.isArray(rows), `Unexpected source ${path}`);
  assert.equal(options.method ?? 'GET', 'GET', 'History may only read selected sources');
  if (['quote_proposal_drafts', 'membership_interest_requests', 'quote_deposit_payment_requests', 'final_balance_payment_requests'].includes(path)) {
    assert.match(url, /owner%40example.com/, 'Email-source rows must be filtered by verified session email');
    assert.doesNotMatch(url, /select=\*/, 'Never select source private columns');
  }
  return Promise.resolve(new Response(JSON.stringify(rows), { status: 200 }));
}

const makeGet = () => ({ request: new Request(api, { headers: { cookie: 'rd_client_session=a-test-session-token' } }), env });
const makePost = (data, { origin = 'https://rosiedazzlers.ca', cookie = true } = {}) => ({
  request: new Request(api, { method: 'POST', headers: {
    'Content-Type': 'application/json', Origin: origin,
    ...(cookie ? { Cookie: 'rd_client_session=a-test-session-token' } : {})
  }, body: JSON.stringify(data) }), env
});
const validBody = { booking_id: bookingId, client_request_id: requestId, request_type: 'reschedule',
  preferred_service_date: '2030-08-10', preferred_start_slot: 'Afternoon', reason: 'I will be out of town.' };

try {
  globalThis.fetch = routeFetch;
  sessionPresent = false;
  let response = await onRequestGet(makeGet());
  assert.equal(response.status, 401, 'Unauthenticated history must be denied');
  response = await onRequestPost(makePost(validBody));
  assert.equal(response.status, 401, 'Unauthenticated POST must be denied');
  sessionPresent = true;

  response = await onRequestGet(makeGet());
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.history.quotes.length, 1);
  assert.equal(data.history.payment_receipts.length, 2);
  assert.equal(data.history.maintenance_interest.length, 1);
  assert.equal(JSON.stringify(data).includes('SECRET'), false, 'No staff/private notes in customer projection');
  assert.equal(JSON.stringify(data).includes('internal_note'), false);
  assert.equal(data.history.authority.schedule_change_requires_staff_review, true);

  response = await onRequestPost(makePost(validBody, { origin: 'https://hostile.example' }));
  assert.equal(response.status, 403, 'CSRF/cross-origin write blocked');
  response = await onRequestPost(makePost({ ...validBody, reason: 'short' }));
  assert.equal(response.status, 400, 'Reason validation');
  response = await onRequestPost(makePost({ ...validBody, preferred_service_date: '2020-01-01' }));
  assert.equal(response.status, 400, 'Past dates cannot be requested');
  assert.equal(postCount, 0);

  overriddenBooking = { ...ownedBooking, customer_profile_id: foreignCustomer };
  response = await onRequestPost(makePost(validBody));
  assert.equal(response.status, 404, 'Different exact profile even with matching email must be denied');
  overriddenBooking = { ...ownedBooking, status: 'completed' };
  response = await onRequestPost(makePost(validBody));
  assert.equal(response.status, 409, 'Closed booking cannot be changed');
  overriddenBooking = null;

  response = await onRequestPost(makePost(validBody));
  assert.equal(response.status, 201, await response.clone().text());
  const submitted = await response.json();
  assert.equal(submitted.change_request.status, 'pending_review');
  assert.equal(submitted.appointment_changed, false);
  assert.equal(submitted.notification_sent, false);
  assert.equal(postCount, 1);
  assert.deepEqual([postedBody.customer_profile_id, postedBody.customer_email_snapshot, postedBody.status],
    [customerId, 'owner@example.com', 'pending_review']);
  assert.equal(submitted.change_request.staff_private_note, undefined);

  suppliedRows.customer_booking_change_requests = [{ id: requestId, booking_id: bookingId,
    client_request_id: requestId, request_type: 'reschedule', status: 'pending_review' }];
  response = await onRequestPost(makePost(validBody));
  assert.equal(response.status, 200, 'Same request ID replay is safe');
  assert.equal((await response.json()).duplicate, true);
  assert.equal(postCount, 1, 'Idempotent replay never inserts again');

  assert.equal(requestableBookings([ownedBooking, { ...ownedBooking, id: '2', status: 'cancelled' }]).length, 1);
  assert.deepEqual(accountHistorySnapshot({ bookings: [ownedBooking], gift_certificates: [{}] }, data.history), {
    booking_count: 1, quote_count: 1, receipt_count: 2, gift_count: 1, maintenance_count: 1, request_count: 0
  });
} finally { globalThis.fetch = originalFetch; }

const migration = read('../supabase/migrations/20261102120000_build742_customer_booking_change_requests.sql');
assert.match(migration, /enable row level security/);
assert.match(migration, /revoke all.*anon, authenticated/);
assert.match(migration, /where status = 'pending_review'/);
assert.match(migration, /unique \(customer_profile_id, client_request_id\)/);
const handler = read('../functions/api/client/account_history_v742.js');
assert.doesNotMatch(handler, /rest\/v1\/bookings[^`]*method:\s*'PATCH'/, 'No direct booking mutation');
assert.doesNotMatch(handler, /api\.stripe\.com|api-m\.paypal\.com|sendgrid|twilio/i);
const html = read('../my-account.html');
const mirror = read('../my-account/index.html');
assert.equal(html, mirror, 'Account route aliases must be identical');
assert.match(html, /id="build742RequestForm"/);
assert.match(html, /aria-live="polite"/);
assert.match(html, /type="date" required/);
assert.match(read('../assets/my-account-v355.js'), /my-account-history-v742/);
console.log('Build 742 account history, row ownership, no private notes, CSRF, session, request idempotency and form regression: PASS');
