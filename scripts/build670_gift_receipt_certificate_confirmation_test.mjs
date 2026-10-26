import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GIFT_RECEIPT_PREVIEW, receiptCopyRisks, auditReceiptFields, receiptGuidanceGaps, receiptDisplayFindings } from '../functions/api/_lib/gift-receipt-copy-670.js';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
assert.deepEqual(receiptCopyRisks(GIFT_RECEIPT_PREVIEW), [], 'Owner guidance must not conflate purchase receipt with a confirmed booking');
const samples = [
  ['Gift purchase automatically books an appointment.', 'gift_purchase_is_booking'],
  ['Gift receipt confirms entire booking paid.', 'gift_receipt_confirms_service_payment'],
  ['Your gift certificate always shows the live balance.', 'certificate_guarantees_current_balance'],
  ['Using your gift code redeems the full balance.', 'entire_gift_consumed_by_booking'],
  ['Gift code automatically confirms your booking.', 'unverified_booking_confirmation'],
  ['Share your Stripe checkout session_id publicly.', 'share_checkout_reference'],
  ['Deposit due / paid', 'deposit_due_paid_ambiguous']
];
for (const [sample, code] of samples) assert.ok(receiptCopyRisks(sample).includes(code), `Expected ${code}`);
assert.deepEqual(receiptCopyRisks('A gift purchase does not book an appointment.'), [], 'Do not flag explicit negative statement');
assert.deepEqual(receiptCopyRisks('A receipt does not guarantee a confirmed booking.'), []);
assert.deepEqual(auditReceiptFields({ templates: { gift_receipt: { body: samples[0][0] }, unrelated: { body: samples[5][0] } } }, 'data/document_templates.json').map((x) => x.code), ['gift_purchase_is_booking']);
assert.deepEqual(auditReceiptFields({ items: [
  { category: 'Gifts', question: 'Is a gift receipt a booking?', answer: samples[1][0] },
  { category: 'Services', question: 'Can I visit?', answer: samples[3][0] }
] }, 'data/site_faqs.json').map((x) => x.code), ['gift_purchase_is_booking', 'gift_receipt_confirms_service_payment']);
const hidden = auditReceiptFields({ gift_delivery: { body: `${samples[5][0]} Email jane@example.com or 519-555-1111.` } }, 'app_management_settings.gift_delivery_settings')[0];
assert.ok(!hidden.excerpt.includes('jane@example.com') && !hidden.excerpt.includes('519-555-1111'));

const giftPage = read('gifts.html');
const giftPrint = read('gift-certificate-print.html');
const delivery = read('functions/api/_lib/gift-delivery.js');
const order = read('order-confirmation/index.html');
assert.deepEqual(receiptGuidanceGaps('/gift-certificate-print', giftPrint), [], 'Gift certificate must explain balance and booking distinction');
assert.ok(receiptGuidanceGaps('/gifts', giftPage).some((x) => x.code === 'gift_purchase_not_appointment'), 'Receipt page wording needs owner guidance');
assert.deepEqual(receiptDisplayFindings({ printSource: giftPrint, deliverySource: delivery, orderSource: order }).map((x) => x.code), ['unverified_deposit_status_label']);
assert.deepEqual(receiptDisplayFindings({ printSource: 'gift.remaining_cents||gift.face_value_cents||0', deliverySource: '', orderSource: '' }).map((x) => x.code), ['zero_remaining_falls_back_to_original_value']);
assert.match(giftPrint, /gift\.remaining_cents\?\?gift\.face_value_cents\?\?0/, 'Print remaining=0 must not fall back to face value');
assert.doesNotMatch(giftPrint, /gift\.remaining_cents\|\|gift\.face_value_cents\|\|0/);
assert.match(delivery, /gift\.remaining_cents \?\? gift\.face_value_cents \?\? 0/, 'Gift delivery remaining=0 must not fall back to face value');
assert.doesNotMatch(delivery, /gift\.remaining_cents \|\| gift\.face_value_cents \|\| 0/);
assert.equal(giftPrint, read('gift-certificate-print/index.html'));
assert.equal(giftPage, read('gifts/index.html'));
assert.notEqual(order, read('order-confirmation.html'), 'Pre-existing order-confirmation variant drift remains an owner finding');
assert.match(giftPrint, /@media\(max-width:760px\).*grid-template-columns:1fr/);

const settings = read('admin-site-settings.html');
assert.equal(settings, read('admin-site-settings/index.html'));
assert.match(settings, /giftReceiptConfirmationReviewBtn/);
assert.match(settings, /admin-gift-receipt-confirmation-review-v670\.js/);
assert.match(read('assets/admin-gift-receipt-confirmation-review-v670.js'), /\/api\/admin\/gift_receipt_certificate_confirmation_mobile_review/);
const endpoint = read('functions/api/admin/gift_receipt_certificate_confirmation_mobile_review.js');
assert.match(endpoint, /requireStaffAccess/);
assert.match(endpoint, /read_only: true/);
assert.match(endpoint, /method: "GET"/);
assert.match(endpoint, /Cache-Control/);
assert.match(endpoint, /onRequestPost\(\).*405/);
assert.doesNotMatch(endpoint, /onRequestPut|onRequestPatch|method: "POST"|method: "PATCH"|\/api\/gifts\/receipt\?session|gift_certificates\?/);
assert.match(endpoint, /privacy_hold/);
assert.match(endpoint, /financial_hold/);
const bookingConfirmation = read('functions/api/booking_confirmation.js');
assert.match(bookingConfirmation, /payment_verified/);
assert.match(bookingConfirmation, /booking_confirmed/);
assert.match(bookingConfirmation, /settlement_processing/);
console.log('Build 670 gift receipt, printable zero-balance, confirmation copy, mobile routes, redaction and no-mutation: PASS');
