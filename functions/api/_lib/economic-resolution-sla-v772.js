import {sha256Receipt754} from './owner-receipt-verification-v754.js';
import {KEY_ROLES768,ORIGIN_ROLES768} from './economic-owner-acceptance-v768.js';
import {ROLES769} from './economic-handoff-retention-v769.js';
import {ROLES770} from './economic-owner-register-aging-v770.js';
import {ROLES771} from './economic-final-attestation-v771.js';

// Evidence-only external issuer contract. No production writes, closure or
// invented business acceptance are possible through this module.
export const ROLES772=Object.freeze([
  'INDEPENDENT_EXTERNAL_RESOLUTION_WITNESS',
  'INDEPENDENT_OWNER_SIGNOFF_CONTINUITY_WITNESS',
  'INDEPENDENT_RETENTION_SLA_WITNESS'
]);
export const OWNER_FIELDS772=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id',
  'execution_request_id','production_project_ref','final_owner_decision_receipt_sha256',
  'final_decision_attestation_receipt_sha256','handoff_dispute_receipt_sha256',
  'retention_escalation_receipt_sha256','continuity_decision',
  'owner_continuity_ticket_id','owner_id','issued_at','nonce','key_id'
]);
export const RESOLUTION_FIELDS772=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id',
  'execution_request_id','production_project_ref','owner_continuity_receipt_sha256',
  'handoff_dispute_receipt_sha256','retention_escalation_receipt_sha256',
  'original_dispute_register_sha256','current_resolution_register_sha256',
  'resolution_case_id','resolution_result','resolved_at','witness_id','key_id'
]);
export const SIGNOFF_FIELDS772=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id',
  'execution_request_id','production_project_ref','owner_continuity_receipt_sha256',
  'resolution_receipt_sha256','original_final_decision_receipt_sha256',
  'original_attestation_receipt_sha256','continuity_register_before_sha256',
  'continuity_register_after_sha256','continuity_result','witnessed_at',
  'witness_id','key_id'
]);
export const SLA_FIELDS772=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id',
  'execution_request_id','production_project_ref','owner_continuity_receipt_sha256',
  'resolution_receipt_sha256','signoff_continuity_receipt_sha256',
  'retention_escalation_receipt_sha256','original_exception_register_sha256',
  'current_escalation_register_sha256','sla_policy_sha256','sla_case_id',
  'elapsed_hours','target_hours','critical_exceptions_remaining','sla_result',
  'inspected_at','witness_id','key_id'
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
    throw Error('Noncanonical original resolution or SLA receipt.');
  return t(domain+JSON.stringify(fields.map(f=>[f,p[f]])));
}
export const canonicalOwner772=p=>canonical(p,OWNER_FIELDS772,
  'rosie-original-owner-final-signoff-continuity-v772:');
export const canonicalResolution772=p=>canonical(p,RESOLUTION_FIELDS772,
  'rosie-independent-external-resolution-receipt-v772:');
export const canonicalSignoff772=p=>canonical(p,SIGNOFF_FIELDS772,
  'rosie-independent-owner-signoff-continuity-v772:');
export const canonicalSLA772=p=>canonical(p,SLA_FIELDS772,
  'rosie-independent-retention-escalation-sla-v772:');
function decode(s,len){
  if(typeof s!=='string'||s.length>200||s.length%4||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(s))return null;
  try{const b=Uint8Array.from(atob(s),c=>c.charCodeAt(0));
    return b.length===len?b:null;}catch{return null;}
}
const signerRoles=[...KEY_ROLES768,...ROLES769,...ROLES770,...ROLES771,...ROLES772];
const sourceRoles=[...ORIGIN_ROLES768,...ROLES769,...ROLES770,...ROLES771,...ROLES772];
function signer(env,role,id){
  const usedIds=new Set(),usedKeys=new Set();let chosen=null;
  for(const name of signerRoles){
    const key=decode(env?.[`ROSIE_ECONOMIC_${name}_PUBLIC_KEY_B64`],32);
    const keyId=env?.[`ROSIE_ECONOMIC_${name}_KEY_ID`];
    if(!key||typeof keyId!=='string'||!ID.test(keyId)||usedIds.has(keyId))return null;
    const fingerprint=Array.from(key).join(',');
    if(usedKeys.has(fingerprint))return null;
    usedIds.add(keyId);usedKeys.add(fingerprint);
    if(name===role&&keyId===id)chosen=key;
  }
  return chosen;
}
function sources(env){
  try{const urls=sourceRoles.map(name=>new URL(env?.[`ROSIE_ECONOMIC_${name}_BASE_URL`]));
    if(urls.some(u=>u.protocol!=='https:'||u.username||u.password||u.port||
      u.search||u.hash||u.pathname!=='/'||!u.hostname.includes('.')||
      u.hostname==='localhost'||u.hostname.startsWith('[')||
      /^(?:\d{1,3}\.){3}\d{1,3}$/.test(u.hostname)||
      /\.(?:local|localhost|internal)$/i.test(u.hostname))||
      new Set(urls.map(u=>u.origin)).size!==urls.length)return null;
    return Object.fromEntries(sourceRoles.map((role,i)=>[role,urls[i]]));
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
  h?.attestation?.signature_authenticated===true&&
  h?.dispute?.signature_authenticated===true&&
  h?.escalation?.signature_authenticated===true&&
  h?.history?.aging?.signature_authenticated===true&&
  h?.history?.history?.retention?.signature_authenticated===true&&
  HASH.test(h?.history?.history?.retention?.retention_policy_sha256||'')&&
  h?.history?.history?.ctx?.prior?.ok===true&&
  UUID.test(h?.history?.history?.ctx?.record?.booking_id||'')&&
  UUID.test(h?.history?.history?.ctx?.record?.source_record_id||'');
const record=h=>h.history.history.ctx.record;
const prior=h=>h.history.history.ctx.prior;
const scope=(p,h)=>complete(h)&&
  p?.booking_id===record(h).booking_id&&p?.source_record_id===record(h).source_record_id&&
  p?.change_ticket_id===record(h).change_ticket_id&&
  p?.execution_request_id===record(h).execution_request_id&&
  p?.trial_id===prior(h).verified_scope.trial_id&&
  p?.production_project_ref===prior(h).verified_scope.production_project_ref;
export async function verifyOwner772({env,history,envelope,now=Date.now()}={}){
  const p=envelope?.payload;let transcript;
  try{transcript=canonicalOwner772(p);}catch{
    return hold('HOLD_OWNER_CONTINUITY_FORMAT','Noncanonical original owner final sign-off continuity.');}
  const choices=['REQUEST_SEPARATE_FINAL_OWNER_SIGNOFF_REVIEW',
    'REQUEST_EXTERNAL_HANDOFF_RESOLUTION_REVIEW','REQUEST_RETENTION_SLA_ESCALATION_HOLD'];
  if(p.schema!=='rosie-original-owner-final-signoff-continuity-v772'||
    !scope(p,history)||
    p.final_owner_decision_receipt_sha256!==history.owner.receipt_sha256||
    p.final_decision_attestation_receipt_sha256!==history.attestation.receipt_sha256||
    p.handoff_dispute_receipt_sha256!==history.dispute.receipt_sha256||
    p.retention_escalation_receipt_sha256!==history.escalation.receipt_sha256||
    !choices.includes(p.continuity_decision)||
    (p.continuity_decision===choices[0]&&
      history.report.final_owner_review_status!==
        'READY_FOR_SEPARATE_MANUAL_FINAL_OWNER_BUSINESS_ACTION')||
    !ID.test(p.owner_continuity_ticket_id)||!ID.test(p.owner_id)||
    !/^[a-f0-9]{32,64}$/i.test(p.nonce)||!ID.test(p.key_id)||
    !recent(p.issued_at,history.escalation.signed_at,now))
    return hold('HOLD_OWNER_CONTINUITY_SCOPE',
      'Original signed owner decision must bind exact historical independent evidence.');
  const key=signer(env,'OWNER_RECEIPT',p.key_id);
  if(!key)return hold('HOLD_OWNER_CONTINUITY_SIGNER_INDEPENDENCE',
    'Thirty-nine uniquely pinned original signing identities required.');
  if(!sources(env))return hold('HOLD_OWNER_CONTINUITY_ORIGIN_INDEPENDENCE',
    'Thirty distinct HTTPS issuers required.');
  if(!await authentic(envelope,transcript,key))
    return hold('HOLD_OWNER_CONTINUITY_SIGNATURE','Original owner signature invalid.');
  return hold('SIGNED_OWNER_FINAL_SIGNOFF_CONTINUITY_REQUEST',
    'Fresh original owner-signed manual continuity request, never an actual business sign-off.',
    {signature_authenticated:true,receipt_sha256:await hash(transcript),
      choice:p.continuity_decision,signed_at:p.issued_at,
      requests_final_manual_review:p.continuity_decision===choices[0],
      requests_resolution:p.continuity_decision===choices[1],
      requests_sla_hold:p.continuity_decision===choices[2],
      business_signoff_executed_by_app:false});
}
const routes={
  resolution:[ROLES772[0],'/v1/economic-external-resolution-receipt-v772'],
  signoff:[ROLES772[1],'/v1/economic-owner-signoff-continuity-v772'],
  sla:[ROLES772[2],'/v1/economic-retention-escalation-sla-v772']
};
export function receiptURL772(env,kind,history,owner,resolution,signoff){
  if(!Object.hasOwn(routes,kind)||!complete(history)||
    !owner?.signature_authenticated||
    kind!=='resolution'&&!resolution?.signature_authenticated||
    kind==='sla'&&!signoff?.signature_authenticated)return null;
  const pinned=sources(env);if(!pinned)return null;
  const [role,path]=routes[kind],url=new URL(path,pinned[role]);
  const params={booking_id:record(history).booking_id,
    source_record_id:record(history).source_record_id,
    change_ticket_id:record(history).change_ticket_id,
    execution_request_id:record(history).execution_request_id,
    owner_continuity_receipt_sha256:owner.receipt_sha256,
    ...(kind==='resolution'?{}:{resolution_receipt_sha256:resolution.receipt_sha256}),
    ...(kind==='sla'?{signoff_continuity_receipt_sha256:signoff.receipt_sha256}:{})};
  for(const [key,value] of Object.entries(params))url.searchParams.set(key,value);
  return url.toString();
}
export async function readReceipt772(env,kind,history,owner,resolution,signoff,
  fetcher=fetch){
  const url=receiptURL772(env,kind,history,owner,resolution,signoff);
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
      'Independent original issuer evidence is unavailable.');
  const p=readback.envelope?.payload;let transcript;
  try{transcript=canonicalFn(p);}catch{return hold(`HOLD_${kind.toUpperCase()}_FORMAT`,
    'Noncanonical independently signed receipt.');}
  if(!scope(p,history)||!owner?.signature_authenticated||
    p.owner_continuity_receipt_sha256!==owner.receipt_sha256||
    !valid(p,history,now))
    return hold(`HOLD_${kind.toUpperCase()}_SCOPE`,
      'Original source scope, preceding receipt or signed claim is inconsistent.');
  const role=routes[kind][0],key=signer(env,role,p.key_id);
  if(!key)return hold(`HOLD_${kind.toUpperCase()}_SIGNER_INDEPENDENCE`,
    'Thirty-nine independent original signer identities required.');
  if(!sources(env))return hold(`HOLD_${kind.toUpperCase()}_ORIGIN_INDEPENDENCE`,
    'Thirty unique pinned external HTTPS issuer origins required.');
  if(!await authentic(readback.envelope,transcript,key))
    return hold(`HOLD_${kind.toUpperCase()}_SIGNATURE`,
      'Independent original issuer signature invalid.');
  return hold(`SIGNED_${kind.toUpperCase()}_CLAIM`,
    'Authentic external issuer statement only. No original record has been changed.',
    {signature_authenticated:true,receipt_sha256:await hash(transcript),
      signed_at:p.resolved_at||p.witnessed_at||p.inspected_at,
      claim:p.resolution_result||p.continuity_result||p.sla_result});
}
export async function verifyResolution772({env,history,owner,readback,now=Date.now()}={}){
  const r=await verify({env,kind:'resolution',history,owner,readback,
    canonicalFn:canonicalResolution772,now,
    valid:(p,h,time)=>p.schema==='rosie-independent-external-resolution-receipt-v772'&&
      p.handoff_dispute_receipt_sha256===h.dispute.receipt_sha256&&
      p.retention_escalation_receipt_sha256===h.escalation.receipt_sha256&&
      p.original_dispute_register_sha256===h.dispute.dispute_register_sha256&&
      HASH.test(p.current_resolution_register_sha256)&&
      ID.test(p.resolution_case_id)&&
      ['INDEPENDENT_HANDOFF_RESOLUTION_VERIFIED_CLAIM',
        'EXTERNAL_HANDOFF_RESOLUTION_OPEN_CLAIM',
        'EXTERNAL_RESOLUTION_SOURCE_CONFLICT_HOLD'].includes(p.resolution_result)&&
      (p.resolution_result!=='INDEPENDENT_HANDOFF_RESOLUTION_VERIFIED_CLAIM'||
        owner.requests_final_manual_review&&h.dispute.clean_claim)&&
      (p.resolution_result!=='EXTERNAL_HANDOFF_RESOLUTION_OPEN_CLAIM'||
        owner.requests_resolution||h.dispute.external_dispute_claim)&&
      recent(p.resolved_at,owner.signed_at,time)&&
      ID.test(p.witness_id)&&ID.test(p.key_id)});
  return {...r,clean_claim:r.signature_authenticated&&
    r.claim==='INDEPENDENT_HANDOFF_RESOLUTION_VERIFIED_CLAIM',
    dispute_still_open_claim:r.signature_authenticated&&
    r.claim==='EXTERNAL_HANDOFF_RESOLUTION_OPEN_CLAIM',
    external_dispute_closed_by_app:false};
}
export async function verifySignoff772({env,history,owner,resolution,readback,
  now=Date.now()}={}){
  const r=await verify({env,kind:'signoff',history,owner,readback,
    canonicalFn:canonicalSignoff772,now,
    valid:(p,h,time)=>resolution?.signature_authenticated&&
      p.schema==='rosie-independent-owner-signoff-continuity-v772'&&
      p.resolution_receipt_sha256===resolution.receipt_sha256&&
      p.original_final_decision_receipt_sha256===h.owner.receipt_sha256&&
      p.original_attestation_receipt_sha256===h.attestation.receipt_sha256&&
      HASH.test(p.continuity_register_before_sha256)&&
      HASH.test(p.continuity_register_after_sha256)&&
      p.continuity_register_before_sha256!==p.continuity_register_after_sha256&&
      ['ORIGINAL_OWNER_SIGNOFF_CONTINUITY_WITNESSED_CLAIM',
        'FINAL_SIGNOFF_MISSING_HOLD','FINAL_SIGNOFF_SOURCE_CONFLICT_HOLD']
        .includes(p.continuity_result)&&
      (p.continuity_result!=='ORIGINAL_OWNER_SIGNOFF_CONTINUITY_WITNESSED_CLAIM'||
        owner.requests_final_manual_review&&resolution.clean_claim&&
        h.attestation.manual_decision_witnessed)&&
      recent(p.witnessed_at,resolution.signed_at,time)&&
      ID.test(p.witness_id)&&ID.test(p.key_id)});
  return {...r,continuity_witnessed:r.signature_authenticated&&
    r.claim==='ORIGINAL_OWNER_SIGNOFF_CONTINUITY_WITNESSED_CLAIM',
    original_owner_final_signoff_executed_by_app:false};
}
export async function verifySLA772({env,history,owner,resolution,signoff,readback,
  now=Date.now()}={}){
  const r=await verify({env,kind:'sla',history,owner,readback,
    canonicalFn:canonicalSLA772,now,
    valid:(p,h,time)=>resolution?.signature_authenticated&&
      signoff?.signature_authenticated&&
      p.schema==='rosie-independent-retention-escalation-sla-v772'&&
      p.resolution_receipt_sha256===resolution.receipt_sha256&&
      p.signoff_continuity_receipt_sha256===signoff.receipt_sha256&&
      p.retention_escalation_receipt_sha256===h.escalation.receipt_sha256&&
      p.original_exception_register_sha256===h.history.aging.exception_register_sha256&&
      p.current_escalation_register_sha256===h.escalation.current_escalation_register_sha256&&
      HASH.test(p.sla_policy_sha256)&&
      p.sla_policy_sha256===h.history.history.retention.retention_policy_sha256&&
      ID.test(p.sla_case_id)&&
      count(p.elapsed_hours)&&/^[1-9]\d{0,4}$/.test(p.target_hours)&&
      p.target_hours===String(h.history.aging.source_alert_threshold_hours)&&
      Number(p.elapsed_hours)>=Math.max(
        h.history.aging.oldest_open_exception_age_hours||0,
        Math.floor((Date.parse(p.inspected_at)-Date.parse(h.escalation.signed_at))/3600000))&&
      count(p.critical_exceptions_remaining)&&
      Number(p.critical_exceptions_remaining)>=h.escalation.unresolved_critical_count&&
      ['WITHIN_ORIGINAL_RETENTION_SLA_CLAIM','RETENTION_SLA_BREACH_ESCALATED_CLAIM',
        'RETENTION_SLA_SOURCE_CONFLICT_HOLD'].includes(p.sla_result)&&
      (p.sla_result!=='WITHIN_ORIGINAL_RETENTION_SLA_CLAIM'||
        Number(p.elapsed_hours)<=Number(p.target_hours)&&
        p.critical_exceptions_remaining==='0'&&
        owner.requests_final_manual_review&&signoff.continuity_witnessed&&
        h.escalation.clean_claim&&h.history.aging.clean_claim)&&
      (p.sla_result!=='RETENTION_SLA_BREACH_ESCALATED_CLAIM'||
        Number(p.elapsed_hours)>Number(p.target_hours)||
        Number(p.critical_exceptions_remaining)>0||owner.requests_sla_hold)&&
      recent(p.inspected_at,signoff.signed_at,time)&&
      ID.test(p.witness_id)&&ID.test(p.key_id)});
  return {...r,within_sla_claim:r.signature_authenticated&&
    r.claim==='WITHIN_ORIGINAL_RETENTION_SLA_CLAIM',
    sla_breach_claim:r.signature_authenticated&&
    r.claim==='RETENTION_SLA_BREACH_ESCALATED_CLAIM',
    critical_exceptions_remaining:r.signature_authenticated?
      Number(readback.envelope.payload.critical_exceptions_remaining):null,
    retention_record_mutated_by_app:false};
}
export async function reconcile772({history,owner,resolution,signoff,sla,
  reviewed_at=new Date().toISOString()}={}){
  const follow_ups=[];
  if(!complete(history))follow_ups.push({code:'ORIGINAL_BUILD771_EVIDENCE_CHAIN_INCOMPLETE',
    action:'Re-authenticate original signed owner, custody, final review, dispute and retention witnesses.'});
  else if(history.report.final_owner_review_status!==
    'READY_FOR_SEPARATE_MANUAL_FINAL_OWNER_BUSINESS_ACTION')
    follow_ups.push({code:'PREDECESSOR_ORIGINAL_OWNER_DISPUTE_OR_RETENTION_HOLD',
      action:'Original Build 771 external dispute or retention evidence remains HOLD.'});
  if(!owner?.signature_authenticated)follow_ups.push({code:'OWNER_SIGNOFF_CONTINUITY_REQUEST_UNVERIFIED',
    action:'Obtain a new independently verifiable original-owner signed continuity choice.'});
  else if(owner.requests_resolution)follow_ups.push({code:'OWNER_EXTERNAL_HANDOFF_RESOLUTION_REQUESTED',
    action:'Resolve the original dispute externally with separate custodian/recipient evidence.'});
  else if(owner.requests_sla_hold)follow_ups.push({code:'OWNER_RETENTION_SLA_ESCALATION_HOLD',
    action:'Owner explicitly requested SLA escalation HOLD; preserve source evidence.'});
  if(!resolution?.signature_authenticated)follow_ups.push({code:'EXTERNAL_RESOLUTION_RECEIPT_UNVERIFIED',
    action:'Obtain original signed external resolution receipt and dispute-register continuity.'});
  else if(!resolution.clean_claim)follow_ups.push({code:'EXTERNAL_DISPUTE_RESOLUTION_REMAINS_OPEN',
    action:'Independently resolve or escalate the real external dispute; website cannot close it.'});
  if(!signoff?.signature_authenticated)follow_ups.push({code:'OWNER_SIGNOFF_CONTINUITY_WITNESS_UNVERIFIED',
    action:'Obtain independent signed witness of the original owner sign-off continuity register.'});
  else if(!signoff.continuity_witnessed)follow_ups.push({code:'OWNER_FINAL_SIGNOFF_CONTINUITY_HOLD',
    action:'Reconcile missing or disputed original sign-off at the original independent issuer.'});
  if(!sla?.signature_authenticated)follow_ups.push({code:'RETENTION_ESCALATION_SLA_UNVERIFIED',
    action:'Obtain original source-signed SLA age, target, exceptions and policy digest.'});
  else if(!sla.within_sla_claim)follow_ups.push({code:'RETENTION_ESCALATION_SLA_BREACH_OR_CONFLICT',
    action:'Escalate missed retention service-level target and preserve original source evidence.'});
  if(sla?.critical_exceptions_remaining>0)follow_ups.push({
    code:'CRITICAL_RETENTION_ESCALATION_OPEN',
    action:'Require an external operator and custodian to disposition critical source exceptions.'});
  const ready=follow_ups.length===0&&owner?.requests_final_manual_review;
  follow_ups.push({code:'SEPARATE_ORIGINAL_OWNER_BUSINESS_SIGNOFF_REQUIRED',
    action:'Only a separately authorized real original owner and external operator can accept, close, reopen or modify records.'});
  const report={ok:true,build:772,read_only:true,
    predecessor_final_owner_review_status:history?.report?.final_owner_review_status||'HOLD',
    original_owner_signoff_continuity_request:owner||null,
    independent_external_resolution_receipt:resolution||null,
    independent_owner_signoff_continuity_witness:signoff||null,
    independent_retention_escalation_sla:sla||null,
    final_owner_resolution_status:ready?
      'READY_FOR_SEPARATE_MANUAL_ORIGINAL_OWNER_SIGNOFF_REVIEW':
      'HOLD_EXTERNAL_RESOLUTION_SIGNOFF_OR_RETENTION_SLA',
    original_business_signoff_recorded_by_app:false,
    original_dispute_closed_by_app:false,retention_exception_cleared_by_app:false,
    production_database_modified_by_app:false,source_archive_modified_by_app:false,
    audit_log_appended_by_app:false,customer_notifications_sent_by_app:false,
    automatic_owner_business_action:false,closure_allowed:false,
    blocking_count:follow_ups.length,follow_ups,reviewed_at};
  report.packet_sha256=await hash(t(JSON.stringify({
    schema:'rosie-final-owner-resolution-signoff-retention-sla-v772',
    prior:history?.report?.packet_sha256||null,owner:owner?.receipt_sha256||null,
    resolution:resolution?.receipt_sha256||null,
    signoff:signoff?.receipt_sha256||null,sla:sla?.receipt_sha256||null,
    follow_ups,reviewed_at})));
  return report;
}
