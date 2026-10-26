import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  auditTownLandingPage,
  flattenTownLandingContent,
  hasTownMobileSetupConflict,
  TOWN_SAFE_SETUP_COPY
} from '../functions/api/_lib/town-mobile-setup.js';
import { onRequestGet as getPublicLanding } from '../functions/api/landing_pages_public.js';
import { onRequestGet as getTownReview, onRequestPost as postTownReview } from '../functions/api/admin/town_mobile_setup_review.js';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const source = JSON.parse(read('data/landing_pages_content.json'));
assert.equal(read('data/landing_pages_content.json'), read('functions/api/data/landing_pages_content.json'), 'Bundled landing-page mirrors must match');
const towns = flattenTownLandingContent(source);
assert.equal(Object.keys(towns).length, 8);
assert.ok(Object.values(towns).every((page) => auditTownLandingPage(page).length === 0), 'All eight bundled town pages should agree on mobile setup');
assert.ok(Object.values(towns).every((page) => page.faq.some((row) => /Rosie (?:brings|supplies).*water and power/i.test(row.a))
  || page.things_to_know.some((item) => /Rosie (?:brings|supplies).*water and power/i.test(item))), 'Town setup guidance must identify Rosie-supplied utilities');
assert.ok(!hasTownMobileSetupConflict('Rosie brings standard detailing water and power; local runoff restrictions still apply.'));
assert.ok(!hasTownMobileSetupConflict('Current county outdoor water-use rules and drainage limits must be checked.'));
assert.ok(hasTownMobileSetupConflict('Customers must provide water and electricity for mobile detailing.'));
assert.ok(hasTownMobileSetupConflict('Customer-supplied water access is checked before dispatch.'));
assert.ok(hasTownMobileSetupConflict('Driveway access, electrical access, and water-use timing affect the booking.'));
assert.ok(hasTownMobileSetupConflict('Mobile detailing depends on hose / outlet expectations.'));
assert.ok(hasTownMobileSetupConflict('Ontario TOU rates are cheaper for customers using household power during service.'));
assert.ok(auditTownLandingPage({ type: 'location', faq: [{ q: 'Water rules?', a: 'Customer supplies water and hose.' }] }, 'test-auto-detailing').some((row) => row.path === 'faq[0].a'));

const settingsHtml = read('admin-site-settings.html');
assert.equal(settingsHtml, read('admin-site-settings/index.html'), 'Admin settings routes must remain identical');
assert.match(settingsHtml, /id="townMobileSetupReviewBtn"/);
assert.match(settingsHtml, /id="townMobileSetupReviewResult"[^>]*role="status" aria-live="polite"/);
assert.match(settingsHtml, /admin-town-mobile-setup-review-v657\.js/);
const adminJs = read('assets/admin-town-mobile-setup-review-v657.js');
assert.match(adminJs, /\/api\/admin\/town_mobile_setup_review/);
assert.doesNotMatch(adminJs, /method:\s*['"](?:POST|PATCH|PUT|DELETE)['"]|\/api\/admin\/editable_site_settings_sync/);

const fallbackResponse = await getPublicLanding({ env: {} });
assert.equal(fallbackResponse.status, 200);
const fallback = await fallbackResponse.json();
for (const [slug, page] of Object.entries(fallback.pages)) {
  if (page.type !== 'location') continue;
  assert.deepEqual(auditTownLandingPage(page, slug), [], `${slug}: final public copy must be clear`);
  assert.ok(page.customer_prep.some((note) => note.includes('Rosie Dazzlers brings')), 'Canonical setup must remain visible');
}
const tillsonburg = fallback.pages['tillsonburg-auto-detailing'];
assert.ok(tillsonburg.official_links.some((link) => link.url.includes('tillsonburg.ca')), 'Official municipal links must survive');
assert.ok(fallback.pages['norwich-otterville-auto-detailing'].things_to_know.some((note) => note.includes('outdoor water-use')));

const originalFetch = globalThis.fetch;
const requests = [];
const env = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-server-only-secret',
  ADMIN_PASSWORD: 'test-admin-only',
  ALLOW_LEGACY_ADMIN_FALLBACK: 'true'
};
const sourceRows = {
  landing_pages_content: [{ key: 'landing_pages_content', updated_at: '2026-10-25T20:00:00Z', value: {
    pages: {
      'norwich-otterville-auto-detailing': {
        type: 'location',
        process: ['Confirm driveway access and water/power availability before booking.'],
        faq: [{ q: 'Who supplies the water?', a: 'Customers must provide water and electricity.' }]
      }
    }
  } }],
  landing_pages: [{ key: 'landing_pages', updated_at: '2026-10-25T20:01:00Z', value: {
    pages: {
      'simcoe-delhi-auto-detailing': {
        type: 'location',
        things_to_know: ['Customer-supplied water access is required before exterior work.'],
        water_restriction_note: 'Current county water-use windows are subject to local restrictions.'
      }
    }
  } }]
};
try {
  globalThis.fetch = async (url, options = {}) => {
    const address = String(url);
    const method = options.method || 'GET';
    requests.push({ address, method });
    assert.match(address, /^https:\/\/example\.supabase\.co\/rest\/v1\//);
    const key = new URL(address).searchParams.get('key')?.replace(/^eq\./, '');
    return new Response(JSON.stringify(sourceRows[key] || []), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const request = new Request('https://rosiedazzlers.ca/api/admin/town_mobile_setup_review', {
    headers: { 'x-admin-password': 'test-admin-only' }
  });
  const review = await getTownReview({ request, env });
  assert.equal(review.status, 200);
  assert.equal(review.headers.get('cache-control'), 'no-store');
  const report = await review.json();
  assert.equal(report.ok, true);
  assert.equal(report.read_only, true);
  assert.equal(report.status, 'owner_review_required');
  assert.equal(report.bundled.count, 8);
  assert.ok(report.bundled.pages.every((page) => !page.findings.length));
  assert.ok(report.managed_sources[0].pages[0].findings.some((f) => f.path === 'faq[0].a'));
  assert.ok(report.managed_sources[1].pages[0].findings.some((f) => f.path === 'things_to_know[0]'));
  assert.equal(report.managed_sources[1].pages[0].findings.some((f) => f.path === 'water_restriction_note'), false, 'Legitimate local restrictions must not be flagged');
  assert.ok(requests.every((entry) => entry.method === 'GET'));
  assert.equal((await getTownReview({ request: new Request(request.url), env })).status, 401);
  assert.equal((await postTownReview()).status, 405);

  requests.length = 0;
  const managedPublic = await (await getPublicLanding({ env })).json();
  const norwich = managedPublic.pages['norwich-otterville-auto-detailing'];
  const simcoe = managedPublic.pages['simcoe-delhi-auto-detailing'];
  assert.deepEqual(auditTownLandingPage(norwich, 'norwich-otterville-auto-detailing'), []);
  assert.deepEqual(auditTownLandingPage(simcoe, 'simcoe-delhi-auto-detailing'), []);
  assert.equal(norwich.faq[0].a, TOWN_SAFE_SETUP_COPY, 'Old managed FAQ answer must be guarded publicly');
  assert.equal(simcoe.water_restriction_note, fallback.pages['simcoe-delhi-auto-detailing'].water_restriction_note, 'Independent local water-rule authority must survive managed landing copy');
  assert.ok(simcoe.water_restriction_sources.length > 0, 'Verified municipal water sources must be retained');
  assert.ok(requests.every((entry) => entry.method === 'GET'), 'No public source reconciliation may write to Supabase');
} finally {
  globalThis.fetch = originalFetch;
}

assert.match(read('terms/index.html'), /Customer must provide water \+ power/);
assert.match(read('waiver/index.html'), /Customer must provide a working outdoor water source/);
console.log('Build 657 town setup seeds, public DB guard, municipal rules, protected owner review and legal hold: PASS');
