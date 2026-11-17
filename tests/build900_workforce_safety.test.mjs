import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {REQUIRED_CHECKS900,normalizeAction900,evaluateJob900} from '../assets/build900-workforce-safety.mjs';
const b='5fd62295-1f83-4507-bf6f-bd5e1abb9fed',tool='166cd852-784d-4244-a793-3dde8d273348';
const staff='e97e48bf-4571-4e48-973f-285edda643ca',request='0a84b1d8-8a98-45dc-b5c1-3eaabce7b0cd';
const make=(action,rest={})=>({action,client_request_id:request,booking_id:b,note:'Original detailed observation for the booking.',...rest});
const row=(id,extra={})=>({id,booking_id:b,recorded_at:'2026-11-16T10:00:00Z',...extra});
test('strict forms reject client-authorized safety, role and stock mutations',()=>{
 assert.equal(normalizeAction900(make('assignment',{inventory_item_id:tool,assigned_to_staff_user_id:staff,assignment_action:'assign'})).ok,true);
 assert.equal(normalizeAction900(make('check',{check_key:'ppe',outcome:'pass'})).ok,true);
 assert.equal(normalizeAction900(make('signoff',{decision:'ready'})).ok,true);
 for(const input of [
  make('check',{check_key:'ppe',outcome:'pass',owner_verified:true}),
  make('assignment',{inventory_item_id:tool,assigned_to_staff_user_id:staff,assignment_action:'assign',stock_delta:3}),
  make('check',{check_key:'tool_condition',outcome:'pass'}),
  make('check',{check_key:'weather',inventory_item_id:tool,outcome:'pass'}),
  make('signoff',{decision:'certified'}),
  make('check',{check_key:'ppe',outcome:'pass',staff_user_id:staff}),
  make('signoff',{decision:'ready',note:'short'})
 ])assert.equal(normalizeAction900(input).ok,false);
});
const ids=['d7aa9520-5108-441d-bb69-45cd854e5ca0','8a35d3a2-1a5c-4aa0-8f6a-3d67304650ce','73211e69-552e-489a-b9dd-e90481b1a0aa','2a35d74e-f789-4acc-9778-b1be9e9f3463','1c9a9fa7-c9e7-4bd6-9d7d-b1f9b79bcd41'];
const fixture=()=>{
 const assignments=[row(request,{inventory_item_id:tool,assigned_to_staff_user_id:staff,assignment_action:'assign'})];
 const checks=[...REQUIRED_CHECKS900.map((k,i)=>row(ids[i],{check_key:k,outcome:'pass',inventory_item_id:null,recorded_at:'2026-11-16T11:00:00Z'})),row('95ca9b4c-69f9-468e-a8c0-c5ae5b4f0d9a',{check_key:'tool_condition',outcome:'pass',inventory_item_id:tool,recorded_at:'2026-11-16T11:00:00Z'})];
 return {assignments,checks,signoffs:[],service:[],now:new Date('2026-11-16T17:00:00Z')};
};
test('ready is gated on original supervisor signoff rather than self-reported checks',()=>{
 const f=fixture(),s=evaluateJob900(f);
 assert.equal(s.eligible_for_supervisor_signoff,true);assert.equal(s.readiness,'HOLD');
 assert.equal(evaluateJob900({...f,signoffs:[row('bb884a6f-b5ed-418f-bdd0-cbe304a7f12b',{decision:'ready',signed_by_staff_user_id:staff,recorded_at:'2026-11-16T12:00:00Z'})]}).readiness,'SUPERVISOR_RECORDED_READY');
 assert.equal(s.evidence.independent_physical_certification,false);
});
test('failed check, returned tool, overdue service or stale signoff always returns HOLD',()=>{
 const f=fixture(),signoff=row('bb884a6f-b5ed-418f-bdd0-cbe304a7f12b',{decision:'ready',recorded_at:'2026-11-16T12:00:00Z'});
 const bad=row('33d4573d-48d0-4a68-96c3-349d79867fea',{check_key:'ppe',outcome:'issue',recorded_at:'2026-11-16T13:00:00Z'});
 assert.equal(evaluateJob900({...f,signoffs:[signoff],checks:[...f.checks,bad]}).readiness,'HOLD');
 assert.equal(evaluateJob900({...f,assignments:[...f.assignments,row('33d4573d-48d0-4a68-96c3-349d79867fea',{inventory_item_id:tool,assignment_action:'return',recorded_at:'2026-11-16T13:00:00Z'})],signoffs:[signoff]}).readiness,'HOLD');
 assert.equal(evaluateJob900({...f,service:[{inventory_item_id:tool,event_kind:'planned',due_date:'2026-11-15'}],signoffs:[signoff]}).readiness,'HOLD');
});
test('migration uses server-only RLS and immutable original evidence',()=>{
 const sql=readFileSync(new URL('../supabase/migrations/20261117001000_build900_workforce_equipment_safety.sql',import.meta.url),'utf8');
 assert.match(sql,/enable row level security/g);assert.match(sql,/from public,anon,authenticated/);
 assert.match(sql,/to service_role/);assert.match(sql,/before update or delete/g);assert.match(sql,/before truncate/g);
 assert.match(sql,/independent_physical_certification boolean/);assert.doesNotMatch(sql,/grant .* to authenticated/);
});
test('route rejects legacy bridge, requires same origin and original supervisor for signoff',()=>{
 const src=readFileSync(new URL('../functions/api/admin/workforce_safety_v900.js',import.meta.url),'utf8');
 assert.match(src,/allowLegacyAdminFallback:false/);assert.match(src,/auth_mode!=='session'/);
 assert.match(src,/sameOrigin811/);assert.match(src,/operations.assignment.manage/);
 assert.match(src,/eligible_for_supervisor_signoff/);assert.doesNotMatch(src,/api.stripe.com|method:'PATCH'/);
});
