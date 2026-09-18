import assert from "node:assert/strict";
import { buildMediaPhotoStudioProofOperations, MEDIA_PROOF_BUILD } from "../functions/api/_lib/media-photo-studio-proof-operations.js";

assert.equal(MEDIA_PROOF_BUILD, 422);
const observed = buildMediaPhotoStudioProofOperations({
  now: "2026-09-18T12:00:00Z",
  db_ready:true, assignment_db_ready:true, schema_ready:true, bucket_ready:true,
  library_rows:[
    {id:"m1",r2_prefix:"gallery/",last_seen_at:"2026-09-17T12:00:00Z"},
    {id:"m2",r2_prefix:"gallery/",last_seen_at:"2026-09-17T12:00:00Z"},
    {id:"m3",r2_prefix:"packages/",last_seen_at:"2026-09-16T12:00:00Z"}
  ],
  assignment_rows:[
    {media_id:"m1",is_active:true,target_type:"before_after_pair",target_key:"gallery:set1:before"},
    {media_id:"m2",is_active:true,target_type:"before_after_pair",target_key:"gallery:set1:after"},
    {media_id:"m1",is_active:true,target_type:"package_card",target_key:"package:complete:mid"}
  ]
});
assert.equal(observed.source_acceptance.status,"ready");
assert.equal(observed.operational_readiness.status,"observed");
assert.equal(observed.assignments.active_placements,3);
assert.equal(observed.assignments.multi_placement_media,1);
assert.equal(observed.before_after.complete_pairs,1);
assert.equal(observed.r2_sync.classification,"observed");
assert.equal(observed.r2_sync.latest_age_days,1);
assert.equal(observed.recovery.real_recovery_drill_observed,false);
assert.equal(observed.boundaries.r2_scan_per_overview,false);
assert.equal(observed.boundaries.r2_mutation_per_overview,false);

const held = buildMediaPhotoStudioProofOperations({
  now:"2026-09-18T12:00:00Z",
  db_ready:true, assignment_db_ready:true, schema_ready:true, bucket_ready:true,
  library_rows:[{id:"m1",r2_prefix:"gallery/",last_seen_at:"2026-07-01T12:00:00Z"}],
  assignment_rows:[]
});
assert.equal(held.operational_readiness.status,"owner_action");
assert.ok(held.operational_readiness.holds.includes("r2_sync"));
assert.ok(held.operational_readiness.holds.includes("recurring_assignment"));
assert.ok(held.operational_readiness.holds.includes("before_after_proof"));

console.log("MEDIA / PHOTO STUDIO / PROOF OPERATIONS TEST: PASS");
