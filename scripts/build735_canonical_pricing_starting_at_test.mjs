import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { PRICING } from '../assets/config.js';
import { applyCommercialAccuracy } from '../functions/api/_lib/commercial-accuracy.js';
import { OWNER_BASIC_DETAIL_SCHEDULE_735, buildPricingSourceParity614 } from '../functions/api/_lib/pricing-source-parity-614.js';

const read = path => readFileSync(new URL('../'+path, import.meta.url),'utf8');
const catalog = JSON.parse(read('data/rosie_services_pricing_and_packages.json'));
const fallback = JSON.parse(read('functions/api/data/rosie_services_pricing_and_packages.json'));
const approved = { small:229, mid:269, oversize:309 };
assert.deepEqual(OWNER_BASIC_DETAIL_SCHEDULE_735,approved,'Existing owner-approved three-size schedule');
assert.deepEqual(catalog,fallback,'Bundled/public and server fallback source parity');
assert.deepEqual(catalog.packages.find(row=>row.code==='basic_detail')?.prices_cad,approved);
assert.deepEqual(applyCommercialAccuracy(catalog).package_map.basic_detail.prices_cad,approved);
for(const [size,amount] of Object.entries(approved)) assert.equal(PRICING.basic_detail[size],amount*100,`Unused legacy config must not resurrect old ${size} price`);

// No reapproval for the unchanged, previously approved Basic Detail schedule.
const identical = buildPricingSourceParity614({bundled:catalog,appManagement:catalog,checkoutCatalog:catalog,dbAvailable:true,updatedAt:'2026-11-01T00:00:00Z'});
assert.equal(identical.owner_basic_detail_735.approval,'existing_owner_approved_build624');
assert.equal(identical.owner_basic_detail_735.starting_price_label,'Starting at:');
assert.equal(identical.owner_basic_detail_735.all_sources_verified,true);
assert.deepEqual(identical.owner_basic_detail_735.rows.map(row=>[row.size,row.approved_cad,row.status]),[
  ['small',229,'verified'],['mid',269,'verified'],['oversize',309,'verified']
]);
assert.equal(identical.findings.filter(row=>row.group==='packages'&&row.code==='basic_detail').length,0,'Unchanged Basic schedule must not create a new approval finding');
const stale = structuredClone(catalog);
stale.packages.find(row=>row.code==='basic_detail').prices_cad = {small:115,mid:135,oversize:170};
const mismatch = buildPricingSourceParity614({bundled:catalog,appManagement:stale,checkoutCatalog:stale,dbAvailable:true});
assert.deepEqual(mismatch.owner_basic_detail_735.rows.map(row=>row.status),Array(3).fill('review_required'));
assert.equal(mismatch.summary.owner_decision_required,true);
for(const row of mismatch.owner_basic_detail_735.rows){
  assert.ok(row.differences.includes('app_management'));
  assert.ok(row.differences.includes('checkout'));
  assert.ok(row.differences.includes('public_api'));
}
assert.deepEqual(catalog.packages.find(row=>row.code==='basic_detail')?.prices_cad,approved,'Comparator never writes an approved price');
const unavailable = buildPricingSourceParity614({bundled:catalog,checkoutCatalog:catalog,warning:'Database unavailable'});
assert.equal(unavailable.owner_basic_detail_735.all_sources_verified,false);
assert.deepEqual(unavailable.owner_basic_detail_735.rows.map(row=>row.status),Array(3).fill('db_unverified'));

const book = read('book.html');
const planner = read('booking-planner.html');
const admin = read('admin.html');
assert.equal(book,read('book/index.html'),'Canonical public booking route copies remain identical');
assert.equal(admin,read('admin/index.html'),'Protected Admin route copies remain identical');
assert.match(book,/const sizes = \[\["small","Small"\],\["mid","Mid"\],\["oversize","Large"\]\]/);
assert.match(book,/class="price-start">Starting at:/);
assert.match(book,/Number\.isFinite\(price\)&&price>0/);
assert.doesNotMatch(book,/money\(packagePrice\(pkg,key\)\|\|0\)/,'No invented zero-dollar service price');
assert.match(book,/Package starting price/);
assert.match(book,/Starting at: \$\{n\(col\.price_cents\)\}/);
assert.match(book,/Starting at: \$\{money\(amount\)\} · quote required/);
assert.match(book,/before HST/);
assert.match(book,/pricing-catalog-client-legacy\.js\?v=20261101build735/,'Public booking must load updated pricing module, not cached legacy copy');
assert.match(planner,/Starting at: \$\{money\(price\)\}/);
assert.match(planner,/Starting at: \$\{money\(amount\)\}/);
assert.match(planner,/pricing-catalog-client\.js\?v=20261101build735/,'Planner must load current catalog module');
assert.match(read('assets/pricing-catalog-client.js'),/pricing-catalog-client-legacy\.js\?v=20261101build735/);
assert.match(read('assets/landing-page.js'),/landing-page-build388\.js\?v=20261101build735/);
assert.match(admin,/data-build735-owner-schedule="read-only"/);
assert.match(admin,/Existing owner-approved Basic Detail schedule/);
assert.match(admin,/SOURCE VERIFICATION \/ PRICE EXCEPTION REVIEW/);

for(const asset of ['assets/site.js','assets/pricing-catalog-client-legacy.js','assets/landing-page-build388.js']) {
  const source=read(asset);
  assert.match(source,/Starting at: \$\{money\(/,`${asset} must show starting price wording`);
  assert.doesNotMatch(source,/`From \$\{money\(/,`${asset} must not revert to From label`);
}
// Source chart labels communicate the starting-price nature of each vehicle tier;
// deposits and totals must continue to be exact, not advertised price ranges.
assert.match(read('assets/pricing-catalog-client-legacy.js'),/Small · Starting at:/);
assert.match(book,/Deposit \$\{money\(pkg\.deposit_cad\|\|0\)\}/);
assert.match(book,/qs\("#summaryDeposit"\)\.textContent = pkg \? money\(t\.deposit\)/);
assert.match(planner,/Deposit \$\{money\(pkg\.deposit_cad \|\| 0\)\}/);

let advertisedNumericValues=0;
let liveLandingEntrypoints=0;
function scanServiceGuides(dir='.'){
  for(const item of readdirSync(dir,{withFileTypes:true})){
    const path=`${dir}/${item.name}`;
    if(item.isDirectory()){
      if(!['.git','node_modules','.wrangler','.cache'].includes(item.name)) scanServiceGuides(path);
    } else if(item.isFile()&&item.name.endsWith('.html')){
      const markup=readFileSync(path,'utf8');
      for(const match of markup.matchAll(/<script\b[^>]*src="\/assets\/landing-page\.js\?v=([^"]+)"[^>]*>/g)){
        liveLandingEntrypoints++;
        assert.equal(match[1],'20261101build735',`Landing price summary must load updated script in ${path}`);
      }
      for(const match of markup.matchAll(/<div class="condition-price-value">([^<]+)<\/div>/g)){
        if(!/\$\d/.test(match[1]))continue;
        advertisedNumericValues++;
        assert.ok(match[1].startsWith('Starting at: '),`Advertised guide price must say Starting at: ${path} (${match[1]})`);
      }
    }
  }
}
scanServiceGuides();
assert.ok(advertisedNumericValues>=35,`Expected condition-price copy on service pages, saw ${advertisedNumericValues}`);
assert.ok(liveLandingEntrypoints>=30,`Expected refreshed landing scripts on service areas and guide pages; saw ${liveLandingEntrypoints}`);

const protectedRoute=read('functions/api/admin/pricing_source_parity_614.js');
assert.match(protectedRoute,/requireStaffAccess/);
assert.match(protectedRoute,/method: "GET"/);
assert.match(protectedRoute,/"Cache-Control", "no-store"/);
for(const method of ['Post','Put','Patch','Delete'])assert.match(protectedRoute,new RegExp(`export function onRequest${method}\\(\\) \\{ return noStore\\(methodNotAllowed\\(\\)\\)`));
console.log(`Build 735 PASS — original approved Basic Detail tiers, legacy parity, owner source reconciliation, ${advertisedNumericValues} Starting at: guide amounts, three-card public prices and exact checkout/deposit boundaries.`);
