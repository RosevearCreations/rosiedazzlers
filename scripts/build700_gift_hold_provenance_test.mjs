import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {captureHoldSnapshot} from '../assets/admin-gift-hold-snapshot-compare-v699.js';
import {reviewHoldSnapshotProvenance,validateNonsecretReviewPacket}
  from '../assets/admin-gift-hold-provenance-v700.js';

const now=Date.parse('2026-10-29T03:00:00.000Z');
const id=n=>`70000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const row={case_id:id(1),attempt_id:id(2),certificate_id:id(3),
  checkout_line_number:1,follow_up_classification:'MANUAL_HOLD_MONITOR',
  phase:'RECHECK_PENDING',manual_hold:true,resend_permitted:false,
  customer_contact_authorized:false,owner_release_authorized:false,
  delivery_evidence:'NOT_CERTIFIED',recurrence_history:'NOT_INFERRED_FROM_ONE_SNAPSHOT',
  connection_state:'DISCONNECTED'};
const source={ok:true,build:698,read_only:true,connection_state:'DISCONNECTED',
  historical_audit_complete:false,confirmed_delivery_count:0,authorized_closure_count:0,
  independently_confirmed_recurrence_count:null,snapshot_sha256:'a'.repeat(64),
  followups:[row],case_count:1,truncated_possible:true};
const captured=await captureHoldSnapshot(source,'2026-10-29T01:00:00.000Z');
const review=await reviewHoldSnapshotProvenance(captured,now);
assert.equal(review.freshness_status,'SELF_INTEGRITY_ONLY');
assert.equal(review.local_self_integrity_matched,true);
assert.equal(review.independent_snapshot_witness_verified,false);
assert.equal(review.original_owner_capture_authenticated,false);
assert.equal(review.owner_release_authorized,false);
assert.equal(review.resend_permitted,false);
assert.equal(review.connection_state,'DISCONNECTED');
assert.equal(review.private_registry_snapshot_sha256,'NOT_AVAILABLE');
assert.ok(!JSON.stringify(review).includes(id(1)),'No raw case identity in review packet');
assert.ok(!Object.hasOwn(review,'cases'));
assert.equal(validateNonsecretReviewPacket(review),true);
const stale=await reviewHoldSnapshotProvenance(captured,now+48*3600000);
assert.equal(stale.freshness_status,'STALE_SAMPLE_RECAPTURE_REQUIRED');
const future=await reviewHoldSnapshotProvenance(captured,now-4*3600000);
assert.equal(future.freshness_status,'CLOCK_SKEW_REVIEW_REQUIRED');
for(const patch of [{local_integrity_sha256:'f'.repeat(64)},
  {prior_snapshot_authenticated:true},{cases:[{...captured.cases[0],resend_permitted:true}]},
  {captured_at:'not-a-date'}])
  await assert.rejects(reviewHoldSnapshotProvenance({...captured,...patch},now));
for(const patch of [{owner_release_authorized:true},{connection_state:'CONNECTED'},
  {independent_witness_receipt_id:'invented'}, {original_owner_capture_authenticated:true}])
  assert.throws(()=>validateNonsecretReviewPacket({...review,...patch}));
const html=readFileSync(new URL('../admin-gift-recovery-review.html',import.meta.url),'utf8');
assert.match(html,/review700GiftProvenance/);
assert.match(html,/admin-gift-hold-provenance-ui-v700/);
console.log('Build 700 local gift snapshot integrity/freshness review and non-secret untrusted packet: PASS');
