import {sha256Receipt754} from './owner-receipt-verification-v754.js';

const ID=/^[A-Za-z0-9][A-Za-z0-9._:/-]{5,119}$/;
const UUID=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
const HASH=/^[a-f0-9]{64}$/i;
const utc=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(v)&&Number.isFinite(Date.parse(v));
const fresh=(at,until,now)=>utc(at)&&utc(until)&&Date.parse(at)>=now-15*60000&&
  Date.parse(at)<=now+300000&&Date.parse(until)>now&&Date.parse(until)-Date.parse(at)<=30*60000;
const encoded=v=>new TextEncoder().encode(v);
const digest=v=>sha256Receipt754(encoded(v));
const hold=(status,detail,extra={})=>({status,detail,signature_authenticated:false,receipt_sha256:null,...extra});
const KEY_ROLES=[
  ['OWNER_RECEIPT',0],['SOURCE_WITNESS',1],['HISTORY_CUSTODIAN',2],
  ['RETENTION_PROVIDER',3],['STORAGE_AUDITOR',4],['DBA_REVIEW',5],
  ['SECURITY_REVIEW',6],['ISOLATION_AUDITOR',7],['ROLLBACK_WITNESS',8],
  ['TRIAL_OPERATOR',9],['TRIAL_RECONCILER',10],['ROLLBACK_EXCEPTION',11],
  ['CHANGE_CONTROL',12],['PRODUCTION_DBA_AUTH',13],
  ['PRODUCTION_SECURITY_AUTH',14],['PRODUCTION_OPERATOR_GATE',15],
  ['PRODUCTION_ROLLBACK_READY',16]
];
const ORIGINS=[
  'TRIAL_OPERATOR','TRIAL_RECONCILE','ROLLBACK_EXCEPTION','CHANGE_CONTROL',
  'PRODUCTION_DBA_AUTH','PRODUCTION_SECURITY_AUTH','PRODUCTION_OPERATOR_GATE',
  'PRODUCTION_ROLLBACK_READY'
];
function decode(v,size){
  if(typeof v!=='string'||v.length>200||v.length%4||
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(v))return null;
  try{const bytes=Uint8Array.from(atob(v),c=>c.charCodeAt(0));return bytes.length===size?bytes:null;}
  catch{return null;}
}
function signer(env,role,keyId){
  const keyIds=new Set(),fingerprints=new Set();let selected=null;
  for(const [prefix,index] of KEY_ROLES){
    const key=decode(env?.[`ROSIE_ECONOMIC_${prefix}_PUBLIC_KEY_B64`],32);
    const id=env?.[`ROSIE_ECONOMIC_${prefix}_KEY_ID`];
    if(!key||!ID.test(id||'')||keyIds.has(id))return null;
    const fingerprint=Array.from(key).join(',');
    if(fingerprints.has(fingerprint))return null;
    keyIds.add(id);fingerprints.add(fingerprint);
    if(index===role&&id===keyId)selected=key;
  }
  return selected;
}
const canonical=(p,fields,domain)=>{
  if(!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).length!==fields.length||
    !fields.every(k=>Object.hasOwn(p,k)&&typeof p[k]==='string'))throw Error('Noncanonical receipt.');
  return encoded(domain+JSON.stringify(fields.map(k=>[k,p[k]])));
};
async function verify(envelope,transcript,key){
  if(!key||!envelope||Array.isArray(envelope)||Object.keys(envelope).length!==2||
    !Object.hasOwn(envelope,'payload')||!Object.hasOwn(envelope,'signature_b64'))return false;
  const signature=decode(envelope.signature_b64,64);if(!signature)return false;
  try{const imported=await crypto.subtle.importKey('raw',key,{name:'Ed25519'},false,['verify']);
    return await crypto.subtle.verify('Ed25519',imported,signature,transcript);}
  catch{return false;}
}
export const APPROVAL_FIELDS763=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id',
  'production_project_ref','nonprod_project_ref','build762_packet_sha256',
  'change_control_receipt_sha256','migration_artifact_sha256',
  'rollback_artifact_sha256','backup_snapshot_sha256','scope_check',
  'authorization_decision','observed_at','expires_at','reviewer_id','key_id'
]);
export const OWNER_PRODUCTION_FIELDS763=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id',
  'production_project_ref','nonprod_project_ref','build762_packet_sha256',
  'change_control_receipt_sha256','dba_authorization_sha256',
  'security_authorization_sha256','migration_artifact_sha256',
  'rollback_artifact_sha256','backup_snapshot_sha256','window_start','window_end',
  'decision','owner_id','issued_at','expires_at','nonce','key_id'
]);
export const OPERATOR_GATE_FIELDS763=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id',
  'production_project_ref','owner_authorization_sha256','dba_authorization_sha256',
  'security_authorization_sha256','migration_artifact_sha256',
  'rollback_artifact_sha256','backup_snapshot_sha256','runbook_sha256',
  'execution_request_id','window_start','window_end','credential_scope',
  'operator_ack','two_person_control','observed_at','expires_at','operator_id','key_id'
]);
export const ROLLBACK_READY_FIELDS763=Object.freeze([
  'schema','booking_id','source_record_id','trial_id','change_ticket_id',
  'production_project_ref','owner_authorization_sha256','operator_gate_sha256',
  'rollback_artifact_sha256','backup_snapshot_sha256','runbook_sha256',
  'incident_runbook_sha256','escalation_id','availability','protocol',
  'observed_at','expires_at','witness_id','key_id'
]);
export const canonicalApproval763=p=>canonical(p,APPROVAL_FIELDS763,'rosie-independent-production-authorization-v763:');
export const canonicalOwnerProduction763=p=>canonical(p,OWNER_PRODUCTION_FIELDS763,'rosie-owner-production-decision-v763:');
export const canonicalOperatorGate763=p=>canonical(p,OPERATOR_GATE_FIELDS763,'rosie-production-operator-gate-v763:');
export const canonicalRollbackReady763=p=>canonical(p,ROLLBACK_READY_FIELDS763,'rosie-production-rollback-witness-ready-v763:');

export function authorizationURL763(env,role,record,prior,approved={},owner=null,operator=null){
  if(!['dba','security','operator','rollback'].includes(role)||!UUID.test(record?.booking_id||'')||
    !UUID.test(record?.source_record_id||'')||
    prior?.change_control_status!=='READY_FOR_SEPARATE_PRODUCTION_CHANGE_AUTHORIZATION')return null;
  const route={
    dba:'/v1/economic-production-dba-authorization-v763',
    security:'/v1/economic-production-security-authorization-v763',
    operator:'/v1/economic-production-operator-readiness-v763',
    rollback:'/v1/economic-production-rollback-witness-v763'
  };
  const prefix={
    dba:'PRODUCTION_DBA_AUTH',security:'PRODUCTION_SECURITY_AUTH',
    operator:'PRODUCTION_OPERATOR_GATE',rollback:'PRODUCTION_ROLLBACK_READY'
  };
  if(['operator','rollback'].includes(role)&&(!approved.dba?.approved||!approved.security?.approved||
    !owner?.clean_authorization))return null;
  if(role==='rollback'&&!operator?.ready_claim)return null;
  try{
    const urls=ORIGINS.map(k=>new URL(env?.[`ROSIE_ECONOMIC_${k}_BASE_URL`]));
    if(urls.some(u=>u.protocol!=='https:'||u.username||u.password||u.port||u.search||u.hash||
      u.pathname!=='/'||u.hostname==='localhost'||!u.hostname.includes('.')||
      /^(?:\d{1,3}\.){3}\d{1,3}$/.test(u.hostname)||u.hostname.startsWith('[')||
      /\.(?:localhost|local|internal)$/i.test(u.hostname))||
      new Set(urls.map(u=>u.origin)).size!==urls.length)return null;
    const target=new URL(route[role],new URL(env[`ROSIE_ECONOMIC_${prefix[role]}_BASE_URL`]));
    const fields={
      booking_id:record.booking_id,source_record_id:record.source_record_id,
      trial_id:prior.trial_evidence_binding?.trial_id,
      change_ticket_id:prior.change_control_review?.change_ticket_id,
      production_project_ref:prior.nonprod_target?.production_project_ref,
      build762_packet_sha256:prior.packet_sha256
    };
    if(role==='operator'||role==='rollback'){
      fields.owner_authorization_sha256=owner.receipt_sha256;
      fields.dba_authorization_sha256=approved.dba.receipt_sha256;
      fields.security_authorization_sha256=approved.security.receipt_sha256;
    }
    if(role==='rollback')fields.operator_gate_sha256=operator.receipt_sha256;
    if(Object.values(fields).some(v=>typeof v!=='string'||!v))return null;
    for(const [k,v] of Object.entries(fields))target.searchParams.set(k,v);
    return target.toString();
  }catch{return null;}
}
export async function readAuthorization763(env,role,record,prior,approved,owner,operator,fetcher=fetch){
  const url=authorizationURL763(env,role,record,prior,approved,owner,operator);
  if(!url)return {status:'HOLD_'+role.toUpperCase()+'_INDEPENDENT_PROVIDER_NOT_CONFIGURED'};
  try{
    const response=await fetcher(url,{method:'GET',redirect:'error',
      headers:{Accept:'application/json','Cache-Control':'no-store'}});
    if(!response.ok)return {status:'HOLD_'+role.toUpperCase()+'_PROVIDER_UNAVAILABLE'};
    const raw=await response.text();
    if(raw.length>16000)return {status:'HOLD_'+role.toUpperCase()+'_PROVIDER_OVERSIZED'};
    const envelope=JSON.parse(raw);
    if(!envelope||typeof envelope!=='object'||Array.isArray(envelope)||Object.keys(envelope).length!==2||
      !Object.hasOwn(envelope,'payload')||!Object.hasOwn(envelope,'signature_b64'))
      return {status:'HOLD_'+role.toUpperCase()+'_PROVIDER_FORMAT'};
    return {status:'SIGNED_'+role.toUpperCase()+'_READBACK',envelope};
  }catch{return {status:'HOLD_'+role.toUpperCase()+'_PROVIDER_UNAVAILABLE'};}
}
function common(p,record,prior){
  const trial=prior?.trial_evidence_binding,change=prior?.change_control_review,target=prior?.nonprod_target;
  return p?.booking_id===record?.booking_id&&p?.source_record_id===record?.source_record_id&&
    prior?.change_control_status==='READY_FOR_SEPARATE_PRODUCTION_CHANGE_AUTHORIZATION'&&
    prior?.rollback_disposition_review?.clean_claim===true&&
    prior?.owner_trial_signoff?.clean_acceptance===true&&
    change?.signature_authenticated===true&&
    p.trial_id===trial?.trial_id&&p.change_ticket_id===change?.change_ticket_id&&
    p.production_project_ref===target?.production_project_ref&&
    target?.production_project_ref!==target?.nonprod_project_ref;
}
export async function verifyApproval763({env,role,record,prior,readback,now=Date.now()}={}){
  if(!['dba','security'].includes(role))return hold('HOLD_APPROVAL_ROLE','Invalid independent approval role.');
  if(readback?.status!==`SIGNED_${role.toUpperCase()}_READBACK`)return hold(readback?.status||'HOLD_APPROVAL_MISSING',
    'Independent DBA or security authorization is missing.');
  const p=readback.envelope?.payload;let transcript;
  try{transcript=canonicalApproval763(p);}catch{return hold('HOLD_APPROVAL_FORMAT','Noncanonical production approval.');}
  const trial=prior?.trial_evidence_binding,change=prior?.change_control_review,target=prior?.nonprod_target;
  const expectedSchema=`rosie-production-${role}-authorization-v763`;
  if(p.schema!==expectedSchema||!common(p,record,prior)||p.nonprod_project_ref!==target?.nonprod_project_ref||
    p.build762_packet_sha256!==prior?.packet_sha256||
    p.change_control_receipt_sha256!==change?.receipt_sha256||
    p.migration_artifact_sha256!==trial?.migration_artifact_sha256||
    p.rollback_artifact_sha256!==trial?.rollback_artifact_sha256||
    p.backup_snapshot_sha256!==trial?.backup_snapshot_sha256||
    !['APPROVE_EXACT_MANUAL_WINDOW_ONLY','HOLD_CHANGE_WINDOW'].includes(p.authorization_decision)||
    p.scope_check!==(p.authorization_decision==='APPROVE_EXACT_MANUAL_WINDOW_ONLY'?
      'EXACT_PROJECT_AND_ARTIFACTS_CONFIRMED':'EXCEPTION_REQUIRES_REVIEW')||
    !ID.test(p.reviewer_id)||!ID.test(p.key_id)||!fresh(p.observed_at,p.expires_at,now)||
    (change.observed_at&&Date.parse(p.observed_at)<Date.parse(change.observed_at)))
    return hold('HOLD_APPROVAL_SCOPE','The external approval conflicts with exact trial, project, artifacts or time.');
  const key=signer(env,role==='dba'?13:14,p.key_id);
  if(!key)return hold('HOLD_APPROVAL_KEY_INDEPENDENCE','Seventeen uniquely pinned independent signer identities are required.');
  if(!await verify(readback.envelope,transcript,key))return hold('HOLD_APPROVAL_SIGNATURE','Independent approval signature invalid.');
  const approved=p.authorization_decision==='APPROVE_EXACT_MANUAL_WINDOW_ONLY';
  return hold(approved?'SIGNED_'+role.toUpperCase()+'_SCOPE_APPROVAL_CLAIM':'SIGNED_'+role.toUpperCase()+'_HOLD_CLAIM',
    'Signed external authorization claim, not proof of a production migration.',
    {signature_authenticated:true,receipt_sha256:await sha256Receipt754(transcript),approved,
      decision:p.authorization_decision,reviewer_id:p.reviewer_id,observed_at:p.observed_at});
}
export async function verifyOwnerProduction763({env,record,prior,dba,security,envelope,now=Date.now()}={}){
  const p=envelope?.payload;let transcript;
  try{transcript=canonicalOwnerProduction763(p);}catch{return hold('HOLD_PRODUCTION_OWNER_FORMAT','Noncanonical owner production decision.');}
  const trial=prior?.trial_evidence_binding,change=prior?.change_control_review,target=prior?.nonprod_target;
  const clean=dba?.approved===true&&security?.approved===true;
  if(p.schema!=='rosie-owner-production-decision-v763'||!common(p,record,prior)||
    p.nonprod_project_ref!==target?.nonprod_project_ref||
    p.build762_packet_sha256!==prior?.packet_sha256||
    p.change_control_receipt_sha256!==change?.receipt_sha256||
    p.dba_authorization_sha256!==dba?.receipt_sha256||
    p.security_authorization_sha256!==security?.receipt_sha256||
    p.migration_artifact_sha256!==trial?.migration_artifact_sha256||
    p.rollback_artifact_sha256!==trial?.rollback_artifact_sha256||
    p.backup_snapshot_sha256!==trial?.backup_snapshot_sha256||
    p.window_start!==change?.window_start||p.window_end!==change?.window_end||
    p.decision!==(clean?'AUTHORIZE_OFFLINE_OPERATOR_GATE_REVIEW':'HOLD_PRODUCTION_CHANGE')||
    !ID.test(p.owner_id)||!ID.test(p.key_id)||!/^[a-f0-9]{32,64}$/i.test(p.nonce)||
    !fresh(p.issued_at,p.expires_at,now)||
    Date.parse(p.issued_at)<Math.max(Date.parse(dba?.observed_at||''),Date.parse(security?.observed_at||''))||
    Date.parse(p.window_start)<=now||Date.parse(p.window_end)<=Date.parse(p.window_start))
    return hold('HOLD_PRODUCTION_OWNER_SCOPE','Owner decision conflicts with signed approvals, scheduled window or source hashes.');
  const key=signer(env,0,p.key_id);
  if(!key)return hold('HOLD_PRODUCTION_OWNER_KEY_INDEPENDENCE','Existing independent owner key and all new signers are required.');
  if(!await verify(envelope,transcript,key))return hold('HOLD_PRODUCTION_OWNER_SIGNATURE','Owner decision signature invalid.');
  return hold(clean?'SIGNED_OWNER_OFFLINE_OPERATOR_REVIEW_CLAIM':'SIGNED_OWNER_PRODUCTION_CHANGE_HOLD',
    'The owner signed a restricted external operator review, never a site-issued execution permit.',
    {signature_authenticated:true,receipt_sha256:await sha256Receipt754(transcript),
      clean_authorization:clean,decision:p.decision,issued_at:p.issued_at,
      expires_at:p.expires_at,production_execution_authorized_by_app:false});
}
export async function verifyOperatorGate763({env,record,prior,dba,security,owner,readback,now=Date.now()}={}){
  if(readback?.status!=='SIGNED_OPERATOR_READBACK')
    return hold(readback?.status||'HOLD_OPERATOR_GATE_MISSING','Independent operator readiness unavailable.');
  const p=readback.envelope?.payload;let transcript;
  try{transcript=canonicalOperatorGate763(p);}catch{return hold('HOLD_OPERATOR_GATE_FORMAT','Noncanonical operator readiness.');}
  const trial=prior?.trial_evidence_binding,change=prior?.change_control_review;
  if(p.schema!=='rosie-production-operator-gate-v763'||!common(p,record,prior)||
    !owner?.clean_authorization||!dba?.approved||!security?.approved||
    p.owner_authorization_sha256!==owner.receipt_sha256||
    p.dba_authorization_sha256!==dba.receipt_sha256||
    p.security_authorization_sha256!==security.receipt_sha256||
    p.migration_artifact_sha256!==trial?.migration_artifact_sha256||
    p.rollback_artifact_sha256!==trial?.rollback_artifact_sha256||
    p.backup_snapshot_sha256!==trial?.backup_snapshot_sha256||
    !HASH.test(p.runbook_sha256)||!ID.test(p.execution_request_id)||
    p.window_start!==change?.window_start||p.window_end!==change?.window_end||
    p.credential_scope!=='PRODUCTION_CREDENTIALS_NOT_ACCESSED_BY_APP'||
    p.operator_ack!=='AVAILABLE_NO_MIGRATION_EXECUTED'||
    p.two_person_control!=='SEPARATE_WITNESS_REQUIRED'||
    !ID.test(p.operator_id)||!ID.test(p.key_id)||!fresh(p.observed_at,p.expires_at,now)||
    Date.parse(p.observed_at)<Date.parse(owner.issued_at))
    return hold('HOLD_OPERATOR_GATE_SCOPE','Operator acknowledgement does not match the authorized manual change scope.');
  const key=signer(env,15,p.key_id);
  if(!key)return hold('HOLD_OPERATOR_GATE_KEY_INDEPENDENCE','Independent production operator signing key required.');
  if(!await verify(readback.envelope,transcript,key))return hold('HOLD_OPERATOR_GATE_SIGNATURE','Operator gate signature invalid.');
  return hold('SIGNED_OFFLINE_OPERATOR_AVAILABLE_NOT_EXECUTED',
    'Externally signed operator readiness is not a report of execution.',
    {signature_authenticated:true,receipt_sha256:await sha256Receipt754(transcript),
      ready_claim:true,operator_id:p.operator_id,execution_request_id:p.execution_request_id,
      runbook_sha256:p.runbook_sha256,observed_at:p.observed_at,expires_at:p.expires_at,
      production_migration_executed:false});
}
export async function verifyRollbackReady763({env,record,prior,owner,operator,readback,now=Date.now()}={}){
  if(readback?.status!=='SIGNED_ROLLBACK_READBACK')
    return hold(readback?.status||'HOLD_ROLLBACK_WITNESS_MISSING','Independent rollback witness not on record.');
  const p=readback.envelope?.payload;let transcript;
  try{transcript=canonicalRollbackReady763(p);}catch{return hold('HOLD_ROLLBACK_WITNESS_FORMAT','Noncanonical rollback readiness.');}
  const trial=prior?.trial_evidence_binding;
  if(p.schema!=='rosie-production-rollback-witness-ready-v763'||!common(p,record,prior)||
    !owner?.clean_authorization||!operator?.ready_claim||
    p.owner_authorization_sha256!==owner.receipt_sha256||
    p.operator_gate_sha256!==operator.receipt_sha256||
    p.rollback_artifact_sha256!==trial?.rollback_artifact_sha256||
    p.backup_snapshot_sha256!==trial?.backup_snapshot_sha256||
    p.runbook_sha256!==operator.runbook_sha256||!HASH.test(p.incident_runbook_sha256)||
    !ID.test(p.escalation_id)||!ID.test(p.witness_id)||!ID.test(p.key_id)||
    p.availability!=='ON_CALL_READY_NO_ROLLBACK_EXECUTED'||
    p.protocol!=='MANUAL_TWO_PERSON_APPROVAL_REQUIRED'||
    !fresh(p.observed_at,p.expires_at,now)||
    Date.parse(p.observed_at)<Date.parse(operator.observed_at)||
    Date.parse(p.observed_at)>Date.parse(operator.expires_at))
    return hold('HOLD_ROLLBACK_WITNESS_SCOPE','Rollback witness does not match operator, original artifacts or manual control.');
  const key=signer(env,16,p.key_id);
  if(!key)return hold('HOLD_ROLLBACK_WITNESS_KEY_INDEPENDENCE','Distinct rollback readiness signer required.');
  if(!await verify(readback.envelope,transcript,key))return hold('HOLD_ROLLBACK_WITNESS_SIGNATURE','Rollback readiness signature invalid.');
  return hold('SIGNED_INDEPENDENT_ROLLBACK_WITNESS_AVAILABLE',
    'External on-call witness claim only; this site never runs a rollback.',
    {signature_authenticated:true,receipt_sha256:await sha256Receipt754(transcript),
      ready_claim:true,witness_id:p.witness_id,escalation_id:p.escalation_id,observed_at:p.observed_at,
      rollback_executed_by_app:false});
}
export async function reconcileAuthorization763({prior,dba,security,owner,operator,rollback,
  reviewed_at=new Date().toISOString()}={}){
  const follow_ups=[];
  if(prior?.change_control_status!=='READY_FOR_SEPARATE_PRODUCTION_CHANGE_AUTHORIZATION')
    follow_ups.push({code:'BUILD762_PREFLIGHT_HOLD',action:'Revalidate the nine signed Build 762 trial and change-control documents.'});
  for(const [name,value] of [['DBA',dba],['SECURITY',security]]){
    if(!value?.signature_authenticated)follow_ups.push({code:name+'_APPROVAL_UNVERIFIED',
      action:'Get an independent signed exact-project, artifact and ticket authorization receipt.'});
    else if(!value.approved)follow_ups.push({code:name+'_AUTHORIZATION_HOLD',
      action:'Respect the independently signed HOLD; do not schedule production execution.'});
  }
  if(!owner?.signature_authenticated)follow_ups.push({code:'OWNER_PRODUCTION_DECISION_UNVERIFIED',
    action:'Obtain the owner’s newly signed restricted decision binding both independent authorizations.'});
  else if(!owner.clean_authorization)follow_ups.push({code:'OWNER_PRODUCTION_HOLD',
    action:'Owner has withheld consent for an external operator gate review.'});
  if(!operator?.ready_claim)follow_ups.push({code:'EXTERNAL_OPERATOR_GATE_HOLD',
    action:'Obtain a signed operator and runbook acknowledgement; no production SQL has been executed.'});
  if(!rollback?.ready_claim)follow_ups.push({code:'INDEPENDENT_ROLLBACK_WITNESS_HOLD',
    action:'Secure an independent on-call witness and incident escalation runbook.'});
  follow_ups.push({code:'MANUAL_CHANGE_WINDOW_EXECUTION_REMAINS_EXTERNAL',
    action:'An authorized human change manager must recheck freshness, one-time approvals, credentials, backups and the exact window before any external action.'});
  follow_ups.push({code:'PRODUCTION_OUTCOME_AND_BUSINESS_CLOSURE_HOLD',
    action:'No execution/rollback receipt, immutable owner audit change, customer dispatch or business closure is recorded here.'});
  const ready=follow_ups.length===2;
  const result={ok:true,build:763,read_only:true,
    build762_status:prior?.change_control_status||'HOLD_PRODUCTION_CHANGE_CONTROL_PREFLIGHT',
    production_target:prior?.nonprod_target?.production_project_ref||null,
    change_ticket_id:prior?.change_control_review?.change_ticket_id||null,
    window_start:prior?.change_control_review?.window_start||null,
    window_end:prior?.change_control_review?.window_end||null,
    dba_authorization:dba||null,security_authorization:security||null,
    owner_production_decision:owner||null,operator_gate:operator||null,
    rollback_witness_readiness:rollback||null,
    authorization_status:ready?'READY_FOR_EXTERNAL_MANUAL_CHANGE_MANAGER_RECHECK':'HOLD_PRODUCTION_OPERATOR_AUTHORIZATION_GATE',
    manual_authorization_claims_authenticated:ready,
    production_execution_authorized:false,production_execution_authorized_by_app:false,
    production_migration_executed:false,rollback_executed_by_app:false,
    production_credentials_read:false,customer_notifications_sent_by_app:false,
    owner_closure_audit_persisted:false,closure_allowed:false,automatic_business_write:false,
    blocking_count:follow_ups.length,follow_ups,reviewed_at};
  result.packet_sha256=await digest(JSON.stringify({schema:'rosie-production-authorization-gate-v763',
    upstream:prior?.packet_sha256||null,dba:dba?.receipt_sha256||null,
    security:security?.receipt_sha256||null,owner:owner?.receipt_sha256||null,
    operator:operator?.receipt_sha256||null,rollback:rollback?.receipt_sha256||null,
    target:result.production_target,ticket:result.change_ticket_id,follow_ups,reviewed_at}));
  return result;
}
