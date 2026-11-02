import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  classifyPurpose743, evaluateConsent743, deliveryEvidence743, staffNextAction743,
  PREFERENCE_FIELDS743
} from '../assets/notification-consent-preview-v743.mjs';
import { loadCustomerCommunicationDispatchGate } from '../functions/api/_lib/customer-communication-consent.js';
import { onRequestGet as customerGet, onRequestPost as customerPost } from '../functions/api/client/notification_preferences_v743.js';
import { onRequestGet as staffGet, onRequestPost as staffPost } from '../functions/api/admin/notification_preview_v743.js';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const customerId = '5fd62295-1f83-4507-bf6f-bd5e1abb9fed';
const staffId = 'e97e48bf-4571-4e48-973f-285edda643ca';
const notificationId = '0a84b1d8-8a98-45dc-b5c1-3eaabce7b0cd';
const marketingId = 'd7aa9520-5108-441d-bb69-45cd854e5ca0';
const requestId = '166cd852-784d-4244-a793-3dde8d273348';
const env = { SUPABASE_URL: 'https://db.mock.invalid', SUPABASE_SERVICE_ROLE_KEY: 'only-test-key' };
const customerURL = 'https://rosiedazzlers.ca/api/client/notification_preferences_v743';
const staffURL = 'https://rosiedazzlers.ca/api/admin/notification_preview_v743';
const profile = { id: customerId, email:'owner@example.com', phone:'5195550199', sms_phone:null,
  notification_opt_in:true, notification_channel:'email', is_active:true };
const staff = { id:staffId, full_name:'Authenticated Admin', email:'admin@example.com', role_code:'admin',
  is_active:true, can_manage_bookings:true };
const serviceEvent = { id:notificationId, created_at:'2030-04-03T10:00:00Z', event_type:'quote_deposit_receipt_email',
  channel:'email', status:'sent', sent_at:null, processed_at:null, attempt_count:1, customer_profile_id:customerId,
  recipient_email:profile.email, recipient_phone:null, provider_response:{secret:'PROVIDER_PRIVATE_TOKEN'},
  payload:{body:'SECRET QUEUED MESSAGE', communication_purpose:'service'} };
const marketingEvent = { ...serviceEvent, id:marketingId, event_type:'maintenance_plan_reminder_email',
  status:'queued', sent_at:null, provider_response:null,
  payload:{message:'SECRET MARKETING BODY', communication_purpose:'marketing'} };
let preferences = [];
let handoffs = [];
let activeProfile = {...profile};
let sessionPresent = true;
let attemptedPosts = [];
let rawReads = [];
const originalFetch = globalThis.fetch;

const responseRows = (rows, status=200) => Response.json(rows, {status});
const mockFetch = async (input, options={}) => {
  const target = new URL(input);
  assert.equal(target.origin, env.SUPABASE_URL);
  const table = target.pathname.split('/').pop();
  const method = options.method || 'GET';
  if (method === 'POST') {
    assert.ok(['customer_communication_preference_versions','customer_communication_handoff_audit'].includes(table),
      `Unexpected write endpoint: ${table}`);
    const row = JSON.parse(options.body)[0];
    attemptedPosts.push({ table, row });
    const saved = {...row, id:crypto.randomUUID(), recorded_at:'2030-04-04T13:00:00Z'};
    if (table === 'customer_communication_preference_versions') preferences.unshift(saved);
    else handoffs.unshift(saved);
    return responseRows([saved],201);
  }
  assert.equal(method,'GET');
  rawReads.push(target.pathname);
  if (table === 'customer_auth_sessions') {
    return responseRows(sessionPresent ? [{ id:requestId, expires_at:'2031-01-01T00:00:00Z', revoked_at:null,
      customer_profile:{...activeProfile} }] : []);
  }
  if (table === 'staff_users') return responseRows([staff]);
  if (table === 'customer_profiles') return responseRows([activeProfile]);
  if (table === 'notification_events') {
    if (!target.searchParams.has('id')) assert.equal(target.searchParams.get('channel'),'in.(email,sms)','Preview excludes push and unsupported channels');
    if (target.searchParams.get('id') === `eq.${notificationId}`) return responseRows([serviceEvent]);
    if (target.searchParams.get('id') === `eq.${marketingId}`) return responseRows([marketingEvent]);
    return responseRows([serviceEvent, marketingEvent]);
  }
  if (table === 'customer_communication_preference_versions') {
    const queryRequestId = target.searchParams.get('client_request_id');
    return responseRows(queryRequestId ? preferences.filter(row=>row.client_request_id===queryRequestId.slice(3)) : preferences);
  }
  if (table === 'customer_communication_handoff_audit') {
    const queryRequestId = target.searchParams.get('client_request_id');
    return responseRows(queryRequestId ? handoffs.filter(row=>row.client_request_id===queryRequestId.slice(3)) : handoffs);
  }
  throw new Error(`Unexpected source ${table}`);
};

const customerContext = () => ({ request:new Request(customerURL,{headers:{cookie:'rd_client_session=test-cookie'}}),env });
const customerWrite = (data,{origin='https://rosiedazzlers.ca',cookie=true}={}) => ({request:new Request(customerURL,{
  method:'POST', headers:{'Content-Type':'application/json',Origin:origin,...(cookie?{Cookie:'rd_client_session=test-cookie'}:{})},body:JSON.stringify(data)
}),env});
const staffContext = (authorized=true) => ({request:new Request(staffURL,{headers:authorized?{'x-staff-user-id':staffId}:{}}),env});
const staffWrite = (data,{origin='https://rosiedazzlers.ca',authorized=true}={}) => ({request:new Request(staffURL,{
  method:'POST',headers:{'Content-Type':'application/json',Origin:origin,...(authorized?{'x-staff-user-id':staffId}:{})},body:JSON.stringify(data)
}),env});
const choices = Object.fromEntries(PREFERENCE_FIELDS743.map(key=>[key,false]));
const selected = {...choices,service_email:true,service_phone:true,marketing_email:true};

// Consent matrix: no marketing inference, existing service fallback, opt-out and
// recipient mismatches always win over an apparent send or staff assertion.
assert.equal(classifyPurpose743(serviceEvent),'service');
assert.equal(classifyPurpose743(marketingEvent),'marketing');
assert.equal(classifyPurpose743({event_type:'misc_unclassified'}),'unclassified');
assert.equal(evaluateConsent743({profile,channel:'email',purpose:'service'}).allowed,true);
assert.equal(evaluateConsent743({profile,channel:'email',purpose:'marketing'}).allowed,false);
assert.equal(evaluateConsent743({profile,channel:'phone',purpose:'service'}).allowed,false);
assert.equal(evaluateConsent743({profile,preference:{...selected,service_email:false},channel:'email',purpose:'service'}).reason,'channel_opted_out');
assert.equal(evaluateConsent743({profile:{...profile,notification_opt_in:false},preference:selected,channel:'email',purpose:'marketing'}).reason,'global_opt_out');
assert.equal(evaluateConsent743({profile,preference:selected,channel:'email',purpose:'service',recipientEmail:'different@example.com'}).allowed,false);
assert.equal(evaluateConsent743({profile,preference:selected,channel:'sms',purpose:'marketing'}).allowed,false);
assert.equal(evaluateConsent743({profile,preference:selected,channel:'phone',purpose:'service'}).allowed,true);
assert.equal(deliveryEvidence743(serviceEvent).state,'status_unverified');
assert.equal(deliveryEvidence743({...serviceEvent,sent_at:'2030-04-03T10:01:00Z'}).state,'handoff_unverified');
assert.equal(deliveryEvidence743({...serviceEvent,status:'delivered'}).definitive_delivery,false);
assert.equal(deliveryEvidence743({...serviceEvent,status:'failed',sent_at:null}).state,'not_sent_failed');
assert.match(staffNextAction743({consent:{allowed:false},channel:'sms'}),/Hold/);

globalThis.fetch = mockFetch;
try {
  sessionPresent=false;
  let res=await customerGet(customerContext());
  assert.equal(res.status,401,'Customer history without session denied');
  res=await customerPost(customerWrite({...selected,client_request_id:requestId}));
  assert.equal(res.status,401,'Preferences require verified session');
  sessionPresent=true;
  res=await customerGet(customerContext());
  let readback=await res.json();
  assert.equal(res.status,200);
  assert.equal(readback.current,null);
  assert.equal(readback.marketing_consent_inferred,false);
  assert.equal(readback.profile.notification_opt_in,true);
  assert.equal(JSON.stringify(readback).includes('owner@example.com'),false,'Customer API excludes contact details');
  res=await customerPost(customerWrite({...selected,client_request_id:requestId},{origin:'https://hostile.example'}));
  assert.equal(res.status,403,'Cross-origin CSRF denied');
  res=await customerPost(customerWrite({...selected,marketing_sms:'yes',client_request_id:requestId}));
  assert.equal(res.status,400,'All six bool choices must be exact');
  assert.equal(attemptedPosts.length,0);
  res=await customerPost(customerWrite({...selected,client_request_id:requestId}));
  assert.equal(res.status,201,await res.clone().text());
  const saved=await res.json();
  assert.equal(saved.current.marketing_email,true);
  assert.equal(saved.messages_sent,false);
  assert.equal(attemptedPosts.length,1);
  assert.deepEqual(Object.keys(attemptedPosts[0].row).sort(),[
    'client_request_id','customer_profile_id','source',...PREFERENCE_FIELDS743
  ].sort(),'No arbitrary caller fields are persisted');
  res=await customerPost(customerWrite({...selected,client_request_id:requestId}));
  assert.equal(res.status,200,'Retry idempotency');
  assert.equal((await res.json()).duplicate,true);
  assert.equal(attemptedPosts.length,1);
  res=await customerPost(customerWrite({...selected,service_phone:false,client_request_id:requestId}));
  assert.equal(res.status,409,'Cannot change an immutable revision key');
  res=await customerGet(customerContext());
  readback=await res.json();
  assert.equal(readback.history.length,1);
  assert.equal(readback.current.service_phone,true);

  const dispatchEvent={...serviceEvent,customer_profile_id:customerId};
  let gate=await loadCustomerCommunicationDispatchGate({env,event:dispatchEvent});
  assert.equal(gate.decision.dispatch,true,'Fresh service consent can be reviewed by existing provider gate');
  gate=await loadCustomerCommunicationDispatchGate({env,event:marketingEvent});
  assert.equal(gate.decision.dispatch,true,'Explicit marketing consent can coexist with separate provider authority');
  preferences.unshift({...preferences[0],id:crypto.randomUUID(),recorded_at:'2030-04-05T10:00:00Z',service_email:false,marketing_email:false});
  gate=await loadCustomerCommunicationDispatchGate({env,event:dispatchEvent});
  assert.equal(gate.decision.dispatch,false,'New opt-out blocks even an already queued service email');
  assert.match(gate.decision.reason,/build743_channel_opted_out/);
  gate=await loadCustomerCommunicationDispatchGate({env,event:marketingEvent});
  assert.equal(gate.decision.dispatch,false,'Marketing opt-out blocks before provider dispatch');
  preferences.shift();

  res=await staffGet(staffContext(false));
  assert.equal(res.status,401,'Anonymous staff preview denied');
  res=await staffGet({request:new Request(`${staffURL}?customer_profile_id=not-a-uuid`,{headers:{'x-staff-user-id':staffId}}),env});
  assert.equal(res.status,400,'Exact lookup refuses fuzzy or malformed customer identifiers');
  res=await staffGet(staffContext());
  const staffData=await res.json();
  assert.equal(res.status,200,JSON.stringify(staffData));
  assert.equal(staffData.notifications.length,2);
  assert.equal(staffData.no_live_dispatch,true);
  assert.equal(staffData.provider_delivery_evidence_available,false);
  assert.equal(staffData.notifications[0].delivery.definitive_delivery,false);
  assert.equal(staffData.notifications[1].consent_allowed,true);
  assert.equal(JSON.stringify(staffData).includes('PROVIDER_PRIVATE_TOKEN'),false,'No raw provider response');
  assert.equal(JSON.stringify(staffData).includes('SECRET QUEUED MESSAGE'),false,'No message bodies');
  assert.equal(JSON.stringify(staffData).includes('owner@example.com'),false,'Only masked staff labels');

  const note={customer_profile_id:customerId,channel:'phone',purpose:'service',outcome:'attempted_no_answer',
    client_request_id:marketingId,note_summary:'Staff attempted after review.'};
  res=await staffPost(staffWrite(note,{origin:'https://hostile.example'}));
  assert.equal(res.status,403,'Staff POST cross-origin blocked');
  res=await staffPost(staffWrite(note,{authorized:false}));
  assert.equal(res.status,401,'Staff write needs current role');
  res=await staffPost(staffWrite(note));
  assert.equal(res.status,201,await res.clone().text());
  const recorded=await res.json();
  assert.equal(recorded.provider_delivery_verified,false);
  assert.equal(recorded.messages_sent,false);
  assert.equal(recorded.phone_call_placed,false);
  assert.equal(attemptedPosts.length,2);
  assert.equal(attemptedPosts[1].row.outbound_dispatched,false);
  res=await staffPost(staffWrite(note));
  assert.equal((await res.json()).duplicate,true,'Manual handoff replay is idempotent');
  assert.equal(attemptedPosts.length,2);

  activeProfile={...profile,notification_opt_in:false};
  res=await staffPost(staffWrite({...note,client_request_id:crypto.randomUUID(),outcome:'customer_contacted'}));
  assert.equal(res.status,409,'Fresh opt-out prevents claimed contact outcome');
  res=await staffPost(staffWrite({...note,client_request_id:crypto.randomUUID(),outcome:'blocked_by_preference'}));
  assert.equal(res.status,201,'Staff can record no-contact opt-out safely');
  assert.equal(attemptedPosts.length,3);
} finally { globalThis.fetch=originalFetch; }

const migration=read('../supabase/migrations/20261102230000_build743_consent_safe_notification_history.sql');
assert.equal((migration.match(/enable row level security/g)||[]).length,2);
assert.equal((migration.match(/revoke all.*anon, authenticated/g)||[]).length,2);
assert.match(migration,/unique \(customer_profile_id, client_request_id\)/);
assert.match(migration,/provider_delivery_verified boolean not null default false/);
const admin=read('../admin-notifications.html');
assert.equal(admin,read('../admin-notifications/index.html'),'Admin notifications route mirrors equal');
assert.match(admin,/data-build743-notification-review/);
assert.match(admin,/This is a LIVE legacy retry/,'Legacy live retries need an explicit confirmation');
assert.match(admin,/id="build743HandoffForm"/);
assert.match(admin,/id="build743ExactCustomer"/);
const account=read('../my-account.html');
assert.equal(account,read('../my-account/index.html'),'Customer route mirrors equal');
assert.match(account,/id="build743PreferenceForm"/);
assert.match(account,/my-account-v355.js\?v=20261102build743/);
assert.match(account,/aria-live="polite"/);
assert.match(read('../assets/my-account-v355.js'),/customer-notification-consent-v743/);
const server=read('../functions/api/admin/notification_preview_v743.js');
assert.doesNotMatch(server,/dispatchNotificationThroughProvider|notifications_process|api\.twilio\.com|api\.sendgrid\.com/,'New preview has zero provider dispatch');
assert.match(read('../functions/api/_lib/customer-communication-consent.js'),/loadLatestPreference743/);
assert.match(read('../scripts/current_booking_wizard_regression.sh'),/build743_consent_notification_reconciliation_test\.mjs/);
console.log('Build 743 consent matrix, append-only audit, signed-in privacy, live opt-out gate, unsent receipts, staff phone handoff and route accessibility: PASS');
