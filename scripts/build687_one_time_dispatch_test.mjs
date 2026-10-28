import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet,onRequestPost,oneTimeReadiness} from '../functions/api/admin/gift_one_time_dispatch.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const owner='68700000-0000-4000-8000-000000000001';
const operator='68700000-0000-4000-8000-000000000002';
const c='68700000-0000-4000-8000-000000000003';
const gift='68700000-0000-4000-8000-000000000004';
const authorization='68700000-0000-4000-8000-000000000005';
const session='cs_test_build687_CHECKOUTID';
const url='https://rosiedazzlers.ca/api/admin/gift_one_time_dispatch';
const env={SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'test-service',
  STRIPE_SECRET_KEY:'sk_test_build687',NOTIFICATIONS_EMAIL_WEBHOOK_URL:'https://provider.example.test/send'};
const now=Date.now(),iso=n=>new Date(n).toISOString();
const delivery={delivery_status:'pending',recipient_provider_status:'not_submitted',
  purchaser_copy_status:'not_submitted',sender_name:'Gift purchaser'};
const giftRow={id:gift,status:'active',checkout_line_number:1,code:'DEMO-687',
  type:'amount',face_value_cents:10000,remaining_cents:10000,
  recipient_name:'Test Recipient',recipient_email:'recipient@example.test',
  purchase_context:{gift_delivery:delivery}};
const authRow={id:authorization,certificate_id:gift,operator_staff_user_id:operator,
  expires_at:iso(now+15*60000)};
const approvals=[],attempts=[],calls=[],notificationEvents=[];
let paid=true,providerAccepted=true,providerTimeout=false;
const originalFetch=globalThis.fetch;
async function digest(s){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',
  new TextEncoder().encode(s)))].map(x=>x.toString(16).padStart(2,'0')).join('');}
globalThis.fetch=async(input,init={})=>{
  const u=new URL(input),method=init.method||'GET';calls.push({host:u.hostname,path:u.pathname,method});
  if(u.hostname==='api.stripe.com'){
    assert.equal(method,'GET','Stripe payment is GET only');
    if(u.pathname.endsWith('line_items'))return Response.json({data:[{quantity:1}],has_more:false});
    return Response.json({id:session,status:'complete',mode:'payment',
      payment_status:paid?'paid':'unpaid',metadata:{purpose:'gift',cart:'gift:1:10000'},
      amount_total:10000,currency:'cad',payment_intent:'pi_build687',livemode:false});
  }
  if(u.hostname==='provider.example.test'){
    assert.equal(method,'POST');
    if(providerTimeout)throw Error('Network timeout after unknown provider state');
    const body=JSON.parse(init.body);assert.equal(body.recipient_email,giftRow.recipient_email);
    assert.equal(body.payload.attempt_id,attempts[0].id);
    return Response.json(providerAccepted?{message_id:'provider_687_ok'}:{error:'provider refused'},
      {status:providerAccepted?202:422});
  }
  assert.equal(u.hostname,'database.example.test');
  if(u.pathname.endsWith('/staff_auth_sessions')){
    const hash=u.searchParams.get('token_hash')?.replace('eq.','');
    const id=hash===await digest('owner-session')?owner:
      hash===await digest('operator-session')?operator:null;
    return Response.json(id?[{id:'signed-session',staff_user:{id,
      role_code:id===owner?'admin':'senior_detailer',full_name:'Signed Staff',is_active:true,
      permissions_profile:{}},revoked_at:null,expires_at:iso(now+3600000),created_at:iso(now-1000)}]:[]);
  }
  if(u.pathname.endsWith('/gift_issuance_review_cases'))
    return Response.json([{id:c,stripe_session_id:session,status:'ready_for_delivery_review'}]);
  if(u.pathname.endsWith('/gift_certificates'))return Response.json([giftRow]);
  if(u.pathname.endsWith('/gift_issuance_delivery_operator_authorizations'))return Response.json([authRow]);
  if(u.pathname.endsWith('/gift_issuance_one_time_dispatch_approvals'))return Response.json(approvals);
  if(u.pathname.endsWith('/gift_issuance_one_time_dispatch_attempts'))return Response.json(attempts);
  if(u.pathname.endsWith('/app_management_settings'))return Response.json([]);
  if(u.pathname.endsWith('/notification_events'))return Response.json(notificationEvents);
  if(u.pathname.endsWith('/rpc/record_gift_one_time_dispatch_approval')){
    const b=JSON.parse(init.body);
    if(b.p_owner_id!==owner||b.p_authorization_id!==authorization||!paid||approvals.length)
      return Response.json({error:'refused'},{status:409});
    approvals.push({id:b.p_id,certificate_id:gift,operator_staff_user_id:operator,
      expires_at:iso(now+5*60000)});
    return Response.json({id:b.p_id,approved_once:true,customer_messages_sent:0});
  }
  if(u.pathname.endsWith('/rpc/claim_gift_one_time_dispatch')){
    const b=JSON.parse(init.body);
    if(b.p_operator_id!==operator||b.p_certificate_id!==gift||b.p_case_id!==c||
       b.p_approval_id!==approvals[0]?.id||attempts.length||!paid)
      return Response.json({error:'refused'},{status:409});
    giftRow.purchase_context.gift_delivery={...delivery,delivery_status:'processing',
      notification_event_id:b.p_notification_id};
    attempts.push({id:b.p_attempt_id,certificate_id:gift,notification_event_id:b.p_notification_id,
      status:'in_flight'});
    notificationEvents.push({id:b.p_notification_id,event_type:'gift_scheduled_delivery_email',
      channel:'email',recipient_email:giftRow.recipient_email,
      subject:b.p_subject,body_text:b.p_body_text,body_html:b.p_body_html,
      payload:{attempt_id:b.p_attempt_id,gift_id:gift},status:'processing'});
    return Response.json({id:b.p_attempt_id,reserved_for_exactly_one_provider_call:true});
  }
  if(u.pathname.endsWith('/rpc/reconcile_gift_one_time_dispatch')){
    const b=JSON.parse(init.body);
    assert.equal(b.p_operator_id,operator);
    assert.equal(b.p_receipt_sha256.length,64);
    if(attempts[0]?.status!=='in_flight')return Response.json({error:'duplicate'},{status:409});
    attempts[0].status=b.p_outcome;notificationEvents[0].status=b.p_outcome==='provider_accepted'?'sent':'failed';
    return Response.json({id:b.p_attempt_id,provider_outcome:b.p_outcome,
      provider_accepted:b.p_outcome==='provider_accepted',inbox_delivered:false,no_automatic_retry:true});
  }
  throw Error(`Unexpected ${method} ${u.pathname}`);
};
async function call(method,who,body){const response=await (method==='POST'?onRequestPost:onRequestGet)({
  env,request:new Request(url+(method==='GET'?`?session_id=${session}`:''),{
    method,headers:{cookie:`rd_staff_session=${who}-session`,...(method==='POST'?{origin:'https://rosiedazzlers.ca'}:{})},
    ...(body?{body:JSON.stringify(body)}:{})})});
  return {status:response.status,body:await response.json()};}
const base={session_id:session,case_id:c,certificate_id:gift};
const approve=()=>({...base,action:'approve',approval_id:crypto.randomUUID(),
  authorization_id:authorization,confirm_exact_recipient:true,
  confirm_no_prior_send:true,confirm_owner_dispatch_approval:true});
const dispatch=id=>({...base,action:'dispatch',approval_id:id,attempt_id:crypto.randomUUID(),
  notification_id:crypto.randomUUID(),confirm_final_recipient:true,
  confirm_irreversible_send:true});
try{
  assert.equal(oneTimeReadiness(giftRow,authRow,null,null,true).can_owner_approve,true);
  assert.equal(oneTimeReadiness(giftRow,authRow,null,null,false).can_owner_approve,false);
  assert.equal((await call('GET','owner')).body.gifts[0].can_owner_approve,true);
  assert.equal((await call('GET','operator')).body.gifts[0].can_owner_approve,true);
  assert.equal((await call('POST','operator',approve())).status,403);
  const invalid=approve();invalid.confirm_no_prior_send=false;
  assert.equal((await call('POST','owner',invalid)).status,403);
  paid=false;assert.equal((await call('POST','owner',approve())).status,409);paid=true;
  const first=await call('POST','owner',approve());assert.equal(first.status,200);
  assert.equal(first.body.result.customer_messages_sent,0);
  const id=first.body.result.id;
  assert.equal((await call('POST','owner',approve())).status,409);
  const afterApproval=await call('GET','operator');
  assert.equal(afterApproval.body.gifts[0].is_assigned_operator,true);
  assert.equal(afterApproval.body.gifts[0].can_operator_dispatch,true);
  assert.equal((await call('POST','owner',dispatch(id))).status,409);
  delete env.NOTIFICATIONS_EMAIL_WEBHOOK_URL;
  assert.equal((await call('POST','operator',dispatch(id))).status,409);
  assert.equal(attempts.length,0,'No provider URL cannot burn the single send slot');
  env.NOTIFICATIONS_EMAIL_WEBHOOK_URL='https://provider.example.test/send';
  const beforeProvider=calls.filter(x=>x.host==='provider.example.test').length;
  const send=await call('POST','operator',dispatch(id));assert.equal(send.status,200);
  assert.equal(send.body.provider_accepted,true);assert.equal(send.body.inbox_delivered,false);
  assert.equal(send.body.receipt.no_automatic_retry,true);
  assert.equal(calls.filter(x=>x.host==='provider.example.test').length,beforeProvider+1);
  assert.equal((await call('POST','operator',dispatch(id))).status,409);
  assert.equal(calls.filter(x=>x.host==='provider.example.test').length,beforeProvider+1,
    'Second click must not produce duplicate send');
  assert.equal((await call('GET','operator')).body.gifts[0].outcome,'provider_accepted');
  // New synthetic fixtures prove 4xx rejection and ambiguous timeout never resend.
  for(const mode of ['rejected','timeout']){
    approvals.length=0;attempts.length=0;notificationEvents.length=0;
    giftRow.purchase_context.gift_delivery={...delivery};
    providerAccepted=false;providerTimeout=mode==='timeout';
    const approved=await call('POST','owner',approve());assert.equal(approved.status,200);
    const result=await call('POST','operator',dispatch(approved.body.result.id));
    assert.equal(result.status,200);
    assert.equal(result.body.provider_accepted,false);
    assert.equal(result.body.provider_outcome,mode==='rejected'?'provider_rejected':'outcome_unknown');
    const count=calls.filter(x=>x.host==='provider.example.test').length;
    assert.equal((await call('POST','operator',dispatch(approved.body.result.id))).status,409);
    assert.equal(calls.filter(x=>x.host==='provider.example.test').length,count);
  }
  assert.equal((await onRequestPost({env,request:new Request(url,{method:'POST',
    headers:{origin:'https://attacker.example.test'}})})).status,403);
  assert.equal(calls.filter(x=>x.host==='api.stripe.com'&&x.method!=='GET').length,0);
}finally{globalThis.fetch=originalFetch;}
const sql=read('supabase/migrations/20261027210000_build687_gift_one_time_dispatch.sql');
assert.match(sql,/create table public.gift_issuance_one_time_dispatch_approvals/);
assert.match(sql,/certificate_id uuid not null unique/);
assert.match(sql,/create function public.claim_gift_one_time_dispatch/);
assert.match(sql,/pg_advisory_xact_lock/);
assert.match(sql,/receipt_last_seen_at/);
assert.match(sql,/next_attempt_at=null/);
assert.match(sql,/max_attempts=1/);
assert.match(sql,/from public,anon,authenticated/);
assert.match(read('admin-gift-recovery-review.html'),/review687OneTimeDispatch/);
assert.match(read('admin-gift-recovery-review.html'),/admin-gift-one-time-dispatch-v687.js/);
console.log('Build 687 owner/operator one-time dispatch and provider reconciliation tests: PASS');
