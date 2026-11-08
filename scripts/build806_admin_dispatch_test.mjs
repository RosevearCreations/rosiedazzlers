import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {activeBooking806,buildDispatch806,filterDispatch806,normalizeSlot806,verifiedStaff806} from '../assets/admin-dispatch-v806.mjs';

const source=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const alice='11111111-1111-4111-8111-111111111111';
const bob='22222222-2222-4222-8222-222222222222';
const day='2026-11-09';
const booking=(id,slot,staff=alice,extra={})=>({id,service_date:day,start_slot:slot,status:'confirmed',job_status:'scheduled',
  customer_name:`Customer ${id}`,package_code:'COMPLETE',vehicle_make:'Honda',assigned_staff_user_id:staff,
  assigned_staff_name:staff===bob?'Bob':'Alice',...extra});
const first=booking('job1','AM');
const second=booking('job2','AM',alice,{crew_assignments:[{staff_user_id:bob,staff_name:'Bob'},{staff_user_id:'not-a-uuid',staff_name:'Impostor'}]});
const cancelled=booking('job3','PM',null,{status:'cancelled'});
const missing=booking('job4','FULL',null,{package_code:null});
const entries=[first,second,cancelled,missing];
const schedule={ok:true,service_date:day,date_block:null,slots:{AM:{blocked:false,active_booking_count:3},PM:{blocked:true,active_booking_count:1}},bookings:entries};

assert.equal(normalizeSlot806('morning'),'AM');
assert.equal(normalizeSlot806('afternoon'),'PM');
assert.equal(normalizeSlot806('FULL_DAY'),'FULL');
assert.equal(normalizeSlot806('10:00'),null,'Do not infer a slot from clock time');
assert.equal(activeBooking806(cancelled),false,'Cancelled jobs never consume capacity');
assert.deepEqual(verifiedStaff806(second).people.map(person=>person.id),[bob,alice]);
assert.equal(verifiedStaff806(second).unverifiedCrew,true,'Untrusted staff-name-only record is flagged');
assert.equal(verifiedStaff806(booking('x','AM',null,{assigned_staff_name:'Someone'})).people.length,0);
const projection=buildDispatch806(schedule,entries);
assert.equal(projection.summary.appointments,4);
assert.equal(projection.summary.active,3);
assert.equal(projection.summary.unassigned,1);
assert.equal(projection.summary.staffAssigned,2);
assert.deepEqual(projection.staff.find(person=>person.id===alice).slotCounts,{AM:2,PM:0,FULL:0,unknown:0});
assert.equal(projection.staff.find(person=>person.id===alice).overloaded,true);
assert.equal(projection.staff.find(person=>person.id===bob).overloaded,false);
const codes=id=>projection.exceptionsById.get(id).map(item=>item.code);
for(const code of ['slot_overlap','staff_overlap'])assert.ok(codes('job1').includes(code));
for(const code of ['crew_identity','slot_overlap','staff_overlap'])assert.ok(codes('job2').includes(code));
for(const code of ['slot_blocked','slot_overlap','unassigned','package_missing'])assert.ok(codes('job4').includes(code));
assert.equal(projection.exceptionsById.has('job3'),false,'Cancelled jobs do not appear as dispatch exceptions');
assert.deepEqual(filterDispatch806(projection.rows,projection.exceptionsById,{query:alice}),[], 'Search never exposes internal staff IDs as customer lookup');
assert.equal(filterDispatch806(projection.rows,projection.exceptionsById,{query:'honda'}).length,4);
assert.equal(filterDispatch806(projection.rows,projection.exceptionsById,{slot:'AM',status:'active'}).length,2);
assert.equal(filterDispatch806(projection.rows,projection.exceptionsById,{status:'completed'}).length,0);
assert.equal(filterDispatch806(projection.rows,projection.exceptionsById,{staffId:bob}).length,1);
assert.equal(filterDispatch806(projection.rows,projection.exceptionsById,{onlyExceptions:true}).length,3);

const incomplete=buildDispatch806({...schedule,bookings:[...entries,booking('job5','PM',null)]},entries,{crewWarning:'Crew table unavailable'});
assert.ok(incomplete.exceptionsById.get('job5').some(item=>item.code==='details_missing'));
assert.equal(incomplete.warnings.includes('Crew table unavailable'),true);
const closed=buildDispatch806({...schedule,date_block:{is_closed:true}},entries);
assert.ok(closed.exceptionsById.get('job1').some(item=>item.code==='date_blocked'));
for(const input of [null,{...schedule,ok:false},{...schedule,service_date:'yesterday'},
  {...schedule,slots:null},{...schedule,slots:{AM:{blocked:false,active_booking_count:0}}},
  {...schedule,bookings:[{...first,service_date:'2026-11-10'}]}]){
  assert.throws(()=>buildDispatch806(input,entries),'Unknown or mismatched schedule must fail closed');
}
assert.throws(()=>buildDispatch806(schedule,null),'Missing authorized list must fail closed');

const html=source('../admin-operations.html');
const client=source('../assets/admin-operations.js');
assert.match(html,/data-build806="admin-daily-dispatch-workload-exceptions"/);
for(const marker of ['opsSelectedDate','opsPrevDate','opsNextDate','opsToday','opsWorkload806','opsExceptions806','opsOnlyExceptions806',
  'opsSearch806','opsSlot806','opsStatus806','opsClear806','data-exception-kind','admin-operations.js?v=20261108build806']){
  assert.ok(html.includes(marker),`Missing operator control ${marker}`);
}
for(const marker of ['const SCHEDULE_ENDPOINT = "/api/day_schedule"','body: JSON.stringify({service_date:date})',
  'body: JSON.stringify({})','verifiedStaff806(booking)','dispatch806.buildDispatch806(schedule,detailResult.bookings',
  'pendingRefresh806','current806=null','No schedule, staff capacity or exception clearance is inferred',
  'pageKey: "app-operations"'])assert.ok(client.includes(marker),`Missing read-only/fail-closed contract ${marker}`);
assert.doesNotMatch(client,/setInterval\s*\(|localStorage|sessionStorage|indexedDB/);
assert.doesNotMatch(client,/method:\s*["'](?:PATCH|PUT|DELETE)["']/);
assert.doesNotMatch(client,/fetch\s*\([^)]*\/api\/admin\/assign_booking/);
assert.doesNotMatch(client,/body:\s*JSON\.stringify\s*\(\s*\{\s*booking_id/,'Mutable legacy list endpoint must receive empty POST only');
assert.equal(html.match(/<h1\b/g)?.length,1,'Accessible single page heading');
console.log('Build 806 PASS: date-driven, ID-verified staff workload, blocked/overlap exceptions, secure read-only filters, stale-read refusal and guarded dispatch authority.');
