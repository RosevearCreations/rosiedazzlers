import {requireStaffAccess,json} from '../_lib/staff-auth.js';
import {serviceReady,rest,clean} from '../_lib/creative-projects.js';

const uuid=value=>/^[0-9a-f-]{36}$/i.test(String(value||''));

function workflowFor({project,assets=[],jobs=[],sessions=[],drafts=[]}){
  const uploaded=assets.filter(row=>row.upload_status==='uploaded');
  const reviewed=uploaded.filter(row=>['selected','excluded'].includes(row.story_review_status));
  const selected=uploaded.filter(row=>row.story_review_status==='selected');
  const selectedPublic=selected.filter(row=>row.consent_status==='approved_public');
  const stages=new Set(selected.map(row=>row.capture_stage));
  const approvedSessions=sessions.filter(row=>row.approved_for_story);
  const problemJobs=jobs.filter(row=>['failed','blocked'].includes(row.status)||row.dead_lettered_at);
  const openJobs=jobs.filter(row=>!['completed','cancelled'].includes(row.status));
  const beforeAfterReady=project.before_after_applicability==='not_applicable'||(stages.has('before')&&stages.has('after'));
  const packageApproved=project.content_package_status==='approved';
  const projectPublicConsent=project.consent_status==='approved_public'&&Boolean(project.public_publish_allowed);
  const allSelectedPublic=selected.length>0&&selectedPublic.length===selected.length;
  const blockers=[];
  if(!uploaded.length)blockers.push('Upload at least one private DAIP media item.');
  if(!selected.length)blockers.push('Select at least one uploaded private media item for story/public-derivative review.');
  if(!approvedSessions.length)blockers.push('Approve at least one Creative Project session for the content package.');
  if(!beforeAfterReady)blockers.push('Select both before and after evidence for this transformation project.');
  if(problemJobs.length)blockers.push('Resolve failed, blocked, or dead-lettered media processing jobs.');
  if(!packageApproved)blockers.push('Approve the Creative Project content package.');
  if(project.consent_status!=='approved_public')blockers.push('Project consent must explicitly allow public use.');
  if(!project.public_publish_allowed)blockers.push('Public publishing must be explicitly enabled on the Creative Project.');
  if(selected.length&&!allSelectedPublic)blockers.push('Every selected media item must have approved-public consent before a public derivative can be handed off.');
  const publicHandoffReady=packageApproved&&projectPublicConsent&&selected.length>0&&allSelectedPublic&&beforeAfterReady&&!problemJobs.length&&approvedSessions.length>0;
  return {
    project_id:project.id,
    project_code:project.project_code,
    title:project.title,
    lifecycle_status:project.lifecycle_status,
    content_package_status:project.content_package_status||'not_ready',
    content_package_reviewed_at:project.content_package_reviewed_at||null,
    project_consent_status:project.consent_status||'not_reviewed',
    project_public_publish_allowed:Boolean(project.public_publish_allowed),
    counts:{
      uploaded_private_media:uploaded.length,
      reviewed_private_media:reviewed.length,
      selected_private_media:selected.length,
      selected_public_consent:selectedPublic.length,
      approved_story_sessions:approvedSessions.length,
      drafts:drafts.length,
      processing_open:openJobs.length,
      processing_problems:problemJobs.length
    },
    selected_stages:[...stages],
    before_after_ready:beforeAfterReady,
    review_complete:selected.length>0,
    content_package_approved:packageApproved,
    public_handoff_ready:publicHandoffReady,
    blockers,
    boundaries:{
      raw_media_public:false,
      raw_media_copy_to_public:false,
      auto_publish:false,
      auto_processing_started_by_this_endpoint:false,
      photo_studio_is_public_asset_authority:true,
      explicit_human_review_required:true
    },
    handoff_manifest:publicHandoffReady?{
      project_id:project.id,
      selected_private_asset_ids:selected.map(row=>row.id),
      selected_asset_count:selected.length,
      raw_object_keys_included:false,
      raw_urls_included:false,
      destination:'Photo Studio approved-public derivative review'
    }:null,
    links:{
      creative_project:`/admin-creative-projects.html?project_id=${encodeURIComponent(project.id)}`,
      private_media:`/admin-daip-media.html?project_id=${encodeURIComponent(project.id)}`,
      photo_studio:publicHandoffReady?`/admin-photo-studio.html?source=daip&project_id=${encodeURIComponent(project.id)}`:null
    }
  };
}

export async function onRequest(context){
  if(context.request.method==='OPTIONS')return new Response('',{status:204});
  if(context.request.method!=='GET')return json({ok:false,error:'Method not allowed.'},405);
  const auth=await requireStaffAccess({request:context.request,env:context.env,capability:'manage_staff',allowLegacyAdminFallback:true});
  if(!auth.ok)return auth.response;
  if(!serviceReady(context.env))return json({ok:false,error:'Supabase service configuration is missing.'},503);
  const projectId=clean(new URL(context.request.url).searchParams.get('project_id'),80);
  if(projectId&&!uuid(projectId))return json({ok:false,error:'Invalid project_id.'},400);
  try{
    const projects=await rest(context.env,'creative_projects?select=id,project_code,title,lifecycle_status,consent_status,public_publish_allowed,content_package_status,content_package_reviewed_at,before_after_applicability&order=updated_at.desc&limit=150');
    if(!projectId)return json({
      ok:true,
      build:352,
      projects:projects||[],
      boundary:'Read-only workflow index. No media is copied, processed, published, or made public by loading this endpoint.'
    });
    const project=(projects||[]).find(row=>row.id===projectId);
    if(!project)return json({ok:false,error:'Creative Project not found.'},404);
    const [assets,jobs,sessions,drafts]=await Promise.all([
      rest(context.env,`daip_project_media_assets?select=id,media_kind,capture_stage,consent_status,upload_status,story_review_status,story_sort_order&project_id=eq.${encodeURIComponent(projectId)}&order=story_sort_order.asc.nullslast,created_at.asc&limit=500`),
      rest(context.env,`daip_media_processing_jobs?select=id,status,dead_lettered_at&project_id=eq.${encodeURIComponent(projectId)}&order=created_at.desc&limit=500`),
      rest(context.env,`creative_project_sessions?select=id,approved_for_story&project_id=eq.${encodeURIComponent(projectId)}&order=started_at.asc&limit=500`),
      rest(context.env,`creative_project_output_drafts?select=id,review_status&project_id=eq.${encodeURIComponent(projectId)}&limit=500`)
    ]);
    return json({
      ok:true,
      build:352,
      projects:projects||[],
      workflow:workflowFor({project,assets:assets||[],jobs:jobs||[],sessions:sessions||[],drafts:drafts||[]})
    });
  }catch(error){
    return json({ok:false,error:error.message||'Could not load DAIP media workflow.'},500);
  }
}
