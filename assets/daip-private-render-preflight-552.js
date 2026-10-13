// Build 552 — quota-aware PRIVATE render manifest. Not a renderer or R2 writer.
// Source binding, redaction proof and approved worker deployment remain separate gates.
const clean=x=>String(x??"").trim();
const finite=x=>x!==null&&x!==""&&Number.isFinite(Number(x))?Number(x):null;
const formats={"9:16":[1080,1920],"16:9":[1920,1080],"4:5":[1080,1350]};
export function build552PrivateDaipRenderPlan({edit_list={},worker_capabilities={},policy={}}={}){
 const rows=Array.isArray(edit_list?.timeline)?edit_list.timeline:[],gaps=[];
 const format=clean(edit_list?.canvas),size=formats[format];
 const duration=finite(edit_list?.estimated_duration_seconds),maxDuration=finite(policy.max_duration_seconds)??120;
 const bytes=finite(policy.private_r2_available_bytes),maxCpuMs=finite(policy.max_worker_cpu_ms);
 const actualVerified=worker_capabilities?.private_ffmpeg_runner_observed===true&&
   worker_capabilities?.source_r2_object_head_verified===true&&worker_capabilities?.private_destination_binding_verified===true;
 if(!size)gaps.push("supported_canvas_required");
 if(!rows.length||rows.some(r=>r.gaps?.length||!r.review_confirmed||!clean(r.asset_id)))gaps.push("all_private_source_edit_shots_editor_approved_required");
 if(duration===null||duration<=0||duration>maxDuration)gaps.push("duration_exceeds_declared_quota_or_missing");
 if(bytes===null||bytes<=0||maxCpuMs===null||maxCpuMs<=0)gaps.push("private_r2_capacity_and_worker_cpu_budget_required");
 if(clean(edit_list.audio_review_reference)==="")gaps.push("explicit_audio_silence_or_license_reference_required");
 if(edit_list?.raw_media_private!==true||edit_list?.no_raw_media_url!==true||edit_list?.media_rendered!==false)gaps.push("private_edit_source_boundary_required");
 if(!actualVerified)gaps.push("observed_private_ffmpeg_source_destination_worker_capability_required");
 if(worker_capabilities?.redaction_artifact_inspected!==true)gaps.push("independently_inspected_private_redaction_artifact_required");
 if(worker_capabilities?.consent_evidence_current!==true)gaps.push("source_owned_consent_evidence_required");
 const estimatedMb=duration!==null&&size?Math.ceil(duration*1.25):null;
 if(bytes!==null&&estimatedMb!==null&&bytes<estimatedMb*1024*1024)gaps.push("private_storage_budget_insufficient");
 // Never accept raw keys, secrets or freeform shell arguments as part of this manifest.
 const shots=rows.map(r=>Object.freeze({asset_id:clean(r.asset_id),start_seconds:r.trim_in_seconds,end_seconds:r.trim_out_seconds,
     speed:r.speed,order:r.order,crop_mode:r.crop_mode,caption:r.caption,review_confirmed:r.review_confirmed===true}));
 return Object.freeze({build:552,authority:"daip_private_bounded_render_preflight",status:gaps.length?"private_render_blocked_requires_worker_and_privacy_evidence":"private_render_candidate_requires_operator_start",
  project_id:clean(edit_list?.project_id)||null,canvas:format||null,dimensions:size?Object.freeze([...size]):null,
  estimated_duration_seconds:duration,estimated_output_megabytes:estimatedMb,declared_cpu_budget_ms:maxCpuMs,
  shot_count:shots.length,shot_plan:Object.freeze(shots),gaps:Object.freeze(gaps),
  worker_execution_attempted:false,ffmpeg_invoked:false,output_file_created:false,
  private_r2_write_performed:false,public_bucket_write_performed:false,raw_master_mutated:false,
  redaction_verified_by_this_function:false,private_render_completed:false,
  social_publish_authorized:false,operator_manual_dispatch_required:true,
  worker_adapter_required:true,explicit_output_inspection_required:true});
}
