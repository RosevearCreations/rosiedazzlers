import {sha256Receipt754} from './owner-receipt-verification-v754.js';

// Read-only original-source and owner decision review. This module has no writer.
const ID=/^[A-Za-z0-9][A-Za-z0-9._:/-]{5,119}$/;
const UUID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const HASH=/^[a-f0-9]{64}$/i;
export const KEY_ROLES768=[
  'OWNER_RECEIPT','SOURCE_WITNESS','HISTORY_CUSTODIAN','RETENTION_PROVIDER',
  'STORAGE_AUDITOR','DBA_REVIEW','SECURITY_REVIEW','ISOLATION_AUDITOR',
  'ROLLBACK_WITNESS','TRIAL_OPERATOR','TRIAL_RECONCILER','ROLLBACK_EXCEPTION',
  'CHANGE_CONTROL','PRODUCTION_DBA_AUTH','PRODUCTION_SECURITY_AUTH',
  'PRODUCTION_OPERATOR_GATE','PRODUCTION_ROLLBACK_READY',
  'PRODUCTION_GATE_ARCHIVIST','PRODUCTION_OUTCOME_RECONCILER',
  'PRODUCTION_DB_STATE_INSPECTOR','IMMUTABLE_AUDIT_ENFORCEMENT_INSPECTOR',
  'CLOSURE_DECISION_CUSTODIAN','FINAL_EXCEPTION_DISPOSITION_REVIEWER',
  'EXTERNAL_CLOSURE_OPERATOR_WITNESS','INDEPENDENT_POST_CLOSURE_INSPECTOR',
  'ORIGINAL_SOURCE_CUSTODY_RECONCILER','EXCEPTION_REOPEN_REVIEWER'
];
export const ORIGIN_ROLES768=[
  'TRIAL_OPERATOR','TRIAL_RECONCILE','ROLLBACK_EXCEPTION','CHANGE_CONTROL',
  'PRODUCTION_DBA_AUTH','PRODUCTION_SECURITY_AUTH','PRODUCTION_OPERATOR_GATE',
  'PRODUCTION_ROLLBACK_READY','PRODUCTION_GATE_ARCHIVIST','PRODUCTION_OUTCOME_RECONCILER',
  'PRODUCTION_DB_STATE_INSPECTOR','IMMUTABLE_AUDIT_ENFORCEMENT_INSPECTOR',
  'CLOSURE_DECISION_CUSTODIAN','FINAL_EXCEPTION_DISPOSITION_REVIEWER',
  'EXTERNAL_CLOSURE_OPERATOR_WITNESS','INDEPENDENT_POST_CLOSURE_INSPECTOR',
  'ORIGINAL_SOURCE_CUSTODY_RECONCILER','EXCEPTION_REOPEN_REVIEWER'
];
const bytes=s=>new TextEncoder().encode(s);
const digest=v=>sha256Receipt754(typeof v==='string'?bytes(v):v);
const hold=(status,detail,extra={})=>({status,detail,signature_authenticated:false,
  receipt_sha256:null,...extra});
const utc=v=>typeof v==='string'&&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(v)&&
  Number.isFinite(Date.parse(v));
const recent=(when,after,now)=>utc(when)&&utc(after)&&
  Date.parse(when)>=Date.parse(after)&&Date.parse(when)<=now+300000&&
  now-Date.parse(when)<=7*86400000;
const recordValid=r=>UUID.test(r?.booking_id||'')&&UUID.test(r?.source_record_id||'')&&
  ID.test(r?.change_ticket_id||'')&&ID.test(r?.execution_request_id||'');
const priorReady=p=>p?.ok===true&&p?.post_closure_review_status===
  'READY_FOR_SEPARATE_OWNER_FINAL_ACCEPTANCE_REVIEW'&&
  p?.independent_external_execution?.signature_authenticated&&
  p.independent_external_execution.clean_claim&&
  p?.independent_post_closure_inspection?.signature_authenticated&&
  p.independent_post_closure_inspection.clean_claim&&
  ID.test(p?.verified_scope?.trial_id||'')&&
  ID.test(p?.verified_scope?.production_project_ref||'')&&
  HASH.test(p?.verified_scope?.db_inspection_receipt_sha256||'')&&
  HASH.test(p?.verified_scope?.audit_inspection_receipt_sha256||'');
const exactScope=(p,record,prior)=>p?.booking_id===record?.booking_id&&
  p?.source_record_id===record?.source_record_id&&
  p?.change_ticket_id===record?.change_ticket_id&&
  p?.execution_request_id===record?.execution_request_id&&
  p?.trial_id===prior?.verified_scope?.trial_id&&
  p?.production_project_ref===prior?.verified_scope?.production_project_ref;
function decode(v,size){
  if(typeof v!=='string'||v.length>200||v.length%4||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(v))return null;
  try{const raw=Uint8Array.from(atob(v),c=>c.charCodeAt(0));
    return raw.length===size?raw:null;}catch{return null;}
}
function publicKey(env,role,id){
  const ids=new Set(),keys=new Set();let selected=null;
  for(const prefix of KEY_ROLES768){
    const key=decode(env?.[`ROSIE_ECONOMIC_${prefix}_PUBLIC_KEY_B64`],32);
    const keyId=env?.[`ROSIE_ECONOMIC_${prefix}_KEY_ID`];
    if(!key||typeof keyId!=='string'||!ID.test(keyId)||ids.has(keyId))return null;
    const fingerprint=Array.from(key).join(',');if(keys.has(fingerprint))return null;
    keys.add(fingerprint);ids.add(keyId);
    if(prefix===role&&keyId===id)selected=key;
  }
  return selected;
}
function origins(env){
  try{const urls=ORIGIN_ROLES768.map(role=>new URL(env?.[`ROSIE_ECONOMIC_${role}_BASE_URL`]));
    if(urls.some(u=>u.protocol!=='https:'||u.username||u.password||u.port||
      u.search||u.hash||u.pathname!=='/'||!u.hostname.includes('.')||
      u.hostname==='localhost'||/^(?:\d{1,3}\.){3}\d{1,3}$/.test(u.hostname)||
      u.hostname.startsWith('[')||/\.(?:local|localhost|internal)$/i.test(u.hostname))||
      new Set(urls.map(u=>u.origin)).size!==urls.length)return null;
    return urls;
  }catch{return null;}
}
function canonical(p,fields,domain){
  if(!p||typeof p!=='object'||Array.isArray(p)||
    Object.keys(p).length!==fields.length||
    !fields.every(key=>Object.hasOwn(p,key)&&typeof p[key]==='string'))
    throw Error('Noncanonical owner post-closure evidence.');
  return bytes(domain+JSON.stringify(fields.map(k=>[k,p[k]])));
}
async function signed(envelope,transcript,key){
  if(!key||!envelope||typeof envelope!=='object'||Array.isArray(envelope)||
    Object.keys(envelope).length!==2||!Object.hasOwn(envelope,'payload')||
    !Object.hasOwn(envelope,'signature_b64'))return false;
  const signature=decode(envelope.signature_b64,64);if(!signature)return false;
  try{const imported=await crypto.subtle.importKey('raw',key,{name:'Ed25519'},false,['verify']);
    return crypto.subtle.verify('Ed25519',imported,signature,transcript);
  }catch{return false;}
}
export const OWNER_FIELDS768=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id',
  'execution_request_id','production_project_ref','external_execution_receipt_sha256',
  'postclosure_inspection_receipt_sha256','original_db_inspection_sha256',
  'original_audit_inspection_sha256','decision','owner_decision_ticket_id',
  'owner_id','issued_at','nonce','key_id'
]);
export const CUSTODY_FIELDS768=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id',
  'execution_request_id','production_project_ref','owner_decision_receipt_sha256',
  'external_execution_receipt_sha256','postclosure_inspection_receipt_sha256',
  'operator_result_record_sha256','original_inspector_receipt_sha256',
  'original_database_receipt_sha256','original_audit_receipt_sha256',
  'custody_previous_sha256','custody_current_sha256','retention_policy_sha256',
  'custody_result','reconciled_at','custodian_id','key_id'
]);
export const REOPEN_FIELDS768=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id',
  'execution_request_id','production_project_ref','owner_decision_receipt_sha256',
  'original_custody_receipt_sha256','current_exception_register_sha256',
  'current_incident_register_sha256','reopen_case_id','unresolved_critical_count',
  'reopen_result','reviewed_at','reviewer_id','key_id'
]);
export const canonicalOwner768=p=>canonical(p,OWNER_FIELDS768,
  'rosie-owner-postclosure-acceptance-decision-v768:');
export const canonicalCustody768=p=>canonical(p,CUSTODY_FIELDS768,
  'rosie-original-source-custody-reconciliation-v768:');
export const canonicalReopen768=p=>canonical(p,REOPEN_FIELDS768,
  'rosie-independent-exception-reopening-v768:');

export async function verifyOwner768({env,record,prior,envelope,now=Date.now()}={}){
  const p=envelope?.payload;let transcript;
  try{transcript=canonicalOwner768(p);}catch{return hold('HOLD_OWNER_ACCEPTANCE_FORMAT','Noncanonical original owner decision.');}
  const choices=['ACCEPT_FOR_SEPARATE_MANUAL_OWNER_REVIEW_ONLY',
    'REOPEN_EXCEPTION_FOR_EXTERNAL_REVIEW','HOLD_OWNER_POSTCLOSURE_ACCEPTANCE'];
  if(p.schema!=='rosie-owner-postclosure-acceptance-decision-v768'||
    !recordValid(record)||!priorReady(prior)||!exactScope(p,record,prior)||
    p.external_execution_receipt_sha256!==prior.independent_external_execution.receipt_sha256||
    p.postclosure_inspection_receipt_sha256!==prior.independent_post_closure_inspection.receipt_sha256||
    p.original_db_inspection_sha256!==prior.verified_scope.db_inspection_receipt_sha256||
    p.original_audit_inspection_sha256!==prior.verified_scope.audit_inspection_receipt_sha256||
    !choices.includes(p.decision)||!ID.test(p.owner_decision_ticket_id)||
    !ID.test(p.owner_id)||!ID.test(p.key_id)||
    !/^[a-f0-9]{32,64}$/i.test(p.nonce)||
    !recent(p.issued_at,prior.independent_post_closure_inspection.inspected_at,now))
    return hold('HOLD_OWNER_ACCEPTANCE_SCOPE','Owner decision must bind original signed external evidence and remain within review-only scope.');
  const key=publicKey(env,'OWNER_RECEIPT',p.key_id);
  if(!key)return hold('HOLD_OWNER_ACCEPTANCE_KEY_INDEPENDENCE','Twenty-seven distinct signing identities required.');
  if(!origins(env))return hold('HOLD_OWNER_ACCEPTANCE_ORIGIN_INDEPENDENCE','Eighteen distinct pinned HTTPS sources required.');
  if(!await signed(envelope,transcript,key))
    return hold('HOLD_OWNER_ACCEPTANCE_SIGNATURE','Original owner signature invalid.');
  return hold(p.decision==='ACCEPT_FOR_SEPARATE_MANUAL_OWNER_REVIEW_ONLY'?
    'SIGNED_OWNER_MANUAL_ACCEPTANCE_REVIEW':'SIGNED_OWNER_REOPEN_OR_HOLD',
    'Owner signed a bounded evidence-review request, not a website or database closure.',
    {signature_authenticated:true,receipt_sha256:await digest(transcript),
      decision:p.decision,issued_at:p.issued_at,owner_decision_ticket_id:p.owner_decision_ticket_id,
      accepts_manual_review_only:p.decision===choices[0],
      requests_reopen:p.decision===choices[1],owner_acceptance_recorded_by_app:false});
}
export function receiptURL768(env,kind,record,prior,owner,custody){
  if(!recordValid(record)||!priorReady(prior)||!owner?.signature_authenticated)return null;
  const routes={
    custody:['ORIGINAL_SOURCE_CUSTODY_RECONCILER','/v1/economic-original-source-custody-v768'],
    reopen:['EXCEPTION_REOPEN_REVIEWER','/v1/economic-exception-reopen-review-v768']
  };
  if(!Object.hasOwn(routes,kind)||kind==='reopen'&&!custody?.signature_authenticated)return null;
  const urls=origins(env);if(!urls)return null;
  const [role,path]=routes[kind];const url=new URL(path,urls[ORIGIN_ROLES768.indexOf(role)]);
  const params={booking_id:record.booking_id,source_record_id:record.source_record_id,
    change_ticket_id:record.change_ticket_id,execution_request_id:record.execution_request_id,
    owner_decision_receipt_sha256:owner.receipt_sha256,
    ...(kind==='reopen'?{original_custody_receipt_sha256:custody.receipt_sha256}:{})};
  for(const [k,v] of Object.entries(params))url.searchParams.set(k,v);
  return url.toString();
}
export async function readReceipt768(env,kind,record,prior,owner,custody,fetcher=fetch){
  const url=receiptURL768(env,kind,record,prior,owner,custody);
  if(!url)return {status:`HOLD_${kind.toUpperCase()}_SOURCE_NOT_CONFIGURED`};
  try{const response=await fetcher(url,{method:'GET',redirect:'error',
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
export async function verifyCustody768({env,record,prior,owner,readback,now=Date.now()}={}){
  if(readback?.status!=='SIGNED_CUSTODY_READBACK')
    return hold(readback?.status||'HOLD_CUSTODY_MISSING','Original-source custody not available.');
  const p=readback.envelope?.payload;let transcript;
  try{transcript=canonicalCustody768(p);}catch{return hold('HOLD_CUSTODY_FORMAT','Noncanonical original source report.');}
  const clean=p.custody_result==='ORIGINAL_SOURCES_INDEPENDENTLY_RECONCILED_CLAIM';
  if(p.schema!=='rosie-original-source-custody-reconciliation-v768'||
    !recordValid(record)||!priorReady(prior)||!owner?.signature_authenticated||
    !exactScope(p,record,prior)||
    p.owner_decision_receipt_sha256!==owner.receipt_sha256||
    p.external_execution_receipt_sha256!==prior.independent_external_execution.receipt_sha256||
    p.postclosure_inspection_receipt_sha256!==prior.independent_post_closure_inspection.receipt_sha256||
    p.operator_result_record_sha256!==prior.independent_external_execution.result_record_sha256||
    p.original_inspector_receipt_sha256!==prior.independent_post_closure_inspection.receipt_sha256||
    p.original_database_receipt_sha256!==prior.verified_scope.db_inspection_receipt_sha256||
    p.original_audit_receipt_sha256!==prior.verified_scope.audit_inspection_receipt_sha256||
    !['custody_previous_sha256',
      'custody_current_sha256','retention_policy_sha256'].every(k=>HASH.test(p[k]))||
    !['ORIGINAL_SOURCES_INDEPENDENTLY_RECONCILED_CLAIM','ORIGINAL_SOURCE_CONFLICT_HOLD'].includes(p.custody_result)||
    !recent(p.reconciled_at,owner.issued_at,now)||
    !ID.test(p.custodian_id)||!ID.test(p.key_id))
    return hold('HOLD_CUSTODY_SCOPE','Original custodian evidence conflicts with owner, operator, inspector or custody hashes.');
  const key=publicKey(env,'ORIGINAL_SOURCE_CUSTODY_RECONCILER',p.key_id);
  if(!key)return hold('HOLD_CUSTODY_KEY_INDEPENDENCE','Distinct twenty-sixth custodian signing identity required.');
  if(!origins(env))return hold('HOLD_CUSTODY_ORIGIN_INDEPENDENCE','Eighteen distinct sources required.');
  if(!await signed(readback.envelope,transcript,key))
    return hold('HOLD_CUSTODY_SIGNATURE','Original source custodian signature invalid.');
  return hold(clean?'SIGNED_ORIGINAL_SOURCE_CUSTODY_CLAIM':'SIGNED_ORIGINAL_SOURCE_CONFLICT_HOLD',
    'A separate custodian signed original-source provenance; the site did not audit raw storage.',
    {signature_authenticated:true,receipt_sha256:await digest(transcript),clean_claim:clean,
      reconciled_at:p.reconciled_at,custody_current_sha256:p.custody_current_sha256,
      original_storage_verified_by_app:false});
}
export async function verifyReopen768({env,record,prior,owner,custody,readback,now=Date.now()}={}){
  if(readback?.status!=='SIGNED_REOPEN_READBACK')
    return hold(readback?.status||'HOLD_REOPEN_MISSING','Independent reopening review not available.');
  const p=readback.envelope?.payload;let transcript;
  try{transcript=canonicalReopen768(p);}catch{return hold('HOLD_REOPEN_FORMAT','Noncanonical exception-reopening review.');}
  const noNew=p.reopen_result==='NO_NEW_EXCEPTION_CLAIM';
  const requested=p.reopen_result==='EXTERNAL_REOPEN_REQUEST_RECORDED_CLAIM';
  if(p.schema!=='rosie-independent-exception-reopening-v768'||
    !recordValid(record)||!priorReady(prior)||!owner?.signature_authenticated||
    !custody?.signature_authenticated||!exactScope(p,record,prior)||
    p.owner_decision_receipt_sha256!==owner.receipt_sha256||
    p.original_custody_receipt_sha256!==custody.receipt_sha256||
    !HASH.test(p.current_exception_register_sha256)||
    !HASH.test(p.current_incident_register_sha256)||
    !ID.test(p.reopen_case_id)||!ID.test(p.reviewer_id)||!ID.test(p.key_id)||
    !/^(?:0|[1-9]\d{0,5})$/.test(p.unresolved_critical_count)||
    !['NO_NEW_EXCEPTION_CLAIM','EXTERNAL_REOPEN_REQUEST_RECORDED_CLAIM',
      'EXCEPTION_REVIEW_HOLD'].includes(p.reopen_result)||
    (noNew&&(!owner.accepts_manual_review_only||!custody.clean_claim||
      p.unresolved_critical_count!=='0'))||
    (requested&&!owner.requests_reopen)||
    (owner.requests_reopen&&noNew)||
    (owner.accepts_manual_review_only&&requested)||
    !recent(p.reviewed_at,custody.reconciled_at,now))
    return hold('HOLD_REOPEN_SCOPE','An exception cannot be silently cleared or reopened without the exact signed owner request.');
  const key=publicKey(env,'EXCEPTION_REOPEN_REVIEWER',p.key_id);
  if(!key)return hold('HOLD_REOPEN_KEY_INDEPENDENCE','Distinct twenty-seventh reviewer signer required.');
  if(!origins(env))return hold('HOLD_REOPEN_ORIGIN_INDEPENDENCE','Eighteen distinct sources required.');
  if(!await signed(readback.envelope,transcript,key))
    return hold('HOLD_REOPEN_SIGNATURE','Independent reopening reviewer signature invalid.');
  return hold(noNew?'SIGNED_NO_NEW_EXCEPTION_CLAIM':requested?
    'SIGNED_EXTERNAL_REOPEN_REQUEST_CLAIM':'SIGNED_REOPENING_EXCEPTION_HOLD',
    'Independent signed register claim; this website neither reopens nor closes an actual case.',
    {signature_authenticated:true,receipt_sha256:await digest(transcript),
      clean_claim:noNew,reopen_claim:requested,reviewed_at:p.reviewed_at,
      unresolved_critical_count:p.unresolved_critical_count,
      reopen_result:p.reopen_result,reopen_case_id:p.reopen_case_id,
      actual_exception_mutation_by_app:false});
}
export async function reconcile768({prior,owner,custody,reopen,reviewed_at=new Date().toISOString()}={}){
  const follow_ups=[];
  if(!priorReady(prior))follow_ups.push({code:'BUILD767_EXTERNAL_EVIDENCE_NOT_READY',
    action:'Re-authenticate the entire operator, inspection, owner and custody chain. Prior HOLD remains HOLD.'});
  if(!owner?.signature_authenticated)follow_ups.push({code:'OWNER_POSTCLOSURE_DECISION_UNVERIFIED',
    action:'Obtain the original owner-signed explicit manual acceptance review, external reopen request or HOLD.'});
  else if(owner.requests_reopen)follow_ups.push({code:'OWNER_SIGNED_EXCEPTION_REOPEN_REQUEST',
    action:'Keep the case on HOLD until an external operator verifies original exception register state and required action.'});
  else if(!owner.accepts_manual_review_only)follow_ups.push({code:'OWNER_POSTCLOSURE_HOLD',
    action:'Owner signed HOLD. No closure or acceptance can proceed.'});
  if(!custody?.signature_authenticated)follow_ups.push({code:'ORIGINAL_SOURCE_CUSTODY_UNVERIFIED',
    action:'Obtain a separate signed original operator, inspector, database and audit custody reconciliation.'});
  else if(!custody.clean_claim)follow_ups.push({code:'ORIGINAL_SOURCE_CONFLICT_HOLD',
    action:'Investigate conflicting original source custody and retain the exception register.'});
  if(!reopen?.signature_authenticated)follow_ups.push({code:'INDEPENDENT_EXCEPTION_REOPEN_REVIEW_UNVERIFIED',
    action:'Obtain a distinct signed exception/reopening-register review bound to original custody and owner request.'});
  else if(reopen.reopen_claim)follow_ups.push({code:'EXTERNAL_REOPEN_REQUEST_CLAIM_PENDING_CONFIRMATION',
    action:'Confirm the actual case register and assign manual follow-up; do not infer a database mutation from a signature.'});
  else if(!reopen.clean_claim)follow_ups.push({code:'EXCEPTION_REGISTER_HOLD',
    action:'Open exception or contradictory reviewer outcome prevents owner acceptance.'});
  const eligible=follow_ups.length===0;
  follow_ups.push({code:'SEPARATE_ORIGINAL_OWNER_BUSINESS_ACCEPTANCE_REQUIRED',
    action:'An original-owner business acceptance decision, independently retained records and operational follow-up remain external. This site cannot close or reopen cases.'});
  const result={ok:true,build:768,read_only:true,
    predecessor_postclosure_review_status:prior?.post_closure_review_status||'HOLD',
    owner_postclosure_decision:owner||null,
    independent_original_source_custody:custody||null,
    independent_exception_reopening:reopen||null,
    owner_acceptance_status:eligible?'READY_FOR_SEPARATE_MANUAL_OWNER_ACCEPTANCE_HANDOFF':
      'HOLD_ORIGINAL_CUSTODY_OWNER_DECISION_OR_REOPEN_EXCEPTION',
    signed_reopen_request_detected:!!owner?.requests_reopen,
    external_reopen_claim_authenticated:!!reopen?.reopen_claim,
    owner_acceptance_recorded_by_app:false,external_case_reopened_by_app:false,
    actual_business_closure_verified_by_app:false,production_db_connected_by_app:false,
    immutable_storage_verified_by_app:false,automatic_business_write:false,
    closure_allowed:false,customer_notifications_sent_by_app:false,
    blocking_count:follow_ups.length,follow_ups,reviewed_at};
  result.packet_sha256=await digest(JSON.stringify({schema:'rosie-owner-original-custody-reopen-review-v768',
    predecessor:prior?.packet_sha256||null,owner:owner?.receipt_sha256||null,
    custody:custody?.receipt_sha256||null,reopen:reopen?.receipt_sha256||null,
    follow_ups,reviewed_at}));
  return result;
}
