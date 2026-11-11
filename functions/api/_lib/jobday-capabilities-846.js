// Build 846 — authenticated read capability, independent CDN evidence and
// source-only Master projection. No platform write capability is inferred.
import {providerSetup845,verifyAccount845} from './jobday-provider-845.js';
import {recallState848} from './jobday-recovery-848.js';
import {exceptionPriority849} from './jobday-integrity-849.js';
export const CAPABILITY_AUDIT_846='Build 846 provider read capability:';
export const CDN_STATUS_846='cdn_witness_verified_invalidation';
export const SLA_STATUS_846='recall_sla_closed_scoped';

const CDN_FIELDS_846=['version','kind','booking_id','post_id','platform','public_asset_url','edge_origin','cache_purge_operation_id','cache_purge_http_status','cache_purge_result','cache_response_sha256','observed_at','nonce','witness_id','authenticated_edge_request'];
const decode=(v,n)=>{
  if(typeof v!=='string'||!/^[A-Za-z0-9_-]+$/.test(v))return null;
  try{const base=v.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-v.length%4)%4);const a=Uint8Array.from(atob(base),c=>c.charCodeAt(0));return a.length===n?a:null;}catch{return null;}
};
export function canonicalCdn846(receipt){
  if(!receipt||typeof receipt!=='object'||Array.isArray(receipt)||Object.keys(receipt).length!==CDN_FIELDS_846.length||Object.keys(receipt).some(k=>!CDN_FIELDS_846.includes(k))||CDN_FIELDS_846.some(k=>receipt[k]===undefined||receipt[k]===null))throw Error('Exact independent CDN evidence fields are required.');
  return `ROSIE-846-CDN-V1\n${JSON.stringify(CDN_FIELDS_846.map(k=>receipt[k]))}`;
}
export async function verifyCdnWitness846(env,receipt,signature){
  const pin=decode(env?.ROSIE_SOCIAL_CDN_WITNESS_ED25519_PUBLIC_KEY,32),sig=decode(signature,64);
  if(!pin)return {ok:false,reason:'Independent CDN public-key pin is not enrolled.'};
  if(!sig)return {ok:false,reason:'Detached independent CDN Ed25519 signature is required.'};
  try{
    const key=await crypto.subtle.importKey('raw',pin,{name:'Ed25519'},false,['verify']);
    return await crypto.subtle.verify('Ed25519',key,sig,new TextEncoder().encode(canonicalCdn846(receipt)))?{ok:true,pin_id:'ROSIE_SOCIAL_CDN_WITNESS_ED25519_PUBLIC_KEY'}:{ok:false,reason:'Independent CDN witness signature is invalid.'};
  }catch{return {ok:false,reason:'Independent CDN witness verification is unavailable.'};}
}
export function validCdnReceipt846(receipt,post,bookingId,actor){
  if(receipt?.version!==1||receipt.kind!=='cdn_invalidation'||receipt.booking_id!==bookingId||receipt.post_id!==post?.id||receipt.platform!==post.platform||receipt.public_asset_url!==post.media_urls?.[0])return false;
  if(!Array.isArray(post.media_urls)||post.media_urls.length!==1||receipt.cache_purge_result!=='cdn_purge_acknowledged'||![200,204].includes(receipt.cache_purge_http_status)||receipt.authenticated_edge_request!==true)return false;
  const stamp=Date.parse(receipt.observed_at||'');
  if(!Number.isFinite(stamp)||Math.abs(Date.now()-stamp)>864e5||typeof receipt.cache_response_sha256!=='string'||!/^[0-9a-f]{64}$/.test(receipt.cache_response_sha256)||typeof receipt.nonce!=='string'||!/^[A-Za-z0-9_-]{20,100}$/.test(receipt.nonce))return false;
  if(typeof receipt.cache_purge_operation_id!=='string'||!/^[A-Za-z0-9_-]{5,120}$/.test(receipt.cache_purge_operation_id)||typeof receipt.witness_id!=='string'||!/^[A-Za-z0-9_.-]{5,120}$/.test(receipt.witness_id)||receipt.witness_id.toLowerCase()===String(actor).toLowerCase())return false;
  try{const url=new URL(receipt.public_asset_url);return url.protocol==='https:'&&url.username===''&&url.password===''&&receipt.edge_origin===url.origin&&!url.searchParams.has('access_token');}catch{return false;}
}

async function digest(body){const raw=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(body));return [...new Uint8Array(raw)].map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function verifyReadCapability846(env,platform){
  const setup=providerSetup845(env,platform);
  if(!setup.configured)return {ok:false,reason:'PROVIDER_CONFIGURATION_HOLD'};
  const account=await verifyAccount845(env,platform);
  if(!account.ok)return {ok:false,reason:account.reason};
  const kind=platform==='facebook'?'feed':'media';
  const url=`https://graph.facebook.com/${setup.apiVersion}/${encodeURIComponent(setup.account)}/${kind}?fields=id&limit=1`;
  try{
    const response=await fetch(url,{method:'GET',headers:{Authorization:`Bearer ${setup.token}`,Accept:'application/json'},redirect:'error',cache:'no-store',signal:AbortSignal.timeout(8000)});
    if(Number(response.headers.get('content-length'))>16384)return {ok:false,reason:'PROVIDER_RESPONSE_LIMIT_HOLD'};
    const body=await response.text();if(body.length>16384)return {ok:false,reason:'PROVIDER_RESPONSE_LIMIT_HOLD'};
    const data=JSON.parse(body);
    if(!response.ok||response.status!==200||!Array.isArray(data?.data)||data.data.length>1)return {ok:false,reason:'PROVIDER_CONTENT_LIST_AUTHORIZATION_HOLD'};
    return {ok:true,platform,account_id:setup.account,verified_capability:platform==='facebook'?'facebook_page_feed_read':'instagram_business_media_list_read',provider_http_status:200,response_sha256:await digest(body),authenticated_read_only:true,publish_permission_verified:false,takedown_permission_verified:false};
  }catch{return {ok:false,reason:'PROVIDER_CONTENT_LIST_NETWORK_HOLD'};}
}

export function recallPolicy846(env){
  const raw=env?.ROSIE_RECALL_SLA_TARGET_HOURS;
  if(!/^(?:[1-9]|[1-9][0-9]|1[0-5][0-9]|16[0-8])$/.test(String(raw??'')))return {configured:false,target_hours:null};
  return {configured:true,target_hours:Number(raw)};
}

// No identifiers, customer media, case notes, staff emails, event URLs, keys,
// or cross-app transport. This is a local source-owned preview only.
export function masterSocialProjection846({posts=[],attempts=[],capabilityAudits=[],now=new Date().toISOString(),revision=null,truncated=false}){
  const timestamp=Date.parse(now);
  const valid=new Set(posts.map(p=>p.id)),byPost=new Map();
  for(const a of attempts){if(!valid.has(a.social_post_id))continue;let list=byPost.get(a.social_post_id)||[];list.push(a);byPost.set(a.social_post_id,list);}
  const count={source_posts:posts.length,recall_required:0,recall_open:0,recall_closed_scoped:0,recall_critical_72h:0,recall_reopened_verified:0,recall_reopen_required:0,recall_reclosed_verified:0,multi_episode_recall:0,priority_critical:0,priority_high:0,verified_removed_witness:0,authenticated_post_read:0,cdn_witness_invalidation:0};
  for(const p of posts){const list=byPost.get(p.id)||[],recall=list.find(a=>a.status==='recall_required'),state=recallState848(list,Number.isFinite(timestamp)?timestamp:Date.now());
    if(recall){const priority=exceptionPriority849(list,Number.isFinite(timestamp)?timestamp:Date.now());if(priority.episode_count>1)count.multi_episode_recall++;if(priority.priority==='CRITICAL')count.priority_critical++;if(priority.priority==='HIGH')count.priority_high++;count.recall_required++;if(['CLOSED_SCOPED_EXTERNAL_MIRRORS_HOLD','RECLOSED_VERIFIED_RECOVERY_EXTERNAL_MIRRORS_HOLD'].includes(state.state)){count.recall_closed_scoped++;if(state.state==='RECLOSED_VERIFIED_RECOVERY_EXTERNAL_MIRRORS_HOLD')count.recall_reclosed_verified++;}else{count.recall_open++;if(state.state==='REOPENED_VERIFIED_PROVIDER_CONFLICT_HOLD')count.recall_reopened_verified++;if(state.state==='CONFLICT_REOPEN_REQUIRED')count.recall_reopen_required++;if(Number.isFinite(Date.parse(recall.created_at))&&Number.isFinite(timestamp)&&timestamp-Date.parse(recall.created_at)>=72*3600e3)count.recall_critical_72h++;}}
    if(list.some(a=>a.status==='provider_witness_verified_removed'))count.verified_removed_witness++;
    if(list.some(a=>a.status==='provider_api_authenticated_post_visible'))count.authenticated_post_read++;
    if(list.some(a=>a.status===CDN_STATUS_846))count.cdn_witness_invalidation++;
  }
  return {contract:'rosie.ai-data.social-evidence.preview.v846',sourceId:'rosiedazzlers',shellId:'rosiedazzlers',role:'owned_business_shell',generatedAt:now,revision_claim:revision||null,sourceWindowTruncated:Boolean(truncated),sourceWindowComplete:!truncated,counts:count,provider_capability_reviews:capabilityAudits.length,completionPercent:null,readinessState:'UNKNOWN',approvedAudience:[],consumerPayloadEligible:false,signedEnvelope:null,externalConnection:'HOLD',ownerAcceptance:'HOLD',evidenceURI:null,expiresAt:null,customerDataIncluded:false,serverOnly:true};
}
