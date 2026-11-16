import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {schedulePreview896,requestedOccupancy896,catalogTerritory896} from '../functions/api/_lib/scheduling-preview-v896.js';
const date='2026-11-04',nowMs=Date.parse('2026-11-01T14:00:00Z');
const ownerServiceAreas=[
  {value:'Tillsonburg, ON',label:'Tillsonburg, ON',county:'Oxford County',zone:'Tillsonburg',travel_tier:'urban'},
  {value:'Other Norfolk County location',county:'Norfolk County',travel_tier:'quote_required'}
];
const pending=(id,start_slot,duration_slots=1,status='pending')=>
 ({id,start_slot,duration_slots,status,job_status:'scheduled',created_at:'2020-01-01T00:00:00Z'});
const review=(rest={})=>schedulePreview896({
  date,nowMs,startSlot:'AM',durationSlots:1,serviceArea:'Tillsonburg, ON',
  ownerServiceAreas, ...rest
});
test('slot design permits one vehicle daily or explicitly two independent half-days',()=>{
 assert.deepEqual(requestedOccupancy896('AM',2).slots,['AM','PM']);
 assert.deepEqual(requestedOccupancy896('FULL',null).slots,['AM','PM']);
 assert.deepEqual(requestedOccupancy896('PM',1).slots,['PM']);
 for(const [s,d] of [['PM',2],['AM',0],['FULL',1],['NOPE',1]])
  assert.equal(requestedOccupancy896(s,d),null);
 assert.equal(review({bookings:[pending('first','AM',2)],startSlot:'PM'}).capacity.requested_fit,false);
 assert.equal(review({bookings:[pending('first','AM',1)],startSlot:'PM'}).capacity.requested_fit,true);
 assert.equal(review({bookings:[pending('first','AM',1),pending('second','PM',1)],startSlot:'AM',durationSlots:2}).capacity.requested_fit,false);
 assert.equal(review({bookings:[pending('first','AM',1)]}).capacity.requested_fit,false);
 assert.equal(review({bookings:[pending('first','AM',1,'cancelled')]}).capacity.requested_fit,true);
 assert.equal(review({bookings:[pending('first','AM',1)],excludeBookingId:'first'}).capacity.requested_fit,true);
});
test('unapproved location and owner-quote territories never authorize dispatch',()=>{
 assert.equal(catalogTerritory896('unknown',ownerServiceAreas).recognized,false);
 assert.equal(catalogTerritory896('Other Norfolk County location',ownerServiceAreas).auto_travel_eligible,false);
 assert.equal(review({serviceArea:'unknown'}).dispatch_ready,false);
 assert.equal(review({serviceArea:'Other Norfolk County location',staffingVerified:true,
  staffingWindows:{AM:true},worksiteVerified:true}).dispatch_ready,false);
 assert.equal(review().territory.auto_travel_eligible,true);
});
test('worker, site, blocked date, pending hold and unverified availability are fail-closed',()=>{
 const base=review();
 assert.equal(base.capacity.requested_fit,true);
 assert.equal(base.dispatch_ready,false);
 assert.ok(base.review_reasons.includes('STAFF_ASSIGNMENT_UNVERIFIED'));
 assert.ok(base.review_reasons.includes('WORKSITE_NOT_VERIFIED'));
 const ready=review({staffingVerified:true,staffingWindows:{AM:true,PM:false},worksiteVerified:true});
 assert.equal(ready.dispatch_ready,true,'SIMULATED approved scenario only');
 assert.equal(review({staffingVerified:true,staffingWindows:{AM:false},worksiteVerified:true}).dispatch_ready,false);
 assert.equal(review({dateBlocks:[{blocked_date:date}],staffingVerified:true,
  staffingWindows:{AM:true},worksiteVerified:true}).dispatch_ready,false);
 assert.equal(review({slotBlocks:[{slot:'AM'}],staffingVerified:true,
  staffingWindows:{AM:true},worksiteVerified:true}).dispatch_ready,false);
 assert.equal(review({bookings:[pending('hold','AM')],staffingVerified:true,
  staffingWindows:{AM:true},worksiteVerified:true}).dispatch_ready,false);
 assert.equal(review({date:'garbage'}).ok,false);
});
test('production admin preview is additive, staff-authenticated and never writes bookings',()=>{
 const source=readFileSync(new URL('../functions/api/admin/booking_availability.js',import.meta.url),'utf8');
 assert.match(source,/requireStaffAccess\(/);
 assert.match(source,/capability: "manage_bookings"/);
 assert.match(source,/planning_896:planning896/);
 assert.match(source,/loadPricingCatalog\(env\)/);
 assert.match(source,/staffingVerified:false,staffingWindows:null,worksiteVerified:false/);
 assert.doesNotMatch(source,/method:\s*["'](?:POST|PATCH|PUT|DELETE)["']/);
 const ddl=readFileSync(new URL('../supabase/migrations/20261101190000_build738_one_car_capacity_and_owner_exceptions.sql',import.meta.url),'utf8');
 assert.match(ddl,/pg_advisory_xact_lock\(/);
 assert.match(ddl,/RAISE EXCEPTION[\s\S]*?ERRCODE = '23505'/);
});
