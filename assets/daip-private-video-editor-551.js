// Build 551 — internal, in-session DAIP edit decision list (EDL) for existing private Creative Projects.
// No video decoding, raw R2 key exposure, render/export/publish or server persistence.
const str=v=>String(v??"").trim();
const n=v=>v!==""&&v!=null&&Number.isFinite(Number(v))?Number(v):null;
const int=v=>Number.isInteger(Number(v))?Number(v):null;
const layouts=new Set(["16:9","9:16","4:5"]);
const formats=new Set(["original","center_safe","manual_safe"]);
export function build551DaipPrivateEditWorkspace({alignment={},edits={},project_id="",format="9:16",brand_label="Rosie Dazzlers",audio_license_reference=""}={}){
 const pid=str(project_id),issues=[],shots=Array.isArray(alignment?.rows)?alignment.rows:[];
 if(!pid||pid!==str(alignment?.project_id))issues.push("matching_private_creative_project_required");
 if(!layouts.has(format))issues.push("supported_private_canvas_required");
 if(!shots.length)issues.push("private_source_shots_required");
 if(alignment?.status!=="private_draft_timeline_ready_for_further_editing")issues.push("operator_confirmed_source_alignment_required");
 const rows=shots.map((s,i)=>{
  const edit=edits?.[s.asset_id]||{},gaps=[],start=n(edit.in_seconds??s.in_seconds),end=n(edit.out_seconds??s.out_seconds),
    speed=n(edit.speed??1),order=int(edit.order??i+1),crop=str(edit.crop_mode||"center_safe"),
    cap=str(edit.caption).slice(0,280),approved=edit.review_confirmed===true;
  const panX=n(edit.crop_x_percent),panY=n(edit.crop_y_percent);
  if(!s.asset_id||s.status!=="private_editorial_source_review_ready")gaps.push("verified_private_source_shot_required");
  if(start===null||end===null||start<0||end<=start||start<s.in_seconds||end>s.out_seconds)gaps.push("trim_must_remain_within_confirmed_source_timecodes");
  if(speed===null||speed<0.25||speed>4)gaps.push("speed_outside_edit_budgets");
  if(order===null||order<1||order>1000)gaps.push("valid_edit_order_required");
  if(!formats.has(crop))gaps.push("crop_mode_not_supported");
  if(crop==="manual_safe"&&(panX===null||panY===null||panX<0||panX>100||panY<0||panY>100))gaps.push("manual_safe_crop_position_required");
  if(!approved)gaps.push("shot_editor_review_required");
  const duration=start!==null&&end!==null&&speed>0?Math.round((end-start)/speed*1000)/1000:null;
  return Object.freeze({asset_id:str(s.asset_id),filename:str(s.filename),capture_stage:str(s.stage),
    camera_angle:str(s.camera_angle),order,trim_in_seconds:start,trim_out_seconds:end,
    speed,crop_mode:crop,crop_x_percent:crop==="manual_safe"?panX:null,
    crop_y_percent:crop==="manual_safe"?panY:null,caption:cap,
    estimated_duration_seconds:duration,match_group:str(s.match_group),
    review_confirmed:approved,gaps:Object.freeze(gaps),raw_url_included:false});
 }).sort((a,b)=>(a.order??Infinity)-(b.order??Infinity)||a.asset_id.localeCompare(b.asset_id));
 const ranks=rows.map(r=>r.order).filter(v=>v!==null);
 if(new Set(ranks).size!==ranks.length)issues.push("unique_editor_order_required");
 if(rows.some(r=>r.gaps.length))issues.push("individual_shot_edit_review_incomplete");
 if(!str(audio_license_reference))issues.push("audio_rights_or_silence_decision_required");
 const total=rows.reduce((a,r)=>a+(r.estimated_duration_seconds||0),0);
 return Object.freeze({build:551,authority:"daip_private_editor_decision_list",project_id:pid||null,
  status:issues.length?"private_edit_review_required":"private_cut_list_ready_for_render_authorization",
  canvas:layouts.has(format)?format:null,brand_label:str(brand_label).slice(0,60),
  audio_review_reference:str(audio_license_reference).slice(0,160),
  timeline:Object.freeze(rows),estimated_duration_seconds:Math.round(total*1000)/1000,
  gaps:Object.freeze(issues),browser_session_only:true,notes_persisted:false,
  draft_preview_type:"timed_shot_card_sequence_not_video_playback",
  raw_media_private:true,no_raw_media_url:true,privacy_redaction_verified:false,
  media_rendered:false,ffmpeg_executed:false,public_export_authorized:false,
  social_post_authorized:false,approved_channel_dispatch:false});
}
