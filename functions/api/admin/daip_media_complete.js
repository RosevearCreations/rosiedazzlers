import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {bucketFor,serviceReady,rest,jsonBody,clean,processingJobs} from '../_lib/daip-media.js';

export async function onRequest(context){
  if(context.request.method==='OPTIONS') return new Response('',{status:204});
  if(context.request.method!=='POST') return json({ok:false,error:'Method not allowed.'},405);
  const auth=await requireStaffAccess({request:context.request,env:context.env,capability:'manage_staff',allowLegacyAdminFallback:true}); if(!auth.ok)return auth.response;
  if(!serviceReady(context.env))return json({ok:false,error:'Supabase service configuration is missing.'},503);
  const {bucket}=bucketFor(context.env); if(!bucket)return json({ok:false,error:'Private DAIP R2 binding is not configured.'},503);
  const body=await jsonBody(context.request),sessionId=clean(body.session_id,80);
  if(!/^[0-9a-f-]{36}$/i.test(sessionId))return json({ok:false,error:'Valid session_id is required.'},400);
  try{
    const session=(await rest(context.env,`daip_media_upload_sessions?select=*&id=eq.${encodeURIComponent(sessionId)}&limit=1`))?.[0]; if(!session)return json({ok:false,error:'Upload session not found.'},404);
    const asset=(await rest(context.env,`daip_project_media_assets?select=*&id=eq.${encodeURIComponent(session.asset_id)}&limit=1`))?.[0]; if(!asset)return json({ok:false,error:'DAIP media asset not found.'},404);
    const parts=await rest(context.env,`daip_media_upload_parts?select=part_number,etag,size_bytes&session_id=eq.${encodeURIComponent(sessionId)}&order=part_number.asc`);
    if((parts||[]).length!==Number(session.total_parts))return json({ok:false,error:`Upload is incomplete: ${(parts||[]).length}/${session.total_parts} parts recorded.`},409);
    const expected=Array.from({length:Number(session.total_parts)},(_,i)=>i+1); const actual=(parts||[]).map(p=>Number(p.part_number));
    if(expected.some((n,i)=>actual[i]!==n))return json({ok:false,error:'Uploaded part sequence is incomplete.'},409);
    let object=await bucket.head(session.object_key).catch(()=>null);
    if(!object){
      const upload=bucket.resumeMultipartUpload(session.object_key,session.multipart_upload_id);
      object=await upload.complete(parts.map(p=>({partNumber:Number(p.part_number),etag:p.etag})));
    }
    const now=new Date().toISOString(),actor=clean(auth.actor?.email,200)||null;
    await rest(context.env,`daip_media_upload_sessions?id=eq.${encodeURIComponent(sessionId)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({status:'uploaded',completed_at:now,last_error:null,updated_at:now})});
    await rest(context.env,`daip_project_media_assets?id=eq.${encodeURIComponent(asset.id)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({upload_status:'uploaded',r2_etag:object.httpEtag||object.etag||null,uploaded_at:now,updated_at:now})});
    const jobs=processingJobs(asset.media_kind).map(job_type=>({project_id:asset.project_id,asset_id:asset.id,job_type,status:'queued',priority:100,created_by_staff_email:actor}));
    if(jobs.length)await rest(context.env,'daip_media_processing_jobs',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates,return=minimal'},body:JSON.stringify(jobs)});
    let queueDispatched=false;
    if(context.env.DAIP_PROCESSING_QUEUE && typeof context.env.DAIP_PROCESSING_QUEUE.send==='function'){
      try{
        for(const job of jobs){ await context.env.DAIP_PROCESSING_QUEUE.send({project_id:asset.project_id,asset_id:asset.id,job_type:job.job_type,object_key:asset.object_key,media_kind:asset.media_kind}); }
        queueDispatched=true;
      }catch(queueError){
        await rest(context.env,`daip_media_processing_jobs?asset_id=eq.${encodeURIComponent(asset.id)}&status=eq.queued`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify({last_error:`Queue dispatch failed: ${String(queueError.message||queueError).slice(0,700)}`,updated_at:now})}).catch(()=>{});
      }
    }
    await rest(context.env,'creative_project_audit',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({project_id:asset.project_id,event_type:'media_upload_completed',actor_staff_email:actor,safe_note:`Private raw ${asset.media_kind} upload completed: ${asset.original_filename}. Processing jobs queued.`})}).catch(()=>{});
    return json({ok:true,asset_id:asset.id,object_key:asset.object_key,etag:object.httpEtag||object.etag||null,processing_jobs:jobs.map(j=>j.job_type),queue_dispatched:queueDispatched,message:queueDispatched?'Raw original stored privately and processing jobs were dispatched. No public output was created.':'Raw original stored privately. Processing jobs are recorded in the database and await a configured DAIP_PROCESSING_QUEUE consumer; no public output was created.'});
  }catch(error){return json({ok:false,error:error.message||'Could not complete DAIP upload.'},500)}
}
