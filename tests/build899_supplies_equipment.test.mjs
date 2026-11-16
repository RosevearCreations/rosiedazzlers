import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {LIMITS899,normalizeReview899,projectSupplies899} from '../assets/build899-supplies-equipment.mjs';
const tool='5fd62295-1f83-4507-bf6f-bd5e1abb9fed',stock='166cd852-784d-4244-a793-3dde8d273348';
const rid='e97e48bf-4571-4e48-973f-285edda643ca',po='0a84b1d8-8a98-45dc-b5c1-3eaabce7b0cd';
const ct='d7aa9520-5108-441d-bb69-45cd854e5ca0',sv='8a35d3a2-1a5c-4aa0-8f6a-3d67304650ce';
const now=new Date('2026-11-16T17:00:00Z');
const serviceInput=()=>({kind:'service',client_request_id:rid,inventory_item_id:tool,event_kind:'planned',
 service_type:'inspection',review_date:'2026-11-27',staff_note:'Inspect hoses, guards and secure connections.'});
const countInput=()=>({kind:'count',client_request_id:rid,inventory_item_id:stock,review_kind:'cycle_count',
 observed_qty:'1.250',review_date:'2026-11-16',staff_note:'Original sealed container count.'});
const fixture=()=>({
 items:[
  {id:tool,name:'Original polisher',is_active:true,item_type:'tool',qty_on_hand:'1',reorder_point:'0',unit_label:'unit',assigned_station:'garage'},
  {id:stock,name:'Polishing compound',is_active:true,item_type:'consumable',qty_on_hand:'1.500',reorder_point:'2',unit_label:'tub',assigned_station:'shelf'}
 ],
 purchaseOrders:[{id:po,item_id:stock,status:'ordered',qty_ordered:'2',ordered_at:'2026-11-15T10:00:00Z'}],
 movements:[{id:ct,item_id:stock,movement_type:'job_use',qty_delta:'-0.5',is_reversed:false,created_at:'2026-11-15T10:00:00Z'}],
 service:[{id:sv,inventory_item_id:tool,event_kind:'planned',service_type:'inspection',due_date:'2026-11-27',
  recorded_at:'2026-11-16T10:00:00Z',staff_report_unverified:true,owner_verified:false}],
 counts:[{id:rid,inventory_item_id:stock,review_kind:'cycle_count',observed_qty:'1.250',
  catalog_qty_snapshot:'1.500',observed_on:'2026-11-16',recorded_at:'2026-11-16T12:00:00Z',owner_approved:false}]
});
test('source-bound strict maintenance forms reject unknown and client-authorized claims',()=>{
 const s=normalizeReview899(serviceInput(),now);
 assert.equal(s.ok,true);assert.equal(s.service_type,'inspection');assert.equal(s.event_kind,'planned');
 for(const patch of [
  {...serviceInput(),inventory_item_id:'fake'},
  {...serviceInput(),owner_verified:true},
  {...serviceInput(),service_type:'replace_stock'},
  {...serviceInput(),review_date:'2027-12-31'},
  {...serviceInput(),staff_note:'x'},
  {...serviceInput(),event_kind:'staff_reported',review_date:'2026-12-01'}
 ])assert.equal(normalizeReview899(patch,now).ok,false);
});
test('staff count stores fractional qty for review but not stock adjustment',()=>{
 const c=normalizeReview899(countInput(),now);
 assert.equal(c.ok,true);assert.equal(c.observed_qty,'1.250');
 for(const x of [
  {...countInput(),observed_qty:'-1'},
  {...countInput(),observed_qty:'1.0001'},
  {...countInput(),stock_adjustment_applied:true},
  {...countInput(),review_date:'2026-11-20'}
 ])assert.equal(normalizeReview899(x,now).ok,false);
});
test('low stock and open PO status are independent of supplier receipt',()=>{
 const s=projectSupplies899({...fixture(),now});
 assert.equal(s.summary.tools,1);assert.equal(s.summary.consumables,1);
 assert.equal(s.summary.low_stock,1);assert.equal(s.summary.reorder_review_needed,0);
 assert.equal(s.items.find(x=>x.id===stock).supplier_order_verified,false);
 assert.equal(s.authority.automatic_purchase,false);assert.equal(s.authority.stock_updated,false);
 assert.equal(s.original_movements_sampled,1);
});
test('scheduled inspection, physical count variance and non-owner signoff remain HOLD',()=>{
 const s=projectSupplies899({...fixture(),now});
 assert.equal(s.summary.service_due_soon,1);
 assert.equal(s.summary.tool_schedule_review,0);
 assert.equal(s.summary.count_variance_review,1);
 assert.equal(s.items.find(x=>x.id===stock).latest_count_review.variance_qty,'-0.250');
 assert.equal(s.authority.owner_approval,false);
 assert.equal(s.authority.physical_service_not_independently_verified,true);
 assert.equal(s.service_events[0].owner_verified,false);
});
test('unscheduled original tool queues review, not a fabricated unsafe maintenance finding',()=>{
 const f=fixture();f.service=[];
 const s=projectSupplies899({...f,now});
 assert.equal(s.summary.tool_schedule_review,1);assert.equal(s.summary.service_due_soon,0);
});
test('missing or malformed original sources fail closed',()=>{
 const f=fixture();f.items[0].qty_on_hand='NaN';
 assert.throws(()=>projectSupplies899({...f,now}),/quantity/);
 const g=fixture();g.items.push({...g.items[0]});
 assert.throws(()=>projectSupplies899({...g,now}),/duplicate/);
 assert.throws(()=>projectSupplies899({items:new Array(LIMITS899.items+1).fill({id:tool}),now}),/bounded/);
});
test('private database migration restricts client grants and forbids mutation/owner proof',()=>{
 const m=readFileSync(new URL('../supabase/migrations/20261116225000_build899_private_inventory_equipment_review.sql',import.meta.url),'utf8');
 assert.match(m,/enable row level security/g);assert.match(m,/from public, anon, authenticated/);
 assert.match(m,/grant select,insert .* to service_role/);
 assert.match(m,/check \(not owner_verified\)/);
 assert.match(m,/check \(not stock_adjustment_applied\)/);
 assert.doesNotMatch(m,/grant .* to authenticated/);
 const g=readFileSync(new URL('../supabase/migrations/20261116231000_build899_immutable_staff_evidence_guard.sql',import.meta.url),'utf8');
 assert.match(g,/before update or delete/g);
 assert.match(g,/before truncate/g);
 assert.match(g,/rosie899_reject_record_mutation/g);
});
test('private signed supervisor session and same-origin state-changing route',()=>{
 const a=readFileSync(new URL('../functions/api/admin/supplies_equipment_v899.js',import.meta.url),'utf8');
 assert.match(a,/allowLegacyAdminFallback:false/);
 assert.match(a,/auth_mode!=='session'/);assert.match(a,/sameOrigin811/);
 assert.match(a,/operations\.assignment\.manage/);
 assert.match(a,/client_request_id=eq\./);
 assert.match(a,/stock_adjusted:false/);
 assert.doesNotMatch(a,/api\.stripe\.com|method:'PATCH'|method:'DELETE'/);
 const page=readFileSync(new URL('../admin-supplies-equipment.html',import.meta.url),'utf8');
 assert.match(page,/data-build899/);assert.match(page,/OWNER EVIDENCE HOLD/);
});
