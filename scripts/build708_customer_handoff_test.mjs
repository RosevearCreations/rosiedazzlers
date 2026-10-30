import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {confirmationSnapshot707,CONFIRMATION_EVENT707,reconcileQuoteBooking707} from '../assets/quote-reconciliation-v707.mjs';
import {consentReview708,handoffReview708,HANDOFF_EVENT708,CHANGE_FOLLOWUP_EVENT708} from '../assets/quote-customer-handoff-v708.mjs';
import {onRequestGet,onRequestPost} from '../functions/api/admin/quote_customer_handoff.js';

const quoteId='a5d187f2-4dd3-41ca-8dc4-c954ab9b053f';
const bookingId='c6f3b426-cd22-4adb-94fb-f16dab4c056e';
const profileId='50da40bf-fc30-4902-bb2e-18c8d95d5e86';
const quote={id:quoteId,customer_id:profileId,status:'accepted',customer_name:'Alex Example',
  accepted_amount_cents:25000,booking_id:bookingId,updated_at:'2026-10-30T01:00:00Z'};
const booking={id:bookingId,customer_profile_id:profileId,customer_name:'Alex Example',customer_email:'alex@example.test',
  status:'confirmed',job_status:'scheduled',service_date:'2026-11-04',start_slot:'morning',
  vehicle_size:'suv',package_code:'premium',updated_at:'2026-10-30T01:00:00Z'};
const profile={id:profileId,email:'alex@example.test',phone:'5195550101',sms_phone:null,
  notification_opt_in:true,notification_channel:'email',is_active:true,archived_at:null,updated_at:'2026-10-30T01:00:00Z'};
const confirmed={id:'e9df35b8-8743-4686-8af5-9b2b408216ac',event_type:CONFIRMATION_EVENT707,
  created_at:'2026-10-30T01:10:00Z',actor_name:'Staff',
  payload:{quote_id:quoteId,booking_id:bookingId,snapshot:confirmationSnapshot707(quote,booking)}};
const source={quote,booking,others:[],events:[confirmed]};
const reconciled=reconcileQuoteBooking707(quote,booking,[],[confirmed]);
assert.equal(reconciled.notification_ready,true);
assert.equal(consentReview708(quote,booking,profile).allowed,true);
assert.equal(consentReview708(quote,booking,{...profile,notification_opt_in:false}).allowed,false);
assert.equal(consentReview708(quote,booking,{...profile,notification_channel:'push'}).allowed,false);
assert.equal(consentReview708(quote,booking,{...profile,is_active:false}).allowed,false);
assert.equal(consentReview708(quote,booking,{...profile,email:'wrong@example.test'}).allowed,false);
assert.equal(consentReview708(quote,booking,null).allowed,false);
assert.equal(handoffReview708(source,reconciled,profile).ready_to_prepare,true);
assert.equal(handoffReview708(source,reconciled,profile).ready_to_copy,false);

const env={SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'server-only',
  ADMIN_PASSWORD:'test-only',ALLOW_LEGACY_ADMIN_FALLBACK:'true'};
const credential={'x-admin-password':'test-only'};
const url=`https://rosiedazzlers.ca/api/admin/quote_customer_handoff?quote_id=${quoteId}`;
const originalFetch=globalThis.fetch;
let activeBooking={...booking},activeProfile={...profile},events=[confirmed],operations=[],duplicates=[];
globalThis.fetch=async(input,options={})=>{
  const target=new URL(String(input)),method=options.method||'GET';
  operations.push({path:target.pathname,method});
  assert.equal(target.origin,env.SUPABASE_URL,'Private source only');
  assert.match(target.pathname,/^\/rest\/v1\/(quote_pipeline_items|bookings|customer_profiles|booking_events)$/);
  if(method==='POST'){
    assert.equal(target.pathname,'/rest/v1/booking_events','Only append-only staff event writes');
    const [event]=JSON.parse(options.body);
    assert.ok([HANDOFF_EVENT708,CHANGE_FOLLOWUP_EVENT708].includes(event.event_type));
    assert.equal(event.payload.customer_notified,false);
    assert.doesNotMatch(JSON.stringify(event),/alex@example\.test/i,'No recipient PII in staff event');
    const saved={...event,id:crypto.randomUUID(),created_at:new Date(Date.now()+events.length*1000).toISOString()};
    events.unshift(saved);return Response.json([saved]);
  }
  if(target.pathname.endsWith('/bookings'))return Response.json([activeBooking]);
  if(target.pathname.endsWith('/customer_profiles'))return Response.json([activeProfile]);
  if(target.pathname.endsWith('/booking_events')){
    const kind=target.searchParams.get('event_type')||'';
    return Response.json(kind.startsWith('eq.')?events.filter(e=>e.event_type===CONFIRMATION_EVENT707):
      events.filter(e=>e.event_type===HANDOFF_EVENT708||e.event_type===CHANGE_FOLLOWUP_EVENT708));
  }
  if(target.searchParams.has('booking_id'))return Response.json(duplicates);
  return Response.json([quote]);
};
try{
  let response=await onRequestGet({request:new Request(url),env});
  assert.equal(response.status,401,'Authorization required before any source fetch');
  assert.equal(operations.length,0);
  response=await onRequestGet({request:new Request(url,{headers:credential}),env});
  let state=await response.json();
  assert.equal(response.status,200);
  assert.equal(state.ready_to_prepare,true);
  assert.equal(state.ready_to_copy,false);
  assert.equal(state.queues_notification,false);
  const requestFor=payload=>new Request(url,{method:'POST',headers:{...credential,'Content-Type':'application/json'},body:JSON.stringify(payload)});
  const body={quote_id:quoteId,booking_id:bookingId,action:'prepare_handoff',acknowledge_actual_staff_action:true};
  response=await onRequestPost({request:requestFor({...body,acknowledge_actual_staff_action:false}),env});
  assert.equal(response.status,400,'Actual staff acknowledgement required');
  activeProfile={...profile,notification_opt_in:false};
  response=await onRequestPost({request:requestFor(body),env});
  assert.equal(response.status,409,'Opt-out must block record even after prior review');
  activeProfile={...profile};
  response=await onRequestPost({request:requestFor(body),env});
  state=await response.json();
  assert.equal(response.status,200);
  assert.equal(state.recorded,true);
  assert.equal(state.ready_to_copy,true);
  assert.equal(state.sends_email,false);
  assert.equal(events.filter(e=>e.event_type===HANDOFF_EVENT708).length,1);
  response=await onRequestPost({request:requestFor(body),env});
  assert.equal((await response.json()).already_current,true);
  assert.equal(events.filter(e=>e.event_type===HANDOFF_EVENT708).length,1);
  activeBooking={...booking,service_date:'2026-11-06',updated_at:'2026-10-30T03:00:00Z'};
  response=await onRequestGet({request:new Request(url,{headers:credential}),env});
  state=await response.json();
  assert.equal(state.ready_to_copy,false,'Changed booking blocks prior handoff');
  assert.equal(state.change_followup_needed,true);
  response=await onRequestPost({request:requestFor(body),env});
  assert.equal(response.status,409,'Stale staff confirmation blocks new handoff');
  response=await onRequestPost({request:requestFor({...body,action:'log_change_followup'}),env});
  state=await response.json();
  assert.equal(response.status,200);
  assert.equal(state.change_followup_recorded,true);
  assert.equal(state.ready_to_copy,false);
  assert.equal(events.filter(e=>e.event_type===CHANGE_FOLLOWUP_EVENT708).length,1);
  response=await onRequestPost({request:requestFor({...body,action:'log_change_followup'}),env});
  assert.equal((await response.json()).already_current,true);
  assert.equal(events.filter(e=>e.event_type===CHANGE_FOLLOWUP_EVENT708).length,1);
  assert.ok(operations.every(op=>op.method==='GET'||(op.method==='POST'&&op.path.endsWith('/booking_events'))));
}finally{globalThis.fetch=originalFetch;}

const root=resolve(import.meta.dirname,'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
assert.equal(read('admin-quotes.html'),read('admin-quotes/index.html'));
for(const id of ['qHandoffCheck708','qHandoffPrepare708','qHandoffFollowup708','qHandoffStatus708','qHandoffHistory708'])
  assert.match(read('admin-quotes.html'),new RegExp(`id="${id}"`));
const client=read('assets/admin-quotes-v298.js');
assert.match(client,/quote_customer_handoff/);
assert.match(client,/handoff708\?\.ready_to_copy/);
assert.doesNotMatch(client,/localStorage|sessionStorage/);
assert.match(read('scripts/current_booking_wizard_regression.sh'),/build708_customer_handoff_test\.mjs/);
console.log('Build 708 PASS: live explicit consent, no-notification handoff, stale booking follow-up and history');
