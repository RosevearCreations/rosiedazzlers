import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { WARRANTY_REVIEW_PREVIEW, warrantyCopyRisks, auditWarrantyClaimFields } from '../functions/api/_lib/warranty-claim-copy-666.js';
const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

assert.deepEqual(warrantyCopyRisks(WARRANTY_REVIEW_PREVIEW), []);
assert.deepEqual(warrantyCopyRisks('Lifetime warranty for every coating.'), ['unqualified_lifetime_guarantee']);
assert.deepEqual(warrantyCopyRisks('All claims are automatically approved.'), ['automatic_claim_or_payout']);
assert.deepEqual(warrantyCopyRisks('You waive all consumer rights.'), ['statutory_rights_disclaimer']);
assert.deepEqual(warrantyCopyRisks('100% scratch protection.'), ['unqualified_damage_protection']);
assert.deepEqual(warrantyCopyRisks('All claims must be submitted within 24 hours.'), ['unsupported_claim_deadline']);
assert.deepEqual(warrantyCopyRisks('We will review the service scope and applicable terms before discussing next steps.'), []);
const sample = { templates: {
  warranty_follow_up: { body: 'Lifetime warranty for every coating.' },
  customer_claim: { body: 'All claims are automatically approved.' },
  quote: { body: 'Lifetime warranty for any surface.' },
  appointment: { body: 'You waive all consumer rights.' }
} };
assert.deepEqual(auditWarrantyClaimFields(sample, 'document_templates').map((x) => x.code).sort(), ['automatic_claim_or_payout', 'unqualified_lifetime_guarantee']);
assert.equal(auditWarrantyClaimFields({ body: 'All claims are automatically approved.' }, 'app_management_settings.claim_templates').length, 1);
assert.equal(auditWarrantyClaimFields({ items: [{ category: 'Warranty', question: 'What is covered?', answer: 'Lifetime warranty for every coating.' }, { category: 'Bookings', question: 'How do we book?', answer: 'All claims are automatically approved.' }] }, 'site_faqs').length, 1);
const excerpt = auditWarrantyClaimFields({ warranty: { body: 'Email jane@example.com or visit https://example.com. You waive all consumer rights.' } }, 'document_templates')[0].excerpt;
assert.ok(!excerpt.includes('jane@example.com') && !excerpt.includes('example.com'), 'Never reveal contacts or links in audit excerpts');
assert.equal(auditWarrantyClaimFields(JSON.parse(read('data/document_templates.json')), 'data/document_templates.json').length, 0);
assert.equal(auditWarrantyClaimFields(JSON.parse(read('data/site_faqs.json')), 'data/site_faqs.json').length, 0);
assert.equal(read('admin-site-settings.html'), read('admin-site-settings/index.html'));
assert.match(read('admin-site-settings.html'), /warrantyClaimCopyReviewBtn/);
assert.match(read('assets/admin-warranty-claim-copy-review-v666.js'), /\/api\/admin\/warranty_claim_mobile_copy_review/);
const server = read('functions/api/admin/warranty_claim_mobile_copy_review.js');
assert.match(server, /requireStaffAccess/);
assert.match(server, /read_only: true/);
assert.match(server, /method: "GET"/);
assert.doesNotMatch(server, /dispatchNotificationThroughProvider|onRequestPut|onRequestPatch|method: "POST"/);
assert.match(server, /onRequestPost\(\).*405/);
console.log('Build 666 warranty/claim scope, legal hold, redaction, admin review and no-mutation boundary: PASS');
