import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {confirmationSnapshot707,CONFIRMATION_EVENT707} from '../assets/quote-reconciliation-v707.mjs';
import {handoffMarker708,HANDOFF_EVENT708} from '../assets/quote-customer-handoff-v708.mjs';
import {RESOLUTION_EVENT710} from '../assets/quote-followup-resolution-v710.mjs';
import {FOLLOWUP_EVENT711,agingQueue711} from '../assets/quote-followup-aging-v711.mjs';
import {onRequestGet,onRequestPost} from '../functions/api/admin/quote_followup_queue.js';

const quoteId='a5d187f2-4dd3-41ca-8dc4-c954ab9b053f',
  bookingId='c6f3b426-cd22-4adb-94fb-f16dab4c056e',
  profileId='50da40bf-fc30-4902-bb2e-18c8d95d5e86',
  staffId='ee9448bd-10e9-41c4-a34a-cbf8152c10f2';
const quote={id:quoteId,customer_id:profileId,status:'accepted',customer_name:'Alex Example',
  accepted_amount_cents:25000,booking_id:bookingId,quote_number:'RD-711',
  next_follow_up_at:'2026-10-26T09:00:00Z',created_at:'2026-10-25T09:00:00Z',
  updated_at:'2026-10-30T01:00:00Z'};
const booking={id:bookingId,customer_profile_id:profileId,customer_name:'Alex Example',
  customer_email:'alex@example.test',status:'confirmed',job_status:'scheduled',service_date:'2026-11-04',
  start_slot:'morning',package_code:'premium',vehicle_size:'suv',updated_at:'2026-10-30T01:00:00Z'};
const profile={id:profileId,email:'alex@example.test',phone:'5195550101',sms_phone:null,
  notification_opt_in:true,notification_channel:'email',is_active:true,archived_at:null,
  updated_at:'2026-10-30T01:00:00Z'};
const staff={id:staffId,full_name:'Morgan Staff',role_code:'senior_detailer',is_active:true,can_manage_bookings:true};
const confirmation={id:crypto.randomUUID(),event_type:CONFIRMATION_EVENT707,
  created_at:'2026-10-30T01:10:00Z',actor_name:'Staff',
  payload:{quote_id:quoteId,booking_id:bookingId,snapshot:confirmationSnapshot707(quote,booking)}};
const marker=handoffMarker708({quote,booking},profile,{latest:confirmation},'email');
const handoff={id:crypto.randomUUID(),event_type:HANDOFF_EVENT708,
  created_at:'2026-10-30T01:20:00Z',actor_name:'Staff',
  payload:{quote_id:quoteId,booking_id:bookingId,marker}};
const env={SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'server-only',
  ADMIN_PASSWORD:'test-only',ALLOW_LEGACY_ADMIN_FALLBACK:'true'};
const credential={'x-admin-password':'test-only'};
const url=`https://rosiedazzlers.ca/api/admin/quote_followup_queue?quote_id=${quoteId}`;
const requestGet=(detail=true)=>new Request(detail?url:'https://rosiedazzlers.ca/api/admin/quote_followup_queue',{headers:credential});
const requestPost=body=>new Request(url,{method:'POST',headers:{...credential,'Content-Type':'application/json'},
  body:JSON.stringify(body)});
let activeBooking={...booking},activeProfile={...profile},activeStaff={...staff},events=[handoff,confirmation];
const ops=[];
const originalFetch=globalThis.fetch;
globalThis.fetch=async(input,options={})=>{
  const target=new URL(String(input)),method=options.method||'GET';
  ops.push({method,path:target.pathname});
  assert.equal(target.origin,env.SUPABASE_URL);
  assert.match(target.pathname,/^\/rest\/v1\/(quote_pipeline_items|bookings|customer_profiles|booking_events|staff_users)$/);
  if(method==='POST'){
    assert.equal(target.pathname,'/rest/v1/booking_events');
    const [event]=JSON.parse(options.body);
    assert.equal(event.event_type,FOLLOWUP_EVENT711);
    assert.equal(event.payload.provider_delivery_verified,false);
    assert.equal(event.payload.customer_notified_by_this_action,false);
    assert.doesNotMatch(JSON.stringify(event),/alex@example\.test|5195550101/);
    const saved={...event,id:crypto.randomUUID(),created_at:new Date(Date.now()+events.length*1000).toISOString()};
    events.unshift(saved);return Response.json([saved]);
  }
  if(target.pathname.endsWith('/bookings'))return Response.json([activeBooking]);
  if(target.pathname.endsWith('/customer_profiles'))return Response.json([activeProfile]);
  if(target.pathname.endsWith('/staff_users'))return Response.json(activeStaff?.is_active?[activeStaff]:[]);
  if(target.pathname.endsWith('/booking_events')){
    const filter=target.searchParams.get('event_type')||'';
    if(filter===`eq.${CONFIRMATION_EVENT707}`)return Response.json(events.filter(e=>e.event_type===CONFIRMATION_EVENT707));
    if(filter===`eq.${FOLLOWUP_EVENT711}`)return Response.json(events.filter(e=>e.event_type===FOLLOWUP_EVENT711));
    if(filter.includes(FOLLOWUP_EVENT711))return Response.json(events.filter(e=>
      [FOLLOWUP_EVENT711,RESOLUTION_EVENT710].includes(e.event_type)));
    return Response.json(events.filter(e=>e.event_type===HANDOFF_EVENT708));
  }
  if(target.searchParams.has('booking_id'))return Response.json([]);
  return Response.json([quote]);
};
const expected=data=>({quote_id:quoteId,booking_id:bookingId,
  expected_marker:data.marker,expected_latest_outcome_event_id:data.latest_outcome_event_id,
  expected_latest_resolution_event_id:data.latest_resolution_event_id,
  expected_latest_assignment_event_id:data.latest_assignment_event_id,
  acknowledge_staff_action:true});
try{
  const direct=agingQueue711([quote,{id:crypto.randomUUID(),status:'declined'}],[],new Date('2026-10-30T12:00:00Z'));
  assert.equal(direct.summary.critical,1);
  assert.equal(direct.summary.unassigned,1);
  assert.equal(direct.items[0].age_days,4);
  assert.equal(direct.items[0].live_consent_not_verified_by_queue,true);
  let response=await onRequestGet({request:new Request(url),env});
  assert.equal(response.status,401,'Staff auth precedes any source access');
  assert.equal(ops.length,0);
  response=await onRequestGet({request:requestGet(false),env});
  let data=await response.json();
  assert.equal(data.summary.total,1);
  assert.equal(data.live_consent_verified,false);
  response=await onRequestGet({request:requestGet(),env});
  let readback=await response.json();
  assert.equal(readback.can_assign,true);
  assert.equal(readback.can_recheck,false);
  assert.equal(readback.assigned_staff_user_id,null);
  assert.equal(readback.provider_delivery_verified,false);
  response=await onRequestPost({request:requestPost({...expected(readback),action:'assign',assigned_staff_user_id:'bad'}),env});
  assert.equal(response.status,400);
  activeStaff={...staff,is_active:false};
  response=await onRequestPost({request:requestPost({...expected(readback),action:'assign',assigned_staff_user_id:staffId}),env});
  assert.equal(response.status,409,'Cannot assign inactive staff');
  activeStaff={...staff};
  response=await onRequestPost({request:requestPost({...expected(readback),action:'assign',assigned_staff_user_id:staffId}),env});
  assert.equal(response.status,200);
  let saved=await response.json();
  assert.equal(saved.recorded,true);
  assert.equal(saved.assigned_staff_user_id,staffId);
  assert.equal(saved.can_recheck,true);
  response=await onRequestPost({request:requestPost({...expected(saved),action:'assign',assigned_staff_user_id:staffId}),env});
  assert.equal((await response.json()).already_current,true,'Same current assignment is idempotent');
  response=await onRequestPost({request:requestPost({...expected(readback),action:'recheck_consent'}),env});
  assert.equal(response.status,409,'Old assignment marker cannot authorize a recheck');
  response=await onRequestPost({request:requestPost({...expected(saved),action:'recheck_consent'}),env});
  assert.equal(response.status,200);
  let checked=await response.json();
  assert.equal(checked.recheck_current,true);
  assert.equal(checked.latest_consent_recheck.consent_allowed_at_review,true);

  activeProfile={...profile,notification_opt_in:false,updated_at:'2026-10-30T03:00:00Z'};
  response=await onRequestGet({request:requestGet(),env});
  readback=await response.json();
  assert.equal(readback.assignment_current,false);
  assert.equal(readback.recheck_current,false);
  assert.equal(readback.current_consent_allowed,false);
  assert.equal(readback.can_recheck,false,'Changed consent requires a fresh assignment review');
  response=await onRequestPost({request:requestPost({...expected(checked),action:'recheck_consent'}),env});
  assert.equal(response.status,409);
  response=await onRequestPost({request:requestPost({...expected(readback),action:'assign',assigned_staff_user_id:staffId}),env});
  assert.equal(response.status,200);
  saved=await response.json();
  response=await onRequestPost({request:requestPost({...expected(saved),action:'recheck_consent'}),env});
  assert.equal(response.status,200);
  checked=await response.json();
  assert.equal(checked.recheck_current,true);
  assert.equal(checked.latest_consent_recheck.consent_allowed_at_review,false,'Opt-out is documented, not overridden');
  response=await onRequestPost({request:requestPost({...expected(checked),action:'unassign'}),env});
  assert.equal(response.status,200);
  saved=await response.json();
  assert.equal(saved.assigned_staff_user_id,null);
  assert.equal(saved.can_recheck,false);
  assert.ok(ops.every(op=>op.method==='GET'||(op.method==='POST'&&op.path==='/rest/v1/booking_events')));
}finally{globalThis.fetch=originalFetch;}

const root=resolve(import.meta.dirname,'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
assert.equal(read('admin-quotes.html'),read('admin-quotes/index.html'));
for(const id of ['qAgingRefresh711','qAgingSummary711','qAgingQueue711','qAssignee711',
  'qAssign711','qUnassign711','qConsentRecheck711','qAssignmentStatus711','qAssignmentHistory711'])
  assert.match(read('admin-quotes.html'),new RegExp(`id="${id}"`));
assert.match(read('assets/admin-quotes-v298.js'),/quote_followup_queue/);
assert.match(read('scripts/current_booking_wizard_regression.sh'),/build711_followup_queue_test\.mjs/);
console.log('Build 711 PASS: aging, real staff assignment, fresh consent rechecks, opt-out and no sending');
