import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GIFT_CREDIT_PREVIEW, giftCreditCopyRisks, auditGiftCreditFields, reviewGiftTypeExpiryScope } from '../functions/api/_lib/gift-credit-copy-668.js';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
assert.deepEqual(giftCreditCopyRisks(GIFT_CREDIT_PREVIEW), []);
const examples = [
  ['Gift certificates are valid for 1 year.', 'blanket_gift_expiry'],
  ['All gift cards expire after 12 months.', 'blanket_gift_expiry'],
  ['Gift certificates are non-refundable.', 'blanket_gift_nonrefundable'],
  ['No refunds on gift certificate purchases.', 'blanket_gift_nonrefundable'],
  ['Gift cards have an inactivity fee.', 'gift_value_reduction_fee'],
  ['Gift cards always cover every service.', 'unqualified_universal_redemption'],
  ['Store credit is always redeemable for cash.', 'automatic_cash_conversion'],
  ['Gift card purchase automatically confirms your appointment.', 'gift_is_confirmed_booking']
];
for (const [sample, code] of examples) assert.ok(giftCreditCopyRisks(sample).includes(code), `Should detect ${code}`);
assert.deepEqual(giftCreditCopyRisks('A specific service gift needs a booking and matching vehicle size.'), []);
const sample = { templates: { gift_delivery: { body: 'Gift certificates are valid for 1 year.' }, refund_notice: { body: 'Gift certificates are non-refundable.' }, marketing: { body: 'Gift cards have an inactivity fee.' } } };
assert.deepEqual(auditGiftCreditFields(sample, 'data/document_templates.json').map((x) => x.code).sort(), ['blanket_gift_expiry', 'blanket_gift_nonrefundable']);
assert.equal(auditGiftCreditFields({ gift_message: 'Gift certificates are valid for 1 year.' }, 'app_management_settings.gift_delivery_settings').length, 1);
assert.equal(auditGiftCreditFields({ items: [{ category: 'Gift cards', question: 'Do gifts expire?', answer: 'Gift certificates are valid for 1 year.' }, { category: 'Booking', question: 'How do I book?', answer: 'Gift cards have an inactivity fee.' }] }, 'data/site_faqs.json').length, 1);
const finding = auditGiftCreditFields({ gift_notice: { body: 'Gift cards have an inactivity fee. Contact jane@example.com or call 519-555-1111.' } }, 'document_templates')[0];
assert.ok(!finding.excerpt.includes('jane@example.com') && !finding.excerpt.includes('519-555-1111'), 'Redact contact details from audit snippets');
const gifts = read('gifts.html');
const terms = read('terms.html');
assert.equal(gifts, read('gifts/index.html'));
assert.equal(terms, read('terms/index.html'));
assert.equal(read('gift-cards.html'), read('gift-cards/index.html'));
assert.equal(reviewGiftTypeExpiryScope(gifts, terms)?.code, 'gift_type_expiry_scope_review', 'One-year blanket language for both gift types must remain visible for owner review');
assert.equal(reviewGiftTypeExpiryScope('Only a specific-service gift is offered.', terms), null);
assert.equal(giftCreditCopyRisks(gifts).includes('blanket_gift_expiry'), true);
assert.equal(giftCreditCopyRisks(terms).includes('blanket_gift_expiry'), true);
assert.equal(auditGiftCreditFields(JSON.parse(read('data/document_templates.json')), 'data/document_templates.json').length, 0);
assert.equal(auditGiftCreditFields(JSON.parse(read('data/site_faqs.json')), 'data/site_faqs.json').length, 0);
const settings = read('admin-site-settings.html');
assert.equal(settings, read('admin-site-settings/index.html'));
assert.match(settings, /giftCreditTermsReviewBtn/);
assert.match(settings, /admin-gift-credit-terms-review-v668/);
assert.match(read('assets/admin-gift-credit-terms-review-v668.js'), /\/api\/admin\/gift_voucher_credit_mobile_terms_review/);
const endpoint = read('functions/api/admin/gift_voucher_credit_mobile_terms_review.js');
assert.match(endpoint, /requireStaffAccess/);
assert.match(endpoint, /read_only: true/);
assert.match(endpoint, /method: "GET"/);
assert.match(endpoint, /Cache-Control/);
assert.match(endpoint, /onRequestPost\(\).*405/);
assert.doesNotMatch(endpoint, /onRequestPut|onRequestPatch|method: "POST"|method: "PATCH"|dispatchNotificationThroughProvider/);
console.log('Build 668 gift/voucher/store credit terms, type-specific expiry scope, redaction and no-mutation boundaries: PASS');
