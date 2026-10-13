import assert from "node:assert/strict";
import {build555ProductionLearning as learning} from "../functions/api/_lib/production-learning-roadmap-555.js";
import {build555DaipQualityReliabilityReview as media} from "../assets/daip-quality-cost-reliability-review-555.js";
const at="2026-10-13T20:00:00Z";
const owner={build:554,authority:"service_economics_capacity_technical_reliability_owner_review",domain_count:4,status:"reviewed_controls_retained",rows:[{},{},{},{}]};
const records={rows:Array.from({length:9},(_,i)=>({build:546+i,owner_reference:"owner",evidence_reference:"evidence",
 observed_at:at,decision:"retain_controls",owner_reviewed:true}))};
const run=(x=owner,y=records)=>learning({owner_review:x,release_records:y,generated_at:"2026-10-13T21:00:00Z"});
assert.equal(run().status,"owner_review_records_reconciled");
assert.equal(run().truth_boundary.canonical_hold_auto_closed,false);
assert.equal(run(owner,{}).status,"production_learning_hold");
let bad=structuredClone(records);bad.rows[1].build=546;assert.equal(run(owner,bad).status,"production_learning_hold");
bad=structuredClone(records);bad.rows[4].automatic_hold_closure=true;assert.equal(run(owner,bad).status,"production_learning_hold");
bad=structuredClone(records);bad.rows[0].observed_at="2025-01-01T00:00:00Z";assert.equal(run(owner,bad).status,"production_learning_hold");
assert.equal(run({},records).status,"production_learning_hold");
const observation={project_id:"p1",projects:[{id:"p1"}],
 assets:[{id:"a1",project_id:"p1",media_kind:"video",story_review_status:"selected",capture_stage:"before"},
 {id:"a2",project_id:"p1",media_kind:"video",story_review_status:"selected",capture_stage:"after"}],
 processing_jobs:[{project_id:"p1",status:"completed"},{project_id:"p1",status:"failed"}]};
const a=media(observation);
assert.equal(a.quality.video_asset_count,2);
assert.equal(a.reliability.failed_or_dead_lettered_job_count,1);
assert.equal(a.quality.rendered_video_output_verified,false);
assert.equal(a.metrics.attributable_roi_verified,false);
assert.equal(a.public_media_url_created,false);
assert.equal(media({...observation,measurements:{editing_minutes:1}}).status,"private_measurement_review_hold");
const measured={editing_minutes:30,worker_cpu_ms:300,processing_cost_cad:2,observed_views:100,observed_leads:1,attributed_revenue_cad:10,
 evidence_reference:"observed-file",observed_at:at,window_definition:"actual-week",attribution_method:"matched-job",confounders:"seasonal",
 verified_render_reference:"render",verified_delivery_reference:"delivery",worker_quota_reference:"quota"};
const r=media({...observation,processing_jobs:[{project_id:"p1",status:"completed"}],measurements:measured});
assert.equal(r.status,"operator_measurement_package_requires_independent_acceptance");
assert.equal(r.metrics.metric_verification,"operator_entered_not_provider_verified");
assert.equal(r.metrics.attributable_roi_verified,false);
console.log("BUILD 555 RELEASE GOVERNANCE + DAIP QUALITY COST RELIABILITY REGRESSION: PASS");
