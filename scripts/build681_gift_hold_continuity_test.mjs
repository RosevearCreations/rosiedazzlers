import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet,onRequestPost,classifyHoldContinuity} from '../functions/api/admin/gift_hold_continuity.js';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const originalFetch=globalThis.fetch;
const env={SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'test-key',
  STRIPE_SECRET_KEY:'sk_test_build681'};
const owner='68100000-0000-4000-8000-000000000001',reviewer='68100000-0000-4000-8000-000000000002';
const auditor='68100000-0000-4000-8000-000000000003',caseId='68100000-0000-4000-8000-000000000004';
const closeout='68100000-0000-4000-8000-000000000005',source='68100000-0000-4000-8000-000000000006';
const reconciliation='68100000-0000-4000-8000-000000000007';
const session='cs_test_build681_TESTSESSION';const now=Date.now(),iso=n=>new Date(n).toISOString();
const cases=[{id:caseId,stripe_session_id:session,status:'ready_for_delivery_review',
  assigned_reviewer_id:reviewer,updated_at:iso(now)}];
const rechecks=[{id:closeout,case_id:caseId,event_kind:'owner_closeout_recorded',created_at:iso(now-7200000)}];
const followups=[];
const audits=[{id:source,case_id:caseId,closeout_event_id:closeout,
  event_kind:'owner_audit_acknowledged',provider_checked_at:iso(now-7300000),created_at:iso(now-7100000),
  auditor_staff_user_id:auditor}];
const alerts=[{id:reconciliation,case_id:caseId,closeout_event_id:closeout,
  event_kind:'owner_hold_reconciled',source_audit_event_id:source,auditor_staff_user_id:auditor,
  created_at:iso(now-7100000)}];
const continuity=[],calls=[],rpcCalls=[];
let paid=true;
const staff=id=>({id,role_code:id===owner?'admin':'detailer',full_name:'Test staff',
  is_active:true,permissions_profile:{}});
async function digest(s){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))]
  .map(n=>n.toString(16).padStart(2,'0')).join('');}
globalThis.fetch=async(url,init={})=>{
  const u=new URL(url),method=init.method||'GET';calls.push([u.hostname,u.pathname,method]);
  if(u.hostname==='api.stripe.com'){
    assert.equal(method,'GET','No Stripe payment, refund or checkout mutation');
    if(u.pathname.endsWith('/line_items'))return Response.json({data:[{quantity:1}],has_more:false});
    return Response.json({id:session,mode:'payment',status:'complete',payment_status:paid?'paid':'unpaid',
      metadata:{purpose:'gift',cart:'gift:1:10000'},amount_total:10000,currency:'cad',
      payment_intent:'pi_build681_test',livemode:false});
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
  if(u.pathname.endsWith('/gift_issuance_review_followup_events'))return Response.json(followups);
  if(u.pathname.endsWith('/gift_issuance_closeout_audit_events'))return Response.json(audits);
  if(u.pathname.endsWith('/gift_issuance_audit_alert_events')){
    const scope=u.searchParams.get('auditor_staff_user_id');
    return Response.json(alerts.filter(a=>!scope||scope===`eq.${a.auditor_staff_user_id}`)
      .filter(a=>!u.searchParams.get('event_kind')||u.searchParams.get('event_kind')==='eq.'+a.event_kind));
  }
  if(u.pathname.endsWith('/gift_issuance_hold_continuity_events')){
    const scope=u.searchParams.get('auditor_staff_user_id');
    return Response.json(continuity.filter(a=>!scope||scope===`eq.${a.auditor_staff_user_id}`).slice().reverse());
  }
  if(u.pathname.endsWith('/rpc/record_gift_hold_continuity_event')){
    const b=JSON.parse(init.body);rpcCalls.push(b);
    const last=continuity.at(-1);
    if(b.p_auditor_id!==auditor||b.p_case_id!==caseId||b.p_reconciliation_id!==reconciliation||
       b.p_source_audit_id!==source||b.p_reference_id!==(last?.id||null)||
       (b.p_action==='independent_recheck_attested'&&b.p_actor_id!==auditor)||
       (b.p_action!=='independent_recheck_attested'&&b.p_actor_id!==owner)||
       (b.p_action==='independent_recheck_attested'&&last?.event_kind!=='hold_escalated')||
       (b.p_action==='owner_continuity_closed'&&last?.event_kind!=='independent_recheck_attested'))
      return Response.json({error:'Role, source or order invalid'},{status:409});
    continuity.push({id:b.p_event_id,case_id:caseId,closeout_event_id:closeout,
      reconciliation_event_id:reconciliation,source_audit_event_id:source,
      auditor_staff_user_id:auditor,event_kind:b.p_action,escalation_reason:b.p_reason,
      provider_checked_at:b.p_checked_at,created_at:iso(now+continuity.length*1000)});
    return Response.json({id:b.p_event_id,event_kind:b.p_action,owner_hold:true,
      customer_delivery_authorized:false,customer_messages_sent:0});
  }
  throw Error(`Unexpected ${method} ${u.pathname}`);
};
const endpoint='https://rosiedazzlers.ca/api/admin/gift_hold_continuity';
const call=async(method,body=null,actor='owner',suffix='')=>{
  const request=new Request(endpoint+suffix,{method,headers:{cookie:`rd_staff_session=${actor}-session`,
    ...(method==='POST'?{origin:'https://rosiedazzlers.ca'}:{})},
    ...(body?{body:JSON.stringify(body)}:{})});
  const r=await (method==='GET'?onRequestGet:onRequestPost)({request,env});
  return {status:r.status,body:await r.json(),headers:r.headers};
};
const payload=(action,ref=null,reason='evidence_expired')=>({event_id:crypto.randomUUID(),
  case_id:caseId,closeout_event_id:closeout,reconciliation_event_id:reconciliation,
  source_audit_event_id:source,auditor_id:auditor,action,escalation_reason:reason,
  reference_event_id:ref,acknowledge_customer_hold:true});
try{
  assert.equal(classifyHoldContinuity(cases[0],rechecks[0],rechecks[0],alerts[0],alerts[0],
    audits[0],null,[],now).reason,'evidence_expired');
  assert.equal(classifyHoldContinuity(cases[0],rechecks[0],rechecks[0],alerts[0],alerts[0],
    audits[0],null,[{event_kind:'recurrence_opened',created_at:iso(now)}],now).reason,'recurrence_reopened');
  assert.equal(classifyHoldContinuity({...cases[0],status:'assigned'},rechecks[0],rechecks[0],
    alerts[0],alerts[0],audits[0],null,[],now).reason,'case_reopened');
  const view=await call('GET');assert.equal(view.status,200);
  assert.equal(view.headers.get('cache-control'),'no-store, private');
  assert.equal(view.body.cases[0].monitor.phase,'owner_escalation_due');
  assert.equal((await call('GET',null,'auditor')).body.cases.length,1);
  assert.equal((await call('GET',null,'reviewer')).body.cases.length,0);
  assert.equal((await call('GET',null,'owner','?session_id=invalid')).status,400);
  const escalation=payload('hold_escalated');
  assert.equal((await call('POST',escalation,'auditor')).status,400);
  assert.equal((await call('POST',{...escalation,acknowledge_customer_hold:false})).status,400);
  assert.equal((await call('POST',escalation)).status,200);
  const recheck=payload('independent_recheck_attested',escalation.event_id);
  assert.equal((await call('POST',recheck)).status,400,'Owner must not audit own HOLD');
  paid=false;
  assert.equal((await call('POST',recheck,'auditor')).status,409,'Unpaid Stripe keeps HOLD');
  paid=true;
  const independent=await call('POST',recheck,'auditor');
  assert.equal(independent.status,200);assert.equal(independent.body.owner_hold,true);
  assert.equal(rpcCalls.at(-1).p_provider_check,'paid_verified');
  const closure=payload('owner_continuity_closed',recheck.event_id);
  assert.equal((await call('POST',closure,'auditor')).status,400);
  const final=await call('POST',closure);
  assert.equal(final.status,200);assert.equal(final.body.customer_delivery_authorized,false);
  assert.equal(final.body.customer_messages_sent,0);assert.equal(final.body.payment_mutations,0);
  assert.equal((await call('GET')).body.cases[0].latest_continuity.event_kind,'owner_continuity_closed');
  assert.equal(calls.filter(c=>c[0]==='api.stripe.com'&&c[2]!=='GET').length,0);
  const wrong=new Request(endpoint,{method:'POST',headers:{origin:'https://untrusted.example.test'}});
  assert.equal((await onRequestPost({request:wrong,env})).status,403);
}finally{globalThis.fetch=originalFetch;}
const sql=read('supabase/migrations/20261027150000_build681_gift_hold_escalation_continuity.sql');
assert.match(sql,/enable row level security/);
assert.match(sql,/grant select,insert on public\.gift_issuance_hold_continuity_events to service_role/);
assert.match(sql,/gift_hold_continuity_append_only/);
assert.match(sql,/p_actor_id is distinct from p_auditor_id/);
assert.match(sql,/v_last\.provider_checked_at<clock_timestamp\(\)-interval '2 hours'/);
assert.match(sql,/recipient_provider_status}'='failed'/);
assert.match(sql,/purchaser_copy_status}'='failed'/);
assert.match(sql,/v_audit\.receipt_last_seen_at is distinct from v_receipt\.last_seen_at/);
assert.match(sql,/pg_advisory_xact_lock/);
assert.match(sql,/customer_delivery_authorized',false/);
assert.match(read('admin-gift-recovery-review.html'),/review681HoldContinuity/);
assert.match(read('admin-gift-recovery-review.html'),/admin-gift-hold-continuity-v681\.js/);
console.log('Build 681 escalation, independent recheck, owner continuity and no-dispatch HOLD: PASS');
