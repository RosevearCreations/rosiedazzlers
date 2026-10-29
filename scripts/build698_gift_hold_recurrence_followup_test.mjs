import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {onRequestGet,reconcileGiftHoldFollowup,fingerprintFollowup}
  from '../functions/api/admin/gift_hold_recurrence_followup.js';

const id=n=>`69800000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const base={case_id:id(1),certificate_id:id(2),attempt_id:id(3),checkout_line_number:1,
  outcome:'SIXTH_WITNESS_OWNER_ACK_OVERDUE',phase:'OWNER_HOLD_ACK_PENDING',priority:1,
  fifth_review_age_hours:90,watch_age_hours:70,owner_ack_age_hours:null,
  evidence_disposition:'UNRESOLVED_ORIGINAL_DELIVERY',manual_hold:true,resend_permitted:false,
  final_delivery_verified:false,closure_authorized:false,customer_contact_authorized:false,
  automatic_escalation:false,connection_state:'DISCONNECTED'};
const seen=new Set();
for(const outcome of ['MISSING_OWNER_HOLD_ACK','SIXTH_WITNESS_OWNER_ACK_OVERDUE',
  'SIXTH_WITNESS_WINDOW_EXPIRED','SIXTH_WITNESS_OUTCOME_OVERDUE',
  'SIXTH_WITNESS_ASSIGNMENT_OVERDUE','RECORDED_HOLD_ACK_ONLY','PENDING_MANUAL_REVIEW']){
  const row=reconcileGiftHoldFollowup({...base,outcome});seen.add(row.follow_up_classification);
  assert.equal(row.resend_permitted,false);assert.equal(row.owner_release_authorized,false);
  assert.equal(row.delivery_evidence,'NOT_CERTIFIED');
  assert.equal(row.recurrence_history,'NOT_INFERRED_FROM_ONE_SNAPSHOT');
  assert.equal(JSON.stringify(row).includes('recipient_email'),false);
}
assert.equal(seen.size,7);
for(const patch of [{manual_hold:false},{resend_permitted:true},
  {final_delivery_verified:true},{closure_authorized:true},
  {outcome:'DELIVERED'},{evidence_disposition:'CLOSED'}])
  assert.throws(()=>reconcileGiftHoldFollowup({...base,...patch}));
const first=reconcileGiftHoldFollowup(base);
const second=reconcileGiftHoldFollowup({...base,case_id:id(4),attempt_id:id(5)});
assert.equal(await fingerprintFollowup([first,second]),await fingerprintFollowup([second,first]));
assert.notEqual(await fingerprintFollowup([first]),await fingerprintFollowup([second]));

const now=Date.now(),at=h=>new Date(now-h*3600000).toISOString();
const previous=globalThis.fetch,calls=[];
async function digest(s){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s))))
  .map(x=>x.toString(16).padStart(2,'0')).join('');}
globalThis.fetch=async(url,init={})=>{
  const u=new URL(url),method=init.method||'GET';calls.push([u.hostname,u.pathname,method]);
  assert.equal(method,'GET');assert.equal(u.hostname,'database.example.test');
  if(u.pathname.endsWith('/staff_auth_sessions')){
    const hashes=await Promise.all(['owner-token','staff-token'].map(digest));
    const ix=hashes.indexOf(u.searchParams.get('token_hash')?.replace('eq.',''));
    return Response.json(ix<0?[]:[{id:'test-session',staff_user:{id:id(ix+10),
      role_code:ix?'detailer':'admin',is_active:true,full_name:'Fixture',permissions_profile:{}},
      revoked_at:null,expires_at:at(-1),created_at:at(1)}]);
  }
  if(u.pathname.endsWith('/gift_issuance_delivery_reopened_discrepancy_watch'))
    return Response.json(u.searchParams.get('event_kind')==='eq.owner_no_resend_hold_ack'?
      [{attempt_id:id(3),event_kind:'owner_no_resend_hold_ack'}]:
      [{id:id(6),case_id:id(1),certificate_id:id(2),attempt_id:id(3),
        decision_code:'still_disputed',created_at:at(90)}]);
  if(u.pathname.endsWith('/gift_issuance_delivery_fifth_recurrence_closure_watch'))
    return Response.json([{attempt_id:id(3),event_kind:'owner_fifth_recurrence_watch_opened',created_at:at(70)},
      {attempt_id:id(3),event_kind:'independent_closure_risk_checked',
        decision_code:'new_discrepancy_detected',created_at:at(49)}]);
  if(u.pathname.endsWith('/gift_certificates'))return Response.json([{id:id(2),checkout_line_number:1,
    stripe_session_id:'cs_test_BUILD698_HOLD_FOLLOWUP'}]);
  throw Error('Unexpected database path');
};
async function call(who){const request=new Request('https://rosiedazzlers.ca/api/admin/gift_hold_recurrence_followup',
  {headers:{cookie:`rd_staff_session=${who}-token`}});
  const response=await onRequestGet({request,env:{SUPABASE_URL:'https://database.example.test',
    SUPABASE_SERVICE_ROLE_KEY:'fixture-only'}});
  return {status:response.status,data:await response.json(),headers:response.headers};}
try{
  assert.equal((await call('nobody')).status,401);
  assert.equal((await call('staff')).status,403);
  const owner=await call('owner');assert.equal(owner.status,200);
  assert.equal(owner.data.build,698);assert.equal(owner.data.case_count,1);
  assert.equal(owner.data.counts.OWNER_ACK_ESCALATION_OVERDUE,1);
  assert.equal(owner.data.manual_follow_up_count,1);
  assert.match(owner.data.snapshot_sha256,/^[0-9a-f]{64}$/);
  assert.equal(owner.data.snapshot_comparison_available,false);
  assert.equal(owner.data.independently_confirmed_recurrence_count,null);
  assert.equal(owner.data.confirmed_delivery_count,0);
  assert.match(owner.headers.get('Cache-Control'),/no-store/);
  assert.ok(calls.every(([host,path,method])=>host==='database.example.test'&&
    path.startsWith('/rest/v1/')&&method==='GET'));
}finally{globalThis.fetch=previous;}
assert.equal('onRequestPost' in await import('../functions/api/admin/gift_hold_recurrence_followup.js'),false);
const html=readFileSync(new URL('../admin-gift-recovery-review.html',import.meta.url),'utf8');
assert.match(html,/review698Followup/);
console.log('Build 698 bounded owner-only HOLD recurrence snapshot, stable digest and zero write/closure claims: PASS');
