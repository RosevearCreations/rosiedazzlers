// Build 547: private Creative Project multi-angle editorial storyboards; does not render or publish media.
const clean=x=>String(x??"").trim();
const stages=["before","process","after","interior","exterior","engine","other"];
const targets=Object.freeze([
 {platform:"youtube",format:"16:9",kind:"long_form",count:1},
 {platform:"facebook",format:"4:5",kind:"local_trust_transformation_service",count:3},
 {platform:"instagram",format:"9:16",kind:"hook_process_reveal_service_finish",count:5},
 {platform:"tiktok",format:"9:16",kind:"dirty_clean_action_extraction_reveal_local_cta",count:5}
]);
export function buildDaipPrivateStoryboards({project_id="",assets=[],camera_angles={}}={}){
 const id=clean(project_id);
 const candidates=Array.isArray(assets)?assets.filter(a=>a?.project_id===id&&a?.story_review_status==="selected"&&a?.upload_status==="uploaded"):[];
 const shots=candidates.map(a=>Object.freeze({
   asset_id:clean(a.id),filename:clean(a.original_filename),capture_stage:clean(a.capture_stage)||"other",
   story_sort_order:Number(a.story_sort_order)||9999,camera_angle:clean(camera_angles[clean(a.id)])||"unclassified",
   media_kind:clean(a.media_kind)||"unknown",privacy_status:clean(a.privacy_status)||"private_internal",
   consent_status:clean(a.consent_status)||"not_reviewed",story_note:clean(a.story_note).slice(0,1200)
 })).filter(a=>a.asset_id).sort((a,b)=>a.story_sort_order-b.story_sort_order||
   stages.indexOf(a.capture_stage)-stages.indexOf(b.capture_stage)||a.asset_id.localeCompare(b.asset_id));
 const angles=[...new Set(shots.map(s=>s.camera_angle).filter(x=>x!=="unclassified"))];
 const hasBefore=shots.some(s=>s.capture_stage==="before"),hasAfter=shots.some(s=>s.capture_stage==="after");
 const gaps=[];
 if(!id)gaps.push("choose_private_creative_project");
 if(!shots.length)gaps.push("select_uploaded_private_story_assets");
 if(!hasBefore)gaps.push("before_sequence_missing");
 if(!hasAfter)gaps.push("after_sequence_missing");
 if(shots.some(s=>s.camera_angle==="unclassified"))gaps.push("tag_explicit_camera_angles");
 if(angles.length<2)gaps.push("multi_camera_coverage_not_verified");
 if(shots.some(s=>s.privacy_status!=="private_internal"))gaps.push("raw_privacy_boundary_mismatch");
 if(shots.some(s=>s.consent_status!=="approved_public"))gaps.push("public_consent_not_approved");
 const packages=targets.map(t=>Object.freeze({...t,asset_ids:Object.freeze(shots.map(s=>s.asset_id)),
   status:shots.length?"private_editorial_brief_only":"await_private_evidence",
   approval:"review_required",export_rendered:false,publish_ready:false}));
 return Object.freeze({build:547,phase:"multi_camera_private_storyboard_v1",project_id:id||null,
   shot_count:shots.length,camera_angle_count:angles.length,shots:Object.freeze(shots),
   packages:Object.freeze(packages),gaps:Object.freeze(gaps),
   review_status:gaps.length?"incomplete_private_editorial_brief":"private_editorial_brief_requires_review",
   source:"staff_selected_private_project_media",plan_only:true,server_persisted:false,
   raw_originals_remain_private:true,privacy_blur_required:true,consent_and_legal_review_required:true,
   video_rendered:false,public_asset_created:false,publishing_authorized:false});
}
