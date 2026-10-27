import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet,onRequestPost} from '../functions/api/admin/gift_independent_recovery_review.js';
const read=p=>readFileSync(new URL(`../${p}`,import.meta.url),'utf8');
const originalFetch=globalThis.fetch;
const env={SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'service-test',
  ADMIN_PASSWORD:'owner-only-password',ALLOW_LEGACY_ADMIN_FALLBACK:'true'};
const base='https://rosiedazzlers.ca/api/admin/gift_independent_recovery_review';
const ownerId='67600000-0000-4000-8000-000000000001';
const reviewerId='67600000-0000-4000-8000-000000000002';
const intruderId='67600000-0000-4000-8000-000000000003';
const decisionId='67500000-0000-4000-8000-000000000005';
const sessionId='cs_test_review_676_validsession';
const caseId='67600000-0000-4000-8000-000000000004';
let rpcCalls=0,mutations=[],cases=[],reviewEvents=[],candidates=[
  {id:ownerId,full_name:'Owner',role_code:'admin'},
  {id:reviewerId,full_name:'Independent Reviewer',role_code:'detailer'}
];
let checkedAt=new Date(Date.now()-3600000).toISOString();
const staff=(id)=>({id,role_code:id===ownerId?'admin':'detailer',
  full_name:id===ownerId?'Owner':'Independent Reviewer',email:'private@example.test',
  is_active:true,can_manage_staff:id===ownerId,permissions_profile:{}});
globalThis.fetch=async (url,init={})=>{
  const u=new URL(url),method=init.method||'GET';
  if(u.hostname==='api.stripe.com')throw Error('Build 676 must NEVER contact Stripe or dispatch anything');
  if(u.hostname!=='database.example.test')throw Error(`Unexpected external request ${url}`);
  if(u.pathname.endsWith('/staff_auth_sessions')){
    const hash=u.searchParams.get('token_hash')?.replace(/^eq\./,'');
    const digest=async s=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))]
      .map(x=>x.toString(16).padStart(2,'0')).join('');
    const account=hash===await digest('reviewer-session')?reviewerId:hash===await digest('intruder-session')?intruderId:hash===await digest('owner-session')?ownerId:null;
    return Response.json(account?[{id:'fake-session',expires_at:new Date(Date.now()+86400000).toISOString(),
      revoked_at:null,staff_user:staff(account),created_at:new Date().toISOString()}]:[]);
  }
  if(u.pathname.endsWith('/staff_users'))return Response.json(candidates);
  if(u.pathname.endsWith('/gift_issuance_review_cases')){
    const requestedReviewer=u.searchParams.get('assigned_reviewer_id')?.replace('eq.','');
    return Response.json(cases.filter(c=>!requestedReviewer||c.assigned_reviewer_id===requestedReviewer));
  }
  if(u.pathname.endsWith('/gift_issuance_recovery_decisions')){
    return Response.json([{id:decisionId,action:'close_verified_no_action',provider_check:'paid_verified',
      checked_at:checkedAt,created_at:new Date(Date.now()-3500000).toISOString(),
      actor_staff_user_id:ownerId}]);
  }
  if(u.pathname.endsWith('/gift_issuance_review_events'))return Response.json(reviewEvents);
  if(u.pathname.includes('/rpc/')){
    assert.equal(method,'POST');rpcCalls++;
    const p=JSON.parse(init.body);
    mutations.push({path:u.pathname,payload:p});
    if(u.pathname.endsWith('/assign_gift_issuance_independent_reviewer')){
      cases=[{id:p.p_case_id,decision_id:p.p_decision_id,stripe_session_id:sessionId,
        assigned_reviewer_id:p.p_reviewer_id,assigned_by_staff_user_id:p.p_assigner_id,version:1,status:'assigned',
        due_at:p.p_due_at,updated_at:new Date().toISOString()}];
      return Response.json({case_id:p.p_case_id,event_id:p.p_event_id,kind:'assigned',idempotent:false});
    }
    if(u.pathname.endsWith('/record_gift_issuance_reviewer_outcome')){
      assert.equal(p.p_actor_id,reviewerId,'RPC may use ONLY the signed-in assignee ID');
      cases[0].status=p.p_outcome==='handoff_review_ready'?'ready_for_delivery_review':'reviewed_hold';
      cases[0].version++;
      reviewEvents.push({id:p.p_event_id,case_id:p.p_case_id,outcome:p.p_outcome});
      return Response.json({case_id:p.p_case_id,outcome:p.p_outcome,handoff_disposition:'delivery_review_only',customer_messages_sent:0});
    }
  }
  throw Error(`Unexpected database request ${method} ${u.pathname}`);
};
const request=(method,body=null,identity='owner',qs='')=>{
  const headers={};
  if(identity==='owner')headers['x-admin-password']='owner-only-password';
  if(identity==='reviewer')headers.cookie='rd_staff_session=reviewer-session';
  if(identity==='intruder')headers.cookie='rd_staff_session=intruder-session';
  if(identity==='bridge')headers['x-staff-email']='owner@example.test';
  if(method==='POST'){headers.origin='https://rosiedazzlers.ca';headers['Content-Type']='application/json';}
  return new Request(base+(qs?'?'+qs:''),{method,headers,...(body?{body:JSON.stringify(body)}:{})});
};
const call=async(method,body=null,identity='owner',qs='')=>{
  const response=await(method==='GET'?onRequestGet:onRequestPost)({request:request(method,body,identity,qs),env});
  return {status:response.status,body:await response.json()};
};
const uuid=()=>crypto.randomUUID();
try{
  const candidatesResult=await call('GET',null,'owner','mode=candidates');
  assert.equal(candidatesResult.status,200);
  assert.equal(candidatesResult.body.candidates.length,2);
  const bridge=await call('GET',null,'bridge','mode=candidates');
  assert.notEqual(bridge.status,200,'Unsigned bridge identities cannot see candidate staff lists');
  const nonowner=await call('GET',null,'reviewer','mode=candidates');
  assert.equal(nonowner.status,403);
  const decisions=await call('GET',null,'owner',`mode=decisions&session_id=${sessionId}`);
  assert.equal(decisions.body.decisions[0].id,decisionId);

  const assignment=await call('POST',{action:'assign',event_id:uuid(),case_id:caseId,
    decision_id:decisionId,reviewer_id:reviewerId,due_at:new Date(Date.now()+48*3600000).toISOString()});
  assert.equal(assignment.status,200);
  assert.equal(assignment.body.customer_messages_sent,0);
  assert.equal(mutations.at(-1).payload.p_assigner_id,null,'Legacy owner must not impersonate staff UUID');
  assert.equal(mutations.at(-1).payload.p_reviewer_id,reviewerId);
  const visible=await call('GET',null,'reviewer',`session_id=${sessionId}`);
  assert.equal(visible.status,200);
  assert.equal(visible.body.cases.length,1);
  assert.equal(visible.body.cases[0].evidence_stale,false);
  assert.equal(visible.body.cases[0].overdue,false);
  checkedAt=new Date(Date.now()-50*3600000).toISOString();
  cases[0].due_at=new Date(Date.now()-3*3600000).toISOString();
  const aged=await call('GET',null,'reviewer');
  assert.equal(aged.body.cases[0].evidence_stale,true);
  assert.equal(aged.body.cases[0].overdue,true);
  assert.equal(aged.body.cases[0].urgency,'overdue');
  checkedAt=new Date(Date.now()-3600000).toISOString();
  cases[0].due_at=new Date(Date.now()+48*3600000).toISOString();
  assert.equal(JSON.stringify(visible.body).includes('private@example.test'),false);
  const stranger=await call('GET',null,'intruder');
  assert.equal(stranger.body.cases.length,0,'Reviewer cannot list another staff account’s cases');
  const prior=rpcCalls;
  const unauthorized=await call('POST',{action:'assign',event_id:uuid(),case_id:caseId,
    decision_id:decisionId,reviewer_id:reviewerId,due_at:new Date(Date.now()+3600000).toISOString()},'reviewer');
  assert.equal(unauthorized.status,403);
  assert.equal(rpcCalls,prior);
  const unacknowledged=await call('POST',{action:'review',case_id:caseId,event_id:uuid(),expected_version:1,
    outcome:'handoff_review_ready',reason_code:'independent_verified'},'reviewer');
  assert.equal(unacknowledged.status,409);
  assert.equal(rpcCalls,prior);
  const review=await call('POST',{action:'review',case_id:caseId,event_id:uuid(),expected_version:1,
    outcome:'handoff_review_ready',reason_code:'independent_verified',acknowledge_no_dispatch:true},'reviewer');
  assert.equal(review.status,200);
  assert.equal(review.body.customer_messages_sent,0);
  assert.equal(review.body.gift_balance_mutations,0);
  const noCase=await call('POST',{action:'review',case_id:caseId,event_id:uuid(),expected_version:2,
    outcome:'hold_missing_evidence',reason_code:'unresolved_hold'},'intruder');
  assert.equal(noCase.status,409,'Database RPC must guard actor reviewer identity');
  const malicious=request('POST',{action:'review'},'reviewer');
  malicious.headers.set('origin','https://other.example.test');
  const crossOrigin=await onRequestPost({request:malicious,env});
  assert.equal(crossOrigin.status,403);
}finally{globalThis.fetch=originalFetch;}

const sql=read('supabase/migrations/20261027010449_build676_gift_reviewer_case_handoff.sql');
const canary=read('supabase/migrations/20261027011703_build676_independent_review_rollback_canary.sql');
assert.match(sql,/create table if not exists public\.gift_issuance_review_cases/i);
assert.match(sql,/create table if not exists public\.gift_issuance_review_events/i);
assert.match(sql,/enable row level security/);
assert.match(sql,/revoke all on public\.gift_issuance_review_events from public, anon, authenticated, service_role/i);
assert.match(sql,/before update or delete on public\.gift_issuance_review_events/i);
assert.match(sql,/assigned_reviewer_id <> p_actor_id/);
assert.match(sql,/p_reviewer_id is not distinct from v_decision\.actor_staff_user_id/);
assert.match(sql,/v_age > 24/);
assert.match(sql,/v_delivery_attention <> 0 or v_held <> 0/);
assert.match(sql,/pg_advisory_xact_lock/);
assert.match(sql,/customer_messages_sent',0/);
assert.match(canary,/BUILD676_CANARY_EXPECTED_ROLLBACK/);
assert.match(canary,/HELD_DELIVERY_HANDOFF_NOT_BLOCKED/);
const page=read('admin-gift-recovery-review.html');
assert.match(page,/review676Reviewer/);
assert.match(page,/review676Ack/);
assert.equal(read('admin-site-settings.html'),read('admin-site-settings/index.html'));
console.log('Build 676 independent owner assignment, signed-in reviewer scoping, due/evidence aging, hold and safe no-dispatch handoff contracts: PASS');
