import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {confirmationSnapshot707,CONFIRMATION_EVENT707} from '../assets/quote-reconciliation-v707.mjs';
import {handoffMarker708,HANDOFF_EVENT708} from '../assets/quote-customer-handoff-v708.mjs';
import {FOLLOWUP_EVENT711} from '../assets/quote-followup-aging-v711.mjs';
import {ESCALATION_EVENT712} from '../assets/quote-followup-escalation-v712.mjs';
import {onRequestGet as get711,onRequestPost as post711} from '../functions/api/admin/quote_followup_queue.js';
import {onRequestGet as get712,onRequestPost as post712} from '../functions/api/admin/quote_followup_escalation.js';

const quoteId='a5d187f2-4dd3-41ca-8dc4-c954ab9b053f';
const bookingId='c6f3b426-cd22-4adb-94fb-f16dab4c056e';
const profileId='50da40bf-fc30-4902-bb2e-18c8d95d5e86';
const staffId='ee9448bd-10e9-41c4-a34a-cbf8152c10f2';
const quote={id:quoteId,booking_id:bookingId,quote_number:'RD-712',customer_name:'Alex Example',
  customer_id:profileId,status:'accepted',accepted_amount_cents:25000,
  next_follow_up_at:'2026-10-26T09:00:00Z',created_at:'2026-10-25T09:00:00Z',
  updated_at:'2026-10-30T01:00:00Z'};
const booking={id:bookingId,customer_profile_id:profileId,customer_name:'Alex Example',
  customer_email:'alex@example.test',status:'confirmed',job_status:'scheduled',
  service_date:'2026-11-04',start_slot:'morning',package_code:'premium',vehicle_size:'suv',
  updated_at:'2026-10-30T01:00:00Z'};
let profile={id:profileId,email:'alex@example.test',phone:'5195550101',sms_phone:null,
  notification_opt_in:true,notification_channel:'email',is_active:true,archived_at:null,
  updated_at:'2026-10-30T01:00:00Z'};
const staff={id:staffId,full_name:'Morgan Staff',role_code:'senior_detailer',
  can_manage_bookings:true,is_active:true};
const confirmation={id:crypto.randomUUID(),event_type:CONFIRMATION_EVENT707,
  actor_name:'Staff',created_at:'2026-10-30T01:10:00Z',
  payload:{quote_id:quoteId,booking_id:bookingId,snapshot:confirmationSnapshot707(quote,booking)}};
const handoff={id:crypto.randomUUID(),event_type:HANDOFF_EVENT708,
  actor_name:'Staff',created_at:'2026-10-30T01:20:00Z',
  payload:{quote_id:quoteId,booking_id:bookingId,marker:handoffMarker708({quote,booking},profile,{latest:confirmation},'email')}};
let events=[handoff,confirmation],nextDue=quote.next_follow_up_at;
const env={SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'server-only',
  ADMIN_PASSWORD:'test-only',ALLOW_LEGACY_ADMIN_FALLBACK:'true'};
const url711=`https://rosiedazzlers.ca/api/admin/quote_followup_queue?quote_id=${quoteId}`;
const url712=`https://rosiedazzlers.ca/api/admin/quote_followup_escalation?quote_id=${quoteId}`;
const credential={'x-admin-password':'test-only'};
const getReq=url=>new Request(url,{headers:credential});
const postReq=(url,body)=>new Request(url,{method:'POST',headers:{...credential,'Content-Type':'application/json'},body:JSON.stringify(body)});
const marker711=d=>({quote_id:quoteId,booking_id:bookingId,expected_marker:d.marker,
  expected_latest_outcome_event_id:d.latest_outcome_event_id,
  expected_latest_resolution_event_id:d.latest_resolution_event_id,
  expected_latest_assignment_event_id:d.latest_assignment_event_id,acknowledge_staff_action:true});
const marker712=d=>({quote_id:quoteId,booking_id:bookingId,expected_marker:d.marker,
  expected_latest_outcome_event_id:d.latest_outcome_event_id,
  expected_latest_resolution_event_id:d.latest_resolution_event_id,
  expected_latest_assignment_event_id:d.latest_assignment_event_id,
  expected_latest_consent_recheck_event_id:d.latest_consent_recheck_event_id,
  expected_latest_escalation_event_id:d.latest_escalation_event_id,
  acknowledge_internal_review:true,note:'Reviewed actual overdue follow-up with owner.'});
const ops=[];
const originalFetch=globalThis.fetch;
globalThis.fetch=async(input,options={})=>{
  const target=new URL(String(input)),method=options.method||'GET';
  assert.equal(target.origin,env.SUPABASE_URL);
  ops.push({method,path:target.pathname});
  if(method==='POST'){
    assert.equal(target.pathname,'/rest/v1/booking_events');
    const [event]=JSON.parse(options.body);
    assert.ok([FOLLOWUP_EVENT711,ESCALATION_EVENT712].includes(event.event_type));
    assert.doesNotMatch(JSON.stringify(event),/alex@example\.test|5195550101/);
    if(event.event_type===ESCALATION_EVENT712){
      assert.equal(event.payload.customer_contacted,false);
      assert.equal(event.payload.grants_consent,false);
      assert.equal(event.payload.staff_only,true);
    }
    const saved={...event,id:crypto.randomUUID(),created_at:new Date(Date.now()+events.length*1000).toISOString()};
    events.unshift(saved);return Response.json([saved]);
  }
  if(target.pathname.endsWith('/bookings'))return Response.json([booking]);
  if(target.pathname.endsWith('/customer_profiles'))return Response.json([profile]);
  if(target.pathname.endsWith('/staff_users'))return Response.json([staff]);
  if(target.pathname.endsWith('/booking_events')){
    const filter=target.searchParams.get('event_type')||'';
    if(filter===`eq.${CONFIRMATION_EVENT707}`)return Response.json(events.filter(e=>e.event_type===CONFIRMATION_EVENT707));
    if(filter.includes(ESCALATION_EVENT712))return Response.json(events.filter(e=>
      [FOLLOWUP_EVENT711,ESCALATION_EVENT712].includes(e.event_type)));
    if(filter.includes(FOLLOWUP_EVENT711))return Response.json(events.filter(e=>e.event_type===FOLLOWUP_EVENT711));
    return Response.json(events.filter(e=>e.event_type===HANDOFF_EVENT708));
  }
  if(target.searchParams.has('booking_id'))return Response.json([]);
  return Response.json([{...quote,next_follow_up_at:nextDue}]);
};
try{
  let response=await get712({request:new Request(url712),env});
  assert.equal(response.status,401);
  assert.equal(ops.length,0,'Unauthorized requests never reach source tables');
  response=await get712({request:getReq(url712),env});
  let d=await response.json();
  assert.equal(d.can_escalate,false,'Cannot escalate before real assignment and consent review');
  response=await post712({request:postReq(url712,{...marker712(d),action:'close_audit'}),env});
  assert.equal(response.status,409);
  response=await get711({request:getReq(url711),env});
  let a=await response.json();
  response=await post711({request:postReq(url711,{...marker711(a),action:'assign',assigned_staff_user_id:staffId}),env});
  assert.equal(response.status,200);
  a=await response.json();
  response=await post711({request:postReq(url711,{...marker711(a),action:'recheck_consent'}),env});
  assert.equal(response.status,200);
  response=await get712({request:getReq(url712),env});
  d=await response.json();
  assert.equal(d.can_escalate,true);
  assert.equal(d.recheck_current,true);
  response=await post712({request:postReq(url712,{...marker712(d),action:'escalate',note:'Customer alex@example.test asked for an update.'}),env});
  assert.equal(response.status,400,'Do not store customer contact details in staff audit notes');
  let snap=d;
  response=await post712({request:postReq(url712,{...marker712(d),action:'escalate'}),env});
  assert.equal(response.status,200);
  d=await response.json();
  assert.equal(d.escalation_active,true);
  assert.equal(d.can_review_owner,true);
  response=await post712({request:postReq(url712,{...marker712(snap),action:'review_owner'}),env});
  assert.equal(response.status,409,'Stale event marker must fail');
  response=await post712({request:postReq(url712,{...marker712(d),action:'review_owner'}),env});
  assert.equal(response.status,200);
  d=await response.json();
  assert.equal(d.owner_review_current,true);
  assert.equal(d.can_close_audit,true);
  response=await post712({request:postReq(url712,{...marker712(d),action:'close_audit'}),env});
  assert.equal(response.status,200);
  d=await response.json();
  assert.equal(d.audit_closed,true);
  assert.equal(d.can_escalate,false);
  response=await post712({request:postReq(url712,{...marker712(d),action:'reopen_audit'}),env});
  assert.equal(response.status,200);
  d=await response.json();
  assert.equal(d.audit_closed,false);
  assert.equal(d.owner_review_current,false,'Reopening demands fresh owner review');
  assert.equal(d.can_review_owner,true);
  profile={...profile,notification_opt_in:false,updated_at:'2026-10-30T03:00:00Z'};
  response=await get712({request:getReq(url712),env});
  d=await response.json();
  assert.equal(d.can_escalate,false);
  assert.equal(d.can_close_audit,false);
  assert.equal(d.consent_allowed,false,'Revoked consent never becomes permission');
  assert.equal(d.needs_live_consent_recheck,true);
  assert.ok(ops.every(op=>op.method==='GET'||op.path==='/rest/v1/booking_events'));
}finally{globalThis.fetch=originalFetch;}
const root=resolve(import.meta.dirname,'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
assert.equal(read('admin-quotes.html'),read('admin-quotes/index.html'));
for(const id of ['qEscalationRefresh712','qEscalationStatus712','qEscalationNote712','qEscalate712',
  'qOwnerReview712','qAuditClose712','qAuditReopen712','qEscalationHistory712'])
  assert.match(read('admin-quotes.html'),new RegExp(`id="${id}"`));
for(const [rootPage,aliasPage] of [['admin-analytics.html','admin-analytics/index.html'],
  ['admin-runtime-health.html','admin-runtime-health/index.html']])
  assert.equal(read(rootPage),read(aliasPage));
for(const path of ['admin.html','admin-analytics.html','admin-operations.html',
  'admin-runtime-health.html','admin-system-health.html']){
  assert.match(read(path),/admin-command-surface-v712\.css/);
  assert.match(read(path),/admin-command-surface-v712\.js/);
}
assert.match(read('assets/admin-command-surface-v712.css'),/coating-detail\.webp/);
assert.match(read('assets/admin-command-surface-v712.js'),/No simulated statistics or background polling/);
assert.match(read('admin-analytics.html'),/renderDailyChart712\(analytics\.reports\?\.daily \|\| \[\]\)/);
assert.match(read('scripts/current_booking_wizard_regression.sh'),/build712_escalation_command_test\.mjs/);
console.log('Build 712 PASS: overdue escalation, management review, audit closure/reopening, consent drift, automotive command surfaces');
