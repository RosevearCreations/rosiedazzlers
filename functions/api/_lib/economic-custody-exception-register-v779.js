import {sha256Receipt754} from './owner-receipt-verification-v754.js';

const HASH=/^[a-f0-9]{64}$/i;
const HOLD='HOLD_ORIGINAL_SIGNED_CUSTODY_EVIDENCE';
const classifications={
  CURRENT_SOURCE_SEPARATE_OWNER_CUSTODIAN_DECISION_PENDING:
    ['CURRENT_FOR_SEPARATE_MANUAL_REVIEW','Original custodian and owner must separately decide whether to renew.'],
  MANUAL_RENEWAL_REVIEW_DUE_WITHIN_72_HOURS:
    ['RENEWAL_REVIEW_DUE','Original custodian must review the signed expiry with the owner before it lapses.'],
  HOLD_ORIGINAL_CUSTODIAN_RENEWAL_EXPIRED:
    ['HOLD_EXPIRED_CUSTODY','Obtain a new original-custodian signed renewal and independent owner review.'],
  HOLD_SIGNED_SOURCE_OBSERVATION_STALE:
    ['HOLD_STALE_SOURCE','Original issuer must provide a fresh signed source observation.'],
  HOLD_RENEWAL_SIGNED_SOURCE_OR_DIGEST_CONFLICT:
    ['HOLD_SOURCE_CONFLICT','Resolve the original signed issuer, custodian and retained-source digest conflict.']
};
const expiryToFollowup={
  CURRENT_WITNESS_READY_FOR_SEPARATE_OWNER_CUSTODIAN_REVIEW:
    'CURRENT_SOURCE_SEPARATE_OWNER_CUSTODIAN_DECISION_PENDING',
  RENEWAL_REVIEW_DUE_WITHIN_72_HOURS:'MANUAL_RENEWAL_REVIEW_DUE_WITHIN_72_HOURS',
  HOLD_ORIGINAL_CUSTODY_WITNESS_EXPIRED:'HOLD_ORIGINAL_CUSTODIAN_RENEWAL_EXPIRED',
  HOLD_STALE_ORIGINAL_CUSTODY_SOURCE:'HOLD_SIGNED_SOURCE_OBSERVATION_STALE',
  HOLD_ORIGINAL_SIGNED_CUSTODY_EVIDENCE:'HOLD_RENEWAL_SIGNED_SOURCE_OR_DIGEST_CONFLICT'
};

// Input reports are generated together by the owner-session API from a freshly
// reauthenticated original-issuer chain. They are not user-supplied decisions.
export async function buildCustodyExceptionDecisionRegister779({expiryReport,followupReport,
  history,now=Date.now()}={}){
  if(!Number.isFinite(now))throw Error('Finite server time required.');
  const expiry=expiryReport,follow=followupReport;
  if(expiry?.ok!==true||expiry.build!==777||expiry.read_only!==true||
    expiry.closure_allowed!==false||expiry.production_database_written_by_app!==false||
    !HASH.test(expiry.packet_sha256||'')||
    follow?.ok!==true||follow.build!==778||follow.read_only!==true||
    follow.predecessor_build!==777||follow.predecessor_status!==expiry.custody_expiry_status||
    follow.closure_allowed!==false||follow.production_database_written_by_app!==false||
    follow.custody_renewed_by_app!==false||!HASH.test(follow.packet_sha256||''))
    throw Error('Matched current Build 777/778 original signed-source reports required.');
  const status=follow.renewal_followup_status;
  const match=classifications[status];
  const digest=expiry.original_retained_source_history_sha256;
  const receipt=expiry.original_signed_custody_receipt_sha256;
  const signed=HASH.test(digest||'')&&HASH.test(receipt||'')&&
    HASH.test(expiry.original_custody_renewal_register_sha256||'')&&
    follow.original_source_digest===digest&&
    follow.original_custody_receipt_sha256===receipt&&
    follow.original_custody_register_sha256===expiry.original_custody_renewal_register_sha256;
  const exception=history?.exception;
  const exceptionCount=exception?.signature_authenticated===true&&
    Number.isSafeInteger(exception.open_exception_count)&&exception.open_exception_count>=0?
    exception.open_exception_count:null;
  const state=!match||!signed||history?.report?.ok!==true||
    expiryToFollowup[expiry.custody_expiry_status]!==status?
    'HOLD_UNVERIFIED_CUSTODY_DECISION_SOURCE':
    exceptionCount!==0?'HOLD_ORIGINAL_AGING_EXCEPTION_REVIEW':
    status;
  const held=state.startsWith('HOLD');
  const rows=[
    {decision_key:'ORIGINAL_OWNER_CUSTODY_DECISION',issuer_role:'original_owner',
      status:'PENDING_SEPARATE_ORIGINAL_OWNER_DECISION',
      action:'Obtain actual signed owner authorization independently; this register cannot sign.'},
    {decision_key:'INDEPENDENT_CUSTODIAN_RENEWAL',issuer_role:'original_custodian',
      status:held?'HOLD_INDEPENDENT_CUSTODIAN_EVIDENCE':match[0],
      action:held?'Reauthenticate original custody and source exceptions before renewal review.':match[1]},
    {decision_key:'SIGNED_SOURCE_EXCEPTION_DISPOSITION',issuer_role:'independent_exception_issuer',
      status:exceptionCount===0&&signed&&!held?'NO_OPEN_EXCEPTION_CLAIM_FOR_MANUAL_REVIEW':
        'HOLD_EXCEPTION_OR_SOURCE_EVIDENCE',
      action:exceptionCount===0&&signed&&!held?
        'Review the independently signed zero-open-exception claim; no dispute is closed here.':
        'Reconcile authentic original issuer exception count, signature and retention digests.'}
  ];
  const reviewed_at=new Date(now).toISOString();
  const report={ok:true,build:779,read_only:true,
    predecessor_builds:[777,778],
    original_signed_owner_chain_rechecked:history?.report?.ok===true,
    original_custody_status:expiry.custody_expiry_status||HOLD,
    custody_decision_register_status:state,
    original_open_exception_count:exceptionCount,
    original_custody_receipt_sha256:signed?receipt:null,
    original_retained_source_history_sha256:signed?digest:null,
    original_custody_register_sha256:signed?expiry.original_custody_renewal_register_sha256:null,
    custody_expires_at:signed?expiry.custody_expires_at:null,
    renewal_review_due_at:signed?expiry.renewal_review_due_at:null,
    remaining_hours:signed?expiry.remaining_hours:null,
    source_age_hours:signed?expiry.source_age_hours:null,
    decision_rows:rows,external_decision_required:true,
    original_owner_business_signoff_by_app:false,
    custodian_renewal_executed_by_app:false,
    original_dispute_closed_by_app:false,
    source_expiry_extended_by_app:false,source_retention_modified_by_app:false,
    production_database_written_by_app:false,append_only_audit_written_by_app:false,
    external_notification_sent_by_app:false,automatic_business_action:false,
    closure_allowed:false,reviewed_at};
  report.packet_sha256=await sha256Receipt754(new TextEncoder().encode(JSON.stringify({
    schema:'rosie-independent-custody-exception-decision-register-v779',
    expiry:expiry.packet_sha256,followup:follow.packet_sha256,state,
    rows,reviewed_at})));
  return report;
}
