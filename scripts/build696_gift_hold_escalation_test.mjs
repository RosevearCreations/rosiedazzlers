import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet,makeGiftHoldEscalation}
  from '../functions/api/admin/gift_owner_hold_escalation_runbook.js';

const id=n=>`69600000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const valid={case_id:id(1),certificate_id:id(2),attempt_id:id(3),session_id:'cs_test_BUILD696_HOLD_RUNBOOK',
  checkout_line_number:1,attention:'OWNER_ACK_OVERDUE_48H',priority:1,phase:'OWNER_HOLD_ACK_PENDING',
  fifth_review_age_hours:85,watch_age_hours:60,owner_ack_age_hours:null,
  manual_hold:true,resend_permitted:false,delivery_confirmed:false};
for(const label of ['FIFTH_HOLD_ACK_MISSING','OWNER_ACK_OVERDUE_48H',
  'SIXTH_WITNESS_WINDOW_EXPIRED_14D','SIXTH_WITNESS_OVERDUE_24H',
  'OWNER_ASSIGNMENT_OVERDUE_24H','HOLD_ACK_RECORDED_STILL_UNRESOLVED','MANUAL_HOLD_MONITOR']){
  const result=makeGiftHoldEscalation({...valid,attention:label});
  assert.equal(result.internal_steps.length,4);assert.equal(result.manual_hold,true);
  assert.equal(result.resend_permitted,false);assert.equal(result.customer_contact_authorized,false);
  assert.equal(result.automatic_escalation,false);assert.equal(result.connection_state,'DISCONNECTED');
  assert.equal(JSON.stringify(result).includes('recipient_email'),false);
}
assert.throws(()=>makeGiftHoldEscalation({...valid,attention:'UNKNOWN'}));
assert.throws(()=>makeGiftHoldEscalation({...valid,resend_permitted:true}));

const now=Date.now(),hour=3600000,at=h=>new Date(now-h*hour).toISOString();
const originalFetch=globalThis.fetch,calls=[];
async function digest(s){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))))
  .map(x=>x.toString(16).padStart(2,'0')).join('');}
globalThis.fetch=async(input,init={})=>{const u=new URL(input),method=init.method||'GET';
  calls.push([u.hostname,u.pathname,method]);assert.equal(u.hostname,'database.example.test');
  assert.equal(method,'GET');
  if(u.pathname.endsWith('/staff_auth_sessions')){
    const hashes=await Promise.all(['owner-token','staff-token'].map(digest));
    const ix=hashes.indexOf(u.searchParams.get('token_hash')?.replace('eq.',''));
    return Response.json(ix<0?[]:[{id:'staff-auth',staff_user:{id:id(ix+10),role_code:ix?'detailer':'admin',
      is_active:true,full_name:'Fixture',permissions_profile:{}},revoked_at:null,
      expires_at:new Date(now+hour).toISOString(),created_at:at(1)}]);}
  if(u.pathname.endsWith('/gift_issuance_delivery_reopened_discrepancy_watch')){
    return Response.json(u.searchParams.get('event_kind')==='eq.owner_no_resend_hold_ack'?
      [{attempt_id:id(3),event_kind:'owner_no_resend_hold_ack'}]:
      [{id:id(4),case_id:id(1),certificate_id:id(2),attempt_id:id(3),
        decision_code:'still_disputed',created_at:at(85)}]);}
  if(u.pathname.endsWith('/gift_issuance_delivery_fifth_recurrence_closure_watch'))
    return Response.json([{attempt_id:id(3),event_kind:'owner_fifth_recurrence_watch_opened',created_at:at(60)},
      {attempt_id:id(3),event_kind:'independent_closure_risk_checked',
        decision_code:'new_discrepancy_detected',created_at:at(49)}]);
  if(u.pathname.endsWith('/gift_certificates'))return Response.json([{id:id(2),checkout_line_number:1,
    stripe_session_id:'cs_test_BUILD696_HOLD_RUNBOOK'}]);
  throw Error('Unexpected source request '+u.pathname);
};
async function call(who){const request=new Request('https://rosiedazzlers.ca/api/admin/gift_owner_hold_escalation_runbook',
    {headers:{cookie:`rd_staff_session=${who}-token`}});
  const r=await onRequestGet({request,env:{SUPABASE_URL:'https://database.example.test',
    SUPABASE_SERVICE_ROLE_KEY:'fixture-only'}});
  return {status:r.status,headers:r.headers,data:await r.json()};}
try{
  assert.equal((await call('staff')).status,403);assert.equal((await call('unknown')).status,401);
  const owner=await call('owner');assert.equal(owner.status,200);
  assert.equal(owner.data.build,696);assert.equal(owner.data.read_only,true);
  assert.equal(owner.data.runbook.length,1);
  assert.equal(owner.data.runbook[0].attention,'OWNER_ACK_OVERDUE_48H');
  assert.equal(owner.data.runbook[0].internal_steps.length,4);
  assert.match(owner.headers.get('Cache-Control'),/no-store/);
  assert.ok(calls.every(([host,path,m])=>host==='database.example.test'&&path.startsWith('/rest/v1/')&&m==='GET'));
}finally{globalThis.fetch=originalFetch;}
assert.equal('onRequestPost' in await import('../functions/api/admin/gift_owner_hold_escalation_runbook.js'),false);
assert.match(readFileSync(new URL('../admin-gift-recovery-review.html',import.meta.url),'utf8'),/review696Escalation/);
console.log('Build 696 owner-only HOLD escalation runbook, bounded source reuse and zero customer/write actions: PASS');
