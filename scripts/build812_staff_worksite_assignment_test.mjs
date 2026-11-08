import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { onRequestGet as get812,onRequestPost as post812,torontoToday812,arrivalPriority812,eligibleAssignees812,validAssignmentAction812 }
  from '../functions/api/admin/worksite_assignment_v812.js';
import { onRequestGet as customerGet,safeCustomerIssue811 } from '../functions/api/client/worksite_issues_v811.js';
import { acknowledgementText812 } from '../assets/customer-worksite-issues-v811.mjs';
import { validStaffDecision811 } from '../functions/api/admin/worksite_issue_review_v811.js';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const cid='c7524d89-49b9-4ec2-a44e-f695c146e7af',bid='479608a1-4fd8-42e6-a6a4-42094513ce17';
const id='e8a0f599-cd22-44c0-9fa4-c992998a9a4c',sid='aa00dffd-194d-4cb1-84bd-50a95ab44e84';
const sid2='aa00dffd-194d-4cb1-84bd-50a95ab44e85';
const env={SUPABASE_URL:'https://supabase-mock.invalid',SUPABASE_SERVICE_ROLE_KEY:'test-only'};
const today=torontoToday812(),tomorrow=new Date(Date.now()+86400*1000).toISOString().slice(0,10);
let serviceDate=today,staffSession=true,allowed=true,customerSession=true,patchResult=true,fetchFailure=false,issueStatus='pending_review',ackAt=null,escalation='none',revision=0;
let patches=0,lastPatch=null,staffRows=[];
const staff={id:sid,full_name:'Operations Lead',email:'lead@example.com',is_active:true,role_code:'operations_manager',can_manage_bookings:true,permissions_profile:{}};
const eligible={id:sid2,full_name:'Second Reviewer',is_active:true,role_code:'operations_manager',can_manage_bookings:true,permissions_profile:{}};
const ineligible={...eligible,id:cid,full_name:'Detailer',role_code:'detailer',can_manage_bookings:false};
staffRows=[staff,eligible,ineligible];
const issue=()=>({id,booking_id:bid,customer_profile_id:cid,category:'arrival_contact',customer_description:'Driveway is blocked before detailing.',
  status:issueStatus,submitted_at:'2030-06-10T09:00:00Z',updated_at:'2030-06-10T09:00:00Z',workflow_revision:revision,
  assigned_staff_user_id:null,staff_acknowledged_at:ackAt,arrival_escalation_status:escalation,
  staff_private_note:'PRIVATE-NOTE',customer_visible_resolution:null});
const context=(path,body=null,{cookie='rd_staff_session=token',origin='https://www.rosiedazzlers.ca',headers={}}={})=>({env,request:new Request(`https://www.rosiedazzlers.ca${path}`,{
  method:body?'POST':'GET',headers:{...(cookie?{Cookie:cookie}:{}),...(body?{Origin:origin,'Content-Type':'application/json'}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})})});
const action=(name,fields={})=>({issue_id:id,expected_revision:revision,action:name,...fields});
const saved=globalThis.fetch;
globalThis.fetch=async(url,options={})=>{
  if(fetchFailure)throw Error('Offline');
  const path=new URL(url).pathname.split('/').pop(),method=options.method||'GET';
  if(path==='staff_auth_sessions')return new Response(JSON.stringify(staffSession?[{expires_at:'2031-01-01T00:00:00Z',revoked_at:null,staff_user:{...staff,role_code:allowed?'operations_manager':'detailer',can_manage_bookings:allowed}}]:[]));
  if(path==='customer_auth_sessions')return new Response(JSON.stringify(customerSession?[{expires_at:'2031-01-01T00:00:00Z',revoked_at:null,customer_profile:{id:cid,email:'customer@example.com',is_active:true}}]:[]));
  if(path==='staff_users'){
    const userId=new URL(url).searchParams.get('id')?.replace('eq.','');
    return new Response(JSON.stringify(userId?staffRows.filter(row=>row.id===userId):staffRows));
  }
  if(path==='bookings')return new Response(JSON.stringify([{id:bid,service_date:serviceDate,status:'confirmed',job_status:'scheduled',detailing_completed_at:null}]));
  if(path==='customer_worksite_issue_events_v813')return new Response(JSON.stringify([]));
  if(path==='customer_worksite_issues_v811'){
    if(method==='PATCH'){patches++;lastPatch={url,body:JSON.parse(options.body)};return new Response(JSON.stringify(patchResult?[{...issue(),...lastPatch.body}]:[]));}
    return new Response(JSON.stringify([issue()]));
  }
  throw Error(`Unexpected query: ${path}`);
};
try {
  assert.equal(torontoToday812(new Date('2026-11-09T00:30:00Z')),'2026-11-08','Toronto date must not flip at UTC midnight');
  assert.equal(arrivalPriority812({status:'pending_review'},today,today),'arrival_today');
  assert.equal(arrivalPriority812({status:'reviewing'},'2025-02-02',today),'past_due');
  assert.equal(arrivalPriority812({status:'resolved'},today,today),'closed');
  assert.equal(arrivalPriority812({status:'pending_review'},today,today,{status:'cancelled'}),'not_active');
  assert.equal(eligibleAssignees812(staffRows).length,2);
  assert.equal(validAssignmentAction812({...action('assign'),assigned_staff_user_id:'bad'}),null);
  assert.equal(validAssignmentAction812({...action('acknowledge'),expected_revision:1.5}),null);
  assert.equal(validStaffDecision811({issue_id:id,expected_status:'pending_review',expected_revision:0,status:'reviewing'}).revision,0);
  assert.match(acknowledgementText812(issue()),/not yet recorded/);
  assert.match(acknowledgementText812({...issue(),staff_acknowledged_at:'2026-11-08T12:00:00Z'}),/acknowledged this report/);
  assert.equal(safeCustomerIssue811(issue()).staff_private_note,undefined);
  assert.equal(safeCustomerIssue811(issue()).assigned_staff_user_id,undefined);

  staffSession=false;
  assert.equal((await get812(context('/api/admin/worksite_assignment_v812',null,{cookie:'',headers:{'x-staff-user-id':sid}}))).status,401);
  assert.equal((await post812(context('/api/admin/worksite_assignment_v812',action('acknowledge')))).status,401);
  staffSession=true;allowed=false;
  assert.equal((await get812(context('/api/admin/worksite_assignment_v812'))).status,403);
  allowed=true;
  assert.equal((await post812(context('/api/admin/worksite_assignment_v812',action('acknowledge'),{origin:'https://evil.example'}))).status,403);
  const queue=await get812(context('/api/admin/worksite_assignment_v812'));
  assert.equal(queue.status,200,await queue.clone().text());
  const data=await queue.json();assert.equal(data.issues[0].arrival_priority,'arrival_today');
  assert.equal(data.staff_candidates.length,2);assert.equal(JSON.stringify(data).includes('PRIVATE-NOTE'),true,'Staff-only notes stay within staff endpoint');
  assert.equal(JSON.stringify(data.staff_candidates).includes('lead@example.com'),false,'Assignee list discloses no emails');

  let r=await post812(context('/api/admin/worksite_assignment_v812',action('assign',{assigned_staff_user_id:cid})));
  assert.equal(r.status,403,'Customer or unapproved staff UUID cannot be assigned');assert.equal(patches,0);
  r=await post812(context('/api/admin/worksite_assignment_v812',action('assign',{assigned_staff_user_id:sid2})));
  assert.equal(r.status,200,await r.clone().text());assert.equal(patches,1);
  assert.equal(lastPatch.body.assigned_staff_user_id,sid2);assert.equal(lastPatch.body.workflow_revision,1);
  assert.match(lastPatch.url,/workflow_revision=eq.0/);
  r=await post812(context('/api/admin/worksite_assignment_v812',action('acknowledge')));
  assert.equal(r.status,200);assert.equal(lastPatch.body.staff_acknowledged_by_staff_user_id,sid);
  ackAt='2026-11-08T12:00:00Z';
  assert.equal((await post812(context('/api/admin/worksite_assignment_v812',action('acknowledge')))).status,409);
  ackAt=null;
  serviceDate='2099-01-01';
  assert.equal((await post812(context('/api/admin/worksite_assignment_v812',action('escalate')))).status,409,'Early escalation fails closed');
  serviceDate=today;
  assert.equal((await post812(context('/api/admin/worksite_assignment_v812',action('escalate')))).status,200);
  assert.equal(lastPatch.body.arrival_escalation_status,'flagged');
  escalation='flagged';
  assert.equal((await post812(context('/api/admin/worksite_assignment_v812',action('escalate')))).status,409);
  assert.equal((await post812(context('/api/admin/worksite_assignment_v812',action('clear_escalation')))).status,200);
  assert.equal(lastPatch.body.arrival_escalation_status,'addressed');
  escalation='none';
  assert.equal((await post812(context('/api/admin/worksite_assignment_v812',action('clear_escalation')))).status,409);
  revision=1;
  assert.equal((await post812(context('/api/admin/worksite_assignment_v812',{...action('acknowledge'),expected_revision:0}))).status,409);
  patchResult=false;
  assert.equal((await post812(context('/api/admin/worksite_assignment_v812',action('acknowledge')))).status,409,'Concurrent update fails closed');
  patchResult=true;
  issueStatus='resolved';
  assert.equal((await post812(context('/api/admin/worksite_assignment_v812',action('assign',{assigned_staff_user_id:sid2})))).status,409);
  issueStatus='pending_review';
  fetchFailure=true;
  assert.equal((await get812(context('/api/admin/worksite_assignment_v812'))).status,401,'Auth network failure must never load staff data');
  fetchFailure=false;
  const cust=await customerGet(context('/api/client/worksite_issues_v811',null,{cookie:'rd_client_session=token'}));
  assert.equal(cust.status,200);const customerJson=await cust.json();
  assert.equal(JSON.stringify(customerJson).includes('PRIVATE-NOTE'),false);
  assert.equal(JSON.stringify(customerJson).includes(sid),false);
  assert.equal(customerJson.issues[0].arrival_escalation_status,'none');
}finally{globalThis.fetch=saved;}

const sql=read('../supabase/migrations/20261108144648_build812_staff_worksite_assignment_acknowledgement_arrival_escalation.sql');
assert.match(sql,/workflow_revision integer not null default 0/);
assert.match(sql,/enable row level security/);assert.match(sql,/revoke all .*anon, authenticated/);
assert.match(sql,/references public\.staff_users/);
const backend=read('../functions/api/admin/worksite_assignment_v812.js');
assert.match(backend,/authenticat|staffAccess811/);
assert.doesNotMatch(backend,/api\.stripe\.com|api-m\.paypal\.com|twilio|sendgrid|\.send\(/i);
assert.equal(read('../my-account.html'),read('../my-account/index.html'));
assert.equal(read('../admin-today.html'),read('../admin-today/index.html'));
assert.match(read('../admin-today.html'),/build813/);
assert.match(read('../assets/my-account-v355.js'),/20261108build813/);
assert.match(read('./current_booking_wizard_regression.sh'),/build812_staff_worksite_assignment_test\.mjs/);
console.log('Build 812 PASS: verified staff assignments, actual acknowledgements, Toronto arrival escalation, optimistic revision, customer privacy, safe closure and no automatic outbound or booking mutation.');
