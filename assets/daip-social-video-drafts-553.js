// Build 553 — editable private social package DRAFTS, never rendering or platform posting.
const clean=v=>String(v??"").trim();
const platforms=Object.freeze({instagram:{format:"9:16",limit:2200},tiktok:{format:"9:16",limit:2200},facebook:{format:"4:5",limit:5000},youtube:{format:"16:9",limit:5000}});
export function build553DaipSocialVideoDrafts({edit_list={},render_preflight={},project_id="",notes={}}={}){
 const pid=clean(project_id),gaps=[],shots=Array.isArray(edit_list.timeline)?edit_list.timeline:[];
 if(!pid||pid!==clean(edit_list.project_id))gaps.push("selected_private_project_identity_required");
 if(!shots.length||shots.some(s=>s.gaps?.length||!s.review_confirmed))gaps.push("editor_confirmed_private_shot_list_required");
 if(edit_list.raw_media_private!==true||edit_list.no_raw_media_url!==true)gaps.push("private_source_boundary_required");
 if(edit_list.media_rendered!==false||render_preflight?.private_render_completed===true)gaps.push("actual_output_inspection_separate_from_edit_plan_required");
 if(!clean(edit_list.audio_review_reference))gaps.push("audio_license_or_explicit_silence_required");
 const stages=new Set(shots.map(s=>clean(s.capture_stage))),angles=new Set(shots.map(s=>clean(s.camera_angle)).filter(Boolean));
 if(!stages.has("before")||!stages.has("after"))gaps.push("actual_before_after_source_coverage_required");
 if(angles.size<2)gaps.push("verified_multicamera_shot_evidence_required");
 const drafts=Object.entries(platforms).map(([platform,settings])=>{
  const editor=notes[platform]||{},title=clean(editor.title).slice(0,130),caption=clean(editor.caption).slice(0,settings.limit),
   hashtags=clean(editor.hashtags).slice(0,400),cta=clean(editor.call_to_action).slice(0,150),review=[];
  if(!title||!caption||!cta)review.push("operator_title_caption_and_cta_required");
  if(editor.factual_claims_reviewed!==true)review.push("factual_before_after_claim_review_required");
  if(editor.channel_approved===true)review.push("channel_approval_cannot_be_set_by_draft");
  return Object.freeze({platform,format:settings.format,title,caption,hashtags,call_to_action:cta,
    private_source_asset_ids:Object.freeze(shots.map(s=>clean(s.asset_id))),status:"draft_requires_human_review",
    gaps:Object.freeze(review),media_asset_url:null,media_file_rendered:false,queued_for_publishing:false});
 });
 return Object.freeze({build:553,authority:"daip_private_social_video_package_drafts",
  project_id:pid||null,status:gaps.length?"private_draft_source_review_required":"private_social_copy_drafts_ready_for_operator_review",
  gaps:Object.freeze(gaps),drafts:Object.freeze(drafts),source_private:true,render_executed:false,
  consent_to_publish_verified:false,redaction_output_inspected:false,
  public_social_posts_created:false,public_upload_authorized:false,
  private_edit_notes_only:true,manual_channel_approval_required:true});
}
