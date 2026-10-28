import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet,onRequestPost,reopeningReadiness} from '../functions/api/admin/gift_delivery_reopened_exception.js';
const ids={owner:'69100000-0000-4000-8000-000000000010',operator:'69100000-0000-4000-8000-000000000011',
  first:'69100000-0000-4000-8000-000000000012',third:'69100000-0000-4000-8000-000000000013',
  fourth:'69100000-0000-4000-8000-000000000014',case:'69100000-0000-4000-8000-000000000015',
  gift:'69100000-0000-4000-8000-000000000016',attempt:'69100000-0000-4000-8000-000000000017',
  audit:'69100000-0000-4000-8000-000000000018'};
const session='cs_test_BUILD691_REOPEN_CHECKOUT',url='https://rosiedazzlers.ca/api/admin/gift_delivery_reopened_exception';
const env={SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'test-service'};
const iso=()=>new Date().toISOString(),reopened=[],calls=[],originalFetch=globalThis.fetch;
const recurrence={id:ids.audit,attempt_id:ids.attempt,event_kind:'independent_recurrence_audited',
  decision_code:'recurrence_detected',actor_staff_user_id:ids.third,
  created_at:new Date(Date.now()-26*3600000).toISOString()};
async function digest(s){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))]
  .map(x=>x.toString(16).padStart(2,'0')).join('');}
globalThis.fetch=async(input,init={})=>{
  const u=new URL(input),method=init.method||'GET';calls.push({path:u.pathname,method});
  assert.equal(u.hostname,'database.example.test');
  if(u.pathname.endsWith('/staff_auth_sessions')){
    const tokens=await Promise.all(['owner-token','operator-token','first-token','third-token','fourth-token'].map(digest));
    const n=tokens.indexOf(u.searchParams.get('token_hash')?.replace('eq.',''));
    return Response.json(n<0?[]:[{id:'signed-session',staff_user:{id:Object.values(ids)[n],
      role_code:n?'detailer':'admin',full_name:'Staff member',is_active:true,permissions_profile:{}},
      revoked_at:null,expires_at:new Date(Date.now()+3600000).toISOString(),created_at:iso()}]);}
  if(u.pathname.endsWith('/gift_issuance_review_cases'))return Response.json(
    u.searchParams.get('id')&&u.searchParams.get('id')!==`eq.${ids.case}`?[]:[{id:ids.case,stripe_session_id:session}]);
  if(u.pathname.endsWith('/gift_certificates'))return Response.json([{
    id:ids.gift,checkout_line_number:1,recipient_email:'secret@example.test'}]);
  if(u.pathname.endsWith('/gift_issuance_one_time_dispatch_attempts'))return Response.json([{
    id:ids.attempt,certificate_id:ids.gift,operator_staff_user_id:ids.operator}]);
  if(u.pathname.endsWith('/gift_issuance_delivery_followup_reviews'))return Response.json([{
    attempt_id:ids.attempt,event_kind:'independent_recipient_recheck',actor_staff_user_id:ids.first}]);
  if(u.pathname.endsWith('/gift_issuance_delivery_closure_recurrence'))return Response.json([
    {attempt_id:ids.attempt,event_kind:'owner_watch_opened',reviewer_staff_user_id:ids.third},recurrence]);
  if(u.pathname.endsWith('/gift_issuance_delivery_reopened_exception_reviews'))return Response.json(reopened);
  if(u.pathname.endsWith('/staff_users'))return Response.json(Object.entries(ids).slice(0,5).map(([k,id])=>
    ({id,full_name:k,role_code:k==='owner'?'admin':'detailer'})));
  if(u.pathname.endsWith('/rpc/record_gift_delivery_reopened_exception_review')){
    const b=JSON.parse(init.body);assert.equal(b.p_evidence_sha256.length,64);
    if(reopened.some(x=>x.event_kind===b.p_event_kind))return Response.json({error:'duplicate'},{status:409});
    if(b.p_event_kind==='owner_exception_reopened'&&(b.p_actor_id!==ids.owner||b.p_reviewer_id!==ids.fourth))
      return Response.json({error:'fourth distinct reviewer required'},{status:409});
    if(b.p_event_kind==='independent_aging_reassessed'&&(b.p_actor_id!==ids.fourth||reopened.length!==1))
      return Response.json({error:'assigned fourth reviewer required'},{status:409});
    if(b.p_event_kind==='owner_hold_continuity_ack'&&(b.p_actor_id!==ids.owner||reopened.length!==2))
      return Response.json({error:'owner cannot bypass fourth review'},{status:409});
    reopened.push({id:b.p_id,attempt_id:ids.attempt,event_kind:b.p_event_kind,
      reviewer_staff_user_id:b.p_reviewer_id,decision_code:b.p_decision_code,
      evidence_kind:b.p_evidence_kind,evidence_reference:b.p_evidence_reference,
      observed_at:b.p_observed_at,created_at:iso()});
    return Response.json({id:b.p_id,reopened_exception_still_held:true,customer_messages_sent:0,
      provider_dispatches:0,automatic_resend_permitted:false});
  }
  throw Error('Unexpected provider request '+u.pathname);
};
async function call(method,who,body,origin='https://rosiedazzlers.ca'){
  const r=new Request(url+(method==='GET'?`?session_id=${session}`:''),{method,
    headers:{cookie:`rd_staff_session=${who}-token`,...(method==='POST'?{origin}:{})},
    ...(body?{body:JSON.stringify(body)}:{})});
  const res=await (method==='GET'?onRequestGet:onRequestPost)({request:r,env});
  return {status:res.status,data:await res.json()};}
const body=()=>({session_id:session,case_id:ids.case,certificate_id:ids.gift,attempt_id:ids.attempt,
  recurrence_review_id:ids.audit,event_id:crypto.randomUUID(),reviewer_id:ids.fourth,
  event_kind:'owner_exception_reopened',decision_code:'reopen_recurrence_detected',
  evidence_kind:'internal_exception_note',evidence_reference:'REOPEN-691-CASE',observed_at:iso(),
  confirm_exact_recurrence:true,confirm_fourth_independence:true,confirm_no_resend:true});
try{
  assert.equal(reopeningReadiness(recurrence,[],{id:ids.owner,is_admin:true}).aging_alert_due,true);
  assert.equal((await call('GET','owner')).data.gifts[0].recipient_email_masked,'s***@example.test');
  assert.equal((await call('GET','fourth')).data.gifts.length,0);
  assert.equal((await call('POST','fourth',body())).status,400);
  const missing=body();missing.confirm_no_resend=false;
  assert.equal((await call('POST','owner',missing)).status,400);
  assert.equal((await call('POST','owner',body(),'https://evil.test')).status,403);
  const reused=body();reused.reviewer_id=ids.third;
  assert.equal((await call('POST','owner',reused)).status,409);
  assert.equal((await call('POST','owner',body())).status,200);
  assert.equal((await call('GET','fourth')).data.gifts.length,1);
  assert.equal((await call('POST','owner',body())).status,409);
  const reassess=body();reassess.event_kind='independent_aging_reassessed';
  reassess.decision_code='still_unresolved';reassess.evidence_kind='recipient_reported_missing';
  assert.equal((await call('POST','third',reassess)).status,409);
  assert.equal((await call('POST','fourth',reassess)).status,200);
  const hold=body();hold.event_kind='owner_hold_continuity_ack';
  hold.decision_code='manual_hold_acknowledged';
  assert.equal((await call('POST','owner',hold)).status,200);
  const done=await call('GET','owner');assert.equal(done.data.gifts[0].events.length,3);
  assert.equal(done.data.gifts[0].unresolved_recurring_exception,true);
  assert.equal((await call('POST','owner',hold)).status,409);
  assert.ok(calls.every(x=>x.path.startsWith('/rest/v1/')&&
    (x.method==='GET'||x.path.endsWith('/rpc/record_gift_delivery_reopened_exception_review'))));
}finally{globalThis.fetch=originalFetch;}
const sql=readFileSync(new URL('../supabase/migrations/20261028020000_build691_gift_reopen_and_ql245_handoff.sql',import.meta.url),'utf8');
assert.match(sql,/unique\(attempt_id,event_kind\)/);
assert.match(sql,/v_recheck.actor_staff_user_id,v_watch.reviewer_staff_user_id/);
assert.match(sql,/security invoker/);assert.match(sql,/enable row level security/);
assert.match(readFileSync(new URL('../admin-gift-recovery-review.html',import.meta.url),'utf8'),/review691Reopened/);
console.log('Build 691 fourth independent gift exception reopening, aging reassessment, HOLD/no-resend tests: PASS');
