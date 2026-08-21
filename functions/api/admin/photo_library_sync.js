// Historical Build 258 compatibility token: build:258
// Historical Build 253 compatibility token: build:253
// Build 260: subrequest-safe, prefix-bounded R2 synchronization.
import { requireStaffAccess, json } from '../_lib/staff-auth.js';
import { APPROVED_IMAGE_PREFIXES, photoSchemaStatus, syncR2IntoLibrary } from '../_lib/photo-library.js';

export async function onRequestPost({request,env}){
  const body=await request.json().catch(()=>({}));
  const access=await requireStaffAccess({request,env,body,capability:'manage_bookings',allowLegacyAdminFallback:true});
  if(!access.ok)return access.response;
  try{
    const schema=await photoSchemaStatus(env);
    if(!schema.ready)return json({ok:false,migration_required:true,migration:'sql/2026-08-12_build253_photo_management_studio.sql',error:'Apply the Build 253 photo-management migration before syncing R2 into the managed library.',schema},409);
    const requested=String(body?.prefix||'').trim();
    if(!requested)return json({ok:false,error:'Build 260 sync requires one approved R2 prefix per request.',approved_prefixes:APPROVED_IMAGE_PREFIXES},400);
    if(!APPROVED_IMAGE_PREFIXES.includes(requested))return json({ok:false,error:'That R2 prefix is not approved for the public Photo Studio.',approved_prefixes:APPROVED_IMAGE_PREFIXES},400);
    const cursor=String(body?.cursor||'').trim().slice(0,2048);
    const result=await syncR2IntoLibrary(env,access.actor?.email||'staff',{prefixes:[requested],cursor});
    return json({ok:true,build:260,mode:'single_prefix_page',approved_prefixes:APPROVED_IMAGE_PREFIXES,...result});
  }catch(err){return json({ok:false,error:err?.message||'Could not sync the R2 photo library.'},500);}
}
export async function onRequestGet(){return json({ok:false,error:'POST required.'},405);}
