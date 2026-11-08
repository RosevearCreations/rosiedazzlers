import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { onRequestGet as customerGet, onRequestPost as customerPost, validIssue811, bookingAllowsIssue811, safeCustomerIssue811 }
  from '../functions/api/client/worksite_issues_v811.js';
import { onRequestGet as staffGet, onRequestPost as staffPost, validStaffDecision811 }
  from '../functions/api/admin/worksite_issue_review_v811.js';
import { eligibleIssueBookings811, issueDraft811 } from '../assets/customer-worksite-issues-v811.mjs';
import { nextReviewStatuses811 } from '../assets/admin-worksite-issues-v811.mjs';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const cid='c7524d89-49b9-4ec2-a44e-f695c146e7af';
const bid='479608a1-4fd8-42e6-a6a4-42094513ce17';
const rid='e8a0f599-cd22-44c0-9fa4-c992998a9a4c';
const staffId='aa00dffd-194d-4cb1-84bd-50a95ab44e84';
const env={SUPABASE_URL:'https://supabase-mock.invalid',SUPABASE_SERVICE_ROLE_KEY:'test-only'};
const owned={id:bid,customer_profile_id:cid,customer_email:'owner@example.com',service_date:'2030-07-10',status:'confirmed',job_status:'scheduled',detailing_completed_at:null};
const issue={id:rid,customer_profile_id:cid,booking_id:bid,client_request_id:rid,category:'parking_access',customer_description:'Driveway access requires advance permission.',status:'pending_review',submitted_at:'2030-06-10T09:00:00Z',staff_private_note:'SECRET',customer_visible_resolution:null,workflow_revision:0,staff_acknowledged_at:null,arrival_escalation_status:'none'};
const body={booking_id:bid,client_request_id:rid,category:'parking_access',description:'Driveway access requires advance permission.'};
const staff={id:staffId,email:'staff@example.com',full_name:'Operations',role_code:'operations_manager',is_active:true,can_manage_bookings:true,permissions_profile:{}};
const sessionCustomer=[{id:rid,expires_at:'2031-01-01T00:00:00Z',revoked_at:null,customer_profile:{id:cid,email:'owner@example.com',is_active:true}}];
const sessionStaff=[{id:rid,expires_at:'2031-01-01T00:00:00Z',revoked_at:null,staff_user:staff}];
const make=(path,data,{cookie='rd_client_session=token',origin='https://www.rosiedazzlers.ca',headers={}}={})=>({env,request:new Request(`https://www.rosiedazzlers.ca${path}`,{
  method:data?'POST':'GET',headers:{...(cookie?{Cookie:cookie}:{}),...(data?{'Content-Type':'application/json',Origin:origin}:{}),...headers},...(data?{body:JSON.stringify(data)}:{})})});

assert.equal(validIssue811({...body,category:'other'}).category,'other');
assert.equal(validIssue811({...body,category:'invalid'}),null);
assert.equal(validIssue811({...body,description:'short'}),null);
assert.equal(validIssue811({...body,description:'x'.repeat(1001)}),null);
assert.equal(bookingAllowsIssue811(owned,'2030-07-10'),true);
assert.equal(bookingAllowsIssue811({...owned,service_date:'2030-07-09'},'2030-07-10'),false);
assert.equal(bookingAllowsIssue811({...owned,status:'cancelled'},'2030-07-10'),false);
assert.equal(safeCustomerIssue811(issue).staff_private_note,undefined);
assert.deepEqual(nextReviewStatuses811('resolved'),[]);
assert.deepEqual(nextReviewStatuses811('pending_review'),['reviewing','resolved','closed_no_action']);
assert.equal(validStaffDecision811({issue_id:rid,expected_status:'resolved',status:'reviewing'}),null);
assert.equal(validStaffDecision811({issue_id:rid,expected_status:'pending_review',expected_revision:0,status:'resolved',resolution:'short'}),null);
assert.ok(validStaffDecision811({issue_id:rid,expected_status:'pending_review',expected_revision:0,status:'resolved',resolution:'Please contact our office.'}));
assert.equal(issueDraft811({booking_id:bid,category:'parking_access',description:body.description},[owned],[]).ok,true);
assert.equal(issueDraft811({booking_id:bid,category:'parking_access',description:body.description},[owned],[issue]).ok,false);
assert.equal(eligibleIssueBookings811([owned],[],'2030-07-01').length,1);

let sessionPresent=true,staffSession=true,staffAllowed=true,ownedRow=owned,existing=[],rows=[issue],inserts=0,patches=0,patchResult=true,lastPatch=null;
const savedFetch=globalThis.fetch;
function stubFetch(url,options={}){
  const path=new URL(url).pathname.split('/').pop();const method=options.method||'GET';
  if(path==='customer_auth_sessions')return Promise.resolve(new Response(JSON.stringify(sessionPresent?sessionCustomer:[])));
  if(path==='staff_auth_sessions')return Promise.resolve(new Response(JSON.stringify(staffSession?[{...sessionStaff[0],staff_user:{...staff,role_code:staffAllowed?'operations_manager':'detailer',can_manage_bookings:staffAllowed}}]:[])));
  if(path==='staff_users')return Promise.resolve(new Response(JSON.stringify([{...staff}])));
  if(path==='bookings')return Promise.resolve(new Response(JSON.stringify(ownedRow?[ownedRow]:[])));
  if(path==='customer_worksite_issues_v811'){
    if(method==='POST'){inserts++;return Promise.resolve(new Response(JSON.stringify([issue]),{status:201}));}
    if(method==='PATCH'){patches++;lastPatch={url,body:JSON.parse(options.body)};return Promise.resolve(new Response(JSON.stringify(patchResult?[{...issue,...lastPatch.body}]:[])));}
    const u=new URL(url);return Promise.resolve(new Response(JSON.stringify(u.searchParams.has('client_request_id')?existing:rows)));
  }
  throw new Error(`Unexpected source ${path}`);
}
try{
  globalThis.fetch=stubFetch;
  sessionPresent=false;
  assert.equal((await customerGet(make('/api/client/worksite_issues_v811'))).status,401);
  assert.equal((await customerPost(make('/api/client/worksite_issues_v811',body))).status,401);
  sessionPresent=true;
  assert.equal((await customerPost(make('/api/client/worksite_issues_v811',body,{origin:'https://evil.example'}))).status,403);
  assert.equal((await customerPost(make('/api/client/worksite_issues_v811',{...body,description:'oops'}))).status,400);
  ownedRow={...owned,customer_profile_id:'00000000-0000-4000-8000-000000000000'};
  assert.equal((await customerPost(make('/api/client/worksite_issues_v811',body))).status,404,'Different profile cannot write a booking even with matching email');
  ownedRow={...owned,status:'cancelled'};
  assert.equal((await customerPost(make('/api/client/worksite_issues_v811',body))).status,409,'Closed booking rejected');
  ownedRow=owned;
  const success=await customerPost(make('/api/client/worksite_issues_v811',body));
  assert.equal(success.status,201,await success.clone().text());
  const saved=await success.json();assert.equal(saved.appointment_changed,false);assert.equal(saved.notification_sent,false);
  assert.equal(saved.issue.staff_private_note,undefined);
  assert.equal(inserts,1);
  existing=[issue];
  const replay=await customerPost(make('/api/client/worksite_issues_v811',body));
  assert.equal(replay.status,200);assert.equal((await replay.json()).duplicate,true);assert.equal(inserts,1);
  assert.equal((await customerPost(make('/api/client/worksite_issues_v811',{...body,description:'Different driveway permission applies today.'}))).status,409);
  const customerRes=await customerGet(make('/api/client/worksite_issues_v811'));
  assert.equal(customerRes.status,200);assert.equal(JSON.stringify(await customerRes.json()).includes('SECRET'),false);

  // An untrusted staff identifier/bridge header is never sufficient for this endpoint.
  assert.equal((await staffGet(make('/api/admin/worksite_issue_review_v811',null,{cookie:'',headers:{'x-staff-user-id':staffId}}))).status,401);
  assert.equal((await staffGet(make('/api/admin/worksite_issue_review_v811',null,{cookie:'rd_staff_session=token'}))).status,200);
  staffAllowed=false;
  assert.equal((await staffGet(make('/api/admin/worksite_issue_review_v811',null,{cookie:'rd_staff_session=token'}))).status,403,'Detailers lack the customer-management action');
  staffAllowed=true;
  let response=await staffPost(make('/api/admin/worksite_issue_review_v811',{issue_id:rid,expected_status:'pending_review',expected_revision:0,status:'resolved',resolution:'Safe access confirmed with Rosie.'},{cookie:'rd_staff_session=token',origin:'https://evil.example'}));
  assert.equal(response.status,403);
  response=await staffPost(make('/api/admin/worksite_issue_review_v811',{issue_id:rid,expected_status:'pending_review',expected_revision:0,status:'resolved',resolution:'Safe access confirmed with Rosie.',private_note:'Internal instruction'},{cookie:'rd_staff_session=token'}));
  assert.equal(response.status,200,await response.clone().text());assert.equal(patches,1);
  assert.match(lastPatch.url,/status=eq.pending_review/);
  assert.match(lastPatch.url,/workflow_revision=eq.0/);
  assert.equal(lastPatch.body.reviewed_by_staff_user_id,staffId);
  assert.equal(lastPatch.body.customer_visible_resolution,'Safe access confirmed with Rosie.');
  patchResult=false;
  response=await staffPost(make('/api/admin/worksite_issue_review_v811',{issue_id:rid,expected_status:'pending_review',expected_revision:0,status:'reviewing'},{cookie:'rd_staff_session=token'}));
  assert.equal(response.status,409,'Concurrent staff disposition fails closed');
  assert.equal(patches,2);
  assert.equal(await (await staffGet(make('/api/admin/worksite_issue_review_v811',null,{cookie:'rd_staff_session=token'}))).status,200);
}finally{globalThis.fetch=savedFetch;}

const migration=read('../supabase/migrations/20261108141300_build811_customer_worksite_issue_review.sql');
assert.match(migration,/enable row level security/);assert.match(migration,/revoke all .*anon, authenticated/);
assert.match(migration,/unique \(customer_profile_id, client_request_id\)/);assert.match(migration,/where status in \('pending_review', 'reviewing'\)/);
const customerCode=read('../functions/api/client/worksite_issues_v811.js');const staffCode=read('../functions/api/admin/worksite_issue_review_v811.js');
assert.doesNotMatch(customerCode+staffCode,/api\.stripe\.com|api-m\.paypal\.com|sendgrid|twilio|rest\/v1\/bookings[^`]*method:\s*'PATCH'/i);
assert.match(staffCode,/auth_mode!=='session'/);
const html=read('../my-account.html');assert.equal(html,read('../my-account/index.html'));
for(const id of ['build811Form','build811Booking','build811Category','build811Description','build811CustomerHistory','build811CustomerStatus'])assert.match(html,new RegExp(`id="${id}"`));
assert.match(read('../admin-today.html'),/admin-worksite-issues-v811\.mjs/);
assert.match(read('../assets/my-account-history-v742.js'),/clearCustomerWorksiteIssues811\(\)/);
assert.match(read('../assets/my-account-v355.js'),/my-account-history-v742\.js\?v=20261108build816/);
assert.match(read('./current_booking_wizard_regression.sh'),/build811_customer_worksite_issues_test\.mjs/);
assert.match(read('./build413_workflow_efficiency_accessibility_check.py'),/build413\(\?:\[_-\]\|\$\)/,
  'Retained Build 413 schema gate continues to match actual build labels, not unrelated migration timestamp digits');
console.log('Build 811 PASS: private customer intake, owner-scoped booking, safe replay, staff session and permissions, optimistic review, public/private note split, and unchanged booking/payment/outreach.');
