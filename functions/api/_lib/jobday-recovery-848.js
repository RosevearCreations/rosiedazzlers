// Build 848: append-only recall recovery state and independently signed
// freshness review. No external-provider mutation or Master transport.
import {recallState847,REOPEN_STATUS_847} from './jobday-pilot-847.js';
export const RECLOSE_848='recall_reclosed_verified_recovery_848';
export const FRESHNESS_AUDIT_848='Build 848 independent AI Data freshness review:';
export const MASTER_CONTRACT_848='rosie.ai-data.social-evidence.preview.v848';
const millis=v=>{const n=Date.parse(v||'');return Number.isFinite(n)?n:NaN;};
const newest=(rows,pred)=>rows.filter(pred).sort((a,b)=>millis(b.created_at)-millis(a.created_at))[0]||null;
export const verifiedLive848=a=>a?.status==='provider_api_authenticated_post_visible'&&a.response_summary?.authenticated_provider_read===true&&a.response_summary?.provider_http_status===200||a?.status==='provider_witness_verified_live'&&a.response_summary?.independent_witness_signature_valid===true&&a.response_summary?.provider_result==='provider_post_found'&&a.response_summary?.provider_http_status===200;
const verifiedRemoval=a=>a?.status==='provider_witness_verified_removed'&&a.response_summary?.independent_witness_signature_valid===true&&a.response_summary?.provider_result==='provider_delete_acknowledged'&&[200,204].includes(a.response_summary?.provider_http_status);
const verifiedCdn=a=>a?.status==='cdn_witness_verified_invalidation'&&a.response_summary?.independent_witness_signature_valid===true&&a.response_summary?.cache_purge_result==='cdn_purge_acknowledged'&&[200,204].includes(a.response_summary?.cache_purge_http_status);
const validRows=(rows,now)=>rows.filter(a=>Number.isFinite(millis(a.created_at))&&millis(a.created_at)<=now+300000);
export function recallState848(rows=[],now=Date.now()){
  const safe=validRows(rows,now),closure=newest(safe,a=>a.status==='recall_sla_closed_scoped'||a.status===RECLOSE_848);
  if(!closure)return recallState847(safe,now);
  const reopen=newest(safe,a=>a.status===REOPEN_STATUS_847),live=newest(safe,verifiedLive848);
  const t=millis(closure.created_at);
  if(reopen&&millis(reopen.created_at)>t)return {state:'REOPENED_VERIFIED_PROVIDER_CONFLICT_HOLD',closure,conflict:live&&millis(live.created_at)>t?live:null,reopen};
  if(live&&millis(live.created_at)>t)return {state:'CONFLICT_REOPEN_REQUIRED',closure,conflict:live,reopen:null};
  if(closure.status===RECLOSE_848)return {state:'RECLOSED_VERIFIED_RECOVERY_EXTERNAL_MIRRORS_HOLD',closure,conflict:null,reopen:null};
  return recallState847(safe,now);
}
export function recoveryEvidence848(rows=[],post,revoked=false,now=Date.now()){
  const safe=validRows(rows,now),state=recallState848(safe,now);
  const reopen=newest(safe,a=>a.status===REOPEN_STATUS_847);
  const reopenAt=millis(reopen?.created_at);
  const fresh=a=>Number.isFinite(reopenAt)&&millis(a.created_at)>reopenAt&&millis(a.created_at)<=now+300000&&now-millis(a.created_at)<=86400000;
  const provider=newest(safe,a=>verifiedRemoval(a)&&fresh(a)&&a.response_summary?.external_post_id===post?.external_post_id&&a.response_summary?.external_post_url===post?.external_post_url&&millis(a.response_summary?.observed_at)>reopenAt&&millis(a.response_summary?.observed_at)<=now+300000);
  const cdn=newest(safe,a=>verifiedCdn(a)&&fresh(a)&&a.response_summary?.public_asset_url===post?.media_urls?.[0]&&millis(a.response_summary?.observed_at)>reopenAt&&millis(a.response_summary?.observed_at)<=now+300000);
  const priorOrigin=newest(safe,a=>a.status==='public_derivative_r2_deleted'&&a.response_summary?.r2_head_after_delete==='absent'&&a.response_summary?.photo_studio_status==='archived'&&typeof a.response_summary?.r2_key==='string');
  const live=newest(safe,verifiedLive848);
  const gaps=[...(revoked?[]:['CONSENT_WITHDRAWAL_HOLD']),...(state.state==='REOPENED_VERIFIED_PROVIDER_CONFLICT_HOLD'?[]:['REOPENED_CASE_HOLD']),...(!provider?['FRESH_SIGNED_PROVIDER_REMOVAL_HOLD']:[]),...(!cdn?['FRESH_SIGNED_CDN_ACK_HOLD']:[]),...(!priorOrigin?['ORIGINAL_R2_DELETION_PROVENANCE_HOLD']:[]),...(live&&(!provider||millis(live.created_at)>=millis(provider.created_at))?['LATER_PROVIDER_LIVE_CONFLICT_HOLD']:[])];
  return {state,provider,cdn,priorOrigin,reopen,gaps,ready:gaps.length===0};
}
const FIELDS=['version','kind','source_id','shell_id','source_contract','source_revision','consumer_id','decision','permissions','booking_id','project_id','master_case_reference','nonce','issued_at','observed_at','expires_at','signer_id'];
const decode=(v,n)=>{if(typeof v!=='string'||!/^[A-Za-z0-9_-]+$/.test(v))return null;try{const b=v.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-v.length%4)%4);const a=Uint8Array.from(atob(b),c=>c.charCodeAt(0));return a.length===n?a:null;}catch{return null;}};
export function canonicalFresh848(r){
  if(!r||typeof r!=='object'||Array.isArray(r)||Object.keys(r).length!==FIELDS.length||FIELDS.some(k=>r[k]===null||r[k]===undefined)||Object.keys(r).some(k=>!FIELDS.includes(k)))throw Error('Exact independent AI Data freshness fields required.');
  return 'ROSIE-848-AIDATA-FRESHNESS-V1\n'+JSON.stringify(FIELDS.map(k=>r[k]));
}
export async function validateFresh848(env,r,signature,{bookingId,projectId,actor,now=Date.now()}={}){
  const pin=decode(env?.ROSIE_AIDATA_SOCIAL_CONTRACT_ED25519_PUBLIC_KEY,32),sig=decode(signature,64);
  if(!pin)return {ok:false,reason:'Independent AI Data public-key pin not enrolled.'};
  if(!sig)return {ok:false,reason:'Detached Ed25519 Master freshness signature required.'};
  const issued=millis(r?.issued_at),observed=millis(r?.observed_at),expires=millis(r?.expires_at),revision=env?.CF_PAGES_COMMIT_SHA;
  if(r?.version!==1||r.kind!=='source_contract_freshness_review'||r.source_id!=='rosiedazzlers'||r.shell_id!=='rosiedazzlers'||r.source_contract!==MASTER_CONTRACT_848||r.source_revision!==revision||!/^[0-9a-f]{40}$/.test(revision||'')||r.consumer_id!=='ai-data-platform'||r.decision!=='freshness_reviewed_no_runtime_ack'||r.permissions!=='read_redacted_counts_only_no_event'||r.booking_id!==bookingId||r.project_id!==projectId)return {ok:false,reason:'Exact deployed Rosie revision, source, contract and original booking must match.'};
  if(!Number.isFinite(issued)||!Number.isFinite(observed)||!Number.isFinite(expires)||issued>now+300000||observed>now+300000||now-issued>900000||now-observed>900000||observed<issued-300000||observed>expires||expires<=now||expires-issued>1800000||expires<=issued)return {ok:false,reason:'Master observation or receipt is stale, future-dated or expired.'};
  if(typeof r.nonce!=='string'||!/^[A-Za-z0-9_-]{20,100}$/.test(r.nonce)||typeof r.master_case_reference!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$/.test(r.master_case_reference)||typeof r.signer_id!=='string'||!/^[A-Za-z0-9_.@-]{5,120}$/.test(r.signer_id)||r.signer_id.toLowerCase()===String(actor).toLowerCase())return {ok:false,reason:'Independent signer, nonce and safe case reference required.'};
  try{const msg=new TextEncoder().encode(canonicalFresh848(r)),key=await crypto.subtle.importKey('raw',pin,{name:'Ed25519'},false,['verify']);if(!await crypto.subtle.verify('Ed25519',key,sig,msg))return {ok:false,reason:'Independent Master freshness signature failed.'};const hash=await crypto.subtle.digest('SHA-256',msg);return {ok:true,sha256:[...new Uint8Array(hash)].map(v=>v.toString(16).padStart(2,'0')).join(''),expires_at:r.expires_at};}catch{return {ok:false,reason:'Independent Master freshness verification unavailable.'};}
}
