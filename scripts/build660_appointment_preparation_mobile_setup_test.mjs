import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  APPOINTMENT_PREPARATION_CHECKLIST,
  APPOINTMENT_SMS_PREVIEW,
  SAFE_APPOINTMENT_SETUP_COPY,
  auditAppointmentTemplateFields,
  guardAppointmentNotificationForDispatch,
  hasAppointmentUtilityConflict,
  reconcileAppointmentMessageText
} from '../functions/api/_lib/appointment-preparation-660.js';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

// Node requires import attributes for bundled JSON; Cloudflare supports
// unannotated imports. Rewrite the test module only, not deployed source.
async function importCloudflareFunction(path) {
  const file = new URL('../' + path, import.meta.url);
  const source = readFileSync(file, 'utf8').replace(/from\s+(["'])([^"']+)(\1);/g, (match, quote, specifier) => {
    if (!specifier.startsWith('.')) return match;
    return `from "${new URL(specifier, file).href}"${specifier.endsWith('.json') ? ' with { type: "json" }' : ''};`;
  });
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}

assert.ok(APPOINTMENT_PREPARATION_CHECKLIST.length >= 4);
assert.ok(APPOINTMENT_PREPARATION_CHECKLIST.some((text) => /Rosie brings standard detailing water and power/.test(text)));
assert.ok(APPOINTMENT_PREPARATION_CHECKLIST.every((text) => !hasAppointmentUtilityConflict(text)));
assert.ok(!hasAppointmentUtilityConflict(APPOINTMENT_SMS_PREVIEW));
assert.ok(!hasAppointmentUtilityConflict('Local municipal water-use restrictions still apply to outdoor washing.'));
assert.ok(!hasAppointmentUtilityConflict('Customer-supplied water and power are not required for normal service.'));
assert.ok(!hasAppointmentUtilityConflict('You do not need to provide a hose or electrical outlet.'));
assert.ok(!hasAppointmentUtilityConflict('You need to tell us about local water-use restrictions.'));
for (const text of [
  'Customer must provide water and power before we arrive.',
  'Please confirm hose/power availability for the appointment.',
  'Please have an outdoor outlet available for the detail.',
  'Customer-supplied water is required for your appointment.'
]) assert.ok(hasAppointmentUtilityConflict(text), `Must flag ${text}`);

const corrected = reconcileAppointmentMessageText('We are looking forward to your appointment. Customer must provide water and power. Please remove your valuables.');
assert.ok(corrected.includes('looking forward to your appointment'));
assert.ok(corrected.includes(SAFE_APPOINTMENT_SETUP_COPY));
assert.ok(corrected.includes('Please remove your valuables'));
assert.ok(!hasAppointmentUtilityConflict(corrected));

const queued = {
  id: 'queued-1', event_type: 'appointment_reminder_sms', channel: 'sms', recipient_phone: 'not-a-real-number',
  subject: 'Customer must provide water before arrival.', body_text: 'Please confirm hose/power availability. Building access is required.',
  body_html: '<p>Customer must provide water and power.</p>',
  payload: { message: 'Customer must provide water and power.', body_html: '<p>Customer must provide water.</p>', consent_source: 'test-consent' }
};
const guarded = guardAppointmentNotificationForDispatch(queued);
assert.notEqual(guarded, queued);
assert.equal(guarded.id, queued.id);
assert.equal(guarded.channel, 'sms');
assert.equal(guarded.recipient_phone, queued.recipient_phone);
assert.equal(guarded.payload.consent_source, 'test-consent');
assert.equal(guarded.body_html, null, 'Unsafe arbitrary HTML is omitted rather than blindly rewriting tags');
assert.equal(guarded.payload.body_html, null, 'Legacy HTML inside notification payload cannot bypass the guard');
assert.ok(!hasAppointmentUtilityConflict(guarded.body_text));
assert.ok(!hasAppointmentUtilityConflict(guarded.subject));
assert.ok(!hasAppointmentUtilityConflict(guarded.payload.message));
assert.equal(queued.body_text, 'Please confirm hose/power availability. Building access is required.', 'Stored event not mutated');
assert.equal(guardAppointmentNotificationForDispatch({ event_type: 'maintenance_plan_reminder_email', body_text: 'Customer must provide water.' }).body_text, 'Customer must provide water.', 'Non-appointment messages are outside scope');

const fallbackDocs = JSON.parse(read('data/document_templates.json'));
assert.deepEqual(auditAppointmentTemplateFields(fallbackDocs, 'data/document_templates.json'), []);
assert.equal(auditAppointmentTemplateFields({ templates: { appointment_confirmation: { body: 'Customer must bring hose and power.' }, invoice: { body: 'Customer must provide water.' } } }, 'document_templates').length, 1, 'Do not inspect non-appointment financial templates');
assert.equal(auditAppointmentTemplateFields({ sms: { booking_reminder: { text: 'You must provide an outlet.' } }, marketing: { body: 'Customer must provide water.' } }, 'notification_templates').length, 1);

const docsSource = read('functions/api/_lib/booking-documents.js');
assert.match(docsSource, /APPOINTMENT_PREPARATION_CHECKLIST\.map/);
assert.match(docsSource, /reconcileAppointmentMessageText\(appointmentConfirmation\.body\)/);
assert.match(docsSource, /preparation_checklist: \[\.\.\.APPOINTMENT_PREPARATION_CHECKLIST\]/);
assert.match(read('order-confirmation/index.html'), /id="preparationChecklist"/);
assert.match(read('order-confirmation/index.html'), /esc\(item\)/, 'Checklist must escape customer document output');
const processor = read('functions/api/notifications_process.js');
assert.match(processor, /loadCustomerCommunicationDispatchGate/);
assert.ok(processor.indexOf('loadCustomerCommunicationDispatchGate({ env, event: item })') < processor.indexOf('dispatchNotificationThroughProvider(env, guardAppointmentNotificationForDispatch(item))'), 'Guard must not bypass consent gate');
assert.match(read('assets/build399-customer-communication-self-service.js'), /Rosie brings standard detailing water and power/);

const settings = read('admin-site-settings.html');
assert.equal(settings, read('admin-site-settings/index.html'), 'Site Settings routes must match');
assert.match(settings, /id="appointmentPreparationMobileSetupReviewBtn"/);
assert.match(settings, /admin-appointment-preparation-mobile-setup-review-v660\.js/);
const browserReview = read('assets/admin-appointment-preparation-mobile-setup-review-v660.js');
assert.match(browserReview, /\/api\/admin\/appointment_preparation_mobile_setup_review/);
assert.doesNotMatch(browserReview, /method:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/);

const { onRequestGet, onRequestPost } = await importCloudflareFunction('functions/api/admin/appointment_preparation_mobile_setup_review.js');
const env = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SERVICE_ROLE_KEY: 'test-server-key', ADMIN_PASSWORD: 'test-admin-key', ALLOW_LEGACY_ADMIN_FALLBACK: 'true' };
const requests = [];
const originalFetch = globalThis.fetch;
try {
  globalThis.fetch = async (url, options = {}) => {
    requests.push({ url: String(url), method: options.method || 'GET' });
    const key = new URL(url).searchParams.get('key')?.replace(/^eq\./, '');
    const value = key === 'document_templates'
      ? { templates: { appointment_confirmation: { body: 'Customer must provide water and power. Thanks for booking.' } } }
      : key === 'notification_templates'
        ? { sms: { appointment_reminder: { body: 'Please have a hose available.' } } }
        : { reminder_intro: 'We look forward to your next appointment.' };
    return new Response(JSON.stringify([{ key, updated_at: '2026-10-26T10:00:00Z', value }]), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const request = new Request('https://rosiedazzlers.ca/api/admin/appointment_preparation_mobile_setup_review', { headers: { 'x-admin-password': 'test-admin-key' } });
  const response = await onRequestGet({ request, env });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const result = await response.json();
  assert.equal(result.status, 'owner_review_required');
  assert.equal(result.read_only, true);
  assert.equal(result.bundled_sources[0].findings.length, 0);
  assert.equal(result.managed_sources.length, 3);
  assert.equal(result.managed_sources[0].findings.length, 1);
  assert.equal(result.managed_sources[1].findings.length, 1);
  assert.equal(result.managed_sources[2].findings.length, 0);
  assert.equal(result.sms_state, 'copy_preview_only_no_new_sends_or_scheduler');
  assert.ok(requests.every(({ method }) => method === 'GET'), 'Audit must never change managed records');
  assert.equal((await onRequestGet({ request: new Request(request.url), env })).status, 401);
  assert.equal((await onRequestPost()).status, 405);
} finally { globalThis.fetch = originalFetch; }

assert.match(read('terms/index.html'), /Customer must provide water \+ power/);
assert.match(read('waiver/index.html'), /Customer must provide a working outdoor water source/);
console.log('Build 660 appointment templates, email checklist, SMS dispatch guard, consent boundary, owner review and legal hold: PASS');
