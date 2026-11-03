import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildMarginReview751,seasonBucket751} from '../functions/api/_lib/margin-review-v751.js';
import {SHIFT_SOURCE748,SHIFT_TYPES748} from '../functions/api/_lib/shift-reconciliation-v748.js';
import {onRequestGet,onRequestPost} from '../functions/api/admin/margin_review_v751.js';

const booking='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',staff='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',batchId='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const econ={rows:[{booking_id:booking,package_code:'basic_detail',service_date:'2026-11-02',evidence_status:'ready',
  revenue_evidence_status:'ready',material_evidence_status:'ready',labor_evidence_status:'ready',cash_evidence_status:'ready',cogs_reconciliation_status:'ready',
  recognized_revenue_cad:269,recorded_material_cost_cad:3.13,estimated_direct_labor_cad:60}]};
const acct=[{booking_id:booking,package_code:'basic_detail',vehicle_size:'mid',service_date:'2026-11-02'}];
const books=[{id:booking,package_code:'basic_detail',vehicle_size:'mid',service_date:'2026-11-02',service_area_zone:'hamlet'}];
const batch={id:batchId,booking_id:booking,source_reference_id:booking,source_kind:'booking',accounting_status:'posted',status:'posted',row_count:1,created_at:'2026-11-02T11:00:00Z'};
const material={id:'one',batch_id:batchId,item_key:'shampoo',quantity:0.125,unit_cost_cents:2500,status:'posted',previous_qty:2,new_qty:1.875};
const times=[0,20,40,160].map((min,index)=>({id:`t${index}`,booking_id:booking,staff_user_id:staff,source:SHIFT_SOURCE748,
  entry_type:[SHIFT_TYPES748.clock_in,SHIFT_TYPES748.travel_start,SHIFT_TYPES748.travel_stop,SHIFT_TYPES748.clock_out][index],
  event_time:new Date(Date.UTC(2026,10,2,12,min)).toISOString()}));
const catalog={package_map:{basic_detail:{prices_cad:{small:229,mid:269,oversize:309}}},booking_rules:{travel_pricing:{hamlet:10}}};
const input={economics:econ,accounting_rows:acct,bookings:books,shift_punches:times,posting_batches:[batch],posting_rows:[material],catalog};

assert.equal(seasonBucket751('2026-12-10'),'winter_calendar');
assert.equal(seasonBucket751('2026-03-10'),'shoulder_calendar');
assert.equal(seasonBucket751('2026-07-10'),'warm_calendar');
assert.equal(seasonBucket751('2026-02-29'),'unavailable');
const result=buildMarginReview751(input),row=result.rows[0];
assert.equal(result.build,751);assert.equal(row.margin_review_status,'review_ready');
assert.equal(row.current_starting_price_cents,26900,'three-size approved Basic Detail guide remains unchanged');
assert.equal(row.current_travel_zone_guide_cents,1000,'zone reference is not billed revenue');
assert.equal(row.recognized_revenue_cents,26900,'recognized revenue is the recorded accounting amount');
assert.equal(row.recorded_material_cents,313,'original posting price preserved');
assert.equal(row.pre_travel_contribution_cents,26900-313-6000);
assert.equal(row.observed_travel_minutes,20);
assert.equal(row.full_net_margin_cents,null,'known pre-travel contribution is never net margin');
assert.equal(row.travel_labor_cost_cents,null,'punch minutes are not authorized wage expense');
assert.equal(row.season_bucket,'shoulder_calendar');
assert.equal(result.summary.package_size_cohorts[0].review_ready_contribution_cents,row.pre_travel_contribution_cents);
assert.equal(result.summary.seasonal_cohorts[0].key,'shoulder_calendar');
assert.equal(result.summary.travel_zone_cohorts[0].key,'hamlet');
assert.equal(result.boundaries.winter_availability_hold_retained,true);

const noTravel=buildMarginReview751({...input,shift_punches:[]});
assert.equal(noTravel.rows[0].margin_review_status,'review');
assert.ok(noTravel.rows[0].review_reasons.some(x=>x.includes('travel-time punches')));
assert.equal(noTravel.summary.package_size_cohorts[0].review_ready_contribution_cents,null);
const changedSize=buildMarginReview751({...input,bookings:[{...books[0],vehicle_size:'oversize'}]});
assert.ok(changedSize.rows[0].review_reasons.some(x=>x.includes('Vehicle size differs')));
const changedCost=buildMarginReview751({...input,posting_rows:[{...material,unit_cost_cents:5000}]});
assert.ok(changedCost.rows[0].review_reasons.some(x=>x.includes('Material cost does not reconcile')));
const missingPosting=buildMarginReview751({...input,posting_batches:[],posting_rows:[]});
assert.equal(missingPosting.rows[0].margin_review_status,'review');
assert.equal(missingPosting.rows[0].recorded_material_cents,null,'missing source must not become fabricated zero cost');
const reversed=buildMarginReview751({...input,posting_batches:[{...batch,status:'reversed'}]});
assert.equal(reversed.rows[0].margin_review_status,'review','reversed stock cost cannot match original unadjusted material report');
const sourceReview=buildMarginReview751({...input,economics:{rows:[{...econ.rows[0],cash_evidence_status:'review'}]}});
assert.equal(sourceReview.rows[0].margin_review_status,'review');
const winter=buildMarginReview751({...input,accounting_rows:[{...acct[0],service_date:'2026-12-02'}],bookings:[{...books[0],service_date:'2026-12-02'}],economics:{rows:[{...econ.rows[0],service_date:'2026-12-02'}]}});
assert.equal(winter.rows[0].season_bucket,'winter_calendar');assert.equal(winter.rows[0].seasonal_capability_proven,false);

// Admin GET without an authenticated session must not read any cost or customer tables.
let calls=0;const originalFetch=globalThis.fetch;globalThis.fetch=async()=>{calls++;throw Error('Unauthorized read attempted');};
try{
  const r=await onRequestGet({request:new Request('https://rosiedazzlers.ca/api/admin/margin_review_v751?month=11&year=2026'),env:{SUPABASE_URL:'https://invalid.example',SUPABASE_SERVICE_ROLE_KEY:'test-only'}});
  assert.ok(r.status>=400);assert.equal(calls,0);
}finally{globalThis.fetch=originalFetch;}
assert.equal((await onRequestPost()).status,405);
assert.equal(source('admin-margin-review-v751.html'),source('admin-margin-review-v751/index.html'));
assert.match(source('admin-catalog.html'),/admin-margin-review-v751\.html/);
assert.equal(source('admin-catalog.html'),source('admin-catalog/index.html'));
assert.match(source('assets/margin-review-v751.js'),/margin_review_v751/);
assert.match(source('admin-margin-review-v751.html'),/Hypothetical travel labour/);
assert.match(source('functions/api/admin/margin_review_v751.js'),/requireStaffAccess/);
assert.match(source('functions/api/admin/margin_review_v751.js'),/source_kind:'eq.booking'/);
assert.match(source('functions/api/admin/margin_review_v751.js'),/return readOnly\(\)/);
console.log('Build 751 PASS: canonical price guides, frozen-cost join, package/size/season/zone cohorts, unverified travel/cost holds, read-only auth and route parity.');
