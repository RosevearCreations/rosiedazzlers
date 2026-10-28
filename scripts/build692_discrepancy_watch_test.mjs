import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet,onRequestPost,discrepancyReadiness}
  from '../functions/api/admin/gift_delivery_discrepancy_watch.js';
const ids=Object.fromEntries(['owner','operator','first','third','fourth','fifth','case','gift','attempt','fourthReview','hold']
  .map((k,i)=>[k,`69200000-0000-4000-8000-${String(i+1).padStart(12,'0')}`]));
const session='cs_test_BUILD692_DISCREPANCY_WATCH';
const base='https://rosiedazzlers.ca/api/admin/gift_delivery_discrepancy_watch';
const env={SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'fake-test-key'};
const oldFetch=globalThis.fetch,events=[],calls=[];
async function digest(s){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))))
  .map(x=>x.toString(16).padStart(2,'0')).join('');}
const reviewerList=['owner','operator','first','third','fourth','fifth'];
const fourth={id:ids.fourthReview,attempt_id:ids.attempt,event_kind:'independent_aging_reassessed',
  actor_staff_user_id:ids.fourth,decision_code:'evidence_conflicting',
  created_at:new Date(Date.now()-26*3600000).toISOString()};
const hold={id:ids.hold,attempt_id:ids.attempt,event_kind:'owner_hold_continuity_ack',
  actor_staff_user_id:ids.owner,created_at:new Date(Date.now()-25*3600000).toISOString()};
globalThis.fetch=async(input,init={})=>{
  const u=new URL(input),method=init.method||'GET';calls.push([u.pathname,method]);
  assert.equal(u.hostname,'database.example.test');
  if(u.pathname.endsWith('/staff_auth_sessions')){
    const hashes=await Promise.all(reviewerList.map(x=>digest(x+'-token')));
    const ix=hashes.indexOf(u.searchParams.get('token_hash')?.replace('eq.',''));
    return Response.json(ix<0?[]:[{id:'session',staff_user:{id:ids[reviewerList[ix]],
      role_code:ix?'detailer':'admin',is_active:true,full_name:'Staff',permissions_profile:{}},
      revoked_at:null,expires_at:new Date(Date.now()+3600000).toISOString(),created_at:new Date().toISOString()}]);}
  if(u.pathname.endsWith('/gift_issuance_review_cases'))return Response.json([{
    id:ids.case,stripe_session_id:session}]);
  if(u.pathname.endsWith('/gift_certificates'))return Response.json([{
    id:ids.gift,checkout_line_number:1,recipient_email:'private@example.test'}]);
  if(u.pathname.endsWith('/gift_issuance_one_time_dispatch_attempts'))return Response.json([{
    id:ids.attempt,certificate_id:ids.gift,operator_staff_user_id:ids.operator}]);
  if(u.pathname.endsWith('/gift_issuance_delivery_followup_reviews'))return Response.json([{
    attempt_id:ids.attempt,event_kind:'independent_recipient_recheck',actor_staff_user_id:ids.first}]);
  if(u.pathname.endsWith('/gift_issuance_delivery_closure_recurrence'))return Response.json([{
    attempt_id:ids.attempt,event_kind:'owner_watch_opened',reviewer_staff_user_id:ids.third}]);
  if(u.pathname.endsWith('/gift_issuance_delivery_reopened_exception_reviews'))return Response.json([
    {attempt_id:ids.attempt,event_kind:'owner_exception_reopened',reviewer_staff_user_id:ids.fourth},
    fourth,hold]);
  if(u.pathname.endsWith('/gift_issuance_delivery_reopened_discrepancy_watch'))return Response.json(events);
  if(u.pathname.endsWith('/staff_users'))return Response.json(reviewerList.map(x=>({
    id:ids[x],full_name:x,role_code:x==='owner'?'admin':'detailer'})));
  if(u.pathname.endsWith('/rpc/record_gift_delivery_reopened_discrepancy_watch')){
    const b=JSON.parse(init.body);assert.equal(b.p_evidence_sha256.length,64);
    if(events.some(e=>e.event_kind===b.p_event_kind))return Response.json({error:'duplicate'},{status:409});
    const stage=events.length;
    const valid=(stage===0&&b.p_event_kind==='owner_discrepancy_watch_opened'&&
      b.p_actor_id===ids.owner&&b.p_reviewer_id===ids.fifth)||
      (stage===1&&b.p_event_kind==='independent_discrepancy_reassessed'&&
        b.p_actor_id===ids.fifth&&b.p_reviewer_id===ids.fifth)||
      (stage===2&&b.p_event_kind==='owner_no_resend_hold_ack'&&
        b.p_actor_id===ids.owner&&b.p_reviewer_id===ids.fifth);
    if(!valid)return Response.json({error:'independence or stage violation'},{status:409});
    events.push({id:b.p_id,attempt_id:ids.attempt,event_kind:b.p_event_kind,
      reviewer_staff_user_id:b.p_reviewer_id,decision_code:b.p_decision_code,
      evidence_kind:b.p_evidence_kind,evidence_reference:b.p_evidence_reference,
      observed_at:b.p_observed_at,created_at:new Date().toISOString()});
    return Response.json({id:b.p_id,manual_hold:true,gift_resends:0,payment_mutations:0});}
  throw Error('Unexpected external contact '+u.pathname);
};
async function call(method,who,b,origin='https://rosiedazzlers.ca'){
  const url=base+(method==='GET'?`?session_id=${session}`:'');
  const request=new Request(url,{method,headers:{cookie:`rd_staff_session=${who}-token`,
    ...(method==='POST'?{origin}:{})},...(b?{body:JSON.stringify(b)}:{})});
  const res=await (method==='GET'?onRequestGet:onRequestPost)({request,env});
  return {status:res.status,data:await res.json()};}
function body(){return {session_id:session,case_id:ids.case,certificate_id:ids.gift,
  attempt_id:ids.attempt,fourth_review_id:ids.fourthReview,event_id:crypto.randomUUID(),
  reviewer_id:ids.fifth,event_kind:'owner_discrepancy_watch_opened',
  decision_code:'discrepancy_review_requested',evidence_kind:'internal_exception_note',
  evidence_reference:'DISCREP-692-REAL',observed_at:new Date().toISOString(),
  confirm_fourth_discrepancy:true,confirm_fifth_independence:true,confirm_no_resend:true};}
try{
  assert.equal(discrepancyReadiness(fourth,hold,[],{id:ids.owner,is_admin:true}).aging_alert_due,true);
  assert.equal(discrepancyReadiness({...fourth,decision_code:'still_unresolved'},hold,[],{is_admin:true}).can_open,false);
  assert.equal((await call('GET','fifth')).data.gifts.length,0);
  const get=await call('GET','owner');assert.equal(get.status,200);
  assert.equal(get.data.gifts[0].recipient_email_masked,'p***@example.test');
  assert.equal((await call('POST','owner',body(),'https://evil.test')).status,403);
  const missing=body();missing.confirm_no_resend=false;
  assert.equal((await call('POST','owner',missing)).status,400);
  const reused=body();reused.reviewer_id=ids.fourth;
  assert.equal((await call('POST','owner',reused)).status,409);
  assert.equal((await call('POST','owner',body())).status,200);
  assert.equal((await call('POST','owner',body())).status,409);
  assert.equal((await call('GET','fifth')).data.gifts.length,1);
  const reassess=body();reassess.event_kind='independent_discrepancy_reassessed';
  reassess.decision_code='still_disputed';reassess.evidence_kind='recipient_reported_missing';
  assert.equal((await call('POST','third',reassess)).status,409);
  assert.equal((await call('POST','fifth',reassess)).status,200);
  const ack=body();ack.event_kind='owner_no_resend_hold_ack';ack.decision_code='continued_manual_hold';
  assert.equal((await call('POST','owner',ack)).status,200);
  assert.equal((await call('GET','owner')).data.gifts[0].events.length,3);
  assert.equal((await call('POST','owner',ack)).status,409);
  assert.ok(calls.every(([path,method])=>path.startsWith('/rest/v1/')&&
    (method==='GET'||path.endsWith('/rpc/record_gift_delivery_reopened_discrepancy_watch'))));
}finally{globalThis.fetch=oldFetch;}
const sql=readFileSync(new URL('../supabase/migrations/20261028030000_build692_gift_discrepancy_and_original_receipt_intake.sql',import.meta.url),'utf8');
assert.match(sql,/unique\(attempt_id,event_kind\)/);
assert.match(sql,/v_original_recheck.actor_staff_user_id,v_recurrence.reviewer_staff_user_id/);
assert.match(sql,/security invoker/);assert.match(sql,/enable row level security/);
assert.match(readFileSync(new URL('../admin-gift-recovery-review.html',import.meta.url),'utf8'),/review692Discrepancy/);
console.log('Build 692 fifth independent discrepancy reviewer, aging and permanent no-resend tests: PASS');
