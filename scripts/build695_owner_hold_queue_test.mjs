import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet,rankOwnerHoldTriage}
  from '../functions/api/admin/gift_owner_hold_triage_queue.js';

const HOUR=3600000,now=Date.now(),stamp=h=>new Date(now-h*HOUR).toISOString();
const id=n=>`69500000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const event=(attempt,event_kind,h,decision_code)=>({attempt_id:attempt,event_kind,created_at:stamp(h),decision_code});
const fifth=[
  {id:id(1),case_id:id(20),certificate_id:id(40),attempt_id:id(60),decision_code:'still_disputed',created_at:stamp(30)},
  {id:id(2),case_id:id(21),certificate_id:id(41),attempt_id:id(61),decision_code:'documentary_gap',created_at:stamp(100)},
  {id:id(3),case_id:id(22),certificate_id:id(42),attempt_id:id(62),decision_code:'contradiction_not_resolved',created_at:stamp(400)},
  {id:id(4),case_id:id(23),certificate_id:id(43),attempt_id:id(63),decision_code:'still_disputed',created_at:stamp(26)}
];
const holds=fifth.slice(0,3).map(f=>({attempt_id:f.attempt_id,event_kind:'owner_no_resend_hold_ack'}));
const events=[
  event(id(60),'owner_fifth_recurrence_watch_opened',27),
  event(id(61),'owner_fifth_recurrence_watch_opened',60),
  event(id(61),'independent_closure_risk_checked',49,'new_discrepancy_detected'),
  event(id(62),'owner_fifth_recurrence_watch_opened',337)
];
const certificates=fifth.map((f,i)=>({id:f.certificate_id,checkout_line_number:i+1,
  stripe_session_id:`cs_test_BUILD695_OWNER_TRIAGE_${i+1}`}));
const bare=rankOwnerHoldTriage(fifth[0],holds[0],events.filter(e=>e.attempt_id===id(60)),certificates[0],now);
assert.equal(bare.attention,'SIXTH_WITNESS_OVERDUE_24H');
assert.equal(bare.priority,3);assert.equal(bare.manual_hold,true);
assert.equal(bare.resend_permitted,false);assert.equal(bare.delivery_confirmed,false);
assert.equal('recipient_email' in bare,true);assert.equal(bare.recipient_email,undefined);
assert.equal(rankOwnerHoldTriage({...fifth[0],decision_code:'confirmed_delivery'},holds[0],[],certificates[0],now),null);
assert.throws(()=>rankOwnerHoldTriage(fifth[0],holds[0],[],{...certificates[0],stripe_session_id:'unsafe'},now));

const originalFetch=globalThis.fetch,calls=[];
async function digest(s){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))))
  .map(x=>x.toString(16).padStart(2,'0')).join('');}
globalThis.fetch=async(input,init={})=>{
  const u=new URL(input);calls.push([u.pathname,init.method||'GET']);
  assert.equal(u.hostname,'database.example.test');assert.equal(init.method||'GET','GET');
  if(u.pathname.endsWith('/staff_auth_sessions')){
    const hashes=await Promise.all(['owner-token','operator-token'].map(digest));
    const ix=hashes.indexOf(u.searchParams.get('token_hash')?.replace('eq.',''));
    return Response.json(ix<0?[]:[{id:id(ix+100),staff_user:{id:id(ix+100),
      role_code:ix?'detailer':'admin',is_active:true,full_name:'Fixture',permissions_profile:{}},
      revoked_at:null,expires_at:new Date(now+HOUR).toISOString(),created_at:stamp(1)}]);}
  if(u.pathname.endsWith('/gift_issuance_delivery_reopened_discrepancy_watch')){
    assert.equal(u.searchParams.get('limit'),'100');
    return Response.json(u.searchParams.get('event_kind')==='eq.owner_no_resend_hold_ack'?holds:fifth);}
  if(u.pathname.endsWith('/gift_issuance_delivery_fifth_recurrence_closure_watch')){
    assert.equal(u.searchParams.get('limit'),'300');return Response.json(events);}
  if(u.pathname.endsWith('/gift_certificates')){assert.equal(u.searchParams.get('limit'),'100');return Response.json(certificates);}
  throw Error('Unexpected non-read-only source '+u.pathname);
};
async function call(who){const request=new Request('https://rosiedazzlers.ca/api/admin/gift_owner_hold_triage_queue',
    {headers:{cookie:`rd_staff_session=${who}-token`}});
  const r=await onRequestGet({request,env:{SUPABASE_URL:'https://database.example.test',
    SUPABASE_SERVICE_ROLE_KEY:'fixture-only'}});
  return {status:r.status,headers:r.headers,data:await r.json()};}
try{
  assert.equal((await call('operator')).status,403);
  assert.equal((await call('invalid')).status,401);
  const ok=await call('owner');assert.equal(ok.status,200);assert.equal(ok.data.build,695);
  assert.equal(ok.data.read_only,true);assert.equal(ok.data.connection_state,'DISCONNECTED');
  assert.match(ok.headers.get('Cache-Control'),/no-store/);
  assert.deepEqual(ok.data.queue.map(x=>x.priority),[0,1,2,3]);
  assert.equal(ok.data.queue[0].attention,'FIFTH_HOLD_ACK_MISSING');
  assert.equal(ok.data.queue[1].attention,'OWNER_ACK_OVERDUE_48H');
  assert.equal(ok.data.queue[2].attention,'SIXTH_WITNESS_WINDOW_EXPIRED_14D');
  assert.equal(ok.data.queue[3].attention,'SIXTH_WITNESS_OVERDUE_24H');
  assert.equal(JSON.stringify(ok.data).includes('private@example.test'),false);
  assert.ok(ok.data.queue.every(x=>!Object.hasOwn(x,'recipient_email')&&
    !Object.hasOwn(x,'recipient_email_masked')&&x.resend_permitted===false&&x.provider_requests===0));
  assert.ok(calls.every(([p,m])=>p.startsWith('/rest/v1/')&&m==='GET'));
}finally{globalThis.fetch=originalFetch;}
const html=readFileSync(new URL('../admin-gift-recovery-review.html',import.meta.url),'utf8');
assert.match(html,/review695OwnerQueue/);assert.match(html,/admin-gift-owner-hold-queue-v695/);
assert.equal('onRequestPost' in await import('../functions/api/admin/gift_owner_hold_triage_queue.js'),false);
console.log('Build 695 owner-only ranked 100-case HOLD queue, no recipient data, no new writes and safe exact-checkout handoff: PASS');
