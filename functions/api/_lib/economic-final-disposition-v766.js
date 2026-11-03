import {sha256Receipt754} from './owner-receipt-verification-v754.js';

const ID=/^[A-Za-z0-9][A-Za-z0-9._:/-]{5,119}$/;
const UUID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const HASH=/^[a-f0-9]{64}$/i;
const utc=value=>typeof value==='string'&&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(value)&&Number.isFinite(Date.parse(value));
const bytes=value=>new TextEncoder().encode(value);
const digest=value=>sha256Receipt754(typeof value==='string'?bytes(value):value);
const hold=(status,detail,more={})=>({status,detail,signature_authenticated:false,receipt_sha256:null,...more});
const PREFIXES=[
  'OWNER_RECEIPT','SOURCE_WITNESS','HISTORY_CUSTODIAN','RETENTION_PROVIDER',
  'STORAGE_AUDITOR','DBA_REVIEW','SECURITY_REVIEW','ISOLATION_AUDITOR',
  'ROLLBACK_WITNESS','TRIAL_OPERATOR','TRIAL_RECONCILER','ROLLBACK_EXCEPTION',
  'CHANGE_CONTROL','PRODUCTION_DBA_AUTH','PRODUCTION_SECURITY_AUTH',
  'PRODUCTION_OPERATOR_GATE','PRODUCTION_ROLLBACK_READY',
  'PRODUCTION_GATE_ARCHIVIST','PRODUCTION_OUTCOME_RECONCILER',
  'PRODUCTION_DB_STATE_INSPECTOR','IMMUTABLE_AUDIT_ENFORCEMENT_INSPECTOR',
  'CLOSURE_DECISION_CUSTODIAN','FINAL_EXCEPTION_DISPOSITION_REVIEWER'
];
const ORIGINS=[
  'TRIAL_OPERATOR','TRIAL_RECONCILE','ROLLBACK_EXCEPTION','CHANGE_CONTROL',
  'PRODUCTION_DBA_AUTH','PRODUCTION_SECURITY_AUTH','PRODUCTION_OPERATOR_GATE',
  'PRODUCTION_ROLLBACK_READY','PRODUCTION_GATE_ARCHIVIST','PRODUCTION_OUTCOME_RECONCILER',
  'PRODUCTION_DB_STATE_INSPECTOR','IMMUTABLE_AUDIT_ENFORCEMENT_INSPECTOR',
  'CLOSURE_DECISION_CUSTODIAN','FINAL_EXCEPTION_DISPOSITION_REVIEWER'
];
function decode(value,size){
  if(typeof value!=='string'||value.length>200||value.length%4||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))return null;
  try{const decoded=Uint8Array.from(atob(value),c=>c.charCodeAt(0));
    return decoded.length===size?decoded:null;}
  catch{return null;}
}
function publicKey(env,index,id){
  const ids=new Set(),keys=new Set();let selected=null;
  for(const [i,prefix] of PREFIXES.entries()){
    const key=decode(env?.[`ROSIE_ECONOMIC_${prefix}_PUBLIC_KEY_B64`],32);
    const keyId=env?.[`ROSIE_ECONOMIC_${prefix}_KEY_ID`];
    if(!key||!ID.test(keyId||'')||ids.has(keyId))return null;
    const fingerprint=Array.from(key).join(',');
    if(keys.has(fingerprint))return null;
    ids.add(keyId);keys.add(fingerprint);
    if(i===index&&id===keyId)selected=key;
  }
  return selected;
}
function safeOrigins(env){
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
    !fields.every(k=>Object.hasOwn(payload,k)&&typeof payload[k]==='string'))
    throw Error('Noncanonical independent closure record.');
  return bytes(domain+JSON.stringify(fields.map(k=>[k,payload[k]])));
}
async function verify(envelope,transcript,key){
  if(!key||!envelope||typeof envelope!=='object'||Array.isArray(envelope)||
    Object.keys(envelope).length!==2||!Object.hasOwn(envelope,'payload')||
    !Object.hasOwn(envelope,'signature_b64'))return false;
  const signature=decode(envelope.signature_b64,64);if(!signature)return false;
  try{
    const imported=await crypto.subtle.importKey('raw',key,{name:'Ed25519'},false,['verify']);
    return crypto.subtle.verify('Ed25519',imported,signature,transcript);
  }catch{return false;}
}
export const OWNER_AUTH_FIELDS766=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id','execution_request_id',
  'production_project_ref','owner_postchange_receipt_sha256',
  'db_inspection_receipt_sha256','audit_inspection_receipt_sha256',
  'owner_readiness_receipt_sha256','decision','authorization_ticket_id',
  'owner_id','issued_at','nonce','key_id'
]);
export const LEDGER_FIELDS766=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id','execution_request_id',
  'production_project_ref','owner_authorization_receipt_sha256',
  'owner_readiness_receipt_sha256','audit_inspection_receipt_sha256',
  'independent_log_chain_sha256','ledger_entry_id','ledger_previous_sha256',
  'ledger_entry_sha256','storage_enforcement_proof_sha256','retention_policy_sha256',
  'stored_decision','custody_result','recorded_at','custodian_id','key_id'
]);
export const DISPOSITION_FIELDS766=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id','execution_request_id',
  'production_project_ref','owner_authorization_receipt_sha256',
  'ledger_decision_receipt_sha256','db_inspection_receipt_sha256',
  'audit_inspection_receipt_sha256','incident_register_sha256',
  'exception_register_sha256','unresolved_critical_count',
  'exception_state','disposition','reviewed_at','reviewer_id','key_id'
]);
export const canonicalOwner766=p=>canonical(p,OWNER_AUTH_FIELDS766,'rosie-owner-independent-closure-authorization-v766:');
export const canonicalLedger766=p=>canonical(p,LEDGER_FIELDS766,'rosie-external-append-only-closure-decision-v766:');
export const canonicalDisposition766=p=>canonical(p,DISPOSITION_FIELDS766,'rosie-independent-final-exception-disposition-v766:');

const same=(p,record,archive)=>p?.booking_id===record?.booking_id&&
  p?.source_record_id===record?.source_record_id&&
  p?.change_ticket_id===record?.change_ticket_id&&
  p?.execution_request_id===record?.execution_request_id&&
  p?.trial_id===archive?.trial_id&&p?.production_project_ref===archive?.production_project_ref;
const validRecord=r=>UUID.test(r?.booking_id||'')&&UUID.test(r?.source_record_id||'')&&
  ID.test(r?.change_ticket_id||'')&&ID.test(r?.execution_request_id||'');
const recent=(when,after,now)=>utc(when)&&utc(after)&&Date.parse(when)>=Date.parse(after)&&
  Date.parse(when)<=now+300000&&now-Date.parse(when)<=7*86400000;
const hasPrior=(prior)=>prior?.summary?.closure_readiness_status===
  'READY_FOR_SEPARATE_OWNER_CLOSURE_AUTHORIZATION'&&
  prior?.owner?.signature_authenticated&&prior.owner.clean_acknowledgement&&
  prior?.db?.signature_authenticated&&prior.db.clean_claim&&
  prior?.audit?.signature_authenticated&&prior.audit.clean_claim&&
  prior?.postchangeOwner?.signature_authenticated&&
  prior.postchangeOwner.clean_acknowledgement;

export async function verifyOwnerAuthorization766({env,record,prior,envelope,now=Date.now()}={}){
  const p=envelope?.payload;let transcript;
  try{transcript=canonicalOwner766(p);}catch{return hold('HOLD_OWNER_AUTH_FORMAT','Noncanonical owner authorization.');}
  if(p.schema!=='rosie-owner-independent-closure-authorization-v766'||
    !validRecord(record)||!same(p,record,prior?.archive)||
    !hasPrior(prior)||
    p.owner_postchange_receipt_sha256!==prior.postchangeOwner.receipt_sha256||
    p.db_inspection_receipt_sha256!==prior.db.receipt_sha256||
    p.audit_inspection_receipt_sha256!==prior.audit.receipt_sha256||
    p.owner_readiness_receipt_sha256!==prior.owner.receipt_sha256||
    !['AUTHORIZE_EXTERNAL_MANUAL_CLOSURE_REVIEW_ONLY','HOLD_FINAL_CLOSURE_EXCEPTION'].includes(p.decision)||
    !ID.test(p.authorization_ticket_id)||!ID.test(p.owner_id)||!ID.test(p.key_id)||
    !/^[a-f0-9]{32,64}$/i.test(p.nonce)||!recent(p.issued_at,prior.owner.issued_at,now))
    return hold('HOLD_OWNER_AUTH_SCOPE','Owner authorization must bind current authentic Build 765 evidence, ticket, project and time.');
  const key=publicKey(env,0,p.key_id);
  if(!key)return hold('HOLD_OWNER_AUTH_SIGNER_INDEPENDENCE','Original owner signer and all 23 independent roles are required.');
  if(!safeOrigins(env))return hold('HOLD_OWNER_AUTH_ORIGIN_INDEPENDENCE','Fourteen separate pinned HTTPS source origins required.');
  if(!await verify(envelope,transcript,key))return hold('HOLD_OWNER_AUTH_SIGNATURE','Owner authorization signature invalid.');
  const allowed=p.decision==='AUTHORIZE_EXTERNAL_MANUAL_CLOSURE_REVIEW_ONLY';
  return hold(allowed?'SIGNED_OWNER_EXTERNAL_MANUAL_REVIEW_AUTHORIZATION':'SIGNED_OWNER_FINAL_HOLD',
    'The owner signed an external manual change-review decision; this application has no closure authority.',
    {signature_authenticated:true,receipt_sha256:await digest(transcript),
      authorizes_external_manual_review_only:allowed,issued_at:p.issued_at,
      decision:p.decision,authorization_ticket_id:p.authorization_ticket_id,
      owner_id:p.owner_id,closure_executed_by_app:false});
}
export function receiptURL766(env,kind,record,prior,owner,ledger){
  if(!validRecord(record)||!hasPrior(prior)||!owner?.signature_authenticated)return null;
  const routes={
    ledger:['CLOSURE_DECISION_CUSTODIAN','/v1/economic-closure-ledger-decision-v766'],
    disposition:['FINAL_EXCEPTION_DISPOSITION_REVIEWER','/v1/economic-final-exception-disposition-v766']
  };
  if(!Object.hasOwn(routes,kind)||(kind==='disposition'&&!ledger?.signature_authenticated))return null;
  const urls=safeOrigins(env);if(!urls)return null;
  const [prefix,path]=routes[kind];const url=new URL(path,urls[ORIGINS.indexOf(prefix)]);
  const params={booking_id:record.booking_id,source_record_id:record.source_record_id,
    change_ticket_id:record.change_ticket_id,execution_request_id:record.execution_request_id,
    owner_authorization_receipt_sha256:owner.receipt_sha256,
    ...(kind==='disposition'?{ledger_decision_receipt_sha256:ledger.receipt_sha256}:{})};
  for(const [k,v] of Object.entries(params))url.searchParams.set(k,v);
  return url.toString();
}
export async function readReceipt766(env,kind,record,prior,owner,ledger,fetcher=fetch){
  const url=receiptURL766(env,kind,record,prior,owner,ledger);
  if(!url)return {status:`HOLD_${kind.toUpperCase()}_SOURCE_NOT_CONFIGURED`};
  try{
    const response=await fetcher(url,{method:'GET',redirect:'error',
      headers:{Accept:'application/json','Cache-Control':'no-store'}});
    if(!response.ok)return {status:`HOLD_${kind.toUpperCase()}_SOURCE_UNAVAILABLE`};
    const raw=await response.text();if(raw.length>16000)
      return {status:`HOLD_${kind.toUpperCase()}_SOURCE_OVERSIZED`};
    const envelope=JSON.parse(raw);
    if(!envelope||typeof envelope!=='object'||Array.isArray(envelope)||
      Object.keys(envelope).length!==2||!Object.hasOwn(envelope,'payload')||
      !Object.hasOwn(envelope,'signature_b64'))
      return {status:`HOLD_${kind.toUpperCase()}_SOURCE_FORMAT`};
    return {status:`SIGNED_${kind.toUpperCase()}_READBACK`,envelope};
  }catch{return {status:`HOLD_${kind.toUpperCase()}_SOURCE_UNAVAILABLE`};}
}
export async function verifyLedger766({env,record,prior,owner,readback,now=Date.now()}={}){
  if(readback?.status!=='SIGNED_LEDGER_READBACK')
    return hold(readback?.status||'HOLD_LEDGER_MISSING','Independent append-only decision receipt not available.');
  const p=readback.envelope?.payload;let transcript;
  try{transcript=canonicalLedger766(p);}catch{return hold('HOLD_LEDGER_FORMAT','Noncanonical custodian ledger decision.');}
  const recorded=p.custody_result==='APPEND_ONLY_DECISION_RECORDED_EXTERNAL';
  if(p.schema!=='rosie-external-append-only-closure-decision-v766'||
    !same(p,record,prior?.archive)||!hasPrior(prior)||!owner?.signature_authenticated||
    p.owner_authorization_receipt_sha256!==owner.receipt_sha256||
    p.owner_readiness_receipt_sha256!==prior.owner.receipt_sha256||
    p.audit_inspection_receipt_sha256!==prior.audit.receipt_sha256||
    p.independent_log_chain_sha256!==prior.audit.independent_log_chain_sha256||
    p.retention_policy_sha256!==prior.audit.retention_policy_sha256||
    p.stored_decision!==owner.decision||
    !ID.test(p.ledger_entry_id)||!ID.test(p.custodian_id)||!ID.test(p.key_id)||
    !['ledger_previous_sha256','ledger_entry_sha256','storage_enforcement_proof_sha256']
      .every(k=>HASH.test(p[k]))||
    !['APPEND_ONLY_DECISION_RECORDED_EXTERNAL','STORAGE_EXCEPTION_HOLD'].includes(p.custody_result)||
    !recent(p.recorded_at,owner.issued_at,now))
    return hold('HOLD_LEDGER_SCOPE','Custodian receipt conflicts with exact owner decision, lineage, retention proof or chronology.');
  const key=publicKey(env,21,p.key_id);
  if(!key)return hold('HOLD_LEDGER_SIGNER_INDEPENDENCE','A distinct twenty-second custodian signer is required.');
  if(!safeOrigins(env))return hold('HOLD_LEDGER_ORIGIN_INDEPENDENCE','Fourteen distinct evidence origins required.');
  if(!await verify(readback.envelope,transcript,key))return hold('HOLD_LEDGER_SIGNATURE','Custodian signature invalid.');
  return hold(recorded?'SIGNED_EXTERNAL_APPEND_ONLY_DECISION_CUSTODY_CLAIM':'SIGNED_LEDGER_STORAGE_EXCEPTION_HOLD',
    'The custodian signed a decision persistence claim; this site has not itself written or verified immutable storage.',
    {signature_authenticated:true,receipt_sha256:await digest(transcript),
      clean_claim:recorded,recorded_at:p.recorded_at,ledger_entry_id:p.ledger_entry_id,
      ledger_entry_sha256:p.ledger_entry_sha256,ledger_previous_sha256:p.ledger_previous_sha256,
      immutable_storage_proven_by_app:false});
}
export async function verifyDisposition766({env,record,prior,owner,ledger,readback,now=Date.now()}={}){
  if(readback?.status!=='SIGNED_DISPOSITION_READBACK')
    return hold(readback?.status||'HOLD_DISPOSITION_MISSING','Independent final exception disposition not available.');
  const p=readback.envelope?.payload;let transcript;
  try{transcript=canonicalDisposition766(p);}catch{return hold('HOLD_DISPOSITION_FORMAT','Noncanonical final disposition review.');}
  const clean=p.disposition==='AUTHORIZED_FOR_SEPARATE_MANUAL_CLOSURE_HANDOFF';
  const eligible=owner?.authorizes_external_manual_review_only&&ledger?.clean_claim;
  if(p.schema!=='rosie-independent-final-exception-disposition-v766'||
    !same(p,record,prior?.archive)||!hasPrior(prior)||
    !owner?.signature_authenticated||!ledger?.signature_authenticated||
    p.owner_authorization_receipt_sha256!==owner.receipt_sha256||
    p.ledger_decision_receipt_sha256!==ledger.receipt_sha256||
    p.db_inspection_receipt_sha256!==prior.db.receipt_sha256||
    p.audit_inspection_receipt_sha256!==prior.audit.receipt_sha256||
    !HASH.test(p.incident_register_sha256)||!HASH.test(p.exception_register_sha256)||
    !/^(?:0|[1-9]\d{0,5})$/.test(p.unresolved_critical_count)||
    !['NO_OPEN_EXCEPTION_CLAIM','EXCEPTIONS_OPEN_HOLD'].includes(p.exception_state)||
    !['AUTHORIZED_FOR_SEPARATE_MANUAL_CLOSURE_HANDOFF','FINAL_EXCEPTION_HOLD'].includes(p.disposition)||
    (clean&&(!eligible||p.unresolved_critical_count!=='0'||
      p.exception_state!=='NO_OPEN_EXCEPTION_CLAIM'))||
    (!clean&&p.exception_state!=='EXCEPTIONS_OPEN_HOLD')||
    !recent(p.reviewed_at,ledger.recorded_at,now)||
    !ID.test(p.reviewer_id)||!ID.test(p.key_id))
    return hold('HOLD_DISPOSITION_SCOPE','Independent final review cannot clear an exception, unrecorded authorization or mismatched evidence.');
  const key=publicKey(env,22,p.key_id);
  if(!key)return hold('HOLD_DISPOSITION_SIGNER_INDEPENDENCE','A separate twenty-third exception reviewer signer is required.');
  if(!safeOrigins(env))return hold('HOLD_DISPOSITION_ORIGIN_INDEPENDENCE','Fourteen distinct fixed HTTPS origins required.');
  if(!await verify(readback.envelope,transcript,key))return hold('HOLD_DISPOSITION_SIGNATURE','Final exception reviewer signature invalid.');
  return hold(clean?'SIGNED_FINAL_EXTERNAL_HANDOFF_READINESS_CLAIM':'SIGNED_FINAL_EXCEPTION_HOLD',
    'Signed independent exception-register review, not proof of closure execution or legal release.',
    {signature_authenticated:true,receipt_sha256:await digest(transcript),clean_claim:clean,
      reviewed_at:p.reviewed_at,unresolved_critical_count:p.unresolved_critical_count,
      exception_state:p.exception_state,external_handoff_only:true});
}
export async function reconcileFinal766({prior,owner,ledger,disposition,
  reviewed_at=new Date().toISOString()}={}){
  const follow_ups=[];
  if(!hasPrior(prior))follow_ups.push({code:'BUILD765_INDEPENDENT_EVIDENCE_NOT_CLEAN',
    action:'Re-authenticate exact historical operator, DBA, audit enforcement and owner readiness receipts. Any exception stays HOLD.'});
  if(!owner?.signature_authenticated)follow_ups.push({code:'OWNER_EXPLICIT_AUTHORIZATION_UNVERIFIED',
    action:'Obtain the original owner’s signed external-manual-review authorization or signed HOLD.'});
  else if(!owner.authorizes_external_manual_review_only)
    follow_ups.push({code:'OWNER_FINAL_HOLD',action:'Owner signed HOLD. No external closure handoff authorized.'});
  if(!ledger?.signature_authenticated)follow_ups.push({code:'APPEND_ONLY_DECISION_RECEIPT_UNVERIFIED',
    action:'Obtain the independent custodian’s signed append-only decision receipt and original ledger evidence.'});
  else if(!ledger.clean_claim)follow_ups.push({code:'APPEND_ONLY_STORAGE_EXCEPTION',
    action:'Retain storage incident evidence. The append-only decision claim was not clean.'});
  if(!disposition?.signature_authenticated)follow_ups.push({code:'INDEPENDENT_FINAL_DISPOSITION_UNVERIFIED',
    action:'Obtain a separate signed exception-register disposition tied to the owner and ledger receipt.'});
  else if(!disposition.clean_claim)follow_ups.push({code:'FINAL_EXCEPTION_DISPOSITION_HOLD',
    action:'Open exception or incident prevents final handoff.'});
  follow_ups.push({code:'EXTERNAL_MANUAL_CLOSURE_AND_PROOF_REQUIRED',
    action:'A separately controlled external closure action, operator execution receipt, independent readback and business record update are still required. This site cannot perform or attest them.'});
  const ready=follow_ups.length===1;
  const result={ok:true,build:766,read_only:true,
    predecessor_review_status:prior?.summary?.closure_readiness_status||'HOLD',
    historical_owner_readiness:prior?.owner||null,
    owner_external_manual_authorization:owner||null,
    independent_append_only_decision_custody:ledger||null,
    independent_final_exception_disposition:disposition||null,
    final_disposition_status:ready?'READY_FOR_SEPARATE_CONTROLLED_EXTERNAL_CLOSURE_HANDOFF':
      'HOLD_FINAL_OWNER_AUTHORIZATION_CUSTODY_OR_DISPOSITION',
    owner_authorization_claim_authenticated:!!owner?.signature_authenticated,
    append_only_custody_claim_authenticated:!!ledger?.signature_authenticated,
    final_disposition_claim_authenticated:!!disposition?.signature_authenticated,
    external_closure_executed_or_verified_by_app:false,
    immutable_ledger_verified_by_app:false,production_db_connected_by_app:false,
    owner_closure_audit_persisted_by_app:false,customer_notifications_sent_by_app:false,
    closure_allowed:false,automatic_business_write:false,
    blocking_count:follow_ups.length,follow_ups,reviewed_at};
  result.packet_sha256=await digest(JSON.stringify({schema:'rosie-independent-final-disposition-review-v766',
    prior_owner:prior?.owner?.receipt_sha256||null,db:prior?.db?.receipt_sha256||null,
    audit:prior?.audit?.receipt_sha256||null,owner:owner?.receipt_sha256||null,
    ledger:ledger?.receipt_sha256||null,disposition:disposition?.receipt_sha256||null,
    follow_ups,reviewed_at}));
  return result;
}
