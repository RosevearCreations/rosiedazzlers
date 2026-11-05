import {sha256Receipt754} from './owner-receipt-verification-v754.js';
import {KEY_ROLES768,ORIGIN_ROLES768} from './economic-owner-acceptance-v768.js';
import {ROLES769} from './economic-handoff-retention-v769.js';
import {ROLES770} from './economic-owner-register-aging-v770.js';
import {ROLES771} from './economic-final-attestation-v771.js';
import {ROLES772} from './economic-resolution-sla-v772.js';
import {ROLES773} from './economic-disposition-renewal-v773.js';
import {ROLES774} from './economic-owner-handoff-aging-v774.js';

export const ROLES775=Object.freeze([
  'INDEPENDENT_HANDOFF_CLOSURE_DECISION_WITNESS',
  'INDEPENDENT_DISPUTE_AGING_ESCALATION_WITNESS',
  'INDEPENDENT_SOURCE_RETENTION_CONTINUITY_WITNESS'
]);
const SCOPE=['schema','booking_id','source_record_id','trial_id',
  'change_ticket_id','execution_request_id','production_project_ref'];
export const OWNER_FIELDS775=Object.freeze([...SCOPE,
  'original_owner_handoff_receipt_sha256','handoff_acknowledgment_receipt_sha256',
  'dispute_aging_receipt_sha256','retention_closure_witness_receipt_sha256',
  'manual_review_choice','review_ticket_id','owner_id','issued_at','nonce','key_id']);
export const DECISION_FIELDS775=Object.freeze([...SCOPE,
  'owner_review_receipt_sha256','prior_handoff_acknowledgment_receipt_sha256',
  'prior_handoff_register_sha256','current_handoff_decision_register_sha256',
  'decision_case_id','handoff_decision_result','observed_at','witness_id','key_id']);
export const ESCALATION_FIELDS775=Object.freeze([...SCOPE,
  'owner_review_receipt_sha256','decision_register_receipt_sha256',
  'prior_dispute_aging_receipt_sha256','prior_dispute_aging_register_sha256',
  'current_aging_escalation_register_sha256','elapsed_hours',
  'source_alert_threshold_hours','open_disputes','aging_escalation_result',
  'observed_at','witness_id','key_id']);
export const RETENTION_FIELDS775=Object.freeze([...SCOPE,
  'owner_review_receipt_sha256','decision_register_receipt_sha256',
  'aging_escalation_receipt_sha256','prior_closure_witness_receipt_sha256',
  'prior_retention_witness_register_sha256','original_retention_policy_sha256',
  'retained_source_history_sha256','current_retention_continuity_register_sha256',
  'critical_exceptions','retention_continuity_result','witness_expires_at',
  'observed_at','witness_id','key_id']);
const HASH=/^[a-f0-9]{64}$/i;
const ID=/^[A-Za-z0-9][A-Za-z0-9._:/-]{5,119}$/;
const UUID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const count=v=>typeof v==='string'&&/^(?:0|[1-9]\d{0,5})$/.test(v);
const utc=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(s)&&Number.isFinite(Date.parse(s));
const recent=(s,after,now)=>utc(s)&&utc(after)&&Date.parse(s)>=Date.parse(after)&&
  Date.parse(s)<=now+300000&&now-Date.parse(s)<=7*86400000;
const hold=(status,detail,more={})=>({status,detail,signature_authenticated:false,
  receipt_sha256:null,...more});
const t=s=>new TextEncoder().encode(s);
const hash=s=>sha256Receipt754(s);
function canonical(payload,fields,prefix){
  if(!payload||typeof payload!=='object'||Array.isArray(payload)||
    Object.keys(payload).length!==fields.length||
    !fields.every(f=>Object.hasOwn(payload,f)&&typeof payload[f]==='string'))
    throw Error('Noncanonical independent handoff or source-retention evidence.');
  return t(prefix+JSON.stringify(fields.map(f=>[f,payload[f]])));
}
export const canonicalOwner775=p=>canonical(p,OWNER_FIELDS775,
  'rosie-original-owner-handoff-closure-review-v775:');
export const canonicalDecision775=p=>canonical(p,DECISION_FIELDS775,
  'rosie-independent-handoff-closure-decision-v775:');
export const canonicalEscalation775=p=>canonical(p,ESCALATION_FIELDS775,
  'rosie-independent-dispute-aging-escalation-v775:');
export const canonicalRetention775=p=>canonical(p,RETENTION_FIELDS775,
  'rosie-independent-retention-continuity-v775:');
function decode(base64,n){
  if(typeof base64!=='string'||base64.length>200||base64.length%4||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64))return null;
  try{const b=Uint8Array.from(atob(base64),c=>c.charCodeAt(0));return b.length===n?b:null;}
  catch{return null;}
}
const keyRoles=[...KEY_ROLES768,...ROLES769,...ROLES770,...ROLES771,...ROLES772,
  ...ROLES773,...ROLES774,...ROLES775];
const originRoles=[...ORIGIN_ROLES768,...ROLES769,...ROLES770,...ROLES771,...ROLES772,
  ...ROLES773,...ROLES774,...ROLES775];
function signer(env,role,id){
  const ids=new Set(),pubs=new Set();let selected=null;
  for(const name of keyRoles){
    const pub=decode(env?.[`ROSIE_ECONOMIC_${name}_PUBLIC_KEY_B64`],32);
    const keyId=env?.[`ROSIE_ECONOMIC_${name}_KEY_ID`];
    if(!pub||typeof keyId!=='string'||!ID.test(keyId)||ids.has(keyId))return null;
    const fingerprint=Array.from(pub).join(',');if(pubs.has(fingerprint))return null;
    ids.add(keyId);pubs.add(fingerprint);
    if(name===role&&id===keyId)selected=pub;
  }
  return selected;
}
function origins(env){
  try{
    const urls=originRoles.map(name=>new URL(env?.[`ROSIE_ECONOMIC_${name}_BASE_URL`]));
    if(urls.some(u=>u.protocol!=='https:'||u.username||u.password||u.port||
      u.search||u.hash||u.pathname!=='/'||!u.hostname.includes('.')||
      u.hostname==='localhost'||u.hostname.startsWith('[')||
      /^(?:\d{1,3}\.){3}\d{1,3}$/.test(u.hostname)||
      /\.(?:local|localhost|internal)$/i.test(u.hostname))||
      new Set(urls.map(u=>u.origin)).size!==urls.length)return null;
    return Object.fromEntries(originRoles.map((role,i)=>[role,urls[i]]));
  }catch{return null;}
}
async function authenticated(envelope,bytes,pub){
  if(!pub||!envelope||typeof envelope!=='object'||Array.isArray(envelope)||
    Object.keys(envelope).length!==2||!Object.hasOwn(envelope,'payload')||
    !Object.hasOwn(envelope,'signature_b64'))return false;
  const signature=decode(envelope.signature_b64,64);if(!signature)return false;
  try{const k=await crypto.subtle.importKey('raw',pub,{name:'Ed25519'},false,['verify']);
    return crypto.subtle.verify('Ed25519',k,signature,bytes);}
  catch{return false;}
}
const original=h=>h?.history?.history?.history?.history?.history?.ctx;
const complete=h=>h?.report?.ok===true&&
  h?.report?.owner_renewal_handoff_status===
    'READY_FOR_SEPARATE_ORIGINAL_OWNER_RENEWAL_HANDOFF'&&
  h?.owner?.signature_authenticated===true&&h?.handoff?.acknowledged_claim===true&&
  h?.aging?.clean_claim===true&&h?.closure?.ready_claim===true&&
  original(h)?.prior?.ok===true&&
  UUID.test(original(h)?.record?.booking_id||'')&&
  UUID.test(original(h)?.record?.source_record_id||'');
const scope=(p,h)=>complete(h)&&
  p?.booking_id===original(h).record.booking_id&&
  p?.source_record_id===original(h).record.source_record_id&&
  p?.change_ticket_id===original(h).record.change_ticket_id&&
  p?.execution_request_id===original(h).record.execution_request_id&&
  p?.trial_id===original(h).prior.verified_scope.trial_id&&
  p?.production_project_ref===original(h).prior.verified_scope.production_project_ref;

export async function verifyOwner775({env,history,envelope,now=Date.now()}={}){
  const p=envelope?.payload;let bytes;
  try{bytes=canonicalOwner775(p);}catch{return hold('HOLD_OWNER_CLOSURE_REVIEW_FORMAT',
    'Original owner review must be an exact canonical signed envelope.');}
  if(p.schema!=='rosie-original-owner-handoff-closure-review-v775'||!scope(p,history)||
    p.original_owner_handoff_receipt_sha256!==history.owner.receipt_sha256||
    p.handoff_acknowledgment_receipt_sha256!==history.handoff.receipt_sha256||
    p.dispute_aging_receipt_sha256!==history.aging.receipt_sha256||
    p.retention_closure_witness_receipt_sha256!==history.closure.receipt_sha256||
    !['REQUEST_SEPARATE_HANDOFF_CLOSURE_REVIEW','HOLD_HANDOFF_DISPUTE',
      'HOLD_AGING_ESCALATION','HOLD_SOURCE_RETENTION'].includes(p.manual_review_choice)||
    !ID.test(p.review_ticket_id)||!ID.test(p.owner_id)||
    !/^[a-f0-9]{32,64}$/i.test(p.nonce)||!ID.test(p.key_id)||
    !recent(p.issued_at,history.closure.signed_at,now))
    return hold('HOLD_OWNER_CLOSURE_REVIEW_SCOPE',
      'Owner request must bind all four exact Build 774 original receipts.');
  const pub=signer(env,'OWNER_RECEIPT',p.key_id);
  if(!pub)return hold('HOLD_OWNER_CLOSURE_SIGNER_INDEPENDENCE','Forty-eight distinct original signing identities required.');
  if(!origins(env))return hold('HOLD_OWNER_CLOSURE_ORIGIN_INDEPENDENCE','Thirty-nine distinct HTTPS source origins required.');
  if(!await authenticated(envelope,bytes,pub))return hold('HOLD_OWNER_CLOSURE_SIGNATURE','Original owner signature invalid.');
  return hold('SIGNED_ORIGINAL_OWNER_HANDOFF_CLOSURE_REVIEW',
    'Authentic owner request for separate manual review, not executed closure.',{
      signature_authenticated:true,receipt_sha256:await hash(bytes),
      signed_at:p.issued_at,choice:p.manual_review_choice,
      requests_review:p.manual_review_choice==='REQUEST_SEPARATE_HANDOFF_CLOSURE_REVIEW',
      original_owner_business_action_executed_by_app:false});
}
const routes={
  decision:[ROLES775[0],'/v1/economic-handoff-closure-decision-v775'],
  escalation:[ROLES775[1],'/v1/economic-dispute-aging-escalation-v775'],
  retention:[ROLES775[2],'/v1/economic-source-retention-continuity-v775']
};
export function receiptURL775(env,kind,history,owner,decision,escalation){
  if(!Object.hasOwn(routes,kind)||!complete(history)||!owner?.signature_authenticated||
    kind!=='decision'&&!decision?.signature_authenticated||
    kind==='retention'&&!escalation?.signature_authenticated)return null;
  const urls=origins(env);if(!urls)return null;
  const [role,path]=routes[kind],url=new URL(path,urls[role]);
  const params={booking_id:original(history).record.booking_id,
    source_record_id:original(history).record.source_record_id,
    change_ticket_id:original(history).record.change_ticket_id,
    execution_request_id:original(history).record.execution_request_id,
    owner_review_receipt_sha256:owner.receipt_sha256,
    ...(kind==='decision'?{}:{decision_receipt_sha256:decision.receipt_sha256}),
    ...(kind==='retention'?{escalation_receipt_sha256:escalation.receipt_sha256}:{})};
  for(const [key,value] of Object.entries(params))url.searchParams.set(key,value);
  return url.toString();
}
export async function readReceipt775(env,kind,history,owner,decision,escalation,fetcher=fetch){
  const url=receiptURL775(env,kind,history,owner,decision,escalation);
  if(!url)return {status:`HOLD_${String(kind).toUpperCase()}_SOURCE_NOT_CONFIGURED`};
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
async function verify({env,kind,history,owner,readback,canonicalFn,valid,now}){
  if(readback?.status!==`SIGNED_${kind.toUpperCase()}_READBACK`)
    return hold(readback?.status||`HOLD_${kind.toUpperCase()}_MISSING`,
      'Independent original-source evidence unavailable.');
  const p=readback.envelope?.payload;let bytes;
  try{bytes=canonicalFn(p);}catch{return hold(`HOLD_${kind.toUpperCase()}_FORMAT`,
    'Original independent issuer envelope has invalid canonical fields.');}
  if(!scope(p,history)||!owner?.signature_authenticated||
    p.owner_review_receipt_sha256!==owner.receipt_sha256||!valid(p,history,now))
    return hold(`HOLD_${kind.toUpperCase()}_SCOPE`,
      'Source scope, previous digest, chronology, threshold or result conflicts.');
  const pub=signer(env,routes[kind][0],p.key_id);
  if(!pub)return hold(`HOLD_${kind.toUpperCase()}_SIGNER_INDEPENDENCE`,
    'All forty-eight signer identities must be distinct.');
  if(!origins(env))return hold(`HOLD_${kind.toUpperCase()}_ORIGIN_INDEPENDENCE`,
    'All thirty-nine issuer HTTPS roots must be distinct.');
  if(!await authenticated(readback.envelope,bytes,pub))
    return hold(`HOLD_${kind.toUpperCase()}_SIGNATURE`,'Independent issuer signature invalid.');
  return hold(`SIGNED_${kind.toUpperCase()}_CLAIM`,
    'Authenticated independent source claim only; no source record changed.',{
      signature_authenticated:true,receipt_sha256:await hash(bytes),
      signed_at:p.observed_at,claim:p.handoff_decision_result||
        p.aging_escalation_result||p.retention_continuity_result});
}
export async function verifyDecision775({env,history,owner,readback,now=Date.now()}={}){
  const r=await verify({env,kind:'decision',history,owner,readback,
    canonicalFn:canonicalDecision775,now,
    valid:(p,h,time)=>p.schema==='rosie-independent-handoff-closure-decision-v775'&&
      p.prior_handoff_acknowledgment_receipt_sha256===h.handoff.receipt_sha256&&
      p.prior_handoff_register_sha256===h.handoff.current_handoff_register_sha256&&
      HASH.test(p.current_handoff_decision_register_sha256)&&ID.test(p.decision_case_id)&&
      ['HANDOFF_CLOSURE_DECISION_REGISTER_CLEAR_CLAIM',
        'HANDOFF_CLOSURE_DECISION_PENDING_CLAIM',
        'HANDOFF_CLOSURE_DECISION_SOURCE_CONFLICT_HOLD'].includes(p.handoff_decision_result)&&
      (p.handoff_decision_result!=='HANDOFF_CLOSURE_DECISION_REGISTER_CLEAR_CLAIM'||
        owner.requests_review&&h.handoff.acknowledged_claim)&&
      recent(p.observed_at,owner.signed_at,time)&&ID.test(p.witness_id)&&ID.test(p.key_id)});
  return {...r,clean_claim:r.signature_authenticated&&
    r.claim==='HANDOFF_CLOSURE_DECISION_REGISTER_CLEAR_CLAIM',
    current_handoff_decision_register_sha256:r.signature_authenticated?
      readback.envelope.payload.current_handoff_decision_register_sha256:null,
    actual_handoff_or_closure_written_by_app:false};
}
export async function verifyEscalation775({env,history,owner,decision,readback,
  now=Date.now()}={}){
  const r=await verify({env,kind:'escalation',history,owner,readback,
    canonicalFn:canonicalEscalation775,now,
    valid:(p,h,time)=>decision?.signature_authenticated&&
      p.schema==='rosie-independent-dispute-aging-escalation-v775'&&
      p.decision_register_receipt_sha256===decision.receipt_sha256&&
      p.prior_dispute_aging_receipt_sha256===h.aging.receipt_sha256&&
      p.prior_dispute_aging_register_sha256===h.aging.current_aging_register_sha256&&
      HASH.test(p.current_aging_escalation_register_sha256)&&
      count(p.elapsed_hours)&&count(p.open_disputes)&&count(p.source_alert_threshold_hours)&&
      Number(p.source_alert_threshold_hours)===h.aging.source_alert_threshold_hours&&
      Number(p.elapsed_hours)>=h.aging.observed_age_hours&&
      Number(p.open_disputes)>=h.aging.observed_open_disputes&&
      Number(p.elapsed_hours)>=Math.floor((Date.parse(p.observed_at)-
        Date.parse(h.history.history.sla.signed_at))/3600000)&&
      ['NO_OPEN_AGING_ESCALATION_CLAIM','DISPUTE_AGING_ESCALATED_CLAIM',
        'DISPUTE_AGING_ESCALATION_SOURCE_CONFLICT_HOLD'].includes(p.aging_escalation_result)&&
      (p.aging_escalation_result!=='NO_OPEN_AGING_ESCALATION_CLAIM'||
        decision.clean_claim&&p.open_disputes==='0'&&
        Number(p.elapsed_hours)<=Number(p.source_alert_threshold_hours))&&
      (p.aging_escalation_result!=='DISPUTE_AGING_ESCALATED_CLAIM'||
        Number(p.open_disputes)>0||Number(p.elapsed_hours)>Number(p.source_alert_threshold_hours))&&
      recent(p.observed_at,decision.signed_at,time)&&ID.test(p.witness_id)&&ID.test(p.key_id)});
  return {...r,clean_claim:r.signature_authenticated&&r.claim==='NO_OPEN_AGING_ESCALATION_CLAIM',
    observed_elapsed_hours:r.signature_authenticated?Number(readback.envelope.payload.elapsed_hours):null,
    observed_open_disputes:r.signature_authenticated?Number(readback.envelope.payload.open_disputes):null,
    source_dispute_escalation_executed_by_app:false};
}
export async function verifyRetention775({env,history,owner,decision,escalation,
  readback,now=Date.now()}={}){
  const r=await verify({env,kind:'retention',history,owner,readback,
    canonicalFn:canonicalRetention775,now,
    valid:(p,h,time)=>decision?.signature_authenticated&&escalation?.signature_authenticated&&
      p.schema==='rosie-independent-retention-continuity-v775'&&
      p.decision_register_receipt_sha256===decision.receipt_sha256&&
      p.aging_escalation_receipt_sha256===escalation.receipt_sha256&&
      p.prior_closure_witness_receipt_sha256===h.closure.receipt_sha256&&
      p.prior_retention_witness_register_sha256===
        h.closure.current_retention_witness_register_sha256&&
      p.original_retention_policy_sha256===h.history.history.sla.sla_policy_sha256&&
      HASH.test(p.retained_source_history_sha256)&&
      HASH.test(p.current_retention_continuity_register_sha256)&&
      count(p.critical_exceptions)&&
      Number(p.critical_exceptions)>=h.closure.critical_retention_exceptions&&
      utc(p.witness_expires_at)&&Date.parse(p.witness_expires_at)>Date.parse(p.observed_at)&&
      Date.parse(p.witness_expires_at)<=Date.parse(p.observed_at)+30*86400000&&
      ['SOURCE_RETENTION_CONTINUITY_PRESERVED_CLAIM',
        'SOURCE_RETENTION_CONTINUITY_FOLLOWUP_CLAIM',
        'SOURCE_RETENTION_CONTINUITY_CONFLICT_HOLD'].includes(p.retention_continuity_result)&&
      (p.retention_continuity_result!=='SOURCE_RETENTION_CONTINUITY_PRESERVED_CLAIM'||
        decision.clean_claim&&escalation.clean_claim&&h.closure.ready_claim&&
        p.critical_exceptions==='0'&&Date.parse(p.witness_expires_at)>time)&&
      recent(p.observed_at,escalation.signed_at,time)&&ID.test(p.witness_id)&&ID.test(p.key_id)});
  return {...r,preserved_claim:r.signature_authenticated&&
    r.claim==='SOURCE_RETENTION_CONTINUITY_PRESERVED_CLAIM',
    critical_count:r.signature_authenticated?Number(readback.envelope.payload.critical_exceptions):null,
    retained_source_history_sha256:r.signature_authenticated?
      readback.envelope.payload.retained_source_history_sha256:null,
    current_retention_continuity_register_sha256:r.signature_authenticated?
      readback.envelope.payload.current_retention_continuity_register_sha256:null,
    witness_expires_at:r.signature_authenticated?
      readback.envelope.payload.witness_expires_at:null,
    original_source_archival_or_deletion_by_app:false};
}
export async function reconcile775({history,owner,decision,escalation,retention,
  reviewed_at=new Date().toISOString()}={}){
  const follow_ups=[];
  if(!complete(history))follow_ups.push({code:'ORIGINAL_BUILD774_SIGNED_CHAIN_INCOMPLETE',
    action:'Reauthenticate the signed Build 774 owner handoff, independent acknowledgment, aging and closure readiness at original issuers.'});
  if(!owner?.signature_authenticated)follow_ups.push({code:'ORIGINAL_OWNER_CLOSURE_REVIEW_MISSING',
    action:'Obtain fresh original-owner signed manual handoff/closure review or explicit HOLD.'});
  else if(!owner.requests_review)follow_ups.push({code:'ORIGINAL_OWNER_SIGNED_HOLD',
    action:'Respect the owner HOLD and escalate original dispute or retention case to its real custodian.'});
  if(!decision?.signature_authenticated)follow_ups.push({code:'HANDOFF_DECISION_REGISTER_WITNESS_MISSING',
    action:'Obtain independent signed original handoff decision register evidence.'});
  else if(!decision.clean_claim)follow_ups.push({code:'HANDOFF_DECISION_PENDING_OR_DISPUTED',
    action:'Resolve current pending or disputed external decision at the original source.'});
  if(!escalation?.signature_authenticated)follow_ups.push({code:'DISPUTE_AGING_ESCALATION_WITNESS_MISSING',
    action:'Obtain signed age, source threshold, open dispute count and escalation result.'});
  else if(!escalation.clean_claim)follow_ups.push({code:'DISPUTE_AGING_ESCALATION_OPEN',
    action:'Escalate overdue, open or conflicting original dispute aging.'});
  if(!retention?.signature_authenticated)follow_ups.push({code:'SOURCE_RETENTION_CONTINUITY_WITNESS_MISSING',
    action:'Obtain independently signed original source-history digest, current retention register and bounded witness expiry.'});
  else if(!retention.preserved_claim)follow_ups.push({code:'SOURCE_RETENTION_NOT_INDEPENDENTLY_CONTINUOUS',
    action:'Preserve all original source history and refer any critical exceptions to original custodian.'});
  if(retention?.critical_count>0)follow_ups.push({code:'CRITICAL_RETENTION_EXCEPTION_OPEN',
    action:'Original custodian and DBA must separately disposition critical retention exceptions.'});
  const ready=follow_ups.length===0&&owner.requests_review;
  follow_ups.push({code:'SEPARATE_ORIGINAL_OWNER_AND_CUSTODIAN_ACTION_REQUIRED',
    action:'Real original owner and custodian must independently decide and execute any handoff, renewal, dispute closure or retention action.'});
  const report={ok:true,build:775,read_only:true,
    predecessor_handoff_status:history?.report?.owner_renewal_handoff_status||'HOLD',
    original_owner_handoff_closure_review:owner||null,
    independent_handoff_decision_register:decision||null,
    independent_dispute_aging_escalation:escalation||null,
    independent_source_retention_continuity:retention||null,
    handoff_closure_decision_status:ready?
      'READY_FOR_SEPARATE_ORIGINAL_OWNER_HANDOFF_CLOSURE_DECISION':
      'HOLD_HANDOFF_DECISION_AGING_OR_RETENTION_CONTINUITY',
    original_owner_business_signoff_by_app:false,external_handoff_executed_by_app:false,
    original_dispute_closed_by_app:false,source_retention_modified_by_app:false,
    production_database_written_by_app:false,source_archive_modified_by_app:false,
    append_only_audit_written_by_app:false,notification_sent_by_app:false,
    automatic_business_action:false,closure_allowed:false,
    blocking_count:follow_ups.length,follow_ups,reviewed_at};
  report.packet_sha256=await hash(t(JSON.stringify({
    schema:'rosie-handoff-decision-aging-retention-v775',
    predecessor:history?.report?.packet_sha256||null,
    owner:owner?.receipt_sha256||null,decision:decision?.receipt_sha256||null,
    escalation:escalation?.receipt_sha256||null,
    retention:retention?.receipt_sha256||null,follow_ups,reviewed_at})));
  return report;
}
