import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildEconomicAcceptance752} from '../functions/api/_lib/economic-acceptance-v752.js';
import {onRequestGet,onRequestPost,onRequestPut,onRequestPatch,onRequestDelete} from '../functions/api/admin/economic_acceptance_v752.js';

const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const margin={build:751,period:{year:2026,month:11},generated_at:'2026-11-03T00:00:00.000Z',rows:[{
  booking_id:id,package_code:'basic_detail',vehicle_size:'mid',season_bucket:'shoulder_calendar',
  current_starting_price_cents:26900,recognized_revenue_cents:22500,pre_travel_contribution_cents:16700,
  margin_review_status:'review_ready',review_reasons:[],ledger_batch_ids:['posting-one']}]};
const catalog={packages:[{code:'basic_detail',prices_cad:{small:229,mid:269,oversize:309}}]};
const input={margin,managed_catalog:catalog,managed_catalog_status:'managed',snapshot_sha256:'a'.repeat(64)};

const clear=buildEconomicAcceptance752(input);
assert.equal(clear.build,752);
assert.equal(clear.summary.owner_review_candidates,1);
assert.equal(clear.summary.pricing_exception_count,0,'lower realized revenue is not automatically a pricing exception');
assert.equal(clear.rows[0].recorded_revenue_below_guide_is_pricing_error,false);
assert.equal(clear.rows[0].pre_travel_contribution_cents,16700);
assert.equal(clear.rows[0].owner_acceptance,'not_recorded');
assert.equal(clear.boundaries.owner_approval_recorded,false);
assert.equal(clear.boundaries.inventory_or_accounting_write,false);
assert.equal(clear.boundaries.winter_availability_hold_retained,true);
assert.equal(clear.boundaries.snapshot_hash_is_not_an_attestation,true);

const badPrice=buildEconomicAcceptance752({...input,managed_catalog:{packages:[{code:'basic_detail',prices_cad:{small:229,mid:299,oversize:309}}]}});
assert.ok(badPrice.summary.pricing_exception_count>=2);
assert.equal(badPrice.rows[0].decision_gate,'source_repair_required');
assert.equal(badPrice.rows[0].pre_travel_contribution_cents,null,'unresolved price source must suppress qualified contribution');
assert.ok(badPrice.exceptions.some(x=>x.code==='owner_basic_detail_price_conflict'));
assert.ok(badPrice.exceptions.filter(x=>x.domain==='pricing').every(x=>x.source_href==='/admin-catalog.html'));

const missingManaged=buildEconomicAcceptance752({...input,managed_catalog:null,managed_catalog_status:'absent'});
assert.ok(missingManaged.exceptions.some(x=>x.code==='managed_catalog_unverified'));
assert.equal(missingManaged.summary.owner_review_candidates,0,'bundled fallback cannot silently clear price provenance');

const sourceGap=buildEconomicAcceptance752({...input,margin:{...margin,rows:[{...margin.rows[0],margin_review_status:'review',review_reasons:[
  'Material cost does not reconcile to the posting-time ledger.',
  'No source-linked travel-time punches; travel labour cost is unknown.',
  'Vehicle size differs between booking and accounting; owner review required.']} ]}});
assert.equal(sourceGap.summary.source_repair_booking_count,1);
assert.ok(sourceGap.exceptions.some(x=>x.code==='finance'&&x.source_href==='/admin-accounting.html'));
assert.ok(sourceGap.exceptions.some(x=>x.code==='travel_time'&&x.source_href==='/admin-payroll.html'));
assert.ok(sourceGap.exceptions.some(x=>x.code==='package_size'&&x.source_href==='/admin-booking.html'));

const empty=buildEconomicAcceptance752({...input,margin:{...margin,rows:[]}});
assert.equal(empty.evidence_status,'no_observations');assert.equal(empty.summary.owner_accepted_count,0);
assert.throws(()=>buildEconomicAcceptance752({margin:{build:751,rows:[]}}),/source snapshot/);

// Anonymous GET must fail before any cost/pricing table read; all mutations reject.
let calls=0;const originalFetch=globalThis.fetch;
globalThis.fetch=async()=>{calls++;throw Error('Unauthorized data read attempted');};
try{
  const res=await onRequestGet({request:new Request('https://rosiedazzlers.ca/api/admin/economic_acceptance_v752?month=11&year=2026'),env:{SUPABASE_URL:'https://invalid.example',SUPABASE_SERVICE_ROLE_KEY:'test-only'}});
  assert.ok(res.status>=400);assert.equal(calls,0);
}finally{globalThis.fetch=originalFetch;}
for(const method of [onRequestPost,onRequestPut,onRequestPatch,onRequestDelete])assert.equal((await method()).status,405);

assert.equal(source('admin-economic-acceptance-v752.html'),source('admin-economic-acceptance-v752/index.html'));
assert.equal(source('admin-margin-review-v751.html'),source('admin-margin-review-v751/index.html'));
assert.equal(source('admin-catalog.html'),source('admin-catalog/index.html'));
assert.match(source('admin-catalog.html'),/admin-economic-acceptance-v752\.html/);
assert.match(source('admin-margin-review-v751.html'),/admin-economic-acceptance-v752\.html/);
assert.match(source('assets/economic-acceptance-v752.js'),/UNSIGNED_NOT_SUBMITTED/);
assert.match(source('functions/api/admin/economic_acceptance_v752.js'),/marginReviewGet/);
assert.match(source('functions/api/admin/economic_acceptance_v752.js'),/app_management_settings/);
assert.match(source('functions/api/admin/economic_acceptance_v752.js'),/SHA-256/);
assert.doesNotMatch(source('assets/economic-acceptance-v752.js'),/fetch\([^\n]*method:\s*['"](?:POST|PUT|PATCH|DELETE)/i);
console.log('Build 752 PASS: read-only owner candidates, managed-source pricing exceptions, manual repair routes, private unsigned drafts, source holds, auth and route parity.');
