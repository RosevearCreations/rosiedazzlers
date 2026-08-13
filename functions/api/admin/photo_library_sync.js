// Historical Build 253 compatibility token: build:253
import { requireStaffAccess, json } from '../_lib/staff-auth.js';
import { photoSchemaStatus, syncR2IntoLibrary } from '../_lib/photo-library.js';
export async function onRequestPost({request,env}){
  const access=await requireStaffAccess({request,env,capability:'manage_bookings',allowLegacyAdminFallback:true});
  if(!access.ok)return access.response;
  try{
    const schema=await photoSchemaStatus(env);
    if(!schema.ready)return json({ok:false,migration_required:true,migration:'sql/2026-08-12_build253_photo_management_studio.sql',error:'Apply the Build 253 photo-management migration before syncing R2 into the managed library.',schema},409);
    const result=await syncR2IntoLibrary(env,access.actor?.email||'staff');
    return json({ok:true,build:258,...result});
  }catch(err){return json({ok:false,error:err?.message||'Could not sync the R2 photo library.'},500);}
}
export async function onRequestGet(){return json({ok:false,error:'POST required.'},405);}
