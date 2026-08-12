import { requireStaffAccess, json } from '../_lib/staff-auth.js';
import { listApprovedR2Images, loadMediaLibraryRows, loadAssignmentRows, mergeLibraryAndR2, photoSchemaStatus } from '../_lib/photo-library.js';

export async function onRequestGet({request,env}){
  const access=await requireStaffAccess({request,env,capability:'manage_bookings',allowLegacyAdminFallback:true});
  if(!access.ok)return access.response;
  try{
    const [live,library,assignmentResult,schema]=await Promise.all([
      listApprovedR2Images(env,{maxTotal:6000}),
      loadMediaLibraryRows(env,{includeArchived:true}),
      loadAssignmentRows(env,{activeOnly:false}),
      photoSchemaStatus(env)
    ]);
    const photos=mergeLibraryAndR2(library.rows||[],live.images||[]);
    const assignments=assignmentResult.rows||[];
    const countsByMedia=new Map();
    for(const row of assignments){if(row?.is_active===false)continue;const id=String(row.media_id||'');if(id)countsByMedia.set(id,(countsByMedia.get(id)||0)+1);}
    for(const photo of photos) photo.assignment_count=countsByMedia.get(String(photo.id||''))||0;
    const missingAlt=photos.filter((p)=>p.decorative!==true && !String(p.alt_text||'').trim()).length;
    return json({
      ok:true,build:253,schema,bucket_ready:live.bucket_ready===true,db_ready:library.ready===true,assignment_db_ready:assignmentResult.ready===true,
      photos,assignments,
      stats:{photos:photos.length,live_r2:photos.filter(p=>p.live_in_r2).length,saved:photos.filter(p=>p.db_saved).length,missing_alt:missingAlt,assigned:photos.filter(p=>p.assignment_count>0).length,unassigned:photos.filter(p=>p.assignment_count===0).length},
      warnings:[...(live.warnings||[]),library.warning,assignmentResult.warning,schema.warning].filter(Boolean)
    });
  }catch(err){return json({ok:false,error:err?.message||'Could not load photo library.'},500);}
}
export async function onRequestPost(context){return onRequestGet(context);}
