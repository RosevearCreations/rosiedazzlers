import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('book.html');
assert.equal(html,read('book/index.html'),'Booking alias and clean route must be byte-identical');
for(const id of ['packageSearch649','packageGoal649','resetPackageFilters649','packageFilterStatus649','addonSearch649','resetAddonFilter649','addonFilterStatus649']){
  assert.ok(html.includes('id="'+id+'"'),'Missing usable booking discovery control '+id);
}
for(const id of ['packageGrid','addonGrid','bookingPlannerFrame','applyToPlannerBtn','summarySubtotal','packageCompareTable629']){
  assert.ok(html.includes('id="'+id+'"'),'Preserve existing booking contract '+id);
}
assert.match(html,/function filterPackages649\(\)/);
assert.match(html,/function filterAddons649\(\)/);
assert.match(html,/card\.hidden=/,'Do not delete catalog options when filtering');
assert.match(html,/const row=\(state\.catalog\?\.packages\|\|\[\]\)/,'Search the live catalog, not hard-coded prices');
assert.match(html,/const row=\(state\.catalog\?\.addons\|\|\[\]\)/,'Search actual add-ons');
assert.match(html,/qs\("#packageSearch649"\)\.value="";qs\("#packageGoal649"\)\.value="all";filterPackages649\(\);/,'Compare-to-select must clear filters');
assert.match(html,/state\.plannerTouched && !force/,'Never reset a touched booking planner silently');
assert.match(html,/window\.AdminShell|window\.AdminAuth|loadPricingCatalogClient|loadPlanner\(true\)/,'Keep live auth/catalog/planner linkage');
assert.match(html,/aria-live="polite"/,'Search status accessible');
const css=read('assets/build649-booking-discovery.css');
for(const key of ['.booking-discovery-649','.addon-discovery-649','.package-grid>.package-card[hidden]','.addon-grid>.addon-card[hidden]','720px'])assert.ok(css.includes(key),'Missing mobile/filtered CSS '+key);
assert.match(html,/\/assets\/build649-booking-discovery\.css\?v=build649/);
assert.match(read('scripts/current_booking_wizard_regression.sh'),/node scripts\/build649_booking_discovery_test\.mjs/);
console.log('Build 649 live booking discovery: PASS');
