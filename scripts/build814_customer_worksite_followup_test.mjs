import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { onRequestGet as customerGet,onRequestPost as customerPost,validFollowupAction814,safeCustomerFollowup814 }
  from '../functions/api/client/worksite_followups_v814.js';
import { onRequestGet as staffGet,onRequestPost as staffPost,validStaffFollowup814 }
  from '../functions/api/admin/worksite_followups_v814.js';
import { followupDraft814,confirmationDecision814,FOLLOWUP_LABELS_814 } from '../assets/customer-worksite-followups-v814.mjs';

const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const customerId='c7524d89-49b9-4ec2-a44e-f695c146e7af',other='c7524d89-49b9-4ec2-a44e-f695c146e7ae';
const issueId='e8a0f599-cd22-44c0-9fa4-c992998a9a4c',otherIssue='e8a0f599-cd22-44c0-9fa4-c992998a9a4d';
const followupId='e8a0f599-cd22-44c0-9fa4-c992998a9a4e',clientId='e8a0f599-cd22-44c0-9fa4-c992998a9a4f';
const staffId='aa00dffd-194d-4cb1-84bd-50a95ab44e84',env={SUPABASE_URL:'https://supabase-mock.invalid',SUPABASE_SERVICE_ROLE_KEY:'test-only'};
const requestData={action:'request',issue_id:issueId,client_request_id:clientId,request_kind:'clarification',request_text:'Can Rosie use the rear driveway for arrival?'};
const initial={id:followupId,customer_profile_id:customerId,issue_id:issueId,client_request_id:clientId,request_kind:requestData.request_kind,
  request_text:requestData.request_text,status:'awaiting_staff',workflow_revision:0,requested_at:'2030-06-10T09:00:00Z',updated_at:'2030-06-10T09:00:00Z',staff_response:null,staff_responded_at:null,
  staff_responded_by_staff_user_id:null,customer_feedback:null,customer_decided_at:null};
const staff={id:staffId,role_code:'operations_manager',is_active:true,can_manage_bookings:true,permissions_profile:{},full_name:'Operator'};
const make=(path,body,{cookie='rd_client_session=token',origin='https://www.rosiedazzlers.ca',headers={}}={})=>({env,request:new Request(`https://www.rosiedazzlers.ca${path}`,{
  method:body?'POST':'GET',headers:{...(cookie?{Cookie:cookie}:{}),...(body?{Origin:origin,'Content-Type':'application/json'}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})})});
const clientPath='/api/client/worksite_followups_v814',adminPath='/api/admin/worksite_followups_v814';

assert.equal(validFollowupAction814({...requestData,request_text:'too short'}),null);
assert.equal(validFollowupAction814({...requestData,request_kind:'pay_me'}),null);
assert.equal(validFollowupAction814({...requestData,client_request_id:'not-a-uuid'}),null);
assert.equal(validFollowupAction814({...requestData,request_text:'x'.repeat(1001)}),null);
assert.equal(validFollowupAction814({...requestData,customer_profile_id:other}).issueId,issueId,'Client ownership claims are discarded');
assert.equal(validFollowupAction814({action:'confirm',followup_id:followupId,expected_revision:1,decision:'needs_more_help',feedback:'no'}),null);
assert.equal(validFollowupAction814({action:'confirm',followup_id:followupId,expected_revision:1,decision:'confirmed'}).decision,'confirmed');
assert.equal(validStaffFollowup814({followup_id:followupId,expected_revision:0,response:'short'}),null);
assert.equal(validStaffFollowup814({followup_id:followupId,expected_revision:0,response:'Please use the rear driveway.'}).response,'Please use the rear driveway.');
assert.equal(safeCustomerFollowup814({...initial,staff_private_note:'SECRET'}).staff_responded_by_staff_user_id,undefined);
assert.equal(safeCustomerFollowup814({...initial,staff_private_note:'SECRET'}).staff_private_note,undefined);
assert.equal(followupDraft814({issue_id:issueId,request_kind:'clarification',request_text:requestData.request_text},[{id:issueId}],[]).ok,true);
assert.equal(followupDraft814({issue_id:otherIssue,request_kind:'clarification',request_text:requestData.request_text},[{id:issueId}],[]).ok,false);
assert.equal(followupDraft814({issue_id:issueId,request_kind:'clarification',request_text:requestData.request_text},[{id:issueId}],[initial]).ok,false);
assert.equal(confirmationDecision814('staff_replied','needs_more_help','Not yet clear.'),true);
assert.equal(confirmationDecision814('awaiting_staff','confirmed',''),false);
assert.match(FOLLOWUP_LABELS_814.staff_replied,/confirmation requested/);

let customerSession=true,staffSession=true,staffAllowed=true,owned=true,items=[],offline=false,conflict=false,patchEmpty=false,insertCount=0,patchCount=0,lastWrite=null;
const events=[{followup_id:followupId,followup_revision:0,event_kind:'request_submitted',recorded_at:'2030-06-10T09:00:00Z',actor_staff_user_id:null,current_status:'awaiting_staff'}];
const savedFetch=globalThis.fetch;
globalThis.fetch=async(url,init={})=>{
  if(offline)throw Error('offline');
  const pathname=new URL(url).pathname.split('/').pop(),method=init.method||'GET',params=new URL(url).searchParams;
  if(pathname==='customer_auth_sessions')return new Response(JSON.stringify(customerSession?[{expires_at:'2031-01-01T00:00:00Z',revoked_at:null,customer_profile:{id:customerId,email:'owner@example.com',is_active:true}}]:[]));
  if(pathname==='staff_auth_sessions')return new Response(JSON.stringify(staffSession?[{expires_at:'2031-01-01T00:00:00Z',revoked_at:null,staff_user:{...staff,role_code:staffAllowed?'operations_manager':'detailer',can_manage_bookings:staffAllowed}}]:[]));
  if(pathname==='staff_users')return new Response(JSON.stringify([staff]));
  if(pathname==='customer_worksite_issues_v811')return new Response(JSON.stringify(owned?[{id:issueId,customer_profile_id:customerId,booking_id:otherIssue,category:'arrival_contact',status:'resolved'}]:[]));
  if(pathname==='customer_worksite_followups_v814'){
    if(method==='POST'){
      insertCount++;lastWrite={url,body:JSON.parse(init.body)};
      if(conflict)return new Response('{}',{status:409});
      items.push(initial);return new Response(JSON.stringify([initial]),{status:201});
    }
    if(method==='PATCH'){
      patchCount++;lastWrite={url,body:JSON.parse(init.body)};
      if(conflict)return new Response('{}',{status:409});
      if(patchEmpty)return new Response(JSON.stringify([]));
      const first=items[0]||initial;const updated={...first,...lastWrite.body};items[0]=updated;
      return new Response(JSON.stringify([updated]));
    }
    const result=params.has('client_request_id')?items.filter(r=>r.client_request_id===params.get('client_request_id').replace('eq.','')):
      params.has('id')?items.filter(r=>r.id===params.get('id').replace('eq.','')):
      params.has('status')?items.filter(r=>['awaiting_staff','staff_replied'].includes(r.status)) :items;
    return new Response(JSON.stringify(result));
  }
  if(pathname==='customer_worksite_followup_events_v814')return new Response(JSON.stringify(events));
  throw Error(`Unexpected path ${pathname}`);
};
try{
  customerSession=false;
  assert.equal((await customerGet(make(clientPath))).status,401);
  assert.equal((await customerPost(make(clientPath,requestData))).status,401);
  customerSession=true;
  assert.equal((await customerPost(make(clientPath,requestData,{origin:'https://attacker.example'}))).status,403);
  assert.equal((await customerPost(make(clientPath,{...requestData,request_text:'short'}))).status,400);
  owned=false;
  assert.equal((await customerPost(make(clientPath,requestData))).status,404,'Foreign worksite issue cannot be followed up');
  owned=true;
  let response=await customerPost(make(clientPath,{...requestData,customer_profile_id:other,staff_response:'forged',status:'confirmed'}));
  assert.equal(response.status,201,await response.clone().text());
  assert.equal(insertCount,1);assert.equal(lastWrite.body[0].customer_profile_id,customerId);assert.equal(lastWrite.body[0].staff_response,undefined);
  assert.equal((await response.json()).notification_sent,false);
  response=await customerPost(make(clientPath,requestData));assert.equal(response.status,200);assert.equal((await response.json()).duplicate,true);
  assert.equal(insertCount,1,'Idempotent retry must not create another follow-up');
  assert.equal((await customerPost(make(clientPath,{...requestData,request_text:'Different details now'}))).status,409);
  assert.equal((await customerPost(make(clientPath,{...requestData,client_request_id:otherIssue}))).status,409,'One outstanding follow-up per issue');
  const customerHistory=await customerGet(make(clientPath));assert.equal(customerHistory.status,200);
  assert.equal(JSON.stringify(await customerHistory.json()).includes(staffId),false);
  assert.equal((await staffGet(make(adminPath,null,{cookie:'',headers:{'x-staff-user-id':staffId}}))).status,401,'Legacy staff identifier cannot read queue');
  staffAllowed=false;
  assert.equal((await staffGet(make(adminPath,null,{cookie:'rd_staff_session=token'}))).status,403,'Unprivileged detailer blocked');
  assert.equal((await staffPost(make(adminPath,{followup_id:followupId,expected_revision:0,response:'We can use the rear driveway.'},{cookie:'rd_staff_session=token'}))).status,403);
  staffAllowed=true;
  assert.equal((await staffPost(make(adminPath,{followup_id:followupId,expected_revision:0,response:'We can use the rear driveway.'},{cookie:'rd_staff_session=token',origin:'https://attacker.example'}))).status,403);
  response=await staffGet(make(adminPath,null,{cookie:'rd_staff_session=token'}));assert.equal(response.status,200,await response.clone().text());
  assert.equal((await response.json()).events.length,1);
  response=await staffPost(make(adminPath,{followup_id:followupId,expected_revision:0,response:'We can use the rear driveway.',staff_responded_by_staff_user_id:other},{cookie:'rd_staff_session=token'}));
  assert.equal(response.status,200,await response.clone().text());assert.equal(patchCount,1);
  assert.match(lastWrite.url,/status=eq.awaiting_staff&workflow_revision=eq.0/);
  assert.equal(lastWrite.body.staff_responded_by_staff_user_id,staffId,'Staff actor identity comes from authenticated session');
  assert.equal(lastWrite.body.status,'staff_replied');
  assert.equal((await response.json()).notification_sent,false);
  assert.equal((await staffPost(make(adminPath,{followup_id:followupId,expected_revision:0,response:'A competing answer.'},{cookie:'rd_staff_session=token'}))).status,409,'Stale staff answer rejected');
  assert.equal((await customerPost(make(clientPath,{action:'confirm',followup_id:otherIssue,expected_revision:1,decision:'confirmed'}))).status,404,'Foreign confirmation blocked');
  assert.equal((await customerPost(make(clientPath,{action:'confirm',followup_id:followupId,expected_revision:2,decision:'confirmed'}))).status,409,'Stale customer decision blocked');
  response=await customerPost(make(clientPath,{action:'confirm',followup_id:followupId,expected_revision:1,decision:'needs_more_help',feedback:'We still need to know where to park.',staff_response:'forged'}));
  assert.equal(response.status,200,await response.clone().text());assert.equal(patchCount,2);
  assert.equal(lastWrite.body.status,'needs_more_help');assert.equal(lastWrite.body.staff_response,undefined);
  assert.equal(lastWrite.body.customer_feedback,'We still need to know where to park.');
  assert.equal((await customerPost(make(clientPath,{action:'confirm',followup_id:followupId,expected_revision:1,decision:'confirmed'}))).status,409,'Duplicate confirmation rejected');
  patchEmpty=true;items[0]={...initial,status:'staff_replied',workflow_revision:1};
  assert.equal((await customerPost(make(clientPath,{action:'confirm',followup_id:followupId,expected_revision:1,decision:'confirmed'}))).status,409,'Concurrent empty PATCH fails closed');
  patchEmpty=false;offline=true;
  assert.ok([401,503].includes((await customerGet(make(clientPath))).status),'Unavailable customer authority must fail closed');
  assert.ok([401,403,500,503].includes((await staffGet(make(adminPath,null,{cookie:'rd_staff_session=token'}))).status),'Unavailable staff authority must fail closed');
}finally{globalThis.fetch=savedFetch;}

const migration=read('../supabase/migrations/20261108154447_build814_customer_worksite_followup_requests.sql');
assert.match(migration,/unique\(customer_profile_id,client_request_id\)/);
assert.match(migration,/create unique index build814_one_outstanding_followup_per_issue/);
assert.match(migration,/alter table public\.customer_worksite_followups_v814 enable row level security/);
assert.match(migration,/alter table public\.customer_worksite_followup_events_v814 enable row level security/);
assert.match(migration,/revoke all on public\.customer_worksite_followups_v814 from public,anon,authenticated,service_role/);
assert.match(migration,/revoke all on public\.customer_worksite_followup_events_v814 from public,anon,authenticated,service_role/);
assert.match(migration,/security invoker/);assert.doesNotMatch(migration,/security definer/i);
assert.match(migration,/new\.workflow_revision <> old\.workflow_revision\+1/);
assert.match(migration,/before update or delete on public\.customer_worksite_followup_events_v814/);
assert.match(migration,/raise exception 'Recorded worksite follow-up events cannot be changed or deleted'/);
assert.equal(read('../my-account.html'),read('../my-account/index.html'));
assert.equal(read('../admin-today.html'),read('../admin-today/index.html'));
for(const id of ['build814Form','build814Issue','build814Kind','build814Text','build814CustomerHistory','build814CustomerStatus'])assert.match(read('../my-account.html'),new RegExp(`id="${id}"`));
assert.match(read('../admin-today.html'),/admin-worksite-followups-v814\.mjs\?v=build815/);
assert.match(read('../assets/customer-worksite-issues-v811.mjs'),/loadCustomerWorksiteFollowups814\(issues\)/);
assert.match(read('../assets/my-account-v355.js'),/20261108build815/);
assert.match(read('./current_booking_wizard_regression.sh'),/build814_customer_worksite_followup_test\.mjs/);
const source=read('../functions/api/client/worksite_followups_v814.js')+read('../functions/api/admin/worksite_followups_v814.js');
assert.doesNotMatch(source,/api\.stripe\.com|api-m\.paypal\.com|sendgrid|twilio|rest\/v1\/bookings[^`]*method:\s*'PATCH'/i);
console.log('Build 814 PASS: owner-bound follow-up, idempotent retry, staff permission, response actor, revision conflicts, customer confirmation, private audit and no hidden outreach.');
