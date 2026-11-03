import {sha256Receipt754} from './owner-receipt-verification-v754.js';

// A source-representing document is not source custody. Its exact bytes can be
// bound to the signed Build 754 witness record without declaring actual closure.
export const SOURCE_RECORD_FIELDS755=Object.freeze([
  'schema','booking_id','period','source_correction_reference','source_system',
  'source_record_id','source_revision_id','source_recorded_at','source_actor_id',
  'correction_kind','baseline_snapshot_sha256','retest_snapshot_sha256',
  'original_provenance_reference'
]);
const uuid=value=>typeof value==='string'&&/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);
const hash=value=>typeof value==='string'&&/^[0-9a-f]{64}$/i.test(value);
const id=value=>typeof value==='string'&&/^[A-Za-z0-9][A-Za-z0-9._:/-]{5,119}$/.test(value);
const timestamp=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(value)&&Number.isFinite(Date.parse(value));
const sourceSystems=new Set(['accounting_records','bookings','job_time_entries','catalog_inventory_posting_rows','managed_pricing_catalog']);
const correctionKinds=new Set(['pricing_source_review','accounting_reconciliation','shift_time_reconciliation','consumable_cost_reconciliation','booking_vehicle_size_review']);
const readOnlyFlags=Object.freeze({source_correction_record_verified:false,source_record_custody_verified:false,
  owner_closure_audit_persisted:false,closure_recorded:false,closure_allowed:false,automatic_business_write:false});
export function canonicalSourceRecord755(record){
  if(!record||typeof record!=='object'||Array.isArray(record)||Object.keys(record).length!==SOURCE_RECORD_FIELDS755.length||
    !SOURCE_RECORD_FIELDS755.every(field=>Object.hasOwn(record,field)&&typeof record[field]==='string'))
    throw Error('Source record must have exactly the documented canonical fields.');
  return new TextEncoder().encode('rosie-economic-source-record-v755:'+JSON.stringify(SOURCE_RECORD_FIELDS755.map(field=>[field,record[field]])));
}
const follow=(code,severity,action)=>({code,severity,action});

/** Builds a *derived and unsigned* audit packet; cannot certify or persist closure. */
export async function reviewEconomicSourceRecord755({record,owner_receipt,source_attestation,receipt_verification,live,reviewed_at=new Date().toISOString()}={}){
  const op=owner_receipt?.payload,sp=source_attestation?.payload;
  const result={ok:true,build:755,evidence_status:'HOLD_SOURCE_RECORD_NOT_AUTHENTICATED',
    source_record_content_hash_matched:false,owner_receipt_authenticated:!!receipt_verification?.owner_receipt_authenticated,
    source_attestation_authenticated:!!receipt_verification?.source_attestation_authenticated,
    receipt_gate:receipt_verification?.closure_gate||'HOLD_RECEIPT_NOT_VERIFIED',
    ...readOnlyFlags,read_only:true,reviewed_at,
    source_record_sha256:null,source_reference:null,booking_id:op?.booking_id||null,
    decision_audit:[],exceptions:[],follow_ups:[],review_packet_sha256:null,
    audit_kind:'derived_unsigned_session_packet',audit_persistence:'NOT_RECORDED'};
  const fail=(status,code,action)=>{
    result.evidence_status=status;
    result.exceptions.push({code,description:action});
    result.follow_ups.push(follow(code,'blocking',action));
  };
  let transcript;
  try{transcript=canonicalSourceRecord755(record);}catch{
    fail('HOLD_SOURCE_RECORD_FORMAT','RECORD_FORMAT','Supply the exact independently retained source record in the canonical Build 755 format.');
  }
  if(transcript){
    const structurallyValid=record.schema==='rosie-economic-source-record-v755'&&uuid(record.booking_id)&&
      /^20\d{2}-(0[1-9]|1[012])$/.test(record.period)&&id(record.source_correction_reference)&&
      sourceSystems.has(record.source_system)&&id(record.source_record_id)&&id(record.source_revision_id)&&
      timestamp(record.source_recorded_at)&&id(record.source_actor_id)&&correctionKinds.has(record.correction_kind)&&
      hash(record.baseline_snapshot_sha256)&&hash(record.retest_snapshot_sha256)&&
      id(record.original_provenance_reference)&&record.baseline_snapshot_sha256!==record.retest_snapshot_sha256;
    if(!structurallyValid){
      fail('HOLD_SOURCE_RECORD_FORMAT','RECORD_SCOPE','The source record has invalid identifiers, timestamps, hashes, correction type or source table.');
    }else{
      const digest=await sha256Receipt754(transcript);
      result.source_record_sha256=digest;
      result.source_reference=record.source_correction_reference;
      if(!op||!sp||record.booking_id!==op.booking_id||record.booking_id!==sp.booking_id||
        record.period!==op.period||record.period!==sp.period||
        record.source_correction_reference!==op.source_correction_reference||record.source_correction_reference!==sp.source_correction_reference||
        record.baseline_snapshot_sha256!==op.baseline_snapshot_sha256||record.baseline_snapshot_sha256!==sp.baseline_snapshot_sha256||
        record.retest_snapshot_sha256!==op.retest_snapshot_sha256||record.retest_snapshot_sha256!==sp.retest_snapshot_sha256||
        Date.parse(record.source_recorded_at)>Date.parse(sp.issued_at)||Date.parse(record.source_recorded_at)>Date.parse(op.issued_at)){
        fail('HOLD_SOURCE_RECORD_SCOPE','RECORD_SCOPE','The source-record identity, chronology or revision hashes differ from the independent signed receipts.');
      }else if(digest!==sp.source_record_sha256){
        fail('HOLD_SOURCE_RECORD_HASH_MISMATCH','RECORD_HASH','The original-record bytes are not the ones committed to by the signed source witness.');
      }else{
        result.source_record_content_hash_matched=true;
      }
    }
  }
  if(receipt_verification?.closure_gate!=='ELIGIBLE_FOR_MANUAL_CLOSURE_REVIEW'){
    fail('HOLD_RECEIPT_OR_SOURCE_RECHECK','OWNER_OR_SOURCE_SIGNATURE','Obtain valid independent signatures and a current source read with no open exception before owner decision review.');
  }else if(!result.exceptions.length){
    result.evidence_status='MATCHED_SOURCE_DOCUMENT_MANUAL_CLOSURE_HOLD';
  }
  const sourceReadMatched=receipt_verification?.source_recheck_matched===true&&live?.snapshot_sha256===op?.retest_snapshot_sha256;
  result.decision_audit=[
    {phase:'source_baseline_and_retest',status:sourceReadMatched?'snapshot_rechecked':'recheck_hold',reference:live?.snapshot_sha256||null,occurred_at:live?.read_at||null},
    {phase:'independent_source_witness',status:result.source_attestation_authenticated?'signature_authenticated':'signature_hold',reference:sp?.key_id||null,occurred_at:sp?.issued_at||null},
    {phase:'source_record_content',status:result.source_record_content_hash_matched?'witness_hash_matched_unproven_custody':'source_record_hold',reference:result.source_record_sha256,occurred_at:record?.source_recorded_at||null},
    {phase:'owner_closure_decision',status:result.owner_receipt_authenticated?'signed_decision_review_only':'owner_signature_hold',reference:op?.decision||null,occurred_at:op?.issued_at||null},
    {phase:'source_system_closure',status:'not_recorded_source_custody_and_owner_write_pending',reference:null,occurred_at:null}
  ];
  result.follow_ups.push(
    follow('VERIFY_SOURCE_CUSTODY','blocking','Independently retrieve the immutable original correction history directly from its owning system and verify the correct actor, revision and original record.'),
    follow('RECORD_AUTHORITATIVE_OWNER_DECISION','blocking','Have an authorized owner explicitly review and record the closure disposition in the owning source workflow. This review packet cannot close a case.'),
    follow('RETEST_ANY_SUBSEQUENT_DRIFT','review','If period, booking, margin, pricing or current source snapshot changes, obtain new independent witness and owner signatures.')
  );
  const summary={schema:'rosie-derived-economic-review-packet-v755',receipt_gate:result.receipt_gate,
    evidence_status:result.evidence_status,reviewed_at,booking_id:result.booking_id,
    source_record_sha256:result.source_record_sha256,live_snapshot_sha256:live?.snapshot_sha256||null,
    decision_audit:result.decision_audit,exceptions:result.exceptions,follow_ups:result.follow_ups,
    read_only:true,closure_recorded:false};
  result.review_packet_sha256=await sha256Receipt754(new TextEncoder().encode(JSON.stringify(summary)));
  return result;
}
