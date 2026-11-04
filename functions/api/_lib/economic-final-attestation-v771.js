import {sha256Receipt754} from './owner-receipt-verification-v754.js';
import {KEY_ROLES768,ORIGIN_ROLES768} from './economic-owner-acceptance-v768.js';
import {ROLES769} from './economic-handoff-retention-v769.js';
import {ROLES770} from './economic-owner-register-aging-v770.js';

// No production write capability: independently authenticated external claims
// remain distinct from original-owner business acceptance and case mutations.
export const ROLES771=Object.freeze([
  'INDEPENDENT_FINAL_OWNER_DECISION_ATTESTOR',
  'INDEPENDENT_HANDOFF_DISPUTE_WITNESS',
  'INDEPENDENT_RETENTION_ESCALATION_WITNESS'
]);
export const OWNER_FIELDS771=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id',
  'execution_request_id','production_project_ref','original_owner_receipt_sha256',
  'decision_register_receipt_sha256','handoff_ack_receipt_sha256',
  'retention_aging_receipt_sha256','final_owner_decision','owner_decision_ticket_id',
  'owner_id','issued_at','nonce','key_id'
]);
export const ATTEST_FIELDS771=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id',
  'execution_request_id','production_project_ref','final_owner_decision_receipt_sha256',
  'decision_register_receipt_sha256','handoff_ack_receipt_sha256',
  'retention_aging_receipt_sha256','decision_register_before_sha256',
  'decision_register_after_sha256','attestation_result','attested_at',
  'attestor_id','key_id'
]);
export const DISPUTE_FIELDS771=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id',
  'execution_request_id','production_project_ref','final_owner_decision_receipt_sha256',
  'attestation_receipt_sha256','handoff_ack_receipt_sha256',
  'original_handoff_manifest_sha256','dispute_register_sha256',
  'dispute_case_id','dispute_result','reviewed_at','witness_id','key_id'
]);
export const ESCALATION_FIELDS771=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id',
  'execution_request_id','production_project_ref','final_owner_decision_receipt_sha256',
  'attestation_receipt_sha256','dispute_review_receipt_sha256',
  'retention_aging_receipt_sha256','original_exception_register_sha256',
  'current_escalation_register_sha256','escalation_case_id',
  'unresolved_critical_count','escalation_result','escalated_at','witness_id','key_id'
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
function canonical(p,fields,domain){
  if(!p||typeof p!=='object'||Array.isArray(p)||
    Object.keys(p).length!==fields.length||
    !fields.every(f=>Object.hasOwn(p,f)&&typeof p[f]==='string'))
    throw Error('Noncanonical independent final-owner receipt.');
  return t(domain+JSON.stringify(fields.map(f=>[f,p[f]])));
}
export const canonicalOwner771=p=>canonical(p,OWNER_FIELDS771,
  'rosie-original-owner-final-manual-decision-v771:');
export const canonicalAttest771=p=>canonical(p,ATTEST_FIELDS771,
  'rosie-independent-final-owner-decision-attestation-v771:');
export const canonicalDispute771=p=>canonical(p,DISPUTE_FIELDS771,
  'rosie-independent-handoff-dispute-resolution-v771:');
export const canonicalEscalation771=p=>canonical(p,ESCALATION_FIELDS771,
  'rosie-independent-retention-exception-escalation-v771:');
function decode(s,len){
  if(typeof s!=='string'||s.length>200||s.length%4||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(s))return null;
  try{const b=Uint8Array.from(atob(s),c=>c.charCodeAt(0));
    return b.length===len?b:null;}catch{return null;}
}
const signerRoles=[...KEY_ROLES768,...ROLES769,...ROLES770,...ROLES771];
const sourceRoles=[...ORIGIN_ROLES768,...ROLES769,...ROLES770,...ROLES771];
function publicKey(env,role,id){
  const usedIds=new Set(),usedKeys=new Set();let selected=null;
  for(const name of signerRoles){
    const key=decode(env?.[`ROSIE_ECONOMIC_${name}_PUBLIC_KEY_B64`],32);
    const keyId=env?.[`ROSIE_ECONOMIC_${name}_KEY_ID`];
    if(!key||typeof keyId!=='string'||!ID.test(keyId)||usedIds.has(keyId))return null;
    const fingerprint=Array.from(key).join(',');
    if(usedKeys.has(fingerprint))return null;
    usedIds.add(keyId);usedKeys.add(fingerprint);
    if(name===role&&keyId===id)selected=key;
  }
  return selected;
}
function sources(env){
  try{const urls=sourceRoles.map(name=>new URL(env?.[`ROSIE_ECONOMIC_${name}_BASE_URL`]));
    if(urls.some(u=>u.protocol!=='https:'||u.username||u.password||u.port||
      u.search||u.hash||u.pathname!=='/'||!u.hostname.includes('.')||
      u.hostname==='localhost'||u.hostname.startsWith('[')||
      /^(?:\d{1,3}\.){3}\d{1,3}$/.test(u.hostname)||
      /\.(?:local|localhost|internal)$/i.test(u.hostname))||
      new Set(urls.map(u=>u.origin)).size!==urls.length)return null;
    return Object.fromEntries(sourceRoles.map((name,i)=>[name,urls[i]]));
  }catch{return null;}
}
async function verifySignature(envelope,transcript,key){
  if(!key||!envelope||typeof envelope!=='object'||Array.isArray(envelope)||
    Object.keys(envelope).length!==2||!Object.hasOwn(envelope,'payload')||
    !Object.hasOwn(envelope,'signature_b64'))return false;
  const sig=decode(envelope.signature_b64,64);if(!sig)return false;
  try{const pk=await crypto.subtle.importKey('raw',key,{name:'Ed25519'},false,['verify']);
    return crypto.subtle.verify('Ed25519',pk,sig,transcript);
  }catch{return false;}
}
const complete=h=>h?.report?.ok===true&&h?.history?.ctx?.prior?.ok===true&&
  h?.history?.ctx?.report?.owner_postclosure_decision?.signature_authenticated===true&&
  h?.register?.signature_authenticated===true&&h?.ack?.signature_authenticated===true&&
  h?.aging?.signature_authenticated===true&&
  UUID.test(h?.history?.ctx?.record?.booking_id||'')&&
  UUID.test(h?.history?.ctx?.record?.source_record_id||'')&&
  ID.test(h?.history?.ctx?.record?.change_ticket_id||'')&&
  ID.test(h?.history?.ctx?.record?.execution_request_id||'');
const scope=(p,h)=>complete(h)&&p?.booking_id===h.history.ctx.record.booking_id&&
  p?.source_record_id===h.history.ctx.record.source_record_id&&
  p?.change_ticket_id===h.history.ctx.record.change_ticket_id&&
  p?.execution_request_id===h.history.ctx.record.execution_request_id&&
  p?.trial_id===h.history.ctx.prior.verified_scope.trial_id&&
  p?.production_project_ref===h.history.ctx.prior.verified_scope.production_project_ref;
export async function verifyOwner771({env,history,envelope,now=Date.now()}={}){
  const p=envelope?.payload;let transcript;
  try{transcript=canonicalOwner771(p);}catch{
    return hold('HOLD_FINAL_OWNER_FORMAT','Original owner signed envelope is not canonical.');}
  const c=history?.history?.ctx,r=history?.report;
  const choices=['REQUEST_FINAL_MANUAL_EXTERNAL_ACCEPTANCE_REVIEW',
    'REQUEST_HANDOFF_DISPUTE_RESOLUTION_REVIEW',
    'REQUEST_RETENTION_EXCEPTION_ESCALATION_HOLD'];
  if(p.schema!=='rosie-original-owner-final-manual-decision-v771'||
    !scope(p,history)||
    p.original_owner_receipt_sha256!==c.report.owner_postclosure_decision.receipt_sha256||
    p.decision_register_receipt_sha256!==history.register.receipt_sha256||
    p.handoff_ack_receipt_sha256!==history.ack.receipt_sha256||
    p.retention_aging_receipt_sha256!==history.aging.receipt_sha256||
    !choices.includes(p.final_owner_decision)||
    (p.final_owner_decision===choices[0]&&
      (r.owner_register_status!=='READY_FOR_SEPARATE_ORIGINAL_OWNER_DECISION_REVIEW'||
      !history.register.manual_review_claim||!history.ack.acknowledged_claim||
      !history.aging.clean_claim||history.aging.retention_window_expired))||
    !ID.test(p.owner_decision_ticket_id)||!ID.test(p.owner_id)||
    !/^[a-f0-9]{32,64}$/i.test(p.nonce)||!ID.test(p.key_id)||
    !recent(p.issued_at,history.aging.signed_at,now))
    return hold('HOLD_FINAL_OWNER_SCOPE','Owner decision must bind original signed review and remain manual-only.');
  const key=publicKey(env,'OWNER_RECEIPT',p.key_id);
  if(!key)return hold('HOLD_FINAL_OWNER_SIGNER_INDEPENDENCE',
    'All thirty-six historical and external signing identities must be distinct.');
  if(!sources(env))return hold('HOLD_FINAL_OWNER_ORIGIN_INDEPENDENCE',
    'Twenty-seven independently pinned HTTPS issuers required.');
  if(!await verifySignature(envelope,transcript,key))
    return hold('HOLD_FINAL_OWNER_SIGNATURE','Original owner Ed25519 signature invalid.');
  return hold('SIGNED_ORIGINAL_OWNER_FINAL_MANUAL_REVIEW_DECISION',
    'Original owner signed a scoped manual evidence decision, not a website or database action.',
    {signature_authenticated:true,receipt_sha256:await hash(transcript),
      decision:p.final_owner_decision,issued_at:p.issued_at,
      requests_manual_acceptance:p.final_owner_decision===choices[0],
      requests_dispute:p.final_owner_decision===choices[1],
      requests_retention_escalation:p.final_owner_decision===choices[2],
      actual_business_acceptance_recorded_by_app:false});
}
const route={
  attest:[ROLES771[0],'/v1/economic-final-owner-decision-attestation-v771'],
  dispute:[ROLES771[1],'/v1/economic-handoff-dispute-resolution-v771'],
  escalation:[ROLES771[2],'/v1/economic-retention-escalation-v771']
};
export function receiptURL771(env,kind,history,owner,attestation,dispute){
  if(!Object.hasOwn(route,kind)||!complete(history)||
    !owner?.signature_authenticated||
    kind!=='attest'&&!attestation?.signature_authenticated||
    kind==='escalation'&&!dispute?.signature_authenticated)return null;
  const pinned=sources(env);if(!pinned)return null;
  const [role,path]=route[kind],url=new URL(path,pinned[role]);
  const params={booking_id:history.history.ctx.record.booking_id,
    source_record_id:history.history.ctx.record.source_record_id,
    change_ticket_id:history.history.ctx.record.change_ticket_id,
    execution_request_id:history.history.ctx.record.execution_request_id,
    owner_final_decision_receipt_sha256:owner.receipt_sha256,
    ...(kind==='attest'?{}:{attestation_receipt_sha256:attestation.receipt_sha256}),
    ...(kind==='escalation'?{dispute_review_receipt_sha256:dispute.receipt_sha256}:{})};
  for(const [name,value] of Object.entries(params))url.searchParams.set(name,value);
  return url.toString();
}
export async function readReceipt771(env,kind,history,owner,attestation,dispute,
  fetcher=fetch){
  const url=receiptURL771(env,kind,history,owner,attestation,dispute);
  if(!url)return {status:`HOLD_${String(kind).toUpperCase()}_SOURCE_NOT_CONFIGURED`};
  try{const res=await fetcher(url,{method:'GET',redirect:'error',
    headers:{Accept:'application/json','Cache-Control':'no-store'}});
    if(!res.ok)return {status:`HOLD_${kind.toUpperCase()}_SOURCE_UNAVAILABLE`};
    const raw=await res.text();if(raw.length>16000)
      return {status:`HOLD_${kind.toUpperCase()}_SOURCE_OVERSIZED`};
    const envelope=JSON.parse(raw);
    if(!envelope||typeof envelope!=='object'||Array.isArray(envelope)||
      Object.keys(envelope).length!==2||!Object.hasOwn(envelope,'payload')||
      !Object.hasOwn(envelope,'signature_b64'))
      return {status:`HOLD_${kind.toUpperCase()}_SOURCE_FORMAT`};
    return {status:`SIGNED_${kind.toUpperCase()}_READBACK`,envelope};
  }catch{return {status:`HOLD_${kind.toUpperCase()}_SOURCE_UNAVAILABLE`};}
}
async function verify({env,kind,role,history,owner,readback,canonicalFn,valid,now}){
  if(readback?.status!==`SIGNED_${kind.toUpperCase()}_READBACK`)
    return hold(readback?.status||`HOLD_${kind.toUpperCase()}_MISSING`,
      'Original independent issuer evidence is unavailable.');
  const p=readback.envelope?.payload;let transcript;
  try{transcript=canonicalFn(p);}catch{return hold(`HOLD_${kind.toUpperCase()}_FORMAT`,
    'Noncanonical independent issuer report.');}
  if(!scope(p,history)||!owner?.signature_authenticated||
    p.final_owner_decision_receipt_sha256!==owner.receipt_sha256||
    !valid(p,history,now))
    return hold(`HOLD_${kind.toUpperCase()}_SCOPE`,
      'Original signed scope, decision or previous source receipt is inconsistent.');
  const key=publicKey(env,role,p.key_id);
  if(!key)return hold(`HOLD_${kind.toUpperCase()}_KEY_INDEPENDENCE`,
    'All thirty-six original signer identities required.');
  if(!sources(env))return hold(`HOLD_${kind.toUpperCase()}_ORIGIN_INDEPENDENCE`,
    'All twenty-seven original HTTPS issuers required.');
  if(!await verifySignature(readback.envelope,transcript,key))
    return hold(`HOLD_${kind.toUpperCase()}_SIGNATURE`,
      'Independent original issuer signature invalid.');
  return hold(`SIGNED_${kind.toUpperCase()}_CLAIM`,
    'Authentic independent issuer claim only; no site-side source or business change.',
    {signature_authenticated:true,receipt_sha256:await hash(transcript),
      signed_at:p.attested_at||p.reviewed_at||p.escalated_at,
      claim:p.attestation_result||p.dispute_result||p.escalation_result});
}
export async function verifyAttest771({env,history,owner,readback,now=Date.now()}={}){
  const r=await verify({env,history,owner,readback,kind:'attest',role:ROLES771[0],
    canonicalFn:canonicalAttest771,now,
    valid:(p,h,time)=>p.schema==='rosie-independent-final-owner-decision-attestation-v771'&&
      p.decision_register_receipt_sha256===h.register.receipt_sha256&&
      p.handoff_ack_receipt_sha256===h.ack.receipt_sha256&&
      p.retention_aging_receipt_sha256===h.aging.receipt_sha256&&
      HASH.test(p.decision_register_before_sha256)&&HASH.test(p.decision_register_after_sha256)&&
      p.decision_register_before_sha256!==p.decision_register_after_sha256&&
      ['ORIGINAL_OWNER_MANUAL_DECISION_WITNESSED_CLAIM','OWNER_FINAL_DECISION_CONFLICT_HOLD']
        .includes(p.attestation_result)&&
      (p.attestation_result!=='ORIGINAL_OWNER_MANUAL_DECISION_WITNESSED_CLAIM'||
        owner.requests_manual_acceptance)&&
      recent(p.attested_at,owner.issued_at,time)&&ID.test(p.attestor_id)&&ID.test(p.key_id)});
  return {...r,manual_decision_witnessed:r.signature_authenticated&&
    r.claim==='ORIGINAL_OWNER_MANUAL_DECISION_WITNESSED_CLAIM'};
}
export async function verifyDispute771({env,history,owner,attestation,readback,
  now=Date.now()}={}){
  const r=await verify({env,history,owner,readback,kind:'dispute',role:ROLES771[1],
    canonicalFn:canonicalDispute771,now,
    valid:(p,h,time)=>attestation?.signature_authenticated&&
      p.schema==='rosie-independent-handoff-dispute-resolution-v771'&&
      p.attestation_receipt_sha256===attestation.receipt_sha256&&
      p.handoff_ack_receipt_sha256===h.ack.receipt_sha256&&
      p.original_handoff_manifest_sha256===h.history.handoff.handoff_manifest_sha256&&
      HASH.test(p.dispute_register_sha256)&&ID.test(p.dispute_case_id)&&
      ['NO_UNRESOLVED_HANDOFF_DISPUTE_CLAIM','EXTERNAL_HANDOFF_DISPUTE_REFERRED_CLAIM',
        'HANDOFF_DISPUTE_EVIDENCE_CONFLICT_HOLD'].includes(p.dispute_result)&&
      (p.dispute_result!=='NO_UNRESOLVED_HANDOFF_DISPUTE_CLAIM'||
        owner.requests_manual_acceptance&&h.ack.acknowledged_claim&&
        attestation.manual_decision_witnessed)&&
      (p.dispute_result!=='EXTERNAL_HANDOFF_DISPUTE_REFERRED_CLAIM'||
        owner.requests_dispute)&&
      recent(p.reviewed_at,attestation.signed_at,time)&&
      ID.test(p.witness_id)&&ID.test(p.key_id)});
  return {...r,clean_claim:r.signature_authenticated&&
    r.claim==='NO_UNRESOLVED_HANDOFF_DISPUTE_CLAIM',
    external_dispute_claim:r.signature_authenticated&&
    r.claim==='EXTERNAL_HANDOFF_DISPUTE_REFERRED_CLAIM'};
}
export async function verifyEscalation771({env,history,owner,attestation,dispute,
  readback,now=Date.now()}={}){
  const r=await verify({env,history,owner,readback,kind:'escalation',
    role:ROLES771[2],canonicalFn:canonicalEscalation771,now,
    valid:(p,h,time)=>attestation?.signature_authenticated&&dispute?.signature_authenticated&&
      p.schema==='rosie-independent-retention-exception-escalation-v771'&&
      p.attestation_receipt_sha256===attestation.receipt_sha256&&
      p.dispute_review_receipt_sha256===dispute.receipt_sha256&&
      p.retention_aging_receipt_sha256===h.aging.receipt_sha256&&
      p.original_exception_register_sha256===h.aging.exception_register_sha256&&
      HASH.test(p.current_escalation_register_sha256)&&ID.test(p.escalation_case_id)&&
      /^(?:0|[1-9]\d{0,5})$/.test(p.unresolved_critical_count)&&
      Number(p.unresolved_critical_count)>=h.aging.critical_exception_count&&
      ['NO_RETENTION_ESCALATION_REQUIRED_CLAIM','EXTERNAL_RETENTION_ESCALATION_OPEN_CLAIM',
        'RETENTION_ESCALATION_EVIDENCE_CONFLICT_HOLD'].includes(p.escalation_result)&&
      (p.escalation_result!=='NO_RETENTION_ESCALATION_REQUIRED_CLAIM'||
        owner.requests_manual_acceptance&&h.aging.clean_claim&&
        h.aging.open_exception_count===0&&h.aging.critical_exception_count===0&&
        !h.aging.retention_window_expired&&p.unresolved_critical_count==='0'&&
        dispute.clean_claim)&&
      (p.escalation_result!=='EXTERNAL_RETENTION_ESCALATION_OPEN_CLAIM'||
        owner.requests_retention_escalation||h.aging.open_exception_count>0)&&
      recent(p.escalated_at,dispute.signed_at,time)&&
      ID.test(p.witness_id)&&ID.test(p.key_id)});
  return {...r,clean_claim:r.signature_authenticated&&
    r.claim==='NO_RETENTION_ESCALATION_REQUIRED_CLAIM',
    escalation_open_claim:r.signature_authenticated&&
    r.claim==='EXTERNAL_RETENTION_ESCALATION_OPEN_CLAIM',
    unresolved_critical_count:r.signature_authenticated?
      Number(readback.envelope.payload.unresolved_critical_count):null,
    actual_retention_record_updated_by_app:false};
}
export async function reconcile771({history,owner,attestation,dispute,escalation,
  reviewed_at=new Date().toISOString()}={}){
  const follow_ups=[];
  if(!complete(history))follow_ups.push({code:'BUILD770_SIGNED_ORIGINAL_CHAIN_INCOMPLETE',
    action:'Re-authenticate external operator, owner, custody, handoff, register and retention evidence.'});
  if(!owner?.signature_authenticated)follow_ups.push({code:'ORIGINAL_OWNER_FINAL_DECISION_MISSING',
    action:'Obtain fresh original owner-signed manual decision, handoff-dispute request or retention HOLD.'});
  else if(owner.requests_dispute)follow_ups.push({code:'ORIGINAL_OWNER_HANDOFF_DISPUTE_REQUESTED',
    action:'Confirm external recipient and custodian dispute resolution before business acceptance.'});
  else if(owner.requests_retention_escalation)follow_ups.push({code:'ORIGINAL_OWNER_RETENTION_ESCALATION_HOLD',
    action:'Owner signed retention escalation HOLD; preserve original sources and review externally.'});
  if(!attestation?.signature_authenticated)follow_ups.push({code:'FINAL_DECISION_ATTESTATION_UNVERIFIED',
    action:'Obtain separate signed original decision-register witness attestation.'});
  else if(!attestation.manual_decision_witnessed)follow_ups.push({
    code:'INDEPENDENT_FINAL_DECISION_CONFLICT',
    action:'Independent witness did not attest clean manual owner-decision review.'});
  if(!dispute?.signature_authenticated)follow_ups.push({code:'HANDOFF_DISPUTE_REVIEW_UNVERIFIED',
    action:'Obtain a separate signed handoff dispute register and original manifest check.'});
  else if(!dispute.clean_claim)follow_ups.push({code:'HANDOFF_DISPUTE_REMAINS_OPEN',
    action:'Resolve the original recipient/custodian dispute externally and retain signed receipts.'});
  if(!escalation?.signature_authenticated)follow_ups.push({code:'RETENTION_ESCALATION_REVIEW_UNVERIFIED',
    action:'Obtain independent retention exception escalation readback bound to original aging snapshot.'});
  else if(!escalation.clean_claim)follow_ups.push({code:'RETENTION_ESCALATION_HOLD',
    action:'Open, critical or disputed retention escalation prevents original owner acceptance review.'});
  if(escalation?.unresolved_critical_count>0)follow_ups.push({
    code:'CRITICAL_RETENTION_ESCALATION_UNRESOLVED',
    action:'Escalate to the real independent operator and original source custodian.'});
  const ready=follow_ups.length===0;
  follow_ups.push({code:'MANUAL_EXTERNAL_OWNER_BUSINESS_ACTION_REQUIRED',
    action:'Only a separately authorized original owner and external operator may accept, close or reopen real business records.'});
  const result={ok:true,build:771,read_only:true,
    predecessor_owner_register_status:history?.report?.owner_register_status||'HOLD',
    original_owner_final_manual_decision:owner||null,
    independent_final_decision_attestation:attestation||null,
    independent_handoff_dispute_resolution:dispute||null,
    independent_retention_exception_escalation:escalation||null,
    final_owner_review_status:ready?
      'READY_FOR_SEPARATE_MANUAL_FINAL_OWNER_BUSINESS_ACTION':
      'HOLD_FINAL_OWNER_DISPUTE_OR_RETENTION_ESCALATION',
    original_business_acceptance_recorded_by_app:false,
    external_case_reopened_by_app:false,
    append_only_storage_written_by_app:false,
    original_source_storage_verified_by_app:false,
    production_db_connected_by_app:false,closure_allowed:false,
    automatic_business_write:false,customer_notifications_sent_by_app:false,
    blocking_count:follow_ups.length,follow_ups,reviewed_at};
  result.packet_sha256=await hash(t(JSON.stringify({
    schema:'rosie-final-owner-manual-attestation-dispute-retention-v771',
    prior:history?.report?.packet_sha256||null,owner:owner?.receipt_sha256||null,
    attestation:attestation?.receipt_sha256||null,dispute:dispute?.receipt_sha256||null,
    escalation:escalation?.receipt_sha256||null,follow_ups,reviewed_at})));
  return result;
}
