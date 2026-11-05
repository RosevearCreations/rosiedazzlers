import {sha256Receipt754} from './owner-receipt-verification-v754.js';

const HASH=/^[a-f0-9]{64}$/i;
const HOLD='HOLD_ORIGINAL_SIGNED_CUSTODY_EVIDENCE';
const statuses=new Set([
  HOLD,'HOLD_ORIGINAL_CUSTODY_WITNESS_EXPIRED',
  'HOLD_STALE_ORIGINAL_CUSTODY_SOURCE','RENEWAL_REVIEW_DUE_WITHIN_72_HOURS',
  'CURRENT_WITNESS_READY_FOR_SEPARATE_OWNER_CUSTODIAN_REVIEW'
]);

// A case follow-up only. The v777 report MUST be freshly computed from
// original-source signatures by the owner-session API; never accept a browser
// assertion that a custodian has renewed the underlying retained evidence.
export async function reconcileRetentionRenewalFollowup778({expiryReport,now=Date.now()}={}){
  if(!Number.isFinite(now))throw Error('Finite server time required.');
  const prior=expiryReport;
  if(prior?.ok!==true||prior?.build!==777||prior.read_only!==true||
     prior.closure_allowed!==false||prior.production_database_written_by_app!==false)
    throw Error('Fresh read-only Build 777 source verification required.');
  const observed=prior.custody_expiry_status;
  const signed=HASH.test(prior.original_signed_custody_receipt_sha256||'')&&
    HASH.test(prior.original_retained_source_history_sha256||'')&&
    HASH.test(prior.original_custody_renewal_register_sha256||'');
  const validStatus=statuses.has(observed);
  const hold=observed===HOLD||!signed||!validStatus;
  const status=hold?'HOLD_RENEWAL_SIGNED_SOURCE_OR_DIGEST_CONFLICT':
    observed==='HOLD_ORIGINAL_CUSTODY_WITNESS_EXPIRED'?
      'HOLD_ORIGINAL_CUSTODIAN_RENEWAL_EXPIRED':
    observed==='HOLD_STALE_ORIGINAL_CUSTODY_SOURCE'?
      'HOLD_SIGNED_SOURCE_OBSERVATION_STALE':
    observed==='RENEWAL_REVIEW_DUE_WITHIN_72_HOURS'?
      'MANUAL_RENEWAL_REVIEW_DUE_WITHIN_72_HOURS':
      'CURRENT_SOURCE_SEPARATE_OWNER_CUSTODIAN_DECISION_PENDING';
  const decision={
    HOLD_RENEWAL_SIGNED_SOURCE_OR_DIGEST_CONFLICT:
      'Obtain original issuer verification, resolve the custody/source digest mismatch and rerun the full signed chain.',
    HOLD_ORIGINAL_CUSTODIAN_RENEWAL_EXPIRED:
      'Original custodian must separately issue a new signed custody witness; original owner must review it.',
    HOLD_SIGNED_SOURCE_OBSERVATION_STALE:
      'Original issuer must provide a fresh signed source observation before any separate renewal decision.',
    MANUAL_RENEWAL_REVIEW_DUE_WITHIN_72_HOURS:
      'Owner and original custodian should review the signed expiry before it lapses; no renewal is executed here.',
    CURRENT_SOURCE_SEPARATE_OWNER_CUSTODIAN_DECISION_PENDING:
      'Continue read-only observation; only the original owner and custodian may separately authorize renewal.'
  }[status];
  const reviewed_at=new Date(now).toISOString();
  const follow_ups=[{code:status,action:decision},
    {code:'SEPARATE_ORIGINAL_OWNER_CUSTODIAN_ACTION_REQUIRED',
      action:'Do not treat a software release, recheck or unsigned packet as an original-owner decision or independent custody renewal.'}];
  const report={ok:true,build:778,read_only:true,
    predecessor_build:777,predecessor_status:observed||HOLD,
    renewal_followup_status:status,
    original_source_digest:signed?prior.original_retained_source_history_sha256:null,
    original_custody_receipt_sha256:signed?prior.original_signed_custody_receipt_sha256:null,
    original_custody_register_sha256:signed?prior.original_custody_renewal_register_sha256:null,
    custody_expires_at:signed?prior.custody_expires_at:null,
    renewal_review_due_at:signed?prior.renewal_review_due_at:null,
    source_age_hours:signed?prior.source_age_hours:null,
    remaining_hours:signed?prior.remaining_hours:null,
    independent_issuer_reverification_required:hold||status==='HOLD_SIGNED_SOURCE_OBSERVATION_STALE',
    original_owner_action_required:true,original_custodian_action_required:true,
    closure_allowed:false,owner_business_signoff_by_app:false,
    custody_renewed_by_app:false,custody_expiry_extended_by_app:false,
    retention_modified_by_app:false,production_database_written_by_app:false,
    audit_written_by_app:false,notification_sent_by_app:false,
    automatic_business_action:false,blocking_count:follow_ups.length,
    follow_ups,reviewed_at};
  report.packet_sha256=await sha256Receipt754(new TextEncoder().encode(JSON.stringify({
    schema:'rosie-custody-renewal-exception-followup-v778',
    prior:prior.packet_sha256||null,status,reviewed_at,follow_ups})));
  return report;
}
