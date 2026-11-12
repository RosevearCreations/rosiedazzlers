// Build 852 — bounded recall aging, signed device recheck and independent
// Master consumer continuity. Review only: no provider/receiver mutations.
import {recoveryCustody850} from './jobday-custody-850.js';
export const CONTRACT_852='rosie.ai-data.social-recall.consumer-continuity.v852';
export const DEVICE_RECHECK_AUDIT_852='Build 852 original device recheck review:';
export const CONSUMER_AUDIT_852='Build 852 independent consumer continuity review:';
const PLATFORMS=new Set(['facebook','instagram','tiktok','youtube','pinterest','x']);
const DF=['version','kind','source_id','source_contract','source_revision','booking_id','project_id','post_id','platform','case_reference','original_device_id','prior_witness_sha256','prior_witness_nonce','prior_source_revision','decision','nonce','issued_at','observed_at','expires_at','signer_id'];
const MF=['version','kind','source_id','source_contract','source_revision','consumer_id','receiver_id','booking_id','project_id','post_id','case_reference','prior_ack_sha256','prior_ack_nonce','prior_source_revision','device_recheck_sha256','device_recheck_nonce','decision','permissions','nonce','issued_at','observed_at','expires_at','signer_id'];
const ms=v=>typeof v==='string'?Date.parse(v):NaN;
const sha40=v=>typeof v==='string'&&/^[0-9a-f]{40}$/.test(v);
const sha256=v=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v);
const nonce=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{20,100}$/.test(v);
const ident=(v,min=3,max=100)=>typeof v==='string'&&v.length>=min&&v.length<=max&&/^[A-Za-z0-9_.@-]+$/.test(v);
const fresh=(r,now)=>{
  const i=ms(r?.issued_at),o=ms(r?.observed_at),e=ms(r?.expires_at);
  return [i,o,e].every(Number.isFinite)&&i<=now+300000&&o<=now+300000&&now-i<=600000&&now-o<=600000&&o>=i-300000&&o<=e&&e>now&&e>i&&e-i<=900000;
};
const decode=(v,n)=>{
  if(typeof v!=='string'||!/^[A-Za-z0-9_-]+$/.test(v))return null;
  try{const s=v.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-v.length%4)%4);const a=Uint8Array.from(atob(s),c=>c.charCodeAt(0));return a.length===n?a:null;}catch{return null;}
};
const canonical=(r,fields,domain)=>{
  if(!r||typeof r!=='object'||Array.isArray(r)||Object.keys(r).length!==fields.length||fields.some(k=>r[k]===null||r[k]===undefined)||Object.keys(r).some(k=>!fields.includes(k))||fields.some(k=>!['string','number','boolean'].includes(typeof r[k])))throw Error('Exact scalar signed continuity receipt required.');
  return domain+'\n'+JSON.stringify(fields.map(k=>r[k]));
};
export const canonicalRecheck852=r=>canonical(r,DF,'ROSIE-852-ORIGINAL-DEVICE-RECHECK-V1');
export const canonicalConsumer852=r=>canonical(r,MF,'ROSIE-852-AIDATA-CONSUMER-CONTINUITY-V1');
const hash=async s=>{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return [...new Uint8Array(b)].map(v=>v.toString(16).padStart(2,'0')).join('');};
async function verify(env,receipt,signature,pin,canonicalize){
  const pub=decode(env?.[pin],32),sig=decode(signature,64);
  if(!pub||!sig)return {ok:false,reason:'Independent Ed25519 public pin and detached signature required.'};
  try{
    const msg=canonicalize(receipt),key=await crypto.subtle.importKey('raw',pub,{name:'Ed25519'},false,['verify']);
    if(!await crypto.subtle.verify('Ed25519',key,sig,new TextEncoder().encode(msg)))return {ok:false,reason:'Independent signature verification failed.'};
    return {ok:true,sha256:await hash(msg),expires_at:receipt.expires_at};
  }catch{return {ok:false,reason:'Invalid signed receipt or unavailable cryptographic verification.'};}
}
export function recallAging852(cases=[],{expectedPlatforms=[],revoked=false,now=Date.now()}={}){
  const reasons=[],seenPosts=new Set(),seenPlatforms=new Set();
  if(!Array.isArray(cases)||cases.length<1||cases.length>20||!Array.isArray(expectedPlatforms)||expectedPlatforms.length<1||expectedPlatforms.length>6||!Number.isFinite(now))return {decision:'HOLD',reasons:['INCOMPLETE_OR_INVALID_RECALL_WINDOW'],platforms:[],source_window_complete:false,external_mirrors_verified:false};
  for(const p of expectedPlatforms){if(!PLATFORMS.has(p)||seenPlatforms.has(p))reasons.push('PLATFORM_MANIFEST_INVALID');seenPlatforms.add(p);}
  if(!revoked)reasons.push('ORIGINAL_CONSENT_NOT_WITHDRAWN');
  const byPlatform=new Map([...seenPlatforms].map(p=>[p,{platform:p,cases:0,open:0,aged_24h:0,critical_72h:0,scoped:0,missing_recall:0,max_age_hours:null,priority:'NONE'}]));
  for(const c of cases){
    if(typeof c?.post_id!=='string'||!ident(c.post_id,3,100)||seenPosts.has(c.post_id)||!seenPlatforms.has(c.platform)||!Array.isArray(c.attempts)||c.attempts.length>=200){reasons.push('POST_EVIDENCE_OR_MANIFEST_CONFLICT');continue;}
    seenPosts.add(c.post_id);
    const a=byPlatform.get(c.platform);a.cases++;
    const rows=c.attempts;
    const relevant=rows.filter(x=>x?.status==='recall_required');
    if(relevant.some(x=>!Number.isFinite(ms(x.created_at))||ms(x.created_at)>now+300000))reasons.push('RECALL_TIMELINE_UNTRUSTED');
    const stamps=relevant.map(x=>ms(x.created_at)).filter(t=>Number.isFinite(t)&&t<=now+300000);
    const latest=stamps.length?Math.max(...stamps):NaN;
    const custody=recoveryCustody850(rows,{revoked,now});
    const closure=rows.filter(x=>['recall_sla_closed_scoped','recall_reclosed_verified_recovery_848'].includes(x.status)).map(x=>ms(x.created_at)).filter(Number.isFinite);
    const lastClosure=closure.length?Math.max(...closure):NaN;
    if(!Number.isFinite(latest)){a.missing_recall++;a.open++;reasons.push('RECALL_EVENT_NOT_FOUND');continue;}
    const hours=Math.max(0,(now-latest)/3600000);
    a.max_age_hours=a.max_age_hours===null?Math.round(hours*10)/10:Math.max(a.max_age_hours,Math.round(hours*10)/10);
    const scoped=custody.decision==='SCOPED_REVIEW_ONLY'&&Number.isFinite(lastClosure)&&lastClosure>=latest;
    if(scoped){a.scoped++;a.priority=a.priority==='NONE'?'MONITOR':a.priority;}
    else {a.open++;if(hours>=72){a.critical_72h++;a.priority='CRITICAL';}else if(hours>=24){a.aged_24h++;if(a.priority!=='CRITICAL')a.priority='HIGH';}else if(!['CRITICAL','HIGH'].includes(a.priority))a.priority='ELEVATED';}
  }
  for(const [platform,a] of byPlatform){if(!a.cases)reasons.push('MISSING_LOCAL_PLATFORM_SOURCE_'+platform.toUpperCase());}
  if(reasons.length)return {decision:'HOLD',reasons:[...new Set(reasons)],platforms:[...byPlatform.values()],source_window_complete:false,external_mirrors_verified:false,master_connection:'HOLD'};
  return {decision:'REVIEW_ONLY',reasons:[],platforms:[...byPlatform.values()],source_window_complete:true,recall_open:[...byPlatform.values()].reduce((n,x)=>n+x.open,0),critical_72h:[...byPlatform.values()].reduce((n,x)=>n+x.critical_72h,0),external_mirrors_verified:false,master_connection:'HOLD',all_platforms_globally_removed:false};
}
export async function validateDeviceRecheck852(env,r,signature,{bookingId,projectId,post,caseReference,priorWitnessSha256,priorWitnessNonce,priorSourceRevision,actor,now=Date.now()}={}){
  if(!sha40(env?.CF_PAGES_COMMIT_SHA)||r?.version!==1||r.kind!=='original_device_recheck_review'||r.source_id!=='rosiedazzlers'||r.source_contract!==CONTRACT_852||r.source_revision!==env.CF_PAGES_COMMIT_SHA||r.booking_id!==bookingId||r.project_id!==projectId||r.post_id!==post?.id||r.platform!==post?.platform||r.case_reference!==caseReference||!ident(caseReference,3,80))return {ok:false,reason:'Exact active source, contract and original case required.'};
  if(!ident(env?.ROSIE_ORIGINAL_DEVICE_ID_851,5,100)||r.original_device_id!==env.ROSIE_ORIGINAL_DEVICE_ID_851||!sha256(priorWitnessSha256)||r.prior_witness_sha256!==priorWitnessSha256||!nonce(priorWitnessNonce)||r.prior_witness_nonce!==priorWitnessNonce||!sha40(priorSourceRevision)||r.prior_source_revision!==priorSourceRevision)return {ok:false,reason:'Signed original-device continuity must match prior owner-audited witness.'};
  if(r.decision!=='rechecked_signed_evidence_review_only'||!nonce(r.nonce)||r.nonce===priorWitnessNonce||!ident(r.signer_id,5,120)||r.signer_id.toLowerCase()===String(actor).toLowerCase()||!fresh(r,now))return {ok:false,reason:'Independent, recent, non-authorizing device review and new nonce required.'};
  return verify(env,r,signature,'ROSIE_ORIGINAL_DEVICE_WITNESS_ED25519_PUBLIC_KEY_851',canonicalRecheck852);
}
export async function validateConsumerDecision852(env,r,signature,{bookingId,projectId,post,caseReference,priorAckSha256,priorAckNonce,priorSourceRevision,recheckSha256,recheckNonce,deviceSigner,actor,now=Date.now()}={}){
  if(!sha40(env?.CF_PAGES_COMMIT_SHA)||r?.version!==1||r.kind!=='independent_consumer_continuity_review'||r.source_id!=='rosiedazzlers'||r.source_contract!==CONTRACT_852||r.source_revision!==env.CF_PAGES_COMMIT_SHA||r.consumer_id!=='ai-data-platform'||!ident(r.receiver_id,5,120)||r.booking_id!==bookingId||r.project_id!==projectId||r.post_id!==post?.id||r.case_reference!==caseReference)return {ok:false,reason:'Original source and independent consumer decision binding required.'};
  if(!sha256(priorAckSha256)||r.prior_ack_sha256!==priorAckSha256||!nonce(priorAckNonce)||r.prior_ack_nonce!==priorAckNonce||!sha40(priorSourceRevision)||r.prior_source_revision!==priorSourceRevision||!sha256(recheckSha256)||r.device_recheck_sha256!==recheckSha256||!nonce(recheckNonce)||r.device_recheck_nonce!==recheckNonce)return {ok:false,reason:'Exact prior Master ACK and original-device recheck continuity required.'};
  if(!['hold_for_independent_transport','requires_owner_recheck','rejected_stale_evidence'].includes(r.decision)||r.permissions!=='review_only_no_consumer_grant'||!nonce(r.nonce)||[priorAckNonce,recheckNonce].includes(r.nonce)||!ident(r.signer_id,5,120)||r.signer_id.toLowerCase()===String(actor).toLowerCase()||r.signer_id===deviceSigner||!fresh(r,now))return {ok:false,reason:'Fresh, independently signed non-authorizing consumer HOLD decision required.'};
  if(!env?.ROSIE_AIDATA_CONSUMER_DECISION_ED25519_PUBLIC_KEY_852||env.ROSIE_AIDATA_CONSUMER_DECISION_ED25519_PUBLIC_KEY_852===env.ROSIE_ORIGINAL_DEVICE_WITNESS_ED25519_PUBLIC_KEY_851)return {ok:false,reason:'Independently enrolled consumer signing identity required.'};
  return verify(env,r,signature,'ROSIE_AIDATA_CONSUMER_DECISION_ED25519_PUBLIC_KEY_852',canonicalConsumer852);
}
export function continuityHold852({revocationRecorded=false,aging,deviceRecheckRecorded=false,consumerDecisionRecorded=false}={}){
  const reasons=[];
  if(!revocationRecorded)reasons.push('ORIGINAL_CONSENT_REVOCATION_RECORD_MISSING');
  if(aging?.decision!=='REVIEW_ONLY')reasons.push('CROSS_PLATFORM_AGING_REVIEW_INCOMPLETE');
  if(!deviceRecheckRecorded)reasons.push('SIGNED_DEVICE_RECHECK_NOT_RECORDED');
  if(!consumerDecisionRecorded)reasons.push('INDEPENDENT_MASTER_CONTINUITY_DECISION_NOT_RECORDED');
  return {decision:'HOLD',reasons,review_complete:reasons.length===0,master_connection:'HOLD',consumer_authorized:false,master_runtime_ack:false,durable_transport_independently_verified:false,external_mirrors_verified:false,consent_restored:false,provider_mutation_performed:false,master_events_emitted:0};
}
