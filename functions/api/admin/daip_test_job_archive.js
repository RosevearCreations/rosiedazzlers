// Build 218 — archive an internal DAIP test job without deleting metadata or audit history.
import { requireStaffAccess, serviceHeaders, json, isUuid } from '../_lib/staff-auth.js';
import { readTestControl, readInternalTestJob, ARCHIVE_TEST_PHRASE, appendAuditEvent, daipError, withCors, corsHeaders, DAIP_BUILD } from '../_lib/daip-test-mode.js';
export async function onRequestOptions(){return new Response('',{status:204,headers:corsHeaders()});}
export async function onRequestPost({request,env}){
 try{
  const body=await request.json().catch(()=>({})); const access=await requireStaffAccess({request,env,body,capability:'manage_staff',allowLegacyAdminFallback:true}); if(!access.ok)return withCors(access.response);
  const control=await readTestControl(env); if(!control.ok)return daipError(control.error,409);
  const jobId=String(body.media_job_id||'').trim(); const jobResult=await readInternalTestJob(env,jobId); if(!jobResult.ok)return daipError(jobResult.error,jobResult.status||400);
  if(body.confirmation!==ARCHIVE_TEST_PHRASE)return daipError(`Type ${ARCHIVE_TEST_PHRASE} to archive this internal test job.`,400);
  if(jobResult.job.status==='archived')return withCors(json({ok:true,build:DAIP_BUILD,already_archived:true}));
  const now=new Date().toISOString(); const patch={status:'archived',archived_at:now,archived_by_staff_user_id:isUuid(access.actor?.id)?access.actor.id:null,updated_at:now};
  const res=await fetch(`${env.SUPABASE_URL}/rest/v1/daip_media_jobs?id=eq.${encodeURIComponent(jobId)}`,{method:'PATCH',headers:{...serviceHeaders(env),Prefer:'return=representation'},body:JSON.stringify(patch)}); if(!res.ok)return daipError('Could not archive the DAIP internal test job.',500);
  await fetch(`${env.SUPABASE_URL}/rest/v1/daip_processing_tasks?media_job_id=eq.${encodeURIComponent(jobId)}&status=neq.ready_for_manual_review`,{method:'PATCH',headers:serviceHeaders(env),body:JSON.stringify({status:'cancelled',updated_at:now})});
  await appendAuditEvent(env,{media_job_id:jobId,actor_staff_user_id:access.actor?.id,event_type:'test_job_archived',reason:'Internal test job archived. No media or audit data was deleted.',safe_metadata:{build:DAIP_BUILD,public_export_blocked:true}});
  return withCors(json({ok:true,build:DAIP_BUILD,status:'archived'}));
 }catch(err){return withCors(json({ok:false,error:err?.message||'Could not archive DAIP test job.'},500));}
}
