import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet,onRequestPost,classifyGiftHoldFollowup} from '../functions/api/admin/gift_hold_followup.js';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const originalFetch=globalThis.fetch;
const env={SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'test-key',
  STRIPE_SECRET_KEY:'sk_test_build682'};
const owner='68200000-0000-4000-8000-000000000001';
const reviewer='68200000-0000-4000-8000-000000000002';
const auditor='68200000-0000-4000-8000-000000000003';
const caseId='68200000-0000-4000-8000-000000000004';
const closeout='68200000-0000-4000-8000-000000000005';
const sourceId='68200000-0000-4000-8000-000000000006';
const session='cs_test_build682_TESTSESSION';const now=Date.now(),iso=n=>new Date(n).toISOString();
const cases=[{id:caseId,stripe_session_id:session,status:'ready_for_delivery_review',updated_at:iso(now)}];
const rechecks=[{id:closeout,case_id:caseId,event_kind:'owner_closeout_recorded',created_at:iso(now-5*3600000)}];
const recurrences=[];
const sources=[{id:sourceId,case_id:caseId,closeout_event_id:closeout,
  event_kind:'owner_continuity_closed',auditor_staff_user_id:auditor,
  provider_checked_at:iso(now-3*3600000),created_at:iso(now-3*3600000)}];
const followups=[],rpcCalls=[],calls=[];let paid=true;
const staff=id=>({id,role_code:id===owner?'admin':'detailer',full_name:'Test staff',
  is_active:true,permissions_profile:{}});
async function digest(s){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))]
  .map(n=>n.toString(16).padStart(2,'0')).join('');}
globalThis.fetch=async(url,init={})=>{
  const u=new URL(url),method=init.method||'GET';calls.push([u.hostname,u.pathname,method]);
  if(u.hostname==='api.stripe.com'){
    assert.equal(method,'GET','No payment or gift mutation may call Stripe');
    if(u.pathname.endsWith('/line_items'))return Response.json({data:[{quantity:1}],has_more:false});
    return Response.json({id:session,mode:'payment',status:'complete',payment_status:paid?'paid':'unpaid',
      metadata:{purpose:'gift',cart:'gift:1:10000'},amount_total:10000,currency:'cad',
      payment_intent:'pi_build682_test',livemode:false});
  }
  assert.equal(u.hostname,'database.example.test');
  if(u.pathname.endsWith('/staff_auth_sessions')){
    const h=u.searchParams.get('token_hash')?.replace('eq.','');
    const id=h===await digest('owner-session')?owner:h===await digest('auditor-session')?auditor:
      h===await digest('reviewer-session')?reviewer:null;
    return Response.json(id?[{id:'session',staff_user:staff(id),revoked_at:null,
      expires_at:iso(now+3600000),created_at:iso(now-2000)}]:[]);
  }
  if(u.pathname.endsWith('/gift_issuance_review_cases'))return Response.json(cases);
  if(u.pathname.endsWith('/gift_issuance_review_recheck_events'))return Response.json(rechecks);
  if(u.pathname.endsWith('/gift_issuance_review_followup_events'))return Response.json(recurrences);
  if(u.pathname.endsWith('/gift_issuance_hold_continuity_events')){
    const scope=u.searchParams.get('auditor_staff_user_id');
    return Response.json(sources.filter(s=>!scope||scope===`eq.${s.auditor_staff_user_id}`).slice().reverse());
  }
  if(u.pathname.endsWith('/gift_issuance_hold_followup_events')){
    const scope=u.searchParams.get('auditor_staff_user_id');
    return Response.json(followups.filter(s=>!scope||scope===`eq.${s.auditor_staff_user_id}`).slice().reverse());
  }
  if(u.pathname.endsWith('/rpc/record_gift_hold_followup_event')){
    const b=JSON.parse(init.body);rpcCalls.push(b);
    const last=followups.at(-1);
    if(b.p_case_id!==caseId||b.p_continuity_id!==sourceId||b.p_auditor_id!==auditor||
       b.p_reference_id!==(last?.id||null)||
       (b.p_action==='independent_outcome_rechecked'&&b.p_actor_id!==auditor)||
       (b.p_action!=='independent_outcome_rechecked'&&b.p_actor_id!==owner)||
       (b.p_action==='independent_outcome_rechecked'&&last?.event_kind!=='exception_followup_opened')||
       (b.p_action==='owner_followup_closed'&&last?.event_kind!=='independent_outcome_rechecked'))
      return Response.json({error:'Owner/auditor source mismatch'},{status:409});
    followups.push({id:b.p_event_id,case_id:caseId,closeout_event_id:closeout,
      continuity_event_id:sourceId,auditor_staff_user_id:auditor,event_kind:b.p_action,
      reason:b.p_reason,provider_checked_at:b.p_checked_at,created_at:iso(now+followups.length*1000)});
    return Response.json({id:b.p_event_id,event_kind:b.p_action,owner_hold:true,
      customer_delivery_authorized:false,customer_messages_sent:0});
  }
  throw Error(`Unexpected ${method} ${u.pathname}`);
};
const endpoint='https://rosiedazzlers.ca/api/admin/gift_hold_followup';
const call=async(method,body=null,actor='owner',suffix='')=>{
  const request=new Request(endpoint+suffix,{method,headers:{cookie:`rd_staff_session=${actor}-session`,
    ...(method==='POST'?{origin:'https://rosiedazzlers.ca'}:{})},
    ...(body?{body:JSON.stringify(body)}:{})});
  const response=await (method==='GET'?onRequestGet:onRequestPost)({request,env});
  return {status:response.status,body:await response.json(),headers:response.headers};
};
const payload=(action,ref=null,reason='owner_closure_aged')=>({event_id:crypto.randomUUID(),
  case_id:caseId,closeout_event_id:closeout,continuity_event_id:sourceId,auditor_id:auditor,
  action,reason,reference_event_id:ref,acknowledge_customer_hold:true});
try{
  assert.equal(classifyGiftHoldFollowup(cases[0],rechecks[0],rechecks[0],sources[0],sources[0],
    null,[],now).reason,'owner_closure_aged');
  assert.equal(classifyGiftHoldFollowup(cases[0],rechecks[0],rechecks[0],
    {...sources[0],event_kind:'independent_recheck_attested'},sources[0],null,[],now).reason,
    'independent_outcome_aged');
  assert.equal(classifyGiftHoldFollowup(cases[0],rechecks[0],rechecks[0],sources[0],sources[0],
    null,[{event_kind:'recurrence_opened',created_at:iso(now)}],now).reason,'recurrence_reopened');
  assert.equal(classifyGiftHoldFollowup({...cases[0],status:'assigned'},rechecks[0],rechecks[0],
    sources[0],sources[0],null,[],now).reason,'source_superseded');
  assert.equal(classifyGiftHoldFollowup(cases[0],rechecks[0],rechecks[0],sources[0],sources[0],
    {provider_checked_at:iso(now-50*3600000)},[],now).aging_band,'escalation_48h');
  const view=await call('GET');assert.equal(view.status,200);
  assert.equal(view.headers.get('cache-control'),'no-store, private');
  assert.equal(view.body.cases[0].monitor.phase,'owner_exception_review');
  assert.equal((await call('GET',null,'auditor')).body.cases.length,1);
  assert.equal((await call('GET',null,'reviewer')).body.cases.length,0);
  assert.equal((await call('GET',null,'owner','?session_id=invalid')).status,400);
  const open=payload('exception_followup_opened');
  assert.equal((await call('POST',open,'auditor')).status,400);
  assert.equal((await call('POST',{...open,acknowledge_customer_hold:false})).status,400);
  assert.equal((await call('POST',open)).status,200);
  const independent=payload('independent_outcome_rechecked',open.event_id);
  assert.equal((await call('POST',independent)).status,400);
  paid=false;
  assert.equal((await call('POST',independent,'auditor')).status,409);
  paid=true;
  const res=await call('POST',independent,'auditor');
  assert.equal(res.status,200);assert.equal(res.body.owner_hold,true);
  assert.equal(rpcCalls.at(-1).p_provider_check,'paid_verified');
  const close=payload('owner_followup_closed',independent.event_id);
  assert.equal((await call('POST',close,'auditor')).status,400);
  const final=await call('POST',close);
  assert.equal(final.status,200);assert.equal(final.body.customer_delivery_authorized,false);
  assert.equal(final.body.customer_messages_sent,0);assert.equal(final.body.payment_mutations,0);
  assert.equal((await call('GET')).body.cases[0].latest_followup.event_kind,'owner_followup_closed');
  assert.equal(calls.filter(c=>c[0]==='api.stripe.com'&&c[2]!=='GET').length,0);
  const wrong=new Request(endpoint,{method:'POST',headers:{origin:'https://untrusted.example.test'}});
  assert.equal((await onRequestPost({request:wrong,env})).status,403);
}finally{globalThis.fetch=originalFetch;}
const sql=read('supabase/migrations/20261027160000_build682_gift_recheck_aging_followup.sql');
assert.match(sql,/enable row level security/);
assert.match(sql,/grant select,insert on public\.gift_issuance_hold_followup_events to service_role/);
assert.match(sql,/gift_hold_followup_append_only/);
assert.match(sql,/p_actor_id is distinct from p_auditor_id/);
assert.match(sql,/v_last\.provider_checked_at<clock_timestamp\(\)-interval '2 hours'/);
assert.match(sql,/recipient_provider_status}'='failed'/);
assert.match(sql,/purchaser_copy_status}'='failed'/);
assert.match(sql,/v_source\.receipt_last_seen_at is distinct from v_receipt\.last_seen_at/);
assert.match(sql,/pg_advisory_xact_lock/);
assert.match(sql,/customer_delivery_authorized',false/);
assert.match(read('admin-gift-recovery-review.html'),/review682HoldFollowup/);
assert.match(read('admin-gift-recovery-review.html'),/admin-gift-hold-followup-v682\.js/);
console.log('Build 682 independent outcome aging, owner HOLD follow-up, recurrence and safe closure: PASS');
