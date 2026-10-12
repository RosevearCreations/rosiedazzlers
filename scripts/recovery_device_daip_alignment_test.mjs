#!/usr/bin/env node
import assert from "node:assert/strict";
import {build550RecoveryDeviceFieldClosure as field} from "../functions/api/_lib/recovery-authenticated-device-field-closure-550.js";
import {build550DaipSceneAlignment as scene} from "../assets/daip-scene-alignment-550.js";
const none=field({});
assert.equal(none.recovery.status,"retain_recovery_hold");
assert.equal(none.authenticated_device.status,"retain_device_hold");
assert.equal(none.live_restore_performed,false);assert.equal(none.automatic_hold_change,false);
const integrity={recovery_identity:{identity_complete:true,trace_match:true,operator_review_identity_complete:true},
 authenticated_device_identity:{identity_complete:true,trace_match:true,operator_review_identity_complete:true,current_regression_role_ids:[],current_browser_ids:["chrome","safari"]}};
const freshness={recovery:{evidence_current:true},authenticated_device:{evidence_current:true}};
const current=field({integrity,freshness,source_status:{execution_evidence:{available:true}}});
assert.equal(current.recovery.evidence_current,true);assert.equal(current.authenticated_device.evidence_current,true);
assert.equal(current.independent_hold_outcomes,true);
const regression=field({integrity:{...integrity,authenticated_device_identity:{...integrity.authenticated_device_identity,current_regression_role_ids:["admin"]}},freshness,source_status:{execution_evidence:{available:true}}});
assert.equal(regression.authenticated_device.status,"retain_device_hold");
assert.equal(regression.recovery.evidence_current,true);
assert.equal(field({integrity,freshness}).recovery.evidence_current,false);
const id="4300ef9c-c505-4ee0-94ba-a2122a34682e";
const a=(asset_id,capture_stage)=>({id:asset_id,project_id:id,object_key:"projects/"+id+"/raw/video/"+asset_id+".mp4",story_review_status:"selected",upload_status:"uploaded",capture_stage,media_kind:"video",privacy_status:"private_internal",consent_status:"approved_public",duration_seconds:22,original_filename:asset_id+".mp4"});
const footage=[a("first","before"),a("second","after")];
const notes={first:{camera_angle:"front",sync_confirmed:true,clock_offset_seconds:0,in_seconds:0,out_seconds:8,match_group:"bumper",shake:"acceptable",exposure:"acceptable",focus:"acceptable"},
 second:{camera_angle:"side",sync_confirmed:true,clock_offset_seconds:-1.5,in_seconds:1,out_seconds:12,match_group:"bumper",shake:"acceptable",exposure:"acceptable",focus:"acceptable"}};
const ready=scene({project_id:id,assets:footage,editor_notes:notes});
assert.equal(ready.status,"private_draft_timeline_ready_for_further_editing");
assert.equal(ready.correspondence_group_count,1);assert.equal(ready.camera_angle_count,2);
assert.equal(ready.ffmpeg_alignment_performed,false);assert.equal(ready.publishing_authorized,false);
const noSync=scene({project_id:id,assets:footage,editor_notes:{...notes,second:{...notes.second,sync_confirmed:false}}});
assert.equal(noSync.status,"manual_alignment_review_required");
assert.ok(noSync.rows[1].gaps.includes("editor_confirmed_camera_clock_offset_required"));
const invalid=scene({project_id:id,assets:footage,editor_notes:{...notes,second:{...notes.second,out_seconds:222}}});
assert.equal(invalid.status,"manual_alignment_review_required");
assert.ok(invalid.rows[1].gaps.includes("valid_editor_in_out_timecodes_required"));
assert.equal(scene({}).status,"manual_alignment_review_required");
console.log("BUILD 550 RECOVERY, DEVICE AND PRIVATE MULTICAMERA REGRESSION: PASS");
