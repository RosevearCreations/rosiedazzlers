import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { onRequestPost as webhook } from '../functions/api/gifts/webhook.js';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const env = {
  SUPABASE_URL: 'https://database.example.test', SUPABASE_SERVICE_ROLE_KEY: 'service-test',
  STRIPE_WEBHOOK_SECRET_GIFTS: 'whsec_build674_mock', STRIPE_SECRET_KEY: 'sk_test_build674',
  SITE_ORIGIN: 'https://rosiedazzlers.ca'
};
const originalFetch = globalThis.fetch;
const signer = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.STRIPE_WEBHOOK_SECRET_GIFTS),
  { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
const stamp = Math.floor(Date.now() / 1000);
const session = (id, extra = {}) => ({
  id, created: 1793050000, payment_status: 'paid', payment_intent: 'pi_test_only',
  metadata: {
    purpose: 'gift', cart: 'GIFT-100:2:', purchaser_email: 'buyer@example.test',
    recipient_email: 'recipient@example.test', recipient_name: 'Recipient',
    delivery_date: '2090-10-26', gift_message: 'Happy day!', ...extra
  }
});
async function deliver(eventId, eventType, details) {
  const payload = JSON.stringify({ id: eventId, type: eventType, data: { object: details } });
  const signed = await crypto.subtle.sign('HMAC', signer, new TextEncoder().encode(`${stamp}.${payload}`));
  const hmac = Array.from(new Uint8Array(signed), (b) => b.toString(16).padStart(2, '0')).join('');
  const request = new Request('https://rosiedazzlers.ca/api/gifts/webhook', {
    method: 'POST', headers: { 'stripe-signature': `t=${stamp},v1=${hmac}` }, body: payload
  });
  const response = await webhook({ request, env });
  return { status: response.status, body: await response.json() };
}

const receiptBySession = new Map();
const events = [];
const giftRows = new Map();
let rpcCalls = 0;
let failRpc = false;
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(input);
  assert.equal(url.host, 'database.example.test');
  if (url.pathname.endsWith('/gift_products')) return Response.json([
    { sku: 'GIFT-100', type: 'fixed_value', currency: 'CAD', face_value_cents: 10000, is_active: true }
  ]);
  if (url.pathname.endsWith('/rpc/issue_gift_certificates_atomic')) {
    rpcCalls += 1;
    if (failRpc) return Response.json({ error: 'DB unavailable' }, { status: 503 });
    assert.equal(init.method, 'POST');
    const p = JSON.parse(init.body);
    assert.match(p.p_payload_digest, /^[0-9a-f]{64}$/);
    assert.equal(p.p_rows.length, 2);
    assert.deepEqual(p.p_rows.map((row) => row.checkout_line_number), [1, 2]);
    const prior = receiptBySession.get(p.p_session_id);
    let outcome = 'issued';
    if (prior) {
      outcome = prior.digest === p.p_payload_digest && prior.count === p.p_rows.length ? 'replayed' : 'hold';
      if (outcome === 'hold') prior.hold = true;
    } else {
      receiptBySession.set(p.p_session_id, { digest: p.p_payload_digest, count: p.p_rows.length });
      giftRows.set(p.p_session_id, p.p_rows);
    }
    events.push({ id: p.p_event_id, type: p.p_event_type, session: p.p_session_id, outcome });
    return Response.json({ outcome, issued_count: outcome === 'issued' ? 2 : 0,
      hold_reason: outcome === 'hold' ? 'payload_or_certificate_count_mismatch' : null });
  }
  if (url.pathname.endsWith('/gift_certificates') && init.method === 'GET') {
    const items = giftRows.get(url.searchParams.get('stripe_session_id')?.slice(3)) || [];
    return Response.json(items.map((row, index) => ({ ...row, id: `gift-${index}` })));
  }
  if (url.pathname.endsWith('/app_management_settings')) return Response.json([]);
  throw new Error(`Unexpected fetch ${init.method || 'GET'} ${url}`);
};

try {
  const parallel = await Promise.all([
    deliver('evt_674_a', 'checkout.session.completed', session('cs_test_concurrent_674')),
    deliver('evt_674_b', 'checkout.session.completed', session('cs_test_concurrent_674'))
  ]);
  assert.deepEqual(parallel.map((r) => r.status), [200, 200]);
  assert.deepEqual(parallel.map((r) => r.body.issued).sort(), [0, 2]);
  assert.equal(giftRows.get('cs_test_concurrent_674').length, 2, 'Parallel deliveries must not insert four certificates');
  assert.equal(events.filter((event) => event.session === 'cs_test_concurrent_674').length, 2);
  assert.equal(events.filter((event) => event.outcome === 'replayed').length, 1);

  const repeat = await deliver('evt_674_a', 'checkout.session.completed', session('cs_test_concurrent_674'));
  assert.equal(repeat.body.idempotent, true);
  assert.equal(repeat.body.replay_evidence_recorded, true);
  assert.equal(giftRows.get('cs_test_concurrent_674').length, 2);

  const mismatch = await deliver('evt_674_conflict', 'checkout.session.completed',
    session('cs_test_concurrent_674', { gift_message: 'Different content!' }));
  assert.equal(mismatch.body.owner_recovery_hold, true);
  assert.equal(mismatch.body.hold_reason, 'payload_or_certificate_count_mismatch');
  assert.equal(giftRows.get('cs_test_concurrent_674').length, 2);

  const priorCalls = rpcCalls;
  const unpaid = await deliver('evt_674_unpaid', 'checkout.session.completed',
    { ...session('cs_test_pending_674'), payment_status: 'unpaid' });
  assert.equal(unpaid.body.awaiting_confirmed_payment, true);
  assert.equal(rpcCalls, priorCalls, 'Unpaid completion must not issue a redeemable gift');

  const asyncPaid = await deliver('evt_674_async', 'checkout.session.async_payment_succeeded',
    session('cs_test_async_674'));
  assert.equal(asyncPaid.body.issued, 2);
  assert.equal(giftRows.get('cs_test_async_674').length, 2);

  failRpc = true;
  const unavailable = await deliver('evt_674_error', 'checkout.session.completed', session('cs_test_error_674'));
  assert.equal(unavailable.status, 503);
  assert.equal(unavailable.body.owner_recovery_hold, true);
  assert.equal(giftRows.has('cs_test_error_674'), false);
} finally { globalThis.fetch = originalFetch; }

const sql = read('supabase/migrations/20261026231937_build674_gift_issuance_atomic_replay_hold.sql');
assert.match(sql, /create unique index if not exists gift_certificates_checkout_line_unique/i);
assert.match(sql, /pg_advisory_xact_lock/);
assert.match(sql, /security invoker/i);
assert.match(sql, /revoke all on function public\.issue_gift_certificates_atomic/);
assert.match(sql, /state = 'hold'/);
assert.match(sql, /purchase_context #>> '\{gift_delivery,delivery_status\}' = 'pending'/);
assert.match(sql, /create table if not exists public\.gift_issuance_webhook_events/);
const adminApi = read('functions/api/admin/gift_issuance_recovery_review.js');
assert.match(adminApi, /requireStaffAccess/);
assert.match(adminApi, /"GET"/);
assert.doesNotMatch(adminApi, /method:\s*['"](?:POST|PATCH|DELETE)['"]/);
assert.match(read('admin-site-settings.html'), /giftIssuanceReviewBtn/);
console.log('Build 674 atomic RPC contract, parallel/replayed webhooks, paid gate, conflict hold, provider failure and owner read-only review: PASS');
