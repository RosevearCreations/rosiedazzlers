import assert from 'node:assert/strict';
import {ageUnverifiedGiftWitnessReview}
  from '../assets/admin-gift-hold-witness-aging-v701.js';

const base=Date.parse('2026-10-29T17:00:00.000Z');
const packet={schema:'rosie.gift_hold.provenance_review.v700',
  application_name:'Rosie Dazzlers',snapshot_capture:new Date(base-3600000).toISOString(),
  reviewed_at:new Date(base-900000).toISOString(),source_build:698,
  source_snapshot_sha256:'a'.repeat(64),local_integrity_sha256:'b'.repeat(64),
  recent_case_count:4,truncated_possible:false,local_self_integrity_matched:true,
  original_owner_capture_authenticated:false,independent_snapshot_witness_verified:false,
  owner_release_authorized:false,manual_hold:true,resend_permitted:false,
  owner_test_decision:'NOT_GIVEN',connection_state:'DISCONNECTED',
  independent_witness_receipt_id:'NOT_AVAILABLE',private_registry_snapshot_sha256:'NOT_AVAILABLE',
  freshness_status:'SELF_INTEGRITY_ONLY'};
const pending=ageUnverifiedGiftWitnessReview(packet,base);
assert.equal(pending.follow_up_classification,'PRIVATE_WITNESS_REQUEST_PENDING');
assert.equal(pending.manual_hold,true);assert.equal(pending.resend_permitted,false);
assert.equal(pending.original_delivery_verified,false);assert.equal(pending.recurrence_proven,false);
assert.equal(pending.connection_state,'DISCONNECTED');
assert.equal(ageUnverifiedGiftWitnessReview(packet,base+5*3600000).follow_up_classification,
  'PRIVATE_WITNESS_FOLLOWUP_DUE');
assert.equal(ageUnverifiedGiftWitnessReview(packet,base+26*3600000).follow_up_classification,
  'ESCALATE_RECAPTURE_AND_PRIVATE_WITNESS');
assert.equal(ageUnverifiedGiftWitnessReview(packet,base-3600000).follow_up_classification,
  'CLOCK_SKEW_PRIVATE_REVIEW_REQUIRED');
assert.throws(()=>ageUnverifiedGiftWitnessReview({...packet,owner_release_authorized:true},base),/HOLD-safe/);
assert.throws(()=>ageUnverifiedGiftWitnessReview({...packet,independent_witness_receipt_id:'claimed'},base),/HOLD-safe/);
console.log('Build 701 local witness-aging priority, freshness/skew, no gift release or fabricated provenance: PASS');
