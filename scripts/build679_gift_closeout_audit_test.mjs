import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet,onRequestPost,describeWatch} from '../functions/api/admin/gift_closeout_audit.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const originalFetch=globalThis.fetch;
const env={SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'test-key',STRIPE_SECRET_KEY:'sk_test_only'};
const owner='67900000-0000-4000-8000-000000000001',rechecker='67900000-0000-4000-8000-000000000002';
const auditor='67900000-0000-4000-8000-000000000003',caseId='67900000-0000-4000-8000-000000000004';
const closeout='67900000-0000-4000-8000-000000000005',session='cs_test_gift679_TESTSESSION';
const now=Date.now();
const rechecks=[{id:closeout,case_id:caseId,event_kind:'owner_closeout_recorded',actor_staff_user_id:owner,
  created_at:new Date(now-120000).toISOString()}];
const cases=[{id:caseId,decision_id:'67900000-0000-4000-8000-000000000006',stripe_session_id:session,
  assigned_reviewer_id:rechecker,status:'ready_for_delivery_review',version:4,updated_at:new Date(now).toISOString()}];
const audits=[],followups=[],rpcCalls=[],calls=[];
const staff=id=>({id,role_code:id===owner?'admin':'detailer',full_name:`Test ${id.slice(-1)}`,
  is_active:true,permissions_profile:{}});
async function digest(value){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))]
  .map(n=>n.toString(16).padStart(2,'0')).join('');}
let providerPaid=true;
globalThis.fetch=async(url,options={})=>{
  const target=new URL(url),method=options.method||'GET';calls.push([target.hostname,target.pathname,method]);
  if(target.hostname==='api.stripe.com'){
    assert.equal(method,'GET','Stripe operations are read-only');
    if(target.pathname.endsWith('/line_items'))return Response.json({data:[{quantity:1}],has_more:false});
    return Response.json({id:session,mode:'payment',status:'complete',payment_status:providerPaid?'paid':'unpaid',
      metadata:{purpose:'gift',cart:'gift:1:10000'},amount_total:10000,currency:'cad',
      payment_intent:'pi_build679_test',livemode:false});
  }
  assert.equal(target.hostname,'database.example.test');
  if(target.pathname.endsWith('/staff_auth_sessions')){
    const hash=target.searchParams.get('token_hash')?.replace('eq.','');
    const id=hash===await digest('owner-session')?owner:hash===await digest('auditor-session')?auditor:
      hash===await digest('rechecker-session')?rechecker:null;
    return Response.json(id?[{id:'test-session',expires_at:new Date(now+3600000).toISOString(),
      revoked_at:null,staff_user:staff(id),created_at:new Date(now-10000).toISOString()}]:[]);
  }
  if(target.pathname.endsWith('/staff_users'))return Response.json([staff(rechecker),staff(auditor)]);
  if(target.pathname.endsWith('/gift_issuance_review_cases'))return Response.json(cases);
  if(target.pathname.endsWith('/gift_issuance_review_recheck_events'))return Response.json(rechecks);
  if(target.pathname.endsWith('/gift_issuance_review_followup_events'))return Response.json(followups);
  if(target.pathname.endsWith('/gift_issuance_closeout_audit_events')){
    const onlyAuditor=target.searchParams.get('auditor_staff_user_id');
    return Response.json(audits.filter(e=>!onlyAuditor||onlyAuditor===`eq.${e.auditor_staff_user_id}`).slice().reverse());
  }
  if(target.pathname.endsWith('/rpc/record_gift_closeout_audit_event')){
    const b=JSON.parse(options.body);rpcCalls.push(b);
    if(b.p_auditor_id!==auditor||b.p_case_id!==caseId||b.p_closeout_id!==closeout)
      return Response.json({error:'scope'},{status:409});
    if(b.p_action==='independent_audit_recorded'&&b.p_actor_id!==auditor||
       b.p_action!=='independent_audit_recorded'&&b.p_actor_id!==owner||
       b.p_reference_id!==(audits.at(-1)?.id||null))return Response.json({error:'independence or predecessor'},{status:409});
    if(b.p_action==='watch_opened'&&audits.length||b.p_action==='evidence_renewed'&&audits.at(-1)?.event_kind!=='watch_opened'||
       b.p_action==='independent_audit_recorded'&&audits.at(-1)?.event_kind!=='evidence_renewed'||
       b.p_action==='owner_audit_acknowledged'&&audits.at(-1)?.event_kind!=='independent_audit_recorded')
      return Response.json({error:'order'},{status:409});
    audits.push({id:b.p_event_id,case_id:caseId,closeout_event_id:closeout,event_kind:b.p_action,
      actor_staff_user_id:b.p_actor_id,auditor_staff_user_id:auditor,
      reference_event_id:b.p_reference_id,provider_checked_at:b.p_checked_at,
      created_at:new Date(now+audits.length*1000).toISOString()});
    return Response.json({id:b.p_event_id,event_kind:b.p_action,customer_messages_sent:0});
  }
  throw Error(`Unexpected route ${target.pathname}`);
};
const base='https://rosiedazzlers.ca/api/admin/gift_closeout_audit';
const call=async(method,body=null,user='owner',query='')=>{
  const headers={cookie:`rd_staff_session=${user}-session`,...(method==='POST'?{origin:'https://rosiedazzlers.ca'}:{})};
  const request=new Request(base+(query?'?'+query:''),{
    method,headers,...(body?{body:JSON.stringify(body)}:{})});
  const response=await (method==='GET'?onRequestGet:onRequestPost)({request,env});
  return {status:response.status,body:await response.json(),headers:response.headers};
};
const payload=(action,reference=null)=>({event_id:crypto.randomUUID(),case_id:caseId,
  closeout_event_id:closeout,auditor_id:auditor,action,
  reference_event_id:reference,reason_code:{watch_opened:'post_closeout_watch',
    evidence_renewed:'fresh_paid_evidence',independent_audit_recorded:'independent_verified',
    owner_audit_acknowledged:'owner_no_dispatch_confirmed'}[action],acknowledge_no_customer_action:true});
try{
  assert.equal(describeWatch(cases[0],null,null,[]).status,'HOLD');
  assert.equal(describeWatch(cases[0],rechecks[0],null,[{event_kind:'recurrence_opened',
    created_at:new Date(now).toISOString()}]).status,'HOLD');
  let view=await call('GET');
  assert.equal(view.status,200);
  assert.equal(view.headers.get('cache-control'),'no-store, private');
  assert.equal(view.body.cases[0].audit_status,'WATCH DUE');
  assert.equal((await call('GET',null,'auditor')).body.cases.length,0);
  assert.equal((await call('GET',null,'rechecker')).body.cases.length,0);
  assert.equal((await call('GET',null,'owner','session_id=invalid')).status,400);
  const watch=payload('watch_opened');
  assert.equal((await call('POST',watch,'auditor')).status,400);
  assert.equal((await call('POST',{...watch,acknowledge_no_customer_action:false})).status,400);
  assert.equal((await call('POST',watch)).status,200);
  view=await call('GET',null,'auditor');
  assert.equal(view.body.cases.length,1,'Only assigned auditor may see watch');
  assert.equal(view.body.cases[0].audit_status,'RENEWAL DUE');
  providerPaid=false;
  assert.equal((await call('POST',payload('evidence_renewed',watch.event_id))).status,409);
  providerPaid=true;
  const renewal=payload('evidence_renewed',watch.event_id);
  assert.equal((await call('POST',renewal)).status,200);
  assert.equal((await call('POST',payload('independent_audit_recorded',renewal.event_id),'owner')).status,400);
  const audit=payload('independent_audit_recorded',renewal.event_id);
  assert.equal((await call('POST',audit,'auditor')).status,200);
  assert.equal((await call('POST',payload('owner_audit_acknowledged',audit.event_id),'auditor')).status,400);
  assert.equal((await call('POST',payload('owner_audit_acknowledged',audit.event_id))).status,200);
  assert.equal(rpcCalls.filter(x=>x.p_action==='owner_audit_acknowledged').length,1);
  assert.equal(calls.filter(c=>c[0]==='api.stripe.com'&&c[2]!=='GET').length,0);
  const cross=new Request(base,{method:'POST',headers:{origin:'https://wrong.example.test'}});
  assert.equal((await onRequestPost({request:cross,env})).status,403);
}finally{globalThis.fetch=originalFetch;}
const sql=read('supabase/migrations/20261027131323_build679_gift_closeout_audit.sql');
const page=read('admin-gift-recovery-review.html');
assert.match(sql,/enable row level security/);
assert.match(sql,/grant select,insert on public\.gift_issuance_closeout_audit_events to service_role/);
assert.match(sql,/gift_closeout_audit_append_only/);
assert.match(sql,/p_actor_id is distinct from p_auditor_id/);
assert.match(sql,/p_checked_at<now\(\)-interval '5 minutes'/);
assert.match(sql,/pg_advisory_xact_lock/);
assert.match(sql,/no_customer_action',true/);
assert.match(page,/admin-gift-closeout-audit-v679\.js/);
assert.match(page,/review679CloseoutAudit/);
console.log('Build 679 recurrence watch, fresh Stripe evidence, independent signed audit, customer-safe no-dispatch: PASS');
