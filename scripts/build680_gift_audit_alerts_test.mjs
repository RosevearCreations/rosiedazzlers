import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet,onRequestPost,classifyGiftAuditAlert} from '../functions/api/admin/gift_audit_alerts.js';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const originalFetch=globalThis.fetch;
const env={SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'test-key',STRIPE_SECRET_KEY:'sk_test_build680'};
const owner='68000000-0000-4000-8000-000000000001',priorReviewer='68000000-0000-4000-8000-000000000002';
const auditor='68000000-0000-4000-8000-000000000003',caseId='68000000-0000-4000-8000-000000000004';
const closeout='68000000-0000-4000-8000-000000000005',session='cs_test_build680_TESTSESSION';
const now=Date.now(),iso=ms=>new Date(ms).toISOString();
const cases=[{id:caseId,stripe_session_id:session,status:'ready_for_delivery_review',
  assigned_reviewer_id:priorReviewer,updated_at:iso(now)}];
const rechecks=[{id:closeout,case_id:caseId,event_kind:'owner_closeout_recorded',created_at:iso(now-5500000)}];
const followups=[],alertEvents=[],calls=[],rpcCalls=[];
const watch={id:'68000000-0000-4000-8000-000000000006',case_id:caseId,closeout_event_id:closeout,
  event_kind:'watch_opened',auditor_staff_user_id:auditor,created_at:iso(now-5400000)};
const renewal={id:'68000000-0000-4000-8000-000000000007',case_id:caseId,closeout_event_id:closeout,
  event_kind:'evidence_renewed',auditor_staff_user_id:auditor,provider_checked_at:iso(now-70*60000),
  created_at:iso(now-70*60000)};
const audits=[watch,renewal];
let paid=true;
const staff=id=>({id,role_code:id===owner?'admin':'detailer',full_name:'Test staff',is_active:true,permissions_profile:{}});
async function digest(s){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))]
  .map(n=>n.toString(16).padStart(2,'0')).join('');}
globalThis.fetch=async(url,init={})=>{
  const u=new URL(url),method=init.method||'GET';calls.push([u.hostname,u.pathname,method]);
  if(u.hostname==='api.stripe.com'){
    assert.equal(method,'GET','No Stripe payments/refunds/edits');
    if(u.pathname.endsWith('/line_items'))return Response.json({data:[{quantity:1}],has_more:false});
    return Response.json({id:session,mode:'payment',status:'complete',payment_status:paid?'paid':'unpaid',
      metadata:{purpose:'gift',cart:'gift:1:10000'},amount_total:10000,currency:'cad',
      payment_intent:'pi_build680_test',livemode:false});
  }
  assert.equal(u.hostname,'database.example.test');
  if(u.pathname.endsWith('/staff_auth_sessions')){
    const hash=u.searchParams.get('token_hash')?.replace('eq.','');
    const id=hash===await digest('owner-session')?owner:
      hash===await digest('auditor-session')?auditor:
      hash===await digest('prior-session')?priorReviewer:null;
    return Response.json(id?[{id:'session',staff_user:staff(id),revoked_at:null,
      expires_at:iso(now+3600000),created_at:iso(now-2000)}]:[]);
  }
  if(u.pathname.endsWith('/gift_issuance_review_cases'))return Response.json(cases);
  if(u.pathname.endsWith('/gift_issuance_review_recheck_events'))return Response.json(rechecks);
  if(u.pathname.endsWith('/gift_issuance_review_followup_events'))return Response.json(followups);
  if(u.pathname.endsWith('/gift_issuance_closeout_audit_events')){
    const scope=u.searchParams.get('auditor_staff_user_id');
    return Response.json(audits.filter(a=>!scope||scope===`eq.${a.auditor_staff_user_id}`).slice().reverse());
  }
  if(u.pathname.endsWith('/gift_issuance_audit_alert_events')){
    const scope=u.searchParams.get('auditor_staff_user_id');
    return Response.json(alertEvents.filter(a=>!scope||scope===`eq.${a.auditor_staff_user_id}`).slice().reverse());
  }
  if(u.pathname.endsWith('/rpc/record_gift_audit_alert_event')){
    const b=JSON.parse(init.body);rpcCalls.push(b);
    if(b.p_auditor_id!==auditor||b.p_case_id!==caseId||b.p_closeout_id!==closeout||
       b.p_reference_id!==(alertEvents.at(-1)?.id||null)||
       (b.p_action==='independent_renewal_attested'&&b.p_actor_id!==auditor)||
       (b.p_action!=='independent_renewal_attested'&&b.p_actor_id!==owner))
      return Response.json({error:'scope or independent role'},{status:409});
    const prior=alertEvents.at(-1);
    if(b.p_action==='renewal_requested'&&prior?.event_kind!=='alert_opened'||
       b.p_action==='independent_renewal_attested'&&prior?.event_kind!=='renewal_requested'||
       b.p_action==='owner_hold_reconciled'&&prior?.event_kind!=='independent_renewal_attested')
      return Response.json({error:'order'},{status:409});
    alertEvents.push({id:b.p_event_id,case_id:caseId,closeout_event_id:closeout,
      event_kind:b.p_action,alert_reason:b.p_alert_reason,auditor_staff_user_id:auditor,
      source_audit_event_id:b.p_source_audit_id,reference_event_id:b.p_reference_id,
      created_at:iso(now+alertEvents.length*1000)});
    return Response.json({id:b.p_event_id,event_kind:b.p_action,owner_hold:true,
      customer_messages_sent:0,customer_delivery_authorized:false});
  }
  throw Error(`Unexpected ${method} ${u.pathname}`);
};
const endpoint='https://rosiedazzlers.ca/api/admin/gift_audit_alerts';
const call=async(method,body=null,actor='owner',suffix='')=>{
  const request=new Request(endpoint+suffix,{method,
    headers:{cookie:`rd_staff_session=${actor}-session`,...(method==='POST'?{origin:'https://rosiedazzlers.ca'}:{})},
    ...(body?{body:JSON.stringify(body)}:{})});
  const r=await (method==='GET'?onRequestGet:onRequestPost)({request,env});
  return {status:r.status,body:await r.json(),headers:r.headers};
};
const payload=(action,ref=null,source=null,reason='independent_review_due')=>({
  event_id:crypto.randomUUID(),case_id:caseId,closeout_event_id:closeout,
  auditor_id:auditor,action,reference_event_id:ref,source_audit_event_id:source,
  alert_reason:reason,acknowledge_customer_hold:true
});
try{
  assert.equal(classifyGiftAuditAlert(cases[0],rechecks[0],rechecks[0],renewal,[],now).reason,
    'independent_review_due');
  assert.equal(classifyGiftAuditAlert(cases[0],rechecks[0],rechecks[0],
    {...renewal,provider_checked_at:iso(now-49*3600000)},[],now).aging_band,'escalation_overdue');
  assert.equal(classifyGiftAuditAlert(cases[0],rechecks[0],rechecks[0],renewal,
    [{event_kind:'recurrence_opened',created_at:iso(now)}],now).reason,'recurrence_reopened');
  assert.equal(classifyGiftAuditAlert({...cases[0],status:'assigned'},rechecks[0],rechecks[0],renewal,[],now).reason,'case_reopened');
  let view=await call('GET');
  assert.equal(view.status,200);assert.equal(view.headers.get('cache-control'),'no-store, private');
  assert.equal(view.body.cases[0].monitor.priority,'review');
  assert.equal((await call('GET',null,'prior')).body.cases.length,0,'Previous reviewer cannot see new audit watch');
  assert.equal((await call('GET',null,'auditor')).body.cases.length,1);
  assert.equal((await call('GET',null,'owner','?session_id=bad')).status,400);
  const alert=payload('alert_opened',null,renewal.id);
  assert.equal((await call('POST',alert,'auditor')).status,400);
  assert.equal((await call('POST',{...alert,acknowledge_customer_hold:false})).status,400);
  assert.equal((await call('POST',alert)).status,200);
  const request=payload('renewal_requested',alert.event_id,renewal.id);
  assert.equal((await call('POST',request)).status,200);
  const audit={id:'68000000-0000-4000-8000-000000000008',case_id:caseId,closeout_event_id:closeout,
    event_kind:'independent_audit_recorded',auditor_staff_user_id:auditor,created_at:iso(now+7000),
    provider_checked_at:iso(now)};
  audits.push(audit);
  const attestation=payload('independent_renewal_attested',request.event_id,audit.id);
  assert.equal((await call('POST',attestation)).status,400,'Owner cannot claim independent auditor');
  paid=false;
  assert.equal((await call('POST',attestation,'auditor')).status,409,'Unpaid provider must retain HOLD');
  paid=true;
  assert.equal((await call('POST',attestation,'auditor')).status,200);
  assert.equal(rpcCalls.at(-1).p_provider_check,'paid_verified');
  const ack={id:'68000000-0000-4000-8000-000000000009',case_id:caseId,closeout_event_id:closeout,
    event_kind:'owner_audit_acknowledged',reference_event_id:audit.id,auditor_staff_user_id:auditor,
    created_at:iso(now+15000),provider_checked_at:iso(now)};
  audits.push(ack);
  const reconcile=payload('owner_hold_reconciled',attestation.event_id,ack.id);
  assert.equal((await call('POST',reconcile,'auditor')).status,400);
  const final=await call('POST',reconcile);
  assert.equal(final.status,200);assert.equal(final.body.owner_hold,true);
  assert.equal(final.body.customer_delivery_authorized,false);
  assert.equal(final.body.customer_messages_sent,0);
  assert.equal((await call('GET')).body.cases[0].latest_alert.event_kind,'owner_hold_reconciled');
  assert.equal(calls.filter(c=>c[0]==='api.stripe.com'&&c[2]!=='GET').length,0);
  const cross=new Request(endpoint,{method:'POST',headers:{origin:'https://wrong.example.test'}});
  assert.equal((await onRequestPost({request:cross,env})).status,403);
}finally{globalThis.fetch=originalFetch;}
const sql=read('supabase/migrations/20261027140000_build680_gift_audit_alert_hold_reconciliation.sql');
assert.match(sql,/enable row level security/);
assert.match(sql,/grant select,insert on public\.gift_issuance_audit_alert_events to service_role/);
assert.match(sql,/gift_audit_alert_append_only/);
assert.match(sql,/p_actor_id is distinct from p_auditor_id/);
assert.match(sql,/v_audit\.created_at<=v_last\.created_at/);
assert.match(sql,/recipient_provider_status}'='failed'/);
assert.match(sql,/purchaser_copy_status}'='failed'/);
assert.match(sql,/v_audit\.receipt_last_seen_at is distinct from v_receipt\.last_seen_at/);
assert.match(sql,/max\(checkout_line_number\)/);
assert.match(sql,/customer_delivery_authorized',false/);
assert.match(sql,/pg_advisory_xact_lock/);
assert.match(read('admin-gift-recovery-review.html'),/review680AuditAlerts/);
assert.match(read('admin-gift-recovery-review.html'),/admin-gift-audit-alerts-v680\.js/);
console.log('Build 680 signed owner HOLD alerts, 2h/24h/48h aging, independent renewal, no customer dispatch: PASS');
