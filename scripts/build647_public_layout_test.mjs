import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const site = read('assets/site.css');
const layout = read('assets/build647-public-responsive.css');
const standard = read('assets/themes/standard.css');
assert.match(site, /@import url\("\/assets\/themes\/standard\.css/);
assert.match(site, /@import url\("\/assets\/build647-public-responsive\.css\?v=build647"\)/);
assert.ok(site.indexOf('/assets/themes/standard.css') < site.indexOf('/assets/build647-public-responsive.css'));
for (const selector of ['.unified-shell .unified-hero','.unified-shell .price-grid','.unified-shell .addon-card','.gift-card-options .gift-option-card','[data-build291="maintenance-retention-intake"] .form-grid']) {
  assert.ok(layout.includes(selector), 'Missing responsive fix: '+selector);
}
for (const width of ['980px','680px','380px']) assert.ok(layout.includes('max-width:'+width), 'Missing breakpoint '+width);
assert.match(standard, /--gold-bright:/, 'Preserve Standard gold palette');
assert.doesNotMatch(layout, /(?:position:\s*fixed|display:\s*none\s*!important)/, 'Avoid masking core customer content');
const pages=['book/index.html','gift-cards/index.html','gift-cards.html','maintenance-plan/index.html','maintenance-plan.html','gear/index.html','gear.html'];
for (const page of pages) {
  const html=read(page);
  assert.match(html, /<meta name="viewport"/, page + ' viewport');
  assert.match(html, /\/assets\/site\.css\?v=[a-zA-Z0-9-]+/, page + ' versioned shared stylesheet');
  assert.equal((html.match(/<h1\b/g)||[]).length, 1, page+' single H1');
}
const book=read('book/index.html');
for(const selector of ['unified-shell','package-grid','addon-grid','price-grid','booking-layout']) assert.ok(book.includes(selector), 'Unified booking '+selector);
assert.doesNotMatch(book,/Build 337 booking interaction reliability/,'No internal build status in customer hero');
for(const page of ['gift-cards/index.html','gift-cards.html']) {
  const html=read(page);
  assert.match(html, /href="\/gifts"/, 'Retain functional gift checkout path');
  assert.match(html, /gift-card-options/, 'Retain visible gift cards');
}
for(const page of ['maintenance-plan/index.html','maintenance-plan.html']) {
  const html=read(page);
  assert.match(html, /href="\/book#booking"/, 'Unified booking anchor');
  assert.doesNotMatch(html, /href="\/pricing#booking-planner"/, 'No stale redirect anchor');
  assert.match(html, /id="membershipInterestForm"/, 'Keep customer interest intake');
  assert.match(html, /id="miStatus"/, 'Keep submission status feedback');
}
for(const page of ['pricing/index.html','services/index.html','pricing.html','services.html']) {
  const html=read(page);
  assert.match(html, /location\.replace\('\/book'/, page+' maintains canonical unified booking redirect');
}
const wrapper=read('scripts/current_booking_wizard_regression.sh');
assert.match(wrapper, /node scripts\/build647_public_layout_test\.mjs/);
for (let n=627;n<=631;n++) assert.match(wrapper,new RegExp('node scripts/build'+n+'_'),'Preserve booking regression '+n);
console.log('Build 647 customer responsive layout: PASS');
