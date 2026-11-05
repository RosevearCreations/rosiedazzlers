import {sha256Receipt754} from './owner-receipt-verification-v754.js';
import {KEY_ROLES768,ORIGIN_ROLES768} from './economic-owner-acceptance-v768.js';
import {ROLES769} from './economic-handoff-retention-v769.js';
import {ROLES770} from './economic-owner-register-aging-v770.js';
import {ROLES771} from './economic-final-attestation-v771.js';
import {ROLES772} from './economic-resolution-sla-v772.js';
import {ROLES773} from './economic-disposition-renewal-v773.js';
import {ROLES774} from './economic-owner-handoff-aging-v774.js';
import {ROLES775} from './economic-handoff-closure-retention-v775.js';

export const ROLES776=Object.freeze([
  'INDEPENDENT_OWNER_CLOSURE_FOLLOWTHROUGH_WITNESS',
  'INDEPENDENT_AGING_EXCEPTION_DISPOSITION_WITNESS',
  'INDEPENDENT_RETENTION_CUSTODY_RENEWAL_WITNESS'
]);
const SCOPE=['schema','booking_id','source_record_id','trial_id',
  'change_ticket_id','execution_request_id','production_project_ref'];
export const OWNER_FIELDS776=Object.freeze([...SCOPE,
  'prior_owner_closure_review_sha256','handoff_decision_receipt_sha256',
  'aging_escalation_receipt_sha256','retention_continuity_receipt_sha256',
  'manual_review_choice','review_ticket_id','owner_id','issued_at','nonce','key_id']);
export const FOLLOWTHROUGH_FIELDS776=Object.freeze([...SCOPE,
  'owner_review_receipt_sha256','prior_decision_receipt_sha256',
  'prior_decision_register_sha256','current_followthrough_register_sha256',
  'decision_case_id','followthrough_result','observed_at','witness_id','key_id']);
export const EXCEPTION_FIELDS776=Object.freeze([...SCOPE,
  'owner_review_receipt_sha256','followthrough_receipt_sha256',
  'prior_aging_escalation_receipt_sha256','observed_elapsed_hours',
  'source_alert_threshold_hours','open_exception_count',
  'current_exception_register_sha256','aging_exception_result',
  'observed_at','witness_id','key_id']);
export const CUSTODY_FIELDS776=Object.freeze([...SCOPE,
  'owner_review_receipt_sha256','followthrough_receipt_sha256',
  'exception_disposition_receipt_sha256','prior_retention_continuity_receipt_sha256',
  'prior_retained_source_history_sha256','retained_source_history_sha256',
  'current_custody_renewal_register_sha256','critical_exceptions',
  'custody_expires_at','custody_renewal_result','observed_at','witness_id','key_id']);
const HASH=/^[a-f0-9]{64}$/i;
const ID=/^[A-Za-z0-9][A-Za-z0-9._:/-]{5,119}$/;
const UUID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const integer=v=>typeof v==='string'&&/^(?:0|[1-9]\d{0,5})$/.test(v);
const utc=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(s)&&Number.isFinite(Date.parse(s));
const recent=(s,after,now)=>utc(s)&&utc(after)&&Date.parse(s)>=Date.parse(after)&&
  Date.parse(s)<=now+300000&&now-Date.parse(s)<=7*86400000;
const hold=(status,detail,more={})=>({status,detail,signature_authenticated:false,
  receipt_sha256:null,...more});
const bytes=s=>new TextEncoder().encode(s);
const hash=s=>sha256Receipt754(s);
function canonical(p,fields,prefix){
  if(!p||typeof p!=='object'||Array.isArray(p)||
    Object.keys(p).length!==fields.length||
    !fields.every(f=>Object.hasOwn(p,f)&&typeof p[f]==='string'))
    throw Error('Noncanonical original-owner follow-through or custody evidence.');
  return bytes(prefix+JSON.stringify(fields.map(f=>[f,p[f]])));
}
export const canonicalOwner776=p=>canonical(p,OWNER_FIELDS776,
  'rosie-original-owner-closure-followthrough-review-v776:');
export const canonicalFollowthrough776=p=>canonical(p,FOLLOWTHROUGH_FIELDS776,
  'rosie-independent-owner-closure-followthrough-v776:');
export const canonicalException776=p=>canonical(p,EXCEPTION_FIELDS776,
  'rosie-independent-aging-exception-disposition-v776:');
export const canonicalCustody776=p=>canonical(p,CUSTODY_FIELDS776,
  'rosie-independent-retention-custody-renewal-v776:');
function decode(value,n){
  if(typeof value!=='string'||value.length>200||value.length%4||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))return null;
  try{const a=Uint8Array.from(atob(value),x=>x.charCodeAt(0));return a.length===n?a:null;}
  catch{return null;}
}
const keyRoles=[...KEY_ROLES768,...ROLES769,...ROLES770,...ROLES771,...ROLES772,
  ...ROLES773,...ROLES774,...ROLES775,...ROLES776];
const originRoles=[...ORIGIN_ROLES768,...ROLES769,...ROLES770,...ROLES771,
  ...ROLES772,...ROLES773,...ROLES774,...ROLES775,...ROLES776];
function signer(env,role,key){
  let pub=null;const ids=new Set(),fingerprints=new Set();
  for(const name of keyRoles){
    const raw=decode(env?.[`ROSIE_ECONOMIC_${name}_PUBLIC_KEY_B64`],32);
    const id=env?.[`ROSIE_ECONOMIC_${name}_KEY_ID`];
    if(!raw||typeof id!=='string'||!ID.test(id)||ids.has(id))return null;
    const fingerprint=Array.from(raw).join(',');
    if(fingerprints.has(fingerprint))return null;
    ids.add(id);fingerprints.add(fingerprint);
    if(name===role&&id===key)pub=raw;
  }
  return pub;
}
function origins(env){
  try{
    const urls=originRoles.map(role=>new URL(env?.[`ROSIE_ECONOMIC_${role}_BASE_URL`]));
    if(urls.some(u=>u.protocol!=='https:'||u.username||u.password||u.port||
      u.search||u.hash||u.pathname!=='/'||!u.hostname.includes('.')||
      u.hostname==='localhost'||u.hostname.startsWith('[')||
      /^(?:\d{1,3}\.){3}\d{1,3}$/.test(u.hostname)||
      /\.(?:local|localhost|internal)$/i.test(u.hostname))||
      new Set(urls.map(u=>u.origin)).size!==urls.length)return null;
    return Object.fromEntries(originRoles.map((role,i)=>[role,urls[i]]));
  }catch{return null;}
}
async function verifySignature(envelope,canonicalBytes,pub){
  if(!pub||!envelope||typeof envelope!=='object'||Array.isArray(envelope)||
    Object.keys(envelope).length!==2||!Object.hasOwn(envelope,'payload')||
    !Object.hasOwn(envelope,'signature_b64'))return false;
  const sig=decode(envelope.signature_b64,64);if(!sig)return false;
  try{const key=await crypto.subtle.importKey('raw',pub,{name:'Ed25519'},false,['verify']);
    return crypto.subtle.verify('Ed25519',key,sig,canonicalBytes);}
  catch{return false;}
}
const original=h=>h?.history?.history?.history?.history?.history?.history?.ctx;
const complete=h=>h?.report?.ok===true&&
  h.report.handoff_closure_decision_status===
    'READY_FOR_SEPARATE_ORIGINAL_OWNER_HANDOFF_CLOSURE_DECISION'&&
  h.owner?.signature_authenticated===true&&h.owner.requests_review===true&&
  h.decision?.clean_claim===true&&h.escalation?.clean_claim===true&&
  h.retention?.preserved_claim===true&&
  utc(h.retention.witness_expires_at)&&original(h)?.prior?.ok===true&&
  UUID.test(original(h)?.record?.booking_id||'')&&
  UUID.test(original(h)?.record?.source_record_id||'');
const scope=(p,h)=>complete(h)&&
  p?.booking_id===original(h).record.booking_id&&
  p?.source_record_id===original(h).record.source_record_id&&
  p?.change_ticket_id===original(h).record.change_ticket_id&&
  p?.execution_request_id===original(h).record.execution_request_id&&
  p?.trial_id===original(h).prior.verified_scope.trial_id&&
  p?.production_project_ref===original(h).prior.verified_scope.production_project_ref;

export async function verifyOwner776({env,history,envelope,now=Date.now()}={}){
  const p=envelope?.payload;let encoded;
  try{encoded=canonicalOwner776(p);}catch{return hold('HOLD_OWNER_FOLLOWTHROUGH_FORMAT',
    'Fresh original owner follow-through review must be canonical.');}
  if(p.schema!=='rosie-original-owner-closure-followthrough-review-v776'||
    !scope(p,history)||p.prior_owner_closure_review_sha256!==history.owner.receipt_sha256||
    p.handoff_decision_receipt_sha256!==history.decision.receipt_sha256||
    p.aging_escalation_receipt_sha256!==history.escalation.receipt_sha256||
    p.retention_continuity_receipt_sha256!==history.retention.receipt_sha256||
    !['REQUEST_SEPARATE_OWNER_FOLLOWTHROUGH_REVIEW','HOLD_CLOSURE_DECISION',
      'HOLD_ESCALATION_EXCEPTION','HOLD_RETENTION_CUSTODY'].includes(p.manual_review_choice)||
    !ID.test(p.review_ticket_id)||!ID.test(p.owner_id)||
    !/^[a-f0-9]{32,64}$/i.test(p.nonce)||!ID.test(p.key_id)||
    !recent(p.issued_at,history.retention.signed_at,now)||
    Date.parse(history.retention.witness_expires_at)<=now)
    return hold('HOLD_OWNER_FOLLOWTHROUGH_SCOPE',
      'Owner must bind the original Build 775 signed decision, escalation and unexpired retention witness.');
  const pub=signer(env,'OWNER_RECEIPT',p.key_id);
  if(!pub)return hold('HOLD_OWNER_FOLLOWTHROUGH_SIGNER_INDEPENDENCE',
    'Fifty-one distinct signer identities required.');
  if(!origins(env))return hold('HOLD_OWNER_FOLLOWTHROUGH_ORIGIN_INDEPENDENCE',
    'Forty-two distinct pinned HTTPS source origins required.');
  if(!await verifySignature(envelope,encoded,pub))
    return hold('HOLD_OWNER_FOLLOWTHROUGH_SIGNATURE','Original owner signature invalid.');
  return hold('SIGNED_ORIGINAL_OWNER_FOLLOWTHROUGH_REVIEW',
    'Authenticated original owner follow-through request, not executed closure.',{
      signature_authenticated:true,receipt_sha256:await hash(encoded),
      signed_at:p.issued_at,choice:p.manual_review_choice,
      requests_review:p.manual_review_choice==='REQUEST_SEPARATE_OWNER_FOLLOWTHROUGH_REVIEW',
      owner_business_decision_executed_by_app:false});
}
const routes={
  followthrough:[ROLES776[0],'/v1/economic-owner-closure-followthrough-v776'],
  exception:[ROLES776[1],'/v1/economic-aging-exception-disposition-v776'],
  custody:[ROLES776[2],'/v1/economic-retention-custody-renewal-v776']
};
export function receiptURL776(env,kind,history,owner,followthrough,exception){
  if(!Object.hasOwn(routes,kind)||!complete(history)||!owner?.signature_authenticated||
    kind!=='followthrough'&&!followthrough?.signature_authenticated||
    kind==='custody'&&!exception?.signature_authenticated)return null;
  const urls=origins(env);if(!urls)return null;
  const [role,path]=routes[kind],url=new URL(path,urls[role]);
  const params={booking_id:original(history).record.booking_id,
    source_record_id:original(history).record.source_record_id,
    change_ticket_id:original(history).record.change_ticket_id,
    execution_request_id:original(history).record.execution_request_id,
    owner_review_receipt_sha256:owner.receipt_sha256,
    ...(kind==='followthrough'?{}:{followthrough_receipt_sha256:followthrough.receipt_sha256}),
    ...(kind==='custody'?{exception_receipt_sha256:exception.receipt_sha256}:{})};
  for(const [key,value] of Object.entries(params))url.searchParams.set(key,value);
  return url.toString();
}
export async function readReceipt776(env,kind,history,owner,followthrough,exception,
  fetcher=fetch){
  const url=receiptURL776(env,kind,history,owner,followthrough,exception);
  if(!url)return {status:`HOLD_${String(kind).toUpperCase()}_SOURCE_NOT_CONFIGURED`};
  try{
    const response=await fetcher(url,{method:'GET',redirect:'error',
      headers:{Accept:'application/json','Cache-Control':'no-store'}});
    if(!response.ok)return {status:`HOLD_${kind.toUpperCase()}_SOURCE_UNAVAILABLE`};
    const raw=await response.text();
    if(raw.length>16000)return {status:`HOLD_${kind.toUpperCase()}_SOURCE_OVERSIZED`};
    const envelope=JSON.parse(raw);
    if(!envelope||typeof envelope!=='object'||Array.isArray(envelope)||
      Object.keys(envelope).length!==2||!Object.hasOwn(envelope,'payload')||
      !Object.hasOwn(envelope,'signature_b64'))
      return {status:`HOLD_${kind.toUpperCase()}_SOURCE_FORMAT`};
    return {status:`SIGNED_${kind.toUpperCase()}_READBACK`,envelope};
  }catch{return {status:`HOLD_${kind.toUpperCase()}_SOURCE_UNAVAILABLE`};}
}
async function verify({env,kind,history,owner,readback,canonicalFn,valid,now}){
  if(readback?.status!==`SIGNED_${kind.toUpperCase()}_READBACK`)
    return hold(readback?.status||`HOLD_${kind.toUpperCase()}_MISSING`,
      'Original signed independent issuer evidence unavailable.');
  const p=readback.envelope?.payload;let encoded;
  try{encoded=canonicalFn(p);}catch{return hold(`HOLD_${kind.toUpperCase()}_FORMAT`,
    'Independent original source envelope is noncanonical.');}
  if(!scope(p,history)||!owner?.signature_authenticated||
    p.owner_review_receipt_sha256!==owner.receipt_sha256||!valid(p,history,now))
    return hold(`HOLD_${kind.toUpperCase()}_SCOPE`,
      'Source digest, chronology, elapsed age, exception or retention scope conflicts.');
  const pub=signer(env,routes[kind][0],p.key_id);
  if(!pub)return hold(`HOLD_${kind.toUpperCase()}_SIGNER_INDEPENDENCE`,
    'Fifty-one distinct original signer identities required.');
  if(!origins(env))return hold(`HOLD_${kind.toUpperCase()}_ORIGIN_INDEPENDENCE`,
    'Forty-two distinct original issuer HTTPS roots required.');
  if(!await verifySignature(readback.envelope,encoded,pub))
    return hold(`HOLD_${kind.toUpperCase()}_SIGNATURE`,'Independent original issuer signature invalid.');
  return hold(`SIGNED_${kind.toUpperCase()}_CLAIM`,
    'Authenticated independent original-source claim only; no original record changed.',{
      signature_authenticated:true,receipt_sha256:await hash(encoded),
      signed_at:p.observed_at,claim:p.followthrough_result||
        p.aging_exception_result||p.custody_renewal_result});
}
export async function verifyFollowthrough776({env,history,owner,readback,now=Date.now()}={}){
  const r=await verify({env,kind:'followthrough',history,owner,readback,
    canonicalFn:canonicalFollowthrough776,now,
    valid:(p,h,t)=>p.schema==='rosie-independent-owner-closure-followthrough-v776'&&
      p.prior_decision_receipt_sha256===h.decision.receipt_sha256&&
      p.prior_decision_register_sha256===h.decision.current_handoff_decision_register_sha256&&
      HASH.test(p.current_followthrough_register_sha256)&&ID.test(p.decision_case_id)&&
      ['FOLLOWTHROUGH_REGISTER_CURRENT_CLAIM','FOLLOWTHROUGH_ACTION_PENDING_CLAIM',
        'FOLLOWTHROUGH_DECISION_CONFLICT_HOLD'].includes(p.followthrough_result)&&
      (p.followthrough_result!=='FOLLOWTHROUGH_REGISTER_CURRENT_CLAIM'||
        owner.requests_review&&h.decision.clean_claim)&&
      recent(p.observed_at,owner.signed_at,t)&&ID.test(p.witness_id)&&ID.test(p.key_id)});
  return {...r,current_claim:r.signature_authenticated&&
    r.claim==='FOLLOWTHROUGH_REGISTER_CURRENT_CLAIM',
    current_followthrough_register_sha256:r.signature_authenticated?
      readback.envelope.payload.current_followthrough_register_sha256:null,
    owner_action_executed_by_app:false};
}
export async function verifyException776({env,history,owner,followthrough,readback,
  now=Date.now()}={}){
  const r=await verify({env,kind:'exception',history,owner,readback,
    canonicalFn:canonicalException776,now,
    valid:(p,h,t)=>followthrough?.signature_authenticated&&
      p.schema==='rosie-independent-aging-exception-disposition-v776'&&
      p.followthrough_receipt_sha256===followthrough.receipt_sha256&&
      p.prior_aging_escalation_receipt_sha256===h.escalation.receipt_sha256&&
      integer(p.observed_elapsed_hours)&&integer(p.source_alert_threshold_hours)&&
      integer(p.open_exception_count)&&HASH.test(p.current_exception_register_sha256)&&
      Number(p.observed_elapsed_hours)>=h.escalation.observed_elapsed_hours&&
      Number(p.source_alert_threshold_hours)===
        h.history.aging.source_alert_threshold_hours&&
      ['NO_OPEN_AGING_EXCEPTION_CLAIM','AGING_EXCEPTION_ESCALATION_OPEN_CLAIM',
        'AGING_EXCEPTION_SOURCE_CONFLICT_HOLD'].includes(p.aging_exception_result)&&
      (p.aging_exception_result!=='NO_OPEN_AGING_EXCEPTION_CLAIM'||
        followthrough.current_claim&&p.open_exception_count==='0'&&
        Number(p.observed_elapsed_hours)<=Number(p.source_alert_threshold_hours))&&
      (p.aging_exception_result!=='AGING_EXCEPTION_ESCALATION_OPEN_CLAIM'||
        Number(p.open_exception_count)>0||
        Number(p.observed_elapsed_hours)>Number(p.source_alert_threshold_hours))&&
      recent(p.observed_at,followthrough.signed_at,t)&&ID.test(p.witness_id)&&ID.test(p.key_id)});
  return {...r,clear_claim:r.signature_authenticated&&
    r.claim==='NO_OPEN_AGING_EXCEPTION_CLAIM',
    open_exception_count:r.signature_authenticated?
      Number(readback.envelope.payload.open_exception_count):null,
    elapsed_hours:r.signature_authenticated?
      Number(readback.envelope.payload.observed_elapsed_hours):null,
    original_escalation_or_case_closed_by_app:false};
}
export async function verifyCustody776({env,history,owner,followthrough,exception,
  readback,now=Date.now()}={}){
  const r=await verify({env,kind:'custody',history,owner,readback,
    canonicalFn:canonicalCustody776,now,
    valid:(p,h,t)=>followthrough?.signature_authenticated&&
      exception?.signature_authenticated&&
      p.schema==='rosie-independent-retention-custody-renewal-v776'&&
      p.followthrough_receipt_sha256===followthrough.receipt_sha256&&
      p.exception_disposition_receipt_sha256===exception.receipt_sha256&&
      p.prior_retention_continuity_receipt_sha256===h.retention.receipt_sha256&&
      p.prior_retained_source_history_sha256===h.retention.retained_source_history_sha256&&
      p.retained_source_history_sha256===h.retention.retained_source_history_sha256&&
      HASH.test(p.current_custody_renewal_register_sha256)&&integer(p.critical_exceptions)&&
      Number(p.critical_exceptions)>=h.retention.critical_count&&
      utc(p.custody_expires_at)&&Date.parse(p.custody_expires_at)>Date.parse(p.observed_at)&&
      Date.parse(p.custody_expires_at)<=Date.parse(p.observed_at)+30*86400000&&
      ['RETENTION_CUSTODY_RENEWAL_CURRENT_CLAIM',
        'RETENTION_CUSTODY_RENEWAL_PENDING_CLAIM',
        'RETENTION_CUSTODY_SOURCE_CONFLICT_HOLD'].includes(p.custody_renewal_result)&&
      (p.custody_renewal_result!=='RETENTION_CUSTODY_RENEWAL_CURRENT_CLAIM'||
        followthrough.current_claim&&exception.clear_claim&&
        p.critical_exceptions==='0'&&Date.parse(p.custody_expires_at)>t)&&
      recent(p.observed_at,exception.signed_at,t)&&ID.test(p.witness_id)&&ID.test(p.key_id)});
  return {...r,renewed_claim:r.signature_authenticated&&
    r.claim==='RETENTION_CUSTODY_RENEWAL_CURRENT_CLAIM',
    custody_expires_at:r.signature_authenticated?
      readback.envelope.payload.custody_expires_at:null,
    retained_source_history_sha256:r.signature_authenticated?
      readback.envelope.payload.retained_source_history_sha256:null,
    current_custody_renewal_register_sha256:r.signature_authenticated?
      readback.envelope.payload.current_custody_renewal_register_sha256:null,
    critical_count:r.signature_authenticated?
      Number(readback.envelope.payload.critical_exceptions):null,
    source_retention_modified_by_app:false};
}
export async function reconcile776({history,owner,followthrough,exception,custody,
  reviewed_at=new Date().toISOString()}={}){
  const follow_ups=[];
  if(!complete(history))follow_ups.push({code:'ORIGINAL_BUILD775_SIGNED_CHAIN_INCOMPLETE',
    action:'Reauthenticate every original Build 775 signer and source, including the current unexpired retention witness.'});
  if(!owner?.signature_authenticated)follow_ups.push({code:'ORIGINAL_OWNER_FOLLOWTHROUGH_MISSING',
    action:'Obtain original-owner signed fresh follow-through review or explicit HOLD.'});
  else if(!owner.requests_review)follow_ups.push({code:'ORIGINAL_OWNER_FOLLOWTHROUGH_HOLD',
    action:'Respect signed owner HOLD; do not execute a closure, renewal or escalation.'});
  if(!followthrough?.signature_authenticated)follow_ups.push({code:'INDEPENDENT_FOLLOWTHROUGH_WITNESS_MISSING',
    action:'Obtain independent original decision case, follow-through register digest and signed outcome.'});
  else if(!followthrough.current_claim)follow_ups.push({code:'FOLLOWTHROUGH_PENDING_OR_CONFLICTING',
    action:'Refer pending or conflicting follow-through to its original issuer and owner.'});
  if(!exception?.signature_authenticated)follow_ups.push({code:'AGING_EXCEPTION_DISPOSITION_MISSING',
    action:'Obtain independent elapsed hours, original SLA threshold, open exception count and disposition register.'});
  else if(!exception.clear_claim)follow_ups.push({code:'AGING_EXCEPTION_UNRESOLVED',
    action:'Escalate overdue or disputed original cases; preserve open exception history.'});
  if(!custody?.signature_authenticated)follow_ups.push({code:'RETENTION_CUSTODY_RENEWAL_MISSING',
    action:'Obtain independent source-history digest, custody register, critical count and bounded renewed expiry.'});
  else if(!custody.renewed_claim)follow_ups.push({code:'RETENTION_CUSTODY_NOT_CURRENT',
    action:'Original custodian must renew evidence and disposition critical exceptions.'});
  if(custody?.critical_count>0)follow_ups.push({code:'CRITICAL_RETENTION_EXCEPTION_OPEN',
    action:'Original custodian and DBA must independently disposition exceptions before any decision.'});
  const ready=follow_ups.length===0&&owner?.requests_review;
  follow_ups.push({code:'SEPARATE_ORIGINAL_OWNER_CUSTODIAN_ACTION_REQUIRED',
    action:'This review never performs original-owner sign-off, external dispute closure, retention enforcement or source deletion.'});
  const report={ok:true,build:776,read_only:true,
    predecessor_status:history?.report?.handoff_closure_decision_status||'HOLD',
    original_owner_followthrough_review:owner||null,
    independent_closure_followthrough:followthrough||null,
    independent_aging_exception_disposition:exception||null,
    independent_retention_custody_renewal:custody||null,
    owner_followthrough_status:ready?
      'READY_FOR_SEPARATE_ORIGINAL_OWNER_CUSTODIAN_FOLLOWTHROUGH_DECISION':
      'HOLD_OWNER_FOLLOWTHROUGH_AGING_OR_RETENTION_CUSTODY',
    original_owner_business_signoff_by_app:false,external_dispute_closed_by_app:false,
    original_custody_enforced_by_app:false,source_retention_modified_by_app:false,
    production_database_written_by_app:false,source_archive_modified_by_app:false,
    append_only_audit_written_by_app:false,notification_sent_by_app:false,
    automatic_business_action:false,closure_allowed:false,
    blocking_count:follow_ups.length,follow_ups,reviewed_at};
  report.packet_sha256=await hash(bytes(JSON.stringify({
    schema:'rosie-owner-followthrough-aging-retention-custody-v776',
    predecessor:history?.report?.packet_sha256||null,
    owner:owner?.receipt_sha256||null,followthrough:followthrough?.receipt_sha256||null,
    exception:exception?.receipt_sha256||null,custody:custody?.receipt_sha256||null,
    follow_ups,reviewed_at})));
  return report;
}
