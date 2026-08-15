// Historical Build 253 compatibility token: build:253
import { requireStaffAccess } from '../_lib/staff-auth.js';
import { getPublicAssetsBucket, loadMediaLibraryRows, loadAssignmentRows, normalizeAdminPhoto, photoSchemaStatus } from '../_lib/photo-library.js';

function compactJson(data,status=200){
  return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});
}

export async function onRequestGet({request,env}){
  const access=await requireStaffAccess({request,env,capability:'manage_bookings',allowLegacyAdminFallback:true});
  if(!access.ok)return access.response;
  try{
    // Build 257: ordinary Photo Studio loads are database-only. R2 is scanned only by the explicit Sync action.
    const [library,assignmentResult,schema]=await Promise.all([
      loadMediaLibraryRows(env,{includeArchived:true,limit:1200}),
      loadAssignmentRows(env,{activeOnly:true,limit:1200}),
      photoSchemaStatus(env)
    ]);
    const photos=(library.rows||[]).map((row)=>normalizeAdminPhoto({...row,live_in_r2:!!row?.r2_key,db_saved:true}));
    const assignments=assignmentResult.rows||[];
    const countsByMedia=new Map();
    for(const row of assignments){const id=String(row.media_id||'');if(id)countsByMedia.set(id,(countsByMedia.get(id)||0)+1);}
    for(const photo of photos) photo.assignment_count=countsByMedia.get(String(photo.id||''))||0;
    const missingAlt=photos.filter((p)=>p.decorative!==true && !String(p.alt_text||'').trim()).length;
    return compactJson({
      ok:true,build:258,schema,
      bucket_ready:!!getPublicAssetsBucket(env),db_ready:library.ready===true,assignment_db_ready:assignmentResult.ready===true,
      scan_mode:'managed_library_only',r2_scan_per_load:false,
      photos,assignments,
      stats:{photos:photos.length,live_r2:photos.filter(p=>p.r2_key).length,saved:photos.length,missing_alt:missingAlt,assigned:photos.filter(p=>p.assignment_count>0).length,unassigned:photos.filter(p=>p.assignment_count===0).length},
      warnings:[library.warning,assignmentResult.warning,schema.warning].filter(Boolean)
    });
  }catch(err){return compactJson({ok:false,error:err?.message||'Could not load photo library.'},500);}
}
export async function onRequestPost(context){return onRequestGet(context);}
