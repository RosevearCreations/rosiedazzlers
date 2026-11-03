import {sha256Receipt754} from './owner-receipt-verification-v754.js';
import {serviceHeaders} from './inventory-posting.js';

// Narrow allowlist: all data read stays on the server and excludes customer PII.
const SOURCE756=Object.freeze({
  accounting_records:{table:'accounting_records',select:'id,booking_id,updated_at,created_at,package_code,vehicle_size,total_cad',booking:'booking_id'},
  bookings:{table:'bookings',select:'id,package_code,vehicle_size,service_date,service_area_zone',booking:'id'},
  job_time_entries:{table:'job_time_entries',select:'id,booking_id,updated_at,created_at,event_time,entry_type,minutes,source',booking:'booking_id'},
  catalog_inventory_posting_rows:{table:'catalog_inventory_posting_rows',select:'id,batch_id,updated_at,created_at,item_key,quantity,unit_cost_cents,status',booking:'batch'}
});
const uuid=value=>typeof value==='string'&&/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);
const clean=value=>String(value??'').trim().toLowerCase();
const held=(status,detail,additional={})=>({readback_status:status,detail,
  source_row_identity_matched:false,current_source_row_hash_sha256:null,
  original_revision_custody_verified:false,immutable_source_history_verified:false,...additional});

export function sourceReadbackPath756(record){
  if(!record||!Object.hasOwn(SOURCE756,record.source_system)||!uuid(record.source_record_id)||!uuid(record.booking_id))return null;
  const {table,select}=SOURCE756[record.source_system];
  const query=new URLSearchParams({select,id:`eq.${record.source_record_id}`,limit:'2'});
  return `${table}?${query}`;
}

async function readLimited(env,table,query,fetcher){
  if(!env?.SUPABASE_URL||!env?.SUPABASE_SERVICE_ROLE_KEY)throw Error('Owning source credentials are not configured.');
  const result=await fetcher(`${env.SUPABASE_URL}/rest/v1/${table}?${query}`,{method:'GET',headers:serviceHeaders(env)});
  if(!result.ok)throw Error(`Owning source read failed (${result.status}).`);
  const rows=await result.json();
  if(!Array.isArray(rows)||rows.length!==1)throw Error('Owning source record was missing or ambiguous.');
  return rows[0];
}

/** Verify *current* DB row ownership; no available universal immutable revision is assumed. */
export async function readAuthoritativeEconomicSource756(env,record,fetcher=fetch){
  const path=sourceReadbackPath756(record);
  if(!path)return held('HOLD_SOURCE_SELECTOR_UNSUPPORTED',
    'Choose a supported source and real UUID record ID. Managed pricing must be reviewed through the owning pricing history separately.');
  try{
    const [table,query]=path.split('?');
    const row=await readLimited(env,table,query,fetcher);
    if(clean(row.id)!==clean(record.source_record_id))
      return held('HOLD_SOURCE_RECORD_ID_MISMATCH','The authoritative source returned a different record identity.');
    let bookingId=row[SOURCE756[record.source_system].booking];
    if(record.source_system==='catalog_inventory_posting_rows'){
      if(!uuid(row.batch_id))return held('HOLD_POSTING_BATCH_MISSING','A posting row must have an authentic batch UUID.');
      const batch=await readLimited(env,'catalog_inventory_posting_batches',
        new URLSearchParams({select:'id,source_kind,source_reference_id,status,created_at',id:`eq.${row.batch_id}`,limit:'2'}),fetcher);
      if(clean(batch.id)!==clean(row.batch_id)||batch.source_kind!=='booking')
        return held('HOLD_POSTING_BATCH_SCOPE','The posting row does not belong to a booking-owned inventory batch.');
      bookingId=batch.source_reference_id;
    }
    if(clean(bookingId)!==clean(record.booking_id))
      return held('HOLD_BOOKING_BINDING_MISMATCH','The actual source record belongs to another booking.');
    const sourceTime=row.updated_at||row.created_at||null;
    if(sourceTime&&Number.isFinite(Date.parse(sourceTime))&&
      Date.parse(sourceTime)+5*60000<Date.parse(record.source_recorded_at))
      return held('HOLD_REVISION_TIME_CONFLICT','The supplied correction timestamp is later than the current source revision time.');
    const fingerprint=await sha256Receipt754(new TextEncoder().encode(JSON.stringify({table,row})));
    return held('CURRENT_ROW_IDENTITY_MATCHED_HISTORY_UNVERIFIED',
      'The currently readable authoritative row belongs to this booking; no independent immutable change revision or original custody has been established.',
      {source_row_identity_matched:true,current_source_row_hash_sha256:fingerprint,
        source_system:record.source_system,source_record_id:record.source_record_id,
        current_row_updated_at:sourceTime,source_readback_kind:'current_row_only'});
  }catch(error){return held('HOLD_AUTHORITY_READBACK_UNAVAILABLE',String(error?.message||'Source unavailable.').slice(0,200));}
}

export async function probeOwnerDecisionPersistence756(env,fetcher=fetch){
  const base={probe_status:'HOLD_AUDIT_SCHEMA_NOT_VERIFIED',audit_table_visible:false,
    append_only_policy_verified:false,owner_decision_persistence_ready:false,
    owner_decision_persistence_authorized:false,owner_closure_audit_persisted:false,
    detail:'No independently reviewed append-only owner audit and access policy have been verified.'};
  if(!env?.SUPABASE_URL||!env?.SUPABASE_SERVICE_ROLE_KEY)return {...base,detail:'Supabase owner audit configuration is unavailable.'};
  try{
    // Read-only shape probe. A 200 does not prove INSERT privilege, append-only
    // constraints, independent owner authority or a durable transaction.
    const query=new URLSearchParams({select:'id,booking_id,owner_receipt_sha256,source_record_sha256,decision,created_at',limit:'0'});
    const response=await fetcher(`${env.SUPABASE_URL}/rest/v1/economic_owner_closure_decision_audit?${query}`,
      {method:'GET',headers:serviceHeaders(env)});
    if(!response.ok)return {...base,probe_status:'HOLD_AUDIT_TABLE_UNAVAILABLE',detail:`Dedicated owner decision audit unavailable (${response.status}); no persistence attempted.`};
    return {...base,probe_status:'AUDIT_TABLE_VISIBLE_WRITE_POLICY_UNVERIFIED',audit_table_visible:true,
      detail:'Dedicated audit table is reachable, but append-only constraints, owner permissions and transactional persistence remain unverified.'};
  }catch{return {...base,probe_status:'HOLD_AUDIT_PROBE_FAILED',detail:'Read-only audit schema probe failed.'};}
}

export async function reconcileEconomicClosure756({prior_review,readback,persistence,reviewed_at=new Date().toISOString()}={}){
  const source=readback||held('HOLD_READBACK_NOT_RUN','Current source not checked.');
  const audit=persistence||await probeOwnerDecisionPersistence756(null);
  const blocked=[];
  if(prior_review?.evidence_status!=='MATCHED_SOURCE_DOCUMENT_MANUAL_CLOSURE_HOLD')
    blocked.push({code:'SIGNED_EVIDENCE_HOLD',priority:'blocking',action:'Obtain the matching Build 755 source record, valid independent signatures and current economic retest.'});
  if(!source.source_row_identity_matched)
    blocked.push({code:'AUTHORITATIVE_RECORD_NOT_MATCHED',priority:'blocking',action:'Resolve source record ID, booking/batch ownership, current revision and authoritative readback.'});
  if(!source.immutable_source_history_verified)
    blocked.push({code:'IMMUTABLE_SOURCE_HISTORY_REQUIRED',priority:'blocking',action:'Obtain independent original correction history, source actor, revision evidence and custody witness. A current row is insufficient.'});
  if(!audit.audit_table_visible)
    blocked.push({code:'OWNER_AUDIT_SCHEMA_UNAVAILABLE',priority:'blocking',action:'Prepare and independently review a dedicated owner-closure audit schema before persistence is authorized.'});
  if(!audit.append_only_policy_verified||!audit.owner_decision_persistence_authorized)
    blocked.push({code:'OWNER_PERSISTENCE_NOT_AUTHORIZED',priority:'blocking',action:'Review append-only policy, role isolation, idempotency and owner authority before enabling a separate persistence workflow.'});
  blocked.push({code:'EXPLICIT_OWNER_CLOSURE_AUTHORIZATION',priority:'blocking',
    action:'Obtain an independent attributable owner closure authorization and record it in the owning system through a separately authorized workflow.'});
  const result={ok:true,build:756,closure_review_status:'HOLD_CLOSURE_AUTHORIZATION',
    source_readback:source,owner_persistence_readiness:audit,source_record_custody_verified:false,
    owner_decision_persistence_ready:false,owner_closure_audit_persisted:false,
    closure_authorized:false,closure_recorded:false,closure_allowed:false,
    automatic_business_write:false,read_only:true,reviewed_at,
    blocking_count:blocked.length,follow_ups:blocked,prior_review_status:prior_review?.evidence_status||'MISSING_PRIOR_REVIEW'};
  const payload={schema:'rosie-closure-authorization-review-v756',reviewed_at,
    status:result.closure_review_status,prior:result.prior_review_status,readback:source.readback_status,
    source_row_hash:source.current_source_row_hash_sha256,probe:audit.probe_status,follow_ups:blocked,
    closure_recorded:false};
  result.review_packet_sha256=await sha256Receipt754(new TextEncoder().encode(JSON.stringify(payload)));
  return result;
}
