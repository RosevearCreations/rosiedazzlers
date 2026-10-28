import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet,onRequestPost,reviewReadiness} from '../functions/api/admin/gift_delivery_outcome_review.js';
import {build688RollbackCanary} from './build688_delivery_outcome_canary.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const owner='68800000-0000-4000-8000-000000000010';
const operator='68800000-0000-4000-8000-000000000011';
const session='cs_test_BUILD688TESTSESSION';
const c='68800000-0000-4000-8000-000000000012';
const g='68800000-0000-4000-8000-000000000013';
const a='68800000-0000-4000-8000-000000000014';
const event='68800000-0000-4000-8000-000000000015';
const url='https://rosiedazzlers.ca/api/admin/gift_delivery_outcome_review';
const env={SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'test-service'};
const reviews=[],calls=[];
let outcome='provider_accepted',rpcFails=false;
const originalFetch=globalThis.fetch;
async function digest(s){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',
  new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
globalThis.fetch=async(input,init={})=>{
  const u=new URL(input),method=init.method||'GET';calls.push({url:u.href,method});
  assert.equal(u.hostname,'database.example.test','No provider or Stripe calls permitted');
  if(u.pathname.endsWith('/staff_auth_sessions')){
    const hash=u.searchParams.get('token_hash')?.replace('eq.','');
    const who=hash===await digest('owner-session')?owner:hash===await digest('operator-session')?operator:null;
    return Response.json(who?[{id:'session',staff_user:{id:who,role_code:who===owner?'admin':'detailer',
      full_name:'Staff',is_active:true,permissions_profile:{}},revoked_at:null,
      expires_at:new Date(Date.now()+3600000).toISOString(),created_at:new Date().toISOString()}]:[]);
  }
  if(u.pathname.endsWith('/gift_issuance_review_cases'))return Response.json(
    u.searchParams.get('id')&&u.searchParams.get('id')!==`eq.${c}`?[]:
    [{id:c,stripe_session_id:session}]);
  if(u.pathname.endsWith('/gift_certificates'))return Response.json([{id:g,checkout_line_number:1,
    recipient_email:'private-recipient@example.test'}]);
  if(u.pathname.endsWith('/gift_issuance_one_time_dispatch_attempts'))return Response.json([{
    id:a,certificate_id:g,notification_event_id:event,status:outcome}]);
  if(u.pathname.endsWith('/gift_issuance_one_time_dispatch_receipts'))return Response.json([{
    attempt_id:a,provider_outcome:outcome}]);
  if(u.pathname.endsWith('/gift_issuance_delivery_outcome_reviews'))return Response.json(reviews);
  if(u.pathname.endsWith('/rpc/record_gift_delivery_outcome_review')){
    if(rpcFails)return Response.json({error:'record rejected'},{status:409});
    const b=JSON.parse(init.body);assert.equal(b.p_owner_id,owner);
    assert.equal(b.p_evidence_sha256.length,64);
    if(reviews.some(r=>r.event_kind===b.p_event_kind)||
      (b.p_event_kind!=='owner_provider_outcome_triage'&&reviews.length===0))
      return Response.json({error:'existing record or triage required'},{status:409});
    reviews.push({id:b.p_id,attempt_id:a,event_kind:b.p_event_kind,
      decision_code:b.p_decision_code,evidence_kind:b.p_evidence_kind,
      evidence_reference:b.p_evidence_reference,observed_at:b.p_observed_at,created_at:new Date().toISOString()});
    return Response.json({id:b.p_id,provider_dispatches:0,customer_messages_sent:0,
      payment_mutations:0,automatic_resend_permitted:false});
  }
  throw Error(`Unexpected ${method} ${u.pathname}`);
};
async function call(method,who,body,headers={}){
  const request=new Request(url+(method==='GET'?`?session_id=${session}`:''),{
    method,headers:{cookie:`rd_staff_session=${who}-session`,
      ...(method==='POST'?{origin:'https://rosiedazzlers.ca'}:{}),...headers},
    ...(body?{body:JSON.stringify(body)}:{})});
  const res=await (method==='POST'?onRequestPost:onRequestGet)({request,env});
  return {status:res.status,body:await res.json(),headers:res.headers};
}
const base=()=>({session_id:session,case_id:c,certificate_id:g,attempt_id:a,
  review_id:crypto.randomUUID(),event_kind:'owner_provider_outcome_triage',
  decision_code:'accepted_pending_recipient',evidence_kind:'provider_receipt',
  evidence_reference:'PROVIDER-688',observed_at:new Date().toISOString(),
  confirm_exact_gift:true,confirm_independent_evidence:true,confirm_no_resend:true});
try{
  assert.equal(reviewReadiness({status:outcome}).can_triage,true);
  const first=await call('GET','owner');assert.equal(first.status,200);
  assert.equal(first.body.gifts[0].provider_outcome,outcome);
  assert.equal(first.body.gifts[0].recipient_email_masked,'p***@example.test');
  assert.match(first.headers.get('cache-control'),/no-store/);
  assert.equal((await call('GET','operator')).status,403);
  assert.equal((await call('POST','operator',base())).status,403);
  const bad=base();bad.confirm_no_resend=false;
  assert.equal((await call('POST','owner',bad)).status,400);
  const pi=base();pi.evidence_reference='recipient@example.test';
  assert.equal((await call('POST','owner',pi)).status,400);
  const foreign=base();foreign.case_id=crypto.randomUUID();
  assert.equal((await call('POST','owner',foreign)).status,409);
  const wrong=base();wrong.decision_code='rejected_no_resend';
  assert.equal((await call('POST','owner',wrong)).status,409);
  const premature=base();premature.event_kind='owner_recipient_confirmation';
  premature.decision_code='recipient_explicitly_confirmed';premature.evidence_kind='recipient_direct_reply';
  assert.equal((await call('POST','owner',premature)).status,409);
  const triage=await call('POST','owner',base());assert.equal(triage.status,200);
  assert.equal(triage.body.customer_messages_sent,0);
  assert.equal(triage.body.provider_dispatches,0);
  assert.equal((await call('POST','owner',base())).status,409);
  const receiptOnly=base();receiptOnly.event_kind='owner_recipient_confirmation';
  receiptOnly.decision_code='recipient_explicitly_confirmed';
  assert.equal((await call('POST','owner',receiptOnly)).status,400);
  const confirmed=base();confirmed.event_kind='owner_recipient_confirmation';
  confirmed.decision_code='recipient_explicitly_confirmed';
  confirmed.evidence_kind='verified_phone_conversation';
  confirmed.evidence_reference='PHONE-ACK-688';
  assert.equal((await call('POST','owner',confirmed)).status,200);
  const escalate=base();escalate.event_kind='owner_no_resend_escalation';
  escalate.decision_code='evidence_conflict';escalate.evidence_kind='internal_exception_note';
  assert.equal((await call('POST','owner',escalate)).status,200);
  const after=await call('GET','owner');
  assert.equal(after.body.gifts[0].recipient_confirmed,true);
  assert.equal(after.body.gifts[0].no_resend_escalated,true);
  assert.equal(after.body.gifts[0].can_triage,false);
  assert.equal(after.body.gifts[0].reviews.length,3);
  rpcFails=true;assert.equal((await call('POST','owner',base())).status,409);
  assert.equal((await call('POST','owner',base(),{origin:'https://attacker.example.test'})).status,403);
  assert.equal(calls.filter(x=>x.method==='POST'&&!x.url.includes('/rpc/record_gift_delivery_outcome_review')).length,0);
}finally{globalThis.fetch=originalFetch;}
const migration=read('supabase/migrations/20261027220000_build688_delivery_outcome_triage.sql');
assert.match(migration,/create table public.gift_issuance_delivery_outcome_reviews/);
assert.match(migration,/unique\(attempt_id,event_kind\)/);
assert.match(migration,/enable row level security/);
assert.match(migration,/security invoker/);
assert.match(migration,/pg_advisory_xact_lock/);
assert.match(migration,/owner_recipient_confirmation/);
assert.match(migration,/recipient_direct_reply/);
assert.match(migration,/reject_gift_closeout_audit_change/);
assert.match(read('admin-gift-recovery-review.html'),/review688DeliveryOutcome/);
assert.match(read('admin-gift-recovery-review.html'),/admin-gift-delivery-outcome-v688.js/);
assert.ok(build688RollbackCanary().includes('BUILD681_EXPECTED_ROLLBACK'));
console.log('Build 688 owner-only outcome triage, recipient acknowledgment, no-resend regression: PASS');
