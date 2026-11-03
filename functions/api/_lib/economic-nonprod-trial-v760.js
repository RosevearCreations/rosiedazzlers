import {sha256Receipt754} from './owner-receipt-verification-v754.js';
import {auditPlanHash758} from './economic-retention-review-v758.js';

const UUID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const HASH=/^[a-f0-9]{64}$/i;
const ID=/^[A-Za-z0-9][A-Za-z0-9._:/-]{5,119}$/;
const text=value=>new TextEncoder().encode(value);
const digest=async value=>sha256Receipt754(text(value));
const iso=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(value)&&Number.isFinite(Date.parse(value));
const validTime=(issued,expires,now,maxAge=15*60000,maxSpan=30*60000)=>
  iso(issued)&&iso(expires)&&Date.parse(issued)<=now+300000&&Date.parse(issued)>=now-maxAge&&
  Date.parse(expires)>now&&Date.parse(expires)-Date.parse(issued)<=maxSpan;
const exact=(p,fields)=>p&&typeof p==='object'&&!Array.isArray(p)&&Object.keys(p).length===fields.length&&
  fields.every(key=>Object.hasOwn(p,key)&&typeof p[key]==='string');
const decode=(value,len)=>{
  if(typeof value!=='string'||value.length>200||value.length%4||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))return null;
  try{const b=Uint8Array.from(atob(value),c=>c.charCodeAt(0));return b.length===len?b:null;}catch{return null;}
};
const KEY_NAMES=Object.freeze([
  ['ROSIE_ECONOMIC_OWNER_RECEIPT_PUBLIC_KEY_B64','ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID'],
  ['ROSIE_ECONOMIC_SOURCE_WITNESS_PUBLIC_KEY_B64','ROSIE_ECONOMIC_SOURCE_WITNESS_KEY_ID'],
  ['ROSIE_ECONOMIC_HISTORY_CUSTODIAN_PUBLIC_KEY_B64','ROSIE_ECONOMIC_HISTORY_CUSTODIAN_KEY_ID'],
  ['ROSIE_ECONOMIC_RETENTION_PROVIDER_PUBLIC_KEY_B64','ROSIE_ECONOMIC_RETENTION_PROVIDER_KEY_ID'],
  ['ROSIE_ECONOMIC_STORAGE_AUDITOR_PUBLIC_KEY_B64','ROSIE_ECONOMIC_STORAGE_AUDITOR_KEY_ID'],
  ['ROSIE_ECONOMIC_DBA_REVIEW_PUBLIC_KEY_B64','ROSIE_ECONOMIC_DBA_REVIEW_KEY_ID'],
  ['ROSIE_ECONOMIC_SECURITY_REVIEW_PUBLIC_KEY_B64','ROSIE_ECONOMIC_SECURITY_REVIEW_KEY_ID'],
  ['ROSIE_ECONOMIC_ISOLATION_AUDITOR_PUBLIC_KEY_B64','ROSIE_ECONOMIC_ISOLATION_AUDITOR_KEY_ID'],
  ['ROSIE_ECONOMIC_ROLLBACK_WITNESS_PUBLIC_KEY_B64','ROSIE_ECONOMIC_ROLLBACK_WITNESS_KEY_ID']
]);
const signingKey=(env,index,keyId)=>{
  const [name,idName]=KEY_NAMES[index],key=decode(env?.[name],32);
  if(!key||env?.[idName]!==keyId||!ID.test(keyId||''))return null;
  const ids=new Set(),material=new Set();
  for(const [n,i] of KEY_NAMES){
    const candidate=decode(env?.[n],32);
    if(!candidate||!ID.test(env?.[i]||'')||ids.has(env[i]))return null;
    ids.add(env[i]);const fingerprint=Array.from(candidate).join(',');
    if(material.has(fingerprint))return null;
    material.add(fingerprint);
  }
  return key;
};
const verify=async(envelope,bytes,key)=>{
  if(!key||!envelope||Array.isArray(envelope)||Object.keys(envelope).length!==2||
    !Object.hasOwn(envelope,'payload')||!Object.hasOwn(envelope,'signature_b64'))return false;
  const sig=decode(envelope.signature_b64,64);if(!sig)return false;
  try{const k=await crypto.subtle.importKey('raw',key,{name:'Ed25519'},false,['verify']);
    return await crypto.subtle.verify('Ed25519',k,sig,bytes);}catch{return false;}
};

export const ISOLATION_FIELDS760=Object.freeze([
  'schema','booking_id','source_record_id','history_head_sha256','nonprod_environment_id',
  'production_project_ref','nonprod_project_ref','production_write_probe','credential_separation',
  'outbound_customer_events','synthetic_data_only','migration_grants_restricted',
  'observed_at','expires_at','auditor_id','key_id'
]);
export const ROLLBACK_FIELDS760=Object.freeze([
  'schema','booking_id','source_record_id','history_head_sha256','nonprod_environment_id',
  'nonprod_project_ref','migration_artifact_sha256','rollback_artifact_sha256','backup_snapshot_sha256',
  'restore_snapshot_sha256','restore_result','rollback_validation','restore_rto_seconds',
  'observed_at','expires_at','witness_id','key_id'
]);
export const TRIAL_AUTH_FIELDS760=Object.freeze([
  'schema','booking_id','source_record_id','history_head_sha256','retention_receipt_sha256',
  'enforcement_receipt_sha256','dba_receipt_sha256','security_receipt_sha256',
  'isolation_receipt_sha256','rollback_receipt_sha256','audit_plan_sha256','nonprod_environment_id',
  'nonprod_project_ref','migration_artifact_sha256','rollback_artifact_sha256','backup_snapshot_sha256',
  'trial_id','decision','owner_id','issued_at','expires_at','nonce','key_id'
]);
const canonical=(value,fields,domain)=>{
  if(!exact(value,fields))throw Error('Evidence is not canonical.');
  return text(domain+JSON.stringify(fields.map(field=>[field,value[field]])));
};
export const canonicalIsolation760=value=>canonical(value,ISOLATION_FIELDS760,'rosie-nonprod-isolation-audit-v760:');
export const canonicalRollback760=value=>canonical(value,ROLLBACK_FIELDS760,'rosie-nonprod-rollback-witness-v760:');
export const canonicalTrialAuth760=value=>canonical(value,TRIAL_AUTH_FIELDS760,'rosie-owner-nonprod-trial-handoff-v760:');
const hold=(status,detail,more={})=>({status,detail,signature_authenticated:false,receipt_sha256:null,...more});

/** Ref must be a separate canonical Supabase project, not merely a different URL path. */
export function nonprodProjectIdentity760(env){
  try{
    const prod=new URL(env?.SUPABASE_URL),trial=new URL(env?.ROSIE_ECONOMIC_NONPROD_SUPABASE_URL);
    const ref=url=>{
      if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.port||
        url.pathname!=='/'||!/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname))return null;
      return url.hostname.slice(0,-'.supabase.co'.length);
    };
    const production_project_ref=ref(prod),nonprod_project_ref=ref(trial);
    if(!production_project_ref||!nonprod_project_ref||production_project_ref===nonprod_project_ref||
      !ID.test(env?.ROSIE_ECONOMIC_NONPROD_ENVIRONMENT_ID||''))
      return {configured:false,status:'HOLD_PROJECT_IDENTITY_NOT_ISOLATED'};
    return {configured:true,status:'DISTINCT_SUPABASE_PROJECT_REFS_CONFIGURED',
      production_project_ref,nonprod_project_ref,
      nonprod_environment_id:env.ROSIE_ECONOMIC_NONPROD_ENVIRONMENT_ID};
  }catch{return {configured:false,status:'HOLD_PROJECT_IDENTITY_NOT_ISOLATED'};}
}
/** Server-configured, fixed HTTPS auditor origins; request input supplies only scoped identifiers. */
export function auditorURL760(env,kind,record,head,identity,artifacts){
  const suffix=kind==='isolation'?'isolation':'rollback';
  const setting=kind==='isolation'?'ROSIE_ECONOMIC_ISOLATION_AUDIT_BASE_URL':'ROSIE_ECONOMIC_ROLLBACK_VERIFY_BASE_URL';
  if(!['isolation','rollback'].includes(kind)||!UUID.test(record?.booking_id||'')||
    !UUID.test(record?.source_record_id||'')||!HASH.test(head||'')||!identity?.configured)return null;
  try{
    const origin=new URL(env?.[setting]);
    if(origin.protocol!=='https:'||origin.username||origin.password||origin.search||origin.hash||
      origin.port||origin.pathname!=='/'||!origin.hostname.includes('.')||origin.hostname==='localhost')return null;
    const result=new URL('/v1/economic-nonprod-'+suffix+'-review',origin);
    for(const [key,value] of [['booking_id',record.booking_id],['source_record_id',record.source_record_id],
      ['history_head_sha256',head],['nonprod_environment_id',identity.nonprod_environment_id],
      ['nonprod_project_ref',identity.nonprod_project_ref]])result.searchParams.set(key,value);
    if(kind==='rollback'){
      if(!HASH.test(artifacts?.migration_artifact_sha256||'')||
        !HASH.test(artifacts?.rollback_artifact_sha256||'')||!HASH.test(artifacts?.backup_snapshot_sha256||''))return null;
      for(const key of ['migration_artifact_sha256','rollback_artifact_sha256','backup_snapshot_sha256'])
        result.searchParams.set(key,artifacts[key]);
    }
    return result.toString();
  }catch{return null;}
}
export async function readAuditor760(env,kind,record,head,identity,artifacts,fetcher=fetch){
  const url=auditorURL760(env,kind,record,head,identity,artifacts);
  if(!url)return {status:'HOLD_INDEPENDENT_'+kind.toUpperCase()+'_PROVIDER_NOT_CONFIGURED'};
  try{
    const response=await fetcher(url,{method:'GET',headers:{Accept:'application/json','Cache-Control':'no-store'},redirect:'error'});
    if(!response.ok)return {status:'HOLD_INDEPENDENT_'+kind.toUpperCase()+'_PROVIDER_UNAVAILABLE'};
    const raw=await response.text();
    if(raw.length>18000)return {status:'HOLD_INDEPENDENT_'+kind.toUpperCase()+'_OVERSIZED'};
    const envelope=JSON.parse(raw);
    if(!envelope||Array.isArray(envelope)||typeof envelope!=='object'||Object.keys(envelope).length!==2||
      !Object.hasOwn(envelope,'payload')||!Object.hasOwn(envelope,'signature_b64'))
      return {status:'HOLD_INDEPENDENT_'+kind.toUpperCase()+'_FORMAT'};
    return {status:'SIGNED_'+kind.toUpperCase()+'_AUDITOR_READBACK',envelope};
  }catch{return {status:'HOLD_INDEPENDENT_'+kind.toUpperCase()+'_PROVIDER_UNAVAILABLE'};}
}
export async function verifyIsolation760({env,record,head,identity,readback,now=Date.now()}={}){
  if(readback?.status!=='SIGNED_ISOLATION_AUDITOR_READBACK')
    return hold(readback?.status||'HOLD_ISOLATION_EVIDENCE_MISSING','Independent isolation report unavailable.');
  const p=readback.envelope?.payload;let transcript;
  try{transcript=canonicalIsolation760(p);}catch{return hold('HOLD_ISOLATION_FORMAT','Noncanonical isolation report.');}
  if(p.schema!=='rosie-nonprod-isolation-audit-v760'||!identity?.configured||
    p.booking_id!==record?.booking_id||p.source_record_id!==record?.source_record_id||
    p.history_head_sha256!==head||!HASH.test(p.history_head_sha256)||
    p.nonprod_environment_id!==identity.nonprod_environment_id||
    p.production_project_ref!==identity.production_project_ref||
    p.nonprod_project_ref!==identity.nonprod_project_ref||
    p.production_write_probe!=='DENIED'||p.credential_separation!=='CONFIRMED'||
    p.outbound_customer_events!=='DISABLED'||p.synthetic_data_only!=='CONFIRMED'||
    p.migration_grants_restricted!=='CONFIRMED'||!ID.test(p.auditor_id)||!ID.test(p.key_id)||
    !validTime(p.observed_at,p.expires_at,now))
    return hold('HOLD_ISOLATION_SCOPE','Project IDs, denied production probe, synthetic data, grants or freshness conflict.');
  const key=signingKey(env,7,p.key_id);
  if(!key)return hold('HOLD_ISOLATION_KEY_INDEPENDENCE','An eighth distinct pinned isolation-auditor key is required.');
  if(!await verify(readback.envelope,transcript,key))return hold('HOLD_ISOLATION_SIGNATURE_INVALID','Isolation auditor signature invalid.');
  return hold('INDEPENDENT_ISOLATION_CLAIM_AUTHENTICATED',
    'An independent signer reports isolated project identity and denied production writes; this app did not exercise database grants.',
    {signature_authenticated:true,receipt_sha256:await sha256Receipt754(transcript),nonprod_project_ref:p.nonprod_project_ref,
      observed_at:p.observed_at,isolation_directly_reproduced:false});
}
export async function verifyRollback760({env,record,head,identity,artifacts,readback,now=Date.now()}={}){
  if(readback?.status!=='SIGNED_ROLLBACK_AUDITOR_READBACK')
    return hold(readback?.status||'HOLD_ROLLBACK_EVIDENCE_MISSING','Independent rollback restore evidence unavailable.');
  const p=readback.envelope?.payload;let transcript;
  try{transcript=canonicalRollback760(p);}catch{return hold('HOLD_ROLLBACK_FORMAT','Noncanonical rollback receipt.');}
  const rto=Number(p.restore_rto_seconds);
  if(p.schema!=='rosie-nonprod-rollback-witness-v760'||!identity?.configured||
    p.booking_id!==record?.booking_id||p.source_record_id!==record?.source_record_id||
    p.history_head_sha256!==head||p.nonprod_environment_id!==identity.nonprod_environment_id||
    p.nonprod_project_ref!==identity.nonprod_project_ref||
    !HASH.test(p.migration_artifact_sha256)||p.migration_artifact_sha256!==artifacts?.migration_artifact_sha256||
    !HASH.test(p.rollback_artifact_sha256)||p.rollback_artifact_sha256!==artifacts?.rollback_artifact_sha256||
    !HASH.test(p.backup_snapshot_sha256)||p.backup_snapshot_sha256!==artifacts?.backup_snapshot_sha256||
    p.restore_snapshot_sha256!==artifacts?.backup_snapshot_sha256||
    p.restore_result!=='PASSED_NONPRODUCTION'||p.rollback_validation!=='PASSED_NONPRODUCTION'||
    !/^\d{1,6}$/.test(p.restore_rto_seconds)||!Number.isSafeInteger(rto)||rto<1||rto>86400||
    !ID.test(p.witness_id)||!ID.test(p.key_id)||!validTime(p.observed_at,p.expires_at,now))
    return hold('HOLD_ROLLBACK_SCOPE','Backup/rollback artifact, restored digest, isolated result, RTO or freshness conflict.');
  const key=signingKey(env,8,p.key_id);
  if(!key)return hold('HOLD_ROLLBACK_KEY_INDEPENDENCE','A ninth distinct pinned rollback witness key is required.');
  if(!await verify(readback.envelope,transcript,key))return hold('HOLD_ROLLBACK_SIGNATURE_INVALID','Rollback witness signature invalid.');
  return hold('INDEPENDENT_NONPROD_RESTORE_CLAIM_AUTHENTICATED',
    'A separate witness signed an isolated recovery drill. No live restore was performed by this app.',
    {signature_authenticated:true,receipt_sha256:await sha256Receipt754(transcript),
      restore_rto_seconds:rto,observed_at:p.observed_at,
      migration_artifact_sha256:p.migration_artifact_sha256,
      rollback_artifact_sha256:p.rollback_artifact_sha256,backup_snapshot_sha256:p.backup_snapshot_sha256,
      rollback_directly_reproduced:false});
}
export async function verifyOwnerTrial760({env,record,prior,identity,isolation,rollback,envelope,now=Date.now()}={}){
  const p=envelope?.payload;let transcript;
  try{transcript=canonicalTrialAuth760(p);}catch{return hold('HOLD_OWNER_TRIAL_AUTH_FORMAT','Owner trial handoff is not canonical.');}
  if(p.schema!=='rosie-owner-nonprod-trial-handoff-v760'||!prior?.independent_review_chain_authenticated||
    !identity?.configured||!isolation?.signature_authenticated||!rollback?.signature_authenticated||
    p.booking_id!==record?.booking_id||p.source_record_id!==record?.source_record_id||
    p.history_head_sha256!==prior.history_head_sha256||
    p.retention_receipt_sha256!==prior.retention_review?.retention_receipt_sha256||
    p.enforcement_receipt_sha256!==prior.storage_audit?.enforcement_receipt_sha256||
    p.dba_receipt_sha256!==prior.dba_review?.receipt_sha256||
    p.security_receipt_sha256!==prior.security_review?.receipt_sha256||
    p.isolation_receipt_sha256!==isolation.receipt_sha256||p.rollback_receipt_sha256!==rollback.receipt_sha256||
    p.migration_artifact_sha256!==rollback.migration_artifact_sha256||
    p.rollback_artifact_sha256!==rollback.rollback_artifact_sha256||
    p.backup_snapshot_sha256!==rollback.backup_snapshot_sha256||
    p.audit_plan_sha256!==await auditPlanHash758()||
    p.nonprod_environment_id!==identity.nonprod_environment_id||p.nonprod_project_ref!==identity.nonprod_project_ref||
    !HASH.test(p.migration_artifact_sha256)||!HASH.test(p.rollback_artifact_sha256)||
    !HASH.test(p.backup_snapshot_sha256)||!ID.test(p.trial_id)||!ID.test(p.owner_id)||!ID.test(p.key_id)||
    p.decision!=='authorize_nonproduction_operator_handoff_only'||
    !/^[a-f0-9]{32,64}$/i.test(p.nonce)||!validTime(p.issued_at,p.expires_at,now,24*3600000,48*3600000)||
    Date.parse(p.issued_at)<Date.parse(isolation.observed_at||'')||
    Date.parse(p.issued_at)<Date.parse(rollback.observed_at||'')||
    Date.parse(p.issued_at)<Date.parse(prior.security_review?.issued_at||'')||
    Date.parse(p.issued_at)<Date.parse(prior.dba_review?.issued_at||''))
    return hold('HOLD_OWNER_TRIAL_AUTH_SCOPE','Exact trial artifacts, approved chain, target, witnesses or decision do not match.');
  const key=signingKey(env,0,p.key_id);
  if(!key)return hold('HOLD_OWNER_TRIAL_KEY_INDEPENDENCE','A distinct pinned owner signature is required.');
  if(!await verify(envelope,transcript,key))return hold('HOLD_OWNER_TRIAL_SIGNATURE_INVALID','Owner handoff signature invalid.');
  return hold('SIGNED_OWNER_NONPROD_OPERATOR_HANDOFF_ONLY',
    'Owner signed a scoped handoff for operator review, not SQL execution or business closure.',
    {signature_authenticated:true,receipt_sha256:await sha256Receipt754(transcript),trial_id:p.trial_id,
      migration_artifact_sha256:p.migration_artifact_sha256,rollback_artifact_sha256:p.rollback_artifact_sha256,
      backup_snapshot_sha256:p.backup_snapshot_sha256,trial_execution_authorized:false});
}
export async function reconcileNonprodTrial760({prior,identity,isolation,rollback,owner,reviewed_at=new Date().toISOString()}={}){
  const blockers=[];
  if(!prior?.independent_review_chain_authenticated)blockers.push({code:'PREVIOUS_SEVEN_KEY_CHAIN_UNVERIFIED',
    action:'Revalidate independent Build 759 source, retention, enforcement, DBA and security evidence.'});
  if(!identity?.configured)blockers.push({code:'NONPROD_PROJECT_REFS_UNVERIFIED',
    action:'Configure separate canonical production and isolated Supabase project references.'});
  if(!isolation?.signature_authenticated)blockers.push({code:'INDEPENDENT_ISOLATION_PROOF_UNVERIFIED',
    action:'Obtain signed isolation findings: production write denied, grants restricted, no real customer messaging, synthetic seed.'});
  if(!rollback?.signature_authenticated)blockers.push({code:'SIGNED_BACKUP_ROLLBACK_DRILL_UNVERIFIED',
    action:'Obtain a signed prior snapshot recovery and rollback drill, bound to exact reviewed artifacts.'});
  if(!owner?.signature_authenticated)blockers.push({code:'SCOPED_OWNER_TRIAL_HANDOFF_UNVERIFIED',
    action:'Obtain an authentic owner handoff for the exact script, rollback artifact, backup and nonprod project.'});
  blockers.push({code:'SEPARATE_OPERATOR_EXECUTION_GATE',
    action:'A later explicitly authorized operator must review exact SQL bytes, grants, snapshot availability and rollback and record an execution receipt.'});
  blockers.push({code:'PRODUCTION_CLOSURE_UNVERIFIED',
    action:'Keep production audit migration, immutable storage enforcement and business exception closure HOLD.'});
  const ready=blockers.length===2;
  const result={ok:true,build:760,read_only:true,nonprod_target:identity||null,
    source_chain_status:prior?.trial_readiness_status||'HOLD_NONPROD_TRIAL_READINESS',
    isolation_review:isolation||null,rollback_review:rollback||null,owner_trial_handoff:owner||null,
    trial_handoff_status:ready?'SCOPED_NONPROD_OPERATOR_HANDOFF_READY':'HOLD_NONPROD_TRIAL_HANDOFF',
    trial_execution_authorized:false,trial_executed:false,migration_authorized:false,
    migration_executed:false,rollback_executed_by_app:false,production_credentials_read:false,
    owner_closure_audit_persisted:false,closure_allowed:false,automatic_business_write:false,
    closure_reconciliation_status:'HOLD_CLOSURE_AUTHORIZATION',blocking_count:blockers.length,
    follow_ups:blockers,reviewed_at};
  result.packet_sha256=await digest(JSON.stringify({schema:'rosie-nonprod-trial-authorization-preflight-v760',
    history:prior?.history_head_sha256||null,retention:prior?.retention_review?.retention_receipt_sha256||null,
    enforcement:prior?.storage_audit?.enforcement_receipt_sha256||null,dba:prior?.dba_review?.receipt_sha256||null,
    security:prior?.security_review?.receipt_sha256||null,isolation:isolation?.receipt_sha256||null,
    rollback:rollback?.receipt_sha256||null,owner:owner?.receipt_sha256||null,
    target:identity?.nonprod_project_ref||null,blockers,reviewed_at}));
  return result;
}
