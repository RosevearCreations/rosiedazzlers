import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet,onRequestPost,recurrenceReadiness} from '../functions/api/admin/gift_delivery_closure_recurrence.js';
const ids={owner:'69000000-0000-4000-8000-000000000010',operator:'69000000-0000-4000-8000-000000000011',
  first:'69000000-0000-4000-8000-000000000012',third:'69000000-0000-4000-8000-000000000013',
  case:'69000000-0000-4000-8000-000000000014',gift:'69000000-0000-4000-8000-000000000015',
  attempt:'69000000-0000-4000-8000-000000000016',closure:'69000000-0000-4000-8000-000000000017'};
const session='cs_test_BUILD690_TEST_SESSION',url='https://rosiedazzlers.ca/api/admin/gift_delivery_closure_recurrence';
const env={SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'test-service'};
const iso=()=>new Date().toISOString(),events=[],calls=[],originalFetch=globalThis.fetch;
const closure={id:ids.closure,attempt_id:ids.attempt,event_kind:'owner_no_resend_closeout',
  actor_staff_user_id:ids.owner,decision_code:'confirmed_no_resend_closed',
  created_at:new Date(Date.now()-25*3600000).toISOString()};
async function digest(s){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))]
  .map(x=>x.toString(16).padStart(2,'0')).join('');}
globalThis.fetch=async(input,init={})=>{
  const u=new URL(input),method=init.method||'GET';calls.push({path:u.pathname,method});
  assert.equal(u.hostname,'database.example.test');
  if(u.pathname.endsWith('/staff_auth_sessions')){
    const tokens=await Promise.all(['owner-token','operator-token','first-token','third-token'].map(digest));
    const n=tokens.indexOf(u.searchParams.get('token_hash')?.replace('eq.',''));const id=Object.values(ids)[n];
    return Response.json(n<0?[]:[{id:'signed-session',staff_user:{id,role_code:n?'detailer':'admin',
      full_name:'Signed staff',is_active:true,permissions_profile:{}},revoked_at:null,
      expires_at:new Date(Date.now()+3600000).toISOString(),created_at:iso()}]);}
  if(u.pathname.endsWith('/gift_issuance_review_cases'))return Response.json(
    u.searchParams.has('id')&&u.searchParams.get('id')!==`eq.${ids.case}`?[]:
      [{id:ids.case,stripe_session_id:session}]);
  if(u.pathname.endsWith('/gift_certificates'))return Response.json([{
    id:ids.gift,checkout_line_number:1,recipient_email:'private@example.test'}]);
  if(u.pathname.endsWith('/gift_issuance_one_time_dispatch_attempts'))return Response.json([{
    id:ids.attempt,certificate_id:ids.gift,operator_staff_user_id:ids.operator}]);
  if(u.pathname.endsWith('/gift_issuance_delivery_followup_reviews'))return Response.json([
    closure,{event_kind:'independent_recipient_recheck',attempt_id:ids.attempt,actor_staff_user_id:ids.first}]);
  if(u.pathname.endsWith('/gift_issuance_delivery_closure_recurrence'))return Response.json(events);
  if(u.pathname.endsWith('/staff_users'))return Response.json(Object.entries(ids).slice(0,4).map(([k,id])=>
    ({id,full_name:k,role_code:k==='owner'?'admin':'detailer'})));
  if(u.pathname.endsWith('/rpc/record_gift_delivery_closure_recurrence')){
    const b=JSON.parse(init.body);assert.equal(b.p_evidence_sha256.length,64);
    if(events.some(x=>x.event_kind===b.p_event_kind))return Response.json({error:'duplicate'},{status:409});
    if(b.p_event_kind==='owner_watch_opened'&&(b.p_actor_id!==ids.owner||b.p_reviewer_id!==ids.third))
      return Response.json({error:'third independent reviewer required'},{status:409});
    if(b.p_event_kind==='independent_recurrence_audited'&&(b.p_actor_id!==ids.third||events.length!==1))
      return Response.json({error:'assigned third reviewer required'},{status:409});
    if(b.p_event_kind==='owner_no_resend_alert_ack'&&(b.p_actor_id!==ids.owner||events.length!==2))
      return Response.json({error:'owner cannot bypass recheck'},{status:409});
    events.push({id:b.p_id,attempt_id:ids.attempt,event_kind:b.p_event_kind,
      reviewer_staff_user_id:b.p_reviewer_id,decision_code:b.p_decision_code,
      evidence_kind:b.p_evidence_kind,evidence_reference:b.p_evidence_reference,
      observed_at:b.p_observed_at,created_at:iso()});
    return Response.json({id:b.p_id,customer_messages_sent:0,provider_dispatches:0,
      automatic_resend_permitted:false});
  }
  throw Error('Unexpected provider contact '+u.pathname);
};
async function call(method,who,body,origin='https://rosiedazzlers.ca'){
  const r=new Request(url+(method==='GET'?`?session_id=${session}`:''),{method,
    headers:{cookie:`rd_staff_session=${who}-token`,...(method==='POST'?{origin}:{})},
    ...(body?{body:JSON.stringify(body)}:{})});
  const response=await (method==='GET'?onRequestGet:onRequestPost)({request:r,env});
  return {status:response.status,data:await response.json()};
}
const body=()=>({session_id:session,case_id:ids.case,certificate_id:ids.gift,attempt_id:ids.attempt,
  closure_id:ids.closure,event_id:crypto.randomUUID(),reviewer_id:ids.third,
  event_kind:'owner_watch_opened',decision_code:'watch_requested',evidence_kind:'internal_exception_note',
  evidence_reference:'WATCH-690-A',observed_at:iso(),confirm_exact_closure:true,
  confirm_independent_source:true,confirm_no_resend:true});
try{
  assert.equal(recurrenceReadiness(closure,[],{id:ids.owner,is_admin:true}).no_resend_alert_due,true);
  assert.equal((await call('GET','owner')).data.gifts[0].recipient_email_masked,'p***@example.test');
  assert.equal((await call('GET','third')).data.gifts.length,0);
  assert.equal((await call('POST','third',body())).status,400);
  const missing=body();missing.confirm_no_resend=false;
  assert.equal((await call('POST','owner',missing)).status,400);
  assert.equal((await call('POST','owner',body(),'https://other.test')).status,403);
  const reused=body();reused.reviewer_id=ids.first;
  assert.equal((await call('POST','owner',reused)).status,409);
  assert.equal((await call('POST','owner',body())).status,200);
  assert.equal((await call('GET','third')).data.gifts.length,1);
  assert.equal((await call('POST','owner',body())).status,409);
  const audit=body();audit.event_kind='independent_recurrence_audited';
  audit.decision_code='recurrence_detected';audit.evidence_kind='recipient_reported_missing';
  assert.equal((await call('POST','first',audit)).status,409);
  assert.equal((await call('POST','third',audit)).status,200);
  assert.equal((await call('GET','owner')).data.gifts[0].recurrence_unresolved,true);
  const ack=body();ack.event_kind='owner_no_resend_alert_ack';
  ack.decision_code='acknowledged_no_resend';
  assert.equal((await call('POST','owner',ack)).status,200);
  assert.equal((await call('GET','owner')).data.gifts[0].no_resend_alert_due,false);
  assert.equal((await call('POST','owner',ack)).status,409);
  assert.ok(calls.every(x=>x.path.startsWith('/rest/v1/')&&
    (x.method==='GET'||x.path.endsWith('/rpc/record_gift_delivery_closure_recurrence'))));
}finally{globalThis.fetch=originalFetch;}
const sql=readFileSync(new URL('../supabase/migrations/20261028010000_build690_gift_recurrence_alert_integration_readiness.sql',import.meta.url),'utf8');
assert.match(sql,/security invoker/);assert.match(sql,/enable row level security/);
assert.match(sql,/unique\(attempt_id,event_kind\)/);
assert.match(sql,/v_attempt.operator_staff_user_id/);
assert.match(sql,/owner_no_resend_alert_ack/);
assert.match(readFileSync(new URL('../admin-gift-recovery-review.html',import.meta.url),'utf8'),/review690Recurrence/);
console.log('Build 690 independent recurrence, owner no-resend aging and denial tests: PASS');
