import {canonicalSourceRecord755} from './economic-source-intake-v755.js';
import {sha256Receipt754} from './owner-receipt-verification-v754.js';
import {serviceHeaders} from './inventory-posting.js';

const HEX=/^[a-f0-9]{64}$/i;
const UUID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const ID=/^[A-Za-z0-9][A-Za-z0-9._:/-]{5,119}$/;
const ZERO='0'.repeat(64);
const SOURCE_SET=new Set(['accounting_records','bookings','job_time_entries','catalog_inventory_posting_rows']);
export const HISTORY_FIELDS757=Object.freeze(['booking_id','source_system','source_record_id','source_revision_id',
  'source_actor_id','source_recorded_at','source_correction_reference','source_record_sha256','revision_number','prev_revision_sha256']);
export const MANIFEST_FIELDS757=Object.freeze(['schema','booking_id','source_system','source_record_id',
  'source_revision_id','source_record_sha256','history_head_sha256','revision_count','issued_at','expires_at','custodian_id','key_id']);
const bytes=value=>new TextEncoder().encode(value);
const digest=async value=>sha256Receipt754(bytes(value));
const held=(status,detail,more={})=>({history_status:status,detail,history_chain_integrity_verified:false,
  independent_history_head_signature_verified:false,immutable_retention_policy_verified:false,
  source_record_custody_verified:false,original_revision_custody_verified:false,
  immutable_source_history_verified:false,history_head_sha256:null,...more});
const strictKeys=(obj,keys)=>obj&&typeof obj==='object'&&!Array.isArray(obj)&&
  Object.keys(obj).length===keys.length&&keys.every(key=>Object.hasOwn(obj,key));
const iso=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(value)&&Number.isFinite(Date.parse(value));
const b64=(value,len)=>{
  if(typeof value!=='string'||value.length>200||value.length%4||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))return null;
  try{const data=Uint8Array.from(atob(value),x=>x.charCodeAt(0));return data.length===len?data:null;}catch{return null;}
};

export function canonicalHistoryRevision757(row){
  if(!strictKeys(row,HISTORY_FIELDS757)||!HISTORY_FIELDS757.every(key=>key==='revision_number'?Number.isSafeInteger(row[key]):typeof row[key]==='string'))
    throw Error('History revision must use the canonical field set.');
  return 'rosie-economic-source-history-revision-v757:'+JSON.stringify(HISTORY_FIELDS757.map(key=>[key,row[key]]));
}
export function canonicalCustodianManifest757(payload){
  if(!strictKeys(payload,MANIFEST_FIELDS757)||!MANIFEST_FIELDS757.every(key=>typeof payload[key]==='string'))
    throw Error('History custodian manifest must use the canonical field set.');
  return bytes('rosie-economic-history-custodian-v757:'+JSON.stringify(MANIFEST_FIELDS757.map(key=>[key,payload[key]])));
}

/** Read source-owned history only; this does not establish DB-level immutability. */
export async function readSourceHistory757(env,record,fetcher=fetch){
  if(!SOURCE_SET.has(record?.source_system)||!UUID.test(record?.source_record_id||'')||!UUID.test(record?.booking_id||''))
    return {status:'HOLD_UNSUPPORTED_HISTORY_SCOPE',rows:[],detail:'Only supported, booking-bound UUID source histories can be read.'};
  if(!env?.SUPABASE_URL||!env?.SUPABASE_SERVICE_ROLE_KEY)
    return {status:'HOLD_SOURCE_HISTORY_UNAVAILABLE',rows:[],detail:'Owning source credentials are not configured.'};
  const query=new URLSearchParams({select:HISTORY_FIELDS757.join(','),booking_id:`eq.${record.booking_id}`,
    source_system:`eq.${record.source_system}`,source_record_id:`eq.${record.source_record_id}`,
    order:'revision_number.asc',limit:'65'});
  try{
    const response=await fetcher(`${env.SUPABASE_URL}/rest/v1/economic_source_revision_history?${query}`,
      {method:'GET',headers:serviceHeaders(env)});
    if(!response.ok)return {status:'HOLD_SOURCE_HISTORY_UNAVAILABLE',rows:[],detail:`Owning history read failed (${response.status}).`};
    const rows=await response.json();
    if(!Array.isArray(rows)||!rows.length||rows.length>64)
      return {status:'HOLD_SOURCE_HISTORY_MISSING_OR_OVERSIZED',rows:[],detail:'No bounded source history, or too many revisions.'};
    return {status:'HISTORY_ROWS_READ',rows,detail:'Read source history rows for local integrity verification.'};
  }catch{return {status:'HOLD_SOURCE_HISTORY_UNAVAILABLE',rows:[],detail:'Owning source history read failed safely.'};}
}

/** An independently pinned signed head detects tampering, not DB retention policy or owner permission. */
export async function verifyHistoryPreflight757({record,manifest,history,env,now=Date.now()}={}){
  if(history?.status!=='HISTORY_ROWS_READ')return held(history?.status||'HOLD_HISTORY_NOT_READ',history?.detail||'No owning source history.');
  const rows=history.rows,payload=manifest?.payload;
  let sourceHash,transcript;
  try{sourceHash=await sha256Receipt754(canonicalSourceRecord755(record));transcript=canonicalCustodianManifest757(payload);}
  catch{return held('HOLD_HISTORY_INPUT_FORMAT','Canonical source record or independent custodian manifest is invalid.');}
  if(payload.schema!=='rosie-economic-history-custodian-v757'||!UUID.test(payload.booking_id)||
    !UUID.test(payload.source_record_id)||!SOURCE_SET.has(payload.source_system)||
    !ID.test(payload.source_revision_id)||!ID.test(payload.custodian_id)||!ID.test(payload.key_id)||
    !HEX.test(payload.source_record_sha256)||!HEX.test(payload.history_head_sha256)||
    !/^(?:[1-9]|[1-5][0-9]|6[0-4])$/.test(payload.revision_count)||
    !iso(payload.issued_at)||!iso(payload.expires_at)||Date.parse(payload.issued_at)>now+300000||
    Date.parse(payload.issued_at)<now-7*86400000||Date.parse(payload.expires_at)<=now||
    Date.parse(payload.expires_at)-Date.parse(payload.issued_at)>48*3600000||
    payload.booking_id!==record.booking_id||payload.source_system!==record.source_system||
    payload.source_record_id!==record.source_record_id||payload.source_revision_id!==record.source_revision_id||
    payload.source_record_sha256!==sourceHash||Number(payload.revision_count)!==rows.length)
    return held('HOLD_HISTORY_MANIFEST_SCOPE','History manifest identity, currency or source hash does not match.');
  let previous=ZERO,chainOk=true;
  for(let i=0;i<rows.length;i++){
    const row=rows[i];
    try{
      if(!UUID.test(row.booking_id)||!UUID.test(row.source_record_id)||!ID.test(row.source_revision_id)||
        !ID.test(row.source_actor_id)||!ID.test(row.source_correction_reference)||!iso(row.source_recorded_at)||
        !HEX.test(row.source_record_sha256)||!HEX.test(row.prev_revision_sha256)||
        row.revision_number!==i+1||row.prev_revision_sha256!==previous||
        row.booking_id!==record.booking_id||row.source_system!==record.source_system||
        row.source_record_id!==record.source_record_id||
        (i>0&&Date.parse(row.source_recorded_at)<Date.parse(rows[i-1].source_recorded_at))){chainOk=false;break;}
      previous=await digest(canonicalHistoryRevision757(row));
    }catch{chainOk=false;break;}
  }
  const last=rows.at(-1);
  if(!chainOk||last.source_revision_id!==record.source_revision_id||last.source_actor_id!==record.source_actor_id||
    last.source_recorded_at!==record.source_recorded_at||last.source_correction_reference!==record.source_correction_reference||
    last.source_record_sha256!==sourceHash||previous!==payload.history_head_sha256)
    return held('HOLD_HISTORY_CHAIN_CONFLICT','Source-owned revision chain, original correction identity or signed head conflicts.');
  const key=b64(env?.ROSIE_ECONOMIC_HISTORY_CUSTODIAN_PUBLIC_KEY_B64,32);
  const own=b64(env?.ROSIE_ECONOMIC_OWNER_RECEIPT_PUBLIC_KEY_B64,32);
  const witness=b64(env?.ROSIE_ECONOMIC_SOURCE_WITNESS_PUBLIC_KEY_B64,32);
  const signature=b64(manifest?.signature_b64,64);
  if(!key||!own||!witness||!signature||payload.key_id!==env?.ROSIE_ECONOMIC_HISTORY_CUSTODIAN_KEY_ID||
    payload.key_id===env?.ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID||payload.key_id===env?.ROSIE_ECONOMIC_SOURCE_WITNESS_KEY_ID||
    key.every((v,i)=>v===own[i])||key.every((v,i)=>v===witness[i]))
    return held('HOLD_INDEPENDENT_CUSTODIAN_KEY','An independently pinned third custodian signature/key is required.');
  try{
    const imported=await crypto.subtle.importKey('raw',key,{name:'Ed25519'},false,['verify']);
    if(!await crypto.subtle.verify('Ed25519',imported,signature,transcript))
      return held('HOLD_CUSTODIAN_SIGNATURE_INVALID','History head signature failed independent verification.');
  }catch{return held('HOLD_CUSTODIAN_SIGNATURE_INVALID','History custodian signature could not be verified.');}
  return held('HISTORY_CHAIN_AND_INDEPENDENT_HEAD_MATCHED_RETENTION_UNVERIFIED',
    'Bounded source-owned revision chain and independent signed head match, but immutable retention enforcement and closure authority have not been proven.',
    {history_chain_integrity_verified:true,independent_history_head_signature_verified:true,
      history_head_sha256:previous,verified_revision_count:rows.length,custodian_key_id:payload.key_id});
}

export async function reconcileHistoryAuthorization757({prior_review,history_verification,audit_readiness,reviewed_at=new Date().toISOString()}={}){
  const history=history_verification||held('HOLD_HISTORY_NOT_RUN','Original source history has not been checked.');
  const blockers=[];
  if(prior_review?.closure_review_status!=='HOLD_CLOSURE_AUTHORIZATION'||!prior_review.source_readback?.source_row_identity_matched)
    blockers.push({code:'PRIOR_SOURCE_REVIEW_HOLD',action:'Resolve Build 756 owner signatures, current source row, booking binding and retest.'});
  if(!history.history_chain_integrity_verified||!history.independent_history_head_signature_verified)
    blockers.push({code:'INDEPENDENT_SOURCE_HISTORY_REQUIRED',action:'Retrieve source-owned history and a matching, independently signed custodian head.'});
  if(!history.immutable_retention_policy_verified)
    blockers.push({code:'IMMUTABLE_RETENTION_NOT_PROVEN',action:'Independently audit source history append-only enforcement, external retention and old-version recovery.'});
  if(audit_readiness?.probe_status!=='AUDIT_TABLE_VISIBLE_WRITE_POLICY_UNVERIFIED')
    blockers.push({code:'OWNER_AUDIT_SCHEMA_NOT_VERIFIED',action:'Confirm owner decision audit schema existence and independent access-policy review.'});
  blockers.push({code:'APPEND_ONLY_OWNER_AUDIT_NOT_AUTHORIZED',action:'Review SQL design, RLS/grants, no-update/delete controls, unique decision idempotency and transactional rollback.'});
  blockers.push({code:'EXPLICIT_OWNER_CLOSURE_NOT_RECORDED',action:'Obtain separate owner closure authorization and independently witnessed, persisted audit receipt.'});
  const result={ok:true,build:757,read_only:true,history_verification:history,
    owner_audit_design_status:'DESIGN_ONLY_NOT_APPLIED',owner_audit_persistence_authorized:false,
    history_immutability_proven:false,source_record_custody_verified:false,
    owner_closure_audit_persisted:false,closure_authorized:false,closure_recorded:false,closure_allowed:false,
    automatic_business_write:false,closure_preflight_status:'HOLD_CLOSURE_AUTHORIZATION',
    blocking_count:blockers.length,follow_ups:blockers,reviewed_at};
  result.preflight_sha256=await digest(JSON.stringify({schema:'rosie-closure-preflight-v757',status:result.closure_preflight_status,
    history:history.history_status,head:history.history_head_sha256,audit:audit_readiness?.probe_status||'MISSING',
    blockers,reviewed_at}));
  return result;
}
