import {sha256Receipt754} from './owner-receipt-verification-v754.js';
import {KEY_ROLES768,ORIGIN_ROLES768} from './economic-owner-acceptance-v768.js';
import {ROLES769} from './economic-handoff-retention-v769.js';

// Independent claims only: no owner acceptance or source ledger is written here.
export const ROLES770=Object.freeze([
  'ORIGINAL_OWNER_DECISION_REGISTER_WITNESS',
  'INDEPENDENT_HANDOFF_ACKNOWLEDGMENT_WITNESS',
  'RETENTION_EXCEPTION_AGING_WITNESS'
]);
export const REGISTER_FIELDS770=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id',
  'execution_request_id','production_project_ref','owner_decision_receipt_sha256',
  'handoff_receipt_sha256','external_reopen_outcome_receipt_sha256',
  'retention_receipt_sha256','previous_decision_register_sha256',
  'current_decision_register_sha256','decision_case_id','decision_record_id',
  'register_decision','decision_entered_at','witness_id','key_id'
]);
export const ACK_FIELDS770=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id',
  'execution_request_id','production_project_ref','owner_decision_receipt_sha256',
  'decision_register_receipt_sha256','handoff_receipt_sha256',
  'handoff_manifest_sha256','acknowledged_manifest_sha256',
  'recipient_reference_id','ack_result','acknowledged_at','witness_id','key_id'
]);
export const AGING_FIELDS770=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id',
  'execution_request_id','production_project_ref','owner_decision_receipt_sha256',
  'decision_register_receipt_sha256','handoff_ack_receipt_sha256',
  'postclosure_retention_receipt_sha256','current_source_manifest_sha256',
  'retention_policy_sha256','retained_through','exception_register_sha256',
  'open_exception_count','critical_exception_count','oldest_exception_at',
  'alert_after_hours','retention_result','snapshot_at','witness_id','key_id'
]);
const UUID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const ID=/^[A-Za-z0-9][A-Za-z0-9._:/-]{5,119}$/;
const HASH=/^[a-f0-9]{64}$/i;
const integer=s=>typeof s==='string'&&/^(?:0|[1-9]\d{0,5})$/.test(s);
const utc=s=>typeof s==='string'&&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(s)&&
  Number.isFinite(Date.parse(s));
const recent=(s,after,now)=>utc(s)&&utc(after)&&
  Date.parse(s)>=Date.parse(after)&&Date.parse(s)<=now+300000&&
  now-Date.parse(s)<=7*86400000;
const bytes=s=>new TextEncoder().encode(s);
const hash=async data=>sha256Receipt754(data);
const hold=(status,detail,extra={})=>({status,detail,signature_authenticated:false,
  receipt_sha256:null,...extra});
function canonical(payload,fields,domain){
  if(!payload||typeof payload!=='object'||Array.isArray(payload)||
    Object.keys(payload).length!==fields.length||
    !fields.every(key=>Object.hasOwn(payload,key)&&typeof payload[key]==='string'))
    throw Error('Noncanonical signed decision-register evidence.');
  return bytes(domain+JSON.stringify(fields.map(k=>[k,payload[k]])));
}
export const canonicalRegister770=p=>canonical(p,REGISTER_FIELDS770,
  'rosie-independent-owner-decision-register-v770:');
export const canonicalAck770=p=>canonical(p,ACK_FIELDS770,
  'rosie-independent-owner-handoff-acknowledgment-v770:');
export const canonicalAging770=p=>canonical(p,AGING_FIELDS770,
  'rosie-retention-exception-aging-v770:');
function decode(value,size){
  if(typeof value!=='string'||value.length>200||value.length%4||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))return null;
  try{const raw=Uint8Array.from(atob(value),c=>c.charCodeAt(0));
    return raw.length===size?raw:null;}catch{return null;}
}
const allSigners=[...KEY_ROLES768,...ROLES769,...ROLES770];
const allSources=[...ORIGIN_ROLES768,...ROLES769,...ROLES770];
function publicKey(env,role,keyId){
  const ids=new Set(),fingerprints=new Set();let selected=null;
  for(const name of allSigners){
    const key=decode(env?.[`ROSIE_ECONOMIC_${name}_PUBLIC_KEY_B64`],32);
    const id=env?.[`ROSIE_ECONOMIC_${name}_KEY_ID`];
    if(!key||typeof id!=='string'||!ID.test(id)||ids.has(id))return null;
    const fingerprint=Array.from(key).join(',');
    if(fingerprints.has(fingerprint))return null;
    ids.add(id);fingerprints.add(fingerprint);
    if(role===name&&keyId===id)selected=key;
  }
  return selected;
}
function sources(env){
  try{const urls=allSources.map(name=>new URL(env?.[`ROSIE_ECONOMIC_${name}_BASE_URL`]));
    if(urls.some(u=>u.protocol!=='https:'||u.username||u.password||u.port||
      u.search||u.hash||u.pathname!=='/'||!u.hostname.includes('.')||
      u.hostname==='localhost'||u.hostname.startsWith('[')||
      /^(?:\d{1,3}\.){3}\d{1,3}$/.test(u.hostname)||
      /\.(?:local|localhost|internal)$/i.test(u.hostname))||
      new Set(urls.map(u=>u.origin)).size!==urls.length)return null;
    return Object.fromEntries(allSources.map((name,i)=>[name,urls[i]]));
  }catch{return null;}
}
async function signed(envelope,transcript,key){
  if(!key||!envelope||typeof envelope!=='object'||Array.isArray(envelope)||
    Object.keys(envelope).length!==2||!Object.hasOwn(envelope,'payload')||
    !Object.hasOwn(envelope,'signature_b64'))return false;
  const signature=decode(envelope.signature_b64,64);if(!signature)return false;
  try{const pk=await crypto.subtle.importKey('raw',key,{name:'Ed25519'},false,['verify']);
    return crypto.subtle.verify('Ed25519',pk,signature,transcript);
  }catch{return false;}
}
function complete(history){
  const c=history?.ctx,r=history?.report;
  return c?.prior?.ok===true&&c.prior.post_closure_review_status===
    'READY_FOR_SEPARATE_OWNER_FINAL_ACCEPTANCE_REVIEW'&&
    c?.report?.owner_postclosure_decision?.signature_authenticated===true&&
    history?.handoff?.signature_authenticated===true&&
    history?.outcome?.signature_authenticated===true&&
    history?.retention?.signature_authenticated===true&&
    r?.ok===true&&
    UUID.test(c?.record?.booking_id||'')&&UUID.test(c?.record?.source_record_id||'')&&
    ID.test(c?.record?.change_ticket_id||'')&&
    ID.test(c?.record?.execution_request_id||'');
}
const scope=(p,h)=>complete(h)&&p?.booking_id===h.ctx.record.booking_id&&
  p?.source_record_id===h.ctx.record.source_record_id&&
  p?.change_ticket_id===h.ctx.record.change_ticket_id&&
  p?.execution_request_id===h.ctx.record.execution_request_id&&
  p?.trial_id===h.ctx.prior.verified_scope.trial_id&&
  p?.production_project_ref===h.ctx.prior.verified_scope.production_project_ref&&
  p?.owner_decision_receipt_sha256===
    h.ctx.report.owner_postclosure_decision.receipt_sha256;
const routes={
  register:[ROLES770[0],'/v1/economic-owner-decision-register-v770'],
  ack:[ROLES770[1],'/v1/economic-owner-handoff-ack-v770'],
  aging:[ROLES770[2],'/v1/economic-retention-exception-aging-v770']
};
export function receiptURL770(env,kind,history,register,ack){
  if(!Object.hasOwn(routes,kind)||!complete(history)||
    kind!=='register'&&!register?.signature_authenticated||
    kind==='aging'&&!ack?.signature_authenticated)return null;
  const pinned=sources(env);if(!pinned)return null;
  const [role,path]=routes[kind],url=new URL(path,pinned[role]);
  const params={booking_id:history.ctx.record.booking_id,
    source_record_id:history.ctx.record.source_record_id,
    change_ticket_id:history.ctx.record.change_ticket_id,
    execution_request_id:history.ctx.record.execution_request_id,
    owner_decision_receipt_sha256:
      history.ctx.report.owner_postclosure_decision.receipt_sha256,
    ...(kind==='register'?{}:{decision_register_receipt_sha256:register.receipt_sha256}),
    ...(kind==='aging'?{handoff_ack_receipt_sha256:ack.receipt_sha256}:{})};
  for(const [name,value] of Object.entries(params))url.searchParams.set(name,value);
  return url.toString();
}
export async function readReceipt770(env,kind,history,register,ack,fetcher=fetch){
  const url=receiptURL770(env,kind,history,register,ack);
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
async function verify({env,kind,role,history,readback,canonicalFn,valid,now}){
  if(readback?.status!==`SIGNED_${kind.toUpperCase()}_READBACK`)
    return hold(readback?.status||`HOLD_${kind.toUpperCase()}_MISSING`,
      'Original issuer did not provide independently verifiable evidence.');
  const p=readback.envelope?.payload;let transcript;
  try{transcript=canonicalFn(p);}catch{return hold(`HOLD_${kind.toUpperCase()}_FORMAT`,
    'Noncanonical signed issuer report.');}
  if(!scope(p,history)||!valid(p,history,now))
    return hold(`HOLD_${kind.toUpperCase()}_SCOPE`,
      'Original receipt is missing, late, contradictory or outside the signed owner scope.');
  const key=publicKey(env,role,p.key_id);
  if(!key)return hold(`HOLD_${kind.toUpperCase()}_KEY_INDEPENDENCE`,
    'Thirty-three distinct original signer keys and IDs are required.');
  if(!sources(env))return hold(`HOLD_${kind.toUpperCase()}_ORIGIN_INDEPENDENCE`,
    'Twenty-four distinct HTTPS evidence sources are required.');
  if(!await signed(readback.envelope,transcript,key))
    return hold(`HOLD_${kind.toUpperCase()}_SIGNATURE`,'Original issuer signature invalid.');
  return hold(`SIGNED_${kind.toUpperCase()}_CLAIM`,
    'Original issuer claim authenticated; no actual business record was accepted or changed.',
    {signature_authenticated:true,receipt_sha256:await hash(transcript),
      signed_at:p.decision_entered_at||p.acknowledged_at||p.snapshot_at,
      claim:p.register_decision||p.ack_result||p.retention_result});
}
export async function verifyRegister770({env,history,readback,now=Date.now()}={}){
  const r=await verify({env,history,readback,kind:'register',role:ROLES770[0],
    canonicalFn:canonicalRegister770,now,
    valid:(p,h,time)=>p.schema==='rosie-independent-owner-decision-register-v770'&&
      p.handoff_receipt_sha256===h.handoff.receipt_sha256&&
      p.external_reopen_outcome_receipt_sha256===h.outcome.receipt_sha256&&
      p.retention_receipt_sha256===h.retention.receipt_sha256&&
      HASH.test(p.previous_decision_register_sha256)&&
      HASH.test(p.current_decision_register_sha256)&&
      p.previous_decision_register_sha256!==p.current_decision_register_sha256&&
      ID.test(p.decision_case_id)&&ID.test(p.decision_record_id)&&
      ['OWNER_MANUAL_ACCEPTANCE_REVIEW_REGISTERED_CLAIM',
        'OWNER_EXTERNAL_REOPEN_FOLLOWUP_REGISTERED_CLAIM',
        'OWNER_HOLD_REGISTERED_CLAIM'].includes(p.register_decision)&&
      (p.register_decision!=='OWNER_MANUAL_ACCEPTANCE_REVIEW_REGISTERED_CLAIM'||
        h.report.handoff_retention_status===
          'READY_FOR_SEPARATE_MANUAL_OWNER_HANDOFF_AND_RETENTION_REVIEW'&&
        h.ctx.report.owner_postclosure_decision.accepts_manual_review_only&&
        h.outcome.no_reopen_claim&&h.retention.clean_claim)&&
      (p.register_decision!=='OWNER_EXTERNAL_REOPEN_FOLLOWUP_REGISTERED_CLAIM'||
        h.ctx.report.owner_postclosure_decision.requests_reopen&&
        h.outcome.external_reopen_claim)&&
      recent(p.decision_entered_at,h.retention.signed_at,time)&&
      ID.test(p.witness_id)&&ID.test(p.key_id)});
  return {...r,manual_review_claim:r.signature_authenticated&&
    r.claim==='OWNER_MANUAL_ACCEPTANCE_REVIEW_REGISTERED_CLAIM',
    reopen_followup_claim:r.signature_authenticated&&
    r.claim==='OWNER_EXTERNAL_REOPEN_FOLLOWUP_REGISTERED_CLAIM'};
}
export async function verifyAck770({env,history,register,readback,now=Date.now()}={}){
  const r=await verify({env,history,readback,kind:'ack',role:ROLES770[1],
    canonicalFn:canonicalAck770,now,
    valid:(p,h,time)=>register?.signature_authenticated&&
      p.schema==='rosie-independent-owner-handoff-acknowledgment-v770'&&
      p.decision_register_receipt_sha256===register.receipt_sha256&&
      p.handoff_receipt_sha256===h.handoff.receipt_sha256&&
      p.handoff_manifest_sha256===h.handoff.handoff_manifest_sha256&&
      HASH.test(p.acknowledged_manifest_sha256)&&
      ['OWNER_EVIDENCE_RECEIPT_ACKNOWLEDGED_CLAIM',
        'OWNER_HANDOFF_ACKNOWLEDGMENT_DISPUTED_HOLD'].includes(p.ack_result)&&
      (p.ack_result!=='OWNER_EVIDENCE_RECEIPT_ACKNOWLEDGED_CLAIM'||
        h.handoff.clean_claim&&
        p.acknowledged_manifest_sha256===p.handoff_manifest_sha256)&&
      ID.test(p.recipient_reference_id)&&
      recent(p.acknowledged_at,register.signed_at,time)&&
      ID.test(p.witness_id)&&ID.test(p.key_id)});
  return {...r,acknowledged_claim:r.signature_authenticated&&
    r.claim==='OWNER_EVIDENCE_RECEIPT_ACKNOWLEDGED_CLAIM'};
}
export async function verifyAging770({env,history,register,ack,readback,
  now=Date.now()}={}){
  const r=await verify({env,history,readback,kind:'aging',role:ROLES770[2],
    canonicalFn:canonicalAging770,now,
    valid:(p,h,time)=>register?.signature_authenticated&&ack?.signature_authenticated&&
      p.schema==='rosie-retention-exception-aging-v770'&&
      p.decision_register_receipt_sha256===register.receipt_sha256&&
      p.handoff_ack_receipt_sha256===ack.receipt_sha256&&
      p.postclosure_retention_receipt_sha256===h.retention.receipt_sha256&&
      p.current_source_manifest_sha256===h.retention.retained_source_manifest_sha256&&
      p.retention_policy_sha256===h.retention.retention_policy_sha256&&
      p.retained_through===h.retention.retained_through&&
      HASH.test(p.exception_register_sha256)&&
      integer(p.open_exception_count)&&integer(p.critical_exception_count)&&
      Number(p.critical_exception_count)<=Number(p.open_exception_count)&&
      utc(p.oldest_exception_at)&&utc(p.snapshot_at)&&
      Date.parse(p.oldest_exception_at)<=Date.parse(p.snapshot_at)&&
      /^(?:[1-9]\d{0,3})$/.test(p.alert_after_hours)&&
      Number(p.alert_after_hours)<=4320&&
      ['NO_OPEN_RETENTION_EXCEPTION_CLAIM','OPEN_RETENTION_EXCEPTIONS_CLAIM',
        'RETENTION_REGISTER_DISPUTED_HOLD'].includes(p.retention_result)&&
      (p.retention_result!=='NO_OPEN_RETENTION_EXCEPTION_CLAIM'||
        p.open_exception_count==='0'&&p.critical_exception_count==='0'&&
        h.retention.clean_claim)&&
      (p.retention_result!=='OPEN_RETENTION_EXCEPTIONS_CLAIM'||
        Number(p.open_exception_count)>0)&&
      recent(p.snapshot_at,ack.signed_at,time)&&
      ID.test(p.witness_id)&&ID.test(p.key_id)});
  const p=r.signature_authenticated?readback.envelope.payload:null;
  const age=p&&Number(p.open_exception_count)>0?
    Math.max(0,Math.floor((Date.parse(p.snapshot_at)-
      Date.parse(p.oldest_exception_at))/3600000)):0;
  return {...r,clean_claim:r.signature_authenticated&&
    r.claim==='NO_OPEN_RETENTION_EXCEPTION_CLAIM',
    open_exception_count:p?Number(p.open_exception_count):null,
    critical_exception_count:p?Number(p.critical_exception_count):null,
    oldest_open_exception_age_hours:p?age:null,
    source_alert_threshold_hours:p?Number(p.alert_after_hours):null,
    aged_exception_claim:!!p&&Number(p.open_exception_count)>0&&
      age>=Number(p.alert_after_hours),
    retention_window_expired:!!p&&Date.parse(p.snapshot_at)>Date.parse(p.retained_through),
    original_storage_inspected_by_app:false};
}
export async function reconcile770({history,register,ack,aging,
  reviewed_at=new Date().toISOString()}={}){
  const follow_ups=[];
  if(!complete(history))follow_ups.push({code:'BUILD769_ORIGINAL_SOURCE_EVIDENCE_UNVERIFIED',
    action:'Re-authenticate the original signed owner, operator, handoff, reopening and retention chain.'});
  if(!register?.signature_authenticated)follow_ups.push({code:'OWNER_DECISION_REGISTER_UNVERIFIED',
    action:'Obtain original independently signed decision-register entry bound to exact owner receipts.'});
  else if(register.reopen_followup_claim)follow_ups.push({
    code:'EXTERNAL_REOPEN_FOLLOWUP_REQUIRES_OWNER_CONFIRMATION',
    action:'Verify the actual case register externally. A witnessed claim does not reopen or close cases.'});
  else if(!register.manual_review_claim)follow_ups.push({code:'OWNER_REGISTER_HOLD',
    action:'Owner decision register indicates HOLD or conflicting review; do not infer acceptance.'});
  if(!ack?.signature_authenticated)follow_ups.push({code:'ORIGINAL_HANDOFF_ACKNOWLEDGMENT_UNVERIFIED',
    action:'Obtain independent signed acknowledgment of the exact delivered handoff manifest.'});
  else if(!ack.acknowledged_claim)follow_ups.push({code:'HANDOFF_ACKNOWLEDGMENT_DISPUTED',
    action:'Reconcile recipient acknowledgment and original handoff manifest outside the website.'});
  if(!aging?.signature_authenticated)follow_ups.push({code:'RETENTION_EXCEPTION_SNAPSHOT_UNVERIFIED',
    action:'Obtain a fresh independent retention exception snapshot and original policy digest.'});
  else{
    if(!aging.clean_claim)follow_ups.push({code:'RETENTION_EXCEPTION_REGISTER_HOLD',
      action:'Resolve signed open exceptions or a disputed register; do not clear exceptions automatically.'});
    if(aging.critical_exception_count>0)follow_ups.push({code:'CRITICAL_RETENTION_EXCEPTION_OPEN',
      action:'Escalate critical original-source retention exceptions to the independent operator.'});
    if(aging.aged_exception_claim)follow_ups.push({code:'RETENTION_EXCEPTION_AGING_THRESHOLD_REACHED',
      action:`Oldest signed open exception reached ${aging.oldest_open_exception_age_hours} hours against the source-supplied ${aging.source_alert_threshold_hours}-hour review threshold.`});
    if(aging.retention_window_expired)follow_ups.push({code:'SIGNED_RETENTION_WINDOW_EXPIRED',
      action:'Reconcile the external source-retention period and original policy before any owner review.'});
  }
  const ready=follow_ups.length===0;
  follow_ups.push({code:'SEPARATE_ORIGINAL_OWNER_BUSINESS_ACCEPTANCE_REQUIRED',
    action:'Confirm final business acceptance, any reopening and retained evidence directly with original external authorities.'});
  const result={ok:true,build:770,read_only:true,
    predecessor_handoff_retention_status:history?.report?.handoff_retention_status||'HOLD',
    independent_owner_decision_register:register||null,
    independent_owner_handoff_acknowledgment:ack||null,
    independent_retention_exception_aging:aging||null,
    owner_register_status:ready?'READY_FOR_SEPARATE_ORIGINAL_OWNER_DECISION_REVIEW':
      'HOLD_OWNER_REGISTER_HANDOFF_ACK_OR_RETENTION_AGING',
    original_business_acceptance_recorded_by_app:false,
    external_case_reopened_by_app:false,
    append_only_storage_written_by_app:false,
    original_source_storage_verified_by_app:false,
    production_db_connected_by_app:false,closure_allowed:false,
    automatic_business_write:false,customer_notifications_sent_by_app:false,
    blocking_count:follow_ups.length,follow_ups,reviewed_at};
  result.packet_sha256=await hash(bytes(JSON.stringify({
    schema:'rosie-owner-decision-register-ack-aging-review-v770',
    previous_handoff:history?.handoff?.receipt_sha256||null,
    register:register?.receipt_sha256||null,ack:ack?.receipt_sha256||null,
    aging:aging?.receipt_sha256||null,follow_ups,reviewed_at})));
  return result;
}
