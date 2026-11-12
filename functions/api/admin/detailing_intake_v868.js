// Rosie 868 staff-only camera-first detailing intake drafts (NOT real bookings).
import {requireStaffAccess,serviceHeaders,json,isUuid} from '../_lib/staff-auth.js';
const BUCKET='rosie-intake-private';
const MIME={
 'image/jpeg':{ext:'jpg',max:12*1024*1024},
 'image/png':{ext:'png',max:12*1024*1024},
 'image/webp':{ext:'webp',max:12*1024*1024},
 'image/heic':{ext:'heic',max:12*1024*1024},
 'video/mp4':{ext:'mp4',max:40*1024*1024},
 'video/quicktime':{ext:'mov',max:40*1024*1024},
 'video/webm':{ext:'webm',max:40*1024*1024}
};
const noStore={'Cache-Control':'no-store'};
const err=(error,status=400)=>json({ok:false,build:868,error,booking_created:false},status);
const txt=(x,max=120)=>String(x??'').trim().slice(0,max);
const within=x=>x&&typeof x==='object'&&!Array.isArray(x);
const ref=(id,date)=>'RD-TMP-'+date.replaceAll('-','')+'-'+id.slice(0,8).toUpperCase();
const safeFilename=x=>txt(x,120).replace(/[^a-z0-9._-]/gi,'-').replace(/^-+/,'')||'capture';
const pathFor=(id,mediaId,ext)=>'intakes/'+id+'/'+mediaId+'.'+ext;
const assetUrl=(env,path)=>env.SUPABASE_URL.replace(/\/+$/,'')+'/storage/v1/'+path;
async function db(env,table,{method='GET',query='',data}={}){
 const url=env.SUPABASE_URL.replace(/\/+$/,'')+'/rest/v1/'+table+query;
 const r=await fetch(url,{method,headers:{...serviceHeaders(env),
  ...(method==='GET'?{}:{Prefer:'return=representation'}),
  ...(data===undefined?{}:{'Content-Type':'application/json'})},
  ...(data===undefined?{}:{body:JSON.stringify(data)})});
 const result=await r.json().catch(()=>null);
 if(!r.ok||!Array.isArray(result))throw Error('Private Rosie database operation unavailable');
 return result;
}
const byId=(id)=>'?id=eq.'+encodeURIComponent(id)+'&select=id,temporary_label,display_title,notes,status,created_at,updated_at,expires_at';
async function draft(env,id){
 const records=await db(env,'rosie_detailing_intake_v868',{query:byId(id)+'&limit=2'});
 if(records.length!==1||records[0].status!=='intake_draft')throw Error('Original draft unavailable');
 return records[0];
}
async function media(env,id){
 return db(env,'rosie_detailing_intake_media_v868',{query:
 '?draft_id=eq.'+encodeURIComponent(id)+
 '&select=id,draft_id,original_filename,content_type,expected_bytes,status,created_at,verified_at'+
 '&order=created_at.asc,id.asc&limit=9'});
}
async function oneMedia(env,id,draftId){
 const records=await db(env,'rosie_detailing_intake_media_v868',{query:
 '?id=eq.'+encodeURIComponent(id)+'&draft_id=eq.'+encodeURIComponent(draftId)+
 '&select=id,draft_id,bucket,object_path,original_filename,content_type,expected_bytes,status&limit=2'});
 if(records.length!==1)throw Error('Selected private media reference unavailable');
 return records[0];
}
function validSource(env){
 return /^https:\/\//.test(env.SUPABASE_URL||'')&&Boolean(env.SUPABASE_SERVICE_ROLE_KEY);
}
async function authenticate({request,env,body}){
 const access=await requireStaffAccess({request,env,body,
  capability:'manage_bookings',allowLegacyAdminFallback:false});
 return access;
}
export const onRequestOptions=()=>new Response('',{status:204,headers:noStore});
export async function onRequest({request,env}){
 if(!['GET','POST'].includes(request.method))return err('Only private staff intake review allowed',405);
 if(!validSource(env))return err('Private intake storage is not configured',503);
 if(Number(request.headers.get('content-length'))>12000)return err('Payload too large',413);
 let body={};
 if(request.method==='POST'){
  const raw=await request.text();
  if(raw.length>12000)return err('Payload too large',413);
  try{body=JSON.parse(raw);if(!within(body))throw Error();}
  catch{return err('JSON body required');}
 }
 const access=await authenticate({request,env,body});
 if(!access.ok)return access.response;
 if(access.auth_mode!=='session')return err('Signed-in staff session required',403);
 const actor=txt(access.actor?.email||access.actor?.id||'',140);
 if(!actor)return err('Signed-in staff identity unavailable',403);
 try{
  if(request.method==='GET'){
   const id=new URL(request.url).searchParams.get('draft_id');
   if(id&&!isUuid(id))return err('Invalid draft ID');
   const drafts=id?[await draft(env,id)]:await db(env,'rosie_detailing_intake_v868',{
    query:'?select=id,temporary_label,display_title,notes,status,created_at,updated_at,expires_at'+
    '&order=updated_at.desc,id.desc&limit=25'});
   const assets=id?await media(env,id):[];
   return json({ok:true,build:868,drafts,media:assets,
    booking_created:false,appointment_reserved:false,
    media_private:true,maximum_assets_per_draft:8},200,noStore);
  }
  const action=txt(body.action,64);
  if(action==='create'){
   const id=crypto.randomUUID(),date=new Date().toISOString().slice(0,10);
   const label=ref(id,date);
   const saved=await db(env,'rosie_detailing_intake_v868',{method:'POST',
    data:[{id,temporary_label:label,display_title:label,notes:'',
     status:'intake_draft',created_by_staff:actor}]});
   if(saved.length!==1)throw Error('Could not persist intake');
   return json({ok:true,build:868,draft:saved[0],booking_created:false,
    appointment_reserved:false},201,noStore);
  }
  const draftId=txt(body.draft_id,80);
  if(!isUuid(draftId))return err('Saved detailing intake ID required');
  const current=await draft(env,draftId);
  if(Date.parse(current.expires_at)<=Date.now())
   return err('Draft has expired; contact an owner to review private retention',409);
  if(action==='save'){
   const title=txt(body.display_title,100),notes=txt(body.notes,3000);
   if(title.length<3||String(body.notes??'').length>3000)
    return err('Title must be 3–100 characters and notes 3,000 or less');
   const saved=await db(env,'rosie_detailing_intake_v868',{method:'PATCH',
    query:'?id=eq.'+encodeURIComponent(draftId),
    data:{display_title:title,notes,updated_at:new Date().toISOString()}});
   if(saved.length!==1)throw Error('Draft was not saved');
   return json({ok:true,build:868,draft:saved[0],
    booking_created:false,appointment_reserved:false},200,noStore);
  }
  if(action==='sign_upload'){
   const mime=txt(body.content_type,90).toLowerCase();
   const size=Number(body.file_size_bytes);
   if(!MIME[mime]||!Number.isInteger(size)||size<1||size>MIME[mime].max)
    return err('Photo maximum 12 MB; video maximum 40 MB. Use an allowed image/video format');
   const existing=await media(env,draftId);
   if(existing.length>=8)return err('Each detailing request holds up to eight files',409);
   const assetId=crypto.randomUUID(),objectPath=pathFor(draftId,assetId,MIME[mime].ext);
   // Only server-side service key can sign a write into this private bucket.
   const signing=await fetch(assetUrl(env,
     'object/upload/sign/'+BUCKET+'/'+objectPath),{
     method:'POST',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,
      'Content-Type':'application/json'},
     body:JSON.stringify({})});
   const signed=await signing.json().catch(()=>({}));
   if(!signing.ok)throw Error('Private media bucket signing unavailable');
   const link=signed.url||signed.signedURL||signed.signedUrl||signed.signed_url;
   if(!link||typeof link!=='string')throw Error('Storage signing did not return a URL');
   const origin=new URL(env.SUPABASE_URL).origin;
   const uploadUrl=link.startsWith('http')?link:
    new URL(link.startsWith('/storage/v1/')?link:
      link.startsWith('/object/')?'/storage/v1'+link:
      '/storage/v1/'+link.replace(/^\/+/,''),origin).toString();
   if(new URL(uploadUrl).origin!==origin)throw Error('Unsigned storage target rejected');
   const saved=await db(env,'rosie_detailing_intake_media_v868',{method:'POST',
    data:[{id:assetId,draft_id:draftId,bucket:BUCKET,
     object_path:objectPath,original_filename:safeFilename(body.filename),
     content_type:mime,expected_bytes:size,status:'pending_upload'}]});
   if(saved.length!==1)throw Error('Private upload intent not saved');
   return json({ok:true,build:868,asset_id:assetId,upload_url:uploadUrl,
    method:'PUT',content_type:mime,public_url:null,
    status:'pending_upload',booking_created:false},200,noStore);
  }
  if(action==='preview_private'){
   const assetId=txt(body.asset_id,80);
   if(!isUuid(assetId))return err('Private media ID required');
   const a=await oneMedia(env,assetId,draftId);
   if(a.status!=='stored_private')return err('Media not yet verified as saved',409);
   const signing=await fetch(assetUrl(env,
    'object/sign/'+BUCKET+'/'+a.object_path),{
    method:'POST',headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,
     Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY,
     'Content-Type':'application/json'},
    body:JSON.stringify({expiresIn:120})});
   const signed=await signing.json().catch(()=>({}));
   if(!signing.ok)throw Error('Private media preview unavailable');
   const link=signed.signedURL||signed.signedUrl||signed.url;
   if(!link||typeof link!=='string')throw Error('Private preview was not signed');
   const origin=new URL(env.SUPABASE_URL).origin;
   const previewUrl=link.startsWith('http')?link:
    new URL(link.startsWith('/storage/v1/')?link:
      link.startsWith('/object/')?'/storage/v1'+link:
      '/storage/v1/'+link.replace(/^\\/+/,''),origin).toString();
   if(new URL(previewUrl).origin!==origin)
    throw Error('Private media host mismatch');
   return json({ok:true,build:868,preview_url:previewUrl,
    expires_in_seconds:120,public_url:null},200,noStore);
  }
  if(action==='confirm_upload'){
   const assetId=txt(body.asset_id,80);
   if(!isUuid(assetId))return err('Private media ID required');
   const a=await oneMedia(env,assetId,draftId);
   if(a.status==='stored_private')return json({ok:true,build:868,
    asset_id:assetId,status:'stored_private',booking_created:false},200,noStore);
   // Independently verify the actual object before marking media saved.
   const response=await fetch(assetUrl(env,
    'object/info/'+BUCKET+'/'+a.object_path),{
    headers:{apikey:env.SUPABASE_SERVICE_ROLE_KEY,
     Authorization:'Bearer '+env.SUPABASE_SERVICE_ROLE_KEY}});
   if(!response.ok)return err('Private upload not yet present; retry confirmation',409);
   const info=await response.json().catch(()=>null);
   const actual=Number(info?.metadata?.size??info?.size);
   const type=String(info?.metadata?.mimetype??info?.metadata?.contentType??
     info?.content_type??'').toLowerCase();
   if(!Number.isFinite(actual)||actual<1||actual>a.expected_bytes||
    (type&&type!==a.content_type))
    return err('Uploaded object does not match expected private media',409);
   const saved=await db(env,'rosie_detailing_intake_media_v868',{method:'PATCH',
    query:'?id=eq.'+encodeURIComponent(assetId)+'&draft_id=eq.'+
      encodeURIComponent(draftId)+'&status=eq.pending_upload',
    data:{status:'stored_private',verified_at:new Date().toISOString()}});
   if(saved.length!==1)throw Error('Private upload state changed');
   return json({ok:true,build:868,asset_id:assetId,
    status:'stored_private',booking_created:false},200,noStore);
  }
  return err('Unsupported staff intake action',405);
 }catch(e){return err(e?.message||'Private intake unavailable',503);}
}
