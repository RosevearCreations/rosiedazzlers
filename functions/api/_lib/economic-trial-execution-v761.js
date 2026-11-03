import {sha256Receipt754} from './owner-receipt-verification-v754.js';

const HASH=/^[a-f0-9]{64}$/i;
const UUID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const ID=/^[A-Za-z0-9][A-Za-z0-9._:/-]{5,119}$/;
const timestamp=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(value)&&Number.isFinite(Date.parse(value));
const freshness=(at,until,now)=>timestamp(at)&&timestamp(until)&&Date.parse(at)>=now-15*60000&&
  Date.parse(at)<=now+300000&&Date.parse(until)>now&&Date.parse(until)-Date.parse(at)<=30*60000;
const encoded=value=>new TextEncoder().encode(value);
const hash=async value=>sha256Receipt754(encoded(value));
const hold=(status,detail,extra={})=>({status,detail,signature_authenticated:false,receipt_sha256:null,...extra});

// All earlier signers must be independently pinned: reusing an older identity for a new role fails closed.
const PINNED_KEYS=[
  ['ROSIE_ECONOMIC_OWNER_RECEIPT_PUBLIC_KEY_B64','ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID'],
  ['ROSIE_ECONOMIC_SOURCE_WITNESS_PUBLIC_KEY_B64','ROSIE_ECONOMIC_SOURCE_WITNESS_KEY_ID'],
  ['ROSIE_ECONOMIC_HISTORY_CUSTODIAN_PUBLIC_KEY_B64','ROSIE_ECONOMIC_HISTORY_CUSTODIAN_KEY_ID'],
  ['ROSIE_ECONOMIC_RETENTION_PROVIDER_PUBLIC_KEY_B64','ROSIE_ECONOMIC_RETENTION_PROVIDER_KEY_ID'],
  ['ROSIE_ECONOMIC_STORAGE_AUDITOR_PUBLIC_KEY_B64','ROSIE_ECONOMIC_STORAGE_AUDITOR_KEY_ID'],
  ['ROSIE_ECONOMIC_DBA_REVIEW_PUBLIC_KEY_B64','ROSIE_ECONOMIC_DBA_REVIEW_KEY_ID'],
  ['ROSIE_ECONOMIC_SECURITY_REVIEW_PUBLIC_KEY_B64','ROSIE_ECONOMIC_SECURITY_REVIEW_KEY_ID'],
  ['ROSIE_ECONOMIC_ISOLATION_AUDITOR_PUBLIC_KEY_B64','ROSIE_ECONOMIC_ISOLATION_AUDITOR_KEY_ID'],
  ['ROSIE_ECONOMIC_ROLLBACK_WITNESS_PUBLIC_KEY_B64','ROSIE_ECONOMIC_ROLLBACK_WITNESS_KEY_ID'],
  ['ROSIE_ECONOMIC_TRIAL_OPERATOR_PUBLIC_KEY_B64','ROSIE_ECONOMIC_TRIAL_OPERATOR_KEY_ID'],
  ['ROSIE_ECONOMIC_TRIAL_RECONCILER_PUBLIC_KEY_B64','ROSIE_ECONOMIC_TRIAL_RECONCILER_KEY_ID']
];
function decode(value,size){
  if(typeof value!=='string'||value.length>200||value.length%4||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))return null;
  try{const raw=Uint8Array.from(atob(value),c=>c.charCodeAt(0));return raw.length===size?raw:null;}catch{return null;}
}
function keyFor(env,role,keyId){
  const ids=new Set(),material=new Set();let selected=null;
  for(const [index,[keyName,idName]] of PINNED_KEYS.entries()){
    const bytes=decode(env?.[keyName],32),id=env?.[idName];
    if(!bytes||!ID.test(id||'')||ids.has(id))return null;
    const fingerprint=Array.from(bytes).join(',');
    if(material.has(fingerprint))return null;
    material.add(fingerprint);ids.add(id);
    if(index===role&&id===keyId)selected=bytes;
  }
  return selected;
}
async function verify(envelope,canonical,key){
  if(!key||!envelope||Array.isArray(envelope)||Object.keys(envelope).length!==2||
    !Object.hasOwn(envelope,'payload')||!Object.hasOwn(envelope,'signature_b64'))return false;
  const signature=decode(envelope.signature_b64,64);if(!signature)return false;
  try{const imported=await crypto.subtle.importKey('raw',key,{name:'Ed25519'},false,['verify']);
    return await crypto.subtle.verify('Ed25519',imported,signature,canonical);}catch{return false;}
}
const canonical=(payload,fields,domain)=>{
  if(!payload||Array.isArray(payload)||typeof payload!=='object'||Object.keys(payload).length!==fields.length||
    !fields.every(key=>Object.hasOwn(payload,key)&&typeof payload[key]==='string'))
    throw Error('Evidence is not canonical.');
  return encoded(domain+JSON.stringify(fields.map(field=>[field,payload[field]])));
};
export const OPERATOR_FIELDS761=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','nonprod_environment_id','nonprod_project_ref',
  'handoff_receipt_sha256','preflight_packet_sha256','migration_artifact_sha256',
  'rollback_artifact_sha256','backup_snapshot_sha256','execution_id','execution_result',
  'executed_at','observed_at','record_scope','production_writes','customer_notifications','operator_id','key_id'
]);
export const OUTCOME_FIELDS761=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','nonprod_environment_id','nonprod_project_ref',
  'execution_id','operator_receipt_sha256','migration_artifact_sha256','rollback_artifact_sha256',
  'backup_snapshot_sha256','post_migration_check','synthetic_scope_check','production_write_check',
  'customer_notification_check','rollback_disposition','rollback_execution_receipt_sha256',
  'observed_at','expires_at','reconciler_id','key_id'
]);
export const canonicalOperator761=value=>canonical(value,OPERATOR_FIELDS761,'rosie-nonprod-operator-execution-v761:');
export const canonicalOutcome761=value=>canonical(value,OUTCOME_FIELDS761,'rosie-nonprod-trial-outcome-v761:');

/** Provider origins are fixed by the server, never supplied in the POST body. */
export function receiptURL761(env,kind,record,handoff){
  if(!['operator','outcome'].includes(kind)||!UUID.test(record?.booking_id||'')||
    !UUID.test(record?.source_record_id||'')||!handoff?.nonprod_target?.configured||
    !handoff?.owner_trial_handoff?.signature_authenticated||!HASH.test(handoff.owner_trial_handoff.receipt_sha256||''))return null;
  const setting=kind==='operator'?'ROSIE_ECONOMIC_TRIAL_OPERATOR_BASE_URL':'ROSIE_ECONOMIC_TRIAL_RECONCILE_BASE_URL';
  try{
    const origin=new URL(env?.[setting]);
    const otherSetting=kind==='operator'?'ROSIE_ECONOMIC_TRIAL_RECONCILE_BASE_URL':'ROSIE_ECONOMIC_TRIAL_OPERATOR_BASE_URL';
    const other=new URL(env?.[otherSetting]);
    if(origin.protocol!=='https:'||origin.username||origin.password||origin.search||origin.hash||origin.port||
      origin.pathname!=='/'||!origin.hostname.includes('.')||origin.hostname==='localhost'||
      other.protocol!=='https:'||other.origin===origin.origin)return null;
    const url=new URL('/v1/economic-nonprod-trial-'+kind+'-receipt',origin);
    for(const [key,value] of Object.entries({booking_id:record.booking_id,
      source_record_id:record.source_record_id,trial_id:handoff.owner_trial_handoff.trial_id,
      nonprod_environment_id:handoff.nonprod_target.nonprod_environment_id,
      nonprod_project_ref:handoff.nonprod_target.nonprod_project_ref,
      handoff_receipt_sha256:handoff.owner_trial_handoff.receipt_sha256}))url.searchParams.set(key,value);
    return url.toString();
  }catch{return null;}
}
export async function readReceipt761(env,kind,record,handoff,fetcher=fetch){
  const url=receiptURL761(env,kind,record,handoff);
  if(!url)return {status:'HOLD_'+kind.toUpperCase()+'_PROVIDER_NOT_CONFIGURED'};
  try{
    const response=await fetcher(url,{method:'GET',redirect:'error',
      headers:{Accept:'application/json','Cache-Control':'no-store'}});
    if(!response.ok)return {status:'HOLD_'+kind.toUpperCase()+'_PROVIDER_UNAVAILABLE'};
    const raw=await response.text();if(raw.length>16000)return {status:'HOLD_'+kind.toUpperCase()+'_OVERSIZED'};
    const envelope=JSON.parse(raw);
    if(!envelope||Array.isArray(envelope)||typeof envelope!=='object'||Object.keys(envelope).length!==2||
      !Object.hasOwn(envelope,'payload')||!Object.hasOwn(envelope,'signature_b64'))
      return {status:'HOLD_'+kind.toUpperCase()+'_FORMAT'};
    return {status:'SIGNED_'+kind.toUpperCase()+'_READBACK',envelope};
  }catch{return {status:'HOLD_'+kind.toUpperCase()+'_PROVIDER_UNAVAILABLE'};}
}
export async function verifyOperator761({env,record,handoff,readback,now=Date.now()}={}){
  if(readback?.status!=='SIGNED_OPERATOR_READBACK')return hold(readback?.status||'HOLD_OPERATOR_RECEIPT_MISSING',
    'A separately signed, server-fetched operator execution receipt is required.');
  const p=readback.envelope?.payload;let canonicalBytes;
  try{canonicalBytes=canonicalOperator761(p);}catch{return hold('HOLD_OPERATOR_FORMAT','Noncanonical execution receipt.');}
  const target=handoff?.nonprod_target,owner=handoff?.owner_trial_handoff;
  if(handoff?.trial_handoff_status!=='SCOPED_NONPROD_OPERATOR_HANDOFF_READY'||
    p.schema!=='rosie-nonprod-operator-execution-v761'||
    p.booking_id!==record?.booking_id||p.source_record_id!==record?.source_record_id||
    p.trial_id!==owner?.trial_id||p.nonprod_environment_id!==target?.nonprod_environment_id||
    p.nonprod_project_ref!==target?.nonprod_project_ref||
    p.handoff_receipt_sha256!==owner?.receipt_sha256||p.preflight_packet_sha256!==handoff?.packet_sha256||
    p.migration_artifact_sha256!==owner?.migration_artifact_sha256||
    p.rollback_artifact_sha256!==owner?.rollback_artifact_sha256||
    p.backup_snapshot_sha256!==owner?.backup_snapshot_sha256||
    !ID.test(p.execution_id)||!ID.test(p.operator_id)||!ID.test(p.key_id)||
    !['SUCCEEDED_NONPRODUCTION','FAILED_NONPRODUCTION'].includes(p.execution_result)||
    !timestamp(p.executed_at)||!timestamp(p.observed_at)||
    !timestamp(owner?.issued_at)||!timestamp(owner?.expires_at)||
    Date.parse(p.executed_at)<Date.parse(owner?.issued_at||'')||
    Date.parse(p.executed_at)>Date.parse(owner?.expires_at||'')||
    Date.parse(p.observed_at)<Date.parse(p.executed_at)||
    Date.parse(p.observed_at)<now-15*60000||Date.parse(p.observed_at)>now+300000||
    p.record_scope!=='SYNTHETIC_ONLY'||p.production_writes!=='0'||p.customer_notifications!=='0')
    return hold('HOLD_OPERATOR_EXECUTION_SCOPE','Execution timing, isolation, SQL digests or no-customer-write claim conflicts.');
  const key=keyFor(env,9,p.key_id);
  if(!key)return hold('HOLD_OPERATOR_KEY_INDEPENDENCE','A tenth distinct pinned operator signer is required.');
  if(!await verify(readback.envelope,canonicalBytes,key))return hold('HOLD_OPERATOR_SIGNATURE_INVALID','Operator signature invalid.');
  return hold(p.execution_result==='SUCCEEDED_NONPRODUCTION'?'SIGNED_NONPROD_OPERATOR_SUCCESS_CLAIM':'SIGNED_NONPROD_OPERATOR_FAILURE_CLAIM',
    'Authentic operator claim checked; this application neither observed nor ran the SQL.',
    {signature_authenticated:true,receipt_sha256:await sha256Receipt754(canonicalBytes),
      trial_id:p.trial_id,execution_id:p.execution_id,execution_result:p.execution_result,
      handoff_receipt_sha256:p.handoff_receipt_sha256,
      migration_artifact_sha256:p.migration_artifact_sha256,
      rollback_artifact_sha256:p.rollback_artifact_sha256,
      backup_snapshot_sha256:p.backup_snapshot_sha256,
      executed_at:p.executed_at,observed_at:p.observed_at,external_execution_only:true});
}
export async function verifyOutcome761({env,record,handoff,operator,readback,now=Date.now()}={}){
  if(readback?.status!=='SIGNED_OUTCOME_READBACK')return hold(readback?.status||'HOLD_OUTCOME_RECEIPT_MISSING',
    'Independent post-trial and rollback-exception reconciliation is required.');
  const p=readback.envelope?.payload;let canonicalBytes;
  try{canonicalBytes=canonicalOutcome761(p);}catch{return hold('HOLD_OUTCOME_FORMAT','Noncanonical trial witness receipt.');}
  const target=handoff?.nonprod_target,owner=handoff?.owner_trial_handoff;
  if(!operator?.signature_authenticated||p.schema!=='rosie-nonprod-trial-outcome-v761'||
    p.booking_id!==record?.booking_id||p.source_record_id!==record?.source_record_id||
    p.trial_id!==owner?.trial_id||p.nonprod_environment_id!==target?.nonprod_environment_id||
    p.nonprod_project_ref!==target?.nonprod_project_ref||p.execution_id!==operator.execution_id||
    p.operator_receipt_sha256!==operator.receipt_sha256||
    p.migration_artifact_sha256!==owner?.migration_artifact_sha256||
    p.rollback_artifact_sha256!==owner?.rollback_artifact_sha256||
    p.backup_snapshot_sha256!==owner?.backup_snapshot_sha256||
    !['PASSED_NONPRODUCTION','FAILED_NONPRODUCTION'].includes(p.post_migration_check)||
    !['SYNTHETIC_ONLY','SCOPE_EXCEPTION'].includes(p.synthetic_scope_check)||
    !['NONE_OBSERVED','PRODUCTION_WRITE_EXCEPTION'].includes(p.production_write_check)||
    !['NONE_SENT','CUSTOMER_NOTIFICATION_EXCEPTION'].includes(p.customer_notification_check)||
    !['NOT_REQUIRED_CLEAN','EXECUTED_NONPRODUCTION','OPEN_EXCEPTION'].includes(p.rollback_disposition)||
    (p.rollback_disposition==='NOT_REQUIRED_CLEAN'?p.rollback_execution_receipt_sha256!=='NONE':
      !HASH.test(p.rollback_execution_receipt_sha256))||
    !ID.test(p.reconciler_id)||!ID.test(p.key_id)||!freshness(p.observed_at,p.expires_at,now)||
    Date.parse(p.observed_at)<Date.parse(operator.executed_at))
    return hold('HOLD_OUTCOME_SCOPE','Witness chronology, trial identity, rollback reference or exact artifact hashes conflict.');
  const key=keyFor(env,10,p.key_id);
  if(!key)return hold('HOLD_OUTCOME_KEY_INDEPENDENCE','An eleventh independent post-trial witness is required.');
  if(!await verify(readback.envelope,canonicalBytes,key))return hold('HOLD_OUTCOME_SIGNATURE_INVALID','Outcome witness signature invalid.');
  const clean=operator.execution_result==='SUCCEEDED_NONPRODUCTION'&&
    p.post_migration_check==='PASSED_NONPRODUCTION'&&p.synthetic_scope_check==='SYNTHETIC_ONLY'&&
    p.production_write_check==='NONE_OBSERVED'&&p.customer_notification_check==='NONE_SENT'&&
    p.rollback_disposition==='NOT_REQUIRED_CLEAN';
  return hold(clean?'SIGNED_NONPROD_TRIAL_NO_EXCEPTION_CLAIM':'SIGNED_NONPROD_TRIAL_EXCEPTION_CLAIM',
    'Independent external witness attestation; no SQL, rollback or production access was executed by this application.',
    {signature_authenticated:true,receipt_sha256:await sha256Receipt754(canonicalBytes),
      clean_claim:clean,rollback_disposition:p.rollback_disposition,
      post_migration_check:p.post_migration_check,observed_at:p.observed_at,
      rollback_execution_receipt_sha256:p.rollback_execution_receipt_sha256,
      external_observation_only:true});
}
export async function reconcileExecution761({handoff,operator,outcome,reviewed_at=new Date().toISOString()}={}){
  const blockers=[];
  if(handoff?.trial_handoff_status!=='SCOPED_NONPROD_OPERATOR_HANDOFF_READY')
    blockers.push({code:'BUILD760_AUTHENTIC_HANDOFF_UNVERIFIED',action:'Revalidate all earlier independent signers, project separation and scoped owner handoff.'});
  if(!operator?.signature_authenticated)
    blockers.push({code:'OPERATOR_EXECUTION_RECEIPT_UNVERIFIED',action:'Obtain a fresh signed operator receipt from the pinned external provider; no execution can be initiated here.'});
  else if(operator.execution_result!=='SUCCEEDED_NONPRODUCTION')
    blockers.push({code:'NONPROD_EXECUTION_REPORTED_FAILED',action:'Stop and obtain an operator failure and recovery disposition before any repeat trial.'});
  if(!outcome?.signature_authenticated)
    blockers.push({code:'INDEPENDENT_TRIAL_RECONCILIATION_UNVERIFIED',action:'Obtain a separate signed post-trial witness report and rollback exception review.'});
  else if(!outcome.clean_claim)
    blockers.push({code:'ROLLBACK_OR_TRIAL_EXCEPTION_OPEN',action:'Review the independent failure or rollback execution receipt manually; no automatic closure or retry.'});
  blockers.push({code:'PRODUCTION_MIGRATION_AND_BUSINESS_CLOSURE_HOLD',
    action:'Production migration, immutable audit enforcement and economic exception closure require separate owner authorization and real evidence.'});
  const clean=blockers.length===1;
  const result={ok:true,build:761,read_only:true,
    nonprod_target:handoff?.nonprod_target||null,build760_handoff_status:handoff?.trial_handoff_status||'HOLD_NONPROD_TRIAL_HANDOFF',
    operator_receipt:operator||null,independent_trial_witness:outcome||null,
    trial_review_status:clean?'NONPROD_TRIAL_EVIDENCE_RECONCILED_NO_EXCEPTION':'HOLD_NONPROD_TRIAL_EVIDENCE',
    external_execution_claim_authenticated:!!operator?.signature_authenticated,
    external_reconciliation_claim_authenticated:!!outcome?.signature_authenticated,
    trial_executed_by_app:false,migration_executed_by_app:false,rollback_executed_by_app:false,
    production_credentials_read:false,customer_notifications_sent_by_app:false,
    owner_closure_audit_persisted:false,closure_allowed:false,automatic_business_write:false,
    blocking_count:blockers.length,follow_ups:blockers,reviewed_at};
  result.packet_sha256=await hash(JSON.stringify({schema:'rosie-trial-execution-review-v761',
    handoff:handoff?.packet_sha256||null,operator:operator?.receipt_sha256||null,
    outcome:outcome?.receipt_sha256||null,target:handoff?.nonprod_target?.nonprod_project_ref||null,
    blockers,reviewed_at}));
  return result;
}
