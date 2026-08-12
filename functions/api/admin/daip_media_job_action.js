import { requireStaffAccess, json } from '../_lib/staff-auth.js';
import { serviceReady, rest, jsonBody, clean } from '../_lib/daip-media.js';

const UUID=/^[0-9a-f-]{36}$/i;
const ACTIONS=new Set(['retry','cancel','block','dead_letter']);

export async function onRequest(context){
  if(context.request.method==='OPTIONS')return json({},204);
  if(context.request.method!=='POST')return json({ok:false,error:'Method not allowed.'},405);
  const auth=await requireStaffAccess({request:context.request,env:context.env,capability:'manage_staff',allowLegacyAdminFallback:true});
  if(!auth.ok)return auth.response;
  if(!serviceReady(context.env))return json({ok:false,error:'Supabase service configuration is missing.'},503);
  const body=await jsonBody(context.request),jobId=clean(body.job_id,80),action=clean(body.action,30);
  if(!UUID.test(jobId))return json({ok:false,error:'Valid job_id is required.'},400);
  if(!ACTIONS.has(action))return json({ok:false,error:'Unknown processing-job action.'},400);
  try{
    const job=(await rest(context.env,`daip_media_processing_jobs?select=*&id=eq.${encodeURIComponent(jobId)}&limit=1`))?.[0];
    if(!job)return json({ok:false,error:'Processing job not found.'},404);
    const asset=(await rest(context.env,`daip_project_media_assets?select=id,project_id,object_key,media_kind,upload_status&id=eq.${encodeURIComponent(job.asset_id)}&limit=1`))?.[0];
    if(!asset)return json({ok:false,error:'Processing job source asset was not found.'},409);
    const now=new Date().toISOString(),email=clean(auth.actor?.email,200)||null,note=clean(body.review_note,1200)||null;
    let patch={updated_at:now,review_note:note};
    let message='Processing job updated.';
    if(action==='retry'){
      if(asset.upload_status!=='uploaded')return json({ok:false,error:'The private raw source must be fully uploaded before retrying processing.'},409);
      const attempts=Number(job.attempt_count||0),max=Number(job.max_attempts||3),force=Boolean(body.force);
      if(attempts>=max&&!force)return json({ok:false,error:`This job reached its ${max}-attempt limit. Use a forced operator retry only after reviewing the failure.`},409);
      patch={...patch,status:'queued',next_retry_at:now,dead_lettered_at:null,last_error:null};
      let dispatched=false;
      if(context.env.DAIP_PROCESSING_QUEUE&&typeof context.env.DAIP_PROCESSING_QUEUE.send==='function'){
        try{
          await context.env.DAIP_PROCESSING_QUEUE.send({job_id:job.id,project_id:job.project_id,asset_id:job.asset_id,job_type:job.job_type,object_key:asset.object_key,media_kind:asset.media_kind,retry:true});
          patch.status='dispatched';dispatched=true;
        }catch(queueError){
          patch.last_error=`Queue retry dispatch failed: ${String(queueError?.message||queueError).slice(0,700)}`;
        }
      }
      message=dispatched?'Processing retry dispatched.':'Processing retry queued in the database.';
    }else if(action==='cancel'){
      patch={...patch,status:'cancelled',next_retry_at:null};message='Processing job cancelled. Raw media was not deleted.';
    }else if(action==='block'){
      patch={...patch,status:'blocked',next_retry_at:null};message='Processing job blocked for operator review.';
    }else if(action==='dead_letter'){
      patch={...patch,status:'failed',next_retry_at:null,dead_lettered_at:now};message='Processing job moved to dead-letter review. Raw media was not deleted.';
    }
    await rest(context.env,`daip_media_processing_jobs?id=eq.${encodeURIComponent(jobId)}`,{method:'PATCH',headers:{Prefer:'return=minimal'},body:JSON.stringify(patch)});
    await rest(context.env,'creative_project_audit',{method:'POST',headers:{Prefer:'return=minimal'},body:JSON.stringify({project_id:job.project_id,event_type:action==='retry'?'media_job_retried':'media_processing_updated',actor_staff_email:email,safe_note:`DAIP processing job ${jobId} operator action: ${action}. Raw source remained private.`})}).catch(()=>{});
    return json({ok:true,job_id:jobId,action,status:patch.status||job.status,message,raw_media_deleted:false,public_destination_enabled:false});
  }catch(error){
    const message=error instanceof Error?error.message:String(error);
    return json({ok:false,error:message.includes('column')?'Build 248 migration is required before processing retry controls can be used.':message||'Could not update processing job.'},500);
  }
}
