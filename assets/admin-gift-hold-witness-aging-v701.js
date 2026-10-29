// Build 701. Age a self-consistent local provenance review; never age away gift HOLD.
import {validateNonsecretReviewPacket} from './admin-gift-hold-provenance-v700.js';

export function ageUnverifiedGiftWitnessReview(packet,now=Date.now()){
  validateNonsecretReviewPacket(packet);
  if(!Number.isSafeInteger(now)||now<1)throw Error('Invalid review clock');
  const capture=Date.parse(packet.snapshot_capture),review=Date.parse(packet.reviewed_at);
  if(!Number.isFinite(capture)||!Number.isFinite(review)||review<capture-300000)
    throw Error('Review/capture chronology cannot be established');
  const captureAge=now-capture,witnessWait=now-review;
  const clockSkew=captureAge< -300000||witnessWait< -300000;
  const priority=clockSkew?'CLOCK_SKEW_PRIVATE_REVIEW_REQUIRED':
    captureAge>=86400000||witnessWait>=86400000?'ESCALATE_RECAPTURE_AND_PRIVATE_WITNESS':
      captureAge>=14400000||witnessWait>=14400000?'PRIVATE_WITNESS_FOLLOWUP_DUE':
        'PRIVATE_WITNESS_REQUEST_PENDING';
  return {schema:'rosie.gift_hold.witness_exception_aging.v701',
    application_name:'Rosie Dazzlers',source_review_schema:packet.schema,
    source_snapshot_sha256:packet.source_snapshot_sha256,
    snapshot_capture:packet.snapshot_capture,reviewed_at:packet.reviewed_at,
    assessed_at:new Date(now).toISOString(),recent_case_count:packet.recent_case_count,
    source_sample_is_bounded:true,possible_truncation:packet.truncated_possible,
    snapshot_age_hours:Math.round(Math.max(0,captureAge)/360000)/10,
    independent_witness_wait_hours:Math.round(Math.max(0,witnessWait)/360000)/10,
    follow_up_classification:priority,
    original_snapshot_authenticity:'NOT_VERIFIED',
    independent_witness_status:'NOT_ASSIGNED_OR_VERIFIED',
    original_delivery_verified:false,recurrence_proven:false,
    sample_absence_means_closure:false,owner_release_authorized:false,
    manual_hold:true,resend_permitted:false,owner_test_decision:'NOT_GIVEN',
    connection_state:'DISCONNECTED',
    next_specific_action:priority.startsWith('CLOCK')?
      'Check trusted clocks and independently authenticated owner capture privately.':
      priority.startsWith('ESCALATE')?
        'Recapture latest bounded source and ask separately authenticated witness/reviewer to reconcile original history.':
        'Request an independently authenticated witness/reviewer return in a private channel; do not resend.'};
}
