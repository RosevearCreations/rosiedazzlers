import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {bucketFor,serviceReady,rest,clean} from '../_lib/daip-media.js';
const UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
export async function onRequest(c){
 if(c.request.method==='OPTIONS')return new Response('',{status:204});
 if(c.request.method!=='GET')return json({ok:false,error:'Method not allowed.'},405);
 const auth=await requireStaffAccess({request:c.request,env:c.env,capability:'manage_staff',allowLegacyAdminFallback:true});if(!auth.ok)return auth.response;
 if(!serviceReady(c.env))return json({ok:false,error:'DAIP storage metadata service unavailable.'},503);
 const q=new URL(c.request.url).searchParams,p=clean(q.get('project_id'),80),a=clean(q.get('asset_id'),80);
 if(!UUID.test(p)||!UUID.test(a))return json({ok:false,error:'Valid project and asset IDs required.'},400);
 try{
  const [projects,assets]=await Promise.all([
   rest(c.env,`creative_projects?select=id,consent_status,public_publish_allowed&id=eq.${encodeURIComponent(p)}&limit=1`),
   rest(c.env,`daip_project_media_assets?select=id,project_id,object_key,upload_status,file_size_bytes,r2_etag,consent_status,media_kind&id=eq.${encodeURIComponent(a)}&project_id=eq.${encodeURIComponent(p)}&limit=1`)]);
  const project=projects?.[0],asset=assets?.[0];
  if(!project||!asset||asset.project_id!==p)return json({ok:false,error:'Project media not found.'},404);
  const {bucket}=bucketFor(c.env);if(!bucket)return json({ok:false,error:'Private R2 unavailable.'},503);
  const checked=asset.upload_status==='uploaded'&&typeof asset.object_key==='string'&&asset.object_key.startsWith(`projects/${p}/raw/`);
  const object=checked?await bucket.head(asset.object_key):null;
  const size=object?Number(object.size):null,expected=Number(asset.file_size_bytes);
  const sizeMatches=!!object&&Number.isSafeInteger(size)&&size>0&&Number.isSafeInteger(expected)&&expected>0&&size===expected;
  const stored=String(asset.r2_etag||'').replaceAll('"',''),observed=String(object?.httpEtag||object?.etag||'').replaceAll('"','');
  const etagMatches=!stored||!!object&&!!observed&&stored===observed;
  const result={ok:true,build:558,project_id:p,asset_id:a,private_raw_object_head_checked:checked,
   private_raw_object_exists:!!object,private_raw_size_bytes:size,recorded_size_bytes:Number.isSafeInteger(expected)?expected:null,
   private_raw_size_matches:!!sizeMatches,private_raw_etag_matches:!!etagMatches,upload_status:asset.upload_status,
   asset_consent_status:asset.consent_status,project_consent_status:project.consent_status,
   project_public_publish_allowed:project.public_publish_allowed===true,media_kind:asset.media_kind,
   derivative_artifact_verified:false,visual_or_audio_content_inspected:false,signed_customer_consent_independently_verified:false,
   public_export_allowed:false,storage_written:false};
  return new Response(JSON.stringify(result),{headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
 }catch{return json({ok:false,error:'Private artifact metadata verification unavailable.'},502)}
}
