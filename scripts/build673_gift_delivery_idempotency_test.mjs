import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildGiftPurchaseContext, isGiftNotificationEvent } from '../functions/api/_lib/gift-delivery-state-673.js';
import { processGiftDeliveryRow, isGiftDueForDelivery } from '../functions/api/_lib/gift-delivery.js';
import { onRequestPost as giftWebhook } from '../functions/api/gifts/webhook.js';

const read = (file) => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const env = {
  SUPABASE_URL: 'https://database.example.test', SUPABASE_SERVICE_ROLE_KEY: 'service-test',
  SITE_ORIGIN: 'https://rosiedazzlers.ca', NOTIFICATIONS_EMAIL_WEBHOOK_URL: 'https://email.example.test/deliver',
  STRIPE_WEBHOOK_SECRET_GIFTS: 'whsec_build673_test', STRIPE_SECRET_KEY: 'sk_test_build673'
};
const metadata = { purpose: 'gift', sender_name: 'Ree', delivery_date: '2026-10-26', gift_message: 'Enjoy your detail!' };
assert.deepEqual(buildGiftPurchaseContext(metadata, { model: 'Mazda 5' }), {
  vehicle: { model: 'Mazda 5' },
  gift_delivery: {
    sender_name: 'Ree', delivery_date: '2026-10-26', gift_message: 'Enjoy your detail!',
    delivery_status: 'pending', recipient_provider_status: 'not_submitted', purchaser_copy_status: 'not_submitted'
  }
});
assert.equal(buildGiftPurchaseContext({ delivery_date: '2026-02-31' }).gift_delivery.delivery_date, '');
assert.equal(buildGiftPurchaseContext({ delivery_date: '2026-02-31' }).gift_delivery.delivery_status, 'review_required');
assert.equal(buildGiftPurchaseContext({ gift_message: 'X'.repeat(600) }).gift_delivery.gift_message.length, 450);
assert.ok(isGiftNotificationEvent({ event_type: 'gift_scheduled_delivery_email' }));
assert.ok(isGiftNotificationEvent({ event_type: 'gift_scheduled_delivery_purchaser_copy_email' }));
assert.equal(isGiftNotificationEvent({ event_type: 'booking_email' }), false);

const giftId = 'ec93253d-08eb-4e04-878e-e865a4f42a78';
const newGift = () => ({
  id: giftId, code: 'RD-TESTGIFT', type: 'open_value', status: 'active', face_value_cents: 10000,
  remaining_cents: 10000, recipient_email: 'recipient@example.test', purchaser_email: 'buyer@example.test',
  recipient_name: 'Recipient', purchase_context: buildGiftPurchaseContext(metadata)
});
const settings = { enabled: true, automation_enabled: true, default_send_hour_local: 9,
  timezone_label: 'America/Toronto', send_copy_to_purchaser: true };
const now = new Date('2026-10-26T17:00:00Z');
assert.equal(isGiftDueForDelivery(newGift(), settings, now).due, true);
assert.equal(isGiftDueForDelivery({ ...newGift(), purchase_context: {} }, settings, now).due, false,
  'Legacy state must not send without explicit pending metadata');

const realFetch = globalThis.fetch;
async function runDispatchScenario({ failRecipient = false, failCopy = false, failPersist = false } = {}) {
  let gift = newGift();
  let counter = 0;
  let outbound = [];
  const events = [];
  globalThis.fetch = async (input, init = {}) => {
    const url = new URL(input);
    const method = init.method || 'GET';
    if (url.host === 'email.example.test') {
      const packet = JSON.parse(init.body);
      outbound.push(packet);
      if ((failRecipient && packet.event_type === 'gift_scheduled_delivery_email') ||
          (failCopy && packet.event_type === 'gift_scheduled_delivery_purchaser_copy_email'))
        return Response.json({ error: 'Mock provider rejection' }, { status: 503 });
      return Response.json({ accepted: true });
    }
    assert.equal(url.host, 'database.example.test');
    if (method === 'GET' && url.pathname.endsWith('/app_management_settings')) return Response.json([]);
    if (url.pathname.endsWith('/gift_certificates') && method === 'PATCH') {
      if (url.searchParams.has('purchase_context->gift_delivery->>delivery_status')) {
        assert.equal(url.searchParams.get('purchase_context->gift_delivery->>delivery_status'), 'eq.pending');
        if (gift.purchase_context.gift_delivery.delivery_status !== 'pending') return Response.json([]);
      }
      gift = { ...gift, ...JSON.parse(init.body) };
      return Response.json([gift]);
    }
    if (url.pathname.endsWith('/notification_events') && method === 'POST') {
      const event = { ...JSON.parse(init.body)[0], id: `e${++counter}`, created_at: now.toISOString() };
      events.push(event);
      return Response.json([event]);
    }
    if (url.pathname.endsWith('/notification_events') && method === 'PATCH') {
      const id = url.searchParams.get('id')?.slice(3);
      const event = events.find((e) => e.id === id);
      Object.assign(event, JSON.parse(init.body));
      if (failPersist) return Response.json({ error: 'Mock persistence failure' }, { status: 503 });
      return Response.json([event]);
    }
    throw new Error(`Unexpected mocked fetch ${method} ${url}`);
  };
  try {
    // Both workers have the same stale snapshot; only the first atomic claim wins.
    const [firstOutcome, secondOutcome] = await Promise.allSettled([
      processGiftDeliveryRow(env, newGift(), settings, { now }),
      processGiftDeliveryRow(env, newGift(), settings, { now })
    ]);
    if (failPersist) {
      assert.equal(firstOutcome.status, 'rejected');
      assert.match(firstOutcome.reason.message, /owner reconciliation required/);
      assert.equal(secondOutcome.status, 'fulfilled');
      assert.equal(secondOutcome.value.skipped, true);
      assert.equal(gift.purchase_context.gift_delivery.delivery_status, 'processing');
      assert.equal(outbound.length, 1);
      return;
    }
    assert.equal(firstOutcome.status, 'fulfilled');
    assert.equal(secondOutcome.status, 'fulfilled');
    const first = firstOutcome.value;
    const second = secondOutcome.value;
    assert.equal(first.skipped, undefined);
    assert.equal(second.skipped, true);
    assert.equal(second.reason, 'already_claimed_or_state_changed');
    assert.equal(events.filter((e) => e.event_type === 'gift_scheduled_delivery_email').length, 1);
    assert.equal(outbound.filter((e) => e.event_type === 'gift_scheduled_delivery_email').length, 1);
    const state = gift.purchase_context.gift_delivery;
    assert.equal(state.sender_name, 'Ree');
    assert.equal(state.gift_message, 'Enjoy your detail!');
    assert.equal(state.notification_event_id, 'e1');
    if (failRecipient) {
      assert.equal(first.ok, false);
      assert.equal(state.delivery_status, 'failed');
      assert.equal(state.recipient_provider_status, 'failed');
      assert.equal(outbound.length, 1, 'Do not tell purchaser a failed recipient gift was delivered');
      assert.equal(isGiftDueForDelivery(gift, settings, now).due, false);
    } else {
      assert.equal(state.delivery_status, 'sent');
      assert.equal(state.recipient_provider_status, 'accepted');
      assert.ok(state.sent_at);
      assert.equal(outbound.length, 2);
      assert.equal(state.copy_notification_event_id, 'e2');
      assert.equal(state.purchaser_copy_status, failCopy ? 'failed' : 'accepted');
      assert.equal(first.purchaser_copy_status, failCopy ? 'failed' : 'accepted');
      assert.match(outbound[1].body_text, /Inbox delivery is not confirmed/);
      assert.match(outbound[0].body_text, /Enjoy your detail!/);
      assert.match(outbound[0].body_text, /2026-10-26/);
    }
  } finally { globalThis.fetch = realFetch; }
}

await runDispatchScenario();
await runDispatchScenario({ failCopy: true });
await runDispatchScenario({ failRecipient: true });
await runDispatchScenario({ failPersist: true });

// Signed webhook issues persisted metadata without dispatch when send date is in the future.
const session = {
  id: 'cs_test_build673', created: Math.floor(Date.now() / 1000), metadata: {
    ...metadata, cart: 'GIFT-100:1:', purchaser_email: 'buyer@example.test',
    recipient_email: 'recipient@example.test', recipient_name: 'Recipient', delivery_date: '2026-12-01'
  }
};
const payload = JSON.stringify({ type: 'checkout.session.completed', data: { object: session } });
const stamp = Math.floor(Date.now() / 1000);
const signer = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.STRIPE_WEBHOOK_SECRET_GIFTS),
  { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
const signed = await crypto.subtle.sign('HMAC', signer, new TextEncoder().encode(`${stamp}.${payload}`));
const hmac = Array.from(new Uint8Array(signed), (b) => b.toString(16).padStart(2, '0')).join('');
let inserted = [];
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(input);
  const method = init.method || 'GET';
  if (url.pathname.endsWith('/gift_certificates') && method === 'GET' && url.searchParams.get('select') === 'id') return Response.json([]);
  if (url.pathname.endsWith('/gift_certificates') && method === 'POST') {
    inserted = JSON.parse(init.body);
    return new Response(null, { status: 201 });
  }
  if (url.pathname.endsWith('/gift_certificates') && method === 'GET')
    return Response.json(inserted.map((x) => ({ ...x, id: giftId })));
  if (url.pathname.endsWith('/gift_products'))
    return Response.json([{ sku: 'GIFT-100', type: 'fixed_value', currency: 'CAD', face_value_cents: 10000, is_active: true }]);
  if (url.pathname.endsWith('/app_management_settings')) return Response.json([]);
  throw new Error(`Unexpected signed webhook request ${method} ${url}`);
};
try {
  const response = await giftWebhook({ request: new Request('https://rosiedazzlers.ca/api/gifts/webhook', {
    method: 'POST', headers: { 'stripe-signature': `t=${stamp},v1=${hmac}` }, body: payload
  }), env });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.issued, 1);
  assert.equal(result.delivery_results[0].reason, 'waiting_delivery_date');
  assert.deepEqual(inserted[0].purchase_context.gift_delivery, {
    sender_name: 'Ree', delivery_date: '2026-12-01', gift_message: 'Enjoy your detail!',
    delivery_status: 'pending', recipient_provider_status: 'not_submitted', purchaser_copy_status: 'not_submitted'
  });
} finally { globalThis.fetch = realFetch; }

assert.match(read('functions/api/notifications_process.js'), /gift_delivery_requires_owner_provider_reconciliation/);
assert.match(read('functions/api/admin/_lib/gift-delivery.js'), /export \* from "\.\.\/\.\.\/_lib\/gift-delivery\.js"/);
assert.doesNotMatch(read('functions/api/_lib/gift-delivery.js'), /gift\.delivery_date\s*\?/);
console.log('Build 673 signed checkout metadata, atomic claim concurrency, recipient/copy state, provider failure holds, no duplicate sends: PASS');
