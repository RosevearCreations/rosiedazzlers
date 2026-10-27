import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet,onRequestPost,giftReleasePreview} from '../functions/api/admin/gift_verified_release.js';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const env={SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'test-key',
  STRIPE_SECRET_KEY:'sk_test_build684'};
const owner='68400000-0000-4000-8000-000000000001';
const auditor='68400000-0000-4000-8000-000000000002';
const c='68400000-0000-4000-8000-000000000003';
const gift='68400000-0000-4000-8000-000000000004';
const renewal='68400000-0000-4000-8000-000000000005';
const session='cs_test_build684_TESTSESSION';
const now=Date.now(),iso=x=>new Date(x).toISOString();
const deliveries={delivery_status:'pending',recipient_provider_status:'not_submitted',
  purchaser_copy_status:'not_submitted'};
const giftRow={id:gift,checkout_line_number:1,status:'active',
  purchase_context:{gift_delivery:deliveries}};
const renewalRow={id:renewal,case_id:c,event_kind:'owner_hold_continuity_acknowledged',
  reason:'owner_requested_renewal',recurrence_detected:false,provider_checked_at:iso(now),
  created_at:iso(now)};
const releaseRows=[],rpc=[],requests=[];
let paid=true,recurrence=false;
const originalFetch=globalThis.fetch;
async function digest(s){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',
  new TextEncoder().encode(s)))].map(n=>n.toString(16).padStart(2,'0')).join('');}
globalThis.fetch=async(url,init={})=>{
  const u=new URL(url);const method=init.method||'GET';
  requests.push([u.hostname,u.pathname,method]);
  if(u.hostname==='api.stripe.com'){
    assert.equal(method,'GET','Stripe is read-only');
    if(u.pathname.endsWith('/line_items'))return Response.json({data:[{quantity:1}],has_more:false});
    return Response.json({id:session,mode:'payment',status:'complete',payment_status:paid?'paid':'unpaid',
      metadata:{purpose:'gift',cart:'gift:1:10000'},amount_total:10000,currency:'cad',
      payment_intent:'pi_build684_test',livemode:false});
  }
  assert.equal(u.hostname,'database.example.test');
  if(u.pathname.endsWith('/staff_auth_sessions')){
    const hash=u.searchParams.get('token_hash')?.replace('eq.','');
    const id=hash===await digest('owner-session')?owner:
      hash===await digest('auditor-session')?auditor:null;
    return Response.json(id?[{id:'session',staff_user:{id,
      role_code:id===owner?'admin':'detailer',full_name:'Test Staff',is_active:true,
      permissions_profile:{}},revoked_at:null,expires_at:iso(now+3600000),
      created_at:iso(now-2000)}]:[]);
  }
  if(u.pathname.endsWith('/gift_issuance_review_cases'))return Response.json([
    {id:c,stripe_session_id:session,status:'ready_for_delivery_review'}]);
  if(u.pathname.endsWith('/gift_issuance_hold_renewal_events'))return Response.json([renewalRow]);
  if(u.pathname.endsWith('/gift_issuance_review_followup_events'))return Response.json(
    recurrence?[{id:crypto.randomUUID(),event_kind:'recurrence_opened',
      created_at:iso(now+1000)}]:[]);
  if(u.pathname.endsWith('/gift_certificates'))return Response.json([giftRow]);
  if(u.pathname.endsWith('/gift_issuance_verified_release_events'))return Response.json(releaseRows);
  if(u.pathname.endsWith('/rpc/record_gift_verified_release')){
    const body=JSON.parse(init.body);rpc.push(body);
    if(body.p_case_id!==c||body.p_certificate_id!==gift||body.p_renewal_id!==renewal||
       body.p_actor_id!==owner||!paid||recurrence)return Response.json({error:'refused'},{status:409});
    if(releaseRows.length)return Response.json({error:'duplicate'},{status:409});
    releaseRows.push({id:body.p_event_id,certificate_id:gift,case_id:c,
      renewal_event_id:renewal,created_at:iso(now)});
    return Response.json({id:body.p_event_id,idempotent:false,
      manual_delivery_eligible:true,customer_messages_sent:0,payment_mutations:0});
  }
  throw Error(`Unexpected request ${method} ${u.pathname}`);
};
const url='https://rosiedazzlers.ca/api/admin/gift_verified_release';
async function call(method,body=null,who='owner',suffix=''){
  const response=await (method==='GET'?onRequestGet:onRequestPost)({request:new Request(url+suffix,{
    method,headers:{cookie:`rd_staff_session=${who}-session`,
      ...(method==='POST'?{origin:'https://rosiedazzlers.ca'}:{})},
    ...(body?{body:JSON.stringify(body)}:{})}),env});
  return {status:response.status,body:await response.json(),headers:response.headers};
}
const payload=()=>({event_id:crypto.randomUUID(),session_id:session,case_id:c,
  certificate_id:gift,renewal_event_id:renewal,
  confirm_single_certificate_release:true,confirm_no_prior_send:true});
try{
  assert.equal(giftReleasePreview(giftRow,renewalRow,null).candidate,true);
  assert.equal(giftReleasePreview(giftRow,renewalRow,null,true).candidate,false);
  assert.equal(giftReleasePreview({...giftRow,purchase_context:{gift_delivery:{
    ...deliveries,recipient_provider_status:'sent'}}},renewalRow,null).candidate,false);
  assert.equal(giftReleasePreview(giftRow,{...renewalRow,
    provider_checked_at:iso(now-3*3600000)},null).candidate,false);
  assert.equal((await call('GET',null,'owner',`?session_id=${session}`)).body.gifts[0].candidate,true);
  assert.equal((await call('GET',null,'auditor',`?session_id=${session}`)).status,403);
  assert.equal((await call('GET',null,'owner','?session_id=invalid')).status,400);
  assert.equal((await call('POST',payload(),'auditor')).status,403);
  const missing=payload();missing.confirm_no_prior_send=false;
  assert.equal((await call('POST',missing)).status,400);
  paid=false;assert.equal((await call('POST',payload())).status,409);paid=true;
  recurrence=true;assert.equal((await call('POST',payload())).status,409);recurrence=false;
  const attempt=payload(),result=await call('POST',attempt);
  assert.equal(result.status,200);
  assert.equal(result.headers.get('cache-control'),'no-store, private');
  assert.equal(result.body.result.manual_delivery_eligible,true);
  assert.equal(result.body.customer_messages_sent,0);
  assert.equal(result.body.payment_mutations,0);
  assert.equal(rpc.at(-1).p_provider_check,'paid_verified');
  assert.equal((await call('GET',null,'owner',`?session_id=${session}`)).body.gifts[0].candidate,false);
  assert.equal((await call('POST',payload())).status,409,'Never release one gift twice');
  const foreign=new Request(url,{method:'POST',headers:{origin:'https://untrusted.example.test'}});
  assert.equal((await onRequestPost({request:foreign,env})).status,403);
  assert.equal(requests.filter(r=>r[0]==='api.stripe.com'&&r[2]!=='GET').length,0);
}finally{globalThis.fetch=originalFetch;}
const sql=read('supabase/migrations/20261027180000_build684_verified_gift_release.sql');
assert.match(sql,/enable row level security/);
assert.match(sql,/certificate_id uuid not null unique/);
assert.match(sql,/grant select,insert .*to service_role/);
assert.match(sql,/security invoker/);
assert.match(sql,/gift_verified_release_append_only/);
assert.match(sql,/pg_advisory_xact_lock/);
assert.match(sql,/p_checked_at<clock_timestamp\(\)-interval '5 minutes'/);
assert.match(sql,/payload->>'gift_id'=p_certificate_id::text/);
assert.match(sql,/recipient_provider_status}'\) is distinct from 'not_submitted'/);
assert.match(sql,/p_evidence_sha256 is distinct from v_renewal.provider_evidence_sha256/);
assert.match(sql,/manual_delivery_eligible',true/);
assert.match(sql,/customer_messages_sent',0/);
assert.match(read('admin-gift-recovery-review.html'),/review684VerifiedRelease/);
assert.match(read('admin-gift-recovery-review.html'),/admin-gift-verified-release-v684\.js/);
console.log('Build 684 one-gift verified owner release and zero-dispatch negative tests: PASS');
