// Build 851 — signed original-device review and signed Master ACK correlation.
// Source-only: no provider writes, external transport, consumer grant or CONNECTED.
import {MASTER_CONTRACT_850} from './jobday-custody-850.js';
export const CONTRACT_851='rosie.ai-data.social-recall.correlation.v851';
export const DEVICE_AUDIT_851='Build 851 original device witness review:';
export const RECEIVER_AUDIT_851='Build 851 signed receiver ACK correlation review:';
export const CLOSURE_AUDIT_851='Build 851 consent-safe scoped exception review:';
const WF=['version','kind','source_id','source_contract','source_revision','booking_id','project_id','post_id','platform','original_device_id','provider_receipt_id','cdn_receipt_id','closure_receipt_id','consent','scope','case_reference','nonce','issued_at','observed_at','expires_at','signer_id'];
const AF=['version','kind','source_id','source_contract','source_revision','consumer_id','receiver_id','booking_id','project_id','post_id','case_reference','witness_sha256','witness_nonce','durable_ack_reference','durable_replay_digest_sha256','decision','permissions','nonce','issued_at','observed_at','expires_at','signer_id'];
const timestamp=v=>typeof v==='string'?Date.parse(v):NaN;
const ident=(v,min=3,max=100)=>typeof v==='string'&&v.length>=min&&v.length<=max&&/^[A-Za-z0-9_.@-]+$/.test(v);
const nonce=v=>typeof v==='string'&&/^[A-Za-z0-9_-]{20,100}$/.test(v);
const digest=v=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v);
const sha40=v=>typeof v==='string'&&/^[0-9a-f]{40}$/.test(v);
const decode=(v,n)=>{
  if(typeof v!=='string'||!/^[A-Za-z0-9_-]+$/.test(v))return null;
  try{const base=v.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-v.length%4)%4);const out=Uint8Array.from(atob(base),c=>c.charCodeAt(0));return out.length===n?out:null;}catch{return null;}
};
const canonical=(r,fields,prefix)=>{
  if(!r||typeof r!=='object'||Array.isArray(r)||Object.keys(r).length!==fields.length||fields.some(f=>r[f]===undefined||r[f]===null)||Object.keys(r).some(f=>!fields.includes(f))||fields.some(f=>typeof r[f]==='object'||typeof r[f]==='function'))throw Error('Exact scalar Build 851 receipt field set required.');
  return prefix+'\n'+JSON.stringify(fields.map(f=>r[f]));
};
export const canonicalDeviceWitness851=r=>canonical(r,WF,'ROSIE-851-ORIGINAL-DEVICE-WITNESS-V1');
export const canonicalReceiverAck851=r=>canonical(r,AF,'ROSIE-851-AIDATA-RECEIVER-ACK-V1');
const hash=async message=>{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(message));return [...new Uint8Array(b)].map(v=>v.toString(16).padStart(2,'0')).join('');};
const timeValid=(r,now)=>{
  const i=timestamp(r?.issued_at),o=timestamp(r?.observed_at),e=timestamp(r?.expires_at);
  return [i,o,e].every(Number.isFinite)&&i<=now+300000&&o<=now+300000&&now-i<=600000&&now-o<=600000&&o>=i-300000&&o<=e&&e>now&&e>i&&e-i<=900000;
};
async function verifySignature(env,r,signature,pinName,canonicalize){
  const pub=decode(env?.[pinName],32),sig=decode(signature,64);
  if(!pub)return {ok:false,reason:'Independent Ed25519 verifier pin not enrolled.'};
  if(!sig)return {ok:false,reason:'Detached independent Ed25519 signature required.'};
  try{const msg=canonicalize(r),key=await crypto.subtle.importKey('raw',pub,{name:'Ed25519'},false,['verify']);
    if(!await crypto.subtle.verify('Ed25519',key,sig,new TextEncoder().encode(msg)))return {ok:false,reason:'Detached signature failed independent verification.'};
    return {ok:true,sha256:await hash(msg),expires_at:r.expires_at};
  }catch{return {ok:false,reason:'Independent cryptographic verification unavailable or malformed receipt.'};}
}
export async function validateDeviceWitness851(env,r,signature,{bookingId,projectId,post,caseReference,custody,actor,now=Date.now()}={}){
  if(!sha40(env?.CF_PAGES_COMMIT_SHA)||r?.version!==1||r.kind!=='original_device_recovery_witness'||r.source_id!=='rosiedazzlers'||r.source_contract!==MASTER_CONTRACT_850||r.source_revision!==env.CF_PAGES_COMMIT_SHA||r.booking_id!==bookingId||r.project_id!==projectId||r.post_id!==post?.id||r.platform!==post?.platform||!ident(env?.ROSIE_ORIGINAL_DEVICE_ID_851,5,100)||r.original_device_id!==env.ROSIE_ORIGINAL_DEVICE_ID_851)return {ok:false,reason:'Exact deployed revision, original-device enrollment, contract and case binding required.'};
  if(custody?.decision!=='SCOPED_REVIEW_ONLY'||!custody.receipt_ids?.provider||!custody.receipt_ids?.cdn||!custody.receipt_ids?.closure||r.provider_receipt_id!==custody.receipt_ids.provider||r.cdn_receipt_id!==custody.receipt_ids.cdn||r.closure_receipt_id!==custody.receipt_ids.closure)return {ok:false,reason:'Original provider, CDN and closure evidence must be fully sourced and scoped.'};
  if(r.consent!=='revoked'||r.scope!=='provider_cdn_only_external_mirrors_hold'||r.case_reference!==caseReference||!ident(caseReference,3,80)||!ident(r.signer_id,5,120)||r.signer_id.toLowerCase()===String(actor).toLowerCase()||!nonce(r.nonce)||!timeValid(r,now))return {ok:false,reason:'Independent original-device signer, revoked consent, scope, nonce and freshness required.'};
  return verifySignature(env,r,signature,'ROSIE_ORIGINAL_DEVICE_WITNESS_ED25519_PUBLIC_KEY_851',canonicalDeviceWitness851);
}
export async function validateReceiverAck851(env,r,signature,{bookingId,projectId,post,caseReference,witnessSha256,witnessNonce,actor,now=Date.now()}={}){
  if(!env?.ROSIE_ORIGINAL_DEVICE_WITNESS_ED25519_PUBLIC_KEY_851||env.ROSIE_ORIGINAL_DEVICE_WITNESS_ED25519_PUBLIC_KEY_851===env?.ROSIE_AIDATA_RECEIVER_ACK_ED25519_PUBLIC_KEY_851)return {ok:false,reason:'Independent device and Master receiver signing identities must be different.'};
  if(!sha40(env?.CF_PAGES_COMMIT_SHA)||r?.version!==1||r.kind!=='durable_master_receiver_ack_review'||r.source_id!=='rosiedazzlers'||r.source_contract!==CONTRACT_851||r.source_revision!==env.CF_PAGES_COMMIT_SHA||r.consumer_id!=='ai-data-platform'||!ident(r.receiver_id,5,120)||r.booking_id!==bookingId||r.project_id!==projectId||r.post_id!==post?.id||r.case_reference!==caseReference)return {ok:false,reason:'Exact revision, Master audience, receiver and original case required.'};
  if(!digest(witnessSha256)||r.witness_sha256!==witnessSha256||!nonce(witnessNonce)||r.witness_nonce!==witnessNonce||!ident(r.durable_ack_reference,8,120)||!digest(r.durable_replay_digest_sha256)||r.decision!=='signed_receiver_evidence_review_only'||r.permissions!=='review_only_no_runtime_grant'||!nonce(r.nonce)||r.nonce===witnessNonce||!ident(r.signer_id,5,120)||r.signer_id.toLowerCase()===String(actor).toLowerCase()||!timeValid(r,now))return {ok:false,reason:'Exact signed witness correlation, safe ACK, nonce and fresh non-authorizing decision required.'};
  // Signed browser-delivered receipt is not independent proof of live transport or durable replay.
  return verifySignature(env,r,signature,'ROSIE_AIDATA_RECEIVER_ACK_ED25519_PUBLIC_KEY_851',canonicalReceiverAck851);
}
export function consentSafeReview851({revoked=false,revocationRecorded=false,custody,witnessRecorded=false,ackRecorded=false,caseBound=false}={}){
  const reasons=[];
  if(!revoked||!revocationRecorded)reasons.push('RECORDED_ORIGINAL_CONSENT_WITHDRAWAL_REQUIRED');
  if(custody?.decision!=='SCOPED_REVIEW_ONLY')reasons.push('SCOPED_PROVIDER_CDN_EVIDENCE_HOLD');
  if(!witnessRecorded)reasons.push('ORIGINAL_DEVICE_WITNESS_REVIEW_MISSING');
  if(!ackRecorded||!caseBound)reasons.push('INDEPENDENT_MASTER_ACK_CORRELATION_MISSING');
  return {decision:reasons.length?'HOLD':'SCOPED_REVIEW_ONLY',reasons,external_mirrors_verified:false,provider_mutation_performed:false,master_events_emitted:0,master_runtime_ack:false,master_connection:'HOLD',consumer_authorized:false,consent_restored:false};
}
