import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {confirmationSnapshot707,CONFIRMATION_EVENT707} from '../assets/quote-reconciliation-v707.mjs';
import {handoffMarker708,HANDOFF_EVENT708} from '../assets/quote-customer-handoff-v708.mjs';
import {OUTCOME_EVENT709,OUTCOME_STATUSES709} from '../assets/quote-communication-outcome-v709.mjs';
import {onRequestGet,onRequestPost} from '../functions/api/admin/quote_communication_outcome.js';

const quoteId='a5d187f2-4dd3-41ca-8dc4-c954ab9b053f';
const bookingId='c6f3b426-cd22-4adb-94fb-f16dab4c056e';
const profileId='50da40bf-fc30-4902-bb2e-18c8d95d5e86';
const quote={id:quoteId,customer_id:profileId,status:'accepted',customer_name:'Alex Example',
  accepted_amount_cents:25000,booking_id:bookingId,updated_at:'2026-10-30T01:00:00Z'};
const booking={id:bookingId,customer_profile_id:profileId,customer_name:'Alex Example',
  customer_email:'alex@example.test',status:'confirmed',job_status:'scheduled',service_date:'2026-11-04',
  start_slot:'morning',vehicle_size:'suv',package_code:'premium',updated_at:'2026-10-30T01:00:00Z'};
const profile={id:profileId,email:'alex@example.test',phone:'5195550101',sms_phone:null,
  notification_opt_in:true,notification_channel:'email',is_active:true,archived_at:null,updated_at:'2026-10-30T01:00:00Z'};
const confirmation={id:crypto.randomUUID(),event_type:CONFIRMATION_EVENT707,
  created_at:'2026-10-30T01:10:00Z',actor_name:'Staff',
  payload:{quote_id:quoteId,booking_id:bookingId,snapshot:confirmationSnapshot707(quote,booking)}};
const marker=handoffMarker708({quote,booking},profile,{latest:confirmation},'email');
const prepared={id:crypto.randomUUID(),event_type:HANDOFF_EVENT708,
  created_at:'2026-10-30T01:20:00Z',actor_name:'Staff',
  payload:{quote_id:quoteId,booking_id:bookingId,marker,customer_notified:false}};
const env={SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'server-only',
  ADMIN_PASSWORD:'test-only',ALLOW_LEGACY_ADMIN_FALLBACK:'true'};
const credential={'x-admin-password':'test-only'};
const url=`https://rosiedazzlers.ca/api/admin/quote_communication_outcome?quote_id=${quoteId}`;
const requestGet=()=>new Request(url,{headers:credential});
const requestPost=body=>new Request(url,{method:'POST',headers:{...credential,'Content-Type':'application/json'},
  body:JSON.stringify(body)});
let activeBooking={...booking},activeProfile={...profile},duplicates=[],events=[prepared,confirmation];
const ops=[];
const originalFetch=globalThis.fetch;
globalThis.fetch=async(input,options={})=>{
  const target=new URL(String(input)),method=options.method||'GET';
  ops.push({method,path:target.pathname});
  assert.equal(target.origin,env.SUPABASE_URL);
  assert.match(target.pathname,/^\/rest\/v1\/(quote_pipeline_items|bookings|customer_profiles|booking_events)$/);
  if(method==='POST'){
    assert.equal(target.pathname,'/rest/v1/booking_events');
    const [event]=JSON.parse(options.body);
    assert.equal(event.event_type,OUTCOME_EVENT709);
    assert.ok(Object.hasOwn(OUTCOME_STATUSES709,event.payload.status));
    assert.equal(event.payload.provider_delivery_verified,false);
    assert.equal(event.payload.staff_report_unverified,true);
    assert.equal(event.payload.customer_notified_by_this_action,false);
    assert.doesNotMatch(JSON.stringify(event),/alex@example\.test|5195550101/);
    const saved={...event,id:crypto.randomUUID(),created_at:new Date(Date.now()+events.length*1000).toISOString()};
    events.unshift(saved);return Response.json([saved]);
  }
  if(target.pathname.endsWith('/bookings'))return Response.json([activeBooking]);
  if(target.pathname.endsWith('/customer_profiles'))return Response.json([activeProfile]);
  if(target.pathname.endsWith('/booking_events')){
    const kind=target.searchParams.get('event_type')||'';
    if(kind===`eq.${CONFIRMATION_EVENT707}`)return Response.json(events.filter(e=>e.event_type===CONFIRMATION_EVENT707));
    if(kind===`eq.${OUTCOME_EVENT709}`)return Response.json(events.filter(e=>e.event_type===OUTCOME_EVENT709));
    return Response.json(events.filter(e=>e.event_type===HANDOFF_EVENT708));
  }
  if(target.searchParams.has('booking_id'))return Response.json(duplicates);
  return Response.json([quote]);
};
try{
  let response=await onRequestGet({request:new Request(url),env});
  assert.equal(response.status,401,'Staff authorization precedes any data fetch');
  assert.equal(ops.length,0);
  response=await onRequestGet({request:requestGet(),env});
  let readback=await response.json();
  assert.equal(response.status,200);
  assert.equal(readback.can_record_contact_outcome,true);
  assert.equal(readback.requires_followup,true,'No actual outcome documented yet');
  assert.equal(readback.provider_delivery_verified,false);
  const body={quote_id:quoteId,booking_id:bookingId,status:'manual_attempt_reported_unverified',
    expected_marker:readback.marker,expected_handoff_event_id:readback.handoff_event_id,
    acknowledge_staff_report:true};
  response=await onRequestPost({request:requestPost({...body,acknowledge_staff_report:false}),env});
  assert.equal(response.status,400);
  activeProfile={...profile,notification_opt_in:false,updated_at:'2026-10-30T03:00:00Z'};
  response=await onRequestPost({request:requestPost(body),env});
  assert.equal(response.status,409,'Revoked consent blocks even previously prepared attempt');
  response=await onRequestGet({request:requestGet(),env});
  readback=await response.json();
  assert.equal(readback.can_record_contact_outcome,false);
  assert.ok(readback.consent_alerts.some(a=>a.includes('customer profile changed')));
  assert.ok(readback.consent_alerts.some(a=>a.includes('consent does not allow')));
  response=await onRequestPost({request:requestPost({...body,status:'follow_up_needed'}),env});
  assert.equal(response.status,409,'Stale readback fails even for safe follow-up');
  response=await onRequestPost({request:requestPost({...body,status:'follow_up_needed',
    expected_marker:readback.marker}),env});
  assert.equal(response.status,200,'Staff may log follow-up despite revoked consent');
  assert.equal((await response.json()).recorded,true);
  activeProfile={...profile,notification_channel:'sms',updated_at:'2026-10-30T04:00:00Z'};
  response=await onRequestGet({request:requestGet(),env});
  readback=await response.json();
  assert.ok(readback.consent_alerts.some(a=>a.includes('preferred communication channel changed')));
  assert.equal(readback.can_record_contact_outcome,false,'Changed channel invalidates handoff');
  activeProfile={...profile};
  response=await onRequestGet({request:requestGet(),env});
  readback=await response.json();
  response=await onRequestPost({request:requestPost({...body,expected_marker:readback.marker,
    expected_handoff_event_id:readback.handoff_event_id}),env});
  assert.equal(response.status,200);
  let recorded=await response.json();
  assert.equal(recorded.recorded,true);
  assert.equal(recorded.latest_outcome.status,'manual_attempt_reported_unverified');
  assert.equal(recorded.provider_delivery_verified,false);
  response=await onRequestPost({request:requestPost(body),env});
  assert.equal((await response.json()).already_current,true,'Same live status is idempotent');
  activeBooking={...booking,updated_at:'2026-10-30T09:00:00Z',service_date:'2026-11-09'};
  response=await onRequestGet({request:requestGet(),env});
  readback=await response.json();
  assert.equal(readback.latest_current,false,'Changed booking invalidates outcome');
  assert.equal(readback.requires_followup,true);
  assert.equal(readback.can_record_contact_outcome,false);
  response=await onRequestPost({request:requestPost(body),env});
  assert.equal(response.status,409);
  assert.ok(ops.every(op=>op.method==='GET'||(op.method==='POST'&&op.path==='/rest/v1/booking_events')));
}finally{globalThis.fetch=originalFetch;}

const root=resolve(import.meta.dirname,'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
assert.equal(read('admin-quotes.html'),read('admin-quotes/index.html'));
for(const id of ['qOutcomeCheck709','qOutcomeType709','qOutcomeRecord709','qOutcomeStatus709','qOutcomeHistory709'])
  assert.match(read('admin-quotes.html'),new RegExp(`id="${id}"`));
assert.match(read('admin-quotes.html'),/data-build709-communication-outcomes/);
assert.match(read('assets/admin-quotes-v298.js'),/quote_communication_outcome/);
assert.match(read('scripts/current_booking_wizard_regression.sh'),/build709_communication_outcome_test\.mjs/);
console.log('Build 709 PASS: authenticated staff-only outcomes, opt-out/channel drift, stale booking and unverified delivery');
