import {sha256Receipt754} from './owner-receipt-verification-v754.js';

const HASH=/^[a-f0-9]{64}$/i;
const utc=s=>typeof s==='string'&&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(s)&&
  Number.isFinite(Date.parse(s));
const THRESHOLD_HOURS=72;
const HOUR_MS=3600000;
const hold=(code,action)=>({code,action});

// Re-evaluates authentic original-source claims at the server's current time.
// Never accepts a client-provided "ready" flag, system time or expiry override.
export async function reconcileRetentionCustodyExpiry777({
  history,now=Date.now(),reviewed_at=new Date(now).toISOString()
}={}){
  if(!Number.isFinite(now))throw Error('A finite server time is required.');
  const owner=history?.owner;
  const followthrough=history?.followthrough;
  const exception=history?.exception;
  const custody=history?.custody;
  const predecessor=history?.history;
  const expiry=custody?.custody_expires_at;
  const signedAt=custody?.signed_at;
  const signedChain=history?.report?.ok===true&&
    history.report.owner_followthrough_status===
      'READY_FOR_SEPARATE_ORIGINAL_OWNER_CUSTODIAN_FOLLOWTHROUGH_DECISION'&&
    owner?.signature_authenticated===true&&owner.requests_review===true&&
    followthrough?.signature_authenticated===true&&followthrough.current_claim===true&&
    exception?.signature_authenticated===true&&exception.clear_claim===true&&
    exception.open_exception_count===0&&
    custody?.signature_authenticated===true&&custody.renewed_claim===true&&
    custody.critical_count===0&&
    HASH.test(custody.receipt_sha256||'')&&
    HASH.test(custody.current_custody_renewal_register_sha256||'')&&
    HASH.test(custody.retained_source_history_sha256||'')&&
    custody.retained_source_history_sha256===
      predecessor?.retention?.retained_source_history_sha256&&
    utc(signedAt)&&utc(expiry)&&
    Date.parse(signedAt)<=now+300000&&
    Date.parse(expiry)>Date.parse(signedAt)&&
    Date.parse(expiry)<=Date.parse(signedAt)+30*86400000;
  const remainingHours=signedChain?
    Math.round((Date.parse(expiry)-now)/HOUR_MS*100)/100:null;
  const ageHours=signedChain?
    Math.round(Math.max(0,(now-Date.parse(signedAt))/HOUR_MS)*100)/100:null;
  const stale=signedChain&&now-Date.parse(signedAt)>7*86400000;
  const expired=signedChain&&Date.parse(expiry)<=now;
  const due=signedChain&&!expired&&!stale&&
    Date.parse(expiry)-now<=THRESHOLD_HOURS*HOUR_MS;
  const follow_ups=[];
  if(!signedChain)follow_ups.push(hold('SIGNED_ORIGINAL_CUSTODY_CHAIN_INCOMPLETE',
    'Reauthenticate all original Build 776 owner, case, exception and custody issuers; never infer expiry from a browser claim.'));
  if(signedChain&&stale)follow_ups.push(hold('ORIGINAL_SOURCE_FRESHNESS_EXCEEDED',
    'Renew independent original-source evidence. Signed source observation is older than seven days.'));
  if(expired)follow_ups.push(hold('ORIGINAL_CUSTODY_WITNESS_EXPIRED',
    'Original custodian and owner must separately reauthenticate a fresh renewal; this app cannot extend expiry.'));
  else if(due)follow_ups.push(hold('ORIGINAL_CUSTODY_RENEWAL_DUE',
    'Independent custody expiry is within 72 hours. Owner and original custodian must review renewal evidence.'));
  if(signedChain&&exception.open_exception_count>0)
    follow_ups.push(hold('AGING_EXCEPTION_REOPENED',
      'Reconcile authentic original case exception counts before further disposition.'));
  follow_ups.push(hold('SEPARATE_ORIGINAL_OWNER_CUSTODIAN_DECISION_REQUIRED',
    'Any real closure, custody renewal, external dispute disposition or retention enforcement requires a separate original-owner/custodian action.'));
  const clean=signedChain&&!stale&&!expired&&!due;
  const report={ok:true,build:777,read_only:true,
    predecessor_status:history?.report?.owner_followthrough_status||'HOLD',
    original_signed_custody_receipt_sha256:signedChain?custody.receipt_sha256:null,
    original_retained_source_history_sha256:signedChain?
      custody.retained_source_history_sha256:null,
    original_custody_renewal_register_sha256:signedChain?
      custody.current_custody_renewal_register_sha256:null,
    source_observed_at:signedChain?signedAt:null,
    custody_expires_at:signedChain?expiry:null,
    renewal_review_due_at:signedChain?
      new Date(Date.parse(expiry)-THRESHOLD_HOURS*HOUR_MS).toISOString():null,
    remaining_hours:remainingHours,source_age_hours:ageHours,
    renewal_alert_threshold_hours:THRESHOLD_HOURS,
    custody_expiry_status:!signedChain?'HOLD_ORIGINAL_SIGNED_CUSTODY_EVIDENCE':
      expired?'HOLD_ORIGINAL_CUSTODY_WITNESS_EXPIRED':
      stale?'HOLD_STALE_ORIGINAL_CUSTODY_SOURCE':
      due?'RENEWAL_REVIEW_DUE_WITHIN_72_HOURS':
      'CURRENT_WITNESS_READY_FOR_SEPARATE_OWNER_CUSTODIAN_REVIEW',
    owner_business_signoff_by_app:false,external_dispute_closed_by_app:false,
    custody_expiry_extended_by_app:false,source_retention_modified_by_app:false,
    production_database_written_by_app:false,source_archive_modified_by_app:false,
    append_only_audit_written_by_app:false,notification_sent_by_app:false,
    automatic_business_action:false,closure_allowed:false,
    blocking_count:follow_ups.length,follow_ups,reviewed_at};
  report.packet_sha256=await sha256Receipt754(new TextEncoder().encode(JSON.stringify({
    schema:'rosie-retention-custody-expiry-recheck-v777',
    predecessor:history?.report?.packet_sha256||null,
    custody:signedChain?custody.receipt_sha256:null,
    status:report.custody_expiry_status,reviewed_at,follow_ups})));
  return report;
}
