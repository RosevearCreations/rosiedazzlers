import {sha256Receipt754} from './owner-receipt-verification-v754.js';

const HASH=/^[a-f0-9]{64}$/i;
const UUID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const ID=/^[A-Za-z0-9][A-Za-z0-9._:/-]{5,119}$/;
const utc=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(value)&&Number.isFinite(Date.parse(value));
const fresh=(at,until,now)=>utc(at)&&utc(until)&&Date.parse(at)>=now-15*60000&&
  Date.parse(at)<=now+300000&&Date.parse(until)>now&&Date.parse(until)-Date.parse(at)<=30*60000;
const bytes=value=>new TextEncoder().encode(value);
const digest=async value=>sha256Receipt754(bytes(value));
const hold=(status,detail,more={})=>({status,detail,signature_authenticated:false,receipt_sha256:null,...more});
const KEYS=[
  ['ROSIE_ECONOMIC_OWNER_RECEIPT_PUBLIC_KEY_B64','ROSIE_ECONOMIC_OWNER_RECEIPT_KEY_ID'],
  ['ROSIE_ECONOMIC_SOURCE_WITNESS_PUBLIC_KEY_B64','ROSIE_ECONOMIC_SOURCE_WITNESS_KEY_ID'],
  ['ROSIE_ECONOMIC_HISTORY_CUSTODIAN_PUBLIC_KEY_B64','ROSIE_ECONOMIC_HISTORY_CUSTODIAN_KEY_ID'],
  ['ROSIE_ECONOMIC_RETENTION_PROVIDER_PUBLIC_KEY_B64','ROSIE_ECONOMIC_RETENTION_PROVIDER_KEY_ID'],
  ['ROSIE_ECONOMIC_STORAGE_AUDITOR_PUBLIC_KEY_B64','ROSIE_ECONOMIC_STORAGE_AUDITOR_KEY_ID'],
  ['ROSIE_ECONOMIC_DBA_REVIEW_PUBLIC_KEY_B64','ROSIE_ECONOMIC_DBA_REVIEW_KEY_ID'],
  ['ROSIE_ECONOMIC_SECURITY_REVIEW_PUBLIC_KEY_B64','ROSIE_ECONOMIC_SECURITY_REVIEW_KEY_ID'],
  ['ROSIE_ECONOMIC_ISOLATION_AUDITOR_PUBLIC_KEY_B64','ROSIE_ECONOMIC_ISOLATION_AUDITOR_KEY_ID'],
  ['ROSIE_ECONOMIC_ROLLBACK_WITNESS_PUBLIC_KEY_B64','ROSIE_ECONOMIC_ROLLBACK_WITNESS_KEY_ID'],
  ['ROSIE_ECONOMIC_TRIAL_OPERATOR_PUBLIC_KEY_B64','ROSIE_ECONOMIC_TRIAL_OPERATOR_KEY_ID'],
  ['ROSIE_ECONOMIC_TRIAL_RECONCILER_PUBLIC_KEY_B64','ROSIE_ECONOMIC_TRIAL_RECONCILER_KEY_ID'],
  ['ROSIE_ECONOMIC_ROLLBACK_EXCEPTION_PUBLIC_KEY_B64','ROSIE_ECONOMIC_ROLLBACK_EXCEPTION_KEY_ID'],
  ['ROSIE_ECONOMIC_CHANGE_CONTROL_PUBLIC_KEY_B64','ROSIE_ECONOMIC_CHANGE_CONTROL_KEY_ID']
];
function decode(value,size){
  if(typeof value!=='string'||value.length>200||value.length%4||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value))return null;
  try{const b=Uint8Array.from(atob(value),c=>c.charCodeAt(0));return b.length===size?b:null;}catch{return null;}
}
function signer(env,role,keyId){
  const ids=new Set(),fingerprints=new Set();let selected=null;
  for(const [index,[keyName,idName]] of KEYS.entries()){
    const key=decode(env?.[keyName],32),id=env?.[idName];
    if(!key||!ID.test(id||'')||ids.has(id))return null;
    const fingerprint=Array.from(key).join(',');if(fingerprints.has(fingerprint))return null;
    ids.add(id);fingerprints.add(fingerprint);
    if(index===role&&id===keyId)selected=key;
  }
  return selected;
}
const canonical=(p,fields,domain)=>{
  if(!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).length!==fields.length||
    !fields.every(k=>Object.hasOwn(p,k)&&typeof p[k]==='string'))throw Error('Noncanonical evidence.');
  return bytes(domain+JSON.stringify(fields.map(k=>[k,p[k]])));
};
async function verify(envelope,transcript,key){
  if(!key||!envelope||Array.isArray(envelope)||Object.keys(envelope).length!==2||
    !Object.hasOwn(envelope,'payload')||!Object.hasOwn(envelope,'signature_b64'))return false;
  const signature=decode(envelope.signature_b64,64);if(!signature)return false;
  try{const k=await crypto.subtle.importKey('raw',key,{name:'Ed25519'},false,['verify']);
    return await crypto.subtle.verify('Ed25519',k,signature,transcript);}catch{return false;}
}

export const ROLLBACK_DISPOSITION_FIELDS762=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','nonprod_environment_id','nonprod_project_ref',
  'operator_receipt_sha256','outcome_receipt_sha256','rollback_disposition',
  'rollback_execution_receipt_sha256','decision','observed_at','expires_at','reviewer_id','key_id'
]);
export const OWNER_SIGNOFF_FIELDS762=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','nonprod_environment_id','nonprod_project_ref',
  'build761_packet_sha256','operator_receipt_sha256','outcome_receipt_sha256',
  'rollback_review_receipt_sha256','migration_artifact_sha256','rollback_artifact_sha256',
  'backup_snapshot_sha256','decision','owner_id','issued_at','expires_at','nonce','key_id'
]);
export const CHANGE_CONTROL_FIELDS762=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','production_project_ref','nonprod_project_ref',
  'owner_signoff_sha256','rollback_review_receipt_sha256','migration_artifact_sha256',
  'rollback_artifact_sha256','backup_snapshot_sha256','change_ticket_id','window_start','window_end',
  'rollback_plan_check','dba_review_status','security_review_status','production_execution_authorization',
  'observed_at','expires_at','reviewer_id','key_id'
]);
export const canonicalRollbackDisposition762=p=>canonical(p,ROLLBACK_DISPOSITION_FIELDS762,'rosie-independent-rollback-disposition-v762:');
export const canonicalOwnerSignoff762=p=>canonical(p,OWNER_SIGNOFF_FIELDS762,'rosie-owner-nonprod-trial-signoff-v762:');
export const canonicalChangeControl762=p=>canonical(p,CHANGE_CONTROL_FIELDS762,'rosie-production-change-control-preflight-v762:');

/** Review providers cannot be controlled by the browser. Their origins must be distinct from each other and Build 761. */
export function reviewURL762(env,kind,record,prior,rollback,owner){
  if(!['rollback','change'].includes(kind)||!UUID.test(record?.booking_id||'')||
    !UUID.test(record?.source_record_id||'')||!prior?.nonprod_target?.configured||
    !prior?.operator_receipt?.signature_authenticated||!prior?.independent_trial_witness?.signature_authenticated)return null;
  const setting=kind==='rollback'?'ROSIE_ECONOMIC_ROLLBACK_EXCEPTION_BASE_URL':'ROSIE_ECONOMIC_CHANGE_CONTROL_BASE_URL';
  if(kind==='change'&&(!owner?.signature_authenticated||!rollback?.signature_authenticated))return null;
  try{
    const settings=[
      'ROSIE_ECONOMIC_TRIAL_OPERATOR_BASE_URL','ROSIE_ECONOMIC_TRIAL_RECONCILE_BASE_URL',
      'ROSIE_ECONOMIC_ROLLBACK_EXCEPTION_BASE_URL','ROSIE_ECONOMIC_CHANGE_CONTROL_BASE_URL'
    ];
    const urls=settings.map(k=>new URL(env?.[k]));
    if(urls.some(x=>x.protocol!=='https:'||x.username||x.password||x.port||x.search||x.hash||
      x.pathname!=='/'||!x.hostname.includes('.')||x.hostname==='localhost')||
      new Set(urls.map(x=>x.origin)).size!==urls.length)return null;
    const origin=new URL(env[setting]);
    const url=new URL(kind==='rollback'?'/v1/economic-nonprod-rollback-disposition-v762':
      '/v1/economic-production-change-review-v762',origin);
    const data={booking_id:record.booking_id,source_record_id:record.source_record_id,
      trial_id:prior.operator_receipt.trial_id,
      nonprod_project_ref:prior.nonprod_target.nonprod_project_ref,
      operator_receipt_sha256:prior.operator_receipt.receipt_sha256,
      outcome_receipt_sha256:prior.independent_trial_witness.receipt_sha256};
    if(kind==='change'){
      data.owner_signoff_sha256=owner.receipt_sha256;
      data.rollback_review_receipt_sha256=rollback.receipt_sha256;
    }
    for(const [key,value] of Object.entries(data))url.searchParams.set(key,value);
    return url.toString();
  }catch{return null;}
}
export async function readReview762(env,kind,record,prior,rollback,owner,fetcher=fetch){
  const url=reviewURL762(env,kind,record,prior,rollback,owner);
  if(!url)return {status:'HOLD_'+kind.toUpperCase()+'_PROVIDER_NOT_CONFIGURED'};
  try{
    const response=await fetcher(url,{method:'GET',redirect:'error',
      headers:{Accept:'application/json','Cache-Control':'no-store'}});
    if(!response.ok)return {status:'HOLD_'+kind.toUpperCase()+'_PROVIDER_UNAVAILABLE'};
    const raw=await response.text();if(raw.length>16000)return {status:'HOLD_'+kind.toUpperCase()+'_OVERSIZED'};
    const envelope=JSON.parse(raw);
    if(!envelope||typeof envelope!=='object'||Array.isArray(envelope)||Object.keys(envelope).length!==2||
      !Object.hasOwn(envelope,'payload')||!Object.hasOwn(envelope,'signature_b64'))
      return {status:'HOLD_'+kind.toUpperCase()+'_FORMAT'};
    return {status:'SIGNED_'+kind.toUpperCase()+'_READBACK',envelope};
  }catch{return {status:'HOLD_'+kind.toUpperCase()+'_PROVIDER_UNAVAILABLE'};}
}
export async function verifyRollbackDisposition762({env,record,prior,readback,now=Date.now()}={}){
  if(readback?.status!=='SIGNED_ROLLBACK_READBACK')return hold(readback?.status||'HOLD_ROLLBACK_DISPOSITION_MISSING',
    'Independent rollback disposition is unavailable.');
  const p=readback.envelope?.payload;let transcript;
  try{transcript=canonicalRollbackDisposition762(p);}catch{return hold('HOLD_ROLLBACK_DISPOSITION_FORMAT','Noncanonical rollback review.');}
  const target=prior?.nonprod_target,operator=prior?.operator_receipt,outcome=prior?.independent_trial_witness;
  const clean=outcome?.clean_claim===true;
  if(p.schema!=='rosie-independent-rollback-disposition-v762'||
    p.booking_id!==record?.booking_id||p.source_record_id!==record?.source_record_id||
    !operator?.signature_authenticated||!outcome?.signature_authenticated||
    p.trial_id!==operator.trial_id||p.nonprod_environment_id!==target?.nonprod_environment_id||
    p.nonprod_project_ref!==target?.nonprod_project_ref||
    p.operator_receipt_sha256!==operator.receipt_sha256||p.outcome_receipt_sha256!==outcome.receipt_sha256||
    p.rollback_disposition!==outcome.rollback_disposition||
    p.rollback_execution_receipt_sha256!==outcome.rollback_execution_receipt_sha256||
    p.decision!==(clean?'NO_EXCEPTION_CONFIRMED':'EXCEPTION_HELD_FOR_MANUAL_REVIEW')||
    !ID.test(p.reviewer_id)||!ID.test(p.key_id)||!fresh(p.observed_at,p.expires_at,now)||
    Date.parse(p.observed_at)<Date.parse(outcome.observed_at||''))
    return hold('HOLD_ROLLBACK_DISPOSITION_SCOPE','Independent rollback disposition conflicts with trial, timing, source or original witness.');
  const key=signer(env,11,p.key_id);
  if(!key)return hold('HOLD_ROLLBACK_REVIEW_KEY_INDEPENDENCE','A twelfth distinct signer is required.');
  if(!await verify(readback.envelope,transcript,key))return hold('HOLD_ROLLBACK_REVIEW_SIGNATURE_INVALID','Rollback review signature invalid.');
  return hold(clean?'SIGNED_NO_ROLLBACK_EXCEPTION_CLAIM':'SIGNED_ROLLBACK_EXCEPTION_HOLD_CLAIM',
    'Independent rollback disposition was signed externally; this application has not closed an incident.',
    {signature_authenticated:true,receipt_sha256:await sha256Receipt754(transcript),
      clean_claim:clean,decision:p.decision,observed_at:p.observed_at,
      rollback_disposition:p.rollback_disposition,incident_closed_by_app:false});
}
export async function verifyOwnerSignoff762({env,record,prior,rollback,envelope,now=Date.now()}={}){
  const p=envelope?.payload;let transcript;
  try{transcript=canonicalOwnerSignoff762(p);}catch{return hold('HOLD_OWNER_SIGNOFF_FORMAT','Owner sign-off is not canonical.');}
  const target=prior?.nonprod_target,operator=prior?.operator_receipt,outcome=prior?.independent_trial_witness;
  const clean=prior?.trial_review_status==='NONPROD_TRIAL_EVIDENCE_RECONCILED_NO_EXCEPTION'&&rollback?.clean_claim;
  if(p.schema!=='rosie-owner-nonprod-trial-signoff-v762'||
    p.booking_id!==record?.booking_id||p.source_record_id!==record?.source_record_id||
    !operator?.signature_authenticated||!outcome?.signature_authenticated||!rollback?.signature_authenticated||
    p.trial_id!==operator.trial_id||p.nonprod_environment_id!==target?.nonprod_environment_id||
    p.nonprod_project_ref!==target?.nonprod_project_ref||
    p.build761_packet_sha256!==prior?.packet_sha256||p.operator_receipt_sha256!==operator.receipt_sha256||
    p.outcome_receipt_sha256!==outcome.receipt_sha256||p.rollback_review_receipt_sha256!==rollback.receipt_sha256||
    p.migration_artifact_sha256!==operator.migration_artifact_sha256||
    p.rollback_artifact_sha256!==operator.rollback_artifact_sha256||
    p.backup_snapshot_sha256!==operator.backup_snapshot_sha256||
    p.decision!==(clean?'accept_nonprod_trial_for_change_review':'hold_nonprod_trial_exception')||
    !ID.test(p.owner_id)||!ID.test(p.key_id)||!/^[a-f0-9]{32,64}$/i.test(p.nonce)||
    !utc(p.issued_at)||!utc(p.expires_at)||Date.parse(p.issued_at)<Date.parse(rollback.observed_at||'')||
    Date.parse(p.issued_at)>now+300000||Date.parse(p.issued_at)<now-24*3600000||
    Date.parse(p.expires_at)<=now||Date.parse(p.expires_at)<=Date.parse(p.issued_at)||
    Date.parse(p.expires_at)-Date.parse(p.issued_at)>48*3600000)
    return hold('HOLD_OWNER_SIGNOFF_SCOPE','Owner decision, original trial evidence, project identity, artifact hashes or chronology conflict.');
  const key=signer(env,0,p.key_id);
  if(!key)return hold('HOLD_OWNER_SIGNOFF_KEY_INDEPENDENCE','Original independently pinned owner key required.');
  if(!await verify(envelope,transcript,key))return hold('HOLD_OWNER_SIGNOFF_SIGNATURE_INVALID','Owner decision signature invalid.');
  return hold(clean?'SIGNED_OWNER_NONPROD_TRIAL_ACCEPTANCE_FOR_REVIEW':'SIGNED_OWNER_NONPROD_TRIAL_EXCEPTION_HOLD',
    'Owner signed a trial review decision, not permission to execute a production migration.',
    {signature_authenticated:true,receipt_sha256:await sha256Receipt754(transcript),
      clean_acceptance:clean,decision:p.decision,issued_at:p.issued_at,expires_at:p.expires_at,
      production_execution_authorized:false});
}
export async function verifyChangeControl762({env,record,prior,rollback,owner,readback,now=Date.now()}={}){
  if(readback?.status!=='SIGNED_CHANGE_READBACK')return hold(readback?.status||'HOLD_CHANGE_CONTROL_MISSING',
    'Independent production migration change-control design review is required.');
  const p=readback.envelope?.payload;let transcript;
  try{transcript=canonicalChangeControl762(p);}catch{return hold('HOLD_CHANGE_CONTROL_FORMAT','Noncanonical change-control review.');}
  const target=prior?.nonprod_target,operator=prior?.operator_receipt;
  const windowStart=Date.parse(p.window_start),windowEnd=Date.parse(p.window_end);
  if(p.schema!=='rosie-production-change-control-preflight-v762'||
    !rollback?.clean_claim||!owner?.clean_acceptance||
    p.booking_id!==record?.booking_id||p.source_record_id!==record?.source_record_id||
    p.trial_id!==operator?.trial_id||p.production_project_ref!==target?.production_project_ref||
    p.nonprod_project_ref!==target?.nonprod_project_ref||
    p.production_project_ref===p.nonprod_project_ref||
    p.owner_signoff_sha256!==owner?.receipt_sha256||p.rollback_review_receipt_sha256!==rollback?.receipt_sha256||
    p.migration_artifact_sha256!==operator?.migration_artifact_sha256||
    p.rollback_artifact_sha256!==operator?.rollback_artifact_sha256||
    p.backup_snapshot_sha256!==operator?.backup_snapshot_sha256||
    !ID.test(p.change_ticket_id)||!ID.test(p.reviewer_id)||!ID.test(p.key_id)||
    !utc(p.window_start)||!utc(p.window_end)||windowStart<=now||windowStart>now+7*86400000||
    windowEnd<=windowStart||windowEnd-windowStart>4*3600000||
    p.rollback_plan_check!=='DESIGN_REVIEWED_ONLY'||p.dba_review_status!=='DESIGN_REVIEWED_ONLY'||
    p.security_review_status!=='DESIGN_REVIEWED_ONLY'||
    p.production_execution_authorization!=='NOT_GRANTED'||
    !fresh(p.observed_at,p.expires_at,now)||Date.parse(p.observed_at)<Date.parse(owner?.issued_at||''))
    return hold('HOLD_CHANGE_CONTROL_SCOPE','Change ticket, production target, reviewed plan, time window or no-execution boundary conflicts.');
  const key=signer(env,12,p.key_id);
  if(!key)return hold('HOLD_CHANGE_CONTROL_KEY_INDEPENDENCE','A thirteenth distinct change-control reviewer required.');
  if(!await verify(readback.envelope,transcript,key))return hold('HOLD_CHANGE_CONTROL_SIGNATURE_INVALID','Change-control signature invalid.');
  return hold('SIGNED_PRODUCTION_CHANGE_CONTROL_DESIGN_PREFLIGHT',
    'A separate reviewer signed a production change design; it is not an execution permit.',
    {signature_authenticated:true,receipt_sha256:await sha256Receipt754(transcript),
      change_ticket_id:p.change_ticket_id,window_start:p.window_start,window_end:p.window_end,
      observed_at:p.observed_at,expires_at:p.expires_at,
      production_project_ref:p.production_project_ref,design_review_only:true,
      production_execution_authorized:false});
}
export async function reconcileChangeControl762({prior,rollback,owner,change,reviewed_at=new Date().toISOString()}={}){
  const blockers=[];
  if(!prior?.external_execution_claim_authenticated||!prior?.external_reconciliation_claim_authenticated)
    blockers.push({code:'BUILD761_AUTHENTIC_EXECUTION_CHAIN_UNVERIFIED',action:'Re-run the independent Build 761 operator and trial evidence review.'});
  if(!rollback?.signature_authenticated)
    blockers.push({code:'INDEPENDENT_ROLLBACK_DISPOSITION_UNVERIFIED',action:'Obtain independently signed, fresh rollback exception disposition from the pinned reviewer.'});
  else if(!rollback.clean_claim)
    blockers.push({code:'NONPROD_ROLLBACK_EXCEPTION_HELD',action:'Keep trial outcome and production planning blocked until a separately approved rollback incident is resolved.'});
  if(!owner?.signature_authenticated)
    blockers.push({code:'SIGNED_OWNER_TRIAL_DECISION_UNVERIFIED',action:'Obtain an authentic owner sign-off binding the exact trial and rollback reviewer hashes.'});
  else if(!owner.clean_acceptance)
    blockers.push({code:'OWNER_TRIAL_EXCEPTION_HOLD',action:'Owner has signed an exception HOLD, not acceptance for production change review.'});
  if(!change?.signature_authenticated)
    blockers.push({code:'PRODUCTION_CHANGE_CONTROL_DESIGN_UNVERIFIED',action:'Obtain separately signed change ticket, backup/rollback design and scheduled window preflight.'});
  blockers.push({code:'SEPARATE_PRODUCTION_MIGRATION_AUTHORIZATION',
    action:'DBA, security and owner must separately authorize exact production SQL and an operator outside this site.'});
  blockers.push({code:'BUSINESS_EXCEPTION_CLOSURE_HOLD',
    action:'No immutable owner audit migration, business exception closure or customer notification is authorized.'});
  const ready=blockers.length===2;
  const result={ok:true,build:762,read_only:true,
    nonprod_target:prior?.nonprod_target||null,build761_trial_status:prior?.trial_review_status||'HOLD_NONPROD_TRIAL_EVIDENCE',
    trial_evidence_binding:prior?.operator_receipt?.signature_authenticated?{
      trial_id:prior.operator_receipt.trial_id,
      build761_packet_sha256:prior.packet_sha256,
      operator_receipt_sha256:prior.operator_receipt.receipt_sha256,
      outcome_receipt_sha256:prior?.independent_trial_witness?.receipt_sha256||null,
      migration_artifact_sha256:prior.operator_receipt.migration_artifact_sha256,
      rollback_artifact_sha256:prior.operator_receipt.rollback_artifact_sha256,
      backup_snapshot_sha256:prior.operator_receipt.backup_snapshot_sha256
    }:null,
    rollback_disposition_review:rollback||null,owner_trial_signoff:owner||null,change_control_review:change||null,
    change_control_status:ready?'READY_FOR_SEPARATE_PRODUCTION_CHANGE_AUTHORIZATION':'HOLD_PRODUCTION_CHANGE_CONTROL_PREFLIGHT',
    production_execution_authorized:false,production_migration_executed:false,
    rollback_executed_by_app:false,production_credentials_read:false,
    customer_notifications_sent_by_app:false,owner_closure_audit_persisted:false,
    closure_allowed:false,automatic_business_write:false,blocking_count:blockers.length,
    follow_ups:blockers,reviewed_at};
  result.packet_sha256=await digest(JSON.stringify({schema:'rosie-production-change-control-preflight-v762',
    prior:prior?.packet_sha256||null,rollback:rollback?.receipt_sha256||null,
    owner:owner?.receipt_sha256||null,change:change?.receipt_sha256||null,
    production_target:prior?.nonprod_target?.production_project_ref||null,blockers,reviewed_at}));
  return result;
}
