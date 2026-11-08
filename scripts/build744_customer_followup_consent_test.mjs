import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  completedService744,torontoMonth744,torontoSeason744,seasonalGuidance744,
  currentMarketingConsent744,availabilityReadback744
} from '../assets/customer-followup-v744.mjs';
import {onRequestGet as clientGet,onRequestPost as clientPost} from '../functions/api/client/followup_interest_v744.js';
import {onRequestGet as staffGet} from '../functions/api/admin/customer_followup_review_v744.js';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const customerId='12e61ecf-7be3-43ee-aefc-99218d6ae73e';
const otherId='2292fcea-c0f6-4652-a19c-4a0ef613d077';
const bookingId='3284eeab-7e45-47b4-bc26-4f8ca408b93d';
const secondId='4547826d-b516-4d1d-aeaa-c18af7e536f1';
const staffId='e97e48bf-4571-4e48-973f-285edda643ca';
const requestId='51db9d20-dc64-44af-9777-5ed432cc1b13';
const versionId='60d54d23-a7d4-4c3b-b418-b874f55b970e';
const env={SUPABASE_URL:'https://mock-db.invalid',SUPABASE_SERVICE_ROLE_KEY:'only-test-key'};
const accountUrl='https://rosiedazzlers.ca/api/client/followup_interest_v744';
const staffUrl='https://rosiedazzlers.ca/api/admin/customer_followup_review_v744';
const profile={id:customerId,email:'customer@example.com',phone:'5195551111',sms_phone:null,
  is_active:true,notification_opt_in:true,notification_channel:'email'};
const version={id:versionId,customer_profile_id:customerId,recorded_at:new Date().toISOString(),
  service_email:true,service_sms:false,service_phone:false,marketing_email:true,marketing_sms:false,marketing_phone:false};
const bookings=[
  {id:bookingId,customer_profile_id:customerId,customer_email:profile.email,package_code:'basic_detail',
    status:'confirmed',job_status:'completed',detailing_completed_at:'2026-10-10T14:00:00Z',service_date:'2026-10-10',service_area:'Tillsonburg'},
  {id:secondId,customer_profile_id:customerId,customer_email:profile.email,package_code:'interior_detail',
    status:'confirmed',job_status:'assigned',detailing_completed_at:null,service_date:'2026-11-15',service_area:'Woodstock'},
  {id:otherId,customer_profile_id:otherId,customer_email:profile.email,package_code:'basic_detail',
    status:'confirmed',job_status:'completed',detailing_completed_at:'2026-10-01',service_date:'2026-10-01',service_area:'Simcoe'}
];
const interests=[];
const posts=[];
let signedIn=true;
let latestProfile={...profile};
let latestVersion={...version};

assert.equal(torontoMonth744(new Date('2026-11-02T11:00:00Z')),'2026-11');
assert.equal(torontoSeason744(new Date('2026-12-22T11:00:00Z')),'winter');
assert.equal(torontoSeason744(new Date('2026-04-01T11:00:00Z')),'spring');
assert.equal(completedService744(bookings[0]),true);
assert.equal(completedService744(bookings[1]),false);
assert.equal(completedService744({...bookings[0],status:'cancelled'}),false);
assert.equal(seasonalGuidance744(bookings[1]),null);
assert.match(seasonalGuidance744(bookings[0],'winter').copy,/Cold weather/);
assert.equal(seasonalGuidance744(bookings[0],'winter').confirmed_available,false);
assert.equal(availabilityReadback744({ok:true,date:'2026-11-15',AM:true,PM:false},'2026-11-15').state,'provisional');
assert.equal(availabilityReadback744({ok:true,date:'2026-11-15',blocked:true},'2026-11-15').state,'unavailable');
assert.equal(availabilityReadback744(null,'2026-11-15').state,'unknown');
let readiness=currentMarketingConsent744({profile,preference:version,now:new Date(version.recorded_at)});
assert.equal(readiness.channels.email.allowed,true);
assert.equal(readiness.channels.sms.allowed,false);
assert.equal(readiness.automatic_dispatch_authorized,false);
readiness=currentMarketingConsent744({profile,preference:{...version,recorded_at:'2024-01-01T00:00:00Z'},now:new Date('2026-11-02T00:00:00Z')});
assert.equal(readiness.channels.email.allowed,false,'Old marketing choice must not authorize current follow-up');
readiness=currentMarketingConsent744({profile:{...profile,notification_opt_in:false},preference:version,now:new Date(version.recorded_at)});
assert.equal(readiness.channels.email.allowed,false,'Global opt-out wins over marketing checkbox');

const originalFetch=globalThis.fetch;
globalThis.fetch=async(input,options={})=>{
  const url=new URL(input);
  assert.equal(url.origin,env.SUPABASE_URL,'No outgoing email, SMS or booking provider calls');
  const table=url.pathname.split('/').pop();
  if(options.method==='POST'){
    assert.equal(table,'customer_followup_interests_v744','Only new interest rows may be written');
    const item=JSON.parse(options.body)[0];posts.push(item);
    const saved={...item,id:crypto.randomUUID(),submitted_at:'2026-11-02T12:00:00Z'};interests.unshift(saved);
    return Response.json([saved],{status:201});
  }
  if(table==='customer_auth_sessions')return Response.json(signedIn?[{id:requestId,expires_at:'2031-01-01T00:00:00Z',revoked_at:null,customer_profile:latestProfile}]:[]);
  if(table==='staff_users')return Response.json([{id:staffId,full_name:'Staff',email:'staff@example.com',role_code:'admin',is_active:true,can_manage_bookings:true}]);
  if(table==='bookings'){
    if(url.searchParams.has('id'))return Response.json(bookings.filter(item=>item.id===url.searchParams.get('id').slice(3)));
    return Response.json(bookings);
  }
  if(table==='customer_followup_interests_v744'){
    let rows=interests;
    for(const key of ['client_request_id','source_booking_id','interest_kind','interest_month']){
      const v=url.searchParams.get(key);if(v?.startsWith('eq.'))rows=rows.filter(item=>item[key]===v.slice(3));
    }
    return Response.json(rows);
  }
  if(table==='customer_communication_preference_versions')return Response.json([latestVersion]);
  if(table==='customer_profiles')return Response.json([latestProfile]);
  throw new Error(`Unexpected source: ${table}`);
};
const ctx=()=>({request:new Request(accountUrl,{headers:{Cookie:'rd_client_session=test-cookie'}}),env});
const write=(body,{origin='https://rosiedazzlers.ca',cookie=true}={})=>({request:new Request(accountUrl,{
  method:'POST',headers:{'Content-Type':'application/json',Origin:origin,...(cookie?{Cookie:'rd_client_session=test-cookie'}:{})},body:JSON.stringify(body)}),env});
const payload={source_booking_id:bookingId,client_request_id:requestId,interest_kind:'maintenance',cycle_hint:'quarterly',customer_note:'Interested in a sensible cadence.'};

try{
  signedIn=false;
  assert.equal((await clientGet(ctx())).status,401);
  assert.equal((await clientPost(write(payload))).status,401);
  signedIn=true;
  let r=await clientGet(ctx());assert.equal(r.status,200);
  let data=await r.json();
  assert.equal(data.completed_services.length,1,'Only owned, completed service can drive suggestions');
  assert.equal(data.completed_services[0].service_area,'Tillsonburg');
  assert.equal(JSON.stringify(data).includes('customer@example.com'),false,'No contact details in customer payload');
  assert.equal(data.authority.confirmed_revenue_from_interest_cents,0);
  assert.equal((await clientPost(write(payload,{origin:'https://evil.example'}))).status,403,'Cross-origin POST blocked');
  assert.equal((await clientPost(write({...payload,source_booking_id:secondId}))).status,404,'Upcoming work is not completed evidence');
  assert.equal((await clientPost(write({...payload,source_booking_id:otherId}))).status,404,'Other account cannot piggyback on matching email');
  assert.equal((await clientPost(write({...payload,interest_kind:'auto_enroll'}))).status,400);
  assert.equal(posts.length,0);
  r=await clientPost(write(payload));assert.equal(r.status,201,await r.clone().text());
  data=await r.json();
  assert.equal(data.message_sent,false);assert.equal(data.booking_created,false);
  assert.equal(data.confirmed_revenue_cents,0);assert.equal(posts.length,1);
  assert.equal(posts[0].consent_preference_version_id,versionId);
  assert.equal(posts[0].confirmed_revenue_cents,0);
  assert.equal(posts[0].outreach_dispatched,false);
  assert.equal((await (await clientPost(write(payload))).json()).duplicate,true,'Request ID idempotent');
  assert.equal((await (await clientPost(write({...payload,client_request_id:crypto.randomUUID()}))).json()).duplicate,true,'Same-month duplicate suppressed');
  assert.equal(posts.length,1);
  assert.equal((await clientPost(write({...payload,customer_note:'Changed',client_request_id:requestId}))).status,409,'Reused request key cannot mutate');
  latestVersion={...version,id:crypto.randomUUID(),marketing_email:false,recorded_at:new Date().toISOString()};
  r=await staffGet({request:new Request(staffUrl,{headers:{'x-staff-user-id':staffId}}),env});
  assert.equal(r.status,200,await r.clone().text());
  data=await r.json();
  assert.equal(data.interests.length,1);
  assert.equal(data.interests[0].consent_changed_since_submission,true);
  assert.deepEqual(data.interests[0].currently_allowed_channels,[],'Fresh opt-out blocks marketing readiness');
  assert.equal(data.counts.confirmed_revenue_from_interest_cents,0);
  assert.equal(JSON.stringify(data).includes('customer@example.com'),false,'Staff queue masked');
  assert.equal((await staffGet({request:new Request(staffUrl),env})).status,401,'No anonymous staff access');
}finally{globalThis.fetch=originalFetch;}

const migration=read('../supabase/migrations/20261102234500_build744_customer_followup_interest_queue.sql');
assert.match(migration,/enable row level security/);
assert.match(migration,/revoke all.*anon, authenticated/);
assert.match(migration,/unique \(customer_profile_id, source_booking_id, interest_kind, interest_month\)/);
assert.match(migration,/confirmed_revenue_cents integer not null default 0 check/);
assert.match(migration,/outreach_dispatched boolean not null default false check/);
const account=read('../my-account.html');
assert.equal(account,read('../my-account/index.html'));
assert.match(account,/data-build744-customer-followup/);
assert.match(account,/id="build744AvailabilityCheck"/);
assert.match(account,/my-account-v355.js\?v=20261108build816/,'Current account bundle must continue to load follow-up consent workbench');
const staffPage=read('../admin-notifications.html');
assert.equal(staffPage,read('../admin-notifications/index.html'));
assert.match(staffPage,/data-build744-followup-review/);
assert.match(read('../assets/my-account-v355.js'),/customer-followup-workbench-v744/);
assert.match(read('../assets/customer-followup-workbench-v744.js'),/\/api\/availability\?/);
console.log('Build 744 consent-safe rebooking, seasonal follow-up and interest queue: PASS');
