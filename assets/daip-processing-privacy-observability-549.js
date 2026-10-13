// Build 549 — Private processing-job observability, never a rendered media or public-release claim.
const s=v=>String(v??"").trim(),arr=v=>Array.isArray(v)?v:[];
const interesting=new Set(["proxy_video","frame_extract","audio_extract","transcript","privacy_review","image_derivative"]);
export function build549DaipProcessingPrivacyReview({project_id="",projects=[],assets=[],processing_jobs=[]}={}){
 const pid=s(project_id),matchingProjects=arr(projects).filter(p=>s(p?.id)===pid);
 const project=matchingProjects.length===1?matchingProjects[0]:null;
 const media=arr(assets).filter(a=>pid&&s(a?.project_id)===pid);
 const jobs=arr(processing_jobs).filter(j=>pid&&s(j?.project_id)===pid);
 const rows=media.map(a=>{
  const id=s(a.id),key=s(a.object_key),owned=key.startsWith("projects/"+pid+"/raw/")&&!key.includes("../")&&!key.includes("//");
  const gaps=[];
  if(!owned||a.privacy_status!=="private_internal"||a.upload_status!=="uploaded")gaps.push("private_project_raw_asset_identity_unverified");
  if(a.consent_status!=="approved_public"||project?.consent_status!=="approved_public")gaps.push("public_consent_not_independently_proven");
  gaps.push("faces_plates_addresses_customer_metadata_redaction_artifacts_unverified");
  if(a.media_kind==="video")gaps.push("audio_licensing_and_source_rights_review_required");
  const related=jobs.filter(j=>s(j?.asset_id)===id&&interesting.has(s(j?.job_type)));
  const jobRows=related.map(j=>Object.freeze({
   kind:s(j.job_type),status:s(j.status)||"unknown",
   attempts:Number.isFinite(Number(j.attempt_count))?Number(j.attempt_count):0,
   dead_lettered:Boolean(j.dead_lettered_at),has_error:Boolean(s(j.last_error)),
   actual_private_output_verified:false,artifact_independently_inspected:false
  }));
  const failure=jobRows.some(j=>j.dead_lettered||["failed","blocked","cancelled"].includes(j.status));
  if(!jobRows.length)gaps.push("processing_job_source_records_unavailable");
  if(failure)gaps.push("operator_processing_failure_review_required");
  return Object.freeze({asset_id:id,filename:s(a.original_filename),media_kind:s(a.media_kind),
   job_count:jobRows.length,jobs:Object.freeze(jobRows),gaps:Object.freeze(gaps),
   status:failure?"processing_attention_required":"private_review_required",
   public_ready:false,raw_object_key_exposed:false});
 });
 return Object.freeze({build:549,authority:"daip_processing_privacy_observability",
  status:!pid?"choose_project":!project?"project_identity_review_required":!rows.length?"no_private_media":"private_review_required",
  project_id:pid||null,asset_count:rows.length,job_count:jobs.length,rows:Object.freeze(rows),
  job_status_is_metadata_only:true,proxy_verified:false,thumbnail_verified:false,transcript_verified:false,
  human_redaction_approved:false,audio_rights_verified:false,public_export_authorized:false,
  processor_dispatched_by_report:false,private_raw_media_mutated:false,read_only:true});
}
