import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet,onRequestPost,fifthRecurrenceReadiness}
  from '../functions/api/admin/gift_fifth_recurrence_closure_watch.js';

const ids=Object.fromEntries(['owner','operator','first','third','fourth','fifth','sixth','case','gift','attempt','fifthReview']
  .map((k,i)=>[k,`69300000-0000-4000-8000-${String(i+1).padStart(12,'0')}`]));
const session='cs_test_BUILD693_FIFTH_RECURRENCE';
const url='https://rosiedazzlers.ca/api/admin/gift_fifth_recurrence_closure_watch';
const env={SUPABASE_URL:'https://database.example.test',SUPABASE_SERVICE_ROLE_KEY:'fixture-only'};
const originalFetch=globalThis.fetch,events=[],calls=[];
const fifth={id:ids.fifthReview,attempt_id:ids.attempt,event_kind:'independent_discrepancy_reassessed',
  decision_code:'still_disputed',actor_staff_user_id:ids.fifth,
  created_at:new Date(Date.now()-26*3600000).toISOString()};
const hold={id:crypto.randomUUID(),attempt_id:ids.attempt,event_kind:'owner_no_resend_hold_ack',
  created_at:new Date(Date.now()-25*3600000).toISOString()};
async function digest(s){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))))
  .map(x=>x.toString(16).padStart(2,'0')).join('');}
const names=['owner','operator','first','third','fourth','fifth','sixth'];
globalThis.fetch=async(input,init={})=>{
  const u=new URL(input),method=init.method||'GET';calls.push([u.pathname,method]);
  assert.equal(u.hostname,'database.example.test');
  if(u.pathname.endsWith('/staff_auth_sessions')){
    const hashes=await Promise.all(names.map(x=>digest(x+'-token')));
    const ix=hashes.indexOf(u.searchParams.get('token_hash')?.replace('eq.',''));
    return Response.json(ix<0?[]:[{id:'staff-session',staff_user:{id:ids[names[ix]],
      role_code:ix?'detailer':'admin',is_active:true,full_name:'Staff',permissions_profile:{}},
      revoked_at:null,expires_at:new Date(Date.now()+3600000).toISOString(),created_at:new Date().toISOString()}]);}
  if(u.pathname.endsWith('/gift_issuance_review_cases'))return Response.json([{id:ids.case,stripe_session_id:session}]);
  if(u.pathname.endsWith('/gift_certificates'))return Response.json([{
    id:ids.gift,checkout_line_number:1,recipient_email:'private@example.test'}]);
  if(u.pathname.endsWith('/gift_issuance_one_time_dispatch_attempts'))return Response.json([{
    id:ids.attempt,certificate_id:ids.gift,operator_staff_user_id:ids.operator}]);
  if(u.pathname.endsWith('/gift_issuance_delivery_followup_reviews'))return Response.json([{
    attempt_id:ids.attempt,event_kind:'independent_recipient_recheck',actor_staff_user_id:ids.first}]);
  if(u.pathname.endsWith('/gift_issuance_delivery_closure_recurrence'))return Response.json([{
    attempt_id:ids.attempt,event_kind:'owner_watch_opened',reviewer_staff_user_id:ids.third}]);
  if(u.pathname.endsWith('/gift_issuance_delivery_reopened_exception_reviews'))return Response.json([{
    attempt_id:ids.attempt,event_kind:'owner_exception_reopened',reviewer_staff_user_id:ids.fourth}]);
  if(u.pathname.endsWith('/gift_issuance_delivery_reopened_discrepancy_watch'))return Response.json([fifth,hold]);
  if(u.pathname.endsWith('/gift_issuance_delivery_fifth_recurrence_closure_watch'))return Response.json(events);
  if(u.pathname.endsWith('/staff_users'))return Response.json(names.map(x=>({
    id:ids[x],full_name:x,role_code:x==='owner'?'admin':'detailer'})));
  if(u.pathname.endsWith('/rpc/record_gift_delivery_fifth_recurrence_closure_watch')){
    const b=JSON.parse(init.body);assert.equal(b.p_evidence_sha256.length,64);
    if(events.some(x=>x.event_kind===b.p_event_kind))return Response.json({error:'duplicate'},{status:409});
    const stage=events.length;
    const valid=(stage===0&&b.p_event_kind==='owner_fifth_recurrence_watch_opened'&&
      b.p_actor_id===ids.owner&&b.p_reviewer_id===ids.sixth)||
      (stage===1&&b.p_event_kind==='independent_closure_risk_checked'&&
        b.p_actor_id===ids.sixth&&b.p_reviewer_id===ids.sixth)||
      (stage===2&&b.p_event_kind==='owner_continued_hold_ack'&&
        b.p_actor_id===ids.owner&&b.p_reviewer_id===ids.sixth);
    if(!valid)return Response.json({error:'independence or stage violation'},{status:409});
    events.push({id:b.p_id,attempt_id:ids.attempt,event_kind:b.p_event_kind,
      reviewer_staff_user_id:b.p_reviewer_id,decision_code:b.p_decision_code,
      evidence_kind:b.p_evidence_kind,evidence_reference:b.p_evidence_reference,
      observed_at:b.p_observed_at,created_at:new Date().toISOString()});
    return Response.json({id:b.p_id,manual_hold:true,gift_resends:0,provider_requests:0,payment_mutations:0});}
  throw Error('Unexpected external contact '+u.pathname);
};
async function call(method,who,b,origin='https://rosiedazzlers.ca'){
  const request=new Request(url+(method==='GET'?`?session_id=${session}`:''),{
    method,headers:{cookie:`rd_staff_session=${who}-token`,...(method==='POST'?{origin}:{})},
    ...(b?{body:JSON.stringify(b)}:{})});
  const r=await (method==='GET'?onRequestGet:onRequestPost)({request,env});
  return {status:r.status,data:await r.json()};}
function body(){return {session_id:session,case_id:ids.case,certificate_id:ids.gift,
  attempt_id:ids.attempt,fifth_review_id:ids.fifthReview,event_id:crypto.randomUUID(),
  reviewer_id:ids.sixth,event_kind:'owner_fifth_recurrence_watch_opened',
  decision_code:'recurrence_watch_requested',evidence_kind:'internal_exception_note',
  evidence_reference:'FIFTH-693-TEST',observed_at:new Date().toISOString(),
  confirm_fifth_hold:true,confirm_sixth_independence:true,confirm_no_resend:true};}
try{
  assert.equal(fifthRecurrenceReadiness(fifth,hold,[],{is_admin:true}).internal_alert_due,true);
  assert.equal(fifthRecurrenceReadiness({...fifth,decision_code:'confirmed_delivery'},hold,[],{is_admin:true}).can_open,false);
  assert.equal((await call('GET','sixth')).data.gifts.length,0);
  const get=await call('GET','owner');assert.equal(get.status,200);
  assert.equal(get.data.gifts[0].recipient_email_masked,'p***@example.test');
  assert.equal((await call('POST','owner',body(),'https://evil.test')).status,403);
  const invalid=body();invalid.confirm_no_resend=false;
  assert.equal((await call('POST','owner',invalid)).status,400);
  const reused=body();reused.reviewer_id=ids.fifth;
  assert.equal((await call('POST','owner',reused)).status,409);
  assert.equal((await call('POST','owner',body())).status,200);
  assert.equal((await call('POST','owner',body())).status,409);
  assert.equal((await call('GET','sixth')).data.gifts.length,1);
  const check=body();check.event_kind='independent_closure_risk_checked';
  check.decision_code='new_discrepancy_detected';check.evidence_kind='recipient_reported_missing';
  assert.equal((await call('POST','fifth',check)).status,409);
  assert.equal((await call('POST','sixth',check)).status,200);
  const ack=body();ack.event_kind='owner_continued_hold_ack';ack.decision_code='continued_manual_hold';
  assert.equal((await call('POST','owner',ack)).status,200);
  assert.equal((await call('GET','owner')).data.gifts[0].events.length,3);
  assert.equal((await call('POST','owner',ack)).status,409);
  assert.ok(calls.every(([p,m])=>p.startsWith('/rest/v1/')&&
    (m==='GET'||p.endsWith('/rpc/record_gift_delivery_fifth_recurrence_closure_watch'))));
}finally{globalThis.fetch=originalFetch;}
const sql=readFileSync(new URL('../supabase/migrations/20261028163645_build693_fifth_reviewer_recurrence_closure_watch.sql',import.meta.url),'utf8');
assert.match(sql,/unique\(attempt_id,event_kind\)/);assert.match(sql,/v_fourth.reviewer_staff_user_id,v_fifth.actor_staff_user_id/);
assert.match(sql,/security invoker/);assert.match(sql,/enable row level security/);
assert.match(sql,/reject_gift_closeout_audit_change/);
assert.match(readFileSync(new URL('../admin-gift-recovery-review.html',import.meta.url),'utf8'),/review693FifthRecurrence/);
console.log('Build 693 sixth independent recurrence witness, fifth-review HOLD and permanent no-resend: PASS');
