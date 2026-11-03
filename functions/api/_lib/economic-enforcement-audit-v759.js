import {sha256Receipt754} from './owner-receipt-verification-v754.js';
import {auditPlanHash758} from './economic-retention-review-v758.js';

const UUID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const HASH=/^[a-f0-9]{64}$/i;
const ID=/^[A-Za-z0-9][A-Za-z0-9._:/-]{5,119}$/;
const bytes=value=>new TextEncoder().encode(value);
const digest=async value=>sha256Receipt754(bytes(value));
const iso=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(value)&&Number.isFinite(Date.parse(value));
const exact=(value,fields)=>value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).length===fields.length&&
  fields.every(field=>Object.hasOwn(value,field)&&typeof value[field]==='string');
const decode=(value,length)=>{
  if(typeof value!=='string'||value.length>200||value.length%4||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))return null;
  try{const b=Uint8Array.from(atob(value),c=>c.charCodeAt(0));return b.length===length?b:null;}catch{return null;}
};
const KEYS759=Object.freeze({
  storage:['ROSIE_ECONOMIC_STORAGE_AUDITOR_PUBLIC_KEY_B64','ROSIE_ECONOMIC_STORAGE_AUDITOR_KEY_ID'],
  dba:['ROSIE_ECONOMIC_DBA_REVIEW_PUBLIC_KEY_B64','ROSIE_ECONOMIC_DBA_REVIEW_KEY_ID'],
  security:['ROSIE_ECONOMIC_SECURITY_REVIEW_PUBLIC_KEY_B64','ROSIE_ECONOMIC_SECURITY_REVIEW_KEY_ID']
});
const PRIOR_KEYS759=Object.freeze([
  ['ROSIE_ECONOMIC_OWNER_RECEIPT_PUBLIC_KEY_B64','ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID'],
  ['ROSIE_ECONOMIC_SOURCE_WITNESS_PUBLIC_KEY_B64','ROSIE_ECONOMIC_SOURCE_WITNESS_KEY_ID'],
  ['ROSIE_ECONOMIC_HISTORY_CUSTODIAN_PUBLIC_KEY_B64','ROSIE_ECONOMIC_HISTORY_CUSTODIAN_KEY_ID'],
  ['ROSIE_ECONOMIC_RETENTION_PROVIDER_PUBLIC_KEY_B64','ROSIE_ECONOMIC_RETENTION_PROVIDER_KEY_ID']
]);
const allKeys=Object.freeze([...PRIOR_KEYS759,...Object.values(KEYS759)]);
const keyFor=(role,env,claimedId)=>{
  const spec=KEYS759[role],key=decode(env?.[spec[0]],32);
  if(!key||!ID.test(claimedId||'')||claimedId!==env?.[spec[1]])return null;
  const keyIds=new Set();
  for(const [keyName,idName] of allKeys){
    const candidate=decode(env?.[keyName],32),id=env?.[idName];
    if(!candidate||!ID.test(id||'')||keyIds.has(id))return null;
    keyIds.add(id);
    if(keyName!==spec[0]&&candidate.every((v,i)=>v===key[i]))return null;
  }
  return key;
};
const verifySignature=async(key,envelope,transcript)=>{
  const sig=decode(envelope?.signature_b64,64);
  if(!key||!sig||Object.keys(envelope).length!==2)return false;
  try{const imported=await crypto.subtle.importKey('raw',key,{name:'Ed25519'},false,['verify']);
    return await crypto.subtle.verify('Ed25519',imported,sig,transcript);
  }catch{return false;}
};

export const ENFORCEMENT_FIELDS759=Object.freeze([
  'schema','booking_id','source_record_id','history_head_sha256','retention_receipt_sha256',
  'object_version_id','object_checksum_sha256','provider_id','policy_reference','retention_mode',
  'audit_scope','audit_environment_id','overwrite_denial','delete_denial','retention_bypass_denial',
  'prior_version_recovered_sha256','audited_at','expires_at','auditor_id','key_id'
]);
export const DBA_FIELDS759=Object.freeze([
  'schema','booking_id','source_record_id','history_head_sha256','retention_receipt_sha256',
  'enforcement_receipt_sha256','audit_plan_sha256','nonprod_environment_id','decision',
  'reviewer_id','issued_at','expires_at','nonce','key_id'
]);
export const SECURITY_FIELDS759=Object.freeze([
  'schema','booking_id','source_record_id','history_head_sha256','retention_receipt_sha256',
  'enforcement_receipt_sha256','audit_plan_sha256','nonprod_environment_id','dba_receipt_sha256',
  'decision','reviewer_id','issued_at','expires_at','nonce','key_id'
]);
const canonical=(value,fields,prefix)=>{
  if(!exact(value,fields))throw Error('Noncanonical independent audit envelope.');
  return bytes(prefix+JSON.stringify(fields.map(key=>[key,value[key]])));
};
export const canonicalEnforcement759=value=>canonical(value,ENFORCEMENT_FIELDS759,'rosie-storage-enforcement-v759:');
export const canonicalDba759=value=>canonical(value,DBA_FIELDS759,'rosie-dba-trial-review-v759:');
export const canonicalSecurity759=value=>canonical(value,SECURITY_FIELDS759,'rosie-security-trial-review-v759:');
const holdAudit=(status,detail,more={})=>({status,detail,independent_storage_audit_authenticated:false,
  enforcement_claim_scope_matched:false,storage_enforcement_directly_reproduced:false,
  storage_immutability_independently_audited:false,enforcement_receipt_sha256:null,...more});
const holdApproval=(role,status,detail,more={})=>({role,status,detail,signature_authenticated:false,
  permission_to_run_migration:false,receipt_sha256:null,...more});
const fresh=(issued,expires,now,maxAge=15*60000,maxDuration=30*60000)=>
  iso(issued)&&iso(expires)&&Date.parse(issued)<=now+300000&&Date.parse(issued)>=now-maxAge&&
  Date.parse(expires)>now&&Date.parse(expires)-Date.parse(issued)<=maxDuration;

/** Only a fixed server-owned HTTPS origin may be contacted; never use a posted address. */
export function enforcementReadbackURL759(env,record,historyHead,retentionHash){
  if(!UUID.test(record?.booking_id||'')||!UUID.test(record?.source_record_id||'')||
    !HASH.test(historyHead||'')||!HASH.test(retentionHash||''))return null;
  try{
    const base=new URL(env?.ROSIE_ECONOMIC_STORAGE_AUDIT_BASE_URL);
    if(base.protocol!=='https:'||base.username||base.password||base.port||base.search||base.hash||
      base.pathname!=='/'||!base.hostname.includes('.')||base.hostname==='localhost')return null;
    const url=new URL('/v1/economic-storage-enforcement-audit',base);
    for(const [key,value] of [['booking_id',record.booking_id],['source_record_id',record.source_record_id],
      ['history_head_sha256',historyHead],['retention_receipt_sha256',retentionHash]])url.searchParams.set(key,value);
    return url.toString();
  }catch{return null;}
}
export async function readIndependentEnforcement759(env,record,head,retentionHash,fetcher=fetch){
  const url=enforcementReadbackURL759(env,record,head,retentionHash);
  if(!url)return {status:'HOLD_STORAGE_AUDIT_PROVIDER_UNCONFIGURED'};
  try{
    const response=await fetcher(url,{method:'GET',headers:{Accept:'application/json','Cache-Control':'no-store'},redirect:'error'});
    if(!response.ok)return {status:'HOLD_STORAGE_AUDIT_PROVIDER_UNAVAILABLE'};
    const raw=await response.text();
    if(raw.length>18000)return {status:'HOLD_STORAGE_AUDIT_OVERSIZED'};
    const envelope=JSON.parse(raw);
    if(!envelope||Array.isArray(envelope)||typeof envelope!=='object'||Object.keys(envelope).length!==2||
      !Object.hasOwn(envelope,'payload')||!Object.hasOwn(envelope,'signature_b64'))
      return {status:'HOLD_STORAGE_AUDIT_FORMAT'};
    return {status:'SIGNED_AUDIT_READBACK_RECEIVED',envelope};
  }catch{return {status:'HOLD_STORAGE_AUDIT_PROVIDER_UNAVAILABLE'};}
}
export async function verifyEnforcement759({env,record,historyHead,retention,readback,now=Date.now()}={}){
  if(readback?.status!=='SIGNED_AUDIT_READBACK_RECEIVED')return holdAudit(readback?.status||'HOLD_STORAGE_AUDIT_MISSING','No independent storage audit was read.');
  const payload=readback.envelope?.payload;
  let transcript;
  try{transcript=canonicalEnforcement759(payload);}catch{return holdAudit('HOLD_STORAGE_AUDIT_FORMAT','Audit fields are not canonical.');}
  if(payload.schema!=='rosie-storage-enforcement-v759'||!UUID.test(payload.booking_id)||!UUID.test(payload.source_record_id)||
    payload.booking_id!==record?.booking_id||payload.source_record_id!==record?.source_record_id||
    !HASH.test(payload.history_head_sha256)||payload.history_head_sha256!==historyHead||
    !HASH.test(payload.retention_receipt_sha256)||payload.retention_receipt_sha256!==retention?.retention_receipt_sha256||
    !retention?.independent_provider_receipt_authenticated||
    payload.object_version_id!==retention?.object_version_id||payload.provider_id!==retention?.provider_id||
    payload.object_checksum_sha256!==historyHead||!ID.test(payload.policy_reference)||
    !ID.test(payload.audit_environment_id)||!ID.test(payload.auditor_id)||!ID.test(payload.key_id)||
    payload.retention_mode!=='COMPLIANCE'||payload.audit_scope!=='NONPRODUCTION_ISOLATED'||
    payload.overwrite_denial!=='DENIED'||payload.delete_denial!=='DENIED'||
    payload.retention_bypass_denial!=='DENIED'||payload.prior_version_recovered_sha256!==historyHead||
    !fresh(payload.audited_at,payload.expires_at,now))
    return holdAudit('HOLD_STORAGE_AUDIT_SCOPE','Signed test outcomes, object identity, readback freshness, or restored version differ from the source.');
  const key=keyFor('storage',env,payload.key_id);
  if(!key)return holdAudit('HOLD_STORAGE_AUDITOR_INDEPENDENCE','A distinct fifth pinned storage-auditor key is required.');
  if(!await verifySignature(key,readback.envelope,transcript))return holdAudit('HOLD_STORAGE_AUDIT_SIGNATURE_INVALID','Storage auditor signature mismatch.');
  return holdAudit('SIGNED_NONPROD_STORAGE_ENFORCEMENT_CLAIM_MATCHED',
    'An independent auditor signed an isolated nonproduction denial/recovery report. The live provider controls were not exercised by this app.',
    {independent_storage_audit_authenticated:true,enforcement_claim_scope_matched:true,
      enforcement_receipt_sha256:await sha256Receipt754(transcript),audit_environment_id:payload.audit_environment_id,
      storage_immutability_independently_audited:true});
}
export function nonprodEnvironment759(env){
  try{
    const prod=new URL(env?.SUPABASE_URL),trial=new URL(env?.ROSIE_ECONOMIC_NONPROD_SUPABASE_URL);
    const valid=url=>url.protocol==='https:'&&!url.username&&!url.password&&!url.search&&!url.hash&&
      !url.port&&url.pathname==='/'&&url.hostname.includes('.')&&url.hostname!=='localhost';
    const environmentId=env?.ROSIE_ECONOMIC_NONPROD_ENVIRONMENT_ID;
    if(!valid(prod)||!valid(trial)||prod.origin===trial.origin||!ID.test(environmentId||''))
      return {configured:false,status:'HOLD_DISTINCT_NONPROD_ENVIRONMENT_UNVERIFIED'};
    return {configured:true,status:'DISTINCT_NONPROD_TARGET_CONFIGURATION_MATCHED',nonprod_environment_id:environmentId};
  }catch{return {configured:false,status:'HOLD_DISTINCT_NONPROD_ENVIRONMENT_UNVERIFIED'};}
}
export async function verifyTrialApproval759({role,envelope,env,record,historyHead,retention,enforcement,
  environment,dba,now=Date.now()}={}){
  if(!['dba','security'].includes(role))return holdApproval(role,'HOLD_REVIEW_ROLE','Review role invalid.');
  const payload=envelope?.payload,fields=role==='dba'?DBA_FIELDS759:SECURITY_FIELDS759;
  let transcript;
  try{transcript=role==='dba'?canonicalDba759(payload):canonicalSecurity759(payload);}
  catch{return holdApproval(role,'HOLD_APPROVAL_FORMAT','Review signature envelope is not canonical.');}
  const plan=await auditPlanHash758();
  if(payload.schema!==(role==='dba'?'rosie-dba-trial-review-v759':'rosie-security-trial-review-v759')||
    !UUID.test(payload.booking_id)||payload.booking_id!==record?.booking_id||
    !UUID.test(payload.source_record_id)||payload.source_record_id!==record?.source_record_id||
    payload.history_head_sha256!==historyHead||!HASH.test(payload.history_head_sha256)||
    payload.retention_receipt_sha256!==retention?.retention_receipt_sha256||
    !retention?.independent_provider_receipt_authenticated||
    payload.enforcement_receipt_sha256!==enforcement?.enforcement_receipt_sha256||
    !enforcement?.independent_storage_audit_authenticated||payload.audit_plan_sha256!==plan||
    !environment?.configured||payload.nonprod_environment_id!==environment.nonprod_environment_id||
    payload.decision!=='approve_nonproduction_trial_review_only'||!ID.test(payload.reviewer_id)||
    !ID.test(payload.key_id)||!/^[a-f0-9]{32,64}$/i.test(payload.nonce)||
    !fresh(payload.issued_at,payload.expires_at,now,7*86400000,48*3600000)||
    (role==='security'&&(!dba?.signature_authenticated||payload.dba_receipt_sha256!==dba.receipt_sha256||
      Date.parse(payload.issued_at)<Date.parse(dba.issued_at))))
    return holdApproval(role,'HOLD_APPROVAL_SCOPE','Signed review must bind exact source, storage audit, plan, nonproduction target, and prior DBA receipt.');
  const key=keyFor(role,env,payload.key_id);
  if(!key)return holdApproval(role,'HOLD_REVIEW_KEY_INDEPENDENCE','Distinct server-pinned DBA and security keys are required.');
  if(!await verifySignature(key,envelope,transcript))
    return holdApproval(role,'HOLD_APPROVAL_SIGNATURE_INVALID','Review signature invalid.');
  return holdApproval(role,'SIGNED_NONPRODUCTION_REVIEW_ONLY',
    'Independently authenticated '+role.toUpperCase()+' review of a proposed isolated trial; no SQL execution authority.',
    {signature_authenticated:true,receipt_sha256:await sha256Receipt754(transcript),issued_at:payload.issued_at,
      reviewer_id:payload.reviewer_id});
}
export async function reconcileReadiness759({prior,enforcement,dba,security,environment,reviewed_at=new Date().toISOString()}={}){
  const blockers=[];
  if(!prior?.retention_review?.independent_provider_receipt_authenticated)
    blockers.push({code:'RETENTION_READBACK_MISSING',action:'Read a fresh fourth-key provider retention claim.'});
  if(!prior?.owner_migration_review?.owner_migration_signature_authenticated)
    blockers.push({code:'OWNER_REVIEW_REQUEST_UNVERIFIED',action:'Authenticate the distinct owner migration review request.'});
  if(!enforcement?.independent_storage_audit_authenticated)
    blockers.push({code:'STORAGE_ENFORCEMENT_AUDIT_MISSING',action:'Obtain an independently signed isolated nonproduction denial/recovery report.'});
  if(!environment?.configured)
    blockers.push({code:'NONPRODUCTION_TARGET_UNVERIFIED',action:'Configure a distinct HTTPS nonproduction target and environment ID; do not submit credentials.'});
  if(!dba?.signature_authenticated)
    blockers.push({code:'DBA_APPROVAL_MISSING',action:'Obtain a separate DBA review signed against the exact plan and audit receipts.'});
  if(!security?.signature_authenticated)
    blockers.push({code:'SECURITY_APPROVAL_MISSING',action:'Obtain security review signed after the authenticated DBA receipt.'});
  blockers.push({code:'SEPARATE_TRIAL_EXECUTION_AUTHORIZATION_REQUIRED',
    action:'Authorize a specific isolated trial, migration script, rollback plan and database operator in a subsequent build.'});
  blockers.push({code:'LIVE_ENFORCEMENT_AND_OWNER_CLOSURE_REMAIN_UNVERIFIED',
    action:'Independently verify production retention, restore, live business readback and separately authorized append-only owner decision.'});
  const reviewReady=blockers.length===2;
  const result={ok:true,build:759,read_only:true,
    history_head_sha256:prior?.history_head_sha256||null,retention_review:prior?.retention_review||null,
    owner_migration_review:prior?.owner_migration_review||null,storage_audit:enforcement||null,
    dba_review:dba||null,security_review:security||null,nonprod_target:environment||null,
    trial_readiness_status:reviewReady?'READY_FOR_SEPARATE_NONPROD_TRIAL_AUTHORIZATION':'HOLD_NONPROD_TRIAL_READINESS',
    independent_review_chain_authenticated:reviewReady,storage_enforcement_directly_reproduced:false,
    migration_authorized:false,migration_executed:false,owner_closure_audit_persisted:false,
    closure_allowed:false,automatic_business_write:false,
    closure_reconciliation_status:'HOLD_CLOSURE_AUTHORIZATION',blocking_count:blockers.length,
    follow_ups:blockers,reviewed_at};
  result.packet_sha256=await digest(JSON.stringify({schema:'rosie-independent-trial-preflight-v759',
    plan:await auditPlanHash758(),history:result.history_head_sha256,retention:result.retention_review?.retention_receipt_sha256,
    enforcement:enforcement?.enforcement_receipt_sha256,dba:dba?.receipt_sha256,security:security?.receipt_sha256,
    target:environment?.nonprod_environment_id||null,blockers,reviewed_at}));
  return result;
}
