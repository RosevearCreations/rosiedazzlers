import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet,onRequestPost,followupReadiness} from '../functions/api/admin/gift_delivery_followup.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const owner='68900000-0000-4000-8000-000000000001';
const operator='68900000-0000-4000-8000-000000000002';
const reviewer='68900000-0000-4000-8000-000000000003';
const c='68900000-0000-4000-8000-000000000004';
const g='68900000-0000-4000-8000-000000000005';
const a='68900000-0000-4000-8000-000000000006';
const session='cs_test_BUILD689CHECKOUTTEST';
const url='https://rosiedazzlers.ca/api/admin/gift_delivery_followup';
const env={SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'test-service'};
const iso=()=>new Date().toISOString();
const base=[{id:'68800000-0000-4000-8000-000000000004',attempt_id:a,
  event_kind:'owner_provider_outcome_triage',decision_code:'accepted_pending_recipient',created_at:iso()},
  {id:'68800000-0000-4000-8000-000000000006',attempt_id:a,
    event_kind:'owner_recipient_confirmation',decision_code:'recipient_explicitly_confirmed',created_at:iso()}];
const events=[],calls=[];
const originalFetch=globalThis.fetch;
async function digest(s){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',
  new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
globalThis.fetch=async(input,init={})=>{
  const u=new URL(input);calls.push({path:u.pathname,method:init.method||'GET'});
  assert.equal(u.hostname,'database.example.test');
  if(u.pathname.endsWith('/staff_auth_sessions')){
    const hash=u.searchParams.get('token_hash')?.replace('eq.','');
    const id=(await Promise.all(['owner-session','reviewer-session','operator-session'].map(digest))).indexOf(hash);
    const who=[owner,reviewer,operator][id];return Response.json(who?[{id:'session',
      staff_user:{id:who,role_code:who===owner?'admin':'detailer',full_name:'Test staff',
        is_active:true,permissions_profile:{}},revoked_at:null,
      expires_at:new Date(Date.now()+3600000).toISOString(),created_at:iso()}]:[]);
  }
  if(u.pathname.endsWith('/gift_issuance_review_cases'))return Response.json(
    u.searchParams.get('id')&&u.searchParams.get('id')!==`eq.${c}`?[]:
    [{id:c,stripe_session_id:session}]);
  if(u.pathname.endsWith('/gift_certificates'))return Response.json([{
    id:g,checkout_line_number:1,recipient_email:'sensitive@example.test'}]);
  if(u.pathname.endsWith('/gift_issuance_one_time_dispatch_attempts'))return Response.json([{
    id:a,certificate_id:g,status:'provider_accepted',operator_staff_user_id:operator}]);
  if(u.pathname.endsWith('/gift_issuance_delivery_outcome_reviews'))return Response.json(base);
  if(u.pathname.endsWith('/gift_issuance_delivery_followup_reviews'))return Response.json(events);
  if(u.pathname.endsWith('/staff_users'))return Response.json([
    {id:owner,full_name:'Owner',role_code:'admin'},
    {id:operator,full_name:'Operator',role_code:'detailer'},
    {id:reviewer,full_name:'Reviewer',role_code:'detailer'}]);
  if(u.pathname.endsWith('/rpc/record_gift_delivery_followup_review')){
    const b=JSON.parse(init.body);assert.equal(b.p_evidence_sha256.length,64);
    if(events.some(x=>x.event_kind===b.p_event_kind))return Response.json({error:'duplicate'},{status:409});
    if(b.p_event_kind==='owner_followup_assignment'&&(b.p_actor_id!==owner||b.p_reviewer_id!==reviewer))
      return Response.json({error:'owner independent assignment required'},{status:409});
    if(b.p_event_kind==='independent_recipient_recheck'&&
       (b.p_actor_id!==reviewer||!events.some(x=>x.event_kind==='owner_followup_assignment')))
      return Response.json({error:'assigned reviewer required'},{status:409});
    if(b.p_event_kind==='owner_no_resend_closeout'&&(b.p_actor_id!==owner||
       !events.some(x=>x.event_kind==='independent_recipient_recheck')))
      return Response.json({error:'independent evidence required'},{status:409});
    events.push({id:b.p_id,attempt_id:a,event_kind:b.p_event_kind,
      reviewer_staff_user_id:b.p_reviewer_id,decision_code:b.p_decision_code,
      evidence_kind:b.p_evidence_kind,evidence_reference:b.p_evidence_reference,
      observed_at:b.p_observed_at,created_at:iso()});
    return Response.json({id:b.p_id,customer_messages_sent:0,
      provider_dispatches:0,automatic_resend_permitted:false});
  }
  throw Error(`Unexpected ${u.pathname}`);
};
async function call(method,who,body,origin='https://rosiedazzlers.ca'){
  const r=new Request(url+(method==='GET'?`?session_id=${session}`:''),{
    method,headers:{cookie:`rd_staff_session=${who}-session`,
      ...(method==='POST'?{origin}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const response=await (method==='POST'?onRequestPost:onRequestGet)({request:r,env});
  return {status:response.status,data:await response.json()};
}
const body=()=>({session_id:session,case_id:c,certificate_id:g,attempt_id:a,
  review_id:crypto.randomUUID(),reviewer_id:reviewer,event_kind:'owner_followup_assignment',
  decision_code:'review_assigned',evidence_kind:'internal_exception_note',
  evidence_reference:'ASSIGN-689',observed_at:iso(),
  confirm_exact_attempt:true,confirm_genuine_evidence:true,confirm_permanent_no_resend:true});
try{
  assert.equal(followupReadiness({status:'provider_accepted'},base,[],{id:owner,is_admin:true}).can_assign,true);
  const ownerGET=await call('GET','owner');assert.equal(ownerGET.status,200);
  assert.equal(ownerGET.data.gifts[0].recipient_email_masked,'s***@example.test');
  assert.equal(ownerGET.data.gifts[0].original_operator_id,operator);
  assert.equal((await call('GET','reviewer')).data.gifts.length,0);
  assert.equal((await call('POST','reviewer',body())).status,400);
  const missing=body();missing.confirm_permanent_no_resend=false;
  assert.equal((await call('POST','owner',missing)).status,400);
  const tamper=body();tamper.case_id=crypto.randomUUID();
  assert.equal((await call('POST','owner',tamper)).status,409);
  const cross=body();assert.equal((await call('POST','owner',cross,'https://evil.example.test')).status,403);
  const assign=await call('POST','owner',body());assert.equal(assign.status,200);
  assert.equal(assign.data.result.provider_dispatches,0);
  assert.equal((await call('GET','reviewer')).data.gifts.length,1);
  assert.equal((await call('POST','owner',body())).status,409);
  const recheck=body();recheck.event_kind='independent_recipient_recheck';
  recheck.decision_code='recipient_evidence_supported';recheck.evidence_kind='provider_dashboard_reference';
  assert.equal((await call('POST','reviewer',recheck)).status,400,
    'Provider accepted is not independent recipient acknowledgment');
  recheck.evidence_kind='recipient_direct_reply';recheck.evidence_reference='REPLY-689';
  assert.equal((await call('POST','operator',recheck)).status,409);
  assert.equal((await call('POST','reviewer',recheck)).status,200);
  const closure=body();closure.event_kind='owner_no_resend_closeout';
  closure.decision_code='confirmed_no_resend_closed';closure.evidence_reference='CLOSE-689';
  assert.equal((await call('POST','reviewer',closure)).status,400);
  assert.equal((await call('POST','owner',closure)).status,200);
  const done=await call('GET','owner');assert.equal(done.data.gifts[0].followup_events.length,3);
  assert.equal(done.data.gifts[0].can_close,false);
  assert.ok(calls.every(x=>x.path.startsWith('/rest/v1/')&&
    (x.method==='GET'||x.path.endsWith('/rpc/record_gift_delivery_followup_review'))));
}finally{globalThis.fetch=originalFetch;}
const sql=read('supabase/migrations/20261027230000_build689_delivery_followup_and_integration_v1.sql');
assert.match(sql,/create table public.gift_issuance_delivery_followup_reviews/);
assert.match(sql,/create table public.rosevear_integration_v1_nonce_registry/);
assert.match(sql,/unique\(source_system,business_id,tenant_key,environment,key_id,nonce_sha256\)/);
assert.match(sql,/security invoker/);
assert.match(sql,/enable row level security/);
assert.match(sql,/v_recheck\.prior_review_sha256 is distinct from v_snapshot/);
assert.match(sql,/clock_timestamp\(\)-v_recheck.created_at>interval '24 hours'/);
assert.match(read('admin-gift-recovery-review.html'),/review689Followup/);
console.log('Build 689 independently assigned recipient evidence, owner no-resend closure and aging: PASS');
