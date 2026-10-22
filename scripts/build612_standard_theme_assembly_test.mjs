import assert from 'node:assert/strict';
import fs from 'node:fs';
import { standardLandingFallback, standardPackageFallback } from '../assets/standard-image-slots.js';
import { hydrateStandardCardArtwork } from '../assets/standard-static-media.js';
import { onRequestGet as publicReviews } from '../functions/api/reviews_public.js';

const read = file => fs.readFileSync(file, 'utf8');
const catalog = JSON.parse(read('data/application_static_image_catalog.json'));
const registry = JSON.parse(read('data/theme_registry.json'));
const manifest = JSON.parse(read('manifest.webmanifest'));
const css = read('assets/themes/standard.css');
const chrome = read('assets/chrome.js');
const sw = read('service-worker.js');
const reviews = read('assets/reviews.js');
const imageHydration = read('assets/website-images.js');
const landing = read('assets/landing-page-build388.js');
const home = read('index.html');
const site = read('assets/site.js');

assert.equal(catalog.entries.length, 116, 'Existing numbered catalog IDs stay stable');
assert.equal(catalog.policy.dynamicTargetsExcluded, 617, 'Employee Photo Studio remains separate');
assert.equal(catalog.policy.reservedThemeProofExcluded, 49);
assert.ok(catalog.entries.every((row) => row.filePresent), 'Every numbered asset has its original or theme file in the repository');
const publicTheme = catalog.entries.filter(row => row.ownership === 'theme-owner-only');
const adminTheme = catalog.entries.filter(row => row.key.startsWith('admin-art:'));
assert.equal(publicTheme.length, 62);
assert.equal(adminTheme.length, 5);
assert.equal(registry.defaultTheme, 'standard');
assert.equal(registry.themes.standard.staticImageBase, '/assets/themes/standard/images/');
assert.equal(registry.themes.standard.status, 'assembled_pending_rendered_acceptance');

assert.equal(standardLandingFallback('tillsonburg-auto-detailing'), '/assets/themes/standard/images/town-tillsonburg.webp');
assert.equal(standardLandingFallback('headlight-restoration'), '/assets/themes/standard/images/addon-headlight-restoration.webp');
assert.equal(standardLandingFallback('paint-correction'), '/assets/themes/standard/images/addon-two-stage-polish.webp', 'The sixth homepage service card must not fall back to an old R2 image');
assert.equal(standardLandingFallback('not-a-service'), '');
assert.equal(standardPackageFallback('complete_detail'), '/assets/themes/standard/images/package-complete.webp');
assert.equal(standardPackageFallback('interior_detail'), '', 'Do not invent unregistered package images');

for (const file of [
  'cropgold.png','brand-banner.webp','hero-background.webp',
  'rosie-192.png','rosie-512.png','rosie-maskable-512.png','favicon.ico',
  'CarPrice2025.PNG','CarPriceDetails2025.PNG','CarSizeChart.PNG',
  'rosie-reviews-fallback.png','rosie-reviews-fallback.svg','service-photo-needed.svg'
]) assert.ok(fs.existsSync('assets/themes/standard/images/'+file), 'Missing Standard file: '+file);

assert.ok(manifest.icons.every(icon => icon.src.startsWith('/assets/themes/standard/images/')));
for (const icon of manifest.icons) assert.ok(fs.existsSync(icon.src.slice(1)));
assert.equal(manifest.theme_color, '#0b0e11');
assert.match(sw, /rosie-app-v20261021build612/);
assert.match(sw, /assets\/themes\/standard\/images\/rosie-192\.png/);
assert.match(chrome, /standardArt\.hydrateStandardCardArtwork\(document\)/);
assert.match(chrome, /hydrateGlobalSiteImageOverrides\(document\)/);
assert.ok(chrome.indexOf('hydrateGlobalSiteImageOverrides(document)') < chrome.indexOf('hydrateStandardCardArtwork(document)'),
  'Keep customer proof hydration distinct from Standard theme card styling');
assert.match(css, /\[data-standard-theme-card="true"\]::before/, 'Standard marketing cards use theme artwork even when R2 has other matches');
assert.match(imageHydration, /standardLandingFallback\(route\)/, 'R2 card matching must skip registered Standard theme marketing cards');
assert.match(landing, /const themeHero=standardLandingFallback/, 'Service and town marketing heroes must use Standard artwork');
assert.match(home, /src="\/assets\/themes\/standard\/images\/brand-banner\.webp"/, 'Homepage showcase must not use the old R2 brand banner');
assert.doesNotMatch(home, /assets\.rosiedazzlers\.ca\/brand\/RosieDazzlersBanner/, 'Do not reintroduce the old banner');
assert.doesNotMatch(home, /assets\.rosiedazzlers\.ca\/brand\/KatBlackCar/, 'Standard backdrop must not use the previous R2 art');
assert.match(site, /logo: "\/assets\/themes\/standard\/images\/cropgold\.png"/);
assert.match(chrome, /standardTheme \? '\/assets\/themes\/standard\/images\/cropgold\.png'/, 'Public business settings may not overwrite the approved Standard logo');
assert.doesNotMatch(chrome, /brand-logo\.png|RosieDazzlersBanner\.png|brand\/Untitled\.png/, 'Public chrome must not reference superseded branding');
assert.match(imageHydration, /!standardTheme && siteBackground\?\.url/, 'R2 site background must not override Standard artwork');
assert.match(imageHydration, /!standardTheme && bg\?\.url/, 'Page background override must not replace Standard artwork');
assert.match(imageHydration, /img\.dataset\.themeStatic==='true'/, 'Explicit theme artwork stays outside Photo Studio presentation overrides');
assert.match(css, /overflow-x: clip/);
assert.match(css, /text-wrap: balance/);
assert.match(css, /@media \(max-width: 720px\)/);
assert.doesNotMatch(reviews, /FALLBACK_REVIEWS|Melissa R\.|Jason K\./, 'Never publish fabricated review proof');
assert.match(reviews, /Verified customer reviews are not currently available/);
const unconnectedReviews = await (await publicReviews({ env: {} })).json();
assert.equal(unconnectedReviews.source_status, 'not_connected');
assert.deepEqual(unconnectedReviews.items, [], 'Unconnected review source must not simulate customers');
assert.doesNotMatch(read('functions/api/reviews_public.js'), /Melissa R\.|Jason K\.|temporary_sample_until_review_api_connected/);

// Exercise the renderer without a browser or live R2 credentials.
const originalDocument = globalThis.document, originalLocation = globalThis.location;
globalThis.location = { pathname: '/' };
globalThis.document = { documentElement: { dataset: { rosieTheme: 'standard' } } };
const card = route => ({ dataset: { r2ImageHref: route }, style: {
  props: new Map(), setProperty(name,value) { this.props.set(name,value); }
}});
const town = card('/port-dover-auto-detailing'), service = card('/carpet-shampoo'), unknown = card('/unlisted');
hydrateStandardCardArtwork({ querySelectorAll: () => [town,service,unknown] });
assert.equal(town.dataset.standardThemeCard, 'true');
assert.equal(service.style.props.get('--standard-card-art'), 'url("/assets/themes/standard/images/addon-carpet-shampoo.webp")');
assert.equal(unknown.style.props.size, 0);
globalThis.document.documentElement.dataset.rosieTheme = 'future-theme';
const skipped=card('/port-dover-auto-detailing');
hydrateStandardCardArtwork({ querySelectorAll: () => [skipped] });
assert.equal(skipped.style.props.size, 0, 'Do not leak Standard fallback into a future theme');
globalThis.document = originalDocument;
globalThis.location = originalLocation;

// 2025 charts were intentionally not mapped as live pricing references.
assert.match(read('assets/pricing-catalog-client-legacy.js'), /"CarPrice2025\.PNG"/);
assert.doesNotMatch(read('assets/pricing-catalog-client-legacy.js'), /themes\/standard\/images\/CarPrice2025/);
console.log('Build 612 Standard Theme #1 assets, provenance, card fallback, PWA and responsive contracts PASS');
