// Build 845 — fixed-origin, read-only Meta Graph adapter. Never mutate posts,
// accept browser credentials, follow provider redirects, or equate 404 with recall.
export const PROVIDERS_845=['facebook','instagram'];
export const PROVIDER_AUDIT_845='Build 845 real provider adapter enrollment:';
export const DEVICE_PILOT_845='Build 845 device pilot owner decision:';
export const RECALL_ESCALATION_845='recall_escalation_open';

const id=v=>typeof v==='string'&&/^[A-Za-z0-9_]{1,100}$/.test(v);
const version=v=>typeof v==='string'&&/^v\d{1,2}\.\d$/.test(v);
const knownText=v=>typeof v==='string'&&v.length<=500&&v.length>0;
export function providerSetup845(env,platform){
  if(!PROVIDERS_845.includes(platform))return {supported:false,configured:false};
  const account=platform==='facebook'?(env?.FACEBOOK_PAGE_ID||env?.META_FACEBOOK_PAGE_ID):(env?.INSTAGRAM_BUSINESS_ACCOUNT_ID||env?.INSTAGRAM_IG_USER_ID||env?.META_INSTAGRAM_BUSINESS_ACCOUNT_ID);
  const token=platform==='facebook'?(env?.FACEBOOK_PAGE_ACCESS_TOKEN||env?.META_PAGE_ACCESS_TOKEN):(env?.INSTAGRAM_ACCESS_TOKEN||env?.META_PAGE_ACCESS_TOKEN||env?.FACEBOOK_PAGE_ACCESS_TOKEN);
  const apiVersion=env?.META_GRAPH_VERSION;
  const configured=id(account)&&knownText(token)&&version(apiVersion);
  return {supported:true,configured:Boolean(configured),account:configured?account:null,apiVersion:version(apiVersion)?apiVersion:null,has_account:id(account),has_token:knownText(token),has_version:version(apiVersion),token:configured?token:null};
}

const apiId=v=>typeof v==='string'&&/^[A-Za-z0-9_]{1,150}$/.test(v);
const digest=async bytes=>{
  const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(bytes));
  return [...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
};
async function graphRead845({setup,objectId,fields}){
  if(!setup.configured||!apiId(objectId))return {ok:false,reason:'PROVIDER_ADAPTER_CONFIGURATION_HOLD'};
  const url=`https://graph.facebook.com/${setup.apiVersion}/${encodeURIComponent(objectId)}?fields=${encodeURIComponent(fields)}`;
  try{
    const response=await fetch(url,{method:'GET',headers:{Authorization:`Bearer ${setup.token}`,Accept:'application/json'},redirect:'error',cache:'no-store',signal:AbortSignal.timeout(8000)});
    // Bound provider payload size, keep it private, and never echo Graph errors.
    if(Number(response.headers.get('content-length'))>16384)return {ok:false,reason:'PROVIDER_RESPONSE_LIMIT_HOLD'};
    const body=await response.text();
    if(body.length>16384)return {ok:false,reason:'PROVIDER_RESPONSE_LIMIT_HOLD'};
    const payload=JSON.parse(body);
    if(response.status!==200||!response.ok)return {ok:false,reason:'PROVIDER_AUTHENTICATED_RESPONSE_HOLD',http_status:response.status};
    return {ok:true,payload,http_status:200,response_sha256:await digest(body)};
  }catch{return {ok:false,reason:'PROVIDER_NETWORK_OR_RESPONSE_HOLD'};}
}

export async function verifyAccount845(env,platform){
  const setup=providerSetup845(env,platform);
  if(!setup.configured)return {ok:false,reason:'PROVIDER_ADAPTER_CONFIGURATION_HOLD'};
  const checked=await graphRead845({setup,objectId:setup.account,fields:'id'});
  if(!checked.ok)return checked;
  if(String(checked.payload?.id)!==setup.account)return {ok:false,reason:'PROVIDER_ACCOUNT_ID_MISMATCH_HOLD'};
  return {ok:true,platform,account_id:setup.account,provider_http_status:200,response_sha256:checked.response_sha256,provider_access_authenticated:true,read_only:true};
}

export async function verifyLivePost845(env,post){
  const setup=providerSetup845(env,post?.platform);
  if(!setup.configured||!apiId(post?.external_post_id))return {ok:false,reason:'PROVIDER_POST_ID_OR_CONFIGURATION_HOLD'};
  const fields=post.platform==='facebook'?'id,permalink_url':'id,permalink';
  const checked=await graphRead845({setup,objectId:post.external_post_id,fields});
  if(!checked.ok)return checked;
  const permalink=post.platform==='facebook'?checked.payload?.permalink_url:checked.payload?.permalink;
  if(String(checked.payload?.id)!==post.external_post_id||!permalink||typeof permalink!=='string')return {ok:false,reason:'PROVIDER_POST_BINDING_HOLD'};
  // Provider URL can be a canonical redirect variant; require a trusted
  // platform host but do not claim the owner-recorded URL is identical.
  const host=(()=>{try{return new URL(permalink).hostname.toLowerCase();}catch{return '';}})();
  const allowed=post.platform==='facebook'?['facebook.com','www.facebook.com','m.facebook.com']:['instagram.com','www.instagram.com'];
  if(!allowed.includes(host)||!permalink.startsWith('https://'))return {ok:false,reason:'PROVIDER_PERMALINK_HOST_MISMATCH_HOLD'};
  return {ok:true,platform:post.platform,external_post_id:post.external_post_id,provider_permalink:permalink.slice(0,900),provider_http_status:200,response_sha256:checked.response_sha256,authenticated_provider_read:true,provider_native_signature:false,post_mutated:false};
}

export function ageLevel845(date,now=Date.now()){
  const t=Date.parse(date||'');if(!Number.isFinite(t))return 'UNKNOWN_TIME';
  const age=now-t;
  return age>=72*3600e3?'CRITICAL_72H':age>=24*3600e3?'ESCALATED_24H':'OPEN_UNDER_24H';
}
