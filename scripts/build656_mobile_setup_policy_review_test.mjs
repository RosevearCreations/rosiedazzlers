import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import {
  classifyMobileSetupCopy,
  isLegacyCustomerUtilityClaim,
  resolvePublicMobileSetupCopy,
  PUBLIC_MOBILE_SETUP_COPY
} from '../functions/api/_lib/mobile-setup-policy.js';
import { onRequestGet, onRequestPost } from '../functions/api/admin/mobile_setup_policy_review.js';

const read = (name) => readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const legacy = 'Driveway required · customer provides power + water, or additional charges may apply.';
const aligned = 'Rosie brings standard detailing water and power. Please provide a safe, permitted work area.';
const unrelated = 'Customer provides a safe driveway. Rosie brings standard detailing water and power.';

assert.equal(classifyMobileSetupCopy(legacy), 'conflict');
assert.equal(classifyMobileSetupCopy('Customer must provide water + power at the site.'), 'conflict');
assert.equal(classifyMobileSetupCopy('customer-supplied water and electricity'), 'conflict');
assert.equal(classifyMobileSetupCopy(aligned), 'aligned');
assert.equal(classifyMobileSetupCopy(unrelated), 'aligned', 'Safe work-area requirements are not customer-supplied utilities');
assert.equal(classifyMobileSetupCopy('Unusual building restrictions may need review.'), 'review');
assert.equal(classifyMobileSetupCopy(''), 'missing');
assert.equal(isLegacyCustomerUtilityClaim(unrelated), false);
assert.equal(resolvePublicMobileSetupCopy(legacy), PUBLIC_MOBILE_SETUP_COPY);
assert.equal(resolvePublicMobileSetupCopy(aligned), aligned);

// Exercise the real classic browser footer helper without needing DOM side effects.
const chrome = read('assets/chrome.js');
const footerHelper = chrome.match(/function publicMobileSetupNote\(managedCopy\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(footerHelper, 'Public footer policy guard must exist');
const browserFooter = vm.runInNewContext(`${footerHelper}\npublicMobileSetupNote`);
assert.equal(browserFooter(legacy), PUBLIC_MOBILE_SETUP_COPY);
assert.equal(browserFooter(aligned), aligned);
assert.equal(browserFooter(unrelated), unrelated);

// Exercise public policy dynamic rendering on a database-provided legacy value.
const callback = { domReady: null };
let publicReadCount = 0;
const scope = {
  window: { location: { pathname: '/contact' } },
  document: { addEventListener: (name, handler) => { if (name === 'DOMContentLoaded') callback.domReady = handler; } },
  fetch: async () => {
    publicReadCount += 1;
    return { json: async () => ({ settings: { site_policies: { value: { policies: { water_power: legacy } } } } }) };
  }
};
vm.runInNewContext(read('assets/site-policies.js'), scope);
const publicPolicies = await scope.window.RosieSitePolicies.loadPolicies();
assert.equal(publicPolicies.water_power, 'Rosie brings standard detailing water and power. Please provide a safe, permitted work area; local water-use, runoff and building restrictions may still affect service.');
assert.equal(publicReadCount, 1);

const settingsHtml = read('admin-site-settings.html');
assert.equal(settingsHtml, read('admin-site-settings/index.html'), 'Both Admin Settings routes must remain identical');
assert.match(settingsHtml, /id="mobileSetupReviewBtn"/);
assert.match(settingsHtml, /id="mobileSetupReviewResult"[^>]*role="status" aria-live="polite"/);
assert.match(settingsHtml, /\/assets\/admin-mobile-setup-review-v656\.js/);
const adminUi = read('assets/admin-mobile-setup-review-v656.js');
assert.match(adminUi, /\/api\/admin\/mobile_setup_policy_review/);
assert.doesNotMatch(adminUi, /method:\s*['"]POST['"]|\/api\/admin\/editable_site_settings_sync/);

const originalFetch = globalThis.fetch;
let requests = [];
const env = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-server-only-secret',
  ADMIN_PASSWORD: 'test-admin-only',
  ALLOW_LEGACY_ADMIN_FALLBACK: 'true'
};
const request = new Request('https://rosiedazzlers.ca/api/admin/mobile_setup_policy_review', {
  headers: { 'x-admin-password': 'test-admin-only' }
});
try {
  globalThis.fetch = async (url, options = {}) => {
    requests.push({ url: String(url), method: options.method || 'GET' });
    assert.match(String(url), /^https:\/\/example\.supabase\.co\/rest\/v1\//);
    if (String(url).includes('app_management_settings')) {
      return new Response(JSON.stringify([{ key: 'site_policies', value: { policies: { water_power: legacy } }, updated_at: '2026-10-25T01:00:00Z' }]), { status: 200 });
    }
    if (String(url).includes('public_faq_entries')) {
      return new Response(JSON.stringify([
        { question: 'Do you supply water and power?', answer: 'Customers must provide water and power.', is_active: true },
        { question: 'Can we book an interior detail?', answer: aligned, is_active: true }
      ]), { status: 200 });
    }
    throw new Error('Unexpected external request');
  };
  const res = await onRequestGet({ request, env });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('cache-control'), 'no-store');
  const body = await res.json();
  assert.equal(body.ok, true);
  assert.equal(body.read_only, true);
  assert.equal(body.status, 'owner_review_required');
  assert.equal(body.site_policy.status, 'conflict');
  assert.equal(body.site_policy.public_display, PUBLIC_MOBILE_SETUP_COPY);
  assert.equal(body.active_faq.status, 'conflict');
  assert.equal(body.active_faq.matches[0].status, 'conflict');
  assert.equal(body.legal_hold.length, 2);
  assert.ok(requests.every((item) => item.method === 'GET'), 'Review must never write to Supabase');

  requests = [];
  const unauthorized = await onRequestGet({ request: new Request(request.url), env });
  assert.equal(unauthorized.status, 401);
  assert.equal(requests.length, 0, 'Unauthorized reviews must not query the database');
  assert.equal((await onRequestPost()).status, 405);
} finally {
  globalThis.fetch = originalFetch;
}

// Legal text remains a deliberate owner approval hold.
assert.match(read('terms/index.html'), /Customer must provide water \+ power/);
assert.match(read('waiver/index.html'), /Customer must provide a working outdoor water source/);
console.log('Build 656: public copy guard, protected read-only source review, and legal owner hold PASS');
