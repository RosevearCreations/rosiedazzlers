import { isApprovedImageKey, safeText } from './photo-library.js';
import { serviceHeaders } from './staff-auth.js';

export const PHOTO_STUDIO_BUILD = 391;
export const PRIVATE_MEDIA_PREFIX_HINTS = [
  'daip/',
  'private/',
  'customer/',
  'customers/',
  'job/',
  'jobs/',
  'evidence/',
  'intake/',
  'uploads/private/'
];

export function isPrivateMediaKey(key=''){
  const normalized=String(key||'').trim().replace(/^\/+/, '').replace(/\\/g,'/').toLowerCase();
  return PRIVATE_MEDIA_PREFIX_HINTS.some((prefix)=>normalized.startsWith(prefix));
}

export function isPhotoStudioPublicRow(row={}){
  const key=String(row?.r2_key||'').trim();
  if(!key||isPrivateMediaKey(key)||!isApprovedImageKey(key))return false;
  if(String(row?.source_status||'active').toLowerCase()==='archived')return false;
  const mediaType=String(row?.media_type||'image').toLowerCase();
  return mediaType==='image' || String(row?.mime_type||'').toLowerCase().startsWith('image/');
}

export function beforeAfterPlacement(targetKey='',targetType=''){
  const key=safeText(targetKey,240);
  if(String(targetType||'')!=='before_after_pair')return {pair_group_key:'',pair_side:''};
  if(/:before$/i.test(key))return {pair_group_key:key.replace(/:before$/i,''),pair_side:'before'};
  if(/:after$/i.test(key))return {pair_group_key:key.replace(/:after$/i,''),pair_side:'after'};
  return {pair_group_key:key,pair_side:''};
}

export async function loadAssignablePublicPhoto(env,mediaId=''){
  const id=safeText(mediaId,80);
  if(!id)return {ok:false,status:400,error:'Select a saved photo before assigning it.'};
  if(!env?.SUPABASE_URL||!env?.SUPABASE_SERVICE_ROLE_KEY)return {ok:false,status:503,error:'Photo library service configuration is unavailable.'};
  const fields='id,r2_key,media_type,mime_type,source_status,label,filename';
  const response=await fetch(`${env.SUPABASE_URL}/rest/v1/app_media_library?select=${fields}&id=eq.${encodeURIComponent(id)}&limit=1`,{headers:serviceHeaders(env)});
  if(!response.ok)return {ok:false,status:500,error:`Could not verify the selected managed photo: ${(await response.text()).slice(0,500)}`};
  const rows=await response.json().catch(()=>[]);
  const photo=Array.isArray(rows)?rows[0]||null:null;
  if(!photo)return {ok:false,status:404,error:'The selected managed photo was not found.'};
  if(!isPhotoStudioPublicRow(photo))return {ok:false,status:409,private_media_blocked:isPrivateMediaKey(photo.r2_key),error:'Only active images from approved public Photo Studio R2 prefixes can be assigned to public website placements.'};
  return {ok:true,photo};
}
