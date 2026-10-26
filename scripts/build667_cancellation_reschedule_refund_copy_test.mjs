import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CANCELLATION_REFUND_PREVIEW, cancellationRefundCopyRisks, auditCancellationRefundFields, compareDepositPolicy } from '../functions/api/_lib/cancellation-refund-copy-667.js';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
assert.deepEqual(cancellationRefundCopyRisks(CANCELLATION_REFUND_PREVIEW), []);
const examples = [
  ['All deposits are fully refundable.', 'automatic_refund_promise'],
  ['Instant full refund for every customer.', 'automatic_refund_promise'],
  ['Gift certificates are non-refundable.', 'categorical_no_refund'],
  ['Guaranteed free rescheduling anytime.', 'unconditional_free_reschedule'],
  ['All cancellation fees will be automatically waived.', 'unqualified_fee_waiver'],
  ['No cancellations after 24 hours.', 'absolute_cancellation_cutoff'],
  ['Refund is processed when you cancel.', 'refund_status_overstatement'],
  ['You waive all statutory rights.', 'consumer_rights_exclusion']
];
for (const [sample, code] of examples) assert.ok(cancellationRefundCopyRisks(sample).includes(code), `${code} should flag`);
assert.deepEqual(cancellationRefundCopyRisks('Contact us to request a new date. We will confirm availability and any applicable terms.'), []);
const sample = { templates: { refund_notice: { body: 'All deposits are fully refundable.' }, cancellation_notice: { body: 'No cancellations after 24 hours.' }, marketing: { body: 'Instant full refund.' } } };
assert.deepEqual(auditCancellationRefundFields(sample, 'data/document_templates.json').map((x) => x.code).sort(), ['absolute_cancellation_cutoff', 'automatic_refund_promise']);
assert.equal(auditCancellationRefundFields({ templates: { message: 'Gift certificates are non-refundable.' } }, 'app_management_settings.refund_templates').length, 1);
assert.equal(auditCancellationRefundFields({ items: [{ category: 'Deposits', question: 'Can I cancel?', answer: 'All deposits are fully refundable.' }, { category: 'Gallery', question: 'Can I see photos?', answer: 'Instant full refund.' }] }, 'data/site_faqs.json').length, 1);
assert.equal(auditCancellationRefundFields([{ category: 'Booking', question: 'Can I reschedule?', answer: 'Guaranteed free rescheduling anytime.' }], 'public_faq_entries').length, 1);
const excerpt = auditCancellationRefundFields({ refund: { body: 'No refunds; email jane@example.com or visit https://example.com or call 519-555-1111.' } }, 'data/document_templates.json')[0].excerpt;
assert.ok(!excerpt.includes('jane@example.com') && !excerpt.includes('example.com') && !excerpt.includes('519-555-1111'), 'Audit excerpt must redact contacts');
const terms = read('terms.html');
assert.equal(terms, read('terms/index.html'), 'Both public Terms routes must agree');
const policies = JSON.parse(read('data/site_policies.json'));
assert.equal(compareDepositPolicy(terms, policies.policies.deposit)?.code, 'deposit_requirement_conflict', 'The existing Terms/deposit policy contradiction must be visible until owner reconciliation');
assert.equal(compareDepositPolicy('Deposits may be requested.', policies.policies.deposit), null);
assert.equal(auditCancellationRefundFields(policies, 'data/site_policies.json').length, 0);
assert.equal(auditCancellationRefundFields(JSON.parse(read('data/document_templates.json')), 'data/document_templates.json').length, 0);
assert.equal(auditCancellationRefundFields(JSON.parse(read('data/site_faqs.json')), 'data/site_faqs.json').length, 0);
const settings = read('admin-site-settings.html');
assert.equal(settings, read('admin-site-settings/index.html'));
assert.match(settings, /cancellationRefundCopyReviewBtn/);
assert.match(settings, /admin-cancellation-refund-copy-review-v667/);
assert.match(read('assets/admin-cancellation-refund-copy-review-v667.js'), /\/api\/admin\/cancellation_reschedule_refund_mobile_copy_review/);
const server = read('functions/api/admin/cancellation_reschedule_refund_mobile_copy_review.js');
assert.match(server, /requireStaffAccess/);
assert.match(server, /read_only: true/);
assert.match(server, /method: "GET"/);
assert.match(server, /Cache-Control/);
assert.match(server, /onRequestPost\(\).*405/);
assert.doesNotMatch(server, /dispatchNotificationThroughProvider|onRequestPut|onRequestPatch|method: "POST"|method: "PATCH"/);
console.log('Build 667 cancellation, rescheduling, refund explanation, policy comparison, redaction and no-mutation boundaries: PASS');
