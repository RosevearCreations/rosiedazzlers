import { requireStaffAccess, serviceHeaders, json } from '../_lib/staff-auth.js';
import { cleanStringList, photoSchemaStatus, safeText } from '../_lib/photo-library.js';
export async function onRequestPost({request,env}){
  let body={};try{body=await request.json();}catch{}
  const access=await requireStaffAccess({request,env,body,capability:'manage_bookings',allowLegacyAdminFallback:true});
  if(!access.ok)return access.response;
  try{
    const schema=await photoSchemaStatus(env);
    if(!schema.ready)return json({ok:false,migration_required:true,migration:'sql/2026-08-12_build253_photo_management_studio.sql',error:'Apply the Build 253 photo-management migration before saving photo metadata.',schema},409);
    const id=safeText(body.id,80);
    if(!id)return json({ok:false,error:'Photo id is required. Sync R2 first if this image is not yet saved.'},400);
    const decorative=body.decorative===true;
    const altText=safeText(body.alt_text,300);
    const payload={
      label:safeText(body.label,240)||'Website photo',
      alt_text:decorative?'':altText,
      seo_title:safeText(body.seo_title,240)||null,
      caption:safeText(body.caption,1200)||null,
      tags:cleanStringList(body.tags,40,80),
      usage_contexts:cleanStringList(body.usage_contexts||['website'],40,80),
      recommended_size:safeText(body.recommended_size,120)||null,
      focal_point:['center','top','bottom','left','right','top-left','top-right','bottom-left','bottom-right'].includes(String(body.focal_point||''))?String(body.focal_point):'center',
      decorative,
      attribution:safeText(body.attribution,300)||null,
      license_notes:safeText(body.license_notes,600)||null,
      source_status:['active','needs_review','archived'].includes(String(body.source_status||''))?String(body.source_status):'active',
      updated_at:new Date().toISOString(),
      updated_by:access.actor?.email||'staff'
    };
    const response=await fetch(`${env.SUPABASE_URL}/rest/v1/app_media_library?id=eq.${encodeURIComponent(id)}&select=*`,{method:'PATCH',headers:{...serviceHeaders(env),Prefer:'return=representation'},body:JSON.stringify(payload)});
    if(!response.ok)return json({ok:false,error:`Could not save photo metadata: ${await response.text()}`},500);
    const rows=await response.json().catch(()=>[]);
    return json({ok:true,build:253,photo:Array.isArray(rows)?rows[0]||null:null,alt_warning:!decorative && altText.length<12?'Alt text is very short; describe the visible image in context before relying on it for SEO/accessibility.':null});
  }catch(err){return json({ok:false,error:err?.message||'Could not save photo metadata.'},500);}
}
