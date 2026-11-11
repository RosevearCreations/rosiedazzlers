// Build 849 — append-only multiple recall episodes and independent Master ACK preflight.
// A signed schema preflight NEVER implies a runtime consumer ACK or CONNECTED state.
import {recallState848,RECLOSE_848,verifiedLive848} from './jobday-recovery-848.js';
import {REOPEN_STATUS_847} from './jobday-pilot-847.js';
export const ACK_PREFLIGHT_AUDIT_849='Build 849 independent Master runtime ACK preflight:';
export const MASTER_CONTRACT_849='rosie.ai-data.social-evidence.preview.v849';
const ts=v=>{const n=Date.parse(v||'');return Number.isFinite(n)?n:NaN;};
const latest=(rows,p)=>rows.filter(p).sort((a,b)=>ts(b.created_at)-ts(a.created_at))[0]||null;
const known=(a,n)=>typeof a==='string'&&a.length>=n&&a.length<=120&&/^[A-Za-z0-9_.@-]+$/.test(a);
const hex=v=>typeof v==='string'&&/^[0-9a-f]{64}$/.test(v);
const decode=(s,n)=>{if(typeof s!=='string'||!/^[A-Za-z0-9_-]+$/.test(s))return null;try{const b=s.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-s.length%4)%4);const x=Uint8Array.from(atob(b),c=>c.charCodeAt(0));return x.length===n?x:null;}catch{return null;}};
const sha=async str=>{const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(str));return [...new Uint8Array(bytes)].map(x=>x.toString(16).padStart(2,'0')).join('');};
export function episodeIntegrity849(rows=[],now=Date.now()){
  const safe=rows.filter(a=>Number.isFinite(ts(a.created_at))&&ts(a.created_at)<=now+300000);
  const reopen=safe.filter(a=>a.status===REOPEN_STATUS_847).sort((a,b)=>ts(a.created_at)-ts(b.created_at));
  const closures=safe.filter(a=>['recall_sla_closed_scoped',RECLOSE_848].includes(a.status));
  const ids=new Map(safe.map(a=>[a.id,a])),used=new Set();
  const gaps=[];
  for(const [i,r] of reopen.entries()){
    const prevId=r.request_summary?.previous_scoped_closure_id||r.request_summary?.original_closure_id;
    const conflictId=r.request_summary?.conflicting_provider_live_receipt_id;
    const closure=ids.get(prevId),live=ids.get(conflictId);
    // Historical v847 rows created without receipt references are retained
    // as legacy episodes, but cannot be used to certify new episode chains.
    if(!closure||!closures.includes(closure)||!live||!verifiedLive848(live)||ts(closure.created_at)>=ts(live.created_at)||ts(live.created_at)>=ts(r.created_at))gaps.push('EPISODE_'+(i+1)+'_CHAIN_REVIEW_HOLD');
    if(used.has(prevId)||used.has(conflictId))gaps.push('EPISODE_'+(i+1)+'_REPLAY_REVIEW_HOLD');
    used.add(prevId);used.add(conflictId);
  }
  for(const [i,c] of closures.filter(a=>a.status===RECLOSE_848).entries()){
    const linked=ids.get(c.request_summary?.reopen_id),provider=ids.get(c.request_summary?.provider_removal_receipt_id),cdn=ids.get(c.request_summary?.cdn_witness_receipt_id);
    if(!linked||linked.status!==REOPEN_STATUS_847||!provider||provider.status!=='provider_witness_verified_removed'||provider.response_summary?.independent_witness_signature_valid!==true||!cdn||cdn.status!=='cdn_witness_verified_invalidation'||cdn.response_summary?.independent_witness_signature_valid!==true||!(ts(linked.created_at)<ts(provider.created_at)&&ts(provider.created_at)<=ts(c.created_at)&&ts(linked.created_at)<ts(cdn.created_at)&&ts(cdn.created_at)<=ts(c.created_at)))gaps.push('RECLOSURE_'+(i+1)+'_LINK_REVIEW_HOLD');
  }
  const current=recallState848(safe,now);
  const latestClosure=latest(closures,()=>true),latestReopen=latest(reopen,()=>true);
  const uniqueReopenCount=reopen.length;
  return {state:current.state,closure:current.closure,conflict:current.conflict,reopen:current.reopen,latestClosure,latestReopen,episode_count:uniqueReopenCount,integrity_gaps:[...new Set(gaps)],historical_linkage_verified:gaps.length===0};
}
export function exceptionPriority849(rows=[],now=Date.now()){
  const safe=rows.filter(a=>Number.isFinite(ts(a.created_at))&&ts(a.created_at)<=now+300000);
  const recall=latest(safe,a=>a.status==='recall_required'),state=episodeIntegrity849(safe,now);
  const age=recall?Math.max(0,now-ts(recall.created_at))/3600000:null;
  let priority='NONE',reason='NO_RECALL';
  if(recall){
    if(state.state==='CONFLICT_REOPEN_REQUIRED'){priority='CRITICAL';reason='VERIFIED_LIVE_AFTER_CLOSURE';}
    else if(state.integrity_gaps.length){priority='CRITICAL';reason='EPISODE_CHAIN_INCOMPLETE';}
    else if(state.state==='REOPENED_VERIFIED_PROVIDER_CONFLICT_HOLD'){priority=state.episode_count>1||age>=72?'CRITICAL':'HIGH';reason=state.episode_count>1?'REPEATED_PROVIDER_REOPEN_HOLD':'REOPENED_PROVIDER_CDN_RECOVERY_HOLD';}
    else if(state.state==='RECALL_OPEN_HOLD'){priority=age>=72?'CRITICAL':age>=24?'HIGH':'ELEVATED';reason='RECALL_AGING';}
    else {priority='MONITOR';reason='SCOPED_CLOSED_EXTERNAL_MIRRORS_UNVERIFIED';}
  }
  return {priority,reason,recall_age_hours:age===null?null:Math.round(age*10)/10,episode_count:state.episode_count,recall_state:state.state,integrity_gaps:state.integrity_gaps,external_mirrors_verified:false,source_history_bounded:true};
}
const ACK_FIELDS=['version','kind','source_id','source_contract','source_revision','consumer_id','receiver_id','decision','permissions','schema_digest_sha256','master_case_reference','nonce','issued_at','observed_at','expires_at','signer_id','runtime_acknowledged','consumer_authorized'];
export const ACK_SCHEMA_849='ROSIE-849-COUNTS-ONLY-SCHEMA-V1|source=rosiedazzlers|contract='+MASTER_CONTRACT_849+'|counts=source_posts,recall_required,recall_open,recall_closed_scoped,recall_critical_72h,recall_reopened_verified,recall_reopen_required,recall_reclosed_verified,multi_episode_recall,priority_critical,priority_high,verified_removed_witness,authenticated_post_read,cdn_witness_invalidation|private-only|no-customer-identifiers|no-events';
export const schemaDigest849=()=>sha(ACK_SCHEMA_849);
export function canonicalAckPreflight849(r){
  if(!r||typeof r!=='object'||Array.isArray(r)||Object.keys(r).length!==ACK_FIELDS.length||ACK_FIELDS.some(k=>r[k]===undefined||r[k]===null)||Object.keys(r).some(k=>!ACK_FIELDS.includes(k)))throw Error('Exact Master ACK preflight receipt field set required.');
  return 'ROSIE-849-AIDATA-PREFLIGHT-V1\n'+JSON.stringify(ACK_FIELDS.map(k=>r[k]));
}
export async function validateAckPreflight849(env,r,signature,{actor,ownerCase,now=Date.now()}={}){
  const pub=decode(env?.ROSIE_AIDATA_SOCIAL_ACK_PREFLIGHT_ED25519_PUBLIC_KEY,32),sig=decode(signature,64);
  if(!pub)return {ok:false,reason:'Independent Master ACK-preflight public pin is not enrolled.'};
  if(!sig)return {ok:false,reason:'Detached independent Master ACK-preflight signature required.'};
  const issued=ts(r?.issued_at),observed=ts(r?.observed_at),expires=ts(r?.expires_at),revision=env?.CF_PAGES_COMMIT_SHA;
  if(r?.version!==1||r.kind!=='runtime_ack_preflight_review'||r.source_id!=='rosiedazzlers'||r.source_contract!==MASTER_CONTRACT_849||r.source_revision!==revision||!/^[0-9a-f]{40}$/.test(revision||'')||r.consumer_id!=='ai-data-platform'||!known(r.receiver_id,5)||r.decision!=='schema_preflight_compatible_hold'||r.permissions!=='review_only_no_consumer_grant'||r.runtime_acknowledged!==false||r.consumer_authorized!==false||r.master_case_reference!==ownerCase)return {ok:false,reason:'Original source revision, non-authorizing preflight decision and named independent consumer must match.'};
  if(!hex(r.schema_digest_sha256)||r.schema_digest_sha256!==await schemaDigest849())return {ok:false,reason:'Independent preflight schema digest is not the exact v849 safe source contract.'};
  if(!Number.isFinite(issued)||!Number.isFinite(observed)||!Number.isFinite(expires)||issued>now+300000||observed>now+300000||now-issued>600000||now-observed>600000||observed<issued-300000||observed>expires||expires<=now||expires-issued>1200000||expires<=issued)return {ok:false,reason:'Master preflight observation is stale, future-dated or expired.'};
  if(!known(r.signer_id,5)||r.signer_id.toLowerCase()===String(actor).toLowerCase()||typeof r.nonce!=='string'||!/^[A-Za-z0-9_-]{20,100}$/.test(r.nonce)||!/^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$/.test(ownerCase||''))return {ok:false,reason:'Distinct verifier, safe original case and replay-resistant nonce required.'};
  try{
    const bytes=new TextEncoder().encode(canonicalAckPreflight849(r)),key=await crypto.subtle.importKey('raw',pub,{name:'Ed25519'},false,['verify']);
    if(!await crypto.subtle.verify('Ed25519',key,sig,bytes))return {ok:false,reason:'Master ACK-preflight signature verification failed.'};
    return {ok:true,canonical_sha256:await sha(canonicalAckPreflight849(r)),schema_digest_sha256:r.schema_digest_sha256,expires_at:r.expires_at};
  }catch{return {ok:false,reason:'Independent Master cryptographic verifier unavailable.'};}
}
