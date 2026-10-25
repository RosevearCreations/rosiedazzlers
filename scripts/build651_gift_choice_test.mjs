import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const file = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const landing = file('gift-cards/index.html');
const checkout = file('gifts/index.html');
const css = file('assets/build651-gift-choice.css');
assert.equal(landing, file('gift-cards.html'), 'Gift card landing routes must stay in sync');
assert.equal(checkout, file('gifts.html'), 'Gift checkout routes must stay in sync');
assert.match(landing, /href="\/gifts#servicePane"/);
assert.match(landing, /href="\/gifts#dollarPane"/);
for (const amount of ['100', '200', '300']) {
  assert.match(landing, new RegExp('href="/gifts\\?amount=GIFT-' + amount + '#dollarPane"'));
  assert.match(checkout, new RegExp('<option value="GIFT-' + amount + '">'));
}
for (const [tab, pane] of [['Dollar','dollar'], ['Service','service'], ['Lookup','lookup']]) {
  assert.match(checkout, new RegExp('id="tab' + tab + '"[^>]*role="tab"[^>]*aria-controls="' + pane + 'Pane"'));
  assert.match(checkout, new RegExp('id="' + pane + 'Pane"[^>]*role="tabpanel"[^>]*aria-labelledby="tab' + tab + '"'));
}
assert.match(checkout, /window\.addEventListener\("hashchange", syncTabFromLocation\)/);
assert.match(checkout, /syncTabFromLocation\(\);/);
assert.match(checkout, /params\.get\("gift"\) === "success"/);
assert.match(checkout, /\.some\(option => option\.value === requestedAmount\)/);
assert.match(checkout, /event\.key === "ArrowRight"/);
assert.match(checkout, /event\.key === "Home"/);
assert.match(checkout, /setAttribute\("aria-selected", String\(active\)\)/);
assert.match(checkout, /postJson\("\/api\/gifts\/checkout", payload\)/);
assert.match(checkout, /postJson\("\/api\/gifts\/receipt", \{ session_id, email \}\)/);
assert.match(css, /focus-visible/);
assert.match(css, /max-width:600px/);
console.log('Build 651 gift choice, deep links, checkout parity and accessibility: PASS');
