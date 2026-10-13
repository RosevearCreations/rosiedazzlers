// Build 554: staff-only, locally exported approval evidence manifest. Never a post/dispatch API.
const tidy=v=>typeof v==="string"?v.trim():"";
const allowed=new Set(["instagram","tiktok","facebook","youtube"]);
export function build554DaipManualDeliveryPacket({private_drafts={},project_id="",platform="",approval={}}={}){
 const pid=tidy(project_id),channel=tidy(platform);
 const valid=private_drafts?.build===553&&private_drafts?.source_private===true&&
  private_drafts?.public_social_posts_created===false&&private_drafts?.project_id===pid;
 const draft=Array.isArray(private_drafts?.drafts)?private_drafts.drafts.find(d=>d.platform===channel):null;
 const gaps=[];
 if(!valid||!pid)gaps.push("current_private_creative_project_and_build553_drafts_required");
 if(!allowed.has(channel)||!draft||draft.gaps?.length||draft.status!=="draft_requires_human_review")gaps.push("complete_channel_specific_factual_copy_required");
 if(approval.operator_approved!==true||!tidy(approval.operator_reference))gaps.push("explicit_operator_channel_approval_required");
 if(approval.consent_current!==true||!tidy(approval.consent_reference))gaps.push("current_job_specific_public_consent_evidence_required");
 if(approval.faces_plates_addresses_inspected!==true||!tidy(approval.redaction_reference))gaps.push("inspected_rendered_output_redaction_evidence_required");
 if(approval.audio_rights_confirmed!==true||!tidy(approval.audio_rights_reference))gaps.push("actual_audio_rights_or_silence_evidence_required");
 if(approval.private_render_verified!==true||!tidy(approval.private_output_reference))gaps.push("actual_inspected_private_render_output_required");
 if(approval.worker_budget_verified!==true||!tidy(approval.worker_reference))gaps.push("measured_worker_cpu_storage_quota_evidence_required");
 if(approval.platform_authorization_verified!==true||!tidy(approval.platform_authorization_reference))gaps.push("actual_channel_api_scopes_limits_authority_required");
 return Object.freeze({build:554,authority:"daip_human_channel_delivery_evidence_review",project_id:pid||null,platform:channel||null,
  source_draft_title:tidy(draft?.title)||null,source_draft_format:tidy(draft?.format)||null,
  status:gaps.length?"private_delivery_hold":"manual_export_candidate_only",gaps:Object.freeze(gaps),
  evidence_references:Object.freeze({operator:tidy(approval.operator_reference)||null,consent:tidy(approval.consent_reference)||null,
   redaction:tidy(approval.redaction_reference)||null,audio:tidy(approval.audio_rights_reference)||null,
   private_output:tidy(approval.private_output_reference)||null,worker:tidy(approval.worker_reference)||null,
   platform_authorization:tidy(approval.platform_authorization_reference)||null}),
  dispatch_ledger:Object.freeze({channel,local_manifest_export_only:true,dispatch_attempted:false,delivery_verified:false,
   remote_post_id:null,withdrawal_performed:false,public_url:null,manual_platform_action_required:true}),
  raw_source_public:false,secret_exported:false,automatic_post_or_schedule:false,actual_video_rendered_by_this_review:false});
}
