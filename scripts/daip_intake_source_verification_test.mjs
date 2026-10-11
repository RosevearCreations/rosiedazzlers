#!/usr/bin/env node
import assert from "node:assert/strict";
import {buildDaipIntakeVerification as build} from "../assets/daip-intake-source-verification.js";
const id="2ea2986f-3fe1-40d2-a3f5-9202a60bd1a5";
const a={id:"asset-a",project_id:id,object_key:"projects/"+id+"/raw/video/asset-a/clip.mp4",file_size_bytes:65000,content_type:"video/mp4",
 privacy_status:"private_internal",is_raw_original:true,public_destination_enabled:false,upload_status:"uploaded",media_kind:"video",
 duration_seconds:14,client_fingerprint:"fingerprintA",original_filename:"clip.mp4"};
const s={asset_id:"asset-a",project_id:id,status:"uploaded",object_key:a.object_key,file_size_bytes:65000};
const r=build({project_id:id,assets:[a],sessions:[s],processing_jobs:[]});
assert.equal(r.status,"metadata_review_ready");assert.equal(r.rows[0].proxy_rendered,false);
assert.equal(r.actual_r2_object_head_checked,false);assert.equal(r.public_publishing_authorized,false);
const wrong=build({project_id:id,assets:[{...a,object_key:"projects/some-other-id/raw/video/a.mp4"}],sessions:[s]});
assert.equal(wrong.rows[0].missing.includes("private_project_raw_key_mismatch"),true);
const noProof=build({project_id:id,assets:[{...a,duration_seconds:null,content_hash:null,client_fingerprint:null}],sessions:[s]});
assert.equal(noProof.rows[0].missing.includes("video_duration_not_verified"),true);
const duplicates=build({project_id:id,assets:[a,{...a,id:"asset-b"}],sessions:[s]});
assert.equal(duplicates.rows[1].missing.includes("candidate_duplicate_fingerprint_needs_manual_review"),true);
assert.equal(build({}).status,"choose_project");
console.log("BUILD 548 DAIP INTAKE SOURCE VERIFICATION: PASS");
