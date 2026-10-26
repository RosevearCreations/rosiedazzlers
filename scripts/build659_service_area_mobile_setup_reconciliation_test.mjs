import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  SAFE_SERVICE_AREA_ACCESS_RULE,
  auditServiceAreaAccessRows,
  guardPublicServiceAreaAccessRows,
  hasServiceAreaUtilityConflict
} from '../functions/api/_lib/service-area-mobile-setup.js';

// Cloudflare Pages accepts unannotated JSON imports; Node 24 needs attributes.
// Rewrite specifiers only in the test's in-memory module, never in deploy code.
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
const { onRequestGet: getPublicRules } = await importCloudflareFunction('functions/api/service_area_rules_public.js');
const { onRequestGet: getOwnerReview, onRequestPost: postOwnerReview } = await importCloudflareFunction('functions/api/admin/service_area_mobile_setup_review.js');
const { onRequestPost: saveAdminRules } = await importCloudflareFunction('functions/api/admin/service_area_rules.js');

const areaFallback = JSON.parse(read('data/service_area_rules.json'));
const catalogFallback = JSON.parse(read('data/rosie_services_pricing_and_packages.json'));
assert.equal(read('data/rosie_services_pricing_and_packages.json'), read('functions/api/data/rosie_services_pricing_and_packages.json'), 'Pricing JSON mirrors must be identical');
assert.equal(areaFallback.service_areas.length, 56, 'All 56 service-area fallback rows must be audited');
assert.equal(catalogFallback.service_areas.length, 55, 'All 55 pricing-catalog area rows must be audited');
for (const [source, rows] of [['service-area', areaFallback.service_areas], ['pricing-catalog', catalogFallback.service_areas]]) {
  assert.deepEqual(auditServiceAreaAccessRows(rows), [], `${source}: no fallback access-rule contradictions`);
  assert.ok(rows.every((row) => row.access_rule === SAFE_SERVICE_AREA_ACCESS_RULE), `${source}: consistent Rosie-supplied utilities`);
  assert.ok(rows.every((row) => row.water_rule_key && row.official_links?.length), `${source}: independent verified local rules must survive`);
}
assert.ok(!hasServiceAreaUtilityConflict('Rosie brings standard detailing water and power; local water-use restrictions still apply.'));
assert.ok(!hasServiceAreaUtilityConflict('Confirm safe, legal parking and apartment/condo access before dispatch.'));
assert.ok(!hasServiceAreaUtilityConflict('Municipal water conservation and runoff restrictions apply.'));
assert.ok(hasServiceAreaUtilityConflict('Confirm hose/power availability and driveway access before arrival.'));
assert.ok(hasServiceAreaUtilityConflict('Customer must provide water and an electrical outlet.'));
assert.ok(hasServiceAreaUtilityConflict('Customer-supplied water and power are required.'));
assert.equal(guardPublicServiceAreaAccessRows([{ access_rule: 'Confirm hose/power availability.' }])[0].access_rule, SAFE_SERVICE_AREA_ACCESS_RULE);

const bookingHtml = read('booking-planner.html');
assert.doesNotMatch(bookingHtml, /Confirm hose\/power availability/);
assert.equal((bookingHtml.match(/Rosie brings standard detailing water and power; local water-use and runoff restrictions still apply\./g) || []).length >= 2, true);
assert.doesNotMatch(read('assets/admin-app-v313.js'), /Confirm hose\/power availability/);
assert.match(read('assets/booking-retention-v275.js'), /Confirm hose\/power availability/, 'Legacy guard remains for stale persisted DOM states');

const settingsHtml = read('admin-site-settings.html');
assert.equal(settingsHtml, read('admin-site-settings/index.html'), 'Admin Site Settings routes must match');
assert.match(settingsHtml, /id="serviceAreaMobileSetupReviewBtn"/);
assert.match(settingsHtml, /id="serviceAreaMobileSetupReviewResult"[^>]*role="status" aria-live="polite"/);
assert.match(settingsHtml, /admin-service-area-mobile-setup-review-v659\.js/);
const reviewClient = read('assets/admin-service-area-mobile-setup-review-v659.js');
assert.match(reviewClient, /\/api\/admin\/service_area_mobile_setup_review/);
assert.doesNotMatch(reviewClient, /method:\s*['"](?:POST|PUT|PATCH|DELETE)['"]|\/api\/admin\/editable_site_settings_sync/);

const fallback = await (await getPublicRules({ env: {} })).json();
assert.equal(fallback.ok, true);
assert.equal(fallback.service_areas.length, 56);
assert.deepEqual(auditServiceAreaAccessRows(fallback.service_areas), []);
assert.ok(fallback.service_areas.some((row) => row.water_rule && row.official_links?.length), 'Municipal rule enrichment and official sources remain live');

const originalFetch = globalThis.fetch;
const requests = [];
const env = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-server-only-secret',
  ADMIN_PASSWORD: 'test-admin-only',
  ALLOW_LEGACY_ADMIN_FALLBACK: 'true'
};
const legacyAccess = 'Confirm hose/power availability, driveway slope, apartment/condo access, and any building rules before arrival.';
const managedRows = {
  table: [{ key: 'tillsonburg', value: 'Tillsonburg', label: 'Tillsonburg', county: 'Oxford County', water_rule_key: 'oxford-county-seasonal', access_rule: legacyAccess, is_active: true }],
  service_area_rules: [{ updated_at: '2026-10-26T04:00:00Z', value: { service_areas: [{ key: 'woodstock', label: 'Woodstock', county: 'Oxford County', access_rule: 'Customer must provide water and power.' }] } }],
  pricing_catalog: [{ updated_at: '2026-10-26T04:01:00Z', value: { service_areas: [{ key: 'simcoe', label: 'Simcoe', county: 'Norfolk County', access_rule: 'Customer-supplied water is required.' }] } }]
};
try {
  globalThis.fetch = async (url, options = {}) => {
    const address = String(url);
    const method = options.method || 'GET';
    requests.push({ address, method });
    assert.match(address, /^https:\/\/example\.supabase\.co\/rest\/v1\//);
    if (address.includes('/rest/v1/service_area_rules')) {
      return new Response(JSON.stringify(managedRows.table), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    if (address.includes('/rest/v1/water_restriction_rules')) {
      return new Response('{}', { status: 404 });
    }
    const key = new URL(address).searchParams.get('key')?.replace(/^eq\./, '');
    return new Response(JSON.stringify(managedRows[key] || []), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  const authorizedRequest = new Request('https://rosiedazzlers.ca/api/admin/service_area_mobile_setup_review', { headers: { 'x-admin-password': 'test-admin-only' } });
  const reviewed = await getOwnerReview({ request: authorizedRequest, env });
  assert.equal(reviewed.status, 200);
  assert.equal(reviewed.headers.get('cache-control'), 'no-store');
  const report = await reviewed.json();
  assert.equal(report.status, 'owner_review_required');
  assert.equal(report.read_only, true);
  assert.ok(report.bundled_sources.every((source) => !source.findings.length));
  assert.equal(report.managed_sources.length, 3);
  assert.ok(report.managed_sources.every((source) => source.findings.length === 1));
  assert.equal(report.managed_sources[1].updated_at, '2026-10-26T04:00:00Z');
  assert.equal(report.water_rule_authority.includes('water_restriction_rules'), true);
  assert.ok(requests.every((entry) => entry.method === 'GET'), 'Owner source audit must not write to Supabase');
  assert.equal((await getOwnerReview({ request: new Request(authorizedRequest.url), env })).status, 401);
  assert.equal((await postOwnerReview()).status, 405);

  requests.length = 0;
  const publicData = await (await getPublicRules({ env })).json();
  assert.equal(publicData.source_status, 'service_area_rules_table');
  assert.deepEqual(auditServiceAreaAccessRows(publicData.service_areas), [], 'DB-first public access rules must be guarded');
  assert.equal(publicData.service_areas.find((row) => row.value === 'Tillsonburg').access_rule, SAFE_SERVICE_AREA_ACCESS_RULE);
  assert.ok(publicData.service_areas.find((row) => row.value === 'Tillsonburg').water_rule, 'Separately sourced municipal rules preserved');
  assert.ok(requests.every((entry) => entry.method === 'GET'), 'Public service-area guard must not write to Supabase');

  requests.length = 0;
  const rejectedSave = await saveAdminRules({ request: new Request('https://rosiedazzlers.ca/api/admin/service_area_rules', {
    method: 'POST', headers: { 'x-admin-password': 'test-admin-only', 'content-type': 'application/json' },
    body: JSON.stringify({ service_areas: [{ county: 'Oxford County', label: 'Tillsonburg', value: 'Tillsonburg', access_rule: legacyAccess }] })
  }), env });
  assert.equal(rejectedSave.status, 422, 'Admin should reject explicitly saving contradictory source copy');
  assert.ok((await rejectedSave.json()).findings?.length);
  assert.equal(requests.length, 0, 'Rejected save must not touch managed data');
} finally {
  globalThis.fetch = originalFetch;
}

assert.match(read('terms/index.html'), /Customer must provide water \+ power/);
assert.match(read('waiver/index.html'), /Customer must provide a working outdoor water source/);
console.log('Build 659 service-area seed, pricing mirror, booking fallback, DB display guard, owner read-only review and legal hold: PASS');
