// Historical Build 253 compatibility token: build:253
// Build 260 compatibility: reset_to_default + multi_placement_supported
// Build 261: assignment writes use one direct database mutation after auth; no per-save schema probe.
import { requireStaffAccess, serviceHeaders, json } from '../_lib/staff-auth.js';
import { safeText } from '../_lib/photo-library.js';

function migrationResponse(detail=''){
  return json({
    ok:false,
    migration_required:true,
    migration:'sql/2026-08-12_build253_photo_management_studio.sql',
    error:'Photo assignments are not ready. Apply the Build 253 photo-management migration, then retry.',
    detail:String(detail||'').slice(0,500)
  },409);
}
function looksLikeSchemaError(text=''){
  const value=String(text||'').toLowerCase();
  return value.includes('42p01')||value.includes('42703')||value.includes('app_media_assignments')&&/does not exist|schema cache|column/.test(value);
}

export async function onRequestPost({request,env}){
  let body={};try{body=await request.json();}catch{}
  const access=await requireStaffAccess({request,env,body,capability:'manage_bookings',allowLegacyAdminFallback:true});
  if(!access.ok)return access.response;
  try{
    const targetKey=safeText(body.target_key,240);
    if(!targetKey)return json({ok:false,error:'Target key is required.'},400);
    const now=new Date().toISOString();
    if(body.action==='remove'){
      const response=await fetch(`${env.SUPABASE_URL}/rest/v1/app_media_assignments?target_key=eq.${encodeURIComponent(targetKey)}`,{
        method:'PATCH',headers:{...serviceHeaders(env),Prefer:'return=minimal'},
        body:JSON.stringify({is_active:false,updated_at:now,updated_by:access.actor?.email||'staff'})
      });
      if(!response.ok){const detail=await response.text();if(looksLikeSchemaError(detail))return migrationResponse(detail);return json({ok:false,error:`Could not remove assignment: ${detail.slice(0,500)}`},500);}
      return json({ok:true,build:261,removed:true,reset_to_default:true,target_key:targetKey,multi_placement_supported:true});
    }
    const mediaId=safeText(body.media_id,80);
    if(!mediaId)return json({ok:false,error:'Select a saved photo before assigning it.'},400);
    const payload={
      target_key:targetKey,media_id:mediaId,
      target_label:safeText(body.target_label,240)||targetKey,
      target_type:safeText(body.target_type,80)||'component',
      page_path:safeText(body.page_path,300)||null,
      component_key:safeText(body.component_key,160)||null,
      variant:safeText(body.variant,80)||null,
      alt_override:safeText(body.alt_override,300)||null,
      title_override:safeText(body.title_override,240)||null,
      caption_override:safeText(body.caption_override,1000)||null,
      is_active:true,updated_at:now,updated_by:access.actor?.email||'staff'
    };
    const response=await fetch(`${env.SUPABASE_URL}/rest/v1/app_media_assignments?on_conflict=target_key`,{
      method:'POST',headers:{...serviceHeaders(env),Prefer:'resolution=merge-duplicates,return=representation'},body:JSON.stringify(payload)
    });
    if(!response.ok){const detail=await response.text();if(looksLikeSchemaError(detail))return migrationResponse(detail);return json({ok:false,error:`Could not save photo assignment: ${detail.slice(0,500)}`},500);}
    const rows=await response.json().catch(()=>[]);
    return json({ok:true,build:261,assignment:Array.isArray(rows)?rows[0]||null:null,multi_placement_supported:true});
  }catch(err){return json({ok:false,error:err?.message||'Could not save photo assignment.'},500);}
}
