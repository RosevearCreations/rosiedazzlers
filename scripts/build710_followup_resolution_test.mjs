import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {confirmationSnapshot707,CONFIRMATION_EVENT707} from '../assets/quote-reconciliation-v707.mjs';
import {handoffMarker708,HANDOFF_EVENT708,CHANGE_FOLLOWUP_EVENT708} from '../assets/quote-customer-handoff-v708.mjs';
import {OUTCOME_EVENT709} from '../assets/quote-communication-outcome-v709.mjs';
import {RESOLUTION_EVENT710} from '../assets/quote-followup-resolution-v710.mjs';
import {onRequestGet,onRequestPost} from '../functions/api/admin/quote_followup_resolution.js';

const quoteId='a5d187f2-4dd3-41ca-8dc4-c954ab9b053f';
const bookingId='c6f3b426-cd22-4adb-94fb-f16dab4c056e';
const profileId='50da40bf-fc30-4902-bb2e-18c8d95d5e86';
const quote={id:quoteId,customer_id:profileId,status:'accepted',customer_name:'Alex Example',
  accepted_amount_cents:25000,booking_id:bookingId,updated_at:'2026-10-30T01:00:00Z'};
const booking={id:bookingId,customer_profile_id:profileId,customer_name:'Alex Example',
  customer_email:'alex@example.test',status:'confirmed',job_status:'scheduled',service_date:'2026-11-04',
  start_slot:'morning',vehicle_size:'suv',package_code:'premium',updated_at:'2026-10-30T01:00:00Z'};
const profile={id:profileId,email:'alex@example.test',phone:'5195550101',sms_phone:null,
  notification_opt_in:true,notification_channel:'email',is_active:true,archived_at:null,
  updated_at:'2026-10-30T01:00:00Z'};
const confirmation={id:crypto.randomUUID(),event_type:CONFIRMATION_EVENT707,
  created_at:'2026-10-30T01:10:00Z',actor_name:'Staff',
  payload:{quote_id:quoteId,booking_id:bookingId,snapshot:confirmationSnapshot707(quote,booking)}};
const marker=handoffMarker708({quote,booking},profile,{latest:confirmation},'email');
const prepared={id:crypto.randomUUID(),event_type:HANDOFF_EVENT708,
  created_at:'2026-10-30T01:20:00Z',actor_name:'Staff',
  payload:{quote_id:quoteId,booking_id:bookingId,marker,customer_notified:false}};
const bookingFollowup={id:crypto.randomUUID(),event_type:CHANGE_FOLLOWUP_EVENT708,
  created_at:'2026-10-30T01:25:00Z',actor_name:'Staff',
  payload:{quote_id:quoteId,booking_id:bookingId,marker:{quote_id:quoteId,booking_id:bookingId,
    quote_updated_at:quote.updated_at,booking_updated_at:booking.updated_at}}};
const env={SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'server-only',
  ADMIN_PASSWORD:'test-only',ALLOW_LEGACY_ADMIN_FALLBACK:'true'};
const credential={'x-admin-password':'test-only'};
const url=`https://rosiedazzlers.ca/api/admin/quote_followup_resolution?quote_id=${quoteId}`;
const requestGet=()=>new Request(url,{headers:credential});
const requestPost=body=>new Request(url,{method:'POST',headers:{...credential,'Content-Type':'application/json'},
  body:JSON.stringify(body)});
let activeBooking={...booking},activeProfile={...profile},events=[bookingFollowup,prepared,confirmation];
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
    assert.equal(event.event_type,RESOLUTION_EVENT710);
    assert.equal(event.payload.provider_delivery_verified,false);
    assert.equal(event.payload.staff_review_only,true);
    assert.equal(event.payload.customer_notified_by_this_action,false);
    assert.doesNotMatch(JSON.stringify(event),/alex@example\.test|5195550101/);
    const saved={...event,id:crypto.randomUUID(),created_at:new Date(Date.now()+events.length*1000).toISOString()};
    events.unshift(saved);return Response.json([saved]);
  }
  if(target.pathname.endsWith('/bookings'))return Response.json([activeBooking]);
  if(target.pathname.endsWith('/customer_profiles'))return Response.json([activeProfile]);
  if(target.pathname.endsWith('/booking_events')){
    const filter=target.searchParams.get('event_type')||'';
    if(filter===`eq.${CONFIRMATION_EVENT707}`)return Response.json(events.filter(e=>e.event_type===CONFIRMATION_EVENT707));
    if(filter.includes(OUTCOME_EVENT709)&&filter.includes(RESOLUTION_EVENT710))
      return Response.json(events.filter(e=>[OUTCOME_EVENT709,RESOLUTION_EVENT710].includes(e.event_type)));
    return Response.json(events.filter(e=>[HANDOFF_EVENT708,CHANGE_FOLLOWUP_EVENT708].includes(e.event_type)));
  }
  if(target.searchParams.has('booking_id'))return Response.json([]);
  return Response.json([quote]);
};

const expected=data=>({quote_id:quoteId,booking_id:bookingId,
  expected_marker:data.marker,expected_latest_outcome_event_id:data.latest_outcome_event_id,
  expected_latest_resolution_event_id:data.latest_resolution_event_id,
  acknowledge_staff_review:true,note:'Reviewed by staff; no customer contact required.'});
try{
  let response=await onRequestGet({request:new Request(url),env});
  assert.equal(response.status,401,'Unauthenticated requests cannot read consent or closure history');
  assert.equal(ops.length,0);
  response=await onRequestGet({request:requestGet(),env});
  let readback=await response.json();
  assert.equal(response.status,200);
  assert.equal(readback.can_close_no_contact,true);
  assert.equal(readback.can_close_reply,false);
  assert.equal(readback.closure_current,false);
  assert.equal(readback.provider_delivery_verified,false);
  assert.equal(readback.prior_consent_is_inferred,false);
  assert.ok(readback.consent_audit.some(e=>e.is_live));
  assert.ok(readback.consent_audit.some(e=>e.source===CHANGE_FOLLOWUP_EVENT708&&
    !e.changes.some(change=>change.includes('channel')||change.includes('profile'))),
  'Partial booking follow-up snapshots cannot imply consent changes');
  response=await onRequestPost({request:requestPost({...expected(readback),action:'close',reason:'customer_response_reviewed'}),env});
  assert.equal(response.status,409,'Cannot claim a response without a current actual staff outcome');
  response=await onRequestPost({request:requestPost({...expected(readback),action:'close',reason:'no_contact_required',note:'short'}),env});
  assert.equal(response.status,400);
  response=await onRequestPost({request:requestPost({...expected(readback),action:'close',reason:'no_contact_required',note:'Email alex@example.test about closure.'}),env});
  assert.equal(response.status,400,'Do not store customer contact details in rationale');

  const stale=readback;
  activeProfile={...profile,notification_opt_in:false,updated_at:'2026-10-30T03:00:00Z'};
  response=await onRequestPost({request:requestPost({...expected(stale),action:'close',reason:'contact_not_permitted'}),env});
  assert.equal(response.status,409,'Live opt-out invalidates an old snapshot');
  response=await onRequestGet({request:requestGet(),env});
  readback=await response.json();
  assert.equal(readback.can_close_opt_out,true);
  assert.equal(readback.current_consent_allowed,false);
  assert.ok(readback.consent_audit[0].changes.some(change=>change.includes('profile updated')));
  response=await onRequestPost({request:requestPost({...expected(readback),action:'close',reason:'contact_not_permitted'}),env});
  assert.equal(response.status,200);
  let recorded=await response.json();
  assert.equal(recorded.recorded,true);
  assert.equal(recorded.closure_current,true);
  assert.equal(recorded.requires_followup,false);
  assert.equal(recorded.can_reopen,true);
  assert.equal(recorded.latest_resolution.reason,'contact_not_permitted');
  response=await onRequestPost({request:requestPost({...expected(recorded),action:'close',reason:'contact_not_permitted'}),env});
  assert.equal((await response.json()).already_current,true,'Duplicate closure is idempotent');
  response=await onRequestPost({request:requestPost({...expected(stale),action:'reopen',reason:''}),env});
  assert.equal(response.status,409,'Reopen must use the fresh closure event ID');
  response=await onRequestPost({request:requestPost({...expected(recorded),action:'reopen',reason:'',
    note:'Reviewed the case again and reopened staff follow-up.'}),env});
  assert.equal(response.status,200);
  let reopened=await response.json();
  assert.equal(reopened.closure_current,false);
  assert.equal(reopened.requires_followup,true);
  assert.equal(reopened.can_reopen,false);
  assert.equal(reopened.history.length,2);

  activeProfile={...profile};
  response=await onRequestGet({request:requestGet(),env});
  readback=await response.json();
  assert.equal(readback.can_close_opt_out,false);
  events.unshift({id:crypto.randomUUID(),event_type:OUTCOME_EVENT709,
    created_at:new Date(Date.now()+events.length*1000).toISOString(),actor_name:'Staff',
    payload:{quote_id:quoteId,booking_id:bookingId,status:'customer_replied_staff_reported',marker:readback.marker,
      staff_report_unverified:true,provider_delivery_verified:false}});
  response=await onRequestGet({request:requestGet(),env});
  readback=await response.json();
  assert.equal(readback.can_close_reply,true);
  response=await onRequestPost({request:requestPost({...expected(readback),action:'close',
    reason:'customer_response_reviewed',note:'Staff directly reviewed a reply; delivery still unverified.'}),env});
  assert.equal(response.status,200);
  recorded=await response.json();
  assert.equal(recorded.closure_current,true);
  activeBooking={...booking,updated_at:'2026-10-30T09:00:00Z',service_date:'2026-11-09'};
  response=await onRequestGet({request:requestGet(),env});
  readback=await response.json();
  assert.equal(readback.closure_current,false,'Changed booking invalidates previous closure');
  assert.equal(readback.requires_followup,true);
  assert.ok(readback.consent_alerts.some(a=>a.includes('previous follow-up closure')));
  response=await onRequestPost({request:requestPost({...expected(recorded),action:'reopen',reason:''}),env});
  assert.equal(response.status,409);
  assert.ok(ops.every(op=>op.method==='GET'||(op.method==='POST'&&op.path==='/rest/v1/booking_events')));
}finally{globalThis.fetch=originalFetch;}

const root=resolve(import.meta.dirname,'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
assert.equal(read('admin-quotes.html'),read('admin-quotes/index.html'));
for(const id of ['qResolutionCheck710','qResolutionReason710','qResolutionNote710',
  'qResolutionClose710','qResolutionReopen710','qResolutionStatus710',
  'qConsentAudit710','qResolutionHistory710'])
  assert.match(read('admin-quotes.html'),new RegExp(`id="${id}"`));
assert.match(read('admin-quotes.html'),/data-build710-followup-resolution/);
assert.match(read('assets/admin-quotes-v298.js'),/quote_followup_resolution/);
assert.match(read('scripts/current_booking_wizard_regression.sh'),/build710_followup_resolution_test\.mjs/);
console.log('Build 710 PASS: protected staff closure, opt-out, stale readback, consent audit and reopening');
