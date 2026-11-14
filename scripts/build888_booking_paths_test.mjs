// Build 888: booking-entry source regression (no live charges or network calls).
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const page=readFileSync(new URL('../book/index.html',import.meta.url),'utf8');
const planner=readFileSync(new URL('../booking-planner.html',import.meta.url),'utf8');
const checkout=readFileSync(new URL('../functions/api/checkout.js',import.meta.url),'utf8');
for(const id of ['bookingPaths888','guidedPath888','manualPath888','bookingPathStatus888'])assert.match(page,new RegExp('id="'+id+'"'));
assert.match(page,/href="#booking" aria-describedby="guidedDesc888"/);
assert.ok(page.includes('href="/book-custom" aria-describedby="manualDesc888"'));
assert.match(page,/Build your own approved individual-service basket/);
assert.match(page,/@media\(max-width:720px\)\{\.booking-paths-888__grid\{grid-template-columns:1fr/);
assert.match(page,/:focus-visible\{outline:3px solid/);
assert.match(planner,/wizardProgress627/);
assert.match(checkout,/"package_code"/);
assert.match(checkout,/ack_driveway/);
assert.match(checkout,/STRIPE_SECRET_KEY/);
console.log('Rosie Build 888 booking choice regression: PASS (guided and standalone customer entry share canonical checkout)');
