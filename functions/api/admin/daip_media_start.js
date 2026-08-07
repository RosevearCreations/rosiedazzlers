import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {bucketFor,serviceReady,rest,jsonBody,clean,safeFilename,mediaKind,allowedContentType,objectKey,DEFAULT_PART_SIZE,expectedParts,publicBoundary} from '../_lib/daip-media.js';

export async function onRequest(context){
  if(context.request.method==='OPTIONS') return new Response('',{status:204});
  if(context.request.method!=='POST') return json({ok:false,error:'Method not allowed.'},405);
  const auth=await requireStaffAccess({request:context.request,env:context.env,capability:'manage_staff',allowLegacyAdminFallback:true});
  if(!auth.ok) return auth.response;
  if(!serviceReady(context.env)) return json({ok:false,error:'Supabase service configuration is missing.'},503);
  const {bucket,binding}=bucketFor(context.env);
  if(!bucket) return json({ok:false,error:'Private DAIP R2 binding is not configured.',expected_bindings:['DAIP_MEDIA_BUCKET','ROSIE_DAIP_MEDIA_BUCKET','PROJECT_MEDIA_BUCKET'],setup_route:'/admin-daip-media.html#setup'},503);
  const body=await jsonBody(context.request);
  const projectId=clean(body.project_id,80), filename=safeFilename(body.filename), size=Number(body.file_size_bytes||0), lastModified=Number(body.last_modified||0);
  if(!/^[0-9a-f-]{36}$/i.test(projectId)) return json({ok:false,error:'Valid Creative Project ID is required.'},400);
  if(!Number.isFinite(size)||size<=0) return json({ok:false,error:'A positive file size is required.'},400);
  const contentType=allowedContentType(body.content_type,filename);
  if(!contentType) return json({ok:false,error:'Unsupported file type. Use JPG/JPEG/PNG/WebP/HEIC/HEIF or MP4/MOV/M4V/WebM.'},415);
  const kind=mediaKind(contentType,filename), captureStage=clean(body.capture_stage,30)||'other', privacy=clean(body.privacy_status,40)||'private_internal', consent=clean(body.consent_status,40)||'not_reviewed';
  if(!['before','process','after','damage','interior','exterior','engine','other'].includes(captureStage)) return json({ok:false,error:'Invalid capture stage.'},400);
  if(privacy!=='private_internal') return json({ok:false,error:'Raw DAIP intake is private-only. Public publishing must happen through later review.'},409);
  let multipartUpload=null, createdAssetId=null;
  try{
    const project=(await rest(context.env,`creative_projects?select=id,project_code,title&id=eq.${encodeURIComponent(projectId)}&limit=1`))?.[0];
    if(!project) return json({ok:false,error:'Creative Project not found.'},404);
    const fingerprint=clean(body.client_fingerprint,300)||`${filename}:${size}:${lastModified}`;
    const completed=(await rest(context.env,`daip_project_media_assets?select=id,project_id,original_filename,file_size_bytes,media_kind,object_key,upload_status,uploaded_at&project_id=eq.${encodeURIComponent(projectId)}&original_filename=eq.${encodeURIComponent(filename)}&file_size_bytes=eq.${size}&upload_status=eq.uploaded&order=uploaded_at.desc&limit=1`))?.[0];
    if(completed) return json({ok:true,already_uploaded:true,asset:completed,binding,privacy_boundary:publicBoundary(),message:'An uploaded raw original with this filename and size already exists in this Creative Project.'});
    const existing=(await rest(context.env,`daip_media_upload_sessions?select=*,daip_project_media_assets(*)&project_id=eq.${encodeURIComponent(projectId)}&client_fingerprint=eq.${encodeURIComponent(fingerprint)}&status=in.(created,uploading,paused)&order=created_at.desc&limit=1`))?.[0];
    if(existing){
      const parts=await rest(context.env,`daip_media_upload_parts?select=part_number,etag,size_bytes&session_id=eq.${encodeURIComponent(existing.id)}&order=part_number.asc`);
      return json({ok:true,resume:true,session:existing,parts:parts||[],part_size_bytes:existing.part_size_bytes||DEFAULT_PART_SIZE,binding,privacy_boundary:publicBoundary()});
    }
    const assetId=crypto.randomUUID(), sessionId=crypto.randomUUID(); createdAssetId=assetId;
    const key=objectKey({projectId,assetId,kind,filename});
    const upload=await bucket.createMultipartUpload(key,{httpMetadata:{contentType},customMetadata:{project_id:projectId,asset_id:assetId,media_kind:kind,original_filename:filename}}); multipartUpload=upload;
    const partSize=DEFAULT_PART_SIZE,totalParts=expectedParts(size,partSize);
    if(totalParts>10000){ await upload.abort().catch(()=>{}); return json({ok:false,error:'File requires too many multipart chunks.'},413); }
    const actor=clean(auth.actor?.email,200)||null;
    await rest(context.env,'daip_project_media_assets',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({id:assetId,project_id:projectId,original_filename:filename,content_type:contentType,file_size_bytes:size,media_kind:kind,capture_stage:captureStage,privacy_status:privacy,consent_status:consent,storage_binding:binding,object_key:key,upload_status:'uploading',is_raw_original:true,created_by_staff_email:actor})});
    await rest(context.env,'daip_media_upload_sessions',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({id:sessionId,asset_id:assetId,project_id:projectId,client_fingerprint:fingerprint,multipart_upload_id:upload.uploadId,object_key:key,part_size_bytes:partSize,total_parts:totalParts,file_size_bytes:size,status:'uploading',last_modified_ms:lastModified,created_by_staff_email:actor})});
    await rest(context.env,'creative_project_audit',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({project_id:projectId,event_type:'media_upload_started',actor_staff_email:actor,safe_note:`Private raw ${kind} upload started: ${filename}.`})}).catch(()=>{});
    return json({ok:true,resume:false,session:{id:sessionId,asset_id:assetId,project_id:projectId,object_key:key,multipart_upload_id:upload.uploadId,total_parts:totalParts,file_size_bytes:size,status:'uploading'},parts:[],part_size_bytes:partSize,binding,privacy_boundary:publicBoundary()});
  }catch(error){
    if(multipartUpload) await multipartUpload.abort().catch(()=>{});
    if(createdAssetId) await rest(context.env,`daip_project_media_assets?id=eq.${encodeURIComponent(createdAssetId)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({upload_status:'failed',updated_at:new Date().toISOString()})}).catch(()=>{});
    return json({ok:false,error:error.message||'Could not create DAIP upload.',retryable:true},500);
  }
}
