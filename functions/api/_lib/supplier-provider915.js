// Rosie 915 — live provider-owned publication READBACK ONLY.
// No browser-supplied URL, credentials, raw DAIP media, or provider mutation.
const ID=/^[A-Za-z0-9_-]{6,100}$/;
const M_ID=/^[0-9]{6,32}(?:_[0-9]{6,32})?$/;
const API_VERSION=/^v[0-9]{1,2}\.[0-9]$/;
const hostAllowed=(raw,channel)=>{
 try{const u=new URL(raw);const hosts=channel==='youtube'?['youtube.com','www.youtube.com','youtu.be']:channel==='instagram'?['www.instagram.com','instagram.com']:['www.facebook.com','facebook.com','m.facebook.com'];return u.protocol==='https:'&&hosts.includes(u.hostname.toLowerCase())&&!u.username&&!u.password&&!u.searchParams.has('access_token');}catch{return false}
};
const safe=async(res)=>{
 if(!res.ok||Number(res.headers.get('content-length')||0)>16384)return null;
 const body=await res.text();if(body.length>16384)return null;
 try{return JSON.parse(body);}catch{return null;}
};
async function readJson(url,token,fetcher){
 const res=await fetcher(url,{method:'GET',headers:{Authorization:'Bearer '+token,Accept:'application/json'},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(8000)});
 return safe(res);
}
function graphConfig(env,channel){
 const owner=channel==='facebook'?(env.FACEBOOK_PAGE_ID||env.META_FACEBOOK_PAGE_ID):(env.INSTAGRAM_BUSINESS_ACCOUNT_ID||env.INSTAGRAM_IG_USER_ID||env.META_INSTAGRAM_BUSINESS_ACCOUNT_ID);
 const token=channel==='facebook'?(env.FACEBOOK_PAGE_ACCESS_TOKEN||env.META_PAGE_ACCESS_TOKEN):(env.INSTAGRAM_ACCESS_TOKEN||env.META_PAGE_ACCESS_TOKEN);
 const version=env.META_GRAPH_VERSION;
 return {owner,token,version,valid:M_ID.test(String(owner||''))&&String(token||'').length>12&&API_VERSION.test(String(version||''))};
}
export async function readOriginalProvider915(env,channel,externalId,fetcher=fetch){
 const stop=(reason)=>({ok:false,reason});
 try{
  if(channel==='youtube'){
   const token=env?.YOUTUBE_OAUTH_ACCESS_TOKEN,owner=env?.YOUTUBE_CHANNEL_ID;
   if(!token||!/^UC[A-Za-z0-9_-]{20,30}$/.test(String(owner||''))||!/^[A-Za-z0-9_-]{11}$/.test(String(externalId||'')))return stop('YOUTUBE_OWNER_OAUTH_NOT_ENROLLED');
   const c=await readJson('https://www.googleapis.com/youtube/v3/channels?part=id&mine=true',token,fetcher);
   if(c?.items?.length!==1||c.items[0].id!==owner)return stop('YOUTUBE_ORIGINAL_ACCOUNT_MISMATCH');
   const v=await readJson('https://www.googleapis.com/youtube/v3/videos?part=snippet,status&id='+encodeURIComponent(externalId),token,fetcher);
   const item=v?.items?.length===1?v.items[0]:null;
   if(item?.id!==externalId||item?.snippet?.channelId!==owner||item?.status?.privacyStatus!=='public'||item?.status?.uploadStatus!=='processed')return stop('YOUTUBE_PUBLISHED_VIDEO_NOT_CONFIRMED');
   return {ok:true,identity:{channel,owner_id:owner},provider:{channel,owner_id:owner,id:item.id,public:true,published:true,media_type:'video',canonical_url:'https://www.youtube.com/watch?v='+encodeURIComponent(item.id),observed_at:new Date().toISOString()},verified_read_only:true};
  }
  if(!['instagram','facebook'].includes(channel)||!M_ID.test(String(externalId||'')))return stop('UNSUPPORTED_PROVIDER_OBJECT');
  const c=graphConfig(env||{},channel);if(!c.valid)return stop('META_ORIGINAL_ACCOUNT_NOT_ENROLLED');
  const account=await readJson('https://graph.facebook.com/'+c.version+'/'+encodeURIComponent(c.owner)+'?fields=id',c.token,fetcher);
  if(String(account?.id||'')!==c.owner)return stop('META_ORIGINAL_ACCOUNT_MISMATCH');
  const fields=channel==='instagram'?'id,owner,media_type,permalink':'id,from,published,permalink_url,length';
  const p=await readJson('https://graph.facebook.com/'+c.version+'/'+encodeURIComponent(externalId)+'?fields='+encodeURIComponent(fields),c.token,fetcher);
  if(String(p?.id||'')!==externalId)return stop('META_ORIGINAL_VIDEO_NOT_FOUND');
  const owner=channel==='instagram'?String(p?.owner?.id||''):String(p?.from?.id||'');
  const url=channel==='instagram'?p?.permalink:p?.permalink_url;
  const video=channel==='instagram'?['VIDEO','REELS'].includes(p?.media_type):p?.published===true&&Number.isFinite(Number(p?.length))&&Number(p?.length)>0;
  if(owner!==c.owner||!video||!hostAllowed(url,channel))return stop('META_OWNER_VIDEO_OR_PUBLICATION_NOT_CONFIRMED');
  return {ok:true,identity:{channel,owner_id:c.owner},provider:{channel,owner_id:owner,id:externalId,public:true,published:true,media_type:'video',canonical_url:url,observed_at:new Date().toISOString()},verified_read_only:true};
 }catch{return stop('PROVIDER_UNAVAILABLE_OR_DENIED');}
}
