#!/usr/bin/env node
import assert from "node:assert/strict";
import {build551MaintenanceFleetCommercialDecision as commercial} from "../functions/api/_lib/maintenance-fleet-commercial-decision-551.js";
import {build551DaipPrivateEditWorkspace as editor} from "../assets/daip-private-video-editor-551.js";
const missing=commercial({});
assert.equal(missing.status,"retain_commercial_pilot_hold");
assert.equal(missing.no_capacity_reservation,true);
assert.equal(missing.no_recurring_billing,true);
const trace="bounded-private-pilot-551";
const integrity={status:"maintenance_fleet_continuation_integrity_current",pilot_execution_identity:{current_evidence_trace_key:trace,stop_condition_triggered:false},owner_outcome_identity:{outcome:"hold"}};
const freshness={execution_evidence_freshness:{evidence_current:true}};
const decision={decision:"proceed_to_separate_pilot_authorization",owner_role:"owner",reviewed_at:"2026-10-11T12:00:00Z",decision_reference:"owner-decision-551",pilot_trace:trace,
 participant_limit:2,duration_days:30,estimated_cost_cad:215,estimated_revenue_cad:350,
 travel_evidence_reference:"travel-current-551",capacity_evidence_reference:"capacity-current-551",
 invoicing_evidence_reference:"invoice-current-551",stop_conditions_reference:"stops-current-551"};
const accepted=commercial({integrity,freshness,owner_decision:decision,source_available:true});
assert.equal(accepted.status,"bounded_commercial_review_ready_not_activated");
assert.equal(accepted.estimated_margin_cad,135);
assert.equal(accepted.no_auto_enrollment,true);
assert.equal(commercial({integrity:{...integrity,pilot_execution_identity:{...integrity.pilot_execution_identity,stop_condition_triggered:true}},freshness,owner_decision:decision,source_available:true}).status,"retain_commercial_pilot_hold");
assert.equal(commercial({integrity,freshness,owner_decision:{...decision,pilot_trace:"wrong"},source_available:true}).status,"retain_commercial_pilot_hold");
const project="p551",alignment={project_id:project,status:"private_draft_timeline_ready_for_further_editing",rows:[
 {asset_id:"a",filename:"one.mov",stage:"before",camera_angle:"front",in_seconds:0,out_seconds:9,match_group:"bumper",status:"private_editorial_source_review_ready"},
 {asset_id:"b",filename:"two.mov",stage:"after",camera_angle:"side",in_seconds:1,out_seconds:10,match_group:"bumper",status:"private_editorial_source_review_ready"}
]};
const edits={a:{order:2,in_seconds:0,out_seconds:4,speed:2,crop_mode:"center_safe",review_confirmed:true,caption:"Before"},
 b:{order:1,in_seconds:2,out_seconds:7,speed:1,crop_mode:"manual_safe",crop_x_percent:50,crop_y_percent:50,review_confirmed:true,caption:"After"}};
const out=editor({alignment,edits,project_id:project,audio_license_reference:"silent export requested",format:"9:16"});
assert.equal(out.status,"private_cut_list_ready_for_render_authorization");
assert.deepEqual(out.timeline.map(r=>r.asset_id),["b","a"]);
assert.equal(out.estimated_duration_seconds,7);
assert.equal(out.media_rendered,false);
assert.equal(out.no_raw_media_url,true);
assert.equal(out.public_export_authorized,false);
assert.equal(editor({alignment,edits:{...edits,b:{...edits.b,out_seconds:80}},project_id:project,audio_license_reference:"silence"}).status,"private_edit_review_required");
assert.equal(editor({alignment,edits:{...edits,b:{...edits.b,order:2}},project_id:project,audio_license_reference:"silence"}).status,"private_edit_review_required");
assert.equal(editor({alignment,edits,project_id:project}).status,"private_edit_review_required");
console.log("BUILD 551 COMMERCIAL AND DAIP PRIVATE EDITOR TEST: PASS");
