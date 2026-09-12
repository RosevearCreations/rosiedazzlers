// Historical Build 253 compatibility token: build:253
// Build 314: expose exact active placement tracking on each managed photo.
// Build 391: Photo Studio lists only approved public media and exposes explicit before/after pair metadata.
import { requireStaffAccess } from '../_lib/staff-auth.js';
import { getPublicAssetsBucket, loadMediaLibraryRows, loadAssignmentRows, normalizeAdminPhoto, photoSchemaStatus } from '../_lib/photo-library.js';
import { PHOTO_STUDIO_BUILD, beforeAfterPlacement, isPhotoStudioPublicRow } from '../_lib/photo-studio-safety.js';

const BUILD=PHOTO_STUDIO_BUILD;

function compactJson(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}});}

export async function onRequestGet({request,env}){
  const access=await requireStaffAccess({request,env,capability:'manage_bookings',allowLegacyAdminFallback:true});
  if(!access.ok)return access.response;
  try{
    // Ordinary Photo Studio loads stay database-only. R2 is scanned only by the explicit Sync action.
    const [library,assignmentResult,schema]=await Promise.all([
      loadMediaLibraryRows(env,{includeArchived:true,limit:1200}),
      loadAssignmentRows(env,{activeOnly:true,limit:1600}),
      photoSchemaStatus(env)
    ]);
    const allRows=Array.isArray(library.rows)?library.rows:[];
    const publicRows=allRows.filter(isPhotoStudioPublicRow);
    const photos=publicRows.map((row)=>normalizeAdminPhoto({...row,live_in_r2:!!row?.r2_key,db_saved:true}));
    const publicMediaIds=new Set(photos.map((row)=>String(row.id||'')).filter(Boolean));
    const assignments=(assignmentResult.rows||[]).filter((row)=>publicMediaIds.has(String(row.media_id||'')));
    const assignmentsByMedia=new Map();
    for(const row of assignments){
      const id=String(row.media_id||'');
      if(!id)continue;
      if(!assignmentsByMedia.has(id))assignmentsByMedia.set(id,[]);
      const pair=beforeAfterPlacement(row.target_key||'',row.target_type||'');
      assignmentsByMedia.get(id).push({target_key:row.target_key||'',target_label:row.target_label||row.target_key||'',target_type:row.target_type||'',page_path:row.page_path||'',component_key:row.component_key||'',variant:row.variant||'',is_active:true,...pair});
    }
    for(const photo of photos){
      const placements=assignmentsByMedia.get(String(photo.id||''))||[];
      photo.assignment_count=placements.length;
      photo.assigned_targets=placements;
      photo.before_after_slots=placements.filter((row)=>row.target_type==='before_after_pair');
    }
    const beforeAfterPairs={};
    for(const row of assignments){
      const pair=beforeAfterPlacement(row.target_key||'',row.target_type||'');
      if(!pair.pair_group_key)continue;
      beforeAfterPairs[pair.pair_group_key] ||= {pair_group_key:pair.pair_group_key,before:null,after:null};
      if(pair.pair_side)beforeAfterPairs[pair.pair_group_key][pair.pair_side]={media_id:String(row.media_id||''),target_key:row.target_key||'',target_label:row.target_label||row.target_key||''};
    }
    const missingAlt=photos.filter((p)=>p.decorative!==true&&!String(p.alt_text||'').trim()).length;
    const assignmentTrackingComplete=assignmentResult.ready===true&&(assignmentResult.rows||[]).length<1600;
    const hiddenNonPublic=Math.max(0,allRows.length-publicRows.length);
    return compactJson({
      ok:true,build:BUILD,schema,bucket_ready:!!getPublicAssetsBucket(env),db_ready:library.ready===true,assignment_db_ready:assignmentResult.ready===true,
      scan_mode:'managed_library_only',r2_scan_per_load:false,public_media_only:true,private_media_isolated:true,
      assignment_tracking:'per_photo_active_targets',assignment_tracking_complete:assignmentTrackingComplete,multi_placement_supported:true,
      photos,assignments,before_after_pairs:Object.values(beforeAfterPairs),
      stats:{photos:photos.length,hidden_non_public:hiddenNonPublic,live_r2:photos.filter(p=>p.r2_key).length,saved:photos.length,missing_alt:missingAlt,assigned:photos.filter(p=>p.assignment_count>0).length,unassigned:photos.filter(p=>p.assignment_count===0).length,before_after_assigned:photos.filter(p=>p.before_after_slots.length>0).length},
      warnings:[library.warning,assignmentResult.warning,schema.warning,!assignmentTrackingComplete&&assignmentResult.ready===true?'Active assignment tracking reached the 1600-row safety cap; review or archive stale placement history before relying on a complete placement audit.':''].filter(Boolean)
    });
  }catch(err){return compactJson({ok:false,build:BUILD,error:err?.message||'Could not load photo library.'},500);}
}
export async function onRequestPost(context){return onRequestGet(context);}
