import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const must = (condition, message) => { if (!condition) throw new Error(message); };
const count = (text, pattern) => (text.match(pattern) || []).length;

const book = read('book.html');
const bookRoute = read('book/index.html');
const planner = read('booking-planner.html');
const services = read('services.html');
const pricing = read('pricing.html');
const servicesRoute = read('services/index.html');
const pricingRoute = read('pricing/index.html');
const redirects = read('_redirects');
const sitemap = read('sitemap.xml');
const catalogClient = read('assets/pricing-catalog-client.js');

must(count(book, /<h1\b/gi) === 1, 'Unified /book must expose exactly one H1.');
must(bookRoute === book, 'book.html and book/index.html must remain byte-identical so /book serves the unified funnel.');
must(book.includes('https://rosiedazzlers.ca/book'), 'Unified /book must remain the canonical public booking URL.');
must(book.includes('pricing-catalog-client-legacy.js'), 'Unified /book must use the retained live pricing catalogue rather than duplicate pricing data.');
must(book.includes('id="packageGrid"') && book.includes('id="addonGrid"'), 'Unified /book must own package and add-on discovery.');
must(book.includes('/booking-planner?'), 'Unified /book must embed the preserved booking planner.');
must(book.includes('package') && book.includes('size') && book.includes('addons'), 'Unified /book must prefill planner package, vehicle size and add-ons.');
must(planner.includes('id="checkoutBtn"') && planner.includes('/api/checkout'), 'Preserved booking planner must retain checkout behavior.');
must(planner.includes('/api/availability?date='), 'Preserved booking planner must retain live availability checks.');
must(planner.includes('loadGarageVehicles'), 'Preserved booking planner must retain authenticated garage vehicle persistence.');
must(count(services, /<h1\b/gi) === 1 && services.includes('noindex,follow') && services.includes("location.replace('/book'"), '/services must be a thin canonical migration bridge, not a second service implementation.');
must(count(pricing, /<h1\b/gi) === 1 && pricing.includes('noindex,follow') && pricing.includes("location.replace('/book'"), '/pricing must be a thin canonical migration bridge, not a second pricing implementation.');
must(servicesRoute === services, 'services.html and services/index.html must remain byte-identical route copies.');
must(pricingRoute === pricing, 'pricing.html and pricing/index.html must remain byte-identical route copies.');
must(redirects.includes('/services /book 301') && redirects.includes('/pricing /book 301'), 'Services and Pricing must server-redirect to the unified /book funnel.');
must(sitemap.includes('https://rosiedazzlers.ca/book/'), 'Sitemap must retain the canonical unified /book URL.');
must(!sitemap.includes('https://rosiedazzlers.ca/services/') && !sitemap.includes('https://rosiedazzlers.ca/pricing/'), 'Redirected Services/Pricing URLs must not remain in the indexable sitemap.');
must(catalogClient.includes('"/booking-planner"'), 'Pricing wrapper must retain optional booking modules on the internal planner route.');

console.log('Build 336 unified Services/Pricing/Booking gate: PASS');
