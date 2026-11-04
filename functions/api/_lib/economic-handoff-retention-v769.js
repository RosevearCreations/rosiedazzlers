import {sha256Receipt754} from './owner-receipt-verification-v754.js';
import {KEY_ROLES768,ORIGIN_ROLES768} from './economic-owner-acceptance-v768.js';

// Build 769 only authenticates original issuer claims. It does not write to a
// production database, close exceptions, accept business outcomes or archive data.
export const ROLES769=Object.freeze([
  'INDEPENDENT_OWNER_HANDOFF_CUSTODIAN',
  'EXTERNAL_REOPEN_OUTCOME_WITNESS',
  'POSTCLOSURE_RETENTION_WITNESS'
]);
export const HANDOFF_FIELDS769=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id',
  'execution_request_id','production_project_ref','owner_decision_receipt_sha256',
  'original_custody_receipt_sha256','exception_review_receipt_sha256',
  'external_execution_receipt_sha256','original_audit_receipt_sha256',
  'handoff_manifest_sha256','handoff_destination_id','handoff_result',
  'handed_off_at','custodian_id','key_id'
]);
export const OUTCOME_FIELDS769=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id',
  'execution_request_id','production_project_ref','owner_decision_receipt_sha256',
  'exception_review_receipt_sha256','handoff_receipt_sha256',
  'previous_case_register_sha256','current_case_register_sha256',
  'reopen_action_id','unresolved_critical_count','reopen_outcome',
  'observed_at','witness_id','key_id'
]);
export const RETENTION_FIELDS769=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id',
  'execution_request_id','production_project_ref','owner_decision_receipt_sha256',
  'original_custody_receipt_sha256','handoff_receipt_sha256',
  'reopen_outcome_receipt_sha256','handoff_manifest_sha256',
  'original_source_manifest_sha256','retained_source_manifest_sha256',
  'retention_policy_sha256','retained_through','retention_result',
  'observed_at','witness_id','key_id'
]);
const HASH=/^[a-f\d]{64}$/i;
const ID=/^[A-Za-z0-9][A-Za-z0-9._:/-]{5,119}$/;
const UUID=/^[a-f\d]{8}-(?:[a-f\d]{4}-){3}[a-f\d]{12}$/i;
const t=s=>new TextEncoder().encode(s);
const digest=async v=>sha256Receipt754(v);
const hold=(status,detail,more={})=>({status,detail,signature_authenticated:false,
  receipt_sha256:null,...more});
const timestamp=s=>typeof s==='string'&&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(s)&&
  Number.isFinite(Date.parse(s));
const chronology=(at,after,now)=>timestamp(at)&&timestamp(after)&&
  Date.parse(at)>=Date.parse(after)&&Date.parse(at)<=now+300000&&
  now-Date.parse(at)<=7*86400000;
function canonical(payload,fields,domain){
  if(!payload||typeof payload!=='object'||Array.isArray(payload)||
    Object.keys(payload).length!==fields.length||
    !fields.every(f=>Object.hasOwn(payload,f)&&typeof payload[f]==='string'))
    throw Error('Noncanonical signed external evidence.');
  return t(domain+JSON.stringify(fields.map(f=>[f,payload[f]])));
}
export const canonicalHandoff769=p=>canonical(p,HANDOFF_FIELDS769,
  'rosie-independent-owner-evidence-handoff-v769:');
export const canonicalOutcome769=p=>canonical(p,OUTCOME_FIELDS769,
  'rosie-external-reopen-outcome-readback-v769:');
export const canonicalRetention769=p=>canonical(p,RETENTION_FIELDS769,
  'rosie-postclosure-retention-continuity-v769:');
function decode(s,len){
  if(typeof s!=='string'||s.length>200||s.length%4||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(s))return null;
  try{const data=Uint8Array.from(atob(s),c=>c.charCodeAt(0));
    return data.length===len?data:null;}catch{return null;}
}
// Reconcile all 30 key IDs, all 30 actual key bytes and all 21 pinned origins,
// not just the new role, before accepting any Build 769 evidence.
function trust(env,role,keyId){
  const all=[...KEY_ROLES768,...ROLES769],ids=new Set(),keys=new Set();
  let selected=null;
  for(const name of all){
    const key=decode(env?.[`ROSIE_ECONOMIC_${name}_PUBLIC_KEY_B64`],32);
    const id=env?.[`ROSIE_ECONOMIC_${name}_KEY_ID`];
    if(!key||typeof id!=='string'||!ID.test(id)||ids.has(id))return null;
    const fingerprint=Array.from(key).join(',');
    if(keys.has(fingerprint))return null;
    ids.add(id);keys.add(fingerprint);
    if(role===name&&keyId===id)selected=key;
  }
  return selected;
}
function sources(env){
  try{
    const urls=[...ORIGIN_ROLES768,...ROLES769].map(name=>
      new URL(env?.[`ROSIE_ECONOMIC_${name}_BASE_URL`]));
    if(urls.some(u=>u.protocol!=='https:'||u.username||u.password||u.port||
      u.search||u.hash||u.pathname!=='/'||!u.hostname.includes('.')||
      u.hostname==='localhost'||u.hostname.startsWith('[')||
      /^(?:\d{1,3}\.){3}\d{1,3}$/.test(u.hostname)||
      /\.(?:local|localhost|internal)$/i.test(u.hostname))||
      new Set(urls.map(u=>u.origin)).size!==urls.length)return null;
    return Object.fromEntries([...ORIGIN_ROLES768,...ROLES769].map((r,i)=>[r,urls[i]]));
  }catch{return null;}
}
async function verifySignature(envelope,transcript,key){
  if(!key||!envelope||typeof envelope!=='object'||Array.isArray(envelope)||
    Object.keys(envelope).length!==2||!Object.hasOwn(envelope,'payload')||
    !Object.hasOwn(envelope,'signature_b64'))return false;
  const signature=decode(envelope.signature_b64,64);if(!signature)return false;
  try{const pk=await crypto.subtle.importKey('raw',key,{name:'Ed25519'},false,['verify']);
    return crypto.subtle.verify('Ed25519',pk,signature,transcript);
  }catch{return false;}
}
const complete=ctx=>ctx?.prior?.ok===true&&
  ctx.prior.post_closure_review_status==='READY_FOR_SEPARATE_OWNER_FINAL_ACCEPTANCE_REVIEW'&&
  ctx?.report?.ok===true&&
  ctx.report.owner_postclosure_decision?.signature_authenticated===true&&
  ctx.report.independent_original_source_custody?.signature_authenticated===true&&
  ctx.report.independent_exception_reopening?.signature_authenticated===true&&
  UUID.test(ctx?.record?.booking_id||'')&&UUID.test(ctx?.record?.source_record_id||'')&&
  ID.test(ctx?.record?.change_ticket_id||'')&&
  ID.test(ctx?.record?.execution_request_id||'');
const scope=(p,ctx)=>complete(ctx)&&p?.booking_id===ctx.record.booking_id&&
  p?.source_record_id===ctx.record.source_record_id&&
  p?.change_ticket_id===ctx.record.change_ticket_id&&
  p?.execution_request_id===ctx.record.execution_request_id&&
  p?.trial_id===ctx.prior.verified_scope.trial_id&&
  p?.production_project_ref===ctx.prior.verified_scope.production_project_ref&&
  p?.owner_decision_receipt_sha256===ctx.report.owner_postclosure_decision.receipt_sha256;
const previous=ctx=>ctx.report.independent_original_source_custody;
const exception=ctx=>ctx.report.independent_exception_reopening;
const owner=ctx=>ctx.report.owner_postclosure_decision;
const sourcePaths={
  handoff:['INDEPENDENT_OWNER_HANDOFF_CUSTODIAN','/v1/economic-owner-evidence-handoff-v769'],
  outcome:['EXTERNAL_REOPEN_OUTCOME_WITNESS','/v1/economic-external-reopen-outcome-v769'],
  retention:['POSTCLOSURE_RETENTION_WITNESS','/v1/economic-postclosure-retention-v769']
};
export function receiptURL769(env,kind,ctx,handoff,outcome){
  if(!Object.hasOwn(sourcePaths,kind)||!complete(ctx)||
    kind!=='handoff'&&!handoff?.signature_authenticated||
    kind==='retention'&&!outcome?.signature_authenticated)return null;
  const origins=sources(env);if(!origins)return null;
  const [role,path]=sourcePaths[kind];const url=new URL(path,origins[role]);
  const params={booking_id:ctx.record.booking_id,
    source_record_id:ctx.record.source_record_id,
    change_ticket_id:ctx.record.change_ticket_id,
    execution_request_id:ctx.record.execution_request_id,
    owner_decision_receipt_sha256:owner(ctx).receipt_sha256,
    ...(kind==='handoff'?{}:{handoff_receipt_sha256:handoff.receipt_sha256}),
    ...(kind==='retention'?{reopen_outcome_receipt_sha256:outcome.receipt_sha256}:{})};
  for(const [key,val] of Object.entries(params))url.searchParams.set(key,val);
  return url.toString();
}
export async function readReceipt769(env,kind,ctx,handoff,outcome,fetcher=fetch){
  const url=receiptURL769(env,kind,ctx,handoff,outcome);
  if(!url)return {status:`HOLD_${String(kind).toUpperCase()}_SOURCE_UNAVAILABLE`};
  try{
    const response=await fetcher(url,{method:'GET',redirect:'error',
      headers:{Accept:'application/json','Cache-Control':'no-store'}});
    if(!response.ok)return {status:`HOLD_${kind.toUpperCase()}_SOURCE_UNAVAILABLE`};
    const text=await response.text();
    if(text.length>16000)return {status:`HOLD_${kind.toUpperCase()}_OVERSIZED`};
    const envelope=JSON.parse(text);
    if(!envelope||typeof envelope!=='object'||Array.isArray(envelope)||
      Object.keys(envelope).length!==2||!Object.hasOwn(envelope,'payload')||
      !Object.hasOwn(envelope,'signature_b64'))
      return {status:`HOLD_${kind.toUpperCase()}_FORMAT`};
    return {status:`SIGNED_${kind.toUpperCase()}_READBACK`,envelope};
  }catch{return {status:`HOLD_${kind.toUpperCase()}_SOURCE_UNAVAILABLE`};}
}
async function verify({ctx,env,readback,kind,canonicalFn,role,valid,now}){
  if(readback?.status!==`SIGNED_${kind.toUpperCase()}_READBACK`)
    return hold(readback?.status||`HOLD_${kind.toUpperCase()}_MISSING`,
      'Original independent issuer evidence unavailable.');
  const p=readback.envelope?.payload;let transcript;
  try{transcript=canonicalFn(p);}catch{return hold(`HOLD_${kind.toUpperCase()}_FORMAT`,
    'Original issuer evidence has noncanonical fields.');}
  if(!scope(p,ctx)||!valid(p,ctx,now))
    return hold(`HOLD_${kind.toUpperCase()}_SCOPE`,
      'Original issuer claim does not bind the exact owner, source and prior receipts.');
  const key=trust(env,role,p.key_id);
  if(!key)return hold(`HOLD_${kind.toUpperCase()}_SIGNER_INDEPENDENCE`,
    'Thirty distinct signing roles and key IDs required.');
  if(!sources(env))return hold(`HOLD_${kind.toUpperCase()}_ORIGIN_INDEPENDENCE`,
    'Twenty-one distinct original HTTPS issuer origins required.');
  if(!await verifySignature(readback.envelope,transcript,key))
    return hold(`HOLD_${kind.toUpperCase()}_SIGNATURE`,
      'Original issuer signature invalid.');
  return hold(`SIGNED_${kind.toUpperCase()}_CLAIM`,
    'Authenticated original issuer claim only; no site-side business action or storage verification.',
    {signature_authenticated:true,receipt_sha256:await digest(transcript),
      signed_at:p.handed_off_at||p.observed_at,claim:p.handoff_result||p.reopen_outcome||p.retention_result});
}
export async function verifyHandoff769({env,ctx,readback,now=Date.now()}={}){
  const verified=await verify({ctx,env,readback,kind:'handoff',
    canonicalFn:canonicalHandoff769,role:ROLES769[0],now,
    valid:(p,c,time)=>p.schema==='rosie-independent-owner-evidence-handoff-v769'&&
      p.original_custody_receipt_sha256===previous(c).receipt_sha256&&
      p.exception_review_receipt_sha256===exception(c).receipt_sha256&&
      p.external_execution_receipt_sha256===c.prior.independent_external_execution.receipt_sha256&&
      p.original_audit_receipt_sha256===c.prior.verified_scope.audit_inspection_receipt_sha256&&
      HASH.test(p.handoff_manifest_sha256)&&ID.test(p.handoff_destination_id)&&
      ['EVIDENCE_DELIVERED_TO_INDEPENDENT_OWNER_CLAIM','HANDOFF_DISPUTED_HOLD'].includes(p.handoff_result)&&
      chronology(p.handed_off_at,previous(c).reconciled_at,time)&&
      ID.test(p.custodian_id)&&ID.test(p.key_id)});
  return {...verified,clean_claim:verified.signature_authenticated&&
    verified.claim==='EVIDENCE_DELIVERED_TO_INDEPENDENT_OWNER_CLAIM',
    handoff_manifest_sha256:verified.signature_authenticated?
      readback.envelope.payload.handoff_manifest_sha256:null};
}
export async function verifyOutcome769({env,ctx,handoff,readback,now=Date.now()}={}){
  const verified=await verify({ctx,env,readback,kind:'outcome',
    canonicalFn:canonicalOutcome769,role:ROLES769[1],now,
    valid:(p,c,time)=>handoff?.signature_authenticated&&
      p.exception_review_receipt_sha256===exception(c).receipt_sha256&&
      p.handoff_receipt_sha256===handoff.receipt_sha256&&
      HASH.test(p.previous_case_register_sha256)&&HASH.test(p.current_case_register_sha256)&&
      ID.test(p.reopen_action_id)&&/^(?:0|[1-9]\d{0,5})$/.test(p.unresolved_critical_count)&&
      ['NO_REOPEN_ACTION_CLAIM','EXTERNAL_CASE_REOPENED_CLAIM','EXTERNAL_REOPEN_DISPUTED_HOLD']
        .includes(p.reopen_outcome)&&
      (p.reopen_outcome!=='NO_REOPEN_ACTION_CLAIM'||
        owner(c).accepts_manual_review_only&&exception(c).clean_claim&&
        p.unresolved_critical_count==='0'&&
        p.previous_case_register_sha256===p.current_case_register_sha256)&&
      (p.reopen_outcome!=='EXTERNAL_CASE_REOPENED_CLAIM'||
        owner(c).requests_reopen&&exception(c).reopen_claim&&
        p.previous_case_register_sha256!==p.current_case_register_sha256)&&
      (owner(c).requests_reopen&&p.reopen_outcome!=='NO_REOPEN_ACTION_CLAIM'||
        !owner(c).requests_reopen)&&
      chronology(p.observed_at,handoff.signed_at,time)&&
      ID.test(p.witness_id)&&ID.test(p.key_id)});
  return {...verified,no_reopen_claim:verified.signature_authenticated&&
    verified.claim==='NO_REOPEN_ACTION_CLAIM',
    external_reopen_claim:verified.signature_authenticated&&
    verified.claim==='EXTERNAL_CASE_REOPENED_CLAIM',
    current_case_register_sha256:verified.signature_authenticated?
      readback.envelope.payload.current_case_register_sha256:null};
}
export async function verifyRetention769({env,ctx,handoff,outcome,readback,now=Date.now()}={}){
  const verified=await verify({ctx,env,readback,kind:'retention',
    canonicalFn:canonicalRetention769,role:ROLES769[2],now,
    valid:(p,c,time)=>handoff?.signature_authenticated&&outcome?.signature_authenticated&&
      p.original_custody_receipt_sha256===previous(c).receipt_sha256&&
      p.handoff_receipt_sha256===handoff.receipt_sha256&&
      p.reopen_outcome_receipt_sha256===outcome.receipt_sha256&&
      p.handoff_manifest_sha256===handoff.handoff_manifest_sha256&&
      HASH.test(p.original_source_manifest_sha256)&&
      HASH.test(p.retained_source_manifest_sha256)&&
      HASH.test(p.retention_policy_sha256)&&
      timestamp(p.retained_through)&&Date.parse(p.retained_through)>=Date.parse(p.observed_at)&&
      ['ORIGINAL_SOURCE_RETENTION_CONTINUITY_CLAIM','RETENTION_MISMATCH_HOLD']
        .includes(p.retention_result)&&
      (p.retention_result!=='ORIGINAL_SOURCE_RETENTION_CONTINUITY_CLAIM'||
        p.original_source_manifest_sha256===p.retained_source_manifest_sha256)&&
      chronology(p.observed_at,outcome.signed_at,time)&&
      ID.test(p.witness_id)&&ID.test(p.key_id)});
  return {...verified,clean_claim:verified.signature_authenticated&&
    verified.claim==='ORIGINAL_SOURCE_RETENTION_CONTINUITY_CLAIM',
    retained_source_manifest_sha256:verified.signature_authenticated?
      readback.envelope.payload.retained_source_manifest_sha256:null,
    retention_policy_sha256:verified.signature_authenticated?
      readback.envelope.payload.retention_policy_sha256:null,
    retained_through:verified.signature_authenticated?
      readback.envelope.payload.retained_through:null};
}
export async function reconcile769({ctx,handoff,outcome,retention,
  reviewed_at=new Date().toISOString()}={}){
  const follow_ups=[];
  if(!complete(ctx))follow_ups.push({code:'BUILD768_SIGNED_SOURCE_CHAIN_INCOMPLETE',
    action:'Re-authenticate original owner, custody, exception and external production evidence; maintain HOLD.'});
  if(!handoff?.signature_authenticated)follow_ups.push({code:'OWNER_HANDOFF_NOT_AUTHENTICATED',
    action:'Obtain original independent handoff custodian receipt.'});
  else if(!handoff.clean_claim)follow_ups.push({code:'OWNER_HANDOFF_CONFLICT_HOLD',
    action:'Reconcile original evidence transfer with independent owner.'});
  if(!outcome?.signature_authenticated)follow_ups.push({code:'EXTERNAL_REOPEN_OUTCOME_NOT_AUTHENTICATED',
    action:'Obtain original external case-register witness outcome.'});
  else if(outcome.external_reopen_claim)follow_ups.push({code:'REOPEN_OUTCOME_MANUAL_CONFIRMATION_REQUIRED',
    action:'Confirm the claimed external case change directly with its owner and operator; no website mutation.'});
  else if(!outcome.no_reopen_claim)follow_ups.push({code:'REOPEN_OUTCOME_DISPUTED_HOLD',
    action:'Do not infer closure or reopen from a contested issuer receipt.'});
  if(!retention?.signature_authenticated)follow_ups.push({code:'RETENTION_CONTINUITY_UNVERIFIED',
    action:'Obtain separate signed retention witness and source-manifest continuity.'});
  else if(!retention.clean_claim)follow_ups.push({code:'ORIGINAL_SOURCE_RETENTION_CONFLICT',
    action:'Preserve original sources and investigate changed or missing manifest hashes.'});
  const ready=follow_ups.length===0;
  follow_ups.push({code:'MANUAL_ORIGINAL_OWNER_BUSINESS_DECISION_OUTSTANDING',
    action:'Original owner must separately confirm acceptance, external reopening outcome and retention. Software approval is not business acceptance.'});
  const result={ok:true,build:769,read_only:true,
    predecessor_owner_acceptance_status:ctx?.report?.owner_acceptance_status||'HOLD',
    owner_handoff:handoff||null,external_reopen_outcome:outcome||null,
    postclosure_retention_continuity:retention||null,
    handoff_retention_status:ready?
      'READY_FOR_SEPARATE_MANUAL_OWNER_HANDOFF_AND_RETENTION_REVIEW':
      'HOLD_ORIGINAL_HANDOFF_REOPEN_OUTCOME_OR_RETENTION',
    owner_acceptance_recorded_by_app:false,external_case_reopened_by_app:false,
    original_source_storage_verified_by_app:false,
    production_db_connected_by_app:false,closure_allowed:false,
    automatic_business_write:false,customer_notifications_sent_by_app:false,
    blocking_count:follow_ups.length,follow_ups,reviewed_at};
  result.packet_sha256=await digest(t(JSON.stringify({
    schema:'rosie-independent-owner-handoff-outcome-retention-v769',
    prior_owner:ctx?.report?.owner_postclosure_decision?.receipt_sha256||null,
    handoff:handoff?.receipt_sha256||null,outcome:outcome?.receipt_sha256||null,
    retention:retention?.receipt_sha256||null,follow_ups,reviewed_at})));
  return result;
}
