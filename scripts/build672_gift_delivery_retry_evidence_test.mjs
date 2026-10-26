import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GIFT_DELIVERY_UUID, reconcileGiftDeliveryEvidence } from '../functions/api/_lib/gift-delivery-evidence-672.js';
import { onRequestGet, onRequestPost } from '../functions/api/admin/gift_delivery_retry_evidence_review.js';

const read = (file) => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const id = '5c254f01-a625-477e-86df-aed6d68ee3cc';
const eventId = '50710f05-9d05-4915-b24d-14dd635cadbd';
const copyId = 'a1a4ab4e-4b0a-434c-a598-1ed581c1ef5f';
const at = new Date('2026-10-26T19:00:00Z');
const gift = (status, event_status = status) => ({
  id, status: 'active', recipient_email: 'recipient@example.com', purchaser_email: 'buyer@example.com',
  purchase_context: { gift_delivery: { delivery_status: status, notification_event_id: eventId, copy_notification_event_id: copyId, last_error: 'Private provider reason', sent_at: event_status === 'sent' ? at.toISOString() : null } }
});
const event = (id, event_type, status, extra = {}) => ({ id, event_type, status, attempt_count: 1, max_attempts: 5, last_error: status === 'failed' ? 'Private recipient email recipient@example.com' : null, ...extra });
const rec = (status, extra = {}) => event(eventId, 'gift_scheduled_delivery_email', status, extra);
const copy = (status, extra = {}) => event(copyId, 'gift_scheduled_delivery_purchaser_copy_email', status, extra);
const model = (g, records, opts = {}) => reconcileGiftDeliveryEvidence(g, records, { now: at, ...opts });

assert.ok(GIFT_DELIVERY_UUID.test(id));
assert.ok(!GIFT_DELIVERY_UUID.test('GIFT-TEST'));
assert.ok(!GIFT_DELIVERY_UUID.test('a'.repeat(100)));

const recipientSent = model(gift('sent'), [rec('sent'), copy('sent')]);
assert.equal(recipientSent.owner_retry_candidate, false);
assert.equal(recipientSent.recipient.review, 'provider_accepted_do_not_retry');
assert.equal(recipientSent.decision, 'hold_no_automatic_resend');

const recipientFailed = model(gift('failed'), [rec('failed'), copy('sent')]);
assert.equal(recipientFailed.owner_retry_candidate, true);
assert.equal(recipientFailed.candidate_target, 'recipient');
assert.equal(recipientFailed.recipient.attempts, 1);
assert.equal(recipientFailed.recipient.provider_error_recorded, true);
assert.ok(!JSON.stringify(recipientFailed).includes('recipient@example.com'));
assert.ok(!JSON.stringify(recipientFailed).includes('Private'));

const copyFailed = model(gift('failed'), [rec('sent'), copy('failed')]);
assert.equal(copyFailed.owner_retry_candidate, true);
assert.equal(copyFailed.candidate_target, 'purchaser_copy');
assert.ok(copyFailed.evidence_flags.includes('purchaser_copy_only_failure'));
assert.ok(copyFailed.evidence_flags.includes('gift_failed_but_recipient_provider_accepted'));
assert.equal(copyFailed.recipient.review, 'provider_accepted_do_not_retry');

const retryResolved = model(gift('failed'), [rec('sent'), copy('sent')]);
assert.ok(retryResolved.evidence_flags.includes('gift_failed_but_recipient_provider_accepted'));
assert.equal(retryResolved.owner_retry_candidate, false);

const missing = model(gift('failed'), []);
assert.equal(missing.owner_retry_candidate, false);
assert.ok(missing.evidence_flags.includes('recipient_pointer_not_in_history'));

const duplicateRecipient = model(gift('failed'), [rec('failed'), event('db99230e-a77d-4fab-8b50-7797cb22422c', 'gift_scheduled_delivery_email', 'sent'), copy('sent')]);
assert.equal(duplicateRecipient.owner_retry_candidate, false);
assert.ok(duplicateRecipient.evidence_flags.includes('multiple_recipient_events_no_blind_retry'));

const retryWait = model(gift('failed'), [rec('failed', { next_attempt_at: '2026-10-27T20:00:00Z' }), copy('sent')]);
assert.equal(retryWait.owner_retry_candidate, false);
assert.equal(retryWait.recipient.review, 'backoff_pending_no_immediate_retry');
assert.equal(model(gift('failed'), [rec('failed', { attempt_count: 5 }), copy('sent')]).owner_retry_candidate, false);
assert.equal(model(gift('failed'), [rec('failed', { max_attempts: 0 }), copy('sent')]).owner_retry_candidate, false);
assert.equal(model(gift('failed'), [rec('queued'), copy('sent')]).owner_retry_candidate, false);
assert.equal(model(gift('failed'), [rec('cancelled'), copy('sent')]).owner_retry_candidate, false);
assert.equal(model({ ...gift('failed'), status: 'redeemed' }, [rec('failed'), copy('sent')]).owner_retry_candidate, false);
assert.equal(model(gift('failed'), [rec('failed'), copy('sent')], { history_complete: false }).owner_retry_candidate, false);
assert.equal(model(gift('failed'), [rec('failed'), copy('sent')], { history_truncated: true }).owner_retry_candidate, false);
assert.equal(model(gift('failed'), [rec('failed'), copy('sent'), copy('failed', { id: 'eee9615a-bbab-4304-8849-9ec07143123d' })]).owner_retry_candidate, false);

const settings = read('admin-site-settings.html');
assert.equal(settings, read('admin-site-settings/index.html'));
assert.match(settings, /giftRetryEvidenceReviewBtn/);
assert.match(settings, /giftRetryEvidenceId/);
assert.match(settings, /admin-gift-delivery-retry-evidence-v672\.js/);
assert.match(settings, /never paste gift codes/i);
const client = read('assets/admin-gift-delivery-retry-evidence-v672.js');
assert.match(client, /fetchWithAuth/);
assert.match(client, /textContent = message/);
assert.doesNotMatch(client, /innerHTML|method: 'POST'|method: 'PATCH'/);
const endpoint = read('functions/api/admin/gift_delivery_retry_evidence_review.js');
assert.match(endpoint, /capability: "manage_staff"/);
assert.match(endpoint, /read_only: true/);
assert.match(endpoint, /payload->>gift_id/);
assert.match(endpoint, /HISTORY_LIMIT = 30/);
assert.doesNotMatch(endpoint, /method: "POST"|method: "PATCH"|body_text|body_html|recipient_email.*select|gift_code.*select/);

// Exercise endpoint auth, bounded server-only Supabase GETs, explicit failures and no PII in response.
const realFetch = globalThis.fetch;
const seen = [];
const env = { SUPABASE_URL: 'https://database.test', SUPABASE_SERVICE_ROLE_KEY: 'mock-service-key', ALLOW_LEGACY_ADMIN_FALLBACK: 'true', ADMIN_PASSWORD: 'mock-admin-password' };
const request = (giftId = id, auth = true) => new Request(`https://rosiedazzlers.ca/api/admin/gift_delivery_retry_evidence_review?${new URLSearchParams({ gift_id: giftId })}`, { headers: auth ? { 'x-admin-password': env.ADMIN_PASSWORD } : {} });
try {
  globalThis.fetch = async (url, options) => {
    const value = new URL(url);
    seen.push({ value, options });
    assert.equal(options.method, 'GET');
    assert.equal(options.headers.Authorization, 'Bearer mock-service-key');
    if (value.pathname.endsWith('/gift_certificates')) return Response.json([gift('failed')]);
    if (value.pathname.endsWith('/notification_events')) {
      assert.equal(value.searchParams.get('payload->>gift_id'), `eq.${id}`);
      assert.equal(value.searchParams.get('limit'), '30');
      assert.ok(!value.searchParams.get('select').includes('payload'));
      return Response.json([rec('sent'), copy('failed')]);
    }
    throw new Error('Unexpected external request');
  };
  const unauthorized = await onRequestGet({ request: request(id, false), env });
  assert.equal(unauthorized.status, 401);
  assert.equal(seen.length, 0);
  const invalid = await onRequestGet({ request: request('GIFT-SECRET'), env });
  assert.equal(invalid.status, 400);
  assert.equal(seen.length, 0);
  const response = await onRequestGet({ request: request(), env });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('Cache-Control'), /no-store/);
  const body = await response.json();
  assert.equal(body.read_only, true);
  assert.equal(body.evidence.candidate_target, 'purchaser_copy');
  assert.equal(seen.length, 2);
  assert.ok(!JSON.stringify(body).includes('recipient@example.com'));
  assert.ok(!JSON.stringify(body).includes('buyer@example.com'));
  assert.ok(!JSON.stringify(body).includes('Private provider'));
  assert.equal((await onRequestPost()).status, 405);
  globalThis.fetch = async () => Response.json({ error: 'private downstream error' }, { status: 500 });
  const failure = await onRequestGet({ request: request(), env });
  assert.equal(failure.status, 502);
  assert.ok(!JSON.stringify(await failure.json()).includes('private downstream'));
} finally { globalThis.fetch = realFetch; }
console.log('Build 672 recipient/copy event isolation, retry readiness, duplicate holds, auth, data minimization and no-resend contract: PASS');
