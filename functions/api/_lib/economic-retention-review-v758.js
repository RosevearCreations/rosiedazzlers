import {sha256Receipt754} from './owner-receipt-verification-v754.js';

const HASH=/^[a-f0-9]{64}$/i;
const UUID=/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const ID=/^[A-Za-z0-9][A-Za-z0-9._:/-]{5,119}$/;
const bytes=value=>new TextEncoder().encode(value);
const digest=async value=>sha256Receipt754(bytes(value));
const iso=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(value)&&Number.isFinite(Date.parse(value));
const strict=(value,fields)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===fields.length&&
  fields.every(key=>Object.hasOwn(value,key)&&typeof value[key]==='string');
const decode=(value,len)=>{
  if(typeof value!=='string'||value.length>200||value.length%4||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))return null;
  try{const b=Uint8Array.from(atob(value),c=>c.charCodeAt(0));return b.length===len?b:null;}catch{return null;}
};
const uniqueKeys=(key,env)=>{
  if(!key)return false;
  for(const name of ['ROSIE_ECONOMIC_OWNER_RECEIPT_PUBLIC_KEY_B64','ROSIE_ECONOMIC_SOURCE_WITNESS_PUBLIC_KEY_B64',
    'ROSIE_ECONOMIC_HISTORY_CUSTODIAN_PUBLIC_KEY_B64']){
    const other=decode(env?.[name],32);
    if(!other||other.every((v,i)=>v===key[i]))return false;
  }
  return true;
};
async function ed25519(key,signature,transcript){
  try{const imported=await crypto.subtle.importKey('raw',key,{name:'Ed25519'},false,['verify']);
    return await crypto.subtle.verify('Ed25519',imported,signature,transcript);
  }catch{return false;}
}

export const RETENTION_FIELDS758=Object.freeze(['schema','booking_id','source_record_id','history_head_sha256',
  'object_version_id','object_checksum_sha256','provider_id','retention_mode','retain_until',
  'policy_reference','observed_at','expires_at','issuer_id','key_id']);
export const OWNER_MIGRATION_FIELDS758=Object.freeze(['schema','booking_id','source_record_id',
  'history_head_sha256','retention_receipt_sha256','audit_plan_sha256','decision',
  'owner_id','issued_at','expires_at','nonce','key_id']);
export const AUDIT_PLAN_CONTROLS758=Object.freeze([
  'private_unexposed_schema','row_level_security_default_deny','least_privilege_server_only_append',
  'no_update_delete_truncate','immutable_external_backup','unique_idempotency_request',
  'signed_owner_and_independent_witness','transactional_source_recheck',
  'append_read_after_write','retained_prior_heads','rollback_recovery_tests','independent_dba_and_security_review'
]);
export async function auditPlanHash758(){
  return digest('rosie-owner-audit-plan-v758:'+JSON.stringify(AUDIT_PLAN_CONTROLS758));
}
export function canonicalRetentionReceipt758(payload){
  if(!strict(payload,RETENTION_FIELDS758))throw Error('Retention receipt field set is not canonical.');
  return bytes('rosie-independent-retention-proof-v758:'+JSON.stringify(RETENTION_FIELDS758.map(x=>[x,payload[x]])));
}
export function canonicalOwnerMigration758(payload){
  if(!strict(payload,OWNER_MIGRATION_FIELDS758))throw Error('Migration owner review field set is not canonical.');
  return bytes('rosie-owner-migration-review-v758:'+JSON.stringify(OWNER_MIGRATION_FIELDS758.map(x=>[x,payload[x]])));
}
const retentionHold=(status,detail,more={})=>({retention_status:status,detail,
  independent_provider_receipt_authenticated:false,provider_live_readback_matched:false,
  storage_immutability_independently_audited:false,immutable_retention_verified:false,
  retention_receipt_sha256:null,...more});
const migrationHold=(status,detail,more={})=>({migration_review_status:status,detail,
  owner_migration_signature_authenticated:false,owner_migration_review_recorded:false,
  audit_migration_authorized:false,audit_migration_executed:false,...more});

/** The URL belongs to trusted server configuration; never accept a caller-provided URL. */
export function retentionReadbackURL758(env,record,head){
  if(!UUID.test(record?.booking_id||'')||!UUID.test(record?.source_record_id||'')||!HASH.test(head||''))return null;
  try{
    const base=new URL(env?.ROSIE_ECONOMIC_RETENTION_VERIFY_BASE_URL);
    if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash||base.port||
      base.pathname!=='/'||base.hostname==='localhost'||!base.hostname.includes('.'))return null;
    const url=new URL('/v1/economic-retention-proof',base);
    url.searchParams.set('booking_id',record.booking_id);
    url.searchParams.set('source_record_id',record.source_record_id);
    url.searchParams.set('history_head_sha256',head);
    return url.toString();
  }catch{return null;}
}

export async function readIndependentRetention758(env,record,head,fetcher=fetch){
  const url=retentionReadbackURL758(env,record,head);
  if(!url)return {status:'HOLD_INDEPENDENT_RETENTION_PROVIDER_NOT_CONFIGURED',envelope:null};
  try{
    const response=await fetcher(url,{method:'GET',headers:{Accept:'application/json','Cache-Control':'no-store'},redirect:'error'});
    if(!response.ok)return {status:'HOLD_RETENTION_PROVIDER_UNAVAILABLE',envelope:null};
    const raw=await response.text();
    if(raw.length>16000)return {status:'HOLD_RETENTION_PROOF_OVERSIZED',envelope:null};
    const envelope=JSON.parse(raw);
    if(!envelope||typeof envelope!=='object'||Array.isArray(envelope)||Object.keys(envelope).length!==2||
      !Object.hasOwn(envelope,'payload')||!Object.hasOwn(envelope,'signature_b64'))
      return {status:'HOLD_RETENTION_PROOF_FORMAT',envelope:null};
    return {status:'PROVIDER_READBACK_RECEIVED',envelope};
  }catch{return {status:'HOLD_RETENTION_PROVIDER_UNAVAILABLE',envelope:null};}
}

/** Signed provider readback is verifiable evidence, not proof a provider cannot delete stored versions. */
export async function verifyIndependentRetention758({env,record,head,provider,now=Date.now()}={}){
  if(provider?.status!=='PROVIDER_READBACK_RECEIVED')return retentionHold(provider?.status||'HOLD_RETENTION_NOT_READ','Independent provider readback is unavailable.');
  const payload=provider.envelope?.payload;
  let transcript;
  try{transcript=canonicalRetentionReceipt758(payload);}catch{return retentionHold('HOLD_RETENTION_PROOF_FORMAT','Provider proof has invalid canonical fields.');}
  if(payload.schema!=='rosie-independent-retention-proof-v758'||!UUID.test(payload.booking_id)||
    !UUID.test(payload.source_record_id)||!HASH.test(payload.history_head_sha256)||
    !HASH.test(payload.object_checksum_sha256)||!ID.test(payload.object_version_id)||
    !ID.test(payload.provider_id)||!ID.test(payload.issuer_id)||!ID.test(payload.policy_reference)||!ID.test(payload.key_id)||
    payload.booking_id!==record?.booking_id||payload.source_record_id!==record?.source_record_id||
    payload.history_head_sha256!==head||payload.object_checksum_sha256!==head||
    payload.retention_mode!=='COMPLIANCE'||!iso(payload.retain_until)||
    Date.parse(payload.retain_until)<now+86400000||!iso(payload.observed_at)||!iso(payload.expires_at)||
    Date.parse(payload.observed_at)>now+300000||Date.parse(payload.observed_at)<now-15*60000||
    Date.parse(payload.expires_at)<=now||Date.parse(payload.expires_at)>now+30*60000)
    return retentionHold('HOLD_RETENTION_PROOF_SCOPE','Storage identity, version, checksum, lock mode or attestation freshness conflicts.');
  const key=decode(env?.ROSIE_ECONOMIC_RETENTION_PROVIDER_PUBLIC_KEY_B64,32);
  const sig=decode(provider.envelope?.signature_b64,64);
  if(!uniqueKeys(key,env)||!sig||payload.key_id!==env?.ROSIE_ECONOMIC_RETENTION_PROVIDER_KEY_ID||
    [env?.ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID,env?.ROSIE_ECONOMIC_SOURCE_WITNESS_KEY_ID,
      env?.ROSIE_ECONOMIC_HISTORY_CUSTODIAN_KEY_ID].includes(payload.key_id))
    return retentionHold('HOLD_RETENTION_PROVIDER_INDEPENDENCE','Fourth independent server-pinned retention provider signing key is missing or reused.');
  if(!await ed25519(key,sig,transcript))return retentionHold('HOLD_RETENTION_SIGNATURE_INVALID','Independent provider signature failed.');
  return retentionHold('SIGNED_PROVIDER_LOCK_CLAIM_MATCHED_IMMUTABILITY_AUDIT_PENDING',
    'A fresh independently signed, version-specific provider compliance-lock claim matches the source history head. Independent enforcement and prior-version recovery remain unaudited.',
    {independent_provider_receipt_authenticated:true,provider_live_readback_matched:true,
      retention_receipt_sha256:await sha256Receipt754(transcript),provider_id:payload.provider_id,
      object_version_id:payload.object_version_id,retain_until:payload.retain_until});
}

/** Domain-separated signed owner review; review request is not migration execution authority. */
export async function verifyOwnerAuditMigrationReview758({envelope,env,record,history_head,retention,now=Date.now()}={}){
  const payload=envelope?.payload;
  let transcript;
  try{transcript=canonicalOwnerMigration758(payload);}catch{return migrationHold('HOLD_MIGRATION_REVIEW_FORMAT','Owner migration review is not canonical.');}
  const plan=await auditPlanHash758();
  if(payload.schema!=='rosie-owner-migration-review-v758'||!UUID.test(payload.booking_id)||
    !UUID.test(payload.source_record_id)||!HASH.test(payload.history_head_sha256)||
    !HASH.test(payload.retention_receipt_sha256)||!HASH.test(payload.audit_plan_sha256)||
    payload.booking_id!==record?.booking_id||payload.source_record_id!==record?.source_record_id||
    payload.history_head_sha256!==history_head||payload.audit_plan_sha256!==plan||
    payload.retention_receipt_sha256!==retention?.retention_receipt_sha256||
    !retention?.independent_provider_receipt_authenticated||
    payload.decision!=='request_independent_migration_review'||!ID.test(payload.owner_id)||!ID.test(payload.key_id)||
    !/^[0-9a-f]{32,64}$/i.test(payload.nonce)||!iso(payload.issued_at)||!iso(payload.expires_at)||
    Date.parse(payload.issued_at)>now+300000||Date.parse(payload.issued_at)<now-7*86400000||
    Date.parse(payload.expires_at)<=now||Date.parse(payload.expires_at)-Date.parse(payload.issued_at)>48*3600000)
    return migrationHold('HOLD_MIGRATION_REVIEW_SCOPE','Owner request must bind the exact plan, retention receipt and history head and remain fresh.');
  const key=decode(env?.ROSIE_ECONOMIC_OWNER_RECEIPT_PUBLIC_KEY_B64,32),sig=decode(envelope?.signature_b64,64);
  if(!key||!sig||payload.key_id!==env?.ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID)
    return migrationHold('HOLD_MIGRATION_OWNER_KEY','The independently pinned owner review key is unavailable.');
  if(!await ed25519(key,sig,transcript))return migrationHold('HOLD_MIGRATION_OWNER_SIGNATURE_INVALID','Migration owner review signature failed.');
  return migrationHold('SIGNED_OWNER_DBA_REVIEW_REQUEST_ONLY',
    'The owner requested independent DBA/security migration review. No schema migration or audit write has been authorized or executed.',
    {owner_migration_signature_authenticated:true,audit_plan_sha256:plan,
      migration_review_receipt_sha256:await sha256Receipt754(transcript)});
}

export async function reconcileClosure758({prior,retention,migration,reviewed_at=new Date().toISOString()}={}){
  const hold=[];
  if(prior?.history_verification?.history_chain_integrity_verified!==true||
    prior?.history_verification?.independent_history_head_signature_verified!==true)
    hold.push({code:'HISTORY_CHAIN_OR_CUSTODIAN_UNVERIFIED',action:'Resolve the independently signed, source-owned Build 757 revision history.'});
  if(!retention?.independent_provider_receipt_authenticated)
    hold.push({code:'INDEPENDENT_RETENTION_PROOF_MISSING',action:'Obtain a fresh version-specific provider readback signed by the distinct fourth custodian.'});
  hold.push({code:'IMMUTABLE_RETENTION_ENFORCEMENT_UNAUDITED',action:'Independently verify lock enforcement, retention policy/grants, old-version recovery and custodian-controlled storage.'});
  if(!migration?.owner_migration_signature_authenticated)
    hold.push({code:'OWNER_MIGRATION_REVIEW_NOT_AUTHENTICATED',action:'Obtain a separately signed owner request bound to the audit-plan hash and retention evidence.'});
  hold.push({code:'DBA_SECURITY_MIGRATION_AUTHORIZATION_MISSING',action:'Obtain distinct DBA/security approval, schema/RLS advisors, restore tests and explicit migration execution authorization.'});
  hold.push({code:'CLOSURE_EVIDENCE_PERSISTENCE_NOT_AUTHORIZED',action:'Only a separately authorized transaction may append a witnessed owner decision and recheck owning business records.'});
  const result={ok:true,build:758,read_only:true,retention_review:retention||retentionHold('HOLD_RETENTION_NOT_RUN','No provider readback.'),
    owner_migration_review:migration||migrationHold('HOLD_OWNER_REVIEW_NOT_RUN','No owner review.'),
    audit_plan_sha256:await auditPlanHash758(),owner_audit_design_status:'DESIGN_ONLY_NOT_APPLIED',
    immutable_retention_verified:false,audit_migration_executed:false,audit_migration_authorized:false,
    owner_closure_audit_persisted:false,closure_recorded:false,closure_authorized:false,
    closure_allowed:false,automatic_business_write:false,closure_reconciliation_status:'HOLD_CLOSURE_AUTHORIZATION',
    blocking_count:hold.length,follow_ups:hold,reviewed_at};
  result.reconciliation_sha256=await digest(JSON.stringify({schema:'rosie-economic-closure-reconciliation-v758',
    prior:prior?.preflight_sha256||null,retention:retention?.retention_receipt_sha256||null,
    migration:migration?.migration_review_receipt_sha256||null,hold,reviewed_at}));
  return result;
}
