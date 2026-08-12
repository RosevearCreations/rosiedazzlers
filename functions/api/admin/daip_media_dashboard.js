import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {bucketFor,serviceReady,rest,clean,DEFAULT_PART_SIZE,publicBoundary} from '../_lib/daip-media.js';

export async function onRequest(context){
  if(context.request.method==='OPTIONS')return new Response('',{status:204});
  if(context.request.method!=='GET')return json({ok:false,error:'Method not allowed.'},405);
  const auth=await requireStaffAccess({request:context.request,env:context.env,capability:'manage_staff',allowLegacyAdminFallback:true});
  if(!auth.ok)return auth.response;
  const {binding}=bucketFor(context.env);
  if(!serviceReady(context.env))return json({ok:false,error:'Supabase service configuration is missing.',r2_binding_ready:!!binding},503);
  const projectId=clean(new URL(context.request.url).searchParams.get('project_id'),80);
  if(projectId&&!/^[0-9a-f-]{36}$/i.test(projectId))return json({ok:false,error:'Invalid project_id.'},400);
  try{
    const projectFilter=projectId?`&project_id=eq.${encodeURIComponent(projectId)}`:'';
    const [projects,assets,sessions,jobs]=await Promise.all([
      rest(context.env,'creative_projects?select=id,project_code,title,lifecycle_status,consent_status,public_publish_allowed&order=updated_at.desc&limit=150'),
      rest(context.env,`daip_project_media_assets?select=*&order=created_at.desc&limit=300${projectFilter}`),
      rest(context.env,`daip_media_upload_sessions?select=id,asset_id,project_id,client_fingerprint,object_key,part_size_bytes,total_parts,file_size_bytes,status,last_part_number,last_error,created_at,updated_at,completed_at,aborted_at&order=updated_at.desc&limit=300${projectFilter}`),
      rest(context.env,`daip_media_processing_jobs?select=*&order=created_at.desc&limit=500${projectFilter}`)
    ]);
    const selected=(assets||[]).filter(x=>x.story_review_status==='selected');
    const stages=[...new Set(selected.map(x=>x.capture_stage))];
    const problemJobs=(jobs||[]).filter(x=>['failed','blocked'].includes(x.status)||x.dead_lettered_at);
    return json({
      ok:true,
      build:248,
      r2_binding_ready:!!binding,
      r2_binding:binding||null,
      part_size_bytes:DEFAULT_PART_SIZE,
      projects:projects||[],assets:assets||[],sessions:sessions||[],processing_jobs:jobs||[],
      story_review_summary:{selected_count:selected.length,selected_stages:stages,problem_job_count:problemJobs.length,retry_controls:true,raw_media_public:false},
      privacy_boundary:publicBoundary(),
      warning:binding?null:'Create and bind a private R2 bucket as DAIP_MEDIA_BUCKET, then redeploy.'
    });
  }catch(error){
    return json({ok:false,error:error.message||'Could not load DAIP media dashboard.',r2_binding_ready:!!binding},500);
  }
}
