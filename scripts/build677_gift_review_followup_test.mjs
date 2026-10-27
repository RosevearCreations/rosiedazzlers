import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet,onRequestPost} from '../functions/api/admin/gift_review_followup.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const original=globalThis.fetch;
const env={SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'test-key',
  ADMIN_PASSWORD:'bridge-password',ALLOW_LEGACY_ADMIN_FALLBACK:'true'};
const base='https://rosiedazzlers.ca/api/admin/gift_review_followup';
const owner='67700000-0000-4000-8000-000000000001';
const reviewer='67700000-0000-4000-8000-000000000002';
const caseId='67700000-0000-4000-8000-000000000003';
const reviewId='67700000-0000-4000-8000-000000000004';
const session='cs_test_gift_677_validsession';
let caseRow={id:caseId,decision_id:'67500000-0000-4000-8000-000000000005',
  stripe_session_id:session,assigned_reviewer_id:reviewer,version:2,
  due_at:new Date(Date.now()-3600000).toISOString(),status:'reviewed_hold'};
const reviews=[{id:reviewId,case_id:caseId,event_kind:'reviewed',outcome:'recheck_required',created_at:new Date().toISOString()}];
const events=[];
const rpcCalls=[];
const staff=id=>({id,role_code:id===owner?'admin':'detailer',full_name:'Test Staff',is_active:true,permissions_profile:{}});
async function digest(string){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(string)))]
  .map(c=>c.toString(16).padStart(2,'0')).join('');}
globalThis.fetch=async(url,init={})=>{
  const u=new URL(url);
  assert.equal(u.hostname,'database.example.test','No payment or message provider requests permitted');
  if(u.pathname.endsWith('/staff_auth_sessions')){
    const hash=u.searchParams.get('token_hash')?.replace('eq.','');
    const id=hash===await digest('owner-cookie')?owner:hash===await digest('reviewer-cookie')?reviewer:null;
    return Response.json(id?[{id:'test-auth',expires_at:new Date(Date.now()+3600000).toISOString(),revoked_at:null,
      staff_user:staff(id),created_at:new Date().toISOString()}]:[]);
  }
  if(u.pathname.endsWith('/staff_users'))return Response.json([staff(owner)]);
  if(u.pathname.endsWith('/gift_issuance_review_cases'))return Response.json([caseRow]);
  if(u.pathname.endsWith('/gift_issuance_review_events'))return Response.json(reviews);
  if(u.pathname.endsWith('/gift_issuance_review_followup_events'))return Response.json(events.slice().reverse());
  if(u.pathname.endsWith('/rpc/record_gift_review_followup_event')){
    const body=JSON.parse(init.body);rpcCalls.push(body);
    if(body.p_actor_id!==owner)return Response.json({error:'not owner'},{status:400});
    if(body.p_expected_version!==caseRow.version)return Response.json({error:'stale'},{status:409});
    if(body.p_action==='handoff_receipt_confirmed'&&(caseRow.status!=='ready_for_delivery_review'||
        body.p_reference_event_id!==reviewId))return Response.json({error:'not ready'},{status:409});
    const previous=events.at(-1);
    if(body.p_action==='recurrence_followup_recorded'&&previous?.event_kind!=='recurrence_opened')
      return Response.json({error:'no open recurrence'},{status:409});
    const newEvent={id:body.p_event_id,case_id:caseId,case_version:caseRow.version,
      event_kind:body.p_action,reason_code:body.p_reason_code,reference_event_id:body.p_reference_event_id,
      created_at:new Date(Date.now()+events.length*1000).toISOString()};
    events.push(newEvent);
    return Response.json({event_id:newEvent.id,event_kind:newEvent.event_kind,customer_messages_sent:0});
  }
  throw Error('Unexpected database endpoint '+u.pathname);
};
const call=async(method,body=null,identity='owner',query='')=>{
  const headers={};
  if(identity==='owner')headers.cookie='rd_staff_session=owner-cookie';
  if(identity==='reviewer')headers.cookie='rd_staff_session=reviewer-cookie';
  if(identity==='bridge')headers['x-admin-password']='bridge-password';
  if(identity==='header-impersonation')headers['x-staff-user-id']=owner;
  if(method==='POST')headers.origin='https://rosiedazzlers.ca';
  const request=new Request(base+(query?'?'+query:''),{method,headers,...(body?{body:JSON.stringify(body)}:{})});
  const response=await(method==='GET'?onRequestGet:onRequestPost)({request,env});
  return {status:response.status,body:await response.json()};
};
const id=()=>crypto.randomUUID();
const payload=(action,reason_code,reference_event_id=null)=>({action,reason_code,reference_event_id,
  event_id:id(),case_id:caseId,expected_version:caseRow.version});
try{
  assert.equal((await call('GET',null,'owner')).status,200);
  assert.equal((await call('GET',null,'reviewer')).status,403);
  assert.ok([401,403].includes((await call('GET',null,'bridge')).status));
  assert.equal((await call('GET',null,'header-impersonation')).status,403);
  assert.equal((await call('GET',null,'owner','session_id=unsafe')).status,400);
  const before=rpcCalls.length;
  assert.equal((await call('POST',payload('overdue_escalated','reviewer_overdue'),'reviewer')).status,403);
  assert.equal(rpcCalls.length,before);
  const escalation=await call('POST',payload('overdue_escalated','reviewer_overdue'));
  assert.equal(escalation.status,200);
  assert.equal(escalation.body.customer_messages_sent,0);
  assert.equal(rpcCalls.at(-1).p_actor_id,owner);
  let current=await call('GET');
  assert.equal(current.body.cases[0].overdue,true);
  assert.equal(current.body.events[0].event_kind,'overdue_escalated');
  assert.equal(current.body.cases[0].safe_next_action,'ESCALATED — awaiting independent reassessment');
  caseRow={...caseRow,due_at:new Date(Date.now()+3600000).toISOString(),status:'ready_for_delivery_review',version:3};
  reviews[0].outcome='handoff_review_ready';
  assert.equal((await call('POST',payload('handoff_receipt_confirmed','owner_receipt_acknowledged',reviewId))).status,409);
  const receipt=await call('POST',{...payload('handoff_receipt_confirmed','owner_receipt_acknowledged',reviewId),acknowledge_no_dispatch:true});
  assert.equal(receipt.status,200);
  current=await call('GET');
  assert.equal(current.body.cases[0].handoff_receipt_recorded,true);
  const lastEvent=events.at(-1).id;
  const recurrence=await call('POST',payload('recurrence_opened','evidence_changed',lastEvent));
  assert.equal(recurrence.status,200);
  current=await call('GET');
  assert.equal(current.body.cases[0].recurrence_open,true);
  assert.equal(current.body.cases[0].safe_next_action,'RECURRENCE HOLD — no earlier receipt can authorize delivery');
  assert.equal(current.body.cases[0].handoff_confirmed_safe,false);
  assert.equal((await call('POST',payload('recurrence_followup_recorded','closed_no_dispatch',events.at(-1).id))).status,409);
  const followup=await call('POST',{...payload('recurrence_followup_recorded','closed_no_dispatch',events.at(-1).id),acknowledge_no_dispatch:true});
  assert.equal(followup.status,200);
  assert.equal(followup.body.gift_balance_mutations,0);
  const stale=await call('POST',{...payload('recurrence_opened','recurring_exception',events.at(-1).id),expected_version:2});
  assert.equal(stale.status,409);
  const req=new Request(base,{method:'POST',headers:{origin:'https://other.example.test'}});
  assert.equal((await onRequestPost({request:req,env})).status,403);
}finally{globalThis.fetch=original;}

const sql=read('supabase/migrations/20261027013837_build677_gift_review_escalation_receipt_followup.sql');
assert.match(sql,/enable row level security/i);
assert.match(sql,/gift_review_followup_append_only/i);
assert.match(sql,/grant select,insert on public\.gift_issuance_review_followup_events to service_role/i);
assert.match(sql,/v_case\.due_at >= now\(\)/);
assert.match(sql,/v_case\.due_at <= now\(\)/);
assert.match(sql,/v_age > 24/);
assert.match(sql,/v_attention <> 0 or v_held <> 0/);
assert.match(sql,/pg_advisory_xact_lock/);
assert.match(sql,/p_reference_event_id is distinct from v_review\.id/);
assert.match(sql,/case_version=v_case\.version/);
assert.match(sql,/customer_messages_sent',0/);
const page=read('admin-gift-recovery-review.html');
assert.match(page,/review677OwnerFollowup/);
assert.match(page,/review677Ack/);
assert.match(page,/admin-gift-review-followup-v677\.js/);
console.log('Build 677 owner-only escalation, handoff acknowledgment, recurrence, immutable ledger and no-dispatch: PASS');
