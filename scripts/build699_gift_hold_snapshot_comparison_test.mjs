import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {captureHoldSnapshot,validateHoldSnapshot,compareHoldSnapshots}
  from '../assets/admin-gift-hold-snapshot-compare-v699.js';

const id=n=>`69900000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const hold=n=>({case_id:id(n),attempt_id:id(n+20),certificate_id:id(n+40),
  checkout_line_number:1,follow_up_classification:'OWNER_ACK_ESCALATION_OVERDUE',
  phase:'OWNER_HOLD_ACK_PENDING',manual_hold:true,resend_permitted:false,
  customer_contact_authorized:false,owner_release_authorized:false,
  delivery_evidence:'NOT_CERTIFIED',recurrence_history:'NOT_INFERRED_FROM_ONE_SNAPSHOT',
  connection_state:'DISCONNECTED'});
const source=rows=>({ok:true,build:698,read_only:true,connection_state:'DISCONNECTED',
  historical_audit_complete:false,confirmed_delivery_count:0,authorized_closure_count:0,
  independently_confirmed_recurrence_count:null,snapshot_sha256:'a'.repeat(64),
  followups:rows,case_count:rows.length,truncated_possible:true});
const a=await captureHoldSnapshot(source([hold(1),hold(2)]),'2026-10-28T21:00:00.000Z');
const b=await captureHoldSnapshot(source([hold(1),{...hold(2),phase:'RECHECK_PENDING'},hold(3)]),
  '2026-10-29T02:00:00.000Z');
assert.equal(a.cases.length,2);assert.match(a.local_integrity_sha256,/^[0-9a-f]{64}$/);
assert.ok(!JSON.stringify(a).includes(id(1)),'Raw case IDs must not be exported');
const comparison=await compareHoldSnapshots(a,b);
assert.equal(comparison.changed_in_bounded_sample,1);
assert.equal(comparison.new_in_bounded_sample,1);
assert.equal(comparison.unchanged_in_bounded_sample,1);
assert.equal(comparison.absent_from_current_bounded_sample,0);
assert.equal(comparison.confirmed_recurrence_count,null);
assert.equal(comparison.confirmed_delivery_count,0);
assert.equal(comparison.resend_permitted,false);
const c=await captureHoldSnapshot(source([hold(1)]),'2026-10-29T03:00:00.000Z');
const disappearance=await compareHoldSnapshots(a,c);
assert.equal(disappearance.absent_from_current_bounded_sample,1);
assert.equal(disappearance.authorized_closure_count,0);
for(const patch of [{resend_permitted:true},{manual_hold:false},{owner_release_authorized:true},
  {delivery_evidence:'DELIVERED'}, {connection_state:'CONNECTED'}])
  await assert.rejects(captureHoldSnapshot(source([{...hold(1),...patch}])));
for(const patch of [{confirmed_delivery_count:1},{historical_audit_complete:true},
  {independently_confirmed_recurrence_count:0}, {truncated_possible:'false'},
  {case_count:99}])await assert.rejects(captureHoldSnapshot({...source([hold(1)]),...patch}));
for(const patch of [{local_integrity_sha256:'0'.repeat(64)},
  {prior_snapshot_authenticated:true},{cases:[...a.cases,a.cases[0]],case_count:3}])
  await assert.rejects(validateHoldSnapshot({...a,...patch}));
await assert.rejects(compareHoldSnapshots(b,a),'Reversed chronology must fail');
const same=await captureHoldSnapshot(source([hold(2),hold(1)]),'2026-10-28T22:00:00.000Z');
assert.equal(same.local_integrity_sha256,a.local_integrity_sha256);
assert.ok(readFileSync(new URL('../admin-gift-recovery-review.html',import.meta.url),'utf8')
  .includes('review699PreviousFile'));
console.log('Build 699 local-only bounded HOLD snapshot comparison, self-integrity and no closure claim: PASS');
