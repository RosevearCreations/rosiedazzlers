#!/usr/bin/env node
import assert from "node:assert/strict";
import {build553StaffMobileFieldRegression as field} from "../functions/api/_lib/staff-mobile-field-regression-553.js";
import {build553DaipSocialVideoDrafts as social} from "../assets/daip-social-video-drafts-553.js";
const empty=field({});assert.equal(empty.status,"retain_staff_mobile_regression_hold");assert.equal(empty.device_fault_declared,false);
const context={owning_workflow_scope:"detailer-assign",role_scope:"detailer",device_browser_context:"android-chrome",
 measure_definition:"failed_submit",window_or_sample_definition:"same-shift"};
const row={evidence_id:"observed-553",area:"detailer-mobile",integrity_state:"staff_mobile_closure_integrity_current"};
const baseline={...context,observations:20,failures:4},current={...context,observations:20,failures:1};
const obs={"observed-553":{...context,before:baseline,after:current,review_reference:"field-553-1",reviewed_at:"2026-10-13T10:00:00Z",
 weather_site_confounds_excluded:true,role_permissions_comparable:true,network_conditions_comparable:true,
 authenticated_field_device_evidence_observed:true,regression_classification:"review"}};
const approved=field({integrity:{rows:[row]},field_observations:obs,source_available:true});
assert.equal(approved.status,"bounded_field_regression_review_ready");
assert.equal(approved.rows[0].before_failure_rate_pct,20);
assert.equal(approved.rows[0].after_failure_rate_pct,5);
assert.equal(approved.rows[0].causal_regression_proven,false);
const drift=structuredClone(obs);drift["observed-553"].after.device_browser_context="ios-safari";
assert.equal(field({integrity:{rows:[row]},field_observations:drift,source_available:true}).status,"retain_staff_mobile_regression_hold");
assert.equal(field({integrity:{rows:[{...row,integrity_state:"retained_freshness_review_required"}]},field_observations:obs,source_available:true}).status,"retain_staff_mobile_regression_hold");
const edl={project_id:"job553",raw_media_private:true,no_raw_media_url:true,media_rendered:false,
 audio_review_reference:"silence",timeline:[
  {asset_id:"one",capture_stage:"before",camera_angle:"front",review_confirmed:true},
  {asset_id:"two",capture_stage:"after",camera_angle:"side",review_confirmed:true}]};
const notes=Object.fromEntries(["instagram","tiktok","facebook","youtube"].map(k=>[k,{title:"Private detailing draft",
 caption:"Verified cleaning before and after",call_to_action:"See our available services",hashtags:"#detailing",factual_claims_reviewed:true}]));
const draft=social({project_id:"job553",edit_list:edl,notes});
assert.equal(draft.status,"private_social_copy_drafts_ready_for_operator_review");
assert.equal(draft.drafts.length,4);
assert.equal(draft.public_upload_authorized,false);
assert.equal(draft.drafts.every(d=>d.media_asset_url===null&&d.queued_for_publishing===false),true);
assert.equal(social({project_id:"job553",edit_list:{...edl,timeline:[edl.timeline[0]]},notes}).status,"private_draft_source_review_required");
console.log("BUILD 553 STAFF FIELD AND DAIP SOCIAL PRIVATE DRAFT REGRESSION PASS");
