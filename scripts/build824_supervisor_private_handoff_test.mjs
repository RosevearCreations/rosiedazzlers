import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet,onRequestPost,validNote824} from '../functions/api/admin/worksite_review_notes_v824.js';

const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const staffId='aa00dffd-194d-4cb1-84bd-50a95ab44e84';
const followupId='e8a0f599-cd22-44c0-9fa4-c992998a9a4e';
const requestId='f9a0f599-cd22-44c0-9fa4-c992998a9a4f';
const noteId='b8a0f599-cd22-44c0-9fa4-c992998a9a4e';
const payload={followup_id:followupId,request_id:requestId,exception_key:'reviewPast',expected_revision:3,note_text:'Supervisor reviewed verified ownership and scheduled next internal handoff.'};
assert.equal(validNote824(payload)?.id,followupId);
for(const change of [{request_id:'bad'},{exception_key:'unknown'},{expected_revision:-1},{expected_revision:null},{note_text:'Tiny'},{note_text:'x'.repeat(501)},{note_text:'Bad\u0000control'},{followup_id:'invalid'}]){
  assert.equal(validNote824({...payload,...change}),null,'invalid payload should not be accepted');
}
let signed=true,role='operations_manager',canManage=true,online=true,revision=3,writes=0,notes=[];
const sessionActor=()=>({id:staffId,full_name:'Supervisor',is_active:true,role_code:role,can_manage_bookings:true,
  permissions_profile:{action_access:{'operations.customer.manage':true,'operations.assignment.manage':canManage}}});
const env={SUPABASE_URL:'https://supabase-mock.invalid',SUPABASE_SERVICE_ROLE_KEY:'test-only'};
const call=(verb='GET',body=payload,origin='https://www.rosiedazzlers.ca',cookie='rd_staff_session=token')=>({
  request:new Request('https://www.rosiedazzlers.ca/api/admin/worksite_review_notes_v824?followup_id='+followupId,{
    method:verb,headers:{...(cookie?{Cookie:cookie}:{}),...(verb==='POST'?{'Content-Type':'application/json',Origin:origin}:{})},
    ...(verb==='POST'?{body:JSON.stringify(body)}:{})}),
  env
});
const originalFetch=globalThis.fetch;
globalThis.fetch=async(url,init={})=>{
  if(!online)throw Error('Offline');
  const path=new URL(url),table=path.pathname.split('/').pop(),query=path.searchParams,method=init.method||'GET';
  if(table==='staff_auth_sessions')return Response.json(signed?[{expires_at:'2031-01-01T00:00:00Z',revoked_at:null,staff_user:sessionActor()}]:[]);
  if(table==='customer_worksite_followups_v814')return Response.json([{id:followupId,workflow_revision:revision}]);
  if(table==='customer_worksite_supervisor_notes_v824'){
    if(method==='GET'&&query.has('request_id'))return Response.json(notes.filter(n=>n.actor_staff_user_id===staffId&&query.get('request_id')==='eq.'+n.request_id));
    if(method==='GET'&&query.has('followup_id'))return Response.json(notes.slice().reverse());
    if(method==='POST'){
      writes++;const row=JSON.parse(init.body)[0];
      if(row.actor_staff_user_id!==staffId)throw Error('Must bind signed staff actor');
      const saved={id:noteId,...row,recorded_at:'2026-11-09T00:00:00Z'};
      notes.push(saved);return Response.json([saved]);
    }
  }
  throw Error('Unexpected database route '+table);
};
try{
  signed=false;assert.equal((await onRequestGet(call())).status,401);signed=true;
  role='detailer';assert.equal((await onRequestGet(call())).status,403);
  assert.equal((await onRequestPost(call('POST'))).status,403);
  role='operations_manager';canManage=false;assert.equal((await onRequestGet(call())).status,403);
  assert.equal((await onRequestPost(call('POST'))).status,403);canManage=true;
  assert.equal((await onRequestPost(call('POST',payload,'https://attacker.invalid'))).status,403);
  assert.equal((await onRequestPost(call('POST',payload,'https://www.rosiedazzlers.ca',''))).status,401);
  assert.equal((await onRequestPost(call('POST',{...payload,expected_revision:2}))).status,409);
  assert.equal((await onRequestPost(call('POST',{...payload,note_text:'No'}))).status,400);
  assert.equal(writes,0);
  const first=await onRequestPost(call('POST'));assert.equal(first.status,201,await first.clone().text());
  const firstJson=await first.json();assert.equal(firstJson.private_supervisor_only,true);assert.equal(firstJson.customer_message_sent,false);assert.equal(writes,1);
  const replay=await onRequestPost(call('POST'));assert.equal(replay.status,200);
  assert.equal((await replay.json()).replayed,true);assert.equal(writes,1);
  assert.equal((await onRequestPost(call('POST',{...payload,note_text:'Another note with the same request identifier.'}))).status,409);
  const history=await onRequestGet(call());assert.equal(history.status,200);
  const detail=await history.json();assert.equal(detail.history.length,1);assert.equal(detail.history[0].note_text,payload.note_text);
  role='detailer';assert.equal((await onRequestGet(call())).status,403,'Private notes must never be accessible to regular staff');
  role='operations_manager';online=false;assert.ok([401,503].includes((await onRequestGet(call())).status));online=true;
}finally{globalThis.fetch=originalFetch;}
const sql=read('../supabase/migrations/20261109002900_build824_supervisor_private_handoff_notes.sql');
assert.match(sql,/enable row level security/i);
assert.match(sql,/revoke all on public.customer_worksite_supervisor_notes_v824 from public,anon,authenticated,service_role/i);
assert.match(sql,/grant select,insert on public.customer_worksite_supervisor_notes_v824 to service_role/i);
assert.doesNotMatch(sql,/grant (?:update|delete)|security definer/i);
assert.match(sql,/unique \(actor_staff_user_id,request_id\)/i);
const api=read('../functions/api/admin/worksite_review_notes_v824.js');
for(const token of ['sameOrigin811','staffAccess811','operations.assignment.manage','workflow_revision','actor_staff_user_id','request_id','private_supervisor_only'])assert.ok(api.includes(token),'Missing API security contract '+token);
assert.doesNotMatch(api,/email|twilio|sendgrid|stripe.com|localStorage|sessionStorage/i);
const app=read('../assets/admin-worksite-followups-v814.mjs');
for(const token of ['createSupervisorHandoff824','reviewHandoff824.mount()','reviewHandoff824?.update','canAssign&&!!staffId','editingNote824'])assert.ok(app.includes(token),'Missing reviewer integration: '+token);
const ui=read('../assets/build824-supervisor-handoff.mjs');
for(const token of ['build824SaveHandoff','build824ReadHistory','build824RefreshSource','build824HandoffStatus','private_supervisor_only','credentials','readHistory','verifiedHistoryIds.has(noteId)'])assert.ok(ui.includes(token),'Missing accessible verification '+token);
assert.doesNotMatch(ui,/sessionStorage|localStorage|createObjectURL|clipboard|\.download\s*=/);
const html=read('../admin-today.html');
assert.equal(html,read('../admin-today/index.html'));
assert.match(html,/Build 824/);
assert.match(html,/admin-worksite-followups-v814\.mjs\?v=build824/);
assert.match(html,/worksite-issues-v811\.css\?v=build824/);
assert.match(read('../assets/worksite-issues-v811.css'),/\.build824-handoff/);
assert.match(read('./current_booking_wizard_regression.sh'),/build824_supervisor_private_handoff_test\.mjs/);
console.log('Build 824 PASS: signed session + supervisor action, private source-backed append-only notes, replay safety, exact readback, accessible source recovery and no customer mutations.');
