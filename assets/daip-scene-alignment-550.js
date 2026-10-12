// Build 550 — private manual multi-angle timecode, camera sync and shot-quality review.
// No automated scene analysis, worker alignment, rendered timeline or public derivative is claimed.
const clean=x=>String(x??"").trim();
const goodStage=new Set(["before","process","after","interior","exterior","engine","other"]);
const goodQuality=new Set(["acceptable","needs_review","unrated"]);
const num=v=>v===""||v==null?null:Number.isFinite(Number(v))?Number(v):null;
export function build550DaipSceneAlignment({project_id="",assets=[],editor_notes={}}={}){
 const pid=clean(project_id);
 const selected=(Array.isArray(assets)?assets:[]).filter(a=>pid&&clean(a?.project_id)===pid&&a.story_review_status==="selected"&&a.upload_status==="uploaded");
 const rows=selected.map(a=>{
  const note=editor_notes?.[clean(a.id)]||{},gaps=[],stage=clean(a.capture_stage),id=clean(a.id);
  const rawKey=clean(a.object_key),owned=rawKey.startsWith("projects/"+pid+"/raw/")&&!rawKey.includes("../")&&!rawKey.includes("//");
  const offset=num(note.clock_offset_seconds),start=num(note.in_seconds),end=num(note.out_seconds);
  const duration=num(a.duration_seconds),group=clean(note.match_group).slice(0,90);
  const angle=clean(note.camera_angle),quality={shake:clean(note.shake)||"unrated",exposure:clean(note.exposure)||"unrated",focus:clean(note.focus)||"unrated"};
  if(!owned||a.privacy_status!=="private_internal")gaps.push("private_project_raw_asset_mismatch");
  if(!id||!goodStage.has(stage))gaps.push("verified_capture_stage_required");
  if(!angle)gaps.push("manual_camera_angle_required");
  if(!Number.isFinite(offset)||Math.abs(offset)>86400||note.sync_confirmed!==true)gaps.push("editor_confirmed_camera_clock_offset_required");
  if(start===null||end===null||start<0||end<=start||(duration!==null&&end>duration))gaps.push("valid_editor_in_out_timecodes_required");
  if(!group)gaps.push("before_after_correspondence_group_required");
  if(Object.values(quality).some(v=>!goodQuality.has(v)||v!=="acceptable"))gaps.push("manual_shake_exposure_focus_review_incomplete");
  if(a.consent_status!=="approved_public")gaps.push("external_use_consent_not_proven");
  return Object.freeze({asset_id:id,filename:clean(a.original_filename),stage,camera_angle:angle,clock_offset_seconds:offset,
    sync_confirmed:note.sync_confirmed===true,in_seconds:start,out_seconds:end,match_group:group,
    quality:Object.freeze(quality),gaps:Object.freeze(gaps),status:gaps.length?"editor_review_required":"private_editorial_source_review_ready",
    scene_quality_computed_by_algorithm:false,raw_media_public:false});
 });
 const angles=new Set(rows.map(x=>x.camera_angle).filter(Boolean));
 const match=new Map();
 for(const r of rows){if(!r.match_group)continue;const s=match.get(r.match_group)||new Set();s.add(r.stage);match.set(r.match_group,s);}
 const groups=[...match].filter(([,s])=>s.has("before")&&s.has("after")).map(([k])=>k);
 const gaps=[];
 if(!pid)gaps.push("choose_private_creative_project");
 if(!rows.length)gaps.push("select_private_story_media");
 if(angles.size<2)gaps.push("at_least_two_editor_labeled_camera_angles_required");
 if(!groups.length)gaps.push("verified_before_after_correspondence_group_required");
 if(rows.some(r=>r.gaps.length))gaps.push("shot_level_editor_review_incomplete");
 const ordered=rows.slice().sort((a,b)=>(a.in_seconds??Infinity)+(a.clock_offset_seconds??0)-( (b.in_seconds??Infinity)+(b.clock_offset_seconds??0))||a.asset_id.localeCompare(b.asset_id));
 return Object.freeze({build:550,authority:"daip_private_multicamera_editor_alignment",
  project_id:pid||null,status:gaps.length?"manual_alignment_review_required":"private_draft_timeline_ready_for_further_editing",
  shot_count:rows.length,camera_angle_count:angles.size,correspondence_group_count:groups.length,
  matched_groups:Object.freeze(groups),rows:Object.freeze(ordered),gaps:Object.freeze(gaps),
  manual_editor_inputs_only:true,scene_scoring_automatic:false,ffmpeg_alignment_performed:false,
  proxy_rendered:false,private_timeline_draft_only:true,notes_persisted:false,
  public_asset_created:false,publishing_authorized:false,raw_media_private:true});
}
