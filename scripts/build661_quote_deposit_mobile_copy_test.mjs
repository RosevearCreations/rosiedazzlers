import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  QUOTE_NEXT_STEPS_COPY,
  DEPOSIT_NEXT_STEPS_COPY,
  QUOTE_FOLLOW_UP_SMS_DRAFT,
  auditQuoteDepositTemplateFields,
  hasQuoteBookingPromise,
  quoteCopyRiskCodes,
  reconcileDepositReceiptIntroCopy,
  reconcileQuoteIntroCopy
} from '../functions/api/_lib/quote-deposit-mobile-copy-661.js';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
async function importCloudflareFunction(path) {
  const file = new URL('../' + path, import.meta.url);
  const source = readFileSync(file, 'utf8').replace(/from\s+(["'])([^"']+)(\1);/g, (match, quote, specifier) => {
    if (!specifier.startsWith('.')) return match;
    return `from "${new URL(specifier, file).href}"${specifier.endsWith('.json') ? ' with { type: "json" }' : ''};`;
  });
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}

for (const copy of [QUOTE_NEXT_STEPS_COPY, DEPOSIT_NEXT_STEPS_COPY, QUOTE_FOLLOW_UP_SMS_DRAFT]) {
  assert.deepEqual(quoteCopyRiskCodes(copy), [], 'Our canonical copy must not contradict itself');
}
assert.match(QUOTE_NEXT_STEPS_COPY, /Rosie brings standard detailing water and power/);
assert.match(QUOTE_FOLLOW_UP_SMS_DRAFT, /quote is not a confirmed booking/i);
assert.ok(!hasQuoteBookingPromise('A deposit is not a booking until our team confirms a time.'));
assert.ok(!hasQuoteBookingPromise('Your booking is marked confirmed in our system.'));
for (const oldCopy of [
  'Paying a deposit automatically confirms your appointment.',
  'Accepting the quote guarantees your appointment slot.',
  'Your booking is confirmed when your deposit is received.'
]) {
  assert.ok(hasQuoteBookingPromise(oldCopy), `Flag premature booking promise: ${oldCopy}`);
}
assert.deepEqual(quoteCopyRiskCodes('Please provide a hose for our visit.'), ['customer_supplied_utilities']);
const corrected = reconcileQuoteIntroCopy('We appreciate your quote request. Customer must provide water and power. Paying a deposit automatically confirms your appointment.');
assert.match(corrected, /appreciate your quote request/);
assert.match(corrected, /Rosie brings standard detailing water and power/);
assert.match(corrected, /quote is not a confirmed appointment/);
assert.deepEqual(quoteCopyRiskCodes(corrected), []);
assert.match(reconcileDepositReceiptIntroCopy('Paying a deposit automatically confirms your appointment.'), /deposit request is not a receipt/i);
assert.deepEqual(quoteCopyRiskCodes(reconcileDepositReceiptIntroCopy('Please provide water and power. Paying a deposit automatically confirms your appointment.')), []);
assert.equal(reconcileQuoteIntroCopy('Please tell us about municipal runoff restrictions.'), 'Please tell us about municipal runoff restrictions.');
assert.equal(reconcileQuoteIntroCopy('Welcome. Your quote is ready.'), 'Welcome. Your quote is ready.', 'Unaffected formatting stays unchanged');
assert.deepEqual(quoteCopyRiskCodes('Please provide water-use restrictions before we arrive.'), []);

const bundled = JSON.parse(read('data/document_templates.json'));
assert.equal(auditQuoteDepositTemplateFields(bundled, 'data/document_templates.json').length, 0);
const sample = {
  templates: {
    quote_proposal: { subject: 'Your quote', body: 'Customer must provide water and power.' },
    deposit_receipt: { body: 'Paying a deposit automatically confirms your appointment.' },
    appointment_confirmation: { body: 'Customer must provide an outlet.' },
    refund_notice: { body: 'Customer must provide a hose.' },
    invoice: { body: 'Customer must provide water.' }
  }
};
const findings = auditQuoteDepositTemplateFields(sample, 'document_templates');
assert.equal(findings.length, 2, 'Only quote and deposit template text should be evaluated');
assert.deepEqual(findings.map((f) => f.code).sort(), ['customer_supplied_utilities', 'premature_booking_promise']);
assert.equal(auditQuoteDepositTemplateFields({ subject: 'Your quote', body: 'Customer must provide water.' }, 'app_management_settings.quote_templates').length, 1);
assert.equal(auditQuoteDepositTemplateFields({ sms: { quote_follow_up: { body: 'Please provide an outlet.' } }, marketing: { body: 'Customer must provide water.' } }, 'app_management_settings.notification_templates').length, 1);
assert.equal(auditQuoteDepositTemplateFields({ templates: { deposit_receipt: { body: 'Email foo@example.com and visit https://example.com/pay to confirm appointment. Customer must bring water.' } } }, 'document_templates')[0].excerpt.includes('foo@example.com'), false, 'Do not expose contact information in excerpts');

const delivery = read('functions/api/admin/quote_proposal_deliver.js');
assert.match(delivery, /reconcileQuoteIntroCopy\(cleanText\(body\.message/);
assert.match(delivery, /QUOTE_NEXT_STEPS_COPY/);
assert.match(delivery, /structured_terms_hash: termsHash/);
assert.match(delivery, /body\.preview_only === true/);
assert.match(delivery, /dispatchNotificationThroughProvider\(env, event, \{\}\)/);
const receipts = read('functions/api/_lib/quote-payment-events.js');
assert.match(receipts, /reconcileDepositReceiptIntroCopy\(cleanText\(template\.body/);
assert.match(receipts, /event_type: "quote_deposit_receipt_email"/);
assert.match(read('quote-response.html'), /data-build661-quote-setup/);
assert.match(read('quote-payment.html'), /data-build661-deposit-follow-up/);
assert.match(read('quote-payment.html'), /PayPal deposit captured and recorded/);
const processor = read('functions/api/notifications_process.js');
assert.ok(processor.indexOf('loadCustomerCommunicationDispatchGate({ env, event: item })') < processor.indexOf('dispatchNotificationThroughProvider(env, item)'), 'Existing consent gate remains before dispatch');

const settings = read('admin-site-settings.html');
assert.equal(settings, read('admin-site-settings/index.html'));
assert.match(settings, /id="quoteDepositMobileCopyReviewBtn"/);
assert.match(settings, /admin-quote-deposit-mobile-copy-review-v661\.js/);
const client = read('assets/admin-quote-deposit-mobile-copy-review-v661.js');
assert.match(client, /\/api\/admin\/quote_deposit_mobile_copy_review/);
assert.doesNotMatch(client, /method:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/);

const { onRequestGet, onRequestPost } = await importCloudflareFunction('functions/api/admin/quote_deposit_mobile_copy_review.js');
const env = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'test-service-key', ADMIN_PASSWORD: 'test-admin-key', ALLOW_LEGACY_ADMIN_FALLBACK: 'true' };
const calls = [];
const savedFetch = globalThis.fetch;
try {
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url: String(url), method: options.method || 'GET' });
    const key = new URL(url).searchParams.get('key')?.replace(/^eq\./, '');
    const value = key === 'document_templates'
      ? { templates: { quote_proposal: { body: 'Customer must bring water and power.' } } }
      : key === 'notification_templates'
        ? { sms: { quote_follow_up: { body: 'Paying a deposit automatically confirms your appointment.' } } }
        : key === 'quote_templates'
          ? { body: 'Please review your quote in the secure portal.' }
          : key === 'proposal_templates'
            ? { body: 'You must provide an outdoor outlet.' }
            : { body: 'Thank you, your deposit was recorded.' };
    return new Response(JSON.stringify([{ key, updated_at: '2026-10-26T12:00:00Z', value }]), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const url = 'https://rosiedazzlers.ca/api/admin/quote_deposit_mobile_copy_review';
  const request = new Request(url, { headers: { 'x-admin-password': 'test-admin-key' } });
  const response = await onRequestGet({ request, env });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const payload = await response.json();
  assert.equal(payload.build, 661);
  assert.equal(payload.read_only, true);
  assert.equal(payload.status, 'owner_review_required');
  assert.equal(payload.managed_sources.length, 5);
  assert.deepEqual(payload.managed_sources.map((item) => item.findings.length), [1, 1, 0, 1, 0]);
  assert.equal(payload.sms_state, 'draft_preview_only_no_new_sends_or_scheduling');
  assert.equal(payload.managed_sources[0].source, 'app_management_settings.document_templates');
  assert.ok(calls.every((call) => call.method === 'GET'));
  assert.equal((await onRequestGet({ request: new Request(url), env })).status, 401);
  assert.equal((await onRequestPost()).status, 405);
} finally {
  globalThis.fetch = savedFetch;
}

assert.match(read('terms/index.html'), /Customer must provide water \+ power/);
assert.match(read('waiver/index.html'), /Customer must provide a working outdoor water source/);
console.log('Build 661 quote/deposit wording, scoped template audits, mobile display, consent/financial boundaries and owner review: PASS');
