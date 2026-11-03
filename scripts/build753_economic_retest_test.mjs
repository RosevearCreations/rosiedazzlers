import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compareEconomicRetests753,reviewOwnerReceipt753} from '../assets/economic-retest-v753-core.js';
import {onRequestGet,onRequestPost,onRequestPut,onRequestPatch,onRequestDelete} from '../functions/api/admin/economic_retest_v753.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',batch='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const oldHash='a'.repeat(64),newHash='b'.repeat(64);
const row={booking_id:id,package_code:'basic_detail',vehicle_size:'mid',season_bucket:'shoulder_calendar',
  recorded_revenue_cents:26900,starting_guide_cents:26900,managed_guide_cents:26900,managed_price_status:'explicit_managed_price',
  pre_travel_contribution_cents:null,decision_gate:'source_repair_required',ledger_batch_ids:[batch]};
const before={ok:true,build:753,source_build:752,period:{month:11,year:2026},read_id:'first-read',read_at:'2026-11-03T00:00:00.000Z',snapshot_sha256:oldHash,
  managed_catalog_status:'managed',rows:[row],exceptions:[{booking_id:id,code:'finance',reason:'Material cost not reconciled.'}]};
const after={...before,read_id:'second-read',read_at:'2026-11-03T00:05:00.000Z',snapshot_sha256:newHash,
  rows:[{...row,pre_travel_contribution_cents:20000,decision_gate:'owner_review_candidate'}],exceptions:[]};
const compare=compareEconomicRetests753(before,after);
assert.equal(compare.comparison_status,'source_snapshot_changed');
assert.equal(compare.rows[0].retest_disposition,'disappeared_gap_needs_source_proof');
assert.equal(compare.rows[0].disappeared_issues.length,1);
assert.equal(compare.summary.disappeared_gap_candidates,1);
assert.equal(compare.summary.exceptions_closed,0);
assert.equal(compare.rows[0].source_correction_verified,false);
assert.equal(compare.rows[0].explicit_hold,true);
assert.equal(compare.boundaries.winter_availability_hold_retained,true);

const unchanged=compareEconomicRetests753(before,{...before,read_id:'other-read',read_at:after.read_at});
assert.equal(unchanged.comparison_status,'same_source_snapshot');
assert.equal(unchanged.rows[0].retest_disposition,'retained_hold');
const emerged=compareEconomicRetests753({...before,exceptions:[]},{...after,exceptions:[{booking_id:id,code:'inventory',reason:'Original ledger missing'}]});
assert.equal(emerged.rows[0].retest_disposition,'new_exception_review');
const changedCost=compareEconomicRetests753(before,{...after,rows:[{...after.rows[0],ledger_batch_ids:['different-batch']} ]});
assert.ok(changedCost.rows[0].changed_fields.includes('ledger_batch_ids'));
const joined=compareEconomicRetests753(before,{...after,rows:[]});
assert.equal(joined.rows[0].retest_disposition,'membership_change_review');
const changedCatalog=compareEconomicRetests753(before,{...after,managed_catalog_status:'absent'});
assert.equal(changedCatalog.rows[0].global_provenance_changed,true);

assert.throws(()=>compareEconomicRetests753(before,{...after,read_id:before.read_id}),/distinct/);
assert.throws(()=>compareEconomicRetests753(before,{...after,read_at:before.read_at}),/later/);
assert.throws(()=>compareEconomicRetests753(before,{...after,period:{year:2026,month:10}}),/period/);
assert.throws(()=>compareEconomicRetests753(before,{...after,snapshot_sha256:'invalid'}),/SHA-256/);
assert.throws(()=>compareEconomicRetests753(before,{...after,rows:[...after.rows,after.rows[0]]}),/Duplicate/);

const receipt={schema:'rosie-economic-approval-receipt-v1',booking_id:id,baseline_snapshot_sha256:oldHash,retest_snapshot_sha256:newHash,
  receipt_reference:'owner-receipt-123',issuer_reference:'verified-owner-ref',issued_at:'2026-11-03T00:04:00Z',proposed_disposition:'owner_review_requested'};
const verdict=reviewOwnerReceipt753(receipt,compare,id);
assert.equal(verdict.status,'metadata_matches_authentication_missing');
assert.equal(verdict.authenticated,false);assert.equal(verdict.owner_approved,false);assert.equal(verdict.closure_allowed,false);
assert.equal(reviewOwnerReceipt753({...receipt,baseline_snapshot_sha256:'c'.repeat(64)},compare,id).status,'receipt_metadata_mismatch');
assert.equal(reviewOwnerReceipt753({...receipt,booking_id:'else'},compare,id).status,'receipt_metadata_mismatch');
assert.equal(reviewOwnerReceipt753(null,compare,id).status,'missing_receipt');

// Reject anonymous source access before any cost/pricing fetch. All writes return 405.
let calls=0;const nativeFetch=globalThis.fetch;
globalThis.fetch=async()=>{calls++;throw Error('Unauthorized private read');};
try{const result=await onRequestGet({request:new Request('https://rosiedazzlers.ca/api/admin/economic_retest_v753?month=11&year=2026'),
  env:{SUPABASE_URL:'https://invalid.example',SUPABASE_SERVICE_ROLE_KEY:'test-only'}});
  assert.ok(result.status>=400);assert.equal(calls,0);
}finally{globalThis.fetch=nativeFetch;}
for(const fn of [onRequestPost,onRequestPut,onRequestPatch,onRequestDelete])assert.equal((await fn()).status,405);

for(const stem of ['admin-economic-retest-v753','admin-economic-acceptance-v752','admin-catalog'])
  assert.equal(read(stem+'.html'),read(stem+'/index.html'),`${stem} route parity`);
assert.match(read('admin-economic-acceptance-v752.html'),/admin-economic-retest-v753\.html/);
assert.match(read('admin-catalog.html'),/admin-economic-retest-v753\.html/);
assert.match(read('assets/economic-retest-v753.js'),/cache:'no-store'/);
assert.match(read('assets/economic-retest-v753.js'),/UNVERIFIED_NOT_APPROVED/);
assert.match(read('functions/api/admin/economic_retest_v753.js'),/ownerEvidenceGet/);
assert.match(read('functions/api/admin/economic_retest_v753.js'),/return reject\(\)/);
console.log('Build 753 PASS: distinct source reads, drift/disappeared-gap HOLD, receipt metadata cannot authenticate, no source writes, private auth and route parity.');
