import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {confirmationSnapshot707,CONFIRMATION_EVENT707} from '../assets/quote-reconciliation-v707.mjs';
import {handoffMarker708,HANDOFF_EVENT708} from '../assets/quote-customer-handoff-v708.mjs';
import {FOLLOWUP_EVENT711} from '../assets/quote-followup-aging-v711.mjs';
import {ESCALATION_EVENT712} from '../assets/quote-followup-escalation-v712.mjs';
import {EXCEPTION_REVIEW_EVENT713,workloadTriage713} from '../assets/quote-followup-workload-v713.mjs';
import {onRequestGet,onRequestPost} from '../functions/api/admin/quote_followup_workload.js';

const quoteId='a5d187f2-4dd3-41ca-8dc4-c954ab9b053f',
  bookingId='c6f3b426-cd22-4adb-94fb-f16dab4c056e',
  profileId='50da40bf-fc30-4902-bb2e-18c8d95d5e86',
  staffId='ee9448bd-10e9-41c4-a34a-cbf8152c10f2';
const quote={id:quoteId,booking_id:bookingId,quote_number:'RD-713',customer_id:profileId,
  status:'accepted',customer_name:'Alex Example',accepted_amount_cents:25000,
  next_follow_up_at:'2026-10-26T09:00:00Z',created_at:'2026-10-25T09:00:00Z',
  updated_at:'2026-10-30T01:00:00Z'};
const booking={id:bookingId,customer_profile_id:profileId,customer_name:'Alex Example',
  customer_email:'alex@example.test',status:'confirmed',job_status:'scheduled',
  service_date:'2026-11-04',start_slot:'morning',package_code:'premium',vehicle_size:'suv',
  updated_at:'2026-10-30T01:00:00Z'};
let profile={id:profileId,email:'alex@example.test',phone:'5195550101',sms_phone:null,
  notification_opt_in:true,notification_channel:'email',is_active:true,archived_at:null,
  updated_at:'2026-10-30T01:00:00Z'};
const staff={id:staffId,full_name:'Morgan Staff',role_code:'detailer',is_active:true,can_manage_bookings:true};
const confirmation={id:crypto.randomUUID(),event_type:CONFIRMATION_EVENT707,
  actor_name:'Staff',created_at:'2026-10-30T01:10:00Z',
  payload:{quote_id:quoteId,booking_id:bookingId,snapshot:confirmationSnapshot707(quote,booking)}};
const handoff={id:crypto.randomUUID(),event_type:HANDOFF_EVENT708,
  actor_name:'Staff',created_at:'2026-10-30T01:20:00Z',payload:{quote_id:quoteId,booking_id:bookingId,
    marker:handoffMarker708({quote,booking},profile,{latest:confirmation},'email')}};
const env={SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'server-only',
  ADMIN_PASSWORD:'test-only',ALLOW_LEGACY_ADMIN_FALLBACK:'true'};
const rootUrl='https://rosiedazzlers.ca/api/admin/quote_followup_workload';
const managerHeaders={'x-admin-password':'test-only'};
const reqGet=(id='',headers=managerHeaders)=>new Request(`${rootUrl}${id?`?quote_id=${id}`:''}`,{headers});
const reqPost=(body,headers=managerHeaders)=>new Request(rootUrl,{method:'POST',
  headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(body)});
const marker=d=>({quote_id:quoteId,booking_id:bookingId,action:'review_exception',
  exception_code:'overdue_without_owner',note:'Reviewed this overdue owner gap with management.',
  acknowledge_real_exception_review:true,expected_marker:d.marker,
  expected_latest_outcome_event_id:d.latest_outcome_event_id,
  expected_latest_resolution_event_id:d.latest_resolution_event_id,
  expected_latest_assignment_event_id:d.latest_assignment_event_id,
  expected_latest_consent_recheck_event_id:d.latest_consent_recheck_event_id,
  expected_latest_escalation_event_id:d.latest_escalation_event_id,
  expected_latest_exception_review_event_id:d.latest_exception_review_event_id});
let events=[handoff,confirmation],operations=[];
const originalFetch=globalThis.fetch;
globalThis.fetch=async(input,options={})=>{
  const target=new URL(String(input)),method=options.method||'GET';
  assert.equal(target.origin,env.SUPABASE_URL);
  operations.push({path:target.pathname,method});
  if(method==='POST'){
    assert.equal(target.pathname,'/rest/v1/booking_events');
    const [event]=JSON.parse(options.body);
    assert.equal(event.event_type,EXCEPTION_REVIEW_EVENT713);
    assert.equal(event.payload.customer_contacted,false);
    assert.equal(event.payload.grants_consent,false);
    assert.equal(event.payload.closes_audit,false);
    assert.doesNotMatch(JSON.stringify(event),/alex@example\.test|5195550101/);
    const saved={...event,id:crypto.randomUUID(),created_at:new Date(Date.now()+events.length*1000).toISOString()};
    events.unshift(saved);return Response.json([saved]);
  }
  if(target.pathname.endsWith('/bookings'))return Response.json([booking]);
  if(target.pathname.endsWith('/customer_profiles'))return Response.json([profile]);
  if(target.pathname.endsWith('/staff_users'))return Response.json([staff]);
  if(target.pathname.endsWith('/booking_events')){
    const filter=target.searchParams.get('event_type')||'';
    if(filter===`eq.${CONFIRMATION_EVENT707}`)return Response.json(events.filter(e=>e.event_type===CONFIRMATION_EVENT707));
    if(filter.includes(EXCEPTION_REVIEW_EVENT713))return Response.json(events.filter(e=>
      [EXCEPTION_REVIEW_EVENT713,FOLLOWUP_EVENT711,ESCALATION_EVENT712].includes(e.event_type)));
    return Response.json(events.filter(e=>e.event_type===HANDOFF_EVENT708));
  }
  if(target.searchParams.has('booking_id'))return Response.json([]);
  return Response.json([quote]);
};
try{
  // Source-only aggregation never equates a recorded recheck with live consent.
  const sample=workloadTriage713([quote,{...quote,id:crypto.randomUUID(),status:'declined'}],[],new Date('2026-10-30T12:00:00Z'));
  assert.equal(sample.summary.total,1);
  assert.equal(sample.summary.critical,1);
  assert.equal(sample.summary.triage_exceptions,1);
  assert.deepEqual(sample.exceptions[0].flags,['overdue_without_owner','overdue_consent_recheck']);
  assert.equal(sample.live_consent_verified,false);
  let response=await onRequestGet({request:reqGet('',{}),env});
  assert.equal(response.status,401);
  assert.equal(operations.length,0,'Unauthorized overview reads no protected source');
  response=await onRequestGet({request:reqGet(),env});
  let data=await response.json();
  assert.equal(data.summary.total,1);
  assert.equal(data.summary.triage_exceptions,1);
  assert.equal(data.queue_only,true);
  assert.equal(data.live_consent_verified,false);
  assert.ok(!JSON.stringify(data).includes('alex@example.test'));
  response=await onRequestGet({request:reqGet('',{'x-staff-user-id':staffId}),env});
  assert.equal(response.status,403,'Non-manager staff cannot view the team-wide workload report');
  response=await onRequestGet({request:reqGet(quoteId),env});
  let detail=await response.json();
  assert.equal(detail.live_consent_verified,true);
  assert.equal(detail.manager_review_allowed,true);
  assert.deepEqual(detail.live_exceptions,['overdue_without_owner','overdue_consent_recheck']);
  const stale=marker(detail);
  response=await onRequestPost({request:reqPost({...stale,exception_code:'bogus'}),env});
  assert.equal(response.status,400);
  response=await onRequestPost({request:reqPost({...stale,note:'Customer alex@example.test should be called.'}),env});
  assert.equal(response.status,400);
  const detailer={'x-staff-user-id':staffId};
  response=await onRequestPost({request:reqPost(stale,detailer),env});
  assert.equal(response.status,403,'Booking staff may not record manager exception assessments');
  response=await onRequestPost({request:reqPost(stale),env});
  assert.equal(response.status,200);
  detail=await response.json();
  assert.equal(detail.recorded,true);
  assert.deepEqual(detail.reviewed_codes,['overdue_without_owner']);
  assert.equal(detail.closes_audit,false);
  response=await onRequestPost({request:reqPost(stale),env});
  assert.equal(response.status,409,'Stale exception review event marker must fail');
  response=await onRequestPost({request:reqPost(marker(detail)),env});
  assert.equal(response.status,200);
  assert.equal((await response.json()).already_current,true);
  assert.equal(events.filter(e=>e.event_type===EXCEPTION_REVIEW_EVENT713).length,1,'Repeat assessments are not appended');
  profile={...profile,notification_opt_in:false,updated_at:'2026-10-30T05:00:00Z'};
  response=await onRequestGet({request:reqGet(quoteId),env});
  detail=await response.json();
  assert.equal(detail.consent_allowed,false);
  assert.deepEqual(detail.reviewed_codes,[],'Profile drift invalidates previously recorded review');
  response=await onRequestPost({request:reqPost(marker(detail)),env});
  assert.equal(response.status,200,'Management may document the new live exception without granting consent');
  assert.ok(operations.every(op=>op.method==='GET'||op.path==='/rest/v1/booking_events'));
}finally{globalThis.fetch=originalFetch;}

// Visual acceptance contract: source-backed widgets, auth, focus and responsive layout.
const root=resolve(import.meta.dirname,'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
const html=read('admin-followup-workload.html');
assert.equal(html,read('admin-followup-workload/index.html'),'Root and slash routes must match');
for(const id of ['workloadKpis713','staffWorkloadRows713','workloadBars713','workloadExceptions713',
  'workloadDetailStatus713','workloadReviewSave713','workloadReviewHistory713'])
  assert.match(html,new RegExp(`id="${id}"`));
assert.match(html,/data-admin-shell-ready hidden/);
assert.match(html,/admin-command-surface-v712\.css/);
assert.match(html,/admin-followup-workload-v713\.css/);
assert.match(read('assets/admin-followup-workload-v713.js'),/AdminShell\.boot\(\{pageKey:'admin-followup-workload'/);
assert.match(read('assets/admin-followup-workload-v713.js'),/queue\.historical_records_may_be_truncated/);
assert.match(read('assets/admin-followup-workload-v713.css'),/@media\(max-width:700px\)/);
assert.match(read('assets/admin-followup-workload-v713.css'),/:focus-visible/);
assert.match(read('assets/admin-command-surface-v712.js'),/Follow-Ups/);
assert.match(read('assets/admin-auth.js'),/"admin-followup-workload"/);
assert.match(read('admin.html'),/Open Follow-Up Command/);
assert.equal(read('admin.html'),read('admin/index.html'));
assert.match(read('scripts/current_booking_wizard_regression.sh'),/build713_workload_visual_acceptance_test\.mjs/);
console.log('Build 713 PASS: workload grouping, real-source exceptions, manager-only audit assessments, consent drift, responsive command visual contract');
