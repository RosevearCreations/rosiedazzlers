// Build 616: bounded recovery and version-checked Photo Studio metadata writes.
import { requireStaffAccess, serviceHeaders, json } from '../_lib/staff-auth.js';
import { cleanStringList, normalizeAdminPhoto, safeText } from '../_lib/photo-library.js';
const BUILD=617;
const validRevision=(value)=>typeof value==='string'&&value.length<=80&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?(?:Z|[+-]\d\d:\d\d)$/.test(value)&&Number.isFinite(Date.parse(value));
const upstreamStatus=(response)=>[429,502,503,504].includes(response.status)?503:502;

export async function onRequestGet({request,env}){
  const access=await requireStaffAccess({request,env,capability:'manage_bookings',allowLegacyAdminFallback:true});
  if(!access.ok)return access.response;
  const id=safeText(new URL(request.url).searchParams.get('id'),80);
  if(!id)return json({ok:false,build:BUILD,error:'Photo id is required.'},400);
  if(!env?.SUPABASE_URL||!env?.SUPABASE_SERVICE_ROLE_KEY)return json({ok:false,build:BUILD,error:'Photo metadata service is unavailable.'},503);
  try{
    const response=await fetch(`${env.SUPABASE_URL}/rest/v1/app_media_library?select=*&id=eq.${encodeURIComponent(id)}&limit=1`,{headers:serviceHeaders(env)});
    if(!response.ok)return json({ok:false,build:BUILD,error:'Could not check the currently saved photo. No changes were made.'},upstreamStatus(response));
    const rows=await response.json();
    if(!Array.isArray(rows)||!rows[0])return json({ok:false,build:BUILD,error:'The managed photo no longer exists.'},404);
    return json({ok:true,build:BUILD,photo:normalizeAdminPhoto({...rows[0],db_saved:true})});
  }catch{return json({ok:false,build:BUILD,error:'Saved photo version could not be checked. Keep the form open and try the read-only check again.'},503);}
}
export async function onRequestPost({request,env}){
  let body={};try{body=await request.json();}catch{}
  const access=await requireStaffAccess({request,env,body,capability:'manage_bookings',allowLegacyAdminFallback:true});
  if(!access.ok)return access.response;
  if(!env?.SUPABASE_URL||!env?.SUPABASE_SERVICE_ROLE_KEY)return json({ok:false,build:BUILD,code:'save_unconfirmed',error:'Photo metadata service is unavailable. Keep your draft and check the saved version.'},503);
  const id=safeText(body.id,80);
  if(!id)return json({ok:false,error:'Photo id is required. Sync R2 first if this image is not yet saved.'},400);
  // The client must provide the revision observed on its last successful load.
  // A PostgREST conditional PATCH applies the revision check atomically in the database.
  if(!validRevision(body.expected_updated_at))return json({ok:false,build:BUILD,code:'revision_required',recovery:'review_saved_version',error:'No verified saved revision was supplied. Review the saved photo before saving.'},428);
  const expectedStatus=String(body.expected_source_status||'');
  const desiredStatus=String(body.source_status||'');
  if(!['active','needs_review','archived'].includes(expectedStatus)||!['active','needs_review','archived'].includes(desiredStatus))return json({ok:false,build:BUILD,code:'source_status_required',recovery:'review_saved_version',error:'A verified prior and desired publication status is required. Review the saved photo before retrying.'},428);
  if(expectedStatus!=='active'&&desiredStatus==='active'&&(!body.publication_approval||!safeText(body.license_notes,600)))return json({ok:false,build:BUILD,code:'public_use_approval_required',error:'Before publishing a review-held photo, explicitly confirm verified public-use rights/consent and enter a non-private license/consent note.'},409);
  try{
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
      source_status:desiredStatus,
      updated_at:new Date().toISOString(),
      updated_by:access.actor?.email||'staff'
    };
    const params=new URLSearchParams({id:`eq.${id}`,updated_at:`eq.${body.expected_updated_at}`,source_status:`eq.${expectedStatus}`,select:'*'});
    const response=await fetch(`${env.SUPABASE_URL}/rest/v1/app_media_library?${params.toString()}`,{method:'PATCH',headers:{...serviceHeaders(env),Prefer:'return=representation'},body:JSON.stringify(payload)});
    if(!response.ok)return json({ok:false,build:BUILD,code:'save_unconfirmed',recovery:'review_saved_version',error:'Photo metadata save was not confirmed. Keep your edits and review the saved version before choosing to retry.'},upstreamStatus(response));
    const rows=await response.json();
    if(!Array.isArray(rows)||rows.length!==1)return json({ok:false,build:BUILD,code:'revision_conflict',recovery:'compare_before_retry',error:'This photo changed or was removed since it was opened. Your edits were not applied. Review the saved version before trying again.'},409);
    return json({ok:true,build:BUILD,photo:normalizeAdminPhoto({...rows[0],db_saved:true}),alt_warning:!decorative && altText.length<12?'Alt text is very short; describe the visible image in context before relying on it for SEO/accessibility.':null});
  }catch{return json({ok:false,build:BUILD,code:'save_unconfirmed',recovery:'review_saved_version',error:'Photo metadata save could not be confirmed. Keep these edits and check the saved version before deliberate retry.'},503);}
}
