import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  GIFT_DELIVERY_PREVIEW, DELIVERY_RUNTIME_FINDINGS, DELIVERY_STATUS_GUIDANCE,
  deliveryCopyRisks, auditDeliveryFields, deliveryGuidanceGaps
} from '../functions/api/_lib/gift-delivery-copy-671.js';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
assert.deepEqual(deliveryCopyRisks(GIFT_DELIVERY_PREVIEW), []);

const sampleRisks = [
  ['Guaranteed delivered instantly.', 'guaranteed_inbox_delivery'],
  ['Sent confirms delivered to recipient.', 'sent_proves_received'],
  ['Failed gift delivery automatically refunded.', 'failed_means_refunded'],
  ['Failed gift delivery automatically resend the email.', 'automatic_duplicate_resend'],
  ['Share your full gift code publicly.', 'public_gift_code_disclosure']
];
for (const [sample, expected] of sampleRisks) assert.ok(deliveryCopyRisks(sample).includes(expected), `${expected} should be flagged`);
assert.deepEqual(deliveryCopyRisks('Provider acceptance does not prove delivery to an inbox.'), []);
assert.deepEqual(deliveryCopyRisks('Sent does not confirm the recipient received it.'), []);
assert.deepEqual(deliveryCopyRisks("Don't share your gift code publicly."), []);
assert.ok(deliveryCopyRisks("Don't share your gift code publicly. Share your full gift code publicly.").includes('public_gift_code_disclosure'));
assert.deepEqual(deliveryCopyRisks('Staff may consider a resend after reviewing the notification evidence.'), []);

assert.deepEqual(auditDeliveryFields({ templates: { gift_delivery: { message: sampleRisks[0][0] }, analytics: { message: sampleRisks[4][0] } } }, 'managed.gift').map((row) => row.code), ['guaranteed_inbox_delivery']);
const faq = auditDeliveryFields({ items: [
  { category: 'Gifts', question: 'Will a gift arrive?', answer: sampleRisks[1][0] },
  { category: 'Maintenance', question: 'How can I wash a car?', answer: sampleRisks[4][0] }
] }, 'public_faq_entries');
assert.deepEqual(faq.map((row) => row.code), ['sent_proves_received']);
const privateExcerpt = auditDeliveryFields({ gift_delivery: { warning: `Please email ree@example.com or call 519-555-1212. ${sampleRisks[0][0]}` } }, 'app_management_settings.gift_delivery_settings')[0];
assert.ok(!privateExcerpt.excerpt.includes('ree@example.com') && !privateExcerpt.excerpt.includes('519-555-1212'));

const giftPage = read('gifts.html');
const giftCards = read('gift-cards.html');
assert.equal(giftPage, read('gifts/index.html'), 'Gift checkout paths must match');
assert.equal(giftCards, read('gift-cards/index.html'), 'Gift landing paths must match');
assert.deepEqual(deliveryGuidanceGaps('/gifts', giftPage), [], 'Gift checkout should offer all five delivery-help messages');
assert.deepEqual(deliveryGuidanceGaps('/gift-cards', giftCards), []);
assert.deepEqual(deliveryCopyRisks(giftPage), [], 'Clear negative customer guidance is not a risky promise');
assert.ok(deliveryGuidanceGaps('/gifts', '<p>Buy a gift.</p>').length >= 5, 'Missing guidance must fail loudly');
assert.match(giftPage, /<meta name="viewport" content="width=device-width,initial-scale=1"/);
assert.match(giftPage, /@media \(max-width: 980px\).*grid-template-columns:1fr/);
assert.match(giftPage, /aria-labelledby="giftDeliveryHelpTitle"/);
assert.match(giftPage, /href="\/contact">contact Rosie Dazzlers for help/);
assert.match(giftPage, /Next eligible send window, subject to review/);
assert.doesNotMatch(giftPage, /Send now \/ automated delivery/);

const runtime = read('functions/api/_lib/gift-delivery.js');
const retry = read('functions/api/notifications_process.js');
const schedule = read('functions/api/gifts/scheduled_delivery_process.js');
// Build 673 resolved the runtime findings recorded by the Build 671 copy audit.
assert.match(runtime, /recipient_provider_status: recipientDispatch\.ok \? "accepted" : "failed"/);
assert.match(runtime, /purchaser_copy_status: copyResult \?/);
assert.match(runtime, /info\.delivery_date \?/);
assert.match(runtime, /Your Rosie Dazzlers e-gift was sent/);
assert.doesNotMatch(runtime, /has been delivered/);
assert.match(runtime, /claimGiftDelivery\(env, gift, due\.info\)/);
assert.match(retry, /status: "sent"/);
assert.doesNotMatch(retry, /updateGiftDeliveryContext|gift_certificates/);
assert.match(retry, /isGiftNotificationEvent\(item\)/);
assert.match(schedule, /processGiftDeliveryRow/);
assert.equal(DELIVERY_RUNTIME_FINDINGS.length, 5);
assert.ok(DELIVERY_RUNTIME_FINDINGS.every((item) => item.source.startsWith('functions/') && item.note));
assert.deepEqual(DELIVERY_STATUS_GUIDANCE.map((row) => row.state), ['waiting', 'queued', 'sent', 'failed', 'unknown']);
assert.match(DELIVERY_STATUS_GUIDANCE.find((row) => row.state === 'sent').customer, /does not confirm/);

const settings = read('admin-site-settings.html');
assert.equal(settings, read('admin-site-settings/index.html'));
assert.match(settings, /giftDeliveryFailureReviewBtn/);
assert.match(settings, /admin-gift-delivery-failure-review-v671\.js/);
const client = read('assets/admin-gift-delivery-failure-review-v671.js');
assert.match(client, /fetchWithAuth/);
assert.match(client, /\/api\/admin\/gift_delivery_failure_resend_mobile_review/);
assert.match(client, /textContent = message/);
assert.doesNotMatch(client, /innerHTML|method: 'POST'|method: 'PATCH'/);
const endpoint = read('functions/api/admin/gift_delivery_failure_resend_mobile_review.js');
assert.match(endpoint, /requireStaffAccess/);
assert.match(endpoint, /capability: "manage_staff"/);
assert.match(endpoint, /read_only: true/);
assert.match(endpoint, /Cache-Control/);
assert.match(endpoint, /method: "GET"/);
assert.match(endpoint, /onRequestPost\(\).*405/);
assert.match(endpoint, /privacy_hold/);
assert.match(endpoint, /dispatch_hold/);
assert.doesNotMatch(endpoint, /gift_certificates\?|notification_events\?|method: "POST"|method: "PATCH"|sendEmail|dispatchNotification|session_id|gift_code/);
console.log('Build 671 gift delivery statuses, failed send/resend copy, mobile guidance, redaction and read-only boundary: PASS');
