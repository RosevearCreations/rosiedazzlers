import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {capacitySnapshot715,capacityDecision715,CAPACITY_POLICY715} from '../assets/quote-followup-capacity-v715.mjs';
import {confirmationSnapshot707,CONFIRMATION_EVENT707} from '../assets/quote-reconciliation-v707.mjs';
import {handoffMarker708,HANDOFF_EVENT708} from '../assets/quote-customer-handoff-v708.mjs';
import {FOLLOWUP_EVENT711} from '../assets/quote-followup-aging-v711.mjs';
import {onRequestGet,onRequestPost} from '../functions/api/admin/quote_followup_rebalance.js';

const quoteId='49c00d47-9a4b-4c67-a0f3-065667403abe';
const bookingId='8438cd92-7cb1-4e20-9ced-ddb87534328a';
const profileId='e3ca8695-1fd2-4d08-a3f6-c197a198a2a8';
const staffId='4211709f-4ca2-4cbd-9f27-c8f4c6bf4d94';
const quote={id:quoteId,booking_id:bookingId,quote_number:'RD-715',customer_id:profileId,
  status:'accepted',customer_name:'Customer',accepted_amount_cents:24000,
  next_follow_up_at:'2026-10-25T09:00:00Z',created_at:'2026-10-24T09:00:00Z',
  updated_at:'2026-10-30T01:00:00Z'};
const booking={id:bookingId,customer_profile_id:profileId,customer_name:'Customer',
  customer_email:'person@example.test',status:'confirmed',job_status:'scheduled',
  service_date:'2026-11-06',start_slot:'morning',package_code:'premium',vehicle_size:'car',
  updated_at:'2026-10-30T01:00:00Z'};
const profile={id:profileId,email:'person@example.test',phone:'5195550198',sms_phone:null,
  notification_opt_in:true,notification_channel:'email',is_active:true,archived_at:null,
  updated_at:'2026-10-30T01:00:00Z'};
const staff=[{id:staffId,full_name:'Morgan Staff',role_code:'senior_detailer',
  is_active:true,can_manage_bookings:true}];
const confirmation={id:crypto.randomUUID(),event_type:CONFIRMATION_EVENT707,
  actor_name:'Staff',created_at:'2026-10-30T01:10:00Z',
  payload:{quote_id:quoteId,booking_id:bookingId,snapshot:confirmationSnapshot707(quote,booking)}};
const handoff={id:crypto.randomUUID(),event_type:HANDOFF_EVENT708,
  actor_name:'Staff',created_at:'2026-10-30T01:20:00Z',payload:{quote_id:quoteId,booking_id:bookingId,
    marker:handoffMarker708({quote,booking},profile,{latest:confirmation},'email')}};
const extraQuotes=Array.from({length:6},(_,i)=>({id:crypto.randomUUID(),booking_id:crypto.randomUUID(),
  quote_number:`OTHER-${i}`,status:'accepted',next_follow_up_at:'2026-11-12T09:00:00Z',
  created_at:'2026-10-30T09:00:00Z',updated_at:'2026-10-30T09:00:00Z'}));
let events=[handoff,confirmation,...extraQuotes.map((q,i)=>({id:crypto.randomUUID(),
  created_at:`2026-10-30T${String(9+i).padStart(2,'0')}:00:00Z`,event_type:FOLLOWUP_EVENT711,
  actor_name:'Manager',payload:{quote_id:q.id,booking_id:q.booking_id,action:'assign',
    marker:{quote_id:q.id,booking_id:q.booking_id,quote_updated_at:q.updated_at},
    assigned_staff_user_id:staffId,assigned_staff_name:'Morgan Staff',staff_only:true}}))];
const allQuotes=[quote,...extraQuotes],env={SUPABASE_URL:'https://db.example.test',
  SUPABASE_SERVICE_ROLE_KEY:'server-only',ADMIN_PASSWORD:'test-only',
  ALLOW_LEGACY_ADMIN_FALLBACK:'true'};
const manager={'x-admin-password':'test-only'},root='https://rosiedazzlers.ca/api/admin/quote_followup_rebalance';
const get=(query='',headers=manager)=>new Request(`${root}${query}`,{headers});
const post=body=>new Request(root,{method:'POST',headers:{...manager,'Content-Type':'application/json'},
  body:JSON.stringify(body)});
const markers=data=>({quote_id:quoteId,booking_id:bookingId,expected_marker:data.marker,
  expected_latest_outcome_event_id:data.latest_outcome_event_id,
  expected_latest_resolution_event_id:data.latest_resolution_event_id,
  expected_latest_assignment_event_id:data.latest_assignment_event_id,
  expected_latest_consent_recheck_event_id:data.latest_consent_recheck_event_id,
  expected_latest_escalation_event_id:data.latest_escalation_event_id,
  expected_latest_exception_review_event_id:data.latest_exception_review_event_id,
  expected_latest_resolution_evidence_event_id:data.latest_resolution_evidence_event_id,
  acknowledge_manager_review:true,action:'rebalance_owner',target_staff_user_id:staffId,
  note:'Actual schedule and queue reviewed; manager approves an explicitly documented exception.'});

const pure=capacitySnapshot715(extraQuotes,events,new Date('2026-10-31T12:00:00Z'));
assert.equal(pure.by_staff[0].assigned,6);
const over=capacityDecision715(pure,staffId,'critical');
assert.equal(over.projected.assigned,7);
assert.deepEqual(over.exceeded,['assigned']);
assert.equal(over.requires_manager_override,true);
assert.equal(over.hours_verified,false);
assert.equal(capacityDecision715({by_staff:[],source_truncated:true},staffId).hard_hold,true);
assert.equal(capacitySnapshot715(Array(CAPACITY_POLICY715.quote_limit).fill(quote),[]).source_truncated,true);
assert.equal(capacityDecision715(pure,staffId,'critical',true).projected.assigned,6);

let posted=[];let truncate=false;
const oldFetch=globalThis.fetch;
globalThis.fetch=async(input,options={})=>{
  const url=new URL(String(input)),method=options.method||'GET';
  assert.equal(url.origin,env.SUPABASE_URL);
  if(method==='POST'){
    const [event]=JSON.parse(options.body);
    assert.equal(event.event_type,FOLLOWUP_EVENT711);
    assert.equal(event.payload.queue_capacity_override,true);
    assert.equal(event.payload.hours_or_shift_verified,false);
    assert.equal(event.payload.grants_consent,false);
    assert.doesNotMatch(JSON.stringify(event),/person@example\.test|5195550198/);
    const result={...event,id:crypto.randomUUID(),created_at:'2026-10-30T23:00:00Z'};
    posted.push(result);events.unshift(result);
    return Response.json([result]);
  }
  if(url.pathname.endsWith('/staff_users')){
    const id=url.searchParams.get('id')?.replace('eq.','');
    return Response.json(staff.filter(s=>!id||s.id===id));
  }
  if(url.pathname.endsWith('/bookings'))return Response.json([booking]);
  if(url.pathname.endsWith('/customer_profiles'))return Response.json([profile]);
  if(url.pathname.endsWith('/booking_events')){
    const type=url.searchParams.get('event_type')||'';
    let matching=events.filter(e=>type.includes(e.event_type));
    if(type===`eq.${FOLLOWUP_EVENT711}`&&truncate)
      matching=Array(CAPACITY_POLICY715.event_limit).fill(events.find(e=>e.event_type===FOLLOWUP_EVENT711));
    if(url.searchParams.has('booking_id'))matching=matching.filter(e=>e.payload.booking_id===bookingId);
    return Response.json(matching);
  }
  if(url.pathname.endsWith('/quote_pipeline_items')){
    if(url.searchParams.has('booking_id'))return Response.json([]);
    if(url.searchParams.has('id'))return Response.json([quote]);
    return Response.json(allQuotes);
  }
  throw Error(`Unexpected Supabase read ${url}`);
};
try{
  assert.equal((await onRequestGet({request:get(`?quote_id=${quoteId}&export=evidence`,{}),env})).status,401);
  let response=await onRequestGet({request:get(),env});
  assert.equal(response.status,200);
  const roster=await response.json();
  assert.equal(roster.capacity_by_staff[0].assigned,6);
  assert.equal(roster.capacity_source_truncated,false);
  assert.equal(roster.capacity_verified,false);
  response=await onRequestGet({request:get(`?quote_id=${quoteId}&export=evidence`),env});
  assert.equal(response.status,200);
  assert.match(response.headers.get('content-disposition'),/attachment; filename="rosie-evidence-/);
  assert.equal(response.headers.get('cache-control'),'private, no-store');
  const evidence=await response.json();
  assert.equal(evidence.build,715);
  assert.equal(evidence.metadata.cryptographically_signed,false);
  assert.equal(evidence.metadata.closes_audit,false);
  assert.doesNotMatch(JSON.stringify(evidence),/person@example\.test|5195550198/);
  response=await onRequestGet({request:get(`?quote_id=${quoteId}`),env});
  const current=await response.json();
  response=await onRequestPost({request:post(markers(current)),env});
  assert.equal(response.status,409,'No unstated capacity override is permitted');
  response=await onRequestPost({request:post({...markers(current),acknowledge_capacity_override:true}),env});
  assert.equal(response.status,200,'Documented explicit manager capacity override permitted');
  assert.equal(posted.length,1);
  response=await onRequestGet({request:get(`?quote_id=${quoteId}`),env});
  const updated=await response.json();
  truncate=true;
  response=await onRequestPost({request:post({...markers(updated),target_staff_user_id:crypto.randomUUID(),acknowledge_capacity_override:true}),env});
  assert.equal(response.status,409,'Unverified target is blocked');
  // Incomplete sources cannot be overridden even with a valid active staff member.
  const otherStaff={...staff[0],id:crypto.randomUUID()};staff.push(otherStaff);
  response=await onRequestPost({request:post({...markers(updated),target_staff_user_id:otherStaff.id,acknowledge_capacity_override:true}),env});
  assert.equal(response.status,409,'Truncated capacity source is a hard hold');
}finally{globalThis.fetch=oldFetch;}

const path=resolve(import.meta.dirname,'..'),read=name=>readFileSync(resolve(path,name),'utf8');
const html=read('admin-followup-workload.html'),js=read('assets/admin-followup-workload-v713.js'),
  css=read('assets/admin-followup-workload-v715.css');
assert.equal(html,read('admin-followup-workload/index.html'));
for(const id of ['capacityStatus715','capacityOverride715','resolutionExport715','ownerDisposition715'])
  assert.match(html,new RegExp(`id="${id}"`));
assert.match(html,/admin-followup-workload-v715\.css/);
assert.match(js,/acknowledge_capacity_override:capacityOverride/);
assert.match(js,/feedback_disposition/);
assert.match(js,/server_acceptance_recorded:false/);
assert.match(js,/export=evidence/);
assert.match(css,/@media\(max-width:700px\)/);
assert.match(css,/:focus-visible/);
assert.match(read('scripts/current_booking_wizard_regression.sh'),/build715_capacity_export_feedback_test\.mjs/);
console.log('Build 715 PASS: current capacity guards, manager override, truncation HOLD, role-limited evidence export and local owner-feedback states');
