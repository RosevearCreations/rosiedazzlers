import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet,onRequestPost,handoffPreview} from '../functions/api/admin/gift_manual_delivery_handoff.js';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const env={SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'test-key',
  STRIPE_SECRET_KEY:'sk_test_build685'};
const owner='68500000-0000-4000-8000-000000000001';
const auditor='68500000-0000-4000-8000-000000000002';
const c='68500000-0000-4000-8000-000000000003';
const gift='68500000-0000-4000-8000-000000000004';
const renewal='68500000-0000-4000-8000-000000000005';
const release='68500000-0000-4000-8000-000000000006';
const session='cs_test_build685_TESTSESSION';
const now=Date.now(),iso=x=>new Date(x).toISOString();
const deliveries={delivery_status:'pending',recipient_provider_status:'not_submitted',
  purchaser_copy_status:'not_submitted'};
const giftRow={id:gift,status:'active',checkout_line_number:1,purchase_context:{gift_delivery:deliveries}};
const renewalRow={id:renewal,created_at:iso(now),provider_checked_at:iso(now)};
const releaseRow={id:release,case_id:c,certificate_id:gift,renewal_event_id:renewal,created_at:iso(now)};
const handoffs=[],rpc=[],requests=[];
let paid=true,recurrence=false;
const originalFetch=globalThis.fetch;
async function digest(s){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',
  new TextEncoder().encode(s)))].map(n=>n.toString(16).padStart(2,'0')).join('');}
globalThis.fetch=async(url,init={})=>{
  const u=new URL(url),method=init.method||'GET';requests.push([u.hostname,u.pathname,method]);
  if(u.hostname==='api.stripe.com'){
    assert.equal(method,'GET','Stripe must remain read-only');
    if(u.pathname.endsWith('/line_items'))return Response.json({data:[{quantity:1}],has_more:false});
    return Response.json({id:session,mode:'payment',status:'complete',
      payment_status:paid?'paid':'unpaid',metadata:{purpose:'gift',cart:'gift:1:10000'},
      amount_total:10000,currency:'cad',payment_intent:'pi_build685_test',livemode:false});
  }
  assert.equal(u.hostname,'database.example.test');
  if(u.pathname.endsWith('/staff_auth_sessions')){
    const hash=u.searchParams.get('token_hash')?.replace('eq.','');
    const id=hash===await digest('owner-session')?owner:
      hash===await digest('auditor-session')?auditor:null;
    return Response.json(id?[{id:'session',staff_user:{id,role_code:id===owner?'admin':'detailer',
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
  if(u.pathname.endsWith('/gift_issuance_manual_delivery_handoffs'))return Response.json(handoffs);
  if(u.pathname.endsWith('/rpc/record_gift_manual_delivery_handoff')){
    const b=JSON.parse(init.body);rpc.push(b);
    if(b.p_case_id!==c||b.p_release_id!==release||b.p_certificate_id!==gift||
       b.p_actor_id!==owner||!paid||recurrence||handoffs.length)
      return Response.json({error:'refused'},{status:409});
    handoffs.push({id:b.p_event_id,case_id:c,certificate_id:gift,
      release_event_id:release,created_at:iso(now)});
    return Response.json({id:b.p_event_id,manual_operator_review_ready:true,
      customer_messages_sent:0,payment_mutations:0});
  }
  throw Error(`Unexpected ${method} ${u.pathname}`);
};
const url='https://rosiedazzlers.ca/api/admin/gift_manual_delivery_handoff';
async function call(method,body=null,who='owner',suffix=''){
  const response=await (method==='GET'?onRequestGet:onRequestPost)({
    request:new Request(url+suffix,{method,headers:{cookie:`rd_staff_session=${who}-session`,
      ...(method==='POST'?{origin:'https://rosiedazzlers.ca'}:{})},
      ...(body?{body:JSON.stringify(body)}:{})}),env});
  return {status:response.status,body:await response.json(),headers:response.headers};
}
const payload=()=>({event_id:crypto.randomUUID(),session_id:session,case_id:c,
  certificate_id:gift,release_event_id:release,confirm_manual_handoff:true,
  confirm_no_delivery_attempt:true,confirm_no_automatic_send:true});
try{
  assert.equal(handoffPreview(giftRow,releaseRow,null,renewalRow,false,true).candidate,true);
  assert.equal(handoffPreview(giftRow,releaseRow,null,renewalRow,true,true).candidate,false);
  assert.equal(handoffPreview(giftRow,releaseRow,null,renewalRow,false,false).candidate,false);
  assert.equal(handoffPreview(giftRow,null,null,renewalRow,false,true).candidate,false);
  assert.equal(handoffPreview(giftRow,{...releaseRow,created_at:iso(now-4*3600000)},
    null,renewalRow,false,true).candidate,false);
  assert.equal(handoffPreview({...giftRow,purchase_context:{gift_delivery:{...deliveries,
    recipient_provider_status:'sent'}}},releaseRow,null,renewalRow,false,true).candidate,false);
  assert.equal((await call('GET',null,'owner',`?session_id=${session}`)).body.gifts[0].candidate,true);
  assert.equal((await call('GET',null,'auditor',`?session_id=${session}`)).status,403);
  assert.equal((await call('GET',null,'owner','?session_id=invalid')).status,400);
  assert.equal((await call('POST',payload(),'auditor')).status,403);
  const partial=payload();partial.confirm_no_automatic_send=false;
  assert.equal((await call('POST',partial)).status,400);
  paid=false;assert.equal((await call('POST',payload())).status,409);paid=true;
  recurrence=true;assert.equal((await call('GET',null,'owner',`?session_id=${session}`)).body.gifts[0].candidate,false);
  assert.equal((await call('POST',payload())).status,409);recurrence=false;
  const result=await call('POST',payload());assert.equal(result.status,200);
  assert.equal(result.headers.get('cache-control'),'no-store, private');
  assert.equal(result.body.customer_messages_sent,0);
  assert.equal(result.body.result.manual_operator_review_ready,true);
  assert.equal(rpc.at(-1).p_provider_check,'paid_verified');
  assert.equal((await call('GET',null,'owner',`?session_id=${session}`)).body.gifts[0].candidate,false);
  assert.equal((await call('POST',payload())).status,409,'No duplicate handoff');
  assert.equal((await onRequestPost({request:new Request(url,{method:'POST',
    headers:{origin:'https://untrusted.test'}}),env})).status,403);
  assert.equal(requests.filter(r=>r[0]==='api.stripe.com'&&r[2]!=='GET').length,0);
}finally{globalThis.fetch=originalFetch;}
const sql=read('supabase/migrations/20261027190000_build685_manual_gift_delivery_handoff.sql');
assert.match(sql,/enable row level security/);
assert.match(sql,/release_event_id uuid not null unique/);
assert.match(sql,/security invoker/);
assert.match(sql,/gift_manual_handoff_append_only/);
assert.match(sql,/pg_advisory_xact_lock/);
assert.match(sql,/p_checked_at<clock_timestamp\(\)-interval '5 minutes'/);
assert.match(sql,/v_release\.receipt_last_seen_at is distinct from v_receipt\.last_seen_at/);
assert.match(sql,/payload->>'gift_id'=p_certificate_id::text/);
assert.match(sql,/v_release\.provider_evidence_sha256/);
assert.match(sql,/manual_delivery_authorized_now',false/);
assert.match(sql,/customer_messages_sent',0/);
assert.match(read('admin-gift-recovery-review.html'),/review685ManualHandoff/);
assert.match(read('admin-gift-recovery-review.html'),/admin-gift-manual-handoff-v685\.js/);
console.log('Build 685 receipt validation, manual-handoff and recurrence/no-send tests: PASS');
