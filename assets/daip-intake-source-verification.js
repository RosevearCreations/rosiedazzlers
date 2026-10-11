// Build 548 — private metadata-only DAIP source verification. Never asserts actual R2 HEAD or processor output.
const clean=x=>String(x??"").trim();
const typeOK=new Set(["video/mp4","video/quicktime","video/webm","video/x-m4v","image/jpeg","image/png","image/webp","image/heic","image/heif"]);
export function buildDaipIntakeVerification({project_id="",assets=[],sessions=[],processing_jobs=[]}={}){
 const pid=clean(project_id);
 const projectAssets=Array.isArray(assets)?assets.filter(a=>clean(a?.project_id)===pid):[];
 const projectSessions=Array.isArray(sessions)?sessions.filter(s=>clean(s?.project_id)===pid):[];
 const jobs=Array.isArray(processing_jobs)?processing_jobs.filter(j=>clean(j?.project_id)===pid):[];
 const seen=new Map(),rows=[];
 for(const a of projectAssets){
   const errors=[],size=Number(a.file_size_bytes),assetId=clean(a.id),key=clean(a.object_key);
   const fingerprint=clean(a.client_fingerprint||a.content_hash||a.sha256);
   if(!assetId)errors.push("asset_identifier_missing");
   if(!Number.isSafeInteger(size)||size<=0)errors.push("file_size_unverified");
   if(!typeOK.has(clean(a.content_type).toLowerCase()))errors.push("supported_mime_type_unverified");
   if(!key.startsWith("projects/"+pid+"/raw/")||key.includes("../")||key.includes("//"))errors.push("private_project_raw_key_mismatch");
   if(a.privacy_status!=="private_internal"||a.public_destination_enabled===true||a.is_raw_original!==true)
       errors.push("raw_private_boundary_unverified");
   if(a.upload_status!=="uploaded")errors.push("multipart_upload_not_complete");
   const matched=projectSessions.filter(s=>clean(s.asset_id)===assetId);
   if(matched.length!==1||matched[0].status!=="uploaded")errors.push("completed_multipart_session_unverified");
   if(matched.length===1 && (clean(matched[0].object_key)!==key||Number(matched[0].file_size_bytes)!==size))
      errors.push("multipart_session_asset_identity_mismatch");
   if(fingerprint){
     const prev=seen.get(fingerprint);
     if(prev)errors.push("candidate_duplicate_fingerprint_needs_manual_review");
     seen.set(fingerprint,assetId);
   }else errors.push("content_fingerprint_not_available");
   if(a.media_kind==="video"&&!(Number(a.duration_seconds)>0))errors.push("video_duration_not_verified");
   const hasPendingJobs=jobs.filter(j=>clean(j.asset_id)===assetId).some(j=>["queued","dispatched","processing","review"].includes(j.status));
   rows.push(Object.freeze({asset_id:assetId,original_filename:clean(a.original_filename),
     media_kind:clean(a.media_kind),size_bytes:Number.isFinite(size)?size:null,
     review_state:errors.length?"source_verification_required":"metadata_identity_verified_only",
     missing:Object.freeze([...new Set(errors)]),pending_processing_job:hasPendingJobs,
     proxy_rendered:false,r2_object_head_verified:false,public_derivative_approved:false}));
 }
 rows.sort((a,b)=>a.asset_id.localeCompare(b.asset_id));
 return Object.freeze({build:548,authority:"daip_private_intake_source_verification",
  project_id:pid||null,status:!pid?"choose_project":!rows.length?"no_private_assets":rows.some(r=>r.missing.length)?"review_required":"metadata_review_ready",
  asset_count:rows.length,flagged_count:rows.filter(r=>r.missing.length).length,
  rows:Object.freeze(rows),processing_job_count:jobs.length,metadata_review_only:true,
  actual_r2_object_head_checked:false,actual_proxy_generated:false,render_job_queued_by_report:false,
  persistent_changes:false,raw_media_private:true,public_publishing_authorized:false});
}
