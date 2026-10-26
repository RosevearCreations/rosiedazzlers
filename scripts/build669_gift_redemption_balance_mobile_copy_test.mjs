import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { GIFT_REDEMPTION_PREVIEW, redemptionRisks, auditRedemptionFields, redemptionGuidanceGaps, redemptionContractAlignment } from '../functions/api/_lib/gift-redemption-copy-669.js';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
assert.deepEqual(redemptionRisks(GIFT_REDEMPTION_PREVIEW), [], 'Safe draft must not promise full redemption or cash-out');
const samples = [
  ['Gift cards always pay the entire booking.', 'full_booking_paid_promise'],
  ['Gift codes use all the remaining balance at booking.', 'automatic_full_gift_redemption'],
  ['Unused gift balance will be lost.', 'remaining_value_forfeiture'],
  ['Gift balance guaranteed real-time.', 'unqualified_live_balance'],
  ['Anyone can check the gift balance.', 'unrestricted_balance_check'],
  ['Entering a gift code automatically confirms an appointment.', 'gift_code_confirms_appointment'],
  ['Service gifts cover any package.', 'unrestricted_service_gift'],
  ['Remaining gift balance automatically refunded in cash.', 'automatic_gift_cashout'],
  ['Dollar gifts deduct from the booking total.', 'ambiguous_total_offset']
];
for (const [copy, code] of samples) assert.ok(redemptionRisks(copy).includes(code), `Missing risk ${code}`);
assert.deepEqual(redemptionRisks('Enter the code at checkout. Service gifts must match the package and vehicle size. Final eligible deposit amount is confirmed by Rosie.'), []);
const grouped = { templates: { gift_delivery: { body: samples[0][0] }, booking: { body: samples[2][0] }, security: { body: samples[3][0] } } };
assert.deepEqual(auditRedemptionFields(grouped, 'data/document_templates.json').map((x) => x.code), ['full_booking_paid_promise', 'remaining_value_forfeiture']);
assert.equal(auditRedemptionFields({ gift_redemption_message: samples[1][0] }, 'app_management_settings.gift_delivery_settings').length, 1);
assert.equal(auditRedemptionFields({ items: [
  { category: 'Gift cards', question: 'Can my gift pay everything?', answer: samples[0][0] },
  { category: 'Bookings', question: 'How do I pay?', answer: samples[2][0] }
] }, 'data/site_faqs.json').length, 1);
const redacted = auditRedemptionFields({ gift_email: 'Gift balance guaranteed real-time. Contact jane@example.com or 519-555-1111.' }, 'managed')[0];
assert.ok(!redacted.excerpt.includes('jane@example.com') && !redacted.excerpt.includes('519-555-1111'));

const gifts = read('gifts.html');
const checkout = read('functions/api/checkout.js');
const preview = read('functions/api/codes/preview.js');
assert.match(checkout, /Math\.min\(Number\(gift\.remaining_cents\s*\|\|\s*0\),\s*depositCents,\s*totalCents\)/, 'Final checkout is currently deposit-capped');
assert.match(preview, /giftApplyCents\s*=\s*Math\.min\(remaining,\s*afterPromoCents\)/, 'Pricing preview can offset the total');
assert.match(gifts, /Dollar gifts<\/strong> deduct from the booking total\./);
assert.match(read('gift-certificate-print.html'), /gift\.remaining_cents\|\|gift\.face_value_cents\|\|0/, 'Printed zero balance fallback remains a source risk');
assert.deepEqual(redemptionContractAlignment({ gifts, previewAppliesToTotal: false, printZeroFallsBackToFaceValue: false }), []);
assert.deepEqual(redemptionContractAlignment({ gifts, checkoutDepositCapped: false, printZeroFallsBackToFaceValue: false }), []);
assert.deepEqual(redemptionContractAlignment({ gifts }).map((x) => x.code), ['pricing_preview_vs_checkout_scope', 'gift_total_wording_needs_scope', 'printed_zero_balance_face_value_fallback']);
assert.deepEqual(redemptionGuidanceGaps('/gifts', GIFT_REDEMPTION_PREVIEW).map((x) => x.code), []);
assert.ok(redemptionGuidanceGaps('/gifts', gifts).some((x) => x.code === 'deposit_application_boundary'));
assert.ok(redemptionGuidanceGaps('/gift-cards', read('gift-cards.html')).some((x) => x.code === 'balance_after_use'));
assert.ok(redemptionGuidanceGaps('/my-account', read('my-account.html')).some((x) => x.code === 'ownership_scope'));
assert.ok(redemptionGuidanceGaps('/gift-certificate-print', read('gift-certificate-print.html')).some((x) => x.code === 'verify_at_checkout'));

for (const route of ['admin-site-settings', 'gift-cards', 'gifts', 'gift-certificate-print']) {
  assert.equal(read(`${route}.html`), read(`${route}/index.html`), `${route} route copies must remain identical`);
}
// My Account has pre-existing route-copy differences; audit it without overwriting unrelated work.
assert.ok(read('my-account/index.html').includes('giftCheckCode'));
const settings = read('admin-site-settings.html');
assert.match(settings, /giftRedemptionBalanceReviewBtn/);
assert.match(settings, /admin-gift-redemption-balance-copy-review-v669/);
assert.match(read('assets/admin-gift-redemption-balance-copy-review-v669.js'), /\/api\/admin\/gift_redemption_balance_mobile_copy_review/);
const endpoint = read('functions/api/admin/gift_redemption_balance_mobile_copy_review.js');
assert.match(endpoint, /requireStaffAccess/);
assert.match(endpoint, /read_only: true/);
assert.match(endpoint, /method: "GET"/);
assert.match(endpoint, /Cache-Control/);
assert.match(endpoint, /onRequestPost\(\).*405/);
assert.doesNotMatch(endpoint, /onRequestPut|onRequestPatch|method: "POST"|method: "PATCH"|gift_code=eq\.|redemptions\?/);
assert.match(endpoint, /owner_action/);
console.log('Build 669 gift redemption, remaining balance, deposit boundary, source gaps, redaction and no-mutation: PASS');
