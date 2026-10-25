import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('book/index.html');
assert.equal(html,read('book.html'),'Canonical /book and file alias must be identical');
for(const id of ['readinessSize650','readinessPackage650','readinessExtras650','readinessAvailability650','readinessStatus650','readinessNext650']){
  assert.ok(html.includes('id="'+id+'"'),'Booking readiness element missing: '+id);
}
assert.match(html,/function renderReadiness650\(\)/,'Readiness is driven by current user selections');
assert.match(html,/const sizeReady=!!state\.size/,'Vehicle-size readiness is derived, not assumed');
assert.match(html,/const packageReady=!!packageRow\(\)/,'Package readiness relies on live catalog membership');
assert.match(html,/selectedAddonRows\(\)\.some\(row=>row\.quote_required===true\)/,'Quote-required addons are called out');
assert.match(html,/state\.plannerTouched/,'Preserve in-progress planner awareness');
assert.match(html,/next\.textContent="Continue to availability";next\.href="#booking"/,'Next action goes to planner');
assert.match(html,/renderReadiness650\(\);/,'Render summary syncs readiness');
assert.match(html,/A time is only reserved when the booking process confirms it/,'No false booking confirmation');
assert.match(html,/state\.plannerTouched && !force/,'No silent planner restart');
assert.match(html,/loadPricingCatalogClient/,'Keep live pricing authority');
assert.match(html,/window\.addEventListener\("message"/,'Keep embedded planner event bridge');
assert.equal((html.match(/<details\b/g)||[]).length,(html.match(/<\/details>/g)||[]).length,'Help disclosures must balance');
const css=read('assets/build650-booking-guidance.css');
for(const selector of ['.booking-help-650','.booking-readiness-650','.help-signal-650','max-width:720px','prefers-reduced-motion'])assert.ok(css.includes(selector),'Accessible design '+selector);
assert.match(html,/\/assets\/build650-booking-guidance\.css\?v=build650/);
assert.match(read('scripts/current_booking_wizard_regression.sh'),/node scripts\/build650_booking_readiness_test\.mjs/);
console.log('Build 650 booking guidance and readiness: PASS');
