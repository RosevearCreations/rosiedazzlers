// Build 700: browser-local snapshot provenance review, NEVER independent attestation.
import {validateHoldSnapshot} from './admin-gift-hold-snapshot-compare-v699.js';

const SHA=/^[a-f0-9]{64}$/;
export async function reviewHoldSnapshotProvenance(input,now=Date.now()){
  if(!Number.isSafeInteger(now)||now<1)throw Error('Invalid review clock');
  const snapshot=await validateHoldSnapshot(input);
  const age=now-Date.parse(snapshot.captured_at);
  const status=age< -5*60_000?'CLOCK_SKEW_REVIEW_REQUIRED':
    age>24*3600_000?'STALE_SAMPLE_RECAPTURE_REQUIRED':'SELF_INTEGRITY_ONLY';
  return {
    schema:'rosie.gift_hold.provenance_review.v700',application_name:'Rosie Dazzlers',
    snapshot_schema:snapshot.schema,snapshot_capture:snapshot.captured_at,
    reviewed_at:new Date(now).toISOString(),source_build:snapshot.source_build,
    source_snapshot_sha256:snapshot.source_snapshot_sha256,
    local_integrity_sha256:snapshot.local_integrity_sha256,
    recent_case_count:snapshot.case_count,source_bounded_latest_100:true,
    truncated_possible:snapshot.truncated_possible,
    age_hours:Math.round(Math.max(0,age)/360000)/10,
    freshness_status:status,local_self_integrity_matched:true,
    original_owner_capture_authenticated:false,independent_prior_history_authenticated:false,
    independent_snapshot_witness_verified:false,
    source_runtime_sha_attested:false,original_delivery_verified:false,
    recurrence_independently_confirmed:false,case_absence_means_closure:false,
    owner_release_authorized:false,manual_hold:true,resend_permitted:false,
    independent_witness_receipt_id:'NOT_AVAILABLE',
    private_registry_snapshot_sha256:'NOT_AVAILABLE',
    owner_test_decision:'NOT_GIVEN',connection_state:'DISCONNECTED',
    evidence_gap:'Self-consistent local JSON digest does not establish original owner capture, unmodified history, external custody or delivery. Ask an independently authenticated reviewer to compare original source and witness privately.'
  };
}
export function validateNonsecretReviewPacket(packet){
  if(!packet||typeof packet!=='object'||Array.isArray(packet)||
    packet.schema!=='rosie.gift_hold.provenance_review.v700'||
    packet.application_name!=='Rosie Dazzlers'||
    !SHA.test(String(packet.source_snapshot_sha256||''))||
    !SHA.test(String(packet.local_integrity_sha256||''))||
    !Number.isSafeInteger(packet.recent_case_count)||packet.recent_case_count<0||
    packet.recent_case_count>100||packet.local_self_integrity_matched!==true||
    packet.original_owner_capture_authenticated!==false||
    packet.independent_snapshot_witness_verified!==false||
    packet.owner_release_authorized!==false||packet.manual_hold!==true||
    packet.resend_permitted!==false||packet.connection_state!=='DISCONNECTED'||
    packet.owner_test_decision!=='NOT_GIVEN'||
    packet.independent_witness_receipt_id!=='NOT_AVAILABLE'||
    packet.private_registry_snapshot_sha256!=='NOT_AVAILABLE'||
    !['CLOCK_SKEW_REVIEW_REQUIRED','STALE_SAMPLE_RECAPTURE_REQUIRED','SELF_INTEGRITY_ONLY']
      .includes(packet.freshness_status))throw Error('Review packet is not a HOLD-safe unverified request');
  return true;
}
