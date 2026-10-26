import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import {
  auditServiceAddonLandingPage,
  flattenServiceAddonLandingContent,
  hasServiceAddonMobileSetupConflict,
  SERVICE_ADDON_SAFE_SETUP_COPY
} from '../functions/api/_lib/service-addon-mobile-setup.js';

// Cloudflare Pages accepts unannotated JSON imports; Node 24 needs attributes.
// Rewrite only the in-memory test module, not deployed function sources.
async function importCloudflareFunction(path) {
  const sourceUrl = new URL('../' + path, import.meta.url);
  let source = readFileSync(sourceUrl, 'utf8');
  source = source.replace(/from\s+(["'])([^"']+)(\1);/g, (match, quote, specifier) => {
    if (!specifier.startsWith('.')) return match;
    const absolute = new URL(specifier, sourceUrl).href;
    return `from "${absolute}"${specifier.endsWith('.json') ? ' with { type: "json" }' : ''};`;
  });
  return import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
}

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const { onRequestGet: getPublicLanding } = await importCloudflareFunction('functions/api/landing_pages_public.js');
const { onRequestGet: getOwnerReview, onRequestPost: postOwnerReview } = await importCloudflareFunction('functions/api/admin/service_addon_mobile_setup_review.js');
const bundled = JSON.parse(read('data/landing_pages_content.json'));
assert.equal(read('data/landing_pages_content.json'), read('functions/api/data/landing_pages_content.json'), 'Bundled landing-page JSON mirrors must stay identical');
const serviceAddons = flattenServiceAddonLandingContent(bundled);
const knownSlugs = Object.keys(serviceAddons);
assert.equal(knownSlugs.length, 28, 'All 28 service/add-on landing page sources should be covered');
assert.ok(Object.values(serviceAddons).every((page) => !auditServiceAddonLandingPage(page, page.slug, knownSlugs).length));
assert.ok(!hasServiceAddonMobileSetupConflict('De-ionized water can improve rinsing and reduce mineral spotting.'));
assert.ok(!hasServiceAddonMobileSetupConflict('Local water-use, runoff and site regulations may restrict exterior work.'));
assert.ok(!hasServiceAddonMobileSetupConflict('Rosie brings standard detailing water and power.'));
assert.ok(hasServiceAddonMobileSetupConflict('Customer must supply a hose and electrical outlet.'));
assert.ok(hasServiceAddonMobileSetupConflict('Please confirm water/power rules before mobile detail service.'));
assert.ok(hasServiceAddonMobileSetupConflict('Customer-supplied water is required.'));
assert.ok(auditServiceAddonLandingPage({ type: 'addon', faq: [{ q: 'Utilities?', a: 'Customer must provide power.' }] }, 'test-addon').some((row) => row.path === 'faq[0].a'));
assert.deepEqual(auditServiceAddonLandingPage({ type: 'location', process: ['Customer must provide power.'] }, 'test-auto-detailing'), []);
assert.equal(flattenServiceAddonLandingContent({ pages: { 'ceramic-coating': { process: ['Customer must provide water.'] } } }, knownSlugs)['ceramic-coating'].process.length, 1, 'Managed overrides without type still require review');

// Standalone static service/add-on marketing pages must not rely on a customer
// hose/outlet or imply that a utility provider supplies the service power.
let staticCount = 0;
let clarifiedCount = 0;
for (const slug of knownSlugs) {
  const file = `${slug}/index.html`;
  if (!existsSync(new URL('../' + file, import.meta.url))) continue;
  staticCount++;
  const html = read(file);
  assert.doesNotMatch(html, /\bwater\/power rules\b/i, `${slug}: clarify vague utility rule wording`);
  assert.doesNotMatch(html, /customer must (?:provide|supply) (?:water|power|electricity|a hose)/i);
  if (html.includes('Rosie brings standard detailing water and power.')) clarifiedCount++;
}
assert.equal(staticCount, 25);
assert.ok(clarifiedCount >= 22, 'The affected standalone landing pages must clarify Rosie-supplied utilities');

const settingsHtml = read('admin-site-settings.html');
assert.equal(settingsHtml, read('admin-site-settings/index.html'), 'Admin settings routes must remain identical');
assert.match(settingsHtml, /id="serviceAddonMobileSetupReviewBtn"/);
assert.match(settingsHtml, /id="serviceAddonMobileSetupReviewResult"[^>]*role="status" aria-live="polite"/);
assert.match(settingsHtml, /admin-service-addon-mobile-setup-review-v658\.js/);
const adminJs = read('assets/admin-service-addon-mobile-setup-review-v658.js');
assert.match(adminJs, /\/api\/admin\/service_addon_mobile_setup_review/);
assert.doesNotMatch(adminJs, /method:\s*['"](?:POST|PATCH|PUT|DELETE)['"]|\/api\/admin\/editable_site_settings_sync/);

const publicFallback = await (await getPublicLanding({ env: {} })).json();
assert.equal(publicFallback.ok, true);
assert.ok(Object.values(publicFallback.pages).filter((page) => page.type === 'addon').length >= 28);
for (const [slug, page] of Object.entries(publicFallback.pages)) {
  if (page.type !== 'addon' && page.type !== 'service') continue;
  assert.deepEqual(auditServiceAddonLandingPage(page, slug), [], `${slug}: public service/add-on copy must align`);
  assert.ok(page.customer_prep.includes(SERVICE_ADDON_SAFE_SETUP_COPY), `${slug}: canonical mobile prep must be visible`);
}

const originalFetch = globalThis.fetch;
const requests = [];
const env = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-server-only-secret',
  ADMIN_PASSWORD: 'test-admin-only',
  ALLOW_LEGACY_ADMIN_FALLBACK: 'true'
};
const savedRows = {
  landing_pages_content: [{ key: 'landing_pages_content', updated_at: '2026-10-25T20:00:00Z', value: {
    pages: {
      'ceramic-coating': {
        process: ['Customer must provide an electrical outlet before coating.'],
        faq: [{ q: 'Who supplies utilities?', a: 'Customers must provide water and power.' }]
      },
      'tillsonburg-auto-detailing': { type: 'location', process: ['Customers must provide water.'] }
    }
  } }],
  landing_pages: [{ key: 'landing_pages', updated_at: '2026-10-25T20:01:00Z', value: {
    pages: {
      'pet-hair-removal': {
        type: 'addon',
        things_to_know: ['Confirm water/power rules with the customer.'],
        water_restriction_note: 'Check current municipal runoff rules before exterior work.'
      }
    }
  } }]
};
try {
  globalThis.fetch = async (url, options = {}) => {
    const address = String(url);
    requests.push({ address, method: options.method || 'GET' });
    assert.match(address, /^https:\/\/example\.supabase\.co\/rest\/v1\//);
    const key = new URL(address).searchParams.get('key')?.replace(/^eq\./, '');
    return new Response(JSON.stringify(savedRows[key] || []), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const request = new Request('https://rosiedazzlers.ca/api/admin/service_addon_mobile_setup_review', {
    headers: { 'x-admin-password': 'test-admin-only' }
  });
  const review = await getOwnerReview({ request, env });
  assert.equal(review.status, 200);
  assert.equal(review.headers.get('cache-control'), 'no-store');
  const report = await review.json();
  assert.equal(report.ok, true);
  assert.equal(report.read_only, true);
  assert.equal(report.status, 'owner_review_required');
  assert.equal(report.bundled.count, 28);
  assert.ok(report.bundled.pages.every((page) => !page.findings.length));
  assert.ok(report.managed_sources[0].pages.some((page) => page.slug === 'ceramic-coating' && page.findings.some((f) => f.path === 'faq[0].a')));
  assert.equal(report.managed_sources[0].pages.some((page) => page.slug === 'tillsonburg-auto-detailing'), false);
  assert.ok(report.managed_sources[1].pages[0].findings.some((f) => f.path === 'things_to_know[0]'));
  assert.equal(report.managed_sources[1].pages[0].findings.some((f) => f.path === 'water_restriction_note'), false);
  assert.ok(requests.every((entry) => entry.method === 'GET'));
  assert.equal((await getOwnerReview({ request: new Request(request.url), env })).status, 401);
  assert.equal((await postOwnerReview()).status, 405);

  requests.length = 0;
  const managedPublic = await (await getPublicLanding({ env })).json();
  const ceramic = managedPublic.pages['ceramic-coating'];
  assert.deepEqual(auditServiceAddonLandingPage(ceramic, 'ceramic-coating'), []);
  assert.equal(ceramic.faq[0].a, SERVICE_ADDON_SAFE_SETUP_COPY, 'Managed conflicting FAQ must be guarded publicly');
  assert.ok(ceramic.customer_prep.includes(SERVICE_ADDON_SAFE_SETUP_COPY));
  assert.ok(managedPublic.pages['pet-hair-removal'].water_restriction_note.includes('municipal runoff rules'));
  assert.ok(requests.every((entry) => entry.method === 'GET'), 'The public guard cannot write to Supabase');
} finally {
  globalThis.fetch = originalFetch;
}

assert.match(read('terms/index.html'), /Customer must provide water \+ power/);
assert.match(read('waiver/index.html'), /Customer must provide a working outdoor water source/);
console.log('Build 658 service/add-on static and managed source copy, guarded public output, protected read-only owner audit and legal hold: PASS');
