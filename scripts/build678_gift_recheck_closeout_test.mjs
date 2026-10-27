import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet,onRequestPost} from '../functions/api/admin/gift_recheck_closeout.js';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const realFetch=globalThis.fetch;
const env={SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'test-key'};
const base='https://rosiedazzlers.ca/api/admin/gift_recheck_closeout';
const owner='67800000-0000-4000-8000-000000000001';
const previousReviewer='67800000-0000-4000-8000-000000000002';
const newReviewer='67800000-0000-4000-8000-000000000003';
const caseId='67800000-0000-4000-8000-000000000004';
const recurrenceId='67800000-0000-4000-8000-000000000005';
const followupId='67800000-0000-4000-8000-000000000006';
const reviewId='67800000-0000-4000-8000-000000000007';
const sessionId='cs_test_gift_678_validsession';
let caseRow={id:caseId,decision_id:'67800000-0000-4000-8000-000000000008',
  stripe_session_id:sessionId,assigned_reviewer_id:previousReviewer,version:9,
  status:'ready_for_delivery_review',due_at:new Date(Date.now()+3600000).toISOString()};
const now=Date.now();
const followups=[
  {id:recurrenceId,case_id:caseId,event_kind:'recurrence_opened',reason_code:'evidence_changed',
    created_at:new Date(now-100000).toISOString()},
  {id:followupId,case_id:caseId,event_kind:'recurrence_followup_recorded',
    reference_event_id:recurrenceId,reason_code:'recheck_requested',created_at:new Date(now-90000).toISOString()}
];
const rechecks=[];
const reviews=[];
const calls=[];
const staff=id=>({id,role_code:id===owner?'admin':'detailer',is_active:true,
  full_name:'Test Staff '+id.slice(-1),permissions_profile:{}});
async function digest(value){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))]
  .map(n=>n.toString(16).padStart(2,'0')).join('');}
globalThis.fetch=async(url,init={})=>{
  const target=new URL(url);
  assert.equal(target.hostname,'database.example.test','No external payment, customer or delivery calls permitted');
  if(target.pathname.endsWith('/staff_auth_sessions')){
    const hash=target.searchParams.get('token_hash')?.replace('eq.','');
    const id=hash===await digest('owner-session')?owner:
      hash===await digest('reviewer-session')?newReviewer:null;
    return Response.json(id?[{id:'test-session',expires_at:new Date(now+3600000).toISOString(),
      revoked_at:null,staff_user:staff(id),created_at:new Date(now-10000).toISOString()}]:[]);
  }
  if(target.pathname.endsWith('/staff_users'))return Response.json([staff(owner),staff(previousReviewer),staff(newReviewer)]);
  if(target.pathname.endsWith('/gift_issuance_review_cases'))return Response.json([caseRow]);
  if(target.pathname.endsWith('/gift_issuance_review_followup_events'))return Response.json(followups.slice().reverse());
  if(target.pathname.endsWith('/gift_issuance_review_recheck_events'))return Response.json(rechecks.slice().reverse());
  if(target.pathname.endsWith('/gift_issuance_review_events'))return Response.json(reviews.slice().reverse());
  if(target.pathname.endsWith('/rpc/record_gift_recovery_recheck_event')){
    const b=JSON.parse(init.body);calls.push(b);
    if(b.p_actor_id!==owner||b.p_expected_version!==caseRow.version)
      return Response.json({error:'stale or unauthorized'},{status:409});
    const prev=rechecks.find(e=>e.id===b.p_event_id);
    if(prev)return Response.json({event_id:prev.id,event_kind:prev.event_kind,idempotent:true});
    if(b.p_action==='recheck_assigned'){
      if(b.p_reviewer_id!==newReviewer||rechecks.length)return Response.json({error:'reviewer'},{status:409});
      caseRow={...caseRow,version:10,status:'assigned',assigned_reviewer_id:newReviewer,due_at:b.p_due_at};
    }else if(b.p_action==='handoff_refreshed'){
      if(caseRow.status!=='ready_for_delivery_review'||b.p_reference_event_id!==reviewId||rechecks.at(-1)?.event_kind!=='recheck_assigned')
        return Response.json({error:'no fresh review'},{status:409});
    }else if(b.p_action==='owner_closeout_recorded'){
      if(rechecks.at(-1)?.event_kind!=='handoff_refreshed'||b.p_reference_event_id!==rechecks.at(-1)?.id)
        return Response.json({error:'no handoff'},{status:409});
    }else return Response.json({error:'invalid action'},{status:400});
    rechecks.push({id:b.p_event_id,case_id:caseId,event_kind:b.p_action,
      recurrence_event_id:recurrenceId,reviewer_staff_user_id:b.p_reviewer_id,
      reference_event_id:b.p_reference_event_id,case_version:caseRow.version,
      created_at:new Date(now+rechecks.length*1000).toISOString()});
    return Response.json({event_id:b.p_event_id,event_kind:b.p_action,customer_messages_sent:0});
  }
  throw Error('Unexpected database endpoint '+target.pathname);
};
const call=async(method,body=null,identity='owner',query='')=>{
  const headers={};
  if(identity==='owner')headers.cookie='rd_staff_session=owner-session';
  if(identity==='reviewer')headers.cookie='rd_staff_session=reviewer-session';
  if(identity==='impersonation')headers['x-staff-user-id']=owner;
  if(method==='POST')headers.origin='https://rosiedazzlers.ca';
  const request=new Request(base+(query?'?'+query:''),{
    method,headers,...(body?{body:JSON.stringify(body)}:{})});
  const response=await (method==='GET'?onRequestGet:onRequestPost)({request,env});
  return {status:response.status,body:await response.json(),headers:response.headers};
};
const payload=(action,reference_event_id=null)=>({
  event_id:crypto.randomUUID(),case_id:caseId,recurrence_event_id:recurrenceId,
  expected_version:caseRow.version,action,
  reason_code:{recheck_assigned:'independent_recheck_requested',handoff_refreshed:'fresh_handoff_verified',
    owner_closeout_recorded:'closed_no_dispatch'}[action],
  reviewer_id:newReviewer,reference_event_id,
  due_at:action==='recheck_assigned'?new Date(now+48*3600000).toISOString():null,
  acknowledge_no_dispatch:true
});
try{
  let snapshot=await call('GET');
  assert.equal(snapshot.status,200);
  assert.equal(snapshot.headers.get('cache-control'),'no-store, private');
  assert.match(snapshot.body.cases[0].safe_next_action,/assign a different/);
  assert.equal(snapshot.body.cases[0].current_recurrence.id,recurrenceId);
  assert.equal((await call('GET',null,'reviewer')).status,403);
  assert.equal((await call('GET',null,'impersonation')).status,403);
  assert.equal((await call('GET',null,'owner','session_id=bad')).status,400);
  const before=calls.length;
  assert.equal((await call('POST',payload('recheck_assigned'),'reviewer')).status,403);
  assert.equal(calls.length,before);
  const assignment=await call('POST',payload('recheck_assigned'));
  assert.equal(assignment.status,200);
  assert.equal(assignment.body.payment_mutations,0);
  assert.equal(caseRow.version,10);
  snapshot=await call('GET');
  assert.match(snapshot.body.cases[0].safe_next_action,/awaiting new reviewer/);
  assert.equal((await call('POST',payload('handoff_refreshed',reviewId))).status,409);
  // Independent reviewer completes Build 676 in a separate signed-in session.
  caseRow={...caseRow,version:11,status:'ready_for_delivery_review'};
  reviews.push({id:reviewId,case_id:caseId,event_kind:'reviewed',outcome:'handoff_review_ready',
    reviewer_staff_user_id:newReviewer,created_at:new Date(now+20000).toISOString()});
  snapshot=await call('GET');
  assert.equal(snapshot.body.cases[0].fresh_review.id,reviewId);
  assert.match(snapshot.body.cases[0].safe_next_action,/refresh independently verified/);
  const handoff=payload('handoff_refreshed',reviewId);
  assert.equal((await call('POST',{...handoff,acknowledge_no_dispatch:false})).status,409);
  assert.equal((await call('POST',handoff)).status,200);
  snapshot=await call('GET');
  assert.match(snapshot.body.cases[0].safe_next_action,/close out internal/);
  const closeout=payload('owner_closeout_recorded',rechecks.at(-1).id);
  assert.equal((await call('POST',closeout)).status,200);
  assert.equal((await call('POST',{...closeout,expected_version:1})).status,409);
  snapshot=await call('GET');
  assert.match(snapshot.body.cases[0].safe_next_action,/CLOSED/);
  assert.equal(snapshot.body.customer_messages_sent,0);
  const cross=new Request(base,{method:'POST',headers:{origin:'https://other.example.test'}});
  assert.equal((await onRequestPost({request:cross,env})).status,403);
}finally{globalThis.fetch=realFetch;}

const sql=read('supabase/migrations/20261027025204_build678_gift_recheck_handoff_closeout.sql');
const workflow=read('.github/workflows/production-business-acceptance-authority.yml');
const page=read('admin-gift-recovery-review.html');
assert.match(sql,/enable row level security/i);
assert.match(sql,/gift_review_recheck_append_only/);
assert.match(sql,/grant select,insert on public\.gift_issuance_review_recheck_events to service_role/i);
assert.match(sql,/p_reviewer_id=v_case\.assigned_reviewer_id/);
assert.match(sql,/v_decision\.provider_check<>'paid_verified'/);
assert.match(sql,/v_review\.outcome <> 'handoff_review_ready'/);
assert.match(sql,/v_count<1 or v_count>100 or v_bad<>0 or v_attention<>0 or v_held<>0/);
assert.match(sql,/pg_advisory_xact_lock/);
assert.match(sql,/customer_messages_sent',0/);
assert.match(workflow,/github\.event_name == 'workflow_dispatch'\) && github\.ref == 'refs\/heads\/main'/);
assert.match(page,/admin-gift-recheck-closeout-v678\.js/);
assert.match(page,/review678OwnerRecheck/);
console.log('Build 678 owner recheck assignment, refreshed handoff, safe closeout and manual exact-SHA authority: PASS');
