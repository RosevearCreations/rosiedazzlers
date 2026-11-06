import {sha256Receipt754} from './owner-receipt-verification-v754.js';

const HASH=/^[a-f0-9]{64}$/i;
const ROLES=['original_owner','original_custodian','independent_exception_issuer'];
const KEYS=['ORIGINAL_OWNER_CUSTODY_DECISION','INDEPENDENT_CUSTODIAN_RENEWAL',
  'SIGNED_SOURCE_EXCEPTION_DISPOSITION'];

// This reconciles freshly computed source reports, not independent humans'
// signatures. A register row, software release or unsigned download is never
// treated as an owner/custodian/exception-issuer decision.
export async function reconcileCustodyDecisionWitness780({register,expiryReport,
  followupReport,history,now=Date.now()}={}){
  if(!Number.isFinite(now))throw Error('Finite server time required.');
  const valid=register?.ok===true&&register.build===779&&register.read_only===true&&
    register.closure_allowed===false&&register.production_database_written_by_app===false&&
    HASH.test(register.packet_sha256||'')&&
    expiryReport?.ok===true&&expiryReport.build===777&&expiryReport.read_only===true&&
    expiryReport.closure_allowed===false&&
    followupReport?.ok===true&&followupReport.build===778&&followupReport.read_only===true&&
    followupReport.closure_allowed===false&&followupReport.custody_renewed_by_app===false&&
    followupReport.predecessor_status===expiryReport.custody_expiry_status&&
    Array.isArray(register.decision_rows)&&register.decision_rows.length===3&&
    register.decision_rows.every((r,i)=>r?.issuer_role===ROLES[i]&&
      r.decision_key===KEYS[i]&&typeof r.status==='string'&&
      !/^(APPROVED|SIGNED|CLOSED|RENEWED|AUTHORIZED)/.test(r.status));
  if(!valid)throw Error('Fresh matched Build 777/778/779 source decision chain required.');
  const digest=expiryReport.original_retained_source_history_sha256;
  const custody=expiryReport.original_signed_custody_receipt_sha256;
  const renewal=expiryReport.original_custody_renewal_register_sha256;
  const hashesMatch=HASH.test(digest||'')&&HASH.test(custody||'')&&
    HASH.test(renewal||'')&&
    register.original_retained_source_history_sha256===digest&&
    register.original_custody_receipt_sha256===custody&&
    register.original_custody_register_sha256===renewal&&
    followupReport.original_source_digest===digest&&
    followupReport.original_custody_receipt_sha256===custody&&
    followupReport.original_custody_register_sha256===renewal;
  const noOpenExceptions=history?.report?.ok===true&&
    history.exception?.signature_authenticated===true&&
    history.exception?.open_exception_count===0&&
    register.original_open_exception_count===0;
  const registerCurrent=!String(register.custody_decision_register_status||'').startsWith('HOLD')&&
    register.decision_rows[0].status==='PENDING_SEPARATE_ORIGINAL_OWNER_DECISION'&&
    ['CURRENT_FOR_SEPARATE_MANUAL_REVIEW','RENEWAL_REVIEW_DUE']
      .includes(register.decision_rows[1].status)&&
    register.decision_rows[2].status==='NO_OPEN_EXCEPTION_CLAIM_FOR_MANUAL_REVIEW';
  const sourceMatched=hashesMatch&&noOpenExceptions&&registerCurrent;
  const witness_reconciliation_status=sourceMatched?
    'SOURCE_CHAIN_MATCHED_EXTERNAL_WITNESSES_STILL_REQUIRED':
    'HOLD_INDEPENDENT_WITNESS_SOURCE_OR_EXCEPTION_CONFLICT';
  const reviewed_at=new Date(now).toISOString();
  const witness_rows=[
    {role:ROLES[0],source_status:register.decision_rows[0].status,
      independent_witness_status:'AWAITING_AUTHENTIC_OWNER_DECISION',
      required_action:'Independently authenticate the original owner and obtain an actual signed decision.'},
    {role:ROLES[1],source_status:register.decision_rows[1].status,
      independent_witness_status:sourceMatched?'AWAITING_CUSTODIAN_RENEWAL_DECISION':'HOLD_CUSTODIAN_SOURCE',
      required_action:'Independently verify original custodian identity, expiry and signed renewal decision.'},
    {role:ROLES[2],source_status:register.decision_rows[2].status,
      independent_witness_status:sourceMatched?'AWAITING_EXCEPTION_ISSUER_DISPOSITION':'HOLD_EXCEPTION_ISSUER_SOURCE',
      required_action:'Independently verify the original exception issuer and any dispute disposition.'}
  ];
  const result={ok:true,build:780,read_only:true,predecessor_builds:[777,778,779],
    original_source_chain_reconciled:sourceMatched,
    witness_reconciliation_status,original_open_exception_count:
      Number.isSafeInteger(register.original_open_exception_count)?
        register.original_open_exception_count:null,
    original_source_digest_sha256:hashesMatch?digest:null,
    original_custody_receipt_sha256:hashesMatch?custody:null,
    original_custody_renewal_register_sha256:hashesMatch?renewal:null,
    witness_rows,independent_original_owner_signature_verified:false,
    independent_custodian_renewal_signature_verified:false,
    independent_exception_disposition_signature_verified:false,
    external_decisions_required:true,closure_allowed:false,
    original_owner_business_signoff_by_app:false,custodian_renewal_executed_by_app:false,
    original_dispute_closed_by_app:false,source_expiry_extended_by_app:false,
    source_retention_modified_by_app:false,production_database_written_by_app:false,
    append_only_audit_written_by_app:false,external_notification_sent_by_app:false,
    automatic_business_action:false,reviewed_at};
  result.packet_sha256=await sha256Receipt754(new TextEncoder().encode(JSON.stringify({
    schema:'rosie-independent-custody-decision-witness-reconciliation-v780',
    expiry:expiryReport.packet_sha256,followup:followupReport.packet_sha256,
    register:register.packet_sha256,status:witness_reconciliation_status,
    witness_rows,reviewed_at})));
  return result;
}
