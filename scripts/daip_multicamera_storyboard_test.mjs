#!/usr/bin/env node
import assert from "node:assert/strict";
import {buildDaipPrivateStoryboards as build} from "../assets/daip-multicamera-storyboard.js";
const shot=(id,stage,extra={})=>({id,project_id:"job-1",story_review_status:"selected",upload_status:"uploaded",original_filename:id+".mov",
 capture_stage:stage,privacy_status:"private_internal",consent_status:"approved_public",media_kind:"video",...extra});
const x=build({project_id:"job-1",assets:[shot("camA","before"),shot("camB","after"),shot("other-project","before",{project_id:"job-2"}),shot("excluded","after",{story_review_status:"excluded"})],camera_angles:{camA:"front",camB:"side"}});
assert.equal(x.shot_count,2);assert.equal(x.camera_angle_count,2);assert.equal(x.gaps.length,0);
assert.equal(x.packages.length,4);assert.equal(x.packages.reduce((a,p)=>a+p.count,0),14);
assert.equal(x.video_rendered,false);assert.equal(x.publishing_authorized,false);assert.equal(x.server_persisted,false);
assert.equal(x.packages[0].format,"16:9");assert.equal(x.packages[2].format,"9:16");
const invalid=build({project_id:"job-1",assets:[shot("unreviewed","process",{consent_status:"not_reviewed"})]});
for(const g of ["before_sequence_missing","after_sequence_missing","tag_explicit_camera_angles","public_consent_not_approved"])assert.equal(invalid.gaps.includes(g),true);
assert.equal(build({}).review_status,"incomplete_private_editorial_brief");
console.log("BUILD 547 DAIP MULTI-CAMERA PRIVATE STORYBOARD TEST: PASS");
