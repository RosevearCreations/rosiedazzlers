// Build 842 — centralized fail-closed source/consent and handoff verification.
// This does not assert that a public derivative has independent provenance.
import {rest} from './creative-projects.js';
import {workflowFor} from '../admin/daip_media_workflow.js';

export const SOURCE_TYPE_842='daip_job_media_tag';
export const HANDOFF_842='derivative_handoff_review';
export function ownerActor842(actor={}){
  return actor.is_admin===true||actor.is_legacy_admin===true||(
    actor.can_manage_staff===true&&actor.can_manage_bookings===true&&actor.can_manage_promos===true
  );
}
export async function sourceGate842(env,post){
  if(post?.source_type!==SOURCE_TYPE_842)return {ok:true,not_842:true};
  if(!post.booking_id||!post.source_id)return {ok:false,reason:'Missing booking/source binding.'};
  const projectRows=await rest(env,`creative_projects?select=id,project_code,title,lifecycle_status,consent_status,public_publish_allowed,content_package_status,content_package_reviewed_at,before_after_applicability,consent_expires_at,source_booking_id&source_booking_id=eq.${encodeURIComponent(post.booking_id)}&limit=2`);
  if(projectRows?.length!==1)return {ok:false,reason:'No unique DAIP Creative Project for this booking.'};
  const project=projectRows[0];
  if(project.consent_expires_at&&Date.parse(project.consent_expires_at)<=Date.now())return {ok:false,reason:'DAIP public consent has expired.'};
  const [media,assets,jobs,sessions,tag]=await Promise.all([
    rest(env,`job_media?select=id,booking_id,kind&booking_id=eq.${encodeURIComponent(post.booking_id)}&id=eq.${encodeURIComponent(post.source_id)}&limit=1`),
    rest(env,`daip_project_media_assets?select=id,capture_stage,consent_status,upload_status,story_review_status&project_id=eq.${encodeURIComponent(project.id)}&limit=500`),
    rest(env,`daip_media_processing_jobs?select=id,status,dead_lettered_at&project_id=eq.${encodeURIComponent(project.id)}&limit=500`),
    rest(env,`creative_project_sessions?select=id,approved_for_story&project_id=eq.${encodeURIComponent(project.id)}&limit=500`),
    rest(env,`creative_project_audit?select=id&project_id=eq.${encodeURIComponent(project.id)}&event_type=eq.updated&safe_note=eq.${encodeURIComponent(`Build 841 job media source tag: ${post.source_id}; metadata only, no media copied or published.`)}&limit=1`)
  ]);
  if(!media?.length||!tag?.length)return {ok:false,reason:'Source media or original DAIP source-tag audit is missing.'};
  const workflow=workflowFor({project,assets:assets||[],jobs:jobs||[],sessions:sessions||[]});
  if(!workflow.public_handoff_ready)return {ok:false,project_id:project.id,reason:'DAIP public-derivative approval is HOLD.',blockers:workflow.blockers};
  return {ok:true,project_id:project.id,source_id:post.source_id,workflow};
}
export async function verifyAttachedDerivative842(env,post){
  if(post?.source_type!==SOURCE_TYPE_842)return {ok:true,not_842:true};
  const gate=await sourceGate842(env,post);
  if(!gate.ok)return gate;
  const urls=Array.isArray(post.media_urls)?post.media_urls:[];
  if(urls.length!==1)return {ok:false,reason:'Exactly one approved public derivative is required for this tagged job post.'};
  const attempts=await rest(env,`social_dispatch_attempts?select=id,status,request_summary,response_summary,created_at&social_post_id=eq.${encodeURIComponent(post.id)}&status=eq.${HANDOFF_842}&order=created_at.desc&limit=30`);
  const audit=(attempts||[]).find(row=>row.response_summary?.public_url===urls[0]&&row.response_summary?.project_id===gate.project_id&&row.response_summary?.source_id===post.source_id&&row.response_summary?.operator_lineage_attested===true);
  if(!audit)return {ok:false,reason:'No matching owner-attested approved-public derivative handoff audit.'};
  return {...gate,handoff_audit_id:audit.id,public_url:urls[0],lineage_independently_verified:false};
}
