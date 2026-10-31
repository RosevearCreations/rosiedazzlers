import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {confirmationSnapshot707,CONFIRMATION_EVENT707} from '../assets/quote-reconciliation-v707.mjs';
import {handoffMarker708,HANDOFF_EVENT708} from '../assets/quote-customer-handoff-v708.mjs';
import {FOLLOWUP_EVENT711} from '../assets/quote-followup-aging-v711.mjs';
import {EXCEPTION_REVIEW_EVENT713} from '../assets/quote-followup-workload-v713.mjs';
import {RESOLUTION_EVIDENCE_EVENT714,staffBalance714} from '../assets/quote-followup-rebalance-v714.mjs';
import {onRequestGet as get714,onRequestPost as post714} from '../functions/api/admin/quote_followup_rebalance.js';
import {onRequestGet as get713,onRequestPost as post713} from '../functions/api/admin/quote_followup_workload.js';
import {onRequestGet as get711,onRequestPost as post711} from '../functions/api/admin/quote_followup_queue.js';

const quoteId='49c00d47-9a4b-4c67-a0f3-065667403abe',
  bookingId='8438cd92-7cb1-4e20-9ced-ddb87534328a',
  profileId='e3ca8695-1fd2-4d08-a3f6-c197a198a2a8',
  staffId='4211709f-4ca2-4cbd-9f27-c8f4c6bf4d94',
  spareId='91345d16-9a24-4423-aa8e-2cbcfbd4979f';
const quote={id:quoteId,booking_id:bookingId,quote_number:'RD-714',customer_id:profileId,
  status:'accepted',customer_name:'A. Customer',accepted_amount_cents:24000,
  next_follow_up_at:'2026-10-25T09:00:00Z',created_at:'2026-10-24T09:00:00Z',
  updated_at:'2026-10-30T01:00:00Z'};
const booking={id:bookingId,customer_profile_id:profileId,customer_name:'A. Customer',
  customer_email:'person@example.test',status:'confirmed',job_status:'scheduled',
  service_date:'2026-11-06',start_slot:'morning',package_code:'premium',vehicle_size:'car',
  updated_at:'2026-10-30T01:00:00Z'};
let profile={id:profileId,email:'person@example.test',phone:'5195550198',sms_phone:null,
  notification_opt_in:true,notification_channel:'email',is_active:true,archived_at:null,
  updated_at:'2026-10-30T01:00:00Z'};
const staff=[{id:staffId,full_name:'Morgan Staff',role_code:'detailer',is_active:true,can_manage_bookings:true},
  {id:spareId,full_name:'Riley Staff',role_code:'senior_detailer',is_active:true,can_manage_bookings:true},
  {id:crypto.randomUUID(),full_name:'Inactive Staff',role_code:'detailer',is_active:false,can_manage_bookings:true}];
const confirmation={id:crypto.randomUUID(),event_type:CONFIRMATION_EVENT707,
  actor_name:'Staff',created_at:'2026-10-30T01:10:00Z',
  payload:{quote_id:quoteId,booking_id:bookingId,snapshot:confirmationSnapshot707(quote,booking)}};
const handoff={id:crypto.randomUUID(),event_type:HANDOFF_EVENT708,actor_name:'Staff',
  created_at:'2026-10-30T01:20:00Z',payload:{quote_id:quoteId,booking_id:bookingId,
    marker:handoffMarker708({quote,booking},profile,{latest:confirmation},'email')}};
const env={SUPABASE_URL:'https://db.example.test',SUPABASE_SERVICE_ROLE_KEY:'server-only',
  ADMIN_PASSWORD:'test-only',ALLOW_LEGACY_ADMIN_FALLBACK:'true'};
const manager={'x-admin-password':'test-only'},detailer={'x-staff-user-id':staffId};
const root='https://rosiedazzlers.ca/api/admin/';
const reqGet=(path,id='',headers=manager)=>new Request(`${root}${path}${id?`?quote_id=${id}`:''}`,{headers});
const reqPost=(path,body,headers=manager)=>new Request(`${root}${path}`,{method:'POST',
  headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify(body)});
const markers=(data)=>({quote_id:quoteId,booking_id:bookingId,expected_marker:data.marker,
  planned_followup_at:new Date(Date.now()+7*86400000).toISOString(),
  expected_latest_outcome_event_id:data.latest_outcome_event_id,
  expected_latest_resolution_event_id:data.latest_resolution_event_id,
  expected_latest_assignment_event_id:data.latest_assignment_event_id,
  expected_latest_consent_recheck_event_id:data.latest_consent_recheck_event_id,
  expected_latest_escalation_event_id:data.latest_escalation_event_id,
  expected_latest_exception_review_event_id:data.latest_exception_review_event_id,
  expected_latest_resolution_evidence_event_id:data.latest_resolution_evidence_event_id,
  acknowledge_manager_review:true});
let events=[handoff,confirmation],posted=[];
const priorFetch=globalThis.fetch;
globalThis.fetch=async(input,options={})=>{
  const u=new URL(String(input)),method=options.method||'GET';
  assert.equal(u.origin,env.SUPABASE_URL);
  if(method==='POST'){
    assert.equal(u.pathname,'/rest/v1/booking_events');
    const [event]=JSON.parse(options.body);
    assert.ok([EXCEPTION_REVIEW_EVENT713,FOLLOWUP_EVENT711,RESOLUTION_EVIDENCE_EVENT714].includes(event.event_type));
    assert.doesNotMatch(JSON.stringify(event),/person@example\.test|5195550198/);
    assert.equal(event.payload.staff_only,true);
    if(event.payload.build===714)
      assert.equal(event.payload.grants_consent,false,'Build 714 events cannot grant permission');
    const saved={...event,id:crypto.randomUUID(),created_at:new Date(Date.now()+events.length*1500).toISOString()};
    posted.push(saved);events.unshift(saved);return Response.json([saved]);
  }
  if(u.pathname.endsWith('/bookings'))return Response.json([booking]);
  if(u.pathname.endsWith('/customer_profiles'))return Response.json([profile]);
  if(u.pathname.endsWith('/staff_users')){
    const id=u.searchParams.get('id')?.replace('eq.','');
    const eligible=staff.filter(s=>s.is_active&&(!id||s.id===id));
    return Response.json(eligible);
  }
  if(u.pathname.endsWith('/staff_availability_blocks'))return Response.json([]);
  if(u.pathname.endsWith('/booking_events')){
    const type=u.searchParams.get('event_type')||'';
    if(type===`eq.${CONFIRMATION_EVENT707}`)return Response.json(events.filter(e=>e.event_type===CONFIRMATION_EVENT707));
    if(type===`eq.${RESOLUTION_EVIDENCE_EVENT714}`)return Response.json(events.filter(e=>e.event_type===RESOLUTION_EVIDENCE_EVENT714));
    if(type.includes(EXCEPTION_REVIEW_EVENT713)||type.includes(FOLLOWUP_EVENT711))
      return Response.json(events.filter(e=>type.includes(e.event_type)));
    return Response.json(events.filter(e=>e.event_type===HANDOFF_EVENT708));
  }
  if(u.searchParams.has('booking_id'))return Response.json([]);
  return Response.json([quote]);
};
try{
  let response=await get714({request:reqGet('quote_followup_rebalance','',{}),env});
  assert.equal(response.status,401,'Anonymous roster reads denied');
  response=await get714({request:reqGet('quote_followup_rebalance','',detailer),env});
  assert.equal(response.status,403,'Detailers cannot see the full team roster');
  response=await get714({request:reqGet('quote_followup_rebalance'),env});
  const roster=await response.json();
  assert.equal(roster.eligible_staff.length,2);
  assert.equal(roster.availability_verified,false);
  assert.deepEqual(staffBalance714(roster.eligible_staff,[
    {staff_user_id:staffId,assigned:3,overdue:2},
    {staff_user_id:spareId,assigned:1,overdue:0}]).map(s=>s.staff_user_id),[spareId,staffId]);
  response=await get714({request:reqGet('quote_followup_rebalance',quoteId),env});
  let current=await response.json();
  assert.equal(current.can_rebalance,true);
  assert.equal(current.owner_acceptance_recorded_on_server,false);
  assert.deepEqual(current.live_exceptions,['overdue_without_owner','overdue_consent_recheck']);
  const begin=markers(current);
  response=await post714({request:reqPost('quote_followup_rebalance',
    {...begin,action:'rebalance_owner',target_staff_user_id:spareId,note:'Move this overdue work to an available colleague.'},detailer),env});
  assert.equal(response.status,403,'Rebalance writes require a manager');
  response=await post714({request:reqPost('quote_followup_rebalance',
    {...begin,action:'rebalance_owner',target_staff_user_id:spareId,note:'Send person@example.test a note today.'}),env});
  assert.equal(response.status,400,'PII notes denied');
  response=await post714({request:reqPost('quote_followup_rebalance',
    {...begin,action:'rebalance_owner',target_staff_user_id:crypto.randomUUID(),note:'Move this overdue work to another staff member.'}),env});
  assert.equal(response.status,409,'Unknown or inactive staff denied');
  const originalReview=await get713({request:reqGet('quote_followup_workload',quoteId),env});
  const original=await originalReview.json();
  response=await post713({request:reqPost('quote_followup_workload',{
    quote_id:quoteId,booking_id:bookingId,action:'review_exception',
    exception_code:'overdue_without_owner',note:'Reviewed the unassigned critical case internally.',
    acknowledge_real_exception_review:true,expected_marker:original.marker,
    expected_latest_outcome_event_id:original.latest_outcome_event_id,
    expected_latest_resolution_event_id:original.latest_resolution_event_id,
    expected_latest_assignment_event_id:original.latest_assignment_event_id,
    expected_latest_consent_recheck_event_id:original.latest_consent_recheck_event_id,
    expected_latest_escalation_event_id:original.latest_escalation_event_id,
    expected_latest_exception_review_event_id:original.latest_exception_review_event_id}),env});
  assert.equal(response.status,200,'Review original exception first');
  response=await get714({request:reqGet('quote_followup_rebalance',quoteId),env});
  current=await response.json();
  const fresh=markers(current);
  response=await post714({request:reqPost('quote_followup_rebalance',
    {...begin,action:'rebalance_owner',target_staff_user_id:spareId,note:'Reassign this overdue work after manager review.'}),env});
  assert.equal(response.status,409,'Original 713 manager review invalidates stale rebalancing snapshot');
  response=await post714({request:reqPost('quote_followup_rebalance',
    {...fresh,action:'rebalance_owner',target_staff_user_id:spareId,note:'Reassign this overdue work after manager review.',acknowledge_unverified_shift:true}),env});
  assert.equal(response.status,200);
  let result=await response.json();
  assert.equal(result.recorded,true);
  assert.equal(result.assigned_staff_user_id,spareId);
  assert.equal(result.recheck_current,false,'Rebalance must invalidate old consent recheck');
  assert.equal(result.requires_consent_recheck,true);
  assert.deepEqual(result.resolution_readiness.map(e=>e.exception_code),['overdue_without_owner']);
  response=await post714({request:reqPost('quote_followup_rebalance',
    {...fresh,action:'rebalance_owner',target_staff_user_id:spareId,note:'Reassign this overdue work after manager review.',acknowledge_unverified_shift:true}),env});
  assert.equal(response.status,409,'Reusing old assignment markers rejected');
  response=await get714({request:reqGet('quote_followup_rebalance',quoteId),env});
  current=await response.json();
  response=await post714({request:reqPost('quote_followup_rebalance',
    {...markers(current),action:'verify_exception_resolution',exception_code:'overdue_without_owner',
      note:'A later verified assignment event now addresses the owner gap.'}),env});
  assert.equal(response.status,200);
  result=await response.json();
  assert.equal(result.recorded,true);
  assert.equal(result.resolution_readiness[0].verified,true);
  const receipt=posted.find(e=>e.event_type===RESOLUTION_EVIDENCE_EVENT714);
  assert.equal(receipt.payload.closes_audit,false);
  assert.equal(receipt.payload.customer_contacted,false);
  response=await post714({request:reqPost('quote_followup_rebalance',
    {...markers(result),action:'verify_exception_resolution',exception_code:'overdue_without_owner',
      note:'A later verified assignment event now addresses the owner gap.'}),env});
  assert.equal(response.status,200);
  assert.equal((await response.json()).already_current,true,'Evidence receipt idempotent on exact live source');
  response=await get711({request:reqGet('quote_followup_queue',quoteId),env});
  const assignment=await response.json();
  assert.equal(assignment.can_recheck,true);
  response=await post711({request:reqPost('quote_followup_queue',{
    quote_id:quoteId,booking_id:bookingId,action:'recheck_consent',
    acknowledge_staff_action:true,expected_marker:assignment.marker,
    expected_latest_assignment_event_id:assignment.latest_assignment_event_id,
    expected_latest_resolution_event_id:assignment.latest_resolution_event_id,
    expected_latest_outcome_event_id:assignment.latest_outcome_event_id}),env});
  assert.equal(response.status,200);
  response=await get714({request:reqGet('quote_followup_rebalance',quoteId),env});
  result=await response.json();
  assert.equal(result.recheck_current,true);
  assert.equal(result.resolution_readiness[0].verified,false,
    'A newer relevant source event stales the previous evidence receipt');
  assert.equal(posted.filter(e=>e.event_type===FOLLOWUP_EVENT711&&e.payload.rebalance_by_manager).length,1);
}finally{globalThis.fetch=priorFetch;}

const path=resolve(import.meta.dirname,'..');
const read=filename=>readFileSync(resolve(path,filename),'utf8');
const html=read('admin-followup-workload.html'),js=read('assets/admin-followup-workload-v713.js'),
  css=read('assets/admin-followup-workload-v714.css');
assert.equal(html,read('admin-followup-workload/index.html'),'Clean and slash routes must match');
for(const id of ['workloadAnyQuote714','rebalanceTarget714','rebalanceNote714','rebalanceSave714','resolutionCode714',
  'resolutionSave714','resolutionHistory714','acceptDesktop714','acceptMobile714',
  'ownerAcceptanceForm714','ownerReceipt714','ownerAcceptanceStatus714'])
  assert.match(html,new RegExp(`id="${id}"`));
assert.match(html,/admin-followup-workload-v714\.css/);
assert.match(html,/Awaiting an actual owner walkthrough/);
assert.match(js,/quote_followup_rebalance/);
assert.match(js,/staffBalance714\(roster\?\.eligible_staff/);
assert.match(js,/server_acceptance_recorded:false/);
assert.match(js,/receipt_kind:'owner_self_attested_local_visual_review'/);
assert.match(css,/@media\(max-width:700px\)/);
assert.match(css,/:focus-visible/);
assert.match(read('scripts/current_booking_wizard_regression.sh'),/build714_rebalance_resolution_owner_acceptance_test\.mjs/);
console.log('Build 714 PASS: manager-only live roster, rebalance, stale guards, actual resolution receipts, consent recheck invalidation and manual owner visual acceptance');
