import { requireStaffAccess, serviceHeaders, json } from '../_lib/staff-auth.js';
import { cleanKey, filenameForKey, getPublicAssetsBucket, isApprovedImageKey, photoSchemaStatus, prefixForKey, publicUrlForKey, safeText } from '../_lib/photo-library.js';
export async function onRequestPost({request,env}){
  let body={};try{body=await request.json();}catch{}
  const access=await requireStaffAccess({request,env,body,capability:'manage_bookings',allowLegacyAdminFallback:true});
  if(!access.ok)return access.response;
  try{
    const schema=await photoSchemaStatus(env);
    if(!schema.ready)return json({ok:false,migration_required:true,migration:'sql/2026-08-12_build253_photo_management_studio.sql',error:'Apply the Build 253 photo-management migration before renaming or moving photos.',schema},409);
    const id=safeText(body.id,80);
    const oldKey=cleanKey(body.old_key);
    const newKey=cleanKey(body.new_key);
    if(!id||!oldKey||!newKey)return json({ok:false,error:'Photo id, old key and new key are required.'},400);
    if(!isApprovedImageKey(oldKey)||!isApprovedImageKey(newKey))return json({ok:false,error:'The old and new keys must stay inside an approved public image folder and use a supported image extension.'},400);
    const oldExt=(filenameForKey(oldKey).split('.').pop()||'').toLowerCase();
    const newExt=(filenameForKey(newKey).split('.').pop()||'').toLowerCase();
    if(oldExt!==newExt)return json({ok:false,error:'Renaming cannot change the image file format. Keep the same extension.'},400);
    if(oldKey===newKey)return json({ok:true,build:253,unchanged:true,r2_key:oldKey,url:publicUrlForKey(env,oldKey)});
    const bucket=getPublicAssetsBucket(env);
    if(!bucket||typeof bucket.get!=='function'||typeof bucket.put!=='function'||typeof bucket.delete!=='function')return json({ok:false,error:'Public R2 bucket binding is not configured for rename/move operations.'},501);
    const existing=await bucket.head(newKey);
    if(existing)return json({ok:false,error:'A photo already exists at the requested destination. Choose a different filename/location.'},409);
    const source=await bucket.get(oldKey);
    if(!source||!source.body)return json({ok:false,error:'The original R2 photo was not found.'},404);
    const customMetadata={...(source.customMetadata||{}),renamed_by:access.actor?.email||'staff',previous_key:oldKey,renamed_build:'253'};
    const stored=await bucket.put(newKey,source.body,{httpMetadata:source.httpMetadata,customMetadata});
    if(!stored)return json({ok:false,error:'R2 did not confirm the renamed copy.'},500);
    const dbPayload={r2_key:newKey,filename:filenameForKey(newKey),r2_prefix:prefixForKey(newKey),group_key:prefixForKey(newKey).replace(/\/$/,''),media_url:publicUrlForKey(env,newKey),updated_at:new Date().toISOString(),updated_by:access.actor?.email||'staff'};
    const currentKey=safeText(body.media_key,500);
    if(currentKey.startsWith('r2:'))dbPayload.media_key=`r2:${newKey}`;
    const response=await fetch(`${env.SUPABASE_URL}/rest/v1/app_media_library?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',headers:{...serviceHeaders(env),Prefer:'return=minimal'},body:JSON.stringify(dbPayload)});
    if(!response.ok){
      await bucket.delete(newKey).catch(()=>{});
      return json({ok:false,error:`The database update failed, so the new R2 copy was rolled back and the original was kept: ${await response.text()}`},500);
    }
    await bucket.delete(oldKey);
    return json({ok:true,build:253,old_key:oldKey,r2_key:newKey,url:publicUrlForKey(env,newKey)});
  }catch(err){return json({ok:false,error:err?.message||'Could not rename/move the photo.'},500);}
}
