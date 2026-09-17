// Historical Build 258 compatibility token: build:258
// Historical Build 253 compatibility token: build:253
// Build 260: subrequest-safe, prefix-bounded R2 synchronization.
// Build 408: truthful bucket/environment identity, continuation and retry evidence.
import { requireStaffAccess, json } from '../_lib/staff-auth.js';
import { APPROVED_IMAGE_PREFIXES, photoSchemaStatus, syncR2IntoLibrary } from '../_lib/photo-library.js';

const BUILD=408;
const EXPECTED_BINDINGS=['ROSIE_PUBLIC_ASSETS_BUCKET','PUBLIC_ASSETS_BUCKET','R2_PUBLIC_ASSETS_BUCKET','ASSETS_BUCKET'];
function bucketIdentity(env){
  const bindingName=EXPECTED_BINDINGS.find((name)=>env?.[name])||null;
  return {
    binding_name:bindingName,
    bucket_name:String(env?.PUBLIC_ASSETS_BUCKET_NAME||env?.R2_PUBLIC_ASSETS_BUCKET_NAME||'').trim()||null,
    environment:String(env?.APP_ENVIRONMENT||env?.CF_PAGES_BRANCH||env?.CF_PAGES_ENVIRONMENT||'unknown').trim()||'unknown',
    public_base_url:String(env?.PUBLIC_ASSET_BASE_URL||env?.ASSETS_PUBLIC_BASE_URL||'https://assets.rosiedazzlers.ca/').replace(/\/?$/,'/')
  };
}

export async function onRequestPost({request,env}){
  const body=await request.json().catch(()=>({}));
  const access=await requireStaffAccess({request,env,body,capability:'manage_bookings',allowLegacyAdminFallback:true});
  if(!access.ok)return access.response;
  const identity=bucketIdentity(env);
  try{
    const schema=await photoSchemaStatus(env);
    if(!schema.ready)return json({ok:false,build:BUILD,result_status:'unavailable',migration_required:true,migration:'sql/2026-08-12_build253_photo_management_studio.sql',error:'Apply the Build 253 photo-management migration before syncing R2 into the managed library.',schema,bucket_identity:identity},409);
    const requested=String(body?.prefix||'').trim();
    if(!requested)return json({ok:false,build:BUILD,error:'Build 260 sync requires one approved R2 prefix per request.',approved_prefixes:APPROVED_IMAGE_PREFIXES,bucket_identity:identity},400);
    if(!APPROVED_IMAGE_PREFIXES.includes(requested))return json({ok:false,build:BUILD,error:'That R2 prefix is not approved for the public Photo Studio.',approved_prefixes:APPROVED_IMAGE_PREFIXES,bucket_identity:identity},400);
    const cursor=String(body?.cursor||'').trim().slice(0,2048);
    const result=await syncR2IntoLibrary(env,access.actor?.email||'staff',{prefixes:[requested],cursor});
    const resultStatus=result?.bucket_ready!==true||result?.db_ready!==true?'unavailable':result?.has_more?'partial':'complete';
    return json({
      ok:resultStatus!=='unavailable',build:BUILD,mode:'single_prefix_page',result_status:resultStatus,
      partial_result:resultStatus==='partial',approved_prefixes:APPROVED_IMAGE_PREFIXES,bucket_identity:identity,
      retry:{prefix:requested,cursor:String(result?.next_cursor||''),same_request_safe:true},...result
    },resultStatus==='unavailable'?503:200);
  }catch(err){return json({ok:false,build:BUILD,result_status:'unavailable',bucket_identity:identity,error:err?.message||'Could not sync the R2 photo library.'},500);}
}
export async function onRequestGet(){return json({ok:false,build:BUILD,error:'POST required.'},405);}
