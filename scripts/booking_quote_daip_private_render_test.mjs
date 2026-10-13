#!/usr/bin/env node
import assert from "node:assert/strict";
import {build552BookingQuoteControlledInterpretation as interpret} from "../functions/api/_lib/booking-quote-controlled-interpretation-552.js";
import {build552PrivateDaipRenderPlan as preflight} from "../assets/daip-private-render-preflight-552.js";
const missing=interpret({});
assert.equal(missing.status,"retain_booking_quote_follow_up_hold");
assert.equal(missing.price_or_discount_changed,false);
const current={rows:[{key:"booking-starts",area:"booking",integrity_state:"booking_quote_follow_up_integrity_current",
 measurement_allocation_duration_identity:{exact:true,revision:3,primary_metric:"checkout_conversion",allocation_arms:["control","pilot"]},
 seasonal_and_stop_evidence:{weather_eligibility_and_exclusion_complete:true,no_triggered_stop_condition:true}}]};
const comparable={measurement_lock_revision:3,primary_metric:"checkout_conversion",weather_exclusion_audited:true,
 capacity_confounds_reviewed:true,booking_collision_reviewed:true,
 arms:[{name:"control",eligible_sessions:20,weather_excluded_sessions:4,conversions:5,window_id:"2026-10"},
 {name:"pilot",eligible_sessions:20,weather_excluded_sessions:6,conversions:7,window_id:"2026-10"}]};
const valid=interpret({integrity:current,source_available:true,operator_measurements:{"booking-starts":comparable}});
assert.equal(valid.status,"descriptive_follow_up_review_ready");
assert.equal(valid.rows[0].arms[0].observed_rate_pct,25);
assert.equal(valid.rows[0].arms[1].observed_rate_pct,35);
assert.equal(valid.rows[0].total_weather_excluded,10);
assert.equal(valid.rows[0].winner_declared,false);
assert.equal(interpret({integrity:current,source_available:true,operator_measurements:{"booking-starts":{...comparable,weather_exclusion_audited:false}}}).status,"retain_booking_quote_follow_up_hold");
const zeroSample={"booking-starts":{...comparable,arms:[comparable.arms[0],{...comparable.arms[1],eligible_sessions:0}]}};
assert.equal(interpret({integrity:current,source_available:true,operator_measurements:zeroSample}).status,"retain_booking_quote_follow_up_hold");
const edit={project_id:"p552",canvas:"9:16",estimated_duration_seconds:40,audio_review_reference:"silence confirmed",
 raw_media_private:true,no_raw_media_url:true,media_rendered:false,
 timeline:[{asset_id:"private-source-1",review_confirmed:true,order:1,trim_in_seconds:0,trim_out_seconds:40,speed:1,crop_mode:"center_safe",caption:"Private"}]};
const policy={private_r2_available_bytes:100*1048576,max_worker_cpu_ms:10000,max_duration_seconds:120};
const blocked=preflight({edit_list:edit,policy});
assert.equal(blocked.status,"private_render_blocked_requires_worker_and_privacy_evidence");
assert.equal(blocked.ffmpeg_invoked,false);
assert.equal(blocked.private_r2_write_performed,false);
const ability={private_ffmpeg_runner_observed:true,source_r2_object_head_verified:true,private_destination_binding_verified:true,redaction_artifact_inspected:true,consent_evidence_current:true};
const authorizedPlan=preflight({edit_list:edit,policy,worker_capabilities:ability});
assert.equal(authorizedPlan.status,"private_render_candidate_requires_operator_start");
assert.equal(authorizedPlan.private_render_completed,false);
assert.equal(authorizedPlan.social_publish_authorized,false);
assert.equal(preflight({edit_list:edit,policy:{...policy,private_r2_available_bytes:1024},worker_capabilities:ability}).status,"private_render_blocked_requires_worker_and_privacy_evidence");
console.log("BUILD 552 BOOKING/QUOTE + PRIVATE DAIP RENDER PREFLIGHT REGRESSION PASS");
