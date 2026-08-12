import { serviceHeaders } from './staff-auth.js';

export const DAIP_BINDINGS = ['DAIP_MEDIA_BUCKET','ROSIE_DAIP_MEDIA_BUCKET','PROJECT_MEDIA_BUCKET'];
export const DEFAULT_PART_SIZE = 32 * 1024 * 1024;
export const MAX_PARTS = 10000;
export const ALLOWED_MIME = new Set([
  'image/jpeg','image/png','image/webp','image/heic','image/heif',
  'video/mp4','video/quicktime','video/webm','video/x-m4v','application/octet-stream'
]);

export function serviceReady(env){ return Boolean(env?.SUPABASE_URL && env?.SUPABASE_SERVICE_ROLE_KEY); }
export function dbHeaders(env, extra={}){ return {...serviceHeaders(env),'Content-Type':'application/json',...extra}; }
export async function rest(env,path,options={}){
  const response=await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`,{...options,headers:dbHeaders(env,options.headers||{})});
  const text=await response.text(); let data=null; try{ data=text?JSON.parse(text):null; }catch{}
  if(!response.ok) throw new Error(data?.message||data?.error||`Database request failed (${response.status})`);
  return data;
}
export async function jsonBody(request){ try{return await request.json();}catch{return {};} }
export function clean(value,max=500){ return String(value??'').trim().slice(0,max); }
export function safeFilename(value){
  const raw=clean(value,220).replace(/\\/g,'/').split('/').pop()||'upload.bin';
  const normalized=raw.normalize('NFKD').replace(/[^A-Za-z0-9._ -]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-');
  return normalized.replace(/^\.+/,'').slice(0,180)||'upload.bin';
}
export function mediaKind(contentType,filename=''){
  const type=clean(contentType,100).toLowerCase(); const ext=String(filename).toLowerCase();
  if(type.startsWith('image/')||/\.(jpe?g|png|webp|heic|heif)$/.test(ext)) return 'photo';
  if(type.startsWith('video/')||/\.(mp4|mov|m4v|webm)$/.test(ext)) return 'video';
  return 'file';
}
export function bucketFor(env){
  for(const key of DAIP_BINDINGS){ const bucket=env?.[key]; if(bucket && typeof bucket.createMultipartUpload==='function') return {bucket,binding:key}; }
  return {bucket:null,binding:null};
}
export function objectKey({projectId,assetId,kind,filename}){
  const folder=kind==='photo'?'photos':kind==='video'?'video':'files';
  return `projects/${projectId}/raw/${folder}/${assetId}/${safeFilename(filename)}`;
}
export function allowedContentType(contentType,filename=''){
  const type=clean(contentType,100).toLowerCase()||'application/octet-stream';
  if(ALLOWED_MIME.has(type)) return type;
  const kind=mediaKind(type,filename);
  return kind==='photo'||kind==='video'?'application/octet-stream':null;
}
export function expectedParts(sizeBytes,partSize=DEFAULT_PART_SIZE){ return Math.max(1,Math.ceil(Number(sizeBytes||0)/partSize)); }
export function processingJobs(kind){
  const base=['metadata_extract','privacy_review','content_candidate_index'];
  return kind==='video'?[...base,'proxy_video','frame_extract','audio_extract','transcript','scene_analysis']:[...base,'image_derivative','visual_analysis'];
}
export function publicBoundary(){ return {raw_private:true,public_destination:false,copy_to_public_requires_review:true}; }
