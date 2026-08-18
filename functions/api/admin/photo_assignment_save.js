// Historical Build 253 compatibility token: build:253
import { requireStaffAccess, serviceHeaders, json } from '../_lib/staff-auth.js';
import { photoSchemaStatus, safeText } from '../_lib/photo-library.js';
export async function onRequestPost({request,env}){
  let body={};try{body=await request.json();}catch{}
  const access=await requireStaffAccess({request,env,body,capability:'manage_bookings',allowLegacyAdminFallback:true});
  if(!access.ok)return access.response;
  try{
    const schema=await photoSchemaStatus(env);
    if(!schema.ready)return json({ok:false,migration_required:true,migration:'sql/2026-08-12_build253_photo_management_studio.sql',error:'Apply the Build 253 photo-management migration before saving assignments.',schema},409);
    const targetKey=safeText(body.target_key,240);
    if(!targetKey)return json({ok:false,error:'Target key is required.'},400);
    if(body.action==='remove'){
      const response=await fetch(`${env.SUPABASE_URL}/rest/v1/app_media_assignments?target_key=eq.${encodeURIComponent(targetKey)}`,{method:'PATCH',headers:{...serviceHeaders(env),Prefer:'return=minimal'},body:JSON.stringify({is_active:false,updated_at:new Date().toISOString(),updated_by:access.actor?.email||'staff'})});
      if(!response.ok)return json({ok:false,error:`Could not remove assignment: ${await response.text()}`},500);
      return json({ok:true,build:260,removed:true,reset_to_default:true,target_key:targetKey});
    }
    const mediaId=safeText(body.media_id,80);
    if(!mediaId)return json({ok:false,error:'Select a saved photo before assigning it.'},400);
    const payload={
      target_key:targetKey,
      media_id:mediaId,
      target_label:safeText(body.target_label,240)||targetKey,
      target_type:safeText(body.target_type,80)||'component',
      page_path:safeText(body.page_path,300)||null,
      component_key:safeText(body.component_key,160)||null,
      variant:safeText(body.variant,80)||null,
      alt_override:safeText(body.alt_override,300)||null,
      title_override:safeText(body.title_override,240)||null,
      caption_override:safeText(body.caption_override,1000)||null,
      is_active:true,
      updated_at:new Date().toISOString(),
      updated_by:access.actor?.email||'staff'
    };
    const response=await fetch(`${env.SUPABASE_URL}/rest/v1/app_media_assignments?on_conflict=target_key`,{method:'POST',headers:{...serviceHeaders(env),Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(payload)});
    if(!response.ok)return json({ok:false,error:`Could not save photo assignment: ${await response.text()}`},500);
    const rows=await response.json().catch(()=>[]);
    return json({ok:true,build:260,assignment:Array.isArray(rows)?rows[0]||null:null,multi_placement_supported:true});
  }catch(err){return json({ok:false,error:err?.message||'Could not save photo assignment.'},500);}
}
