import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {summarizeSixthWitnessHold,onRequestGet}
  from '../functions/api/admin/gift_sixth_witness_hold_aging.js';

const HOUR=3600000,now=Date.now();
const at=n=>new Date(now-n*HOUR).toISOString();
const gift={id:'gift-694',checkout_line_number:1,recipient_email_masked:'p***@example.test',
  attempt_id:'attempt-694',fifth_review_id:'review-694',fifth_decision:'still_disputed',
  fifth_age_hours:26,events:[]};
function event(event_kind,h,decision_code){return {event_kind,created_at:at(h),decision_code};}
const watch=event('owner_fifth_recurrence_watch_opened',25);
const witness=event('independent_closure_risk_checked',49,'new_discrepancy_detected');
const ack=event('owner_continued_hold_ack',1,'continued_manual_hold');
const opening=summarizeSixthWitnessHold(gift,now);
assert.equal(opening.phase,'OWNER_ASSIGNMENT_PENDING');
assert.equal(opening.initial_24h_alert,true);
const waiting=summarizeSixthWitnessHold({...gift,events:[watch]},now);
assert.equal(waiting.phase,'SIXTH_WITNESS_PENDING');
assert.equal(waiting.witness_24h_alert,true);
assert.equal(waiting.owner_48h_alert,false);
assert.equal(summarizeSixthWitnessHold({...gift,events:[event('owner_fifth_recurrence_watch_opened',337)]},now).review_window_expired,true);
const checked=summarizeSixthWitnessHold({...gift,events:[watch,witness]},now);
assert.equal(checked.phase,'OWNER_HOLD_ACK_PENDING');
assert.equal(checked.owner_48h_alert,true);
assert.equal(checked.known_unresolved_recurrence,true);
assert.equal(summarizeSixthWitnessHold({...gift,events:[watch,witness,ack]},now).phase,'OWNER_HOLD_ACKNOWLEDGED_UNRESOLVED');
for(const result of [opening,waiting,checked]){
  assert.equal(result.manual_hold,true);assert.equal(result.resend_permitted,false);
  assert.equal(result.customer_messages_sent,0);assert.equal(result.payment_mutations,0);
  assert.equal(result.provider_requests,0);assert.equal(result.delivery_confirmed,false);
  assert.equal(result.reviewer_reassignment_automatic,false);
  assert.equal(JSON.stringify(result).includes('private@example.test'),false);
}

const originalFetch=globalThis.fetch,calls=[];
const session='cs_test_BUILD694_SIXTH_AGING',owner='69400000-0000-4000-8000-000000000001';
async function digest(s){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))))
  .map(x=>x.toString(16).padStart(2,'0')).join('');}
globalThis.fetch=async(input,init={})=>{
  const u=new URL(input);calls.push([u.pathname,init.method||'GET']);
  assert.equal(u.hostname,'database.example.test');
  if(u.pathname.endsWith('/staff_auth_sessions')){
    const valid=u.searchParams.get('token_hash')===`eq.${await digest('owner-token')}`;
    return Response.json(valid?[{id:'s',staff_user:{id:owner,role_code:'admin',is_active:true,
      full_name:'Owner',permissions_profile:{}},revoked_at:null,
      expires_at:new Date(now+HOUR).toISOString(),created_at:new Date(now).toISOString()}]:[]);}
  if(u.pathname.endsWith('/gift_issuance_review_cases'))return Response.json([{id:'case-694',stripe_session_id:session}]);
  if(u.pathname.endsWith('/gift_certificates'))return Response.json([{id:'gift-694',
    checkout_line_number:1,recipient_email:'private@example.test'}]);
  if(u.pathname.endsWith('/gift_issuance_one_time_dispatch_attempts'))return Response.json([{id:'attempt-694',certificate_id:'gift-694'}]);
  if(u.pathname.endsWith('/gift_issuance_delivery_followup_reviews'))return Response.json([]);
  if(u.pathname.endsWith('/gift_issuance_delivery_closure_recurrence'))return Response.json([]);
  if(u.pathname.endsWith('/gift_issuance_delivery_reopened_exception_reviews'))return Response.json([]);
  if(u.pathname.endsWith('/gift_issuance_delivery_reopened_discrepancy_watch'))return Response.json([
    {id:'review-694',attempt_id:'attempt-694',event_kind:'independent_discrepancy_reassessed',
      decision_code:'still_disputed',created_at:at(26)},
    {id:'hold-694',attempt_id:'attempt-694',event_kind:'owner_no_resend_hold_ack',created_at:at(25)}]);
  if(u.pathname.endsWith('/gift_issuance_delivery_fifth_recurrence_closure_watch'))return Response.json([{
    ...watch,attempt_id:'attempt-694',reviewer_staff_user_id:owner}]);
  if(u.pathname.endsWith('/staff_users'))return Response.json([]);
  throw Error('Unexpected non-read source request '+u.pathname);
};
try{
  const url='https://rosiedazzlers.ca/api/admin/gift_sixth_witness_hold_aging?session_id='+session;
  const request=new Request(url,{headers:{cookie:'rd_staff_session=owner-token'}});
  const response=await onRequestGet({request,env:{SUPABASE_URL:'https://database.example.test',
    SUPABASE_SERVICE_ROLE_KEY:'fixture-only'}});
  assert.equal(response.status,200);assert.match(response.headers.get('Cache-Control'),/no-store/);
  const data=await response.json();assert.equal(data.build,694);assert.equal(data.read_only,true);
  assert.equal(data.gifts.length,1);assert.equal(data.gifts[0].phase,'SIXTH_WITNESS_PENDING');
  assert.equal(data.gifts[0].recipient_email_masked,'p***@example.test');
  assert.equal(data.ql248_connection_state,'DISCONNECTED');
  assert.ok(calls.every(([p,m])=>p.startsWith('/rest/v1/')&&m==='GET'));
}finally{globalThis.fetch=originalFetch;}
assert.match(readFileSync(new URL('../admin-gift-recovery-review.html',import.meta.url),'utf8'),/review694SixthAging/);
assert.equal('onRequestPost' in await import('../functions/api/admin/gift_sixth_witness_hold_aging.js'),false);
console.log('Build 694 read-only sixth-witness HOLD, 24h/48h/14d aging, masked-only and no writes: PASS');
