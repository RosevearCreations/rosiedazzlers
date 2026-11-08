import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {followupAging815,customerNextStep815} from '../functions/api/_lib/worksite-followup-aging-v815.js';
import {onRequestGet as staffGet,onRequestPost as staffPost,validEscalationAction815} from '../functions/api/admin/worksite_escalations_v815.js';
import {onRequestGet as customerGet,safeCustomerEscalation815} from '../functions/api/client/worksite_escalation_v815.js';
import {advisoryAging815} from '../assets/admin-worksite-followups-v814.mjs';
import {customerGuidance815} from '../assets/customer-worksite-followups-v814.mjs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const profile='c7524d89-49b9-4ec2-a44e-f695c146e7af',other='c7524d89-49b9-4ec2-a44e-f695c146e7ae';
const followup='e8a0f599-cd22-44c0-9fa4-c992998a9a4e',otherFollowup='e8a0f599-cd22-44c0-9fa4-c992998a9a4f';
const escalationId='e8a0f599-cd22-44c0-9fa4-c992998a9a40',staffId='aa00dffd-194d-4cb1-84bd-50a95ab44e84';
const env={SUPABASE_URL:'https://supabase-mock.invalid',SUPABASE_SERVICE_ROLE_KEY:'test-only'};
const start=Date.parse('2026-11-08T10:00:00Z');
const at=(hours)=>({status:'awaiting_staff',requested_at:new Date(start-hours*3600000).toISOString()});
for(const [hours,band] of [[0,'new'],[23,'new'],[24,'attention'],[47,'attention'],[48,'overdue'],[72,'overdue']]){
  assert.equal(followupAging815(at(hours),start).band,band);
  assert.equal(advisoryAging815(at(hours),start).band,band);
}
assert.equal(followupAging815({status:'awaiting_staff',requested_at:'invalid'},start).band,'unknown');
assert.equal(followupAging815(at(-1),start).band,'unknown');
assert.equal(followupAging815({status:'staff_replied',requested_at:'invalid'},start).band,'customer_review');
assert.equal(followupAging815({status:'confirmed'},start).band,'finished');
assert.match(customerNextStep815(at(50),{status:'acknowledged'}),/supervisor has acknowledged/i);
assert.match(customerGuidance815(at(50),{status:'flagged'}),/supervisor review/i);
assert.equal(validEscalationAction815({action:'flag',followup_id:followup,reason:'too short'}),null);
assert.equal(validEscalationAction815({action:'flag',followup_id:followup,reason:'x'.repeat(601)}),null);
assert.equal(validEscalationAction815({action:'clear',followup_id:followup,expected_revision:-1}),null);
assert.equal(validEscalationAction815({action:'clear',followup_id:'bad',expected_revision:1}),null);
assert.equal(validEscalationAction815({action:'flag',followup_id:followup,reason:'Arrival-day worksite access issue.'}).action,'flag');
assert.equal(safeCustomerEscalation815({followup_id:followup,status:'flagged',flagged_at:'today',reason:'PRIVATE',flagged_by_staff_user_id:staffId}).reason,undefined);

let customerSession=true,staffSession=true,role='operations_manager',canAssign=true,offline=false,followupStatus='awaiting_staff',escalation=null,events=[],writes=0,lastWrite=null;
const staff={id:staffId,role_code:role,is_active:true,can_manage_bookings:true,permissions_profile:{action_access:{'operations.assignment.manage':canAssign}},full_name:'Supervisor'};
const make=(path,body,{cookie=path.includes('admin')?'rd_staff_session=token':'rd_client_session=token',origin='https://www.rosiedazzlers.ca'}={})=>({env,request:new Request(`https://www.rosiedazzlers.ca${path}`,
  {method:body?'POST':'GET',headers:{...(cookie?{Cookie:cookie}:{}),...(body?{Origin:origin,'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})})});
const a='/api/admin/worksite_escalations_v815',c='/api/client/worksite_escalation_v815';
const originalFetch=globalThis.fetch;
globalThis.fetch=async(url,init={})=>{
  if(offline)throw Error('offline');
  const path=new URL(url).pathname.split('/').pop(),method=init.method||'GET',params=new URL(url).searchParams;
  if(path==='customer_auth_sessions')return Response.json(customerSession?[{expires_at:'2031-01-01T00:00:00Z',revoked_at:null,customer_profile:{id:profile,email:'customer@example.com',is_active:true}}]:[]);
  if(path==='staff_auth_sessions')return Response.json(staffSession?[{expires_at:'2031-01-01T00:00:00Z',revoked_at:null,staff_user:{...staff,role_code:role,permissions_profile:{action_access:{'operations.assignment.manage':canAssign}}}}]:[]);
  if(path==='staff_users')return Response.json([{...staff,role_code:role,permissions_profile:{action_access:{'operations.assignment.manage':canAssign}}}]);
  if(path==='customer_worksite_followups_v814'){
    if(params.has('customer_profile_id'))return Response.json([{id:followup,customer_profile_id:profile}]);
    return Response.json(params.has('id')&&params.get('id').includes(otherFollowup)?[]:[{id:followup,status:followupStatus,requested_at:'2026-11-05T10:00:00Z'}]);
  }
  if(path==='customer_worksite_followup_escalations_v815'){
    if(method==='GET')return Response.json(!escalation?[]:params.has('followup_id')&&params.get('followup_id').includes(otherFollowup)?[]:[escalation]);
    writes++;lastWrite={url,method,body:JSON.parse(init.body)};
    if(method==='POST')escalation={id:escalationId,followup_id:followup,reason:lastWrite.body.reason,status:'flagged',flagged_at:'2026-11-08T12:00:00Z',
      flagged_by_staff_user_id:staffId,workflow_revision:0};
    if(method==='PATCH'){
      if(params.get('workflow_revision')!==`eq.${escalation.workflow_revision}`)return Response.json([]);
      escalation={...escalation,...lastWrite.body};
    }
    return Response.json([escalation]);
  }
  if(path==='customer_worksite_followup_escalation_events_v815')return Response.json(events);
  throw Error('Unexpected mocked REST path '+path);
};
try{
  customerSession=false;assert.equal((await customerGet(make(c))).status,401);customerSession=true;
  let response=await customerGet(make(c));assert.equal(response.status,200);assert.deepEqual((await response.json()).escalations,[]);
  staffSession=false;assert.equal((await staffGet(make(a))).status,401);staffSession=true;
  role='detailer';assert.equal((await staffGet(make(a))).status,403);
  role='operations_manager';canAssign=false;
  response=await staffGet(make(a));assert.equal(response.status,200);assert.equal((await response.json()).can_escalate,false);
  assert.equal((await staffPost(make(a,{action:'flag',followup_id:followup,reason:'Arrival access may be blocked.'}))).status,403);
  role='senior_detailer';canAssign=true;
  assert.equal((await staffPost(make(a,{action:'flag',followup_id:followup,reason:'Arrival access may be blocked.'}))).status,403);
  role='operations_manager';
  assert.equal((await staffPost(make(a,{action:'flag',followup_id:followup,reason:'Arrival access may be blocked.'},{origin:'https://attacker.invalid'}))).status,403);
  assert.equal((await staffPost(make(a,{action:'flag',followup_id:followup,reason:'short'}))).status,400);
  assert.equal((await staffPost(make(a,{action:'flag',followup_id:otherFollowup,reason:'Arrival access may be blocked.'}))).status,404);
  followupStatus='staff_replied';assert.equal((await staffPost(make(a,{action:'flag',followup_id:followup,reason:'Arrival access may be blocked.'}))).status,409);
  followupStatus='awaiting_staff';assert.equal(writes,0);
  response=await staffPost(make(a,{action:'flag',followup_id:followup,reason:'Arrival access may be blocked.',flagged_by_staff_user_id:other}));
  assert.equal(response.status,201,await response.clone().text());assert.equal(writes,1);assert.equal(lastWrite.body.flagged_by_staff_user_id,staffId);
  assert.equal((await response.json()).notification_sent,false);
  assert.equal((await staffPost(make(a,{action:'flag',followup_id:followup,reason:'Repeat escalation should be blocked.'}))).status,409);
  response=await customerGet(make(c));assert.equal(response.status,200);
  const progress=await response.json();assert.equal(progress.escalations.length,1);assert.equal(JSON.stringify(progress).includes('Arrival access'),false);assert.equal(JSON.stringify(progress).includes(staffId),false);
  response=await staffGet(make(a));assert.equal(response.status,200);assert.equal((await response.json()).can_escalate,true);
  assert.equal((await staffPost(make(a,{action:'acknowledge',followup_id:followup,expected_revision:1}))).status,409);
  response=await staffPost(make(a,{action:'acknowledge',followup_id:followup,expected_revision:0}));
  assert.equal(response.status,200);assert.equal(lastWrite.body.acknowledged_by_staff_user_id,staffId);
  assert.equal((await staffPost(make(a,{action:'acknowledge',followup_id:followup,expected_revision:0}))).status,409);
  response=await staffPost(make(a,{action:'clear',followup_id:followup,expected_revision:1}));assert.equal(response.status,200);
  assert.equal(lastWrite.body.cleared_by_staff_user_id,staffId);
  assert.equal((await staffPost(make(a,{action:'clear',followup_id:followup,expected_revision:1}))).status,409);
  assert.equal(writes,3);
  offline=true;assert.ok([401,503].includes((await customerGet(make(c))).status));assert.ok([401,403,503].includes((await staffGet(make(a))).status));
}finally{globalThis.fetch=originalFetch;}

const migration=read('../supabase/migrations/20261108165832_build815_followup_aging_supervisor_escalation.sql');
for(const table of ['customer_worksite_followup_escalations_v815','customer_worksite_followup_escalation_events_v815']){
  assert.match(migration,new RegExp(`alter table public\\.${table} enable row level security`));
  assert.match(migration,new RegExp(`revoke all on public\\.${table} from public,anon,authenticated,service_role`));
}
assert.match(migration,/unique references public.customer_worksite_followups_v814/);
assert.match(migration,/before update or delete on public.customer_worksite_followup_escalation_events_v815/);
assert.match(migration,/security invoker/);assert.doesNotMatch(migration,/security definer/i);
assert.match(migration,/new.workflow_revision <> old.workflow_revision\+1/);
const api=read('../functions/api/client/worksite_escalation_v815.js')+read('../functions/api/admin/worksite_escalations_v815.js');
assert.doesNotMatch(api,/api.stripe.com|twilio|sendgrid|method:\s*'PATCH'[^\n]*bookings/i);
const html=read('../admin-today.html'),account=read('../my-account.html');
assert.match(html,/option value="aging"/);assert.match(html,/option value="escalated"/);
assert.match(html,/admin-worksite-followups-v814.mjs\?v=build815/);
assert.match(account,/my-account-v355.js\?v=20261108build815/);
assert.equal(html,read('../admin-today/index.html'));assert.equal(account,read('../my-account/index.html'));
assert.match(read('./current_booking_wizard_regression.sh'),/build815_worksite_followup_aging_escalation_test.mjs/);
console.log('Build 815 PASS: triage bands, supervisor RBAC, conflict-safe transitions, tenant-scoped customer progress, no private fields or automatic outreach, append-only migration and mirrors.');
