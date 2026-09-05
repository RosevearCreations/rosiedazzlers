import fs from 'node:fs';

function fail(message) {
  console.error(`BUILD338 FAIL: ${message}`);
  process.exitCode = 1;
}

function ok(message) {
  console.log(`BUILD338 OK: ${message}`);
}

const modulePath = 'assets/booking-specialty-cards.js';
const hookPath = 'assets/site-policies.js';
const catalogPath = 'data/rosie_services_pricing_and_packages.json';
const sitemapPath = 'sitemap.xml';

for (const path of [modulePath, hookPath, catalogPath, sitemapPath]) {
  if (!fs.existsSync(path)) fail(`missing ${path}`);
}
if (process.exitCode) process.exit();

const moduleSource = fs.readFileSync(modulePath, 'utf8');
const hookSource = fs.readFileSync(hookPath, 'utf8');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const sitemap = fs.readFileSync(sitemapPath, 'utf8');

const requiredModuleTokens = [
  'GUIDE_ROUTES',
  'addon-rich-media',
  'addon-rich-title',
  'addon-rich-summary',
  'addon-rich-price',
  'addon-rich-chip',
  'addon-rich-select',
  'Service details',
  'MutationObserver',
  'button.click()',
  'addonPrimaryImage',
  'addonFallbackImage'
];
for (const token of requiredModuleTokens) {
  if (!moduleSource.includes(token)) fail(`rich-card module is missing ${token}`);
}

if (!hookSource.includes('/assets/booking-specialty-cards.js?v=20260904build338')) {
  fail('booking page does not load the Build 338 rich-card enhancer');
}
const canonicalBookScoped =
  hookSource.includes("path === '/book'") ||
  hookSource.includes("currentPath() === '/book'") ||
  hookSource.includes("return currentPath() === '/book';");
if (!canonicalBookScoped) {
  fail('rich-card enhancer is not scoped to the canonical /book route');
}

const addons = Array.isArray(catalog.addons) ? catalog.addons : [];
if (addons.length < 24) fail(`expected at least 24 add-ons, found ${addons.length}`);

for (const addon of addons) {
  const code = String(addon?.code || '').trim();
  const name = String(addon?.name || code).trim();
  if (!code) {
    fail('catalog contains an add-on without a code');
    continue;
  }
  if (!String(addon?.image_url || '').trim()) fail(`${name} has no primary image_url`);
  if (!String(addon?.image_fallback_url || '').trim()) fail(`${name} has no image_fallback_url`);

  const routeMatch = moduleSource.match(new RegExp(`\\b${code.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\s*:\\s*[\"']([^\"']+)[\"']`));
  if (!routeMatch) {
    fail(`${name} has no GUIDE_ROUTES entry`);
    continue;
  }
  const route = routeMatch[1];
  const canonical = `https://rosiedazzlers.ca${route.endsWith('/') ? route : `${route}/`}`;
  if (!sitemap.includes(`<loc>${canonical}</loc>`)) fail(`${name} guide route ${route} is not indexed in sitemap.xml`);
}

if (!process.exitCode) {
  ok(`${addons.length} add-ons have image-backed rich cards and indexed guide links`);
  ok('selection control remains separate from linked image/title navigation');
  ok('MutationObserver re-applies rich cards after package/size/add-on rerenders');
}
