import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalize901,project901} from '../assets/build901-jobday-dispatch.mjs';
const b='5fd62295-1f83-4507-bf6f-bd5e1abb9fed',tool='166cd852-784d-4244-a793-3dde8d273348';
const staff='e97e48bf-4571-4e48-973f-285edda643ca',supervisor='d7aa9520-5108-441d-bb69-45cd854e5ca0';
const ids=['0a84b1d8-8a98-45dc-b5c1-3eaabce7b0cd','8a35d3a2-1a5c-4aa0-8f6a-3d67304650ce','73211e69-552e-489a-b9dd-e90481b1a0aa',
'2a35d74e-f789-4acc-9778-b1be9e9f3463','1c9a9fa7-c9e7-4bd6-9d7d-b1f9b79bcd41','95ca9b4c-69f9-468e-a8c0-c5ae5b4f0d9a',
'bb884a6f-b5ed-418f-bdd0-cbe304a7f12b','33d4573d-48d0-4a68-96c3-349d79867fea','e4e7e3c2-6407-4c0d-bfbd-86b168a105b3'];
const row=(id,recorded_at,more={})=>({id,booking_id:b,recorded_at,...more});
const at=(h)=>'2026-11-16T'+String(h).padStart(2,'0')+':00:00Z';
const input=(action,more={})=>({action,client_request_id:ids[0],booking_id:b,note:'Actual signed original work observation recorded.',...more});
const fixture=()=>{
 const assignments=[row(ids[0],at(10),{inventory_item_id:tool,assigned_to_staff_user_id:staff,assignment_action:'assign'})];
 const keys=['ppe','chemicals','power_water','worksite','weather'];
 const checks=keys.map((k,i)=>row(ids[i+1],at(11),{check_key:k,outcome:'pass',inventory_item_id:null}));
 checks.push(row(ids[6],at(11),{check_key:'tool_condition',inventory_item_id:tool,outcome:'pass'}));
 const signoffs=[row(ids[7],at(12),{decision:'ready',signed_by_staff_user_id:supervisor})];
 return {booking:{id:b,status:'confirmed',job_status:'scheduled'},assignments,checks,signoffs,service:[],events:[],
  now:new Date('2026-11-16T20:00:00Z')};
};
const event=(id,hr,kind,more={})=>row(id,at(hr),{event_kind:kind,staff_user_id:staff,note:'Signed original recorded safety event.',...more});
test('input validation drops impersonation, unsolicited approvals and unsafe type changes',()=>{
 assert.equal(normalize901(input('escalation',{subject:'equipment',severity:'stop_work',inventory_item_id:tool})).ok,true);
 assert.equal(normalize901(input('resolution',{escalation_id:ids[8],decision:'resolved'})).ok,true);
 assert.equal(normalize901(input('dispatch',{decision:'hold'})).ok,true);
 assert.equal(normalize901(input('return',{inventory_item_id:tool,decision:'good'})).ok,true);
 assert.equal(normalize901(input('reconcile',{decision:'reconciled'})).ok,true);
 for(const invalid of [
  input('escalation',{subject:'weather',severity:'stop_work',inventory_item_id:tool}),
  input('escalation',{subject:'equipment',severity:'stop_work'}),
  input('dispatch',{decision:'authorize',safety_signoff_id:ids[7]}),
  input('dispatch',{decision:'authorize',automatic_dispatch:true}),
  input('resolution',{escalation_id:ids[8],decision:'certified'}),
  input('return',{inventory_item_id:tool,decision:'good',staff_user_id:staff}),
  input('reconcile',{decision:'reconciled',stock_adjusted:true}),
  input('dispatch',{decision:'authorize',note:'bad'})
 ])assert.equal(normalize901(invalid).ok,false);
});
test('job cannot be dispatched without original signed 900 readiness AND new manager authorization',()=>{
 const f=fixture(),s=project901(f);
 assert.equal(s.eligible_to_authorize,true);assert.equal(s.dispatch_authorized,false);assert.equal(s.dispatch_status,'AWAITING_DISPATCH_DECISION');
 const dispatch=event('3f259b94-38d0-4582-8ac9-1a0176288651',13,'dispatch',{decision:'authorize',safety_signoff_id:f.signoffs[0].id,staff_user_id:supervisor});
 assert.equal(project901({...f,events:[dispatch]}).dispatch_authorized,true);
 const incorrect={...dispatch,safety_signoff_id:ids[0]};
 assert.equal(project901({...f,events:[incorrect]}).dispatch_authorized,false);
 assert.equal(project901({...f,booking:{...f.booking,status:'cancelled'},events:[dispatch]}).dispatch_authorized,false);
});
test('reported stop work instantly invalidates dispatch; resolution requires a FRESH 900 signed safety acceptance',()=>{
 const f=fixture(),dispatch=event('3f259b94-38d0-4582-8ac9-1a0176288651',13,'dispatch',{decision:'authorize',safety_signoff_id:f.signoffs[0].id});
 const hazard=event('d71b46f9-b687-4a55-8236-17f4175e8ac3',14,'escalation',{subject:'weather',severity:'stop_work'});
 const resolved=event('e9fd4ed0-bdc2-4704-8221-b86e5607e7be',15,'resolution',{escalation_id:hazard.id,decision:'resolved',staff_user_id:supervisor});
 assert.equal(project901({...f,events:[dispatch,hazard]}).dispatch_status,'STOP_WORK_HOLD');
 assert.equal(project901({...f,events:[dispatch,hazard,resolved]}).eligible_to_authorize,false);
 const reapproved=row('e4e7e3c2-6407-4c0d-bfbd-86b168a105b3',at(16),{decision:'ready',signed_by_staff_user_id:supervisor});
 const afterApproval=project901({...f,signoffs:[...f.signoffs,reapproved],events:[dispatch,hazard,resolved]});
 assert.equal(afterApproval.eligible_to_authorize,true);
 assert.equal(afterApproval.dispatch_authorized,false);
 const renewed=event('fad2338a-0ebc-4a32-8c51-3df0affc8a78',17,'dispatch',{decision:'authorize',safety_signoff_id:reapproved.id});
 assert.equal(project901({...f,signoffs:[...f.signoffs,reapproved],events:[dispatch,hazard,resolved,renewed]}).dispatch_authorized,true);
});
test('return requires every original assigned tool staff-observed GOOD, then distinct supervisor reconciliation',()=>{
 const f=fixture(),good=event('d71b46f9-b687-4a55-8236-17f4175e8ac3',18,'return',{inventory_item_id:tool,decision:'good'});
 const bad=event('e9fd4ed0-bdc2-4704-8221-b86e5607e7be',18,'return',{inventory_item_id:tool,decision:'issue'});
 assert.equal(project901({...f,events:[bad]}).eligible_to_reconcile,false);
 const observed=project901({...f,events:[good]});
 assert.equal(observed.eligible_to_reconcile,true);assert.equal(observed.equipment_reconciled,false);
 const signed=event('fad2338a-0ebc-4a32-8c51-3df0affc8a78',19,'reconcile',{decision:'reconciled',staff_user_id:supervisor});
 assert.equal(project901({...f,events:[good,signed]}).equipment_reconciled,true);
 assert.equal(project901({...f,events:[good,signed],assignments:[...f.assignments,row('e4e7e3c2-6407-4c0d-bfbd-86b168a105b3',at(20),{inventory_item_id:tool,assigned_to_staff_user_id:staff,assignment_action:'assign'})]}).equipment_reconciled,false);
});
test('missing or full original evidence must fail closed',()=>{
 const f=fixture();assert.throws(()=>project901({...f,events:[{event_kind:'dispatch'}]}),/Malformed/);
 assert.throws(()=>project901({...f,checks:new Array(300).fill(f.checks[0])}),/incomplete/);
 assert.throws(()=>project901({...f,booking:null}),/unavailable/);
});
test('private database and original runtime transitions enforce opt-in, signed and immutable safety authority',()=>{
 const migration=readFileSync(new URL('../supabase/migrations/20261117010000_build901_jobday_dispatch_safety_return.sql',import.meta.url),'utf8');
 assert.match(migration,/enable row level security/);
 assert.match(migration,/from public,anon,authenticated/);assert.match(migration,/to service_role/);
 assert.match(migration,/before update or delete/);assert.match(migration,/before truncate/);
 assert.match(migration,/check \(not independently_certified\)/);assert.match(migration,/check \(not automatic_dispatch\)/);
 const route=readFileSync(new URL('../functions/api/admin/jobday_dispatch_v901.js',import.meta.url),'utf8');
 assert.match(route,/allowLegacyAdminFallback:false/);assert.match(route,/auth_mode!=='session'/);
 assert.match(route,/sameOrigin811/);assert.match(route,/operations.assignment.manage/);
 assert.match(route,/original\.staff_user_id===a\.actor\.id/);
 assert.match(route,/report\.eligible_to_authorize/);
 const gate=readFileSync(new URL('../functions/api/_lib/jobday-safety-v901.js',import.meta.url),'utf8');
 assert.match(gate,/events\.length===0/);assert.match(gate,/dispatch_authorized/);
 const job=readFileSync(new URL('../functions/api/detailer/job_action.js',import.meta.url),'utf8');
 assert.match(job,/requireJobdayTransition901/);assert.match(gate,/jobday_stop_work/);
 assert.match(job,/\['dispatch','start','resume'\]/);
 assert.doesNotMatch(route,/method:'PATCH'|api\.stripe\.com|accounting_posted:true/);
});
