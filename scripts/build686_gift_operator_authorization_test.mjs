import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet,onRequestPost,operatorReadiness} from '../functions/api/admin/gift_operator_authorization.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const env={SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'test-key',
  STRIPE_SECRET_KEY:'sk_test_build686'};
const owner='68600000-0000-4000-8000-000000000001';
const operator='68600000-0000-4000-8000-000000000002';
const c='68600000-0000-4000-8000-000000000003';
const gift='68600000-0000-4000-8000-000000000004';
const renewal='68600000-0000-4000-8000-000000000005';
const release='68600000-0000-4000-8000-000000000006';
const handoff='68600000-0000-4000-8000-000000000007';
const session='cs_test_build686_TESTSESSION';
const now=Date.now(),iso=x=>new Date(x).toISOString();
const delivery={delivery_status:'pending',recipient_provider_status:'not_submitted',
  purchaser_copy_status:'not_submitted'};
const giftRow={id:gift,status:'active',checkout_line_number:1,
  purchase_context:{gift_delivery:delivery}};
const renewalRow={id:renewal,created_at:iso(now),provider_checked_at:iso(now)};
const releaseRow={id:release,certificate_id:gift,renewal_event_id:renewal,created_at:iso(now)};
const handoffRow={id:handoff,certificate_id:gift,release_event_id:release,created_at:iso(now)};
const assignments=[],rpc=[],calls=[];
let paid=true,recurrence=false;
const originalFetch=globalThis.fetch;
async function digest(s){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',
  new TextEncoder().encode(s)))].map(n=>n.toString(16).padStart(2,'0')).join('');}
globalThis.fetch=async(url,init={})=>{
  const u=new URL(url),method=init.method||'GET';calls.push([u.hostname,u.pathname,method]);
  if(u.hostname==='api.stripe.com'){
    assert.equal(method,'GET','Stripe is read-only');
    if(u.pathname.endsWith('/line_items'))return Response.json({data:[{quantity:1}],has_more:false});
    return Response.json({id:session,mode:'payment',status:'complete',payment_status:paid?'paid':'unpaid',
      metadata:{purpose:'gift',cart:'gift:1:10000'},amount_total:10000,currency:'cad',
      payment_intent:'pi_build686_test',livemode:false});
  }
  assert.equal(u.hostname,'database.example.test');
  if(u.pathname.endsWith('/staff_auth_sessions')){
    const hash=u.searchParams.get('token_hash')?.replace('eq.','');
    const id=hash===await digest('owner-session')?owner:
      hash===await digest('operator-session')?operator:null;
    return Response.json(id?[{id:'session',staff_user:{id,role_code:id===owner?'admin':'senior_detailer',
      full_name:'Test Staff',is_active:true,permissions_profile:{}},
      revoked_at:null,expires_at:iso(now+3600000),created_at:iso(now-2000)}]:[]);
  }
  if(u.pathname.endsWith('/gift_issuance_review_cases'))return Response.json([
    {id:c,stripe_session_id:session,status:'ready_for_delivery_review'}]);
  if(u.pathname.endsWith('/gift_issuance_hold_renewal_events'))return Response.json([renewalRow]);
  if(u.pathname.endsWith('/gift_issuance_review_followup_events'))return Response.json(
    recurrence?[{id:crypto.randomUUID(),created_at:iso(now+1000)}]:[]);
  if(u.pathname.endsWith('/gift_certificates'))return Response.json([giftRow]);
  if(u.pathname.endsWith('/gift_issuance_verified_release_events'))return Response.json([releaseRow]);
  if(u.pathname.endsWith('/gift_issuance_manual_delivery_handoffs'))return Response.json([handoffRow]);
  if(u.pathname.endsWith('/gift_issuance_delivery_operator_authorizations'))return Response.json(assignments);
  if(u.pathname.endsWith('/staff_users'))return Response.json([
    {id:owner,full_name:'Owner',role_code:'admin'},
    {id:operator,full_name:'Senior Operator',role_code:'senior_detailer'}]);
  if(u.pathname.endsWith('/rpc/record_gift_delivery_operator_authorization')){
    const b=JSON.parse(init.body);rpc.push(b);
    if(b.p_case_id!==c||b.p_handoff_id!==handoff||b.p_certificate_id!==gift||
       b.p_owner_id!==owner||b.p_operator_id!==operator||!paid||recurrence||assignments.length)
      return Response.json({error:'refused'},{status:409});
    assignments.push({id:b.p_event_id,case_id:c,certificate_id:gift,
      operator_staff_user_id:operator,expires_at:iso(now+900000)});
    return Response.json({id:b.p_event_id,operator_preparation_authorized:true,
      manual_delivery_authorized_now:false,customer_messages_sent:0,payment_mutations:0});
  }
  throw Error(`Unexpected request ${method} ${u.pathname}`);
};
const url='https://rosiedazzlers.ca/api/admin/gift_operator_authorization';
async function call(method,body=null,who='owner',suffix=''){
  const response=await (method==='GET'?onRequestGet:onRequestPost)({
    request:new Request(url+suffix,{method,headers:{cookie:`rd_staff_session=${who}-session`,
      ...(method==='POST'?{origin:'https://rosiedazzlers.ca'}:{})},
      ...(body?{body:JSON.stringify(body)}:{})}),env});
  return {status:response.status,body:await response.json(),headers:response.headers};
}
const payload=()=>({event_id:crypto.randomUUID(),session_id:session,case_id:c,
  certificate_id:gift,handoff_event_id:handoff,operator_staff_user_id:operator,
  confirm_one_certificate:true,confirm_no_prior_send:true,confirm_preparation_only:true});
try{
  assert.equal(operatorReadiness(giftRow,releaseRow,handoffRow,null,renewalRow,false,true).can_authorize,true);
  assert.equal(operatorReadiness(giftRow,releaseRow,handoffRow,null,renewalRow,true,true).can_authorize,false);
  assert.equal(operatorReadiness(giftRow,releaseRow,handoffRow,null,renewalRow,false,false).can_authorize,false);
  assert.equal(operatorReadiness(giftRow,releaseRow,null,null,renewalRow,false,true).can_authorize,false);
  assert.equal(operatorReadiness(giftRow,releaseRow,{...handoffRow,created_at:iso(now-3*3600000)},
    null,renewalRow,false,true).can_authorize,false);
  assert.equal(operatorReadiness({...giftRow,purchase_context:{gift_delivery:{...delivery,
    recipient_provider_status:'queued'}}},releaseRow,handoffRow,null,renewalRow,false,true).can_authorize,false);
  const get=await call('GET',null,'owner',`?session_id=${session}`);
  assert.equal(get.status,200);assert.equal(get.body.gifts[0].can_authorize,true);
  assert.equal(get.body.operators.length,1,'Owner excluded from assignable operators');
  assert.equal((await call('GET',null,'operator',`?session_id=${session}`)).body.gifts.length,0,
    'Operator must not inspect unrelated gifts');
  assert.equal((await call('POST',payload(),'operator')).status,403);
  assert.equal((await call('GET',null,'owner','?session_id=bad')).status,400);
  const missing=payload();missing.confirm_preparation_only=false;
  assert.equal((await call('POST',missing)).status,400);
  const self=payload();self.operator_staff_user_id=owner;
  assert.equal((await call('POST',self)).status,400);
  paid=false;assert.equal((await call('POST',payload())).status,409);paid=true;
  recurrence=true;assert.equal((await call('GET',null,'owner',`?session_id=${session}`)).body.gifts[0].can_authorize,false);
  assert.equal((await call('POST',payload())).status,409);recurrence=false;
  const result=await call('POST',payload());assert.equal(result.status,200);
  assert.equal(result.headers.get('cache-control'),'no-store, private');
  assert.equal(result.body.result.manual_delivery_authorized_now,false);
  assert.equal(result.body.customer_messages_sent,0);
  assert.equal(rpc.at(-1).p_provider_check,'paid_verified');
  const after=await call('GET',null,'operator',`?session_id=${session}`);
  assert.equal(after.body.gifts.length,1);
  assert.equal(after.body.gifts[0].operator_review_current,true);
  assert.equal((await call('POST',payload())).status,409);
  assert.equal((await onRequestPost({request:new Request(url,{method:'POST',
    headers:{origin:'https://other.example.test'}}),env})).status,403);
  assert.equal(calls.filter(x=>x[0]==='api.stripe.com'&&x[2]!=='GET').length,0);
}finally{globalThis.fetch=originalFetch;}
const sql=read('supabase/migrations/20261027200000_build686_gift_operator_authorization.sql');
assert.match(sql,/enable row level security/);
assert.match(sql,/operator_staff_user_id uuid not null/);
assert.match(sql,/operator_is_not_owner/);
assert.match(sql,/handoff_event_id uuid not null unique/);
assert.match(sql,/security invoker/);
assert.match(sql,/gift_operator_auth_append_only/);
assert.match(sql,/pg_advisory_xact_lock/);
assert.match(sql,/p_checked_at<clock_timestamp\(\)-interval '5 minutes'/);
assert.match(sql,/v_handoff\.receipt_last_seen_at is distinct from v_receipt\.last_seen_at/);
assert.match(sql,/p_evidence_sha256 is distinct from v_handoff\.provider_evidence_sha256/);
assert.match(sql,/manual_delivery_authorized_now',false/);
assert.match(sql,/customer_messages_sent',0/);
assert.match(read('admin-gift-recovery-review.html'),/review686OperatorAuthorization/);
assert.match(read('admin-gift-recovery-review.html'),/admin-gift-operator-authorization-v686\.js/);
console.log('Build 686 owner/operator authorization, final readiness and no-dispatch tests: PASS');
