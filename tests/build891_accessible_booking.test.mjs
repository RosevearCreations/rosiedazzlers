import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const wizard=readFileSync(new URL('../booking-planner.html',import.meta.url),'utf8');
test('guided booking retains five-step state, validation and canonical checkout',()=>{
 assert.match(wizard,/function gotoStep\(step\)/);
 assert.match(wizard,/state\.currentStep = Math\.max\(1, Math\.min\(steps\.length, step\)\)/);
 assert.match(wizard,/advanceWizardStep737/);
 assert.match(wizard,/checkoutGuard737\.phase/);
});
test('current step is exposed to assistive technology and focus follows navigation',()=>{
 assert.match(wizard,/aria-current="step"/);
 assert.match(wizard,/activePanel\?\.querySelector\("h2,h3"\)/);
 assert.match(wizard,/heading\.focus\(\{ preventScroll: true \}\)/);
 assert.match(wizard,/!errorNode\?\.textContent\?\.trim\(\) && heading/);
 assert.match(wizard,/role="status" aria-live="polite"/);
});
test('touch, keyboard, small-screen and reduced-motion access are explicit',()=>{
 assert.match(wizard,/min-height:44px;min-width:44px/);
 assert.match(wizard,/:focus-visible/);
 assert.match(wizard,/prefers-reduced-motion:reduce/);
 assert.match(wizard,/max-width:600px/);
});
