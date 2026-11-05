import {sha256Receipt754} from './owner-receipt-verification-v754.js';
import {KEY_ROLES768,ORIGIN_ROLES768} from './economic-owner-acceptance-v768.js';
import {ROLES769} from './economic-handoff-retention-v769.js';
import {ROLES770} from './economic-owner-register-aging-v770.js';
import {ROLES771} from './economic-final-attestation-v771.js';
import {ROLES772} from './economic-resolution-sla-v772.js';
import {ROLES773} from './economic-disposition-renewal-v773.js';

// Claims are authenticated from original independent sources; none authorizes
// a business mutation or serves as an original owner's executed sign-off.
export const ROLES774=Object.freeze([
  'INDEPENDENT_RENEWAL_HANDOFF_WITNESS',
  'INDEPENDENT_DISPUTE_AGING_WITNESS',
  'INDEPENDENT_RETENTION_CLOSURE_READINESS_WITNESS'
]);
const SCOPE=['schema','booking_id','source_record_id','trial_id',
  'change_ticket_id','execution_request_id','production_project_ref'];
export const OWNER_FIELDS774=Object.freeze([...SCOPE,
  'original_owner_review_receipt_sha256','external_disposition_receipt_sha256',
  'signoff_renewal_receipt_sha256','retention_remediation_receipt_sha256',
  'handoff_choice','handoff_ticket_id','owner_id','issued_at','nonce','key_id']);
export const HANDOFF_FIELDS774=Object.freeze([...SCOPE,
  'owner_handoff_receipt_sha256','prior_signoff_renewal_receipt_sha256',
  'prior_renewal_register_sha256','current_handoff_register_sha256',
  'handoff_case_id','handoff_result','observed_at','witness_id','key_id']);
export const AGING_FIELDS774=Object.freeze([...SCOPE,
  'owner_handoff_receipt_sha256','handoff_receipt_sha256',
  'prior_disposition_receipt_sha256','prior_disposition_register_sha256',
  'current_aging_register_sha256','age_hours','source_alert_threshold_hours',
  'open_disputes','aging_result','observed_at','witness_id','key_id']);
export const CLOSURE_FIELDS774=Object.freeze([...SCOPE,
  'owner_handoff_receipt_sha256','handoff_receipt_sha256','aging_receipt_sha256',
  'prior_retention_remediation_receipt_sha256','prior_remediation_register_sha256',
  'original_sla_policy_sha256',
  'current_retention_witness_register_sha256','critical_retention_exceptions',
  'closure_witness_result','readiness_expires_at','observed_at','witness_id','key_id']);
const HASH=/^[a-f0-9]{64}$/i;
const ID=/^[A-Za-z0-9][A-Za-z0-9._:/-]{5,119}$/;
const UUID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const count=s=>typeof s==='string'&&/^(?:0|[1-9]\d{0,5})$/.test(s);
const utc=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(s)&&Number.isFinite(Date.parse(s));
const recent=(when,after,now)=>utc(when)&&utc(after)&&
  Date.parse(when)>=Date.parse(after)&&Date.parse(when)<=now+300000&&
  now-Date.parse(when)<=7*86400000;
const hold=(status,detail,extra={})=>({status,detail,
  signature_authenticated:false,receipt_sha256:null,...extra});
const hash=x=>sha256Receipt754(x);
const t=x=>new TextEncoder().encode(x);
function canonical(payload,fields,domain){
  if(!payload||typeof payload!=='object'||Array.isArray(payload)||
    Object.keys(payload).length!==fields.length||
    !fields.every(f=>Object.hasOwn(payload,f)&&typeof payload[f]==='string'))
    throw Error('Noncanonical original owner handoff or closure witness evidence.');
  return t(domain+JSON.stringify(fields.map(f=>[f,payload[f]])));
}
export const canonicalOwner774=p=>canonical(p,OWNER_FIELDS774,
  'rosie-original-owner-renewal-handoff-v774:');
export const canonicalHandoff774=p=>canonical(p,HANDOFF_FIELDS774,
  'rosie-independent-renewal-handoff-witness-v774:');
export const canonicalAging774=p=>canonical(p,AGING_FIELDS774,
  'rosie-independent-dispute-disposition-aging-v774:');
export const canonicalClosure774=p=>canonical(p,CLOSURE_FIELDS774,
  'rosie-independent-retention-closure-witness-v774:');

function decode(base64,length){
  if(typeof base64!=='string'||base64.length>200||base64.length%4||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64))return null;
  try{const x=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));
    return x.length===length?x:null;}catch{return null;}
}
const keyRoles=[...KEY_ROLES768,...ROLES769,...ROLES770,...ROLES771,...ROLES772,...ROLES773,...ROLES774];
const originRoles=[...ORIGIN_ROLES768,...ROLES769,...ROLES770,...ROLES771,...ROLES772,...ROLES773,...ROLES774];
function key(env,role,keyId){
  const ids=new Set(),pubs=new Set();let chosen=null;
  for(const name of keyRoles){
    const p=decode(env?.[`ROSIE_ECONOMIC_${name}_PUBLIC_KEY_B64`],32);
    const id=env?.[`ROSIE_ECONOMIC_${name}_KEY_ID`];
    if(!p||typeof id!=='string'||!ID.test(id)||ids.has(id))return null;
    const fingerprint=Array.from(p).join(',');if(pubs.has(fingerprint))return null;
    ids.add(id);pubs.add(fingerprint);
    if(name===role&&id===keyId)chosen=p;
  }
  return chosen;
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
async function authenticate(envelope,bytes,pub){
  if(!pub||!envelope||typeof envelope!=='object'||Array.isArray(envelope)||
    Object.keys(envelope).length!==2||!Object.hasOwn(envelope,'payload')||
    !Object.hasOwn(envelope,'signature_b64'))return false;
  const signature=decode(envelope.signature_b64,64);if(!signature)return false;
  try{const k=await crypto.subtle.importKey('raw',pub,{name:'Ed25519'},false,['verify']);
    return crypto.subtle.verify('Ed25519',k,signature,bytes);
  }catch{return false;}
}
const original=h=>h?.history?.history?.history?.history?.ctx;
const complete=h=>h?.report?.ok===true&&
  h?.report?.external_disposition_signoff_status===
  'READY_FOR_SEPARATE_ORIGINAL_OWNER_MANUAL_DISPOSITION_REVIEW'&&
  h?.owner?.signature_authenticated===true&&
  h?.disposition?.clean_claim===true&&h?.renewal?.renewal_current_claim===true&&
  h?.remediation?.clean_claim===true&&
  original(h)?.prior?.ok===true&&UUID.test(original(h)?.record?.booking_id||'');
const scope=(p,h)=>complete(h)&&
  p?.booking_id===original(h).record.booking_id&&
  p?.source_record_id===original(h).record.source_record_id&&
  p?.change_ticket_id===original(h).record.change_ticket_id&&
  p?.execution_request_id===original(h).record.execution_request_id&&
  p?.trial_id===original(h).prior.verified_scope.trial_id&&
  p?.production_project_ref===original(h).prior.verified_scope.production_project_ref;

export async function verifyOwner774({env,history,envelope,now=Date.now()}={}){
  const p=envelope?.payload;let bytes;
  try{bytes=canonicalOwner774(p);}catch{return hold('HOLD_OWNER_HANDOFF_FORMAT',
    'Fresh original owner handoff decision has noncanonical fields.');}
  if(p.schema!=='rosie-original-owner-renewal-handoff-v774'||!scope(p,history)||
    p.original_owner_review_receipt_sha256!==history.owner.receipt_sha256||
    p.external_disposition_receipt_sha256!==history.disposition.receipt_sha256||
    p.signoff_renewal_receipt_sha256!==history.renewal.receipt_sha256||
    p.retention_remediation_receipt_sha256!==history.remediation.receipt_sha256||
    !['REQUEST_SEPARATE_RENEWAL_HANDOFF','HOLD_EXTERNAL_DISPUTE_AGING',
      'HOLD_RETENTION_CLOSURE_WITNESS'].includes(p.handoff_choice)||
    !ID.test(p.handoff_ticket_id)||!ID.test(p.owner_id)||
    !/^[a-f0-9]{32,64}$/i.test(p.nonce)||!ID.test(p.key_id)||
    !recent(p.issued_at,history.remediation.signed_at,now))
    return hold('HOLD_OWNER_HANDOFF_SCOPE','Original owner handoff must bind exact Build 773 signed witnesses.');
  const k=key(env,'OWNER_RECEIPT',p.key_id);
  if(!k)return hold('HOLD_OWNER_HANDOFF_KEY_INDEPENDENCE','Forty-five distinct signing identities required.');
  if(!origins(env))return hold('HOLD_OWNER_HANDOFF_ORIGIN_INDEPENDENCE','Thirty-six distinct HTTPS origins required.');
  if(!await authenticate(envelope,bytes,k))return hold('HOLD_OWNER_HANDOFF_SIGNATURE','Owner signature invalid.');
  return hold('SIGNED_ORIGINAL_OWNER_HANDOFF_REQUEST','Signed owner request; no business sign-off or renewal executed.',{
    signature_authenticated:true,receipt_sha256:await hash(bytes),
    signed_at:p.issued_at,choice:p.handoff_choice,
    requests_handoff:p.handoff_choice==='REQUEST_SEPARATE_RENEWAL_HANDOFF',
    actual_owner_renewal_executed_by_app:false});
}
const routes={
  handoff:[ROLES774[0],'/v1/economic-owner-renewal-handoff-v774'],
  aging:[ROLES774[1],'/v1/economic-dispute-disposition-aging-v774'],
  closure:[ROLES774[2],'/v1/economic-retention-closure-readiness-v774']
};
export function receiptURL774(env,kind,history,owner,handoff,aging){
  if(!Object.hasOwn(routes,kind)||!scope({...original(history)?.record,
    trial_id:original(history)?.prior?.verified_scope?.trial_id,
    production_project_ref:original(history)?.prior?.verified_scope?.production_project_ref},history)||
    !owner?.signature_authenticated||
    kind!=='handoff'&&!handoff?.signature_authenticated||
    kind==='closure'&&!aging?.signature_authenticated)return null;
  const urls=origins(env);if(!urls)return null;
  const [role,path]=routes[kind],url=new URL(path,urls[role]);
  const params={booking_id:original(history).record.booking_id,
    source_record_id:original(history).record.source_record_id,
    change_ticket_id:original(history).record.change_ticket_id,
    execution_request_id:original(history).record.execution_request_id,
    owner_handoff_receipt_sha256:owner.receipt_sha256,
    ...(kind==='handoff'?{}:{handoff_receipt_sha256:handoff.receipt_sha256}),
    ...(kind==='closure'?{aging_receipt_sha256:aging.receipt_sha256}:{})};
  for(const [k,v] of Object.entries(params))url.searchParams.set(k,v);
  return url.toString();
}
export async function readReceipt774(env,kind,history,owner,handoff,aging,fetcher=fetch){
  const url=receiptURL774(env,kind,history,owner,handoff,aging);
  if(!url)return {status:`HOLD_${String(kind).toUpperCase()}_SOURCE_NOT_CONFIGURED`};
  try{const response=await fetcher(url,{method:'GET',redirect:'error',
    headers:{Accept:'application/json','Cache-Control':'no-store'}});
    if(!response.ok)return {status:`HOLD_${kind.toUpperCase()}_SOURCE_UNAVAILABLE`};
    const raw=await response.text();if(raw.length>16000)return {status:`HOLD_${kind.toUpperCase()}_SOURCE_OVERSIZED`};
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
    return hold(readback?.status||`HOLD_${kind.toUpperCase()}_MISSING`,'Original independent evidence unavailable.');
  const p=readback.envelope?.payload;let bytes;
  try{bytes=canonicalFn(p);}catch{return hold(`HOLD_${kind.toUpperCase()}_FORMAT`,'Noncanonical original issuer receipt.');}
  if(!scope(p,history)||!owner?.signature_authenticated||
    p.owner_handoff_receipt_sha256!==owner.receipt_sha256||!valid(p,history,now))
    return hold(`HOLD_${kind.toUpperCase()}_SCOPE`,'Original source scope, digest, chronology or threshold conflicts.');
  const k=key(env,routes[kind][0],p.key_id);
  if(!k)return hold(`HOLD_${kind.toUpperCase()}_KEY_INDEPENDENCE`,'All forty-five signing identities must be distinct.');
  if(!origins(env))return hold(`HOLD_${kind.toUpperCase()}_ORIGIN_INDEPENDENCE`,'All thirty-six HTTPS origins must be distinct.');
  if(!await authenticate(readback.envelope,bytes,k))
    return hold(`HOLD_${kind.toUpperCase()}_SIGNATURE`,'Original issuer signature invalid.');
  return hold(`SIGNED_${kind.toUpperCase()}_CLAIM`,'Original signed external evidence claim; no source state changed.',{
    signature_authenticated:true,receipt_sha256:await hash(bytes),
    signed_at:p.observed_at,claim:p.handoff_result||p.aging_result||p.closure_witness_result});
}
export async function verifyHandoff774({env,history,owner,readback,now=Date.now()}={}){
  const r=await verify({env,kind:'handoff',history,owner,readback,canonicalFn:canonicalHandoff774,now,
    valid:(p,h,time)=>p.schema==='rosie-independent-renewal-handoff-witness-v774'&&
      p.prior_signoff_renewal_receipt_sha256===h.renewal.receipt_sha256&&
      p.prior_renewal_register_sha256===h.renewal.current_renewal_register_sha256&&
      HASH.test(p.current_handoff_register_sha256)&&ID.test(p.handoff_case_id)&&
      ['OWNER_RENEWAL_HANDOFF_ACKNOWLEDGED_CLAIM','OWNER_RENEWAL_HANDOFF_PENDING_CLAIM',
        'OWNER_RENEWAL_HANDOFF_DISPUTED_HOLD'].includes(p.handoff_result)&&
      (p.handoff_result!=='OWNER_RENEWAL_HANDOFF_ACKNOWLEDGED_CLAIM'||owner.requests_handoff)&&
      recent(p.observed_at,owner.signed_at,time)&&ID.test(p.witness_id)&&ID.test(p.key_id)});
  return {...r,acknowledged_claim:r.signature_authenticated&&r.claim==='OWNER_RENEWAL_HANDOFF_ACKNOWLEDGED_CLAIM',
    current_handoff_register_sha256:r.signature_authenticated?
      readback.envelope.payload.current_handoff_register_sha256:null,
    owner_handoff_executed_by_app:false};
}
export async function verifyAging774({env,history,owner,handoff,readback,now=Date.now()}={}){
  const r=await verify({env,kind:'aging',history,owner,readback,canonicalFn:canonicalAging774,now,
    valid:(p,h,time)=>handoff?.signature_authenticated&&
      p.schema==='rosie-independent-dispute-disposition-aging-v774'&&
      p.handoff_receipt_sha256===handoff.receipt_sha256&&
      p.prior_disposition_receipt_sha256===h.disposition.receipt_sha256&&
      p.prior_disposition_register_sha256===h.disposition.current_disposition_register_sha256&&
      HASH.test(p.current_aging_register_sha256)&&count(p.age_hours)&&count(p.open_disputes)&&
      count(p.source_alert_threshold_hours)&&Number(p.source_alert_threshold_hours)>0&&
      Number(p.source_alert_threshold_hours)===h.history?.history?.history?.aging?.source_alert_threshold_hours&&
      Number(p.age_hours)>=h.history?.sla?.elapsed_hours&&
      Number(p.age_hours)>=Math.floor((Date.parse(p.observed_at)-Date.parse(h.history.sla.signed_at))/3600000)&&
      ['NO_OPEN_DISPUTE_AGING_CLAIM','DISPUTE_AGING_ESCALATION_CLAIM',
        'DISPUTE_AGING_SOURCE_CONFLICT_HOLD'].includes(p.aging_result)&&
      (p.aging_result!=='NO_OPEN_DISPUTE_AGING_CLAIM'||
        handoff.acknowledged_claim&&p.open_disputes==='0'&&
        Number(p.age_hours)<=Number(p.source_alert_threshold_hours))&&
      (p.aging_result!=='DISPUTE_AGING_ESCALATION_CLAIM'||
        Number(p.age_hours)>Number(p.source_alert_threshold_hours)||Number(p.open_disputes)>0)&&
      recent(p.observed_at,handoff.signed_at,time)&&ID.test(p.witness_id)&&ID.test(p.key_id)});
  return {...r,clean_claim:r.signature_authenticated&&r.claim==='NO_OPEN_DISPUTE_AGING_CLAIM',
    current_aging_register_sha256:r.signature_authenticated?
      readback.envelope.payload.current_aging_register_sha256:null,
    observed_age_hours:r.signature_authenticated?Number(readback.envelope.payload.age_hours):null,
    source_alert_threshold_hours:r.signature_authenticated?
      Number(readback.envelope.payload.source_alert_threshold_hours):null,
    observed_open_disputes:r.signature_authenticated?Number(readback.envelope.payload.open_disputes):null,
    original_dispute_closed_by_app:false};
}
export async function verifyClosure774({env,history,owner,handoff,aging,readback,now=Date.now()}={}){
  const r=await verify({env,kind:'closure',history,owner,readback,canonicalFn:canonicalClosure774,now,
    valid:(p,h,time)=>handoff?.signature_authenticated&&aging?.signature_authenticated&&
      p.schema==='rosie-independent-retention-closure-witness-v774'&&
      p.handoff_receipt_sha256===handoff.receipt_sha256&&
      p.aging_receipt_sha256===aging.receipt_sha256&&
      p.prior_retention_remediation_receipt_sha256===h.remediation.receipt_sha256&&
      p.prior_remediation_register_sha256===h.remediation.current_remediation_register_sha256&&
      p.original_sla_policy_sha256===h.history?.sla?.sla_policy_sha256&&
      HASH.test(p.current_retention_witness_register_sha256)&&
      count(p.critical_retention_exceptions)&&
      Number(p.critical_retention_exceptions)>=h.remediation.critical_count&&
      utc(p.readiness_expires_at)&&Date.parse(p.readiness_expires_at)>Date.parse(p.observed_at)&&
      Date.parse(p.readiness_expires_at)<=Date.parse(p.observed_at)+30*86400000&&
      ['RETENTION_CLOSURE_WITNESS_READY_CLAIM','RETENTION_CLOSURE_PENDING_REVIEW_CLAIM',
        'RETENTION_CLOSURE_SOURCE_CONFLICT_HOLD'].includes(p.closure_witness_result)&&
      (p.closure_witness_result!=='RETENTION_CLOSURE_WITNESS_READY_CLAIM'||
        aging.clean_claim&&handoff.acknowledged_claim&&
        p.critical_retention_exceptions==='0'&&Date.parse(p.readiness_expires_at)>time)&&
      recent(p.observed_at,aging.signed_at,time)&&ID.test(p.witness_id)&&ID.test(p.key_id)});
  return {...r,ready_claim:r.signature_authenticated&&r.claim==='RETENTION_CLOSURE_WITNESS_READY_CLAIM',
    current_retention_witness_register_sha256:r.signature_authenticated?
      readback.envelope.payload.current_retention_witness_register_sha256:null,
    critical_retention_exceptions:r.signature_authenticated?
      Number(readback.envelope.payload.critical_retention_exceptions):null,
    readiness_expires_at:r.signature_authenticated?
      readback.envelope.payload.readiness_expires_at:null,
    source_retention_closed_by_app:false};
}
export async function reconcile774({history,owner,handoff,aging,closure,reviewed_at=new Date().toISOString()}={}){
  const follow_ups=[];
  if(!complete(history))follow_ups.push({code:'BUILD773_ORIGINAL_SIGNED_CHAIN_INCOMPLETE',
    action:'Reauthenticate original signed Build 773 owner, disposition, renewal and retention sources.'});
  if(!owner?.signature_authenticated)follow_ups.push({code:'ORIGINAL_OWNER_RENEWAL_HANDOFF_UNVERIFIED',
    action:'Obtain a fresh original-owner signed handoff request or explicit HOLD.'});
  else if(!owner.requests_handoff)follow_ups.push({code:'ORIGINAL_OWNER_RENEWAL_HANDOFF_HELD',
    action:'Respect the signed owner HOLD; escalate the real external dispute or retention exception.'});
  if(!handoff?.signature_authenticated)follow_ups.push({code:'INDEPENDENT_RENEWAL_HANDOFF_RECEIPT_MISSING',
    action:'Obtain signed acknowledgment from independent original handoff custodian.'});
  else if(!handoff.acknowledged_claim)follow_ups.push({code:'EXTERNAL_HANDOFF_PENDING_OR_DISPUTED',
    action:'Resolve pending or disputed acknowledgment with original recipient.'});
  if(!aging?.signature_authenticated)follow_ups.push({code:'EXTERNAL_DISPUTE_AGING_RECEIPT_MISSING',
    action:'Obtain signed source alert threshold, elapsed age and open-dispute count.'});
  else if(!aging.clean_claim)follow_ups.push({code:'EXTERNAL_DISPUTE_AGING_OPEN',
    action:'Escalate overdue or conflicting original disposition evidence.'});
  if(!closure?.signature_authenticated)follow_ups.push({code:'RETENTION_CLOSURE_WITNESS_MISSING',
    action:'Obtain independent signed retention closure-readiness witness and expiry.'});
  else if(!closure.ready_claim)follow_ups.push({code:'RETENTION_CLOSURE_WITNESS_NOT_READY',
    action:'Preserve original retention evidence and refer unresolved critical exceptions.'});
  const ready=follow_ups.length===0&&owner.requests_handoff;
  follow_ups.push({code:'EXTERNAL_OWNER_CUSTODIAN_ACTION_STILL_REQUIRED',
    action:'Original owner and custodian must separately execute real handoff, renewal, case resolution and retention closure.'});
  const report={ok:true,build:774,read_only:true,
    predecessor_disposition_status:history?.report?.external_disposition_signoff_status||'HOLD',
    original_owner_handoff_review:owner||null,
    independent_renewal_handoff_acknowledgment:handoff||null,
    independent_external_dispute_aging:aging||null,
    independent_retention_closure_witness:closure||null,
    owner_renewal_handoff_status:ready?'READY_FOR_SEPARATE_ORIGINAL_OWNER_RENEWAL_HANDOFF':
      'HOLD_OWNER_RENEWAL_DISPUTE_AGING_OR_RETENTION_CLOSURE',
    original_owner_business_signoff_by_app:false,external_handoff_executed_by_app:false,
    original_dispute_closed_by_app:false,retention_closed_by_app:false,
    production_database_written_by_app:false,source_archive_modified_by_app:false,
    append_only_audit_written_by_app:false,notification_sent_by_app:false,
    automatic_business_action:false,closure_allowed:false,
    blocking_count:follow_ups.length,follow_ups,reviewed_at};
  report.packet_sha256=await hash(t(JSON.stringify({schema:'rosie-owner-renewal-handoff-dispute-aging-v774',
    predecessor:history?.report?.packet_sha256||null,owner:owner?.receipt_sha256||null,
    handoff:handoff?.receipt_sha256||null,aging:aging?.receipt_sha256||null,
    closure:closure?.receipt_sha256||null,follow_ups,reviewed_at})));
  return report;
}
