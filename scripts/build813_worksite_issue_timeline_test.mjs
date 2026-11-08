import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { onRequestGet as customerGet,safeCustomerTimelineEvent813 } from '../functions/api/client/worksite_timeline_v813.js';
import { onRequestGet as staffGet } from '../functions/api/admin/worksite_assignment_v812.js';
import { customerTimelineMessage813,staffTimelineMessage813,customerFollowUpAdvice813,eventTimeToronto813 } from '../assets/worksite-timeline-v813.mjs';

const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const cid='c7524d89-49b9-4ec2-a44e-f695c146e7af',bid='479608a1-4fd8-42e6-a6a4-42094513ce17';
const rid='e8a0f599-cd22-44c0-9fa4-c992998a9a4c',foreign='e8a0f599-cd22-44c0-9fa4-c992998a9a4d';
const staffId='aa00dffd-194d-4cb1-84bd-50a95ab44e84';
const env={SUPABASE_URL:'https://supabase-mock.invalid',SUPABASE_SERVICE_ROLE_KEY:'test-only'};
const rawEvent={issue_id:rid,event_kind:'assignment_changed',issue_revision:2,recorded_at:'2026-11-08T14:12:00Z',
  actor_staff_user_id:staffId,previous_assignee:null,current_assignee:staffId,previous_status:null,current_status:null,
  previous_escalation:null,current_escalation:null,customer_resolution_snapshot:null,staff_private_note:'PRIVATE NEVER EXPOSED'};
const review={...rawEvent,event_kind:'review_status_changed',issue_revision:3,recorded_at:'2026-11-08T15:12:00Z',
  previous_status:'reviewing',current_status:'resolved',customer_resolution_snapshot:'We will use the rear entrance.'};
let customerSession=true,staffSession=true,staffAllowed=true,offline=false,rows=[rawEvent,review,{...rawEvent,issue_id:foreign}];
const request=(path,{cookie='rd_client_session=token',headers={}}={})=>({env,request:new Request(`https://www.rosiedazzlers.ca${path}`,{headers:{...(cookie?{Cookie:cookie}:{}),...headers}})});
const saved=globalThis.fetch;
globalThis.fetch=async(url)=>{
  if(offline)throw Error('Database unavailable');
  const path=new URL(url).pathname.split('/').pop();
  if(path==='customer_auth_sessions')return new Response(JSON.stringify(customerSession?[{expires_at:'2031-01-01T00:00:00Z',revoked_at:null,customer_profile:{id:cid,email:'customer@example.com',is_active:true}}]:[]));
  if(path==='staff_auth_sessions')return new Response(JSON.stringify(staffSession?[{expires_at:'2031-01-01T00:00:00Z',revoked_at:null,staff_user:{id:staffId,role_code:staffAllowed?'operations_manager':'detailer',is_active:true,full_name:'Operator',can_manage_bookings:staffAllowed,permissions_profile:{}}}]:[]));
  if(path==='customer_worksite_issues_v811')return new Response(JSON.stringify([{id:rid,booking_id:bid,category:'arrival_contact',customer_description:'Park in rear.',status:'reviewing',workflow_revision:2,arrival_escalation_status:'none',submitted_at:'2026-11-08T13:00:00Z'}]));
  if(path==='staff_users')return new Response(JSON.stringify([{id:staffId,role_code:'operations_manager',full_name:'Operator',is_active:true,can_manage_bookings:true,permissions_profile:{}}]));
  if(path==='bookings')return new Response(JSON.stringify([{id:bid,service_date:'2026-11-08',status:'confirmed',job_status:'scheduled',detailing_completed_at:null}]));
  if(path==='customer_worksite_issue_events_v813')return new Response(JSON.stringify(rows));
  throw Error(`Unexpected path: ${path}`);
};
try{
  assert.equal(safeCustomerTimelineEvent813(rawEvent).actor_staff_user_id,undefined);
  assert.equal(safeCustomerTimelineEvent813(rawEvent).staff_private_note,undefined);
  assert.match(customerTimelineMessage813({kind:'staff_acknowledged'}),/acknowledgement/);
  assert.match(customerTimelineMessage813({kind:'review_status_changed',status:'resolved'}),/resolution/);
  assert.match(customerTimelineMessage813({kind:'arrival_escalation_changed',escalation:'flagged'}),/not an appointment change/);
  assert.match(customerFollowUpAdvice813('resolved'),/follow-up form below/);
  assert.match(customerFollowUpAdvice813('closed_no_action'),/does not cancel/);
  assert.match(customerFollowUpAdvice813('pending_review'),/contact Rosie directly/);
  assert.match(staffTimelineMessage813(rawEvent,id=>id===staffId?'Operator':''),/Unassigned → Operator/);
  assert.match(staffTimelineMessage813(review,id=>id===staffId?'Operator':''),/reviewing → resolved/);
  assert.match(eventTimeToronto813('2026-11-08T14:12:00Z'),/Toronto time/);
  assert.equal(eventTimeToronto813('not-a-date'),'Time unavailable');

  customerSession=false;
  assert.equal((await customerGet(request('/api/client/worksite_timeline_v813'))).status,401,'Anonymous customers are blocked');
  customerSession=true;
  let response=await customerGet(request('/api/client/worksite_timeline_v813'));
  assert.equal(response.status,200,await response.clone().text());
  let data=await response.json();
  assert.equal(data.events.length,2,'Forged or foreign events are removed by server-side ownership check');
  assert.equal(data.authority.prior_history_backfilled,false);
  assert.equal(data.authority.notification_sent,false);
  assert.equal(JSON.stringify(data).includes('PRIVATE NEVER EXPOSED'),false);
  assert.equal(JSON.stringify(data).includes(staffId),false);
  assert.equal(JSON.stringify(data).includes(foreign),false);
  rows=[];
  response=await customerGet(request('/api/client/worksite_timeline_v813'));
  assert.equal(response.status,200);assert.equal((await response.json()).events.length,0,'Empty history must not be fabricated');
  rows=[rawEvent,review];
  offline=true;
  assert.equal((await customerGet(request('/api/client/worksite_timeline_v813'))).status,503,'Unavailable authoritative history fails closed');
  offline=false;

  staffSession=false;
  assert.equal((await staffGet(request('/api/admin/worksite_assignment_v812',{cookie:'',headers:{'x-staff-user-id':staffId}}))).status,401,'Untrusted staff bridge cannot read the audit');
  staffSession=true;staffAllowed=false;
  assert.equal((await staffGet(request('/api/admin/worksite_assignment_v812',{cookie:'rd_staff_session=token'}))).status,403);
  staffAllowed=true;
  response=await staffGet(request('/api/admin/worksite_assignment_v812',{cookie:'rd_staff_session=token'}));
  assert.equal(response.status,200,await response.clone().text());
  data=await response.json();assert.equal(data.events.length,2);
  assert.equal(data.events[0].actor_staff_user_id,staffId,'Only authorized staff can inspect handoff actor IDs');
}finally{globalThis.fetch=saved;}

const migration=read('../supabase/migrations/20261108150601_build813_worksite_issue_append_only_timeline.sql');
assert.match(migration,/create table public.customer_worksite_issue_events_v813/);
assert.match(migration,/enable row level security/);
assert.match(migration,/revoke all .*anon,authenticated/);
assert.match(migration,/grant select,insert .*to service_role/);
assert.doesNotMatch(migration,/grant[^\n]*update[^\n]*customer_worksite_issue_events_v813/i);
assert.match(migration,/security invoker/);
assert.doesNotMatch(migration,/security definer/i);
assert.match(migration,/after update of status/);
assert.match(migration,/new\.workflow_revision <> old\.workflow_revision \+ 1/);
assert.match(migration,/new\.assigned_staff_user_id is distinct from old\.assigned_staff_user_id/);
assert.match(migration,/new\.staff_acknowledged_at is distinct from old\.staff_acknowledged_at/);
assert.match(migration,/new\.arrival_escalation_status is distinct from old\.arrival_escalation_status/);
assert.match(migration,/new\.status is distinct from old\.status/);
const guard=read('../supabase/migrations/20261108150728_build813_event_immutability_guard.sql');
assert.match(guard,/revoke all on public\.customer_worksite_issue_events_v813 from service_role/);
assert.match(guard,/grant select,insert .*service_role/);
assert.match(guard,/before update or delete on public\.customer_worksite_issue_events_v813/);
assert.match(guard,/raise exception 'Recorded worksite issue events cannot be changed or deleted'/);
assert.match(read('../functions/api/admin/worksite_assignment_v812.js'),/arrival_escalation_addressed_by_staff_user_id/);
assert.equal(read('../my-account.html'),read('../my-account/index.html'));
assert.equal(read('../admin-today.html'),read('../admin-today/index.html'));
assert.match(read('../assets/customer-worksite-issues-v811.mjs'),/worksite_timeline_v813/);
assert.match(read('../assets/admin-worksite-issues-v811.mjs'),/staffAuditMarkup813/);
assert.match(read('../assets/my-account-v355.js'),/20261108build815/);
assert.match(read('./current_booking_wizard_regression.sh'),/build813_worksite_issue_timeline_test\.mjs/);
console.log('Build 813 PASS: database-recorded staff handoffs, real issue history, customer-only timeline redaction, safe follow-up guidance, no invented backfill, and protected staff audit.');
