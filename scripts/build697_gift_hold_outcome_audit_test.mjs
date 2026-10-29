import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet,auditGiftHoldOutcome} from '../functions/api/admin/gift_hold_escalation_outcome_audit.js';

const id=n=>`69700000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const q={case_id:id(1),certificate_id:id(2),attempt_id:id(3),session_id:'cs_test_BUILD697_HOLD_AUDIT',
  checkout_line_number:1,attention:'OWNER_ACK_OVERDUE_48H',priority:1,phase:'OWNER_HOLD_ACK_PENDING',
  urgency:'OVERDUE_OWNER_ACK',owner_ack_age_hours:null,fifth_review_age_hours:86,watch_age_hours:60,
  internal_steps:['first','second','third','fourth'],manual_hold:true,resend_permitted:false,
  delivery_confirmed:false,customer_contact_authorized:false,automatic_escalation:false,
  connection_state:'DISCONNECTED'};
const outcomes=new Set();
for(const attention of ['FIFTH_HOLD_ACK_MISSING','OWNER_ACK_OVERDUE_48H',
  'SIXTH_WITNESS_WINDOW_EXPIRED_14D','SIXTH_WITNESS_OVERDUE_24H',
  'OWNER_ASSIGNMENT_OVERDUE_24H','HOLD_ACK_RECORDED_STILL_UNRESOLVED','MANUAL_HOLD_MONITOR']){
  const audited=auditGiftHoldOutcome({...q,attention});outcomes.add(audited.outcome);
  assert.equal(audited.closure_authorized,false);assert.equal(audited.final_delivery_verified,false);
  assert.equal(audited.resend_permitted,false);assert.equal(audited.connection_state,'DISCONNECTED');
  assert.equal(JSON.stringify(audited).includes('recipient_email'),false);
}
assert.equal(outcomes.size,7);
assert.throws(()=>auditGiftHoldOutcome({...q,manual_hold:false}));
assert.throws(()=>auditGiftHoldOutcome({...q,resend_permitted:true}));
assert.throws(()=>auditGiftHoldOutcome({...q,attention:'DELIVERED'}));

const now=Date.now(),hour=3600000,at=h=>new Date(now-h*hour).toISOString();
async function digest(s){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))))
  .map(x=>x.toString(16).padStart(2,'0')).join('');}
const previous=globalThis.fetch,calls=[];
globalThis.fetch=async(url,init={})=>{
  const u=new URL(url);calls.push([u.hostname,u.pathname,init.method||'GET']);
  assert.equal(u.hostname,'database.example.test');assert.equal(init.method||'GET','GET');
  if(u.pathname.endsWith('/staff_auth_sessions')){
    const hashes=await Promise.all(['owner-token','staff-token'].map(digest));
    const ix=hashes.indexOf(u.searchParams.get('token_hash')?.replace('eq.',''));
    return Response.json(ix<0?[]:[{id:'session',staff_user:{id:id(10+ix),role_code:ix?'detailer':'admin',
      is_active:true,full_name:'Fixture',permissions_profile:{}},revoked_at:null,
      expires_at:at(-1),created_at:at(1)}]);
  }
  if(u.pathname.endsWith('/gift_issuance_delivery_reopened_discrepancy_watch'))
    return Response.json(u.searchParams.get('event_kind')==='eq.owner_no_resend_hold_ack'?
      [{attempt_id:id(3),event_kind:'owner_no_resend_hold_ack'}]:
      [{id:id(4),case_id:id(1),certificate_id:id(2),attempt_id:id(3),
        decision_code:'still_disputed',created_at:at(86)}]);
  if(u.pathname.endsWith('/gift_issuance_delivery_fifth_recurrence_closure_watch'))
    return Response.json([{attempt_id:id(3),event_kind:'owner_fifth_recurrence_watch_opened',created_at:at(60)},
      {attempt_id:id(3),event_kind:'independent_closure_risk_checked',
        decision_code:'new_discrepancy_detected',created_at:at(49)}]);
  if(u.pathname.endsWith('/gift_certificates'))return Response.json([{id:id(2),checkout_line_number:1,
    stripe_session_id:'cs_test_BUILD697_HOLD_AUDIT'}]);
  throw Error('Unknown source path');
};
async function call(who){const request=new Request('https://rosiedazzlers.ca/api/admin/gift_hold_escalation_outcome_audit',
  {headers:{cookie:`rd_staff_session=${who}-token`}});
  const response=await onRequestGet({request,env:{SUPABASE_URL:'https://database.example.test',
    SUPABASE_SERVICE_ROLE_KEY:'fixture-only'}});
  return {status:response.status,headers:response.headers,data:await response.json()};}
try{
  assert.equal((await call('unknown')).status,401);assert.equal((await call('staff')).status,403);
  const owner=await call('owner');assert.equal(owner.status,200);
  assert.equal(owner.data.build,697);assert.equal(owner.data.case_count,1);
  assert.equal(owner.data.counts.SIXTH_WITNESS_OWNER_ACK_OVERDUE,1);
  assert.equal(owner.data.owner_follow_up_required_count,1);
  assert.equal(owner.data.original_delivery_confirmed_count,0);
  assert.equal(owner.data.historical_audit_complete,false);
  assert.equal(owner.data.outcomes[0].closure_authorized,false);
  assert.match(owner.headers.get('Cache-Control'),/no-store/);
  assert.ok(calls.every(([host,path,method])=>host==='database.example.test'&&
    path.startsWith('/rest/v1/')&&method==='GET'));
}finally{globalThis.fetch=previous;}
assert.equal('onRequestPost' in await import('../functions/api/admin/gift_hold_escalation_outcome_audit.js'),false);
assert.match(readFileSync(new URL('../admin-gift-recovery-review.html',import.meta.url),'utf8'),/review697Outcome/);
console.log('Build 697 owner-only gift HOLD outcome audit and no-resend/closure guarantees: PASS');
