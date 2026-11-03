import {sha256Receipt754} from './owner-receipt-verification-v754.js';

const ID=/^[A-Za-z0-9][A-Za-z0-9._:/-]{5,119}$/;
const UUID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const HASH=/^[a-f0-9]{64}$/i;
const utc=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(v)&&Number.isFinite(Date.parse(v));
const text=v=>new TextEncoder().encode(v);
const digest=v=>sha256Receipt754(text(v));
const hold=(status,detail,more={})=>({status,detail,signature_authenticated:false,receipt_sha256:null,...more});
const PREFIXES=[
  'OWNER_RECEIPT','SOURCE_WITNESS','HISTORY_CUSTODIAN','RETENTION_PROVIDER',
  'STORAGE_AUDITOR','DBA_REVIEW','SECURITY_REVIEW','ISOLATION_AUDITOR',
  'ROLLBACK_WITNESS','TRIAL_OPERATOR','TRIAL_RECONCILER','ROLLBACK_EXCEPTION',
  'CHANGE_CONTROL','PRODUCTION_DBA_AUTH','PRODUCTION_SECURITY_AUTH',
  'PRODUCTION_OPERATOR_GATE','PRODUCTION_ROLLBACK_READY',
  'PRODUCTION_GATE_ARCHIVIST','PRODUCTION_OUTCOME_RECONCILER'
];
const ORIGINS=[
  'TRIAL_OPERATOR','TRIAL_RECONCILE','ROLLBACK_EXCEPTION','CHANGE_CONTROL',
  'PRODUCTION_DBA_AUTH','PRODUCTION_SECURITY_AUTH','PRODUCTION_OPERATOR_GATE',
  'PRODUCTION_ROLLBACK_READY','PRODUCTION_GATE_ARCHIVIST','PRODUCTION_OUTCOME_RECONCILER'
];
function decode(value,size){
  if(typeof value!=='string'||value.length>200||value.length%4||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))return null;
  try{const data=Uint8Array.from(atob(value),c=>c.charCodeAt(0));return data.length===size?data:null;}
  catch{return null;}
}
function signer(env,role,id){
  const ids=new Set(),fingerprints=new Set();let selected=null;
  for(const [index,prefix] of PREFIXES.entries()){
    const key=decode(env?.[`ROSIE_ECONOMIC_${prefix}_PUBLIC_KEY_B64`],32);
    const keyId=env?.[`ROSIE_ECONOMIC_${prefix}_KEY_ID`];
    if(!key||!ID.test(keyId||'')||ids.has(keyId))return null;
    const fingerprint=Array.from(key).join(',');
    if(fingerprints.has(fingerprint))return null;
    ids.add(keyId);fingerprints.add(fingerprint);
    if(index===role&&keyId===id)selected=key;
  }
  return selected;
}
function canonical(p,fields,domain){
  if(!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).length!==fields.length||
    !fields.every(field=>Object.hasOwn(p,field)&&typeof p[field]==='string'))throw Error('Noncanonical evidence.');
  return text(domain+JSON.stringify(fields.map(field=>[field,p[field]])));
}
async function verify(envelope,transcript,key){
  if(!key||!envelope||Array.isArray(envelope)||Object.keys(envelope).length!==2||
    !Object.hasOwn(envelope,'payload')||!Object.hasOwn(envelope,'signature_b64'))return false;
  const signature=decode(envelope.signature_b64,64);if(!signature)return false;
  try{const imported=await crypto.subtle.importKey('raw',key,{name:'Ed25519'},false,['verify']);
    return await crypto.subtle.verify('Ed25519',imported,signature,transcript);}
  catch{return false;}
}
export const GATE_ARCHIVE_FIELDS764=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id','execution_request_id',
  'production_project_ref','nonprod_project_ref','build763_packet_sha256',
  'owner_production_sha256','dba_authorization_sha256','security_authorization_sha256',
  'operator_gate_sha256','rollback_ready_sha256',
  'migration_artifact_sha256','rollback_artifact_sha256','backup_snapshot_sha256',
  'window_start','window_end','gate_status','preflight_reviewed_at','recorded_at',
  'ledger_entry_id','ledger_previous_sha256','ledger_claim','change_manager_id','key_id'
]);
export const EXECUTION_FIELDS764=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id','execution_request_id',
  'production_project_ref','gate_archive_receipt_sha256','build763_packet_sha256',
  'operator_gate_sha256','migration_artifact_sha256','backup_snapshot_sha256',
  'migration_execution_id','migration_version','transaction_receipt_sha256',
  'schema_before_sha256','schema_after_sha256','started_at','finished_at',
  'execution_result','credential_handling','operator_id','key_id'
]);
export const STANDBY_FIELDS764=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id','execution_request_id',
  'production_project_ref','gate_archive_receipt_sha256','execution_receipt_sha256',
  'rollback_ready_sha256','rollback_artifact_sha256','backup_snapshot_sha256',
  'standby_start','standby_end','standby_outcome','rollback_execution_receipt_sha256',
  'incident_id','witness_id','key_id'
]);
export const RECONCILIATION_FIELDS764=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id','execution_request_id',
  'production_project_ref','gate_archive_receipt_sha256','execution_receipt_sha256',
  'standby_receipt_sha256','schema_before_sha256','schema_after_sha256',
  'independent_change_log_sha256','storage_audit_sha256','outcome',
  'reviewed_at','reviewer_id','key_id'
]);
export const OWNER_POSTCHANGE_FIELDS764=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id','execution_request_id',
  'production_project_ref','gate_archive_receipt_sha256','execution_receipt_sha256',
  'standby_receipt_sha256','reconciliation_receipt_sha256','decision',
  'owner_id','issued_at','nonce','key_id'
]);
export const canonicalArchive764=p=>canonical(p,GATE_ARCHIVE_FIELDS764,'rosie-independent-execution-gate-archive-v764:');
export const canonicalExecution764=p=>canonical(p,EXECUTION_FIELDS764,'rosie-external-production-execution-v764:');
export const canonicalStandby764=p=>canonical(p,STANDBY_FIELDS764,'rosie-independent-production-rollback-standby-v764:');
export const canonicalReconciliation764=p=>canonical(p,RECONCILIATION_FIELDS764,'rosie-independent-postchange-reconciliation-v764:');
export const canonicalOwnerPostchange764=p=>canonical(p,OWNER_POSTCHANGE_FIELDS764,'rosie-owner-postchange-evidence-review-v764:');

export function receiptURL764(env,kind,record,archive,execution,standby){
  const routes={
    archive:['PRODUCTION_GATE_ARCHIVIST','/v1/economic-execution-gate-archive-v764'],
    execution:['PRODUCTION_OPERATOR_GATE','/v1/economic-production-execution-receipt-v764'],
    standby:['PRODUCTION_ROLLBACK_READY','/v1/economic-production-rollback-standby-v764'],
    reconciliation:['PRODUCTION_OUTCOME_RECONCILER','/v1/economic-postchange-outcome-reconciliation-v764']
  };
  if(!Object.hasOwn(routes,kind)||!UUID.test(record?.booking_id||'')||
    !UUID.test(record?.source_record_id||'')||!ID.test(record?.change_ticket_id||'')||
    !ID.test(record?.execution_request_id||''))return null;
  if(kind!=='archive'&&!archive?.signature_authenticated)return null;
  if(['standby','reconciliation'].includes(kind)&&!execution?.signature_authenticated)return null;
  if(kind==='reconciliation'&&!standby?.signature_authenticated)return null;
  try{
    const urls=ORIGINS.map(prefix=>new URL(env?.[`ROSIE_ECONOMIC_${prefix}_BASE_URL`]));
    if(urls.some(u=>u.protocol!=='https:'||u.username||u.password||u.port||u.search||u.hash||
      u.pathname!=='/'||!u.hostname.includes('.')||u.hostname==='localhost'||
      /^(?:\d{1,3}\.){3}\d{1,3}$/.test(u.hostname)||u.hostname.startsWith('[')||
      /\.(?:local|localhost|internal)$/i.test(u.hostname))||
      new Set(urls.map(u=>u.origin)).size!==urls.length)return null;
    const [prefix,path]=routes[kind];
    const url=new URL(path,new URL(env[`ROSIE_ECONOMIC_${prefix}_BASE_URL`]));
    const params={
      booking_id:record.booking_id,source_record_id:record.source_record_id,
      change_ticket_id:record.change_ticket_id,execution_request_id:record.execution_request_id
    };
    if(kind!=='archive')params.gate_archive_receipt_sha256=archive.receipt_sha256;
    if(['standby','reconciliation'].includes(kind))params.execution_receipt_sha256=execution.receipt_sha256;
    if(kind==='reconciliation')params.standby_receipt_sha256=standby.receipt_sha256;
    for(const [key,value] of Object.entries(params))url.searchParams.set(key,value);
    return url.toString();
  }catch{return null;}
}
export async function readReceipt764(env,kind,record,archive,execution,standby,fetcher=fetch){
  const url=receiptURL764(env,kind,record,archive,execution,standby);
  if(!url)return {status:'HOLD_'+kind.toUpperCase()+'_PROVIDER_NOT_CONFIGURED'};
  try{
    const response=await fetcher(url,{method:'GET',redirect:'error',
      headers:{Accept:'application/json','Cache-Control':'no-store'}});
    if(!response.ok)return {status:'HOLD_'+kind.toUpperCase()+'_PROVIDER_UNAVAILABLE'};
    const raw=await response.text();
    if(raw.length>16000)return {status:'HOLD_'+kind.toUpperCase()+'_PROVIDER_OVERSIZED'};
    const envelope=JSON.parse(raw);
    if(!envelope||typeof envelope!=='object'||Array.isArray(envelope)||Object.keys(envelope).length!==2||
      !Object.hasOwn(envelope,'payload')||!Object.hasOwn(envelope,'signature_b64'))
      return {status:'HOLD_'+kind.toUpperCase()+'_PROVIDER_FORMAT'};
    return {status:'SIGNED_'+kind.toUpperCase()+'_READBACK',envelope};
  }catch{return {status:'HOLD_'+kind.toUpperCase()+'_PROVIDER_UNAVAILABLE'};}
}
const common=(p,record,archive)=>p?.booking_id===record?.booking_id&&
  p?.source_record_id===record?.source_record_id&&
  p?.change_ticket_id===record?.change_ticket_id&&
  p?.execution_request_id===record?.execution_request_id&&
  (!archive||(
    p.trial_id===archive.trial_id&&p.production_project_ref===archive.production_project_ref));

export async function verifyArchive764({env,record,readback,now=Date.now()}={}){
  if(readback?.status!=='SIGNED_ARCHIVE_READBACK')
    return hold(readback?.status||'HOLD_PRECHANGE_ARCHIVE_MISSING','Independent historical gate archive unavailable.');
  const p=readback.envelope?.payload;let transcript;
  try{transcript=canonicalArchive764(p);}catch{return hold('HOLD_ARCHIVE_FORMAT','Noncanonical historical gate archive.');}
  const start=Date.parse(p.window_start),end=Date.parse(p.window_end);
  const prior=Date.parse(p.preflight_reviewed_at),recorded=Date.parse(p.recorded_at);
  if(p.schema!=='rosie-independent-execution-gate-archive-v764'||!common(p,record)||
    !ID.test(p.trial_id)||!ID.test(p.production_project_ref)||!ID.test(p.nonprod_project_ref)||
    p.production_project_ref===p.nonprod_project_ref||
    !['build763_packet_sha256','owner_production_sha256','dba_authorization_sha256',
      'security_authorization_sha256','operator_gate_sha256','rollback_ready_sha256',
      'migration_artifact_sha256','rollback_artifact_sha256','backup_snapshot_sha256',
      'ledger_previous_sha256'].every(k=>HASH.test(p[k]))||
    !utc(p.window_start)||!utc(p.window_end)||!utc(p.preflight_reviewed_at)||!utc(p.recorded_at)||
    !Number.isFinite(start)||!Number.isFinite(end)||end<=start||end-start>4*3600000||
    start-prior<0||start-prior>30*60000||recorded<prior||recorded>start||
    recorded>now+300000||p.gate_status!=='READY_FOR_EXTERNAL_MANUAL_CHANGE_MANAGER_RECHECK'||
    p.ledger_claim!=='EXTERNAL_APPEND_ONLY_ATTESTATION_ONLY'||
    !ID.test(p.ledger_entry_id)||!ID.test(p.change_manager_id)||!ID.test(p.key_id))
    return hold('HOLD_ARCHIVE_SCOPE','The historical gate anchor lacks exact identities, artifact hashes, timing or the independently claimed ledger entry.');
  const key=signer(env,17,p.key_id);
  if(!key)return hold('HOLD_ARCHIVE_KEY_INDEPENDENCE','A distinct eighteenth gate archive signer is required.');
  if(!await verify(readback.envelope,transcript,key))return hold('HOLD_ARCHIVE_SIGNATURE','Gate archive signature invalid.');
  return hold('SIGNED_HISTORICAL_BUILD763_GATE_ATTESTATION_CLAIM',
    'Independent archivist signed a historical gate claim; neither this site nor the signature proves append-only enforcement.',
    {signature_authenticated:true,receipt_sha256:await sha256Receipt754(transcript),
      trial_id:p.trial_id,production_project_ref:p.production_project_ref,
      nonprod_project_ref:p.nonprod_project_ref,build763_packet_sha256:p.build763_packet_sha256,
      owner_production_sha256:p.owner_production_sha256,dba_authorization_sha256:p.dba_authorization_sha256,
      security_authorization_sha256:p.security_authorization_sha256,operator_gate_sha256:p.operator_gate_sha256,
      rollback_ready_sha256:p.rollback_ready_sha256,
      migration_artifact_sha256:p.migration_artifact_sha256,
      rollback_artifact_sha256:p.rollback_artifact_sha256,
      backup_snapshot_sha256:p.backup_snapshot_sha256,
      window_start:p.window_start,window_end:p.window_end,
      ledger_entry_id:p.ledger_entry_id,recorded_at:p.recorded_at});
}
export async function verifyExecution764({env,record,archive,readback,now=Date.now()}={}){
  if(readback?.status!=='SIGNED_EXECUTION_READBACK')
    return hold(readback?.status||'HOLD_EXECUTION_MISSING','External operator receipt unavailable.');
  const p=readback.envelope?.payload;let transcript;
  try{transcript=canonicalExecution764(p);}catch{return hold('HOLD_EXECUTION_FORMAT','Noncanonical production operator receipt.');}
  const started=Date.parse(p.started_at),finished=Date.parse(p.finished_at);
  const success=p.execution_result==='SUCCEEDED_EXTERNAL_CLAIM';
  if(p.schema!=='rosie-external-production-execution-v764'||!common(p,record,archive)||
    !archive?.signature_authenticated||
    p.gate_archive_receipt_sha256!==archive.receipt_sha256||
    p.build763_packet_sha256!==archive.build763_packet_sha256||
    p.operator_gate_sha256!==archive.operator_gate_sha256||
    p.migration_artifact_sha256!==archive.migration_artifact_sha256||
    p.backup_snapshot_sha256!==archive.backup_snapshot_sha256||
    !ID.test(p.migration_execution_id)||!ID.test(p.migration_version)||
    !HASH.test(p.transaction_receipt_sha256)||!HASH.test(p.schema_before_sha256)||
    !HASH.test(p.schema_after_sha256)||!utc(p.started_at)||!utc(p.finished_at)||
    started<Date.parse(archive.window_start)||finished> Date.parse(archive.window_end)||
    finished<started||finished-started>4*3600000||finished>now+300000||
    now-finished>7*86400000||
    !['SUCCEEDED_EXTERNAL_CLAIM','FAILED_EXTERNAL_EXCEPTION_HELD'].includes(p.execution_result)||
    (success&&p.schema_before_sha256===p.schema_after_sha256)||
    p.credential_handling!=='OUTSIDE_APP_EXTERNAL_OPERATOR_ONLY'||
    !ID.test(p.operator_id)||!ID.test(p.key_id))
    return hold('HOLD_EXECUTION_SCOPE','Signed operator receipt conflicts with pre-execution archive, exact project, artifacts, change window or migration outcome.');
  const key=signer(env,15,p.key_id);
  if(!key)return hold('HOLD_EXECUTION_KEY_INDEPENDENCE','Pinned external operator signer and all independent keys are required.');
  if(!await verify(readback.envelope,transcript,key))return hold('HOLD_EXECUTION_SIGNATURE','External operator signature invalid.');
  return hold(success?'SIGNED_EXTERNAL_PRODUCTION_SUCCESS_CLAIM':'SIGNED_EXTERNAL_PRODUCTION_FAILURE_HOLD',
    'External operator signed a migration outcome claim; this site did not execute or independently query production.',
    {signature_authenticated:true,receipt_sha256:await sha256Receipt754(transcript),
      clean_claim:success,migration_execution_id:p.migration_execution_id,
      transaction_receipt_sha256:p.transaction_receipt_sha256,
      schema_before_sha256:p.schema_before_sha256,schema_after_sha256:p.schema_after_sha256,
      started_at:p.started_at,finished_at:p.finished_at,operator_id:p.operator_id,
      production_db_state_verified_by_app:false});
}
export async function verifyStandby764({env,record,archive,execution,readback}={}){
  if(readback?.status!=='SIGNED_STANDBY_READBACK')
    return hold(readback?.status||'HOLD_STANDBY_MISSING','Independent rollback standby observation unavailable.');
  const p=readback.envelope?.payload;let transcript;
  try{transcript=canonicalStandby764(p);}catch{return hold('HOLD_STANDBY_FORMAT','Noncanonical rollback witness observation.');}
  const clean=execution?.clean_claim===true;
  const expected=clean?'STANDBY_COMPLETED_NO_ROLLBACK':'INCIDENT_OPEN_ROLLBACK_REVIEW';
  if(p.schema!=='rosie-independent-production-rollback-standby-v764'||!common(p,record,archive)||
    !archive?.signature_authenticated||!execution?.signature_authenticated||
    p.gate_archive_receipt_sha256!==archive.receipt_sha256||
    p.execution_receipt_sha256!==execution.receipt_sha256||
    p.rollback_ready_sha256!==archive.rollback_ready_sha256||
    p.rollback_artifact_sha256!==archive.rollback_artifact_sha256||
    p.backup_snapshot_sha256!==archive.backup_snapshot_sha256||
    !utc(p.standby_start)||!utc(p.standby_end)||
    Date.parse(p.standby_start)>Date.parse(execution.started_at)||
    Date.parse(p.standby_start)<Date.parse(archive.window_start)||
    Date.parse(p.standby_end)<Date.parse(execution.finished_at)||
    Date.parse(p.standby_end)>Date.parse(archive.window_end)||
    p.standby_outcome!==expected||
    (clean&&(p.rollback_execution_receipt_sha256!=='NONE'||p.incident_id!=='NONE'))||
    (!clean&&(!ID.test(p.incident_id)||!(p.rollback_execution_receipt_sha256==='NONE'||
      HASH.test(p.rollback_execution_receipt_sha256))))||
    !ID.test(p.witness_id)||!ID.test(p.key_id))
    return hold('HOLD_STANDBY_SCOPE','Rollback witness did not bind the exact operator, time interval, artifacts or incident state.');
  const key=signer(env,16,p.key_id);
  if(!key)return hold('HOLD_STANDBY_KEY_INDEPENDENCE','Pinned independent rollback standby signer required.');
  if(!await verify(readback.envelope,transcript,key))return hold('HOLD_STANDBY_SIGNATURE','Rollback witness signature invalid.');
  return hold(clean?'SIGNED_ROLLBACK_STANDBY_NO_EXCEPTION_CLAIM':'SIGNED_ROLLBACK_INCIDENT_OPEN_HOLD',
    'Signed external standby/incident observation, not proof the rollback or backup was executed.',
    {signature_authenticated:true,receipt_sha256:await sha256Receipt754(transcript),
      clean_claim:clean,standby_outcome:p.standby_outcome,incident_id:p.incident_id,
      rollback_execution_receipt_sha256:p.rollback_execution_receipt_sha256,
      observed_at:p.standby_end,rollback_executed_by_app:false});
}
export async function verifyReconciliation764({env,record,archive,execution,standby,readback,now=Date.now()}={}){
  if(readback?.status!=='SIGNED_RECONCILIATION_READBACK')
    return hold(readback?.status||'HOLD_RECONCILIATION_MISSING','Independent post-change evidence reconciliation unavailable.');
  const p=readback.envelope?.payload;let transcript;
  try{transcript=canonicalReconciliation764(p);}catch{return hold('HOLD_RECONCILIATION_FORMAT','Noncanonical external outcome reconciliation.');}
  const clean=execution?.clean_claim&&standby?.clean_claim;
  if(p.schema!=='rosie-independent-postchange-reconciliation-v764'||!common(p,record,archive)||
    !archive?.signature_authenticated||!execution?.signature_authenticated||!standby?.signature_authenticated||
    p.gate_archive_receipt_sha256!==archive.receipt_sha256||
    p.execution_receipt_sha256!==execution.receipt_sha256||
    p.standby_receipt_sha256!==standby.receipt_sha256||
    p.schema_before_sha256!==execution.schema_before_sha256||
    p.schema_after_sha256!==execution.schema_after_sha256||
    !HASH.test(p.independent_change_log_sha256)||!HASH.test(p.storage_audit_sha256)||
    p.outcome!==(clean?'CONSISTENT_EXTERNAL_CLAIMS_PENDING_DB_AUDIT':'EXCEPTION_HELD_EXTERNAL_OUTCOME')||
    !utc(p.reviewed_at)||Date.parse(p.reviewed_at)<Date.parse(standby.observed_at)||
    Date.parse(p.reviewed_at)>now+300000||now-Date.parse(p.reviewed_at)>7*86400000||
    !ID.test(p.reviewer_id)||!ID.test(p.key_id))
    return hold('HOLD_RECONCILIATION_SCOPE','Independent post-change report conflicts with signed operator/witness outcome or timeline.');
  const key=signer(env,18,p.key_id);
  if(!key)return hold('HOLD_RECONCILIATION_KEY_INDEPENDENCE','A nineteenth independent reconciler signer is required.');
  if(!await verify(readback.envelope,transcript,key))return hold('HOLD_RECONCILIATION_SIGNATURE','Post-change reconciler signature invalid.');
  return hold(clean?'SIGNED_EXTERNAL_POSTCHANGE_CONSISTENCY_CLAIM':'SIGNED_EXTERNAL_POSTCHANGE_EXCEPTION_HOLD',
    'Independent reviewer signed an outcome report; database state and immutable enforcement still require separate inspection.',
    {signature_authenticated:true,receipt_sha256:await sha256Receipt754(transcript),
      clean_claim:!!clean,reviewed_at:p.reviewed_at,outcome:p.outcome,
      independent_change_log_sha256:p.independent_change_log_sha256,
      storage_audit_sha256:p.storage_audit_sha256});
}
export async function verifyOwnerPostchange764({env,record,archive,execution,standby,reconciliation,
  envelope,now=Date.now()}={}){
  const p=envelope?.payload;let transcript;
  try{transcript=canonicalOwnerPostchange764(p);}catch{return hold('HOLD_OWNER_POSTCHANGE_FORMAT','Noncanonical owner post-change decision.');}
  const clean=reconciliation?.clean_claim&&execution?.clean_claim&&standby?.clean_claim;
  if(p.schema!=='rosie-owner-postchange-evidence-review-v764'||!common(p,record,archive)||
    !archive?.signature_authenticated||!execution?.signature_authenticated||
    !standby?.signature_authenticated||!reconciliation?.signature_authenticated||
    p.gate_archive_receipt_sha256!==archive.receipt_sha256||
    p.execution_receipt_sha256!==execution.receipt_sha256||
    p.standby_receipt_sha256!==standby.receipt_sha256||
    p.reconciliation_receipt_sha256!==reconciliation.receipt_sha256||
    p.decision!==(clean?'ACKNOWLEDGE_EXTERNAL_CLAIMS_FOR_SEPARATE_DB_AUDIT':'HOLD_POSTCHANGE_EXCEPTION')||
    !ID.test(p.owner_id)||!ID.test(p.key_id)||!/^[a-f0-9]{32,64}$/i.test(p.nonce)||
    !utc(p.issued_at)||Date.parse(p.issued_at)<Date.parse(reconciliation.reviewed_at)||
    Date.parse(p.issued_at)>now+300000||now-Date.parse(p.issued_at)>7*86400000)
    return hold('HOLD_OWNER_POSTCHANGE_SCOPE','Owner post-change decision is not tied to the signed external reports or required HOLD.');
  const key=signer(env,0,p.key_id);
  if(!key)return hold('HOLD_OWNER_POSTCHANGE_KEY_INDEPENDENCE','Original pinned owner identity required among nineteen distinct signers.');
  if(!await verify(envelope,transcript,key))return hold('HOLD_OWNER_POSTCHANGE_SIGNATURE','Owner signature invalid.');
  return hold(clean?'SIGNED_OWNER_EXTERNAL_POSTCHANGE_AUDIT_ACKNOWLEDGEMENT':'SIGNED_OWNER_POSTCHANGE_EXCEPTION_HOLD',
    'Owner signed a review acknowledgement, never business closure or permission for further SQL.',
    {signature_authenticated:true,receipt_sha256:await sha256Receipt754(transcript),
      clean_acknowledgement:!!clean,issued_at:p.issued_at,decision:p.decision,closure_allowed:false});
}
export async function reconcilePostchange764({archive,execution,standby,reconciliation,owner,
  reviewed_at=new Date().toISOString()}={}){
  const follow_ups=[];
  if(!archive?.signature_authenticated)
    follow_ups.push({code:'HISTORICAL_BUILD763_GATE_NOT_AUTHENTICATED',
      action:'Obtain the independently signed, timestamped, exact-ticket historical gate archive.'});
  if(!execution?.signature_authenticated)
    follow_ups.push({code:'EXTERNAL_PRODUCTION_EXECUTION_RECEIPT_UNVERIFIED',
      action:'Get the named operator’s signed exact-window execution or failure/incident receipt.'});
  else if(!execution.clean_claim)
    follow_ups.push({code:'EXTERNAL_PRODUCTION_EXECUTION_EXCEPTION',
      action:'Preserve original failed-operation and recovery receipts; incident remains open.'});
  if(!standby?.signature_authenticated)
    follow_ups.push({code:'INDEPENDENT_ROLLBACK_STANDBY_UNVERIFIED',
      action:'Obtain the independently signed standby observation tied to the operator receipt.'});
  else if(!standby.clean_claim)
    follow_ups.push({code:'ROLLBACK_INCIDENT_OPEN',
      action:'Independent incident disposition and rollback evidence need separate approval and validation.'});
  if(!reconciliation?.signature_authenticated)
    follow_ups.push({code:'INDEPENDENT_POSTCHANGE_RECONCILIATION_UNVERIFIED',
      action:'Obtain independently signed outcome, change-log and storage evidence reconciliation.'});
  else if(!reconciliation.clean_claim)
    follow_ups.push({code:'INDEPENDENT_POSTCHANGE_EXCEPTION_HOLD',
      action:'Keep the discrepancy open; do not certify production state from signature alone.'});
  if(!owner?.signature_authenticated)
    follow_ups.push({code:'OWNER_POSTCHANGE_REVIEW_UNVERIFIED',
      action:'Sign an owner acknowledgement or explicit HOLD bound to every independent receipt.'});
  else if(!owner.clean_acknowledgement)
    follow_ups.push({code:'OWNER_POSTCHANGE_EXCEPTION_HOLD',
      action:'Owner has signed HOLD; no closure is permitted.'});
  follow_ups.push({code:'SEPARATE_PRODUCTION_DATABASE_OBSERVATION',
    action:'An independent DBA must verify actual database schema, migration history and backup/rollback outcome outside this application.'});
  follow_ups.push({code:'IMMUTABLE_OWNER_AUDIT_AND_BUSINESS_CLOSURE_HOLD',
    action:'No append-only owner audit migration, customer notification or business exception closure is authorized by this review.'});
  const ready=follow_ups.length===2;
  const result={ok:true,build:764,read_only:true,
    execution_gate_archive:archive||null,external_operator_execution:execution||null,
    independent_rollback_standby:standby||null,independent_outcome_reconciliation:reconciliation||null,
    owner_postchange_decision:owner||null,
    postchange_status:ready?'READY_FOR_SEPARATE_DATABASE_AUDIT_AND_OWNER_CLOSURE_REVIEW':
      'HOLD_POSTCHANGE_EXTERNAL_EVIDENCE_RECONCILIATION',
    external_execution_claim_authenticated:!!execution?.signature_authenticated,
    production_db_state_independently_verified_by_app:false,
    production_execution_authorized_by_app:false,production_migration_executed_by_app:false,
    rollback_executed_by_app:false,production_credentials_read:false,
    customer_notifications_sent_by_app:false,owner_closure_audit_persisted:false,
    closure_allowed:false,automatic_business_write:false,
    blocking_count:follow_ups.length,follow_ups,reviewed_at};
  result.packet_sha256=await digest(JSON.stringify({schema:'rosie-production-postchange-review-v764',
    archive:archive?.receipt_sha256||null,execution:execution?.receipt_sha256||null,
    standby:standby?.receipt_sha256||null,reconciliation:reconciliation?.receipt_sha256||null,
    owner:owner?.receipt_sha256||null,follow_ups,reviewed_at}));
  return result;
}
