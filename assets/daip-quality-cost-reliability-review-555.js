// Build 555 — private metadata-only DAIP quality, cost, reliability, backlog review.
const clean=x=>typeof x==="string"?x.trim():"";
const arr=x=>Array.isArray(x)?x:[];
const count=x=>typeof x==="number"&&Number.isFinite(x)&&x>=0?x:null;
const iso=x=>{const t=Date.parse(clean(x));return Number.isFinite(t)?new Date(t).toISOString():null};
export function build555DaipQualityReliabilityReview({project_id="",projects=[],assets=[],processing_jobs=[],measurements={}}={}){
 const pid=clean(project_id),project=arr(projects).find(x=>clean(x?.id)===pid);
 const media=arr(assets).filter(x=>pid&&clean(x?.project_id)===pid),jobs=arr(processing_jobs).filter(x=>pid&&clean(x?.project_id)===pid);
 const video=media.filter(x=>x?.media_kind==="video"),selected=media.filter(x=>x?.story_review_status==="selected");
 const stages=new Set(selected.map(x=>clean(x.capture_stage)));
 const errors=jobs.filter(x=>["failed","blocked","cancelled"].includes(clean(x?.status))||Boolean(x?.dead_lettered_at));
 const waiting=jobs.filter(x=>["pending","queued","retry","running","processing"].includes(clean(x?.status)));
 const completed=jobs.filter(x=>["complete","completed","succeeded"].includes(clean(x?.status)));
 const gaps=[];
 if(!pid||!project)gaps.push("existing_private_creative_project_required");
 if(!media.length)gaps.push("genuine_uploaded_project_footage_required");
 if(!stages.has("before")||!stages.has("after"))gaps.push("observed_before_after_source_coverage_required");
 if(!jobs.length)gaps.push("real_processor_job_records_missing");
 if(errors.length)gaps.push("processor_failures_need_manual_recovery");
 // An operator-input assertion is neither provider proof nor verified attribution.
 const measured={
  editing_minutes:count(measurements.editing_minutes),worker_cpu_ms:count(measurements.worker_cpu_ms),
  processing_cost_cad:count(measurements.processing_cost_cad),observed_views:count(measurements.observed_views),
  observed_leads:count(measurements.observed_leads),attributed_revenue_cad:count(measurements.attributed_revenue_cad)
 };
 const ref=clean(measurements.evidence_reference),observed=iso(measurements.observed_at);
 if(!ref||!observed||Object.values(measured).some(v=>v===null))gaps.push("complete_dated_source_measurement_with_provenance_required");
 if(!clean(measurements.window_definition)||!clean(measurements.attribution_method)||!clean(measurements.confounders))gaps.push("like_for_like_window_attribution_and_confounders_required");
 if(!clean(measurements.verified_render_reference)||!clean(measurements.verified_delivery_reference))gaps.push("independently_inspected_render_and_channel_delivery_required");
 if(!clean(measurements.worker_quota_reference))gaps.push("observed_provider_quota_cpu_storage_evidence_required");
 const isRecord=Boolean(pid&&project&&ref&&observed&&Object.values(measured).every(v=>v!==null));
 return Object.freeze({build:555,authority:"daip_measured_quality_cost_reliability_review",project_id:pid||null,
  status:gaps.length?"private_measurement_review_hold":"operator_measurement_package_requires_independent_acceptance",
  quality:Object.freeze({private_asset_count:media.length,video_asset_count:video.length,story_selected_count:selected.length,
   before_after_source_stages_observed:stages.has("before")&&stages.has("after"),rendered_video_output_verified:false,
   inspected_redaction_verified:false,customer_consent_reverified:false}),
  reliability:Object.freeze({processing_job_count:jobs.length,failed_or_dead_lettered_job_count:errors.length,queue_or_running_count:waiting.length,
   completed_job_metadata_count:completed.length,completed_job_does_not_prove_file:true,provider_cpu_quota_verified:false}),
  metrics:Object.freeze({measurement_source_reference:ref||null,observed_at:observed,operator_supplied_metrics:isRecord?Object.freeze(measured):null,
   metric_verification:"operator_entered_not_provider_verified",attributable_roi_verified:false,causal_effect_inferred:false}),
  gaps:Object.freeze(gaps),public_media_url_created:false,social_post_created:false,db_or_storage_written:false,
  raw_customer_media_exposed:false,publish_or_render_authorized:false});
}
