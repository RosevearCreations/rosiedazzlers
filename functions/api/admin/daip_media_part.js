import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {bucketFor,serviceReady,rest,clean} from '../_lib/daip-media.js';

export async function onRequest(context){
  if(context.request.method==='OPTIONS') return new Response('',{status:204});
  if(context.request.method!=='PUT') return json({ok:false,error:'Method not allowed.'},405);
  const auth=await requireStaffAccess({request:context.request,env:context.env,capability:'manage_staff',allowLegacyAdminFallback:true});
  if(!auth.ok) return auth.response;
  if(!serviceReady(context.env)) return json({ok:false,error:'Supabase service configuration is missing.'},503);
  const {bucket}=bucketFor(context.env); if(!bucket) return json({ok:false,error:'Private DAIP R2 binding is not configured.'},503);
  const url=new URL(context.request.url),sessionId=clean(url.searchParams.get('session_id'),80),partNumber=Number(url.searchParams.get('part_number'));
  if(!/^[0-9a-f-]{36}$/i.test(sessionId)||!Number.isInteger(partNumber)||partNumber<1||partNumber>10000) return json({ok:false,error:'Valid session_id and part_number are required.'},400);
  if(!context.request.body) return json({ok:false,error:'Chunk body is required.'},400);
  try{
    const session=(await rest(context.env,`daip_media_upload_sessions?select=*&id=eq.${encodeURIComponent(sessionId)}&limit=1`))?.[0];
    if(!session) return json({ok:false,error:'Upload session not found.'},404);
    if(!['created','uploading','paused'].includes(session.status)) return json({ok:false,error:`Upload session is ${session.status}.`},409);
    if(partNumber>Number(session.total_parts||0)) return json({ok:false,error:'Part number exceeds expected part count.'},400);
    const recorded=(await rest(context.env,`daip_media_upload_parts?select=part_number,etag,size_bytes&session_id=eq.${encodeURIComponent(sessionId)}&part_number=eq.${partNumber}&limit=1`))?.[0];
    if(recorded) return json({ok:true,already_uploaded:true,part:{partNumber:Number(recorded.part_number),etag:recorded.etag,size_bytes:Number(recorded.size_bytes||0)}});
    const upload=bucket.resumeMultipartUpload(session.object_key,session.multipart_upload_id);
    const uploaded=await upload.uploadPart(partNumber,context.request.body);
    const size=Number(context.request.headers.get('content-length')||context.request.headers.get('x-part-size')||0);
    await rest(context.env,'daip_media_upload_parts',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({session_id:sessionId,part_number:uploaded.partNumber,etag:uploaded.etag,size_bytes:Math.max(0,size),uploaded_at:new Date().toISOString()})});
    await rest(context.env,`daip_media_upload_sessions?id=eq.${encodeURIComponent(sessionId)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'uploading',last_part_number:partNumber,last_error:null,updated_at:new Date().toISOString()})});
    return json({ok:true,part:{partNumber:uploaded.partNumber,etag:uploaded.etag,size_bytes:Math.max(0,size)}});
  }catch(error){
    await rest(context.env,`daip_media_upload_sessions?id=eq.${encodeURIComponent(sessionId)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({last_error:String(error.message||error).slice(0,1000),updated_at:new Date().toISOString()})}).catch(()=>{});
    return json({ok:false,error:error.message||'Chunk upload failed.',retryable:true},500);
  }
}
