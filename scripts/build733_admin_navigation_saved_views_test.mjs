import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const nav = require('../assets/admin-navigation-v733.js');
const page = readFileSync('admin.html','utf8');
const route = readFileSync('admin/index.html','utf8');
const css = readFileSync('assets/admin-navigation-v733.css','utf8');
const js = readFileSync('assets/admin-navigation-v733.js','utf8');
const operator = readFileSync('assets/build648-admin-operator.js','utf8');
const cards = readFileSync('assets/admin-command-centre-v732.js','utf8');

assert.equal(page,route,'Root and folder Admin route must match exactly');
for(const name of ['adminNavigation733','adminProfileSelect733','adminProfileName733','adminDensity733','adminFavoritesOnly733','adminSaveProfile733','adminResetView733','adminDeleteProfile733','adminExportViews733','adminOpenPalette733','adminOpenHelp733','adminPalette733','adminPaletteSearch733','adminPaletteResults733','adminHelp733','adminNavigationStatus733']) {
  assert.ok(page.includes(`id="${name}"`),`Missing UI ${name}`);
}
assert.ok(page.includes('RosieAdminNavigation733.mount({actor,auth})'));
assert.ok(page.includes('pageKey: \'admin\''),'Staff auth gate must remain');
assert.ok(existsSync('assets/admin-navigation-v733.css'));
assert.ok(/data-close-dialog733/.test(page));
assert.ok(/aria-labelledby="adminPaletteTitle733"/.test(page));
assert.ok(/aria-controls="adminPaletteResults733"/.test(page));
assert.ok(/aria-pressed="false"/.test(page));

const auth = { canAccessPage: key => ['admin','admin-today','admin-booking','admin-workflow','app-operations'].includes(key) };
assert.equal(nav.routeKey('/admin.html'),'admin');
assert.equal(nav.routeKey('/admin/'),'admin');
assert.equal(nav.routeKey('/admin-booking.html'),'admin-booking');
assert.equal(nav.routeKey('/admin-today.html#week'),'admin-today');
assert.equal(nav.routeKey('/app/operations/'),'app-operations');
assert.equal(nav.routeKey('https://evil.example/admin.html'),null);
assert.equal(nav.routeKey('//evil.example'),null);
assert.equal(nav.routeKey('/admin-payments.html?token=secret'),null);
assert.equal(nav.routeAllowed('/admin-booking.html',auth),true);
assert.equal(nav.routeAllowed('/admin-payments.html',auth),false);
assert.equal(nav.routeAllowed('/admin-booking.html',null),false);
assert.equal(nav.routeAllowed('/admin-booking.html',{canAccessPage:()=>false}),false);
assert.equal(nav.routeAllowed('/admin-workflow.html',{canAccessPage:()=>true}),true);
assert.equal(nav.routeAllowed('/app/operations/',auth),true);
assert.equal(nav.routeAllowed('/admin-unknown.html',{canAccessPage:()=>false}),false);

const clean = nav.cleanLayout({category:'finance',cardFilter:'attention',density:'compact',favoritesOnly:true,
  favorites:['/admin-payments.html','/admin-payments.html','https://evil.example','/admin-booking.html','/admin-booking.html?secret'],
  order:['it','finance','it','bookings','unexpected']});
assert.deepEqual(clean,{category:'finance',cardFilter:'attention',density:'compact',favoritesOnly:true,favorites:['/admin-payments.html','/admin-booking.html'],order:['it','finance','bookings','operations','staff','marketing']});
assert.deepEqual(nav.cleanLayout(null).order,['bookings','operations','finance','staff','marketing','it']);
assert.equal(nav.cleanLayout({density:'script:alert(1)',category:'unknown',cardFilter:'bad'}).density,'comfortable');

const input = {profiles:[
  {name:' Morning ',layout:{density:'compact',favorites:['/admin-booking.html']}},
  {name:'morning',layout:{density:'comfortable'}},
  {name:'Second',layout:{order:['it','finance']}},
  {name:'',layout:{}},
  ...Array.from({length:12},(_,i)=>({name:'Profile '+i,layout:{}}))
],selected:'Morning',current:{category:'media',favorites:['/admin-security.html']}};
const output = nav.cleanStored(input);
assert.equal(output.profiles.length,8,'Saved profiles must be bounded');
assert.deepEqual(output.profiles.slice(0,2).map(x=>x.name),['Morning','Second']);
assert.equal(output.selected,'Morning');
assert.equal(output.current.category,'media');
assert.equal(nav.cleanStored({profiles:'bad',selected:'secret'}).selected,'');
assert.equal(nav.scope(null),null);
assert.equal(nav.scope({role_code:'admin'}),null,'Never cross-save across anonymous accounts');
assert.match(nav.scope({id:'staff-a',role_code:'admin'}),/^rosie_admin_views_v733_[0-9a-f]+_admin$/);
assert.notEqual(nav.scope({id:'staff-a',role_code:'admin'}),nav.scope({id:'staff-b',role_code:'admin'}));

for(const needle of ['Ctrl/⌘ K','Alt+Shift+F','aria-live="polite"','ⓘ','Saved view','Export saved views','keyboard']) assert.ok(page.includes(needle),needle);
for(const needle of ['showModal','aria-activedescendant','ArrowDown','ArrowUp','Escape','Enter','keydown','role','aria-expanded','aria-controls','textContent','localStorage','encodeURIComponent','download','aria-pressed']) assert.ok(js.includes(needle),needle);
assert.ok(!/fetch\(|setInterval\(|navigator\.sendBeacon|eval\(/.test(js),'No data API, mutation, polling, or dynamic code evaluation');
assert.ok(!/sessionStorage|localStorage/.test(page),'No inline browser persistence');
assert.ok(js.includes('Never persist a potentially private free-text search'));
assert.ok(js.includes('routeAllowed(href, auth)'));
assert.ok(operator.includes('rosie:admin-filter-733'),'Existing tool filter must share favorite-only policy');
assert.ok(cards.includes('favoriteHidden733'),'Build 732 status filter must share favorite-only policy');

for(const needle of ['@media(max-width:720px)','@media(max-width:370px)',':focus-visible','min-height:44px','max-height:88dvh','overflow:auto','[hidden]']) assert.ok(css.includes(needle),needle);
console.log('Build 733 PASS — role-safe navigator, local allowlisted saved views, bounded favorites, reset/export, keyboard/dialog contracts, contextual help, responsive/focus and Admin route parity.');
