import {sha256Receipt754} from './owner-receipt-verification-v754.js';
import {KEY_ROLES768,ORIGIN_ROLES768} from './economic-owner-acceptance-v768.js';
import {ROLES769} from './economic-handoff-retention-v769.js';
import {ROLES770} from './economic-owner-register-aging-v770.js';
import {ROLES771} from './economic-final-attestation-v771.js';
import {ROLES772} from './economic-resolution-sla-v772.js';

// All independent source statements are evidence claims, not site-side writes.
export const ROLES773=Object.freeze([
  'INDEPENDENT_EXTERNAL_DISPOSITION_WITNESS',
  'INDEPENDENT_OWNER_RENEWAL_WITNESS',
  'INDEPENDENT_SLA_REMEDIATION_WITNESS'
]);
export const OWNER_FIELDS773=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id',
  'execution_request_id','production_project_ref',
  'original_owner_continuity_receipt_sha256','external_resolution_receipt_sha256',
  'signoff_continuity_receipt_sha256','retention_sla_receipt_sha256',
  'manual_review_choice','manual_review_ticket_id','owner_id','issued_at','nonce','key_id'
]);
export const DISPOSITION_FIELDS773=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id',
  'execution_request_id','production_project_ref','owner_review_receipt_sha256',
  'external_resolution_receipt_sha256','original_resolution_register_sha256',
  'current_disposition_register_sha256','disposition_case_id',
  'disposition_result','observed_at','witness_id','key_id'
]);
export const RENEWAL_FIELDS773=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id',
  'execution_request_id','production_project_ref','owner_review_receipt_sha256',
  'disposition_receipt_sha256','original_signoff_receipt_sha256',
  'original_continuity_register_sha256','current_renewal_register_sha256',
  'renewal_result','renewal_expires_at','witnessed_at','witness_id','key_id'
]);
export const REMEDIATION_FIELDS773=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id',
  'execution_request_id','production_project_ref','owner_review_receipt_sha256',
  'disposition_receipt_sha256','renewal_receipt_sha256',
  'original_sla_receipt_sha256','original_sla_policy_sha256',
  'current_remediation_register_sha256','remediation_case_id',
  'elapsed_hours','target_hours','critical_exceptions_remaining',
  'remediation_result','inspected_at','witness_id','key_id'
]);
const HASH=/^[a-f0-9]{64}$/i;
const ID=/^[A-Za-z0-9][A-Za-z0-9._:/-]{5,119}$/;
const UUID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const t=s=>new TextEncoder().encode(s);
const hash=data=>sha256Receipt754(data);
const hold=(status,detail,extra={})=>({status,detail,signature_authenticated:false,
  receipt_sha256:null,...extra});
const utc=s=>typeof s==='string'&&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(s)&&
  Number.isFinite(Date.parse(s));
const recent=(when,after,now)=>utc(when)&&utc(after)&&
  Date.parse(when)>=Date.parse(after)&&Date.parse(when)<=now+300000&&
  now-Date.parse(when)<=7*86400000;
const count=s=>typeof s==='string'&&/^(?:0|[1-9]\d{0,5})$/.test(s);
function canonical(p,fields,domain){
  if(!p||typeof p!=='object'||Array.isArray(p)||
    Object.keys(p).length!==fields.length||
    !fields.every(f=>Object.hasOwn(p,f)&&typeof p[f]==='string'))
    throw Error('Noncanonical external disposition or sign-off renewal evidence.');
  return t(domain+JSON.stringify(fields.map(f=>[f,p[f]])));
}
export const canonicalOwner773=p=>canonical(p,OWNER_FIELDS773,
  'rosie-original-owner-disposition-renewal-review-v773:');
export const canonicalDisposition773=p=>canonical(p,DISPOSITION_FIELDS773,
  'rosie-independent-external-disposition-v773:');
export const canonicalRenewal773=p=>canonical(p,RENEWAL_FIELDS773,
  'rosie-independent-owner-signoff-renewal-v773:');
export const canonicalRemediation773=p=>canonical(p,REMEDIATION_FIELDS773,
  'rosie-independent-retention-sla-remediation-v773:');
function decode(s,len){
  if(typeof s!=='string'||s.length>200||s.length%4||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(s))return null;
  try{const b=Uint8Array.from(atob(s),c=>c.charCodeAt(0));
    return b.length===len?b:null;}catch{return null;}
}
const keyRoles=[...KEY_ROLES768,...ROLES769,...ROLES770,...ROLES771,...ROLES772,...ROLES773];
const originRoles=[...ORIGIN_ROLES768,...ROLES769,...ROLES770,...ROLES771,...ROLES772,...ROLES773];
function signer(env,role,id){
  const ids=new Set(),keys=new Set();let selected=null;
  for(const name of keyRoles){
    const key=decode(env?.[`ROSIE_ECONOMIC_${name}_PUBLIC_KEY_B64`],32);
    const keyId=env?.[`ROSIE_ECONOMIC_${name}_KEY_ID`];
    if(!key||typeof keyId!=='string'||!ID.test(keyId)||ids.has(keyId))return null;
    const fingerprint=Array.from(key).join(',');if(keys.has(fingerprint))return null;
    ids.add(keyId);keys.add(fingerprint);
    if(name===role&&keyId===id)selected=key;
  }
  return selected;
}
function sources(env){
  try{const urls=originRoles.map(name=>new URL(env?.[`ROSIE_ECONOMIC_${name}_BASE_URL`]));
    if(urls.some(u=>u.protocol!=='https:'||u.username||u.password||u.port||
      u.search||u.hash||u.pathname!=='/'||!u.hostname.includes('.')||
      u.hostname==='localhost'||u.hostname.startsWith('[')||
      /^(?:\d{1,3}\.){3}\d{1,3}$/.test(u.hostname)||
      /\.(?:local|localhost|internal)$/i.test(u.hostname))||
      new Set(urls.map(u=>u.origin)).size!==urls.length)return null;
    return Object.fromEntries(originRoles.map((role,i)=>[role,urls[i]]));
  }catch{return null;}
}
async function authentic(envelope,transcript,key){
  if(!key||!envelope||typeof envelope!=='object'||Array.isArray(envelope)||
    Object.keys(envelope).length!==2||!Object.hasOwn(envelope,'payload')||
    !Object.hasOwn(envelope,'signature_b64'))return false;
  const sig=decode(envelope.signature_b64,64);if(!sig)return false;
  try{const pk=await crypto.subtle.importKey('raw',key,{name:'Ed25519'},false,['verify']);
    return crypto.subtle.verify('Ed25519',pk,sig,transcript);
  }catch{return false;}
}
const complete=h=>h?.report?.ok===true&&h?.history?.report?.ok===true&&
  h?.owner?.signature_authenticated===true&&
  h?.resolution?.signature_authenticated===true&&
  h?.signoff?.signature_authenticated===true&&
  h?.sla?.signature_authenticated===true&&
  h?.history?.history?.history?.ctx?.prior?.ok===true&&
  UUID.test(h?.history?.history?.history?.ctx?.record?.booking_id||'')&&
  UUID.test(h?.history?.history?.history?.ctx?.record?.source_record_id||'');
const record=h=>h.history.history.history.ctx.record;
const prior=h=>h.history.history.history.ctx.prior;
const scope=(p,h)=>complete(h)&&
  p?.booking_id===record(h).booking_id&&
  p?.source_record_id===record(h).source_record_id&&
  p?.change_ticket_id===record(h).change_ticket_id&&
  p?.execution_request_id===record(h).execution_request_id&&
  p?.trial_id===prior(h).verified_scope.trial_id&&
  p?.production_project_ref===prior(h).verified_scope.production_project_ref;
export async function verifyOwner773({env,history,envelope,now=Date.now()}={}){
  const p=envelope?.payload;let transcript;
  try{transcript=canonicalOwner773(p);}catch{
    return hold('HOLD_OWNER_RENEWAL_FORMAT','Fresh original owner review envelope is noncanonical.');}
  const choices=['REQUEST_SEPARATE_DISPOSITION_SIGNOFF_REVIEW',
    'REQUEST_ORIGINAL_OWNER_SIGNOFF_RENEWAL','REQUEST_RETENTION_SLA_REMEDIATION_HOLD'];
  if(p.schema!=='rosie-original-owner-disposition-renewal-review-v773'||
    !scope(p,history)||
    p.original_owner_continuity_receipt_sha256!==history.owner.receipt_sha256||
    p.external_resolution_receipt_sha256!==history.resolution.receipt_sha256||
    p.signoff_continuity_receipt_sha256!==history.signoff.receipt_sha256||
    p.retention_sla_receipt_sha256!==history.sla.receipt_sha256||
    !choices.includes(p.manual_review_choice)||
    (p.manual_review_choice===choices[0]&&
      history.report.final_owner_resolution_status!==
      'READY_FOR_SEPARATE_MANUAL_ORIGINAL_OWNER_SIGNOFF_REVIEW')||
    !ID.test(p.manual_review_ticket_id)||!ID.test(p.owner_id)||
    !/^[a-f0-9]{32,64}$/i.test(p.nonce)||!ID.test(p.key_id)||
    !recent(p.issued_at,history.sla.signed_at,now))
    return hold('HOLD_OWNER_RENEWAL_SCOPE','Owner decision must bind original signed Build 772 review.');
  const key=signer(env,'OWNER_RECEIPT',p.key_id);
  if(!key)return hold('HOLD_OWNER_RENEWAL_SIGNER_INDEPENDENCE',
    'Forty-two independently pinned original signing keys required.');
  if(!sources(env))return hold('HOLD_OWNER_RENEWAL_ORIGIN_INDEPENDENCE',
    'Thirty-three distinct original HTTPS issuer origins required.');
  if(!await authentic(envelope,transcript,key))
    return hold('HOLD_OWNER_RENEWAL_SIGNATURE','Original owner signature invalid.');
  return hold('SIGNED_ORIGINAL_OWNER_DISPOSITION_RENEWAL_REQUEST',
    'Authentic manual owner review request only; no external record changed.',
    {signature_authenticated:true,receipt_sha256:await hash(transcript),
      signed_at:p.issued_at,choice:p.manual_review_choice,
      requests_manual_signoff:p.manual_review_choice===choices[0],
      requests_renewal:p.manual_review_choice===choices[1],
      requests_sla_hold:p.manual_review_choice===choices[2],
      actual_owner_business_signoff_by_app:false});
}
const routes={
  disposition:[ROLES773[0],'/v1/economic-original-disposition-v773'],
  renewal:[ROLES773[1],'/v1/economic-owner-signoff-renewal-v773'],
  remediation:[ROLES773[2],'/v1/economic-retention-sla-remediation-v773']
};
export function receiptURL773(env,kind,history,owner,disposition,renewal){
  if(!Object.hasOwn(routes,kind)||!complete(history)||
    !owner?.signature_authenticated||
    kind!=='disposition'&&!disposition?.signature_authenticated||
    kind==='remediation'&&!renewal?.signature_authenticated)return null;
  const pinned=sources(env);if(!pinned)return null;
  const [role,path]=routes[kind],url=new URL(path,pinned[role]);
  const params={booking_id:record(history).booking_id,
    source_record_id:record(history).source_record_id,
    change_ticket_id:record(history).change_ticket_id,
    execution_request_id:record(history).execution_request_id,
    original_owner_review_receipt_sha256:owner.receipt_sha256,
    ...(kind==='disposition'?{}:{disposition_receipt_sha256:disposition.receipt_sha256}),
    ...(kind==='remediation'?{renewal_receipt_sha256:renewal.receipt_sha256}:{})};
  for(const [key,value] of Object.entries(params))url.searchParams.set(key,value);
  return url.toString();
}
export async function readReceipt773(env,kind,history,owner,disposition,renewal,
  fetcher=fetch){
  const url=receiptURL773(env,kind,history,owner,disposition,renewal);
  if(!url)return {status:`HOLD_${String(kind).toUpperCase()}_SOURCE_NOT_CONFIGURED`};
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
async function verify({env,kind,history,owner,readback,canonicalFn,valid,now}){
  if(readback?.status!==`SIGNED_${kind.toUpperCase()}_READBACK`)
    return hold(readback?.status||`HOLD_${kind.toUpperCase()}_MISSING`,
      'Original independent issuer receipt is unavailable.');
  const p=readback.envelope?.payload;let transcript;
  try{transcript=canonicalFn(p);}catch{return hold(`HOLD_${kind.toUpperCase()}_FORMAT`,
    'Original independent issuer receipt is noncanonical.');}
  if(!scope(p,history)||!owner?.signature_authenticated||
    p.owner_review_receipt_sha256!==owner.receipt_sha256||!valid(p,history,now))
    return hold(`HOLD_${kind.toUpperCase()}_SCOPE`,
      'Signed original scope, prior digest, chronology or disposition conflicts.');
  const key=signer(env,routes[kind][0],p.key_id);
  if(!key)return hold(`HOLD_${kind.toUpperCase()}_SIGNER_INDEPENDENCE`,
    'All forty-two signing identities must be distinct.');
  if(!sources(env))return hold(`HOLD_${kind.toUpperCase()}_ORIGIN_INDEPENDENCE`,
    'All thirty-three source origins must be distinct HTTPS issuers.');
  if(!await authentic(readback.envelope,transcript,key))
    return hold(`HOLD_${kind.toUpperCase()}_SIGNATURE`,
      'Original independent issuer Ed25519 signature invalid.');
  return hold(`SIGNED_${kind.toUpperCase()}_CLAIM`,
    'Signed external evidence claim only, not an original business change.',
    {signature_authenticated:true,receipt_sha256:await hash(transcript),
      signed_at:p.observed_at||p.witnessed_at||p.inspected_at,
      claim:p.disposition_result||p.renewal_result||p.remediation_result});
}
export async function verifyDisposition773({env,history,owner,readback,
  now=Date.now()}={}){
  const r=await verify({env,kind:'disposition',history,owner,readback,
    canonicalFn:canonicalDisposition773,now,
    valid:(p,h,time)=>p.schema==='rosie-independent-external-disposition-v773'&&
      p.external_resolution_receipt_sha256===h.resolution.receipt_sha256&&
      p.original_resolution_register_sha256===h.resolution.current_resolution_register_sha256&&
      HASH.test(p.current_disposition_register_sha256)&&
      ID.test(p.disposition_case_id)&&
      ['NO_OPEN_EXTERNAL_DISPUTE_CLAIM','EXTERNAL_DISPUTE_REFERRED_CLAIM',
        'EXTERNAL_DISPOSITION_SOURCE_CONFLICT_HOLD'].includes(p.disposition_result)&&
      (p.disposition_result!=='NO_OPEN_EXTERNAL_DISPUTE_CLAIM'||
        owner.requests_manual_signoff&&h.resolution.clean_claim)&&
      (p.disposition_result!=='EXTERNAL_DISPUTE_REFERRED_CLAIM'||
        owner.requests_renewal||h.resolution.dispute_still_open_claim)&&
      recent(p.observed_at,owner.signed_at,time)&&ID.test(p.witness_id)&&ID.test(p.key_id)});
  return {...r,clean_claim:r.signature_authenticated&&
    r.claim==='NO_OPEN_EXTERNAL_DISPUTE_CLAIM',
    original_dispute_disposition_written_by_app:false};
}
export async function verifyRenewal773({env,history,owner,disposition,readback,
  now=Date.now()}={}){
  const r=await verify({env,kind:'renewal',history,owner,readback,
    canonicalFn:canonicalRenewal773,now,
    valid:(p,h,time)=>disposition?.signature_authenticated&&
      p.schema==='rosie-independent-owner-signoff-renewal-v773'&&
      p.disposition_receipt_sha256===disposition.receipt_sha256&&
      p.original_signoff_receipt_sha256===h.signoff.receipt_sha256&&
      p.original_continuity_register_sha256===h.signoff.continuity_register_after_sha256&&
      HASH.test(p.current_renewal_register_sha256)&&utc(p.renewal_expires_at)&&
      Date.parse(p.renewal_expires_at)>Date.parse(p.witnessed_at)&&
      Date.parse(p.renewal_expires_at)<=Date.parse(p.witnessed_at)+30*86400000&&
      ['ORIGINAL_OWNER_RENEWAL_CURRENT_CLAIM',
        'ORIGINAL_OWNER_RENEWAL_EXPIRED_HOLD',
        'OWNER_RENEWAL_EVIDENCE_CONFLICT_HOLD'].includes(p.renewal_result)&&
      (p.renewal_result!=='ORIGINAL_OWNER_RENEWAL_CURRENT_CLAIM'||
        owner.requests_manual_signoff&&disposition.clean_claim&&
        h.signoff.continuity_witnessed&&Date.parse(p.renewal_expires_at)>time)&&
      (p.renewal_result!=='ORIGINAL_OWNER_RENEWAL_EXPIRED_HOLD'||
        owner.requests_renewal||Date.parse(p.renewal_expires_at)<=time)&&
      recent(p.witnessed_at,disposition.signed_at,time)&&
      ID.test(p.witness_id)&&ID.test(p.key_id)});
  return {...r,renewal_current_claim:r.signature_authenticated&&
    r.claim==='ORIGINAL_OWNER_RENEWAL_CURRENT_CLAIM',
    original_owner_signoff_renewed_by_app:false};
}
export async function verifyRemediation773({env,history,owner,disposition,renewal,
  readback,now=Date.now()}={}){
  const r=await verify({env,kind:'remediation',history,owner,readback,
    canonicalFn:canonicalRemediation773,now,
    valid:(p,h,time)=>disposition?.signature_authenticated&&renewal?.signature_authenticated&&
      p.schema==='rosie-independent-retention-sla-remediation-v773'&&
      p.disposition_receipt_sha256===disposition.receipt_sha256&&
      p.renewal_receipt_sha256===renewal.receipt_sha256&&
      p.original_sla_receipt_sha256===h.sla.receipt_sha256&&
      p.original_sla_policy_sha256===h.sla.sla_policy_sha256&&
      HASH.test(p.current_remediation_register_sha256)&&ID.test(p.remediation_case_id)&&
      count(p.elapsed_hours)&&count(p.critical_exceptions_remaining)&&
      /^[1-9]\d{0,4}$/.test(p.target_hours)&&
      Number(p.target_hours)===h.history.history.aging.source_alert_threshold_hours&&
      Number(p.elapsed_hours)>=h.sla.elapsed_hours&&
      Number(p.elapsed_hours)>=Math.floor((Date.parse(p.inspected_at)-
        Date.parse(h.sla.signed_at))/3600000)&&
      Number(p.critical_exceptions_remaining)>=h.sla.critical_exceptions_remaining&&
      ['NO_OPEN_RETENTION_REMEDIATION_CLAIM','RETENTION_SLA_BREACH_REMEDIATION_REFERRED_CLAIM',
        'RETENTION_REMEDIATION_SOURCE_CONFLICT_HOLD'].includes(p.remediation_result)&&
      (p.remediation_result!=='NO_OPEN_RETENTION_REMEDIATION_CLAIM'||
        owner.requests_manual_signoff&&disposition.clean_claim&&renewal.renewal_current_claim&&
        h.sla.within_sla_claim&&p.critical_exceptions_remaining==='0'&&
        Number(p.elapsed_hours)<=Number(p.target_hours))&&
      (p.remediation_result!=='RETENTION_SLA_BREACH_REMEDIATION_REFERRED_CLAIM'||
        owner.requests_sla_hold||Number(p.elapsed_hours)>Number(p.target_hours)||
        Number(p.critical_exceptions_remaining)>0)&&
      recent(p.inspected_at,renewal.signed_at,time)&&
      ID.test(p.witness_id)&&ID.test(p.key_id)});
  return {...r,clean_claim:r.signature_authenticated&&
    r.claim==='NO_OPEN_RETENTION_REMEDIATION_CLAIM',
    remediation_referred_claim:r.signature_authenticated&&
    r.claim==='RETENTION_SLA_BREACH_REMEDIATION_REFERRED_CLAIM',
    critical_count:r.signature_authenticated?
      Number(readback.envelope.payload.critical_exceptions_remaining):null,
    retention_sla_modified_by_app:false};
}
export async function reconcile773({history,owner,disposition,renewal,remediation,
  reviewed_at=new Date().toISOString()}={}){
  const follow_ups=[];
  if(!complete(history))follow_ups.push({code:'ORIGINAL_BUILD772_SIGNED_CHAIN_INCOMPLETE',
    action:'Obtain the original signed owner continuity, external resolution, independent sign-off and retention SLA evidence.'});
  else if(history.report.final_owner_resolution_status!==
    'READY_FOR_SEPARATE_MANUAL_ORIGINAL_OWNER_SIGNOFF_REVIEW')
    follow_ups.push({code:'PREDECESSOR_DISPUTE_OR_SLA_HOLD',
      action:'Resolve the original external Build 772 disposition or SLA exception at source.'});
  if(!owner?.signature_authenticated)follow_ups.push({code:'ORIGINAL_OWNER_RENEWAL_REVIEW_UNVERIFIED',
    action:'Obtain the original owner signed, scoped manual disposition/renewal/HOLD decision.'});
  else if(owner.requests_renewal)follow_ups.push({code:'ORIGINAL_OWNER_SIGNOFF_RENEWAL_REQUESTED',
    action:'Renew real original owner authorization externally; do not auto-sign.'});
  else if(owner.requests_sla_hold)follow_ups.push({code:'OWNER_SLA_REMEDIATION_HOLD',
    action:'Preserve original retention records and escalate SLA remediation to real source operator.'});
  if(!disposition?.signature_authenticated)follow_ups.push({code:'EXTERNAL_DISPOSITION_WITNESS_UNVERIFIED',
    action:'Obtain independently signed current external dispute register disposition.'});
  else if(!disposition.clean_claim)follow_ups.push({code:'EXTERNAL_DISPOSITION_NOT_CLOSED',
    action:'Real original recipient and custodian must independently resolve open disposition.'});
  if(!renewal?.signature_authenticated)follow_ups.push({code:'OWNER_SIGNOFF_RENEWAL_UNVERIFIED',
    action:'Obtain independent original owner renewal continuity and bounded expiry receipt.'});
  else if(!renewal.renewal_current_claim)follow_ups.push({code:'OWNER_RENEWAL_EXPIRED_OR_DISPUTED',
    action:'Renew the original owner sign-off outside the website with a separate witness.'});
  if(!remediation?.signature_authenticated)follow_ups.push({code:'SLA_REMEDIATION_WITNESS_UNVERIFIED',
    action:'Obtain independently signed source remediation age, policy and exception counts.'});
  else if(!remediation.clean_claim)follow_ups.push({code:'SLA_REMEDIATION_OPEN_OR_DISPUTED',
    action:'Escalate external retention SLA breach or missing original remediation witness.'});
  if(remediation?.critical_count>0)follow_ups.push({code:'CRITICAL_RETENTION_REMEDIATION_OPEN',
    action:'Preserve source evidence and request real custodian/DBA exception disposition.'});
  const ready=follow_ups.length===0&&owner?.requests_manual_signoff;
  follow_ups.push({code:'SEPARATE_ORIGINAL_OWNER_AND_OPERATOR_BUSINESS_ACTION',
    action:'Original owner and external operator must separately decide real sign-off, case closure and retention.'});
  const report={ok:true,build:773,read_only:true,
    predecessor_resolution_status:history?.report?.final_owner_resolution_status||'HOLD',
    original_owner_disposition_renewal_review:owner||null,
    independent_external_disposition:disposition||null,
    independent_owner_signoff_renewal:renewal||null,
    independent_retention_sla_remediation:remediation||null,
    external_disposition_signoff_status:ready?
      'READY_FOR_SEPARATE_ORIGINAL_OWNER_MANUAL_DISPOSITION_REVIEW':
      'HOLD_DISPOSITION_RENEWAL_OR_RETENTION_REMEDIATION',
    original_owner_business_signoff_by_app:false,external_case_mutated_by_app:false,
    retention_exception_cleared_by_app:false,production_database_written_by_app:false,
    source_archive_modified_by_app:false,append_only_audit_written_by_app:false,
    notification_sent_by_app:false,automatic_business_action:false,closure_allowed:false,
    blocking_count:follow_ups.length,follow_ups,reviewed_at};
  report.packet_sha256=await hash(t(JSON.stringify({
    schema:'rosie-external-disposition-owner-renewal-sla-remediation-v773',
    prior:history?.report?.packet_sha256||null,owner:owner?.receipt_sha256||null,
    disposition:disposition?.receipt_sha256||null,
    renewal:renewal?.receipt_sha256||null,
    remediation:remediation?.receipt_sha256||null,follow_ups,reviewed_at})));
  return report;
}
