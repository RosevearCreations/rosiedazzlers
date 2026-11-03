import {sha256Receipt754} from './owner-receipt-verification-v754.js';

// Build 767 observes independent external claims only. No business mutation lives here.
const ID=/^[A-Za-z0-9][A-Za-z0-9._:/-]{5,119}$/;
const UUID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const HASH=/^[a-f0-9]{64}$/i;
const SCOPED_KEYS=[
  'OWNER_RECEIPT','SOURCE_WITNESS','HISTORY_CUSTODIAN','RETENTION_PROVIDER',
  'STORAGE_AUDITOR','DBA_REVIEW','SECURITY_REVIEW','ISOLATION_AUDITOR',
  'ROLLBACK_WITNESS','TRIAL_OPERATOR','TRIAL_RECONCILER','ROLLBACK_EXCEPTION',
  'CHANGE_CONTROL','PRODUCTION_DBA_AUTH','PRODUCTION_SECURITY_AUTH',
  'PRODUCTION_OPERATOR_GATE','PRODUCTION_ROLLBACK_READY',
  'PRODUCTION_GATE_ARCHIVIST','PRODUCTION_OUTCOME_RECONCILER',
  'PRODUCTION_DB_STATE_INSPECTOR','IMMUTABLE_AUDIT_ENFORCEMENT_INSPECTOR',
  'CLOSURE_DECISION_CUSTODIAN','FINAL_EXCEPTION_DISPOSITION_REVIEWER',
  'EXTERNAL_CLOSURE_OPERATOR_WITNESS','INDEPENDENT_POST_CLOSURE_INSPECTOR'
];
const ORIGINS=[
  'TRIAL_OPERATOR','TRIAL_RECONCILE','ROLLBACK_EXCEPTION','CHANGE_CONTROL',
  'PRODUCTION_DBA_AUTH','PRODUCTION_SECURITY_AUTH','PRODUCTION_OPERATOR_GATE',
  'PRODUCTION_ROLLBACK_READY','PRODUCTION_GATE_ARCHIVIST','PRODUCTION_OUTCOME_RECONCILER',
  'PRODUCTION_DB_STATE_INSPECTOR','IMMUTABLE_AUDIT_ENFORCEMENT_INSPECTOR',
  'CLOSURE_DECISION_CUSTODIAN','FINAL_EXCEPTION_DISPOSITION_REVIEWER',
  'EXTERNAL_CLOSURE_OPERATOR_WITNESS','INDEPENDENT_POST_CLOSURE_INSPECTOR'
];
const bytes=value=>new TextEncoder().encode(value);
const digest=value=>sha256Receipt754(typeof value==='string'?bytes(value):value);
const hold=(status,detail,extra={})=>({status,detail,signature_authenticated:false,
  receipt_sha256:null,...extra});
const utc=value=>typeof value==='string'&&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(value)&&
  Number.isFinite(Date.parse(value));
const recent=(value,after,now)=>utc(value)&&utc(after)&&
  Date.parse(value)>=Date.parse(after)&&Date.parse(value)<=now+300000&&
  now-Date.parse(value)<=7*86400000;

function decode(value,size){
  if(typeof value!=='string'||value.length>200||value.length%4||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))return null;
  try{const data=Uint8Array.from(atob(value),c=>c.charCodeAt(0));
    return data.length===size?data:null;}catch{return null;}
}
function independentKey(env,prefix,id){
  const ids=new Set(),fingerprints=new Set();let selected=null;
  for(const role of SCOPED_KEYS){
    const key=decode(env?.[`ROSIE_ECONOMIC_${role}_PUBLIC_KEY_B64`],32);
    const keyId=env?.[`ROSIE_ECONOMIC_${role}_KEY_ID`];
    if(!key||typeof keyId!=='string'||!ID.test(keyId)||ids.has(keyId))return null;
    const fingerprint=Array.from(key).join(',');
    if(fingerprints.has(fingerprint))return null;
    ids.add(keyId);fingerprints.add(fingerprint);
    if(role===prefix&&id===keyId)selected=key;
  }
  return selected;
}
function independentOrigins(env){
  try{
    const urls=ORIGINS.map(role=>new URL(env?.[`ROSIE_ECONOMIC_${role}_BASE_URL`]));
    if(urls.some(u=>u.protocol!=='https:'||u.username||u.password||u.port||
      u.search||u.hash||u.pathname!=='/'||!u.hostname.includes('.')||
      u.hostname==='localhost'||/^(?:\d{1,3}\.){3}\d{1,3}$/.test(u.hostname)||
      u.hostname.startsWith('[')||/\.(?:local|localhost|internal)$/i.test(u.hostname))||
      new Set(urls.map(u=>u.origin)).size!==urls.length)return null;
    return urls;
  }catch{return null;}
}
function canonical(payload,fields,domain){
  if(!payload||typeof payload!=='object'||Array.isArray(payload)||
    Object.keys(payload).length!==fields.length||
    !fields.every(k=>Object.hasOwn(payload,k)&&typeof payload[k]==='string'))
    throw Error('Noncanonical independent post-closure evidence.');
  return bytes(domain+JSON.stringify(fields.map(k=>[k,payload[k]])));
}
async function verify(envelope,transcript,key){
  if(!key||!envelope||typeof envelope!=='object'||Array.isArray(envelope)||
    Object.keys(envelope).length!==2||!Object.hasOwn(envelope,'payload')||
    !Object.hasOwn(envelope,'signature_b64'))return false;
  const signature=decode(envelope.signature_b64,64);if(!signature)return false;
  try{const publicKey=await crypto.subtle.importKey('raw',key,{name:'Ed25519'},false,['verify']);
    return crypto.subtle.verify('Ed25519',publicKey,signature,transcript);
  }catch{return false;}
}
export const EXECUTION_FIELDS767=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id',
  'execution_request_id','production_project_ref','owner_authorization_receipt_sha256',
  'ledger_decision_receipt_sha256','final_disposition_receipt_sha256',
  'external_execution_ticket_id','change_manager_approval_sha256',
  'operator_action_receipt_sha256','result_record_sha256','execution_result',
  'executed_at','external_operator_id','witness_id','key_id'
]);
export const INSPECTION_FIELDS767=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id',
  'execution_request_id','production_project_ref','external_execution_receipt_sha256',
  'db_inspection_receipt_sha256','immutable_audit_inspection_receipt_sha256',
  'result_record_sha256','postchange_record_sha256','ledger_continuity_sha256',
  'exception_register_sha256','critical_exception_count','record_state',
  'inspection_result','inspected_at','independent_inspector_id','key_id'
]);
export const canonicalExecution767=p=>canonical(p,EXECUTION_FIELDS767,
  'rosie-independent-external-closure-outcome-v767:');
export const canonicalInspection767=p=>canonical(p,INSPECTION_FIELDS767,
  'rosie-independent-postclosure-state-readback-v767:');
const validRecord=r=>UUID.test(r?.booking_id||'')&&UUID.test(r?.source_record_id||'')&&
  ID.test(r?.change_ticket_id||'')&&ID.test(r?.execution_request_id||'');
const cleanPrior=p=>p?.ok===true&&p?.final_disposition_status===
  'READY_FOR_SEPARATE_CONTROLLED_EXTERNAL_CLOSURE_HANDOFF'&&
  p?.owner_external_manual_authorization?.signature_authenticated&&
  p.owner_external_manual_authorization.authorizes_external_manual_review_only&&
  p?.independent_append_only_decision_custody?.signature_authenticated&&
  p.independent_append_only_decision_custody.clean_claim&&
  p?.independent_final_exception_disposition?.signature_authenticated&&
  p.independent_final_exception_disposition.clean_claim;
const match=(p,r,prior)=>p?.booking_id===r?.booking_id&&
  p?.source_record_id===r?.source_record_id&&p?.change_ticket_id===r?.change_ticket_id&&
  p?.execution_request_id===r?.execution_request_id&&
  p?.trial_id===prior?.verified_scope?.trial_id&&
  p?.production_project_ref===prior?.verified_scope?.production_project_ref;

export function receiptURL767(env,kind,record,prior,execution){
  if(!validRecord(record)||!cleanPrior(prior))return null;
  const sources={
    execution:['EXTERNAL_CLOSURE_OPERATOR_WITNESS','/v1/economic-external-closure-outcome-v767'],
    inspection:['INDEPENDENT_POST_CLOSURE_INSPECTOR','/v1/economic-postclosure-state-readback-v767']
  };
  if(!Object.hasOwn(sources,kind)||kind==='inspection'&&
    !execution?.signature_authenticated)return null;
  const origins=independentOrigins(env);if(!origins)return null;
  const [role,path]=sources[kind];const url=new URL(path,origins[ORIGINS.indexOf(role)]);
  const params={booking_id:record.booking_id,source_record_id:record.source_record_id,
    change_ticket_id:record.change_ticket_id,execution_request_id:record.execution_request_id,
    final_disposition_receipt_sha256:prior.independent_final_exception_disposition.receipt_sha256,
    ...(kind==='inspection'?{external_execution_receipt_sha256:execution.receipt_sha256}:{})};
  for(const [key,value] of Object.entries(params))url.searchParams.set(key,value);
  return url.toString();
}
export async function readReceipt767(env,kind,record,prior,execution,fetcher=fetch){
  const url=receiptURL767(env,kind,record,prior,execution);
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
export async function verifyExecution767({env,record,prior,readback,now=Date.now()}={}){
  if(readback?.status!=='SIGNED_EXECUTION_READBACK')
    return hold(readback?.status||'HOLD_EXECUTION_MISSING','External operator outcome not available.');
  const p=readback.envelope?.payload;let transcript;
  try{transcript=canonicalExecution767(p);}catch{return hold('HOLD_EXECUTION_FORMAT','Noncanonical operator outcome.');}
  const completed=p.execution_result==='EXTERNAL_CLOSURE_COMPLETED_CLAIM';
  if(p.schema!=='rosie-independent-external-closure-outcome-v767'||
    !validRecord(record)||!cleanPrior(prior)||!match(p,record,prior)||
    p.owner_authorization_receipt_sha256!==prior.owner_external_manual_authorization.receipt_sha256||
    p.ledger_decision_receipt_sha256!==prior.independent_append_only_decision_custody.receipt_sha256||
    p.final_disposition_receipt_sha256!==prior.independent_final_exception_disposition.receipt_sha256||
    !ID.test(p.external_execution_ticket_id)||!ID.test(p.external_operator_id)||
    !ID.test(p.witness_id)||!ID.test(p.key_id)||
    !['change_manager_approval_sha256','operator_action_receipt_sha256','result_record_sha256']
      .every(k=>HASH.test(p[k]))||
    !['EXTERNAL_CLOSURE_COMPLETED_CLAIM','EXTERNAL_CLOSURE_EXCEPTION_HOLD'].includes(p.execution_result)||
    !recent(p.executed_at,prior.independent_final_exception_disposition.reviewed_at,now))
    return hold('HOLD_EXECUTION_SCOPE','External outcome does not match signed final handoff, approval, source, ticket or time.');
  const key=independentKey(env,'EXTERNAL_CLOSURE_OPERATOR_WITNESS',p.key_id);
  if(!key)return hold('HOLD_EXECUTION_SIGNER_INDEPENDENCE','All 25 distinct signing identities required.');
  if(!independentOrigins(env))return hold('HOLD_EXECUTION_ORIGIN_INDEPENDENCE','Sixteen distinct pinned HTTPS origins required.');
  if(!await verify(readback.envelope,transcript,key))
    return hold('HOLD_EXECUTION_SIGNATURE','Independent operator witness signature invalid.');
  return hold(completed?'SIGNED_EXTERNAL_CLOSURE_COMPLETION_CLAIM':'SIGNED_EXTERNAL_CLOSURE_EXCEPTION_HOLD',
    'External operator and witness signed a claim. No action or database read occurred here.',
    {signature_authenticated:true,receipt_sha256:await digest(transcript),
      clean_claim:completed,executed_at:p.executed_at,result_record_sha256:p.result_record_sha256,
      execution_result:p.execution_result,external_execution_ticket_id:p.external_execution_ticket_id,
      closure_executed_or_verified_by_app:false});
}
export async function verifyInspection767({env,record,prior,execution,readback,now=Date.now()}={}){
  if(readback?.status!=='SIGNED_INSPECTION_READBACK')
    return hold(readback?.status||'HOLD_INSPECTION_MISSING','Independent state inspection not available.');
  const p=readback.envelope?.payload;let transcript;
  try{transcript=canonicalInspection767(p);}catch{return hold('HOLD_INSPECTION_FORMAT','Noncanonical state inspection.');}
  const clean=p.inspection_result==='POST_CLOSURE_STATE_MATCH_CLAIM';
  if(p.schema!=='rosie-independent-postclosure-state-readback-v767'||
    !validRecord(record)||!cleanPrior(prior)||!match(p,record,prior)||
    !execution?.signature_authenticated||
    p.external_execution_receipt_sha256!==execution.receipt_sha256||
    p.db_inspection_receipt_sha256!==prior.verified_scope?.db_inspection_receipt_sha256||
    p.immutable_audit_inspection_receipt_sha256!==
      prior.verified_scope?.audit_inspection_receipt_sha256||
    p.result_record_sha256!==execution.result_record_sha256||
    !['postchange_record_sha256','ledger_continuity_sha256','exception_register_sha256']
      .every(k=>HASH.test(p[k]))||
    !/^(?:0|[1-9]\d{0,5})$/.test(p.critical_exception_count)||
    !['CLOSED_CLAIM','UNCHANGED_OR_UNKNOWN'].includes(p.record_state)||
    !['POST_CLOSURE_STATE_MATCH_CLAIM','POST_CLOSURE_STATE_EXCEPTION_HOLD'].includes(p.inspection_result)||
    (clean&&(!execution.clean_claim||p.record_state!=='CLOSED_CLAIM'||p.critical_exception_count!=='0'))||
    !recent(p.inspected_at,execution.executed_at,now)||
    !ID.test(p.independent_inspector_id)||!ID.test(p.key_id))
    return hold('HOLD_INSPECTION_SCOPE','Independent state review cannot reconcile missing or conflicting operator/audit evidence.');
  const key=independentKey(env,'INDEPENDENT_POST_CLOSURE_INSPECTOR',p.key_id);
  if(!key)return hold('HOLD_INSPECTION_SIGNER_INDEPENDENCE','All 25 distinct signing identities required.');
  if(!independentOrigins(env))return hold('HOLD_INSPECTION_ORIGIN_INDEPENDENCE','Sixteen distinct pinned HTTPS origins required.');
  if(!await verify(readback.envelope,transcript,key))
    return hold('HOLD_INSPECTION_SIGNATURE','Independent state inspector signature invalid.');
  return hold(clean?'SIGNED_INDEPENDENT_POST_CLOSURE_STATE_CLAIM':'SIGNED_POST_CLOSURE_EXCEPTION_HOLD',
    'Independent inspector signed an externally observed state claim; website did not access production records.',
    {signature_authenticated:true,receipt_sha256:await digest(transcript),clean_claim:clean,
      inspected_at:p.inspected_at,record_state:p.record_state,
      critical_exception_count:p.critical_exception_count,
      database_connected_by_app:false,immutable_storage_proven_by_app:false});
}
export async function reconcile767({prior,execution,inspection,reviewed_at=new Date().toISOString()}={}){
  const follow_ups=[];
  if(!cleanPrior(prior))follow_ups.push({code:'BUILD766_INDEPENDENT_HANDOFF_NOT_READY',
    action:'Re-authenticate the entire original owner/custodian/final-review chain. A signed HOLD stays HOLD.'});
  if(!execution?.signature_authenticated)follow_ups.push({code:'EXTERNAL_OPERATOR_OUTCOME_UNVERIFIED',
    action:'Obtain a distinct external operator witness with separate change-manager approval and original execution evidence.'});
  else if(!execution.clean_claim)follow_ups.push({code:'EXTERNAL_OPERATOR_EXCEPTION_HOLD',
    action:'Investigate the externally signed failure; do not repeat or presume an action succeeded.'});
  if(!inspection?.signature_authenticated)follow_ups.push({code:'INDEPENDENT_POST_CLOSURE_READBACK_UNVERIFIED',
    action:'Obtain a different independent inspector report bound to the operator receipt and original DBA/audit inspection.'});
  else if(!inspection.clean_claim)follow_ups.push({code:'INDEPENDENT_POST_CLOSURE_STATE_EXCEPTION',
    action:'Preserve the divergent production record, audit chain, and incident register for owner review.'});
  const claimsReady=follow_ups.length===0;
  follow_ups.push({code:'OWNER_FINAL_ACCEPTANCE_AND_SOURCE_AUDIT_REQUIRED',
    action:'The owner must separately review original external records, operator/change-manager authority, source immutability, and any legal/business closure before acceptance.'});
  const result={ok:true,build:767,read_only:true,
    predecessor_final_disposition_status:prior?.final_disposition_status||'HOLD',
    independent_external_execution:execution||null,
    independent_post_closure_inspection:inspection||null,
    post_closure_review_status:claimsReady?'READY_FOR_SEPARATE_OWNER_FINAL_ACCEPTANCE_REVIEW':
      'HOLD_EXTERNAL_CLOSURE_OUTCOME_OR_STATE_READBACK',
    external_closure_claim_authenticated:!!execution?.signature_authenticated,
    independent_state_claim_authenticated:!!inspection?.signature_authenticated,
    external_closure_executed_or_verified_by_app:false,production_db_connected_by_app:false,
    immutable_ledger_verified_by_app:false,owner_acceptance_recorded_by_app:false,
    automatic_business_write:false,closure_allowed:false,customer_notifications_sent_by_app:false,
    blocking_count:follow_ups.length,follow_ups,reviewed_at};
  result.packet_sha256=await digest(JSON.stringify({schema:'rosie-postclosure-acceptance-readback-v767',
    prior:prior?.packet_sha256||null,execution:execution?.receipt_sha256||null,
    inspection:inspection?.receipt_sha256||null,follow_ups,reviewed_at}));
  return result;
}
