import {sha256Receipt754} from './owner-receipt-verification-v754.js';

const ID=/^[A-Za-z0-9][A-Za-z0-9._:/-]{5,119}$/;
const UUID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const HASH=/^[a-f0-9]{64}$/i;
const utc=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(v)&&Number.isFinite(Date.parse(v));
const encode=value=>new TextEncoder().encode(value);
const digest=async value=>sha256Receipt754(typeof value==='string'?encode(value):value);
const hold=(status,detail,more={})=>({status,detail,signature_authenticated:false,receipt_sha256:null,...more});
const PREFIXES=[
  'OWNER_RECEIPT','SOURCE_WITNESS','HISTORY_CUSTODIAN','RETENTION_PROVIDER',
  'STORAGE_AUDITOR','DBA_REVIEW','SECURITY_REVIEW','ISOLATION_AUDITOR',
  'ROLLBACK_WITNESS','TRIAL_OPERATOR','TRIAL_RECONCILER','ROLLBACK_EXCEPTION',
  'CHANGE_CONTROL','PRODUCTION_DBA_AUTH','PRODUCTION_SECURITY_AUTH',
  'PRODUCTION_OPERATOR_GATE','PRODUCTION_ROLLBACK_READY',
  'PRODUCTION_GATE_ARCHIVIST','PRODUCTION_OUTCOME_RECONCILER',
  'PRODUCTION_DB_STATE_INSPECTOR','IMMUTABLE_AUDIT_ENFORCEMENT_INSPECTOR'
];
const ORIGINS=[
  'TRIAL_OPERATOR','TRIAL_RECONCILE','ROLLBACK_EXCEPTION','CHANGE_CONTROL',
  'PRODUCTION_DBA_AUTH','PRODUCTION_SECURITY_AUTH','PRODUCTION_OPERATOR_GATE',
  'PRODUCTION_ROLLBACK_READY','PRODUCTION_GATE_ARCHIVIST','PRODUCTION_OUTCOME_RECONCILER',
  'PRODUCTION_DB_STATE_INSPECTOR','IMMUTABLE_AUDIT_ENFORCEMENT_INSPECTOR'
];
function decoded(value,length){
  if(typeof value!=='string'||value.length>200||value.length%4||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))return null;
  try{const bytes=Uint8Array.from(atob(value),c=>c.charCodeAt(0));
    return bytes.length===length?bytes:null;}
  catch{return null;}
}
function signer(env,index,keyId){
  const ids=new Set(),fingerprints=new Set();let selected=null;
  for(const [i,prefix] of PREFIXES.entries()){
    const key=decoded(env?.[`ROSIE_ECONOMIC_${prefix}_PUBLIC_KEY_B64`],32);
    const id=env?.[`ROSIE_ECONOMIC_${prefix}_KEY_ID`];
    if(!key||!ID.test(id||'')||ids.has(id))return null;
    const fingerprint=Array.from(key).join(',');
    if(fingerprints.has(fingerprint))return null;
    ids.add(id);fingerprints.add(fingerprint);
    if(i===index&&id===keyId)selected=key;
  }
  return selected;
}
function origins(env){
  try{
    const urls=ORIGINS.map(prefix=>new URL(env?.[`ROSIE_ECONOMIC_${prefix}_BASE_URL`]));
    if(urls.some(u=>u.protocol!=='https:'||u.username||u.password||u.port||u.search||u.hash||
      u.pathname!=='/'||!u.hostname.includes('.')||u.hostname==='localhost'||
      /^(?:\d{1,3}\.){3}\d{1,3}$/.test(u.hostname)||u.hostname.startsWith('[')||
      /\.(?:local|localhost|internal)$/i.test(u.hostname))||
      new Set(urls.map(u=>u.origin)).size!==urls.length)return null;
    return urls;
  }catch{return null;}
}
function canonical(payload,fields,domain){
  if(!payload||typeof payload!=='object'||Array.isArray(payload)||
    Object.keys(payload).length!==fields.length||
    !fields.every(field=>Object.hasOwn(payload,field)&&typeof payload[field]==='string'))
    throw Error('Noncanonical receipt');
  return encode(domain+JSON.stringify(fields.map(field=>[field,payload[field]])));
}
async function signed(envelope,transcript,key){
  if(!key||!envelope||typeof envelope!=='object'||Array.isArray(envelope)||
    Object.keys(envelope).length!==2||!Object.hasOwn(envelope,'payload')||
    !Object.hasOwn(envelope,'signature_b64'))return false;
  const sig=decoded(envelope.signature_b64,64);if(!sig)return false;
  try{const imported=await crypto.subtle.importKey('raw',key,{name:'Ed25519'},false,['verify']);
    return crypto.subtle.verify('Ed25519',imported,sig,transcript);}
  catch{return false;}
}
export const DB_FIELDS765=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id','execution_request_id',
  'production_project_ref','gate_archive_receipt_sha256','execution_receipt_sha256',
  'standby_receipt_sha256','reconciliation_receipt_sha256','owner_postchange_receipt_sha256',
  'migration_artifact_sha256','migration_version','schema_after_sha256',
  'observed_schema_sha256','migration_history_sha256','db_identity_sha256',
  'read_only_inspection_transcript_sha256','observed_at','inspection_method',
  'state_result','inspector_id','key_id'
]);
export const AUDIT_FIELDS765=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id','execution_request_id',
  'production_project_ref','db_inspection_receipt_sha256','reconciliation_receipt_sha256',
  'prior_storage_audit_sha256','owner_postchange_receipt_sha256',
  'audit_table_definition_sha256','append_only_insert_probe_sha256',
  'update_denial_probe_sha256','delete_denial_probe_sha256','privilege_review_sha256',
  'rls_review_sha256','retention_policy_sha256','independent_log_chain_sha256',
  'observed_at','enforcement_result','auditor_id','key_id'
]);
export const OWNER_FIELDS765=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id','execution_request_id',
  'production_project_ref','owner_postchange_receipt_sha256','db_inspection_receipt_sha256',
  'audit_inspection_receipt_sha256','decision','owner_id','issued_at','nonce','key_id'
]);
export const canonicalDB765=p=>canonical(p,DB_FIELDS765,'rosie-independent-production-db-state-v765:');
export const canonicalAudit765=p=>canonical(p,AUDIT_FIELDS765,'rosie-independent-immutable-audit-enforcement-v765:');
export const canonicalOwner765=p=>canonical(p,OWNER_FIELDS765,'rosie-owner-closure-readiness-v765:');

const previousValid=(record,archive,execution,standby,reconciliation,owner)=>
  UUID.test(record?.booking_id||'')&&UUID.test(record?.source_record_id||'')&&
  ID.test(record?.change_ticket_id||'')&&ID.test(record?.execution_request_id||'')&&
  archive?.signature_authenticated&&execution?.signature_authenticated&&
  standby?.signature_authenticated&&reconciliation?.signature_authenticated&&
  owner?.signature_authenticated;
const same=(p,record,archive)=>p?.booking_id===record?.booking_id&&
  p?.source_record_id===record?.source_record_id&&p?.change_ticket_id===record?.change_ticket_id&&
  p?.execution_request_id===record?.execution_request_id&&
  p?.trial_id===archive?.trial_id&&p?.production_project_ref===archive?.production_project_ref;
const recent=(when,minimum,now)=>utc(when)&&Date.parse(when)>=Date.parse(minimum)&&
  Date.parse(when)<=now+300000&&now-Date.parse(when)<=7*86400000;

export function receiptURL765(env,kind,record,archive,execution,standby,reconciliation,owner,db){
  if(!previousValid(record,archive,execution,standby,reconciliation,owner))return null;
  const routes={
    db:['PRODUCTION_DB_STATE_INSPECTOR','/v1/economic-production-db-state-v765'],
    audit:['IMMUTABLE_AUDIT_ENFORCEMENT_INSPECTOR','/v1/economic-immutable-audit-enforcement-v765']
  };
  if(!Object.hasOwn(routes,kind)||(kind==='audit'&&!db?.signature_authenticated))return null;
  const urls=origins(env);if(!urls)return null;
  const [prefix,path]=routes[kind];
  const url=new URL(path,urls[ORIGINS.indexOf(prefix)]);
  for(const [key,value] of Object.entries({booking_id:record.booking_id,
    source_record_id:record.source_record_id,change_ticket_id:record.change_ticket_id,
    execution_request_id:record.execution_request_id,
    owner_postchange_receipt_sha256:owner.receipt_sha256,
    ...(kind==='audit'?{db_inspection_receipt_sha256:db.receipt_sha256}:{})}))
    url.searchParams.set(key,value);
  return url.toString();
}
export async function readReceipt765(env,kind,record,archive,execution,standby,reconciliation,
  owner,db,fetcher=fetch){
  const url=receiptURL765(env,kind,record,archive,execution,standby,reconciliation,owner,db);
  if(!url)return {status:`HOLD_${kind.toUpperCase()}_SOURCE_NOT_CONFIGURED`};
  try{
    const response=await fetcher(url,{method:'GET',redirect:'error',
      headers:{Accept:'application/json','Cache-Control':'no-store'}});
    if(!response.ok)return {status:`HOLD_${kind.toUpperCase()}_SOURCE_UNAVAILABLE`};
    const raw=await response.text();
    if(raw.length>16000)return {status:`HOLD_${kind.toUpperCase()}_SOURCE_OVERSIZED`};
    const envelope=JSON.parse(raw);
    if(!envelope||typeof envelope!=='object'||Array.isArray(envelope)||
      Object.keys(envelope).length!==2||!Object.hasOwn(envelope,'payload')||
      !Object.hasOwn(envelope,'signature_b64'))return {status:`HOLD_${kind.toUpperCase()}_SOURCE_FORMAT`};
    return {status:`SIGNED_${kind.toUpperCase()}_READBACK`,envelope};
  }catch{return {status:`HOLD_${kind.toUpperCase()}_SOURCE_UNAVAILABLE`};}
}
export async function verifyDB765({env,record,archive,execution,standby,reconciliation,owner,
  readback,now=Date.now()}={}){
  if(readback?.status!=='SIGNED_DB_READBACK')
    return hold(readback?.status||'HOLD_DB_STATE_MISSING','Independent database inspection not available.');
  const p=readback.envelope?.payload;let transcript;
  try{transcript=canonicalDB765(p);}catch{return hold('HOLD_DB_FORMAT','Noncanonical database state receipt.');}
  const consistent=p.state_result==='MATCHED_DIRECT_READ_ONLY_INSPECTION';
  if(p.schema!=='rosie-independent-production-db-state-v765'||!same(p,record,archive)||
    !previousValid(record,archive,execution,standby,reconciliation,owner)||
    !execution.clean_claim||!standby.clean_claim||!reconciliation.clean_claim||
    !owner.clean_acknowledgement||
    p.gate_archive_receipt_sha256!==archive.receipt_sha256||
    p.execution_receipt_sha256!==execution.receipt_sha256||
    p.standby_receipt_sha256!==standby.receipt_sha256||
    p.reconciliation_receipt_sha256!==reconciliation.receipt_sha256||
    p.owner_postchange_receipt_sha256!==owner.receipt_sha256||
    p.migration_artifact_sha256!==archive.migration_artifact_sha256||
    p.migration_version!==execution.migration_version||
    p.schema_after_sha256!==execution.schema_after_sha256||
    !['MATCHED_DIRECT_READ_ONLY_INSPECTION','MISMATCH_EXCEPTION_HELD'].includes(p.state_result)||
    (consistent&&p.observed_schema_sha256!==execution.schema_after_sha256)||
    !['observed_schema_sha256','migration_history_sha256','db_identity_sha256',
      'read_only_inspection_transcript_sha256'].every(k=>HASH.test(p[k]))||
    p.inspection_method!=='EXTERNAL_DIRECT_READ_ONLY_PG_CATALOG_AND_MIGRATION_HISTORY'||
    !recent(p.observed_at,owner.issued_at,now)||!ID.test(p.inspector_id)||!ID.test(p.key_id))
    return hold('HOLD_DB_SCOPE','Database inspection fails exact project, history, predecessor digest, timestamp or claimed schema state.');
  const key=signer(env,19,p.key_id);
  if(!key)return hold('HOLD_DB_SIGNER_INDEPENDENCE','Twenty-one unique signer identities required.');
  if(!origins(env))return hold('HOLD_DB_ORIGIN_INDEPENDENCE','Twelve distinct fixed HTTPS evidence origins required.');
  if(!await signed(readback.envelope,transcript,key))return hold('HOLD_DB_SIGNATURE','Database inspector signature invalid.');
  return hold(consistent?'SIGNED_DB_STATE_CONSISTENT_EXTERNAL_INSPECTION_CLAIM':'SIGNED_DB_STATE_MISMATCH_HOLD',
    'Authenticated independent inspection claim, not a direct database query by Rosie Dazzlers.',
    {signature_authenticated:true,receipt_sha256:await digest(transcript),clean_claim:consistent,
      observed_at:p.observed_at,db_identity_sha256:p.db_identity_sha256,
      migration_history_sha256:p.migration_history_sha256,
      read_only_inspection_transcript_sha256:p.read_only_inspection_transcript_sha256,
      production_db_state_verified_by_app:false});
}
export async function verifyAudit765({env,record,archive,execution,standby,reconciliation,owner,
  db,readback,now=Date.now()}={}){
  if(readback?.status!=='SIGNED_AUDIT_READBACK')
    return hold(readback?.status||'HOLD_AUDIT_MISSING','Independent immutable audit enforcement inspection not available.');
  const p=readback.envelope?.payload;let transcript;
  try{transcript=canonicalAudit765(p);}catch{return hold('HOLD_AUDIT_FORMAT','Noncanonical immutable audit enforcement receipt.');}
  const consistent=p.enforcement_result==='ALL_APPEND_ONLY_CONTROLS_OBSERVED_EXTERNAL';
  if(p.schema!=='rosie-independent-immutable-audit-enforcement-v765'||
    !same(p,record,archive)||!previousValid(record,archive,execution,standby,reconciliation,owner)||
    !db?.signature_authenticated||
    p.db_inspection_receipt_sha256!==db.receipt_sha256||
    p.reconciliation_receipt_sha256!==reconciliation.receipt_sha256||
    p.owner_postchange_receipt_sha256!==owner.receipt_sha256||
    p.prior_storage_audit_sha256!==reconciliation.storage_audit_sha256||
    !['audit_table_definition_sha256','append_only_insert_probe_sha256',
      'update_denial_probe_sha256','delete_denial_probe_sha256','privilege_review_sha256',
      'rls_review_sha256','retention_policy_sha256','independent_log_chain_sha256']
      .every(k=>HASH.test(p[k]))||
    !['ALL_APPEND_ONLY_CONTROLS_OBSERVED_EXTERNAL','ENFORCEMENT_EXCEPTION_HELD']
      .includes(p.enforcement_result)||
    !recent(p.observed_at,db.observed_at,now)||!ID.test(p.auditor_id)||!ID.test(p.key_id))
    return hold('HOLD_AUDIT_SCOPE','Audit enforcement proof lacks exact scope, read-only observations, time or evidence-chain hashes.');
  const key=signer(env,20,p.key_id);
  if(!key)return hold('HOLD_AUDIT_SIGNER_INDEPENDENCE','Separate twenty-first immutable audit inspector signer required.');
  if(!origins(env))return hold('HOLD_AUDIT_ORIGIN_INDEPENDENCE','Twelve distinct fixed HTTPS evidence origins required.');
  if(!await signed(readback.envelope,transcript,key))return hold('HOLD_AUDIT_SIGNATURE','Immutable audit inspector signature invalid.');
  return hold(consistent?'SIGNED_IMMUTABLE_ENFORCEMENT_EXTERNAL_CLAIM':'SIGNED_AUDIT_ENFORCEMENT_EXCEPTION_HOLD',
    'Signed independent audit-enforcement observations, not verified append-only enforcement by this website.',
    {signature_authenticated:true,receipt_sha256:await digest(transcript),clean_claim:consistent,
      observed_at:p.observed_at,independent_log_chain_sha256:p.independent_log_chain_sha256,
      retention_policy_sha256:p.retention_policy_sha256,
      immutable_storage_proven_by_app:false});
}
export async function verifyOwner765({env,record,archive,owner,db,audit,envelope,
  now=Date.now()}={}){
  const p=envelope?.payload;let transcript;
  try{transcript=canonicalOwner765(p);}catch{return hold('HOLD_OWNER_CLOSURE_FORMAT','Noncanonical signed owner decision.');}
  const clean=!!(db?.clean_claim&&audit?.clean_claim);
  const decision=clean?'ACKNOWLEDGE_FOR_SEPARATE_OWNER_CLOSURE_AUTHORIZATION':
    'HOLD_CLOSURE_EXCEPTION';
  if(p.schema!=='rosie-owner-closure-readiness-v765'||!same(p,record,archive)||
    !owner?.signature_authenticated||!db?.signature_authenticated||!audit?.signature_authenticated||
    p.owner_postchange_receipt_sha256!==owner.receipt_sha256||
    p.db_inspection_receipt_sha256!==db.receipt_sha256||
    p.audit_inspection_receipt_sha256!==audit.receipt_sha256||p.decision!==decision||
    !recent(p.issued_at,audit.observed_at,now)||!ID.test(p.owner_id)||!ID.test(p.key_id)||
    !/^[a-f0-9]{32,64}$/i.test(p.nonce))
    return hold('HOLD_OWNER_CLOSURE_SCOPE','Owner decision must bind the independent evidence and cannot authorize closure.');
  const key=signer(env,0,p.key_id);
  if(!key)return hold('HOLD_OWNER_CLOSURE_SIGNER_INDEPENDENCE','Original owner key and twenty independent unique signer IDs/keys required.');
  if(!origins(env))return hold('HOLD_OWNER_CLOSURE_ORIGIN_INDEPENDENCE','Twelve independent provider origins required.');
  if(!await signed(envelope,transcript,key))return hold('HOLD_OWNER_CLOSURE_SIGNATURE','Owner closure-readiness signature invalid.');
  return hold(clean?'SIGNED_OWNER_READY_FOR_SEPARATE_CLOSURE_AUTHORIZATION':'SIGNED_OWNER_CLOSURE_EXCEPTION_HOLD',
    'Owner signed evidence review only; no closure or new production migration authority issued.',
    {signature_authenticated:true,receipt_sha256:await digest(transcript),clean_acknowledgement:clean,
      issued_at:p.issued_at,decision:p.decision,closure_allowed:false});
}
export async function reconcileClosure765({archive,execution,standby,reconciliation,postchangeOwner,db,audit,owner,
  reviewed_at=new Date().toISOString()}={}){
  const follow_ups=[];
  for(const [code,receipt] of [
    ['HISTORICAL_GATE',archive],['EXTERNAL_OPERATOR',execution],['ROLLBACK_STANDBY',standby],
    ['POSTCHANGE_RECONCILIATION',reconciliation],['POSTCHANGE_OWNER',postchangeOwner]
  ]){
    if(!receipt?.signature_authenticated)follow_ups.push({code:`${code}_UNVERIFIED`,
      action:'Obtain authentic exact-ticket, independently signed Build 764 predecessor evidence.'});
    else if('clean_claim' in receipt&&!receipt.clean_claim||
      'clean_acknowledgement' in receipt&&!receipt.clean_acknowledgement)
      follow_ups.push({code:`${code}_EXCEPTION`,action:'Prior signed exception is still on HOLD.'});
  }
  if(!db?.signature_authenticated)follow_ups.push({code:'DIRECT_DATABASE_INSPECTION_UNVERIFIED',
    action:'Independent DBA must sign a direct read-only production schema and migration-history observation.'});
  else if(!db.clean_claim)follow_ups.push({code:'DATABASE_STATE_MISMATCH',
    action:'Preserve the mismatched schema and migration evidence; do not close.'});
  if(!audit?.signature_authenticated)follow_ups.push({code:'IMMUTABLE_AUDIT_ENFORCEMENT_UNVERIFIED',
    action:'Independent storage auditor must sign append-only denial, privileges, RLS, retention and chain observations.'});
  else if(!audit.clean_claim)follow_ups.push({code:'IMMUTABLE_ENFORCEMENT_EXCEPTION',
    action:'Audit enforcement discrepancy remains open; no immutable retention certification.'});
  if(!owner?.signature_authenticated)follow_ups.push({code:'OWNER_CLOSURE_READINESS_UNVERIFIED',
    action:'Owner must sign an evidence-bound readiness acknowledgement or explicit HOLD.'});
  else if(!owner.clean_acknowledgement)follow_ups.push({code:'OWNER_CLOSURE_EXCEPTION',
    action:'Owner signed HOLD; investigate and retain external incident evidence.'});
  follow_ups.push({code:'SEPARATE_BUSINESS_CLOSURE_CHANGE_CONTROL',
    action:'Require a new explicit, independently authorized owner closure action and separately persisted append-only owner audit entry. This review cannot close anything.'});
  const ready=follow_ups.length===1;
  const result={ok:true,build:765,read_only:true,
    historical_gate_archive:archive||null,external_execution:execution||null,
    rollback_standby:standby||null,postchange_reconciliation:reconciliation||null,
    postchange_owner_decision:postchangeOwner||null,
    independent_production_database_inspection:db||null,
    independent_immutable_audit_enforcement:audit||null,
    owner_closure_readiness_decision:owner||null,
    closure_readiness_status:ready?'READY_FOR_SEPARATE_OWNER_CLOSURE_AUTHORIZATION':
      'HOLD_INDEPENDENT_DATABASE_AUDIT_OR_OWNER_EVIDENCE',
    direct_production_database_connection:false,production_db_state_verified_by_app:false,
    immutable_enforcement_proven_by_app:false,external_inspection_claims_authenticated:
      !!db?.signature_authenticated&&!!audit?.signature_authenticated,
    production_sql_executed_by_app:false,owner_closure_audit_persisted:false,
    customer_notifications_sent_by_app:false,closure_allowed:false,automatic_business_write:false,
    blocking_count:follow_ups.length,follow_ups,reviewed_at};
  result.packet_sha256=await digest(JSON.stringify({schema:'rosie-independent-db-closure-review-v765',
    archive:archive?.receipt_sha256||null,execution:execution?.receipt_sha256||null,
    standby:standby?.receipt_sha256||null,reconciliation:reconciliation?.receipt_sha256||null,
    postchange_owner:postchangeOwner?.receipt_sha256||null,db:db?.receipt_sha256||null,
    audit:audit?.receipt_sha256||null,owner:owner?.receipt_sha256||null,follow_ups,reviewed_at}));
  return result;
}
