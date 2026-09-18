export const MEDIA_PROOF_BUILD = 422;

export function buildMediaPhotoStudioProofOperations(input = {}) {
  const now = validDate(input.now) || new Date();
  const dbReady = input.db_ready === true;
  const assignmentDbReady = input.assignment_db_ready === true;
  const schemaReady = input.schema_ready === true;
  const bucketReady = input.bucket_ready === true;
  const libraryRows = Array.isArray(input.library_rows) ? input.library_rows : [];
  const assignmentRows = (Array.isArray(input.assignment_rows) ? input.assignment_rows : [])
    .filter((row) => row?.is_active === true);

  const publicMediaIds = new Set(libraryRows.map((row) => clean(row?.id)).filter(Boolean));
  const activeAssignments = assignmentRows.filter((row) => publicMediaIds.has(clean(row?.media_id)));
  const assignmentsByMedia = new Map();
  for (const row of activeAssignments) {
    const id = clean(row.media_id);
    if (!id) continue;
    assignmentsByMedia.set(id, (assignmentsByMedia.get(id) || 0) + 1);
  }

  const pairGroups = new Map();
  for (const row of activeAssignments) {
    if (clean(row.target_type) !== "before_after_pair") continue;
    const key = clean(row.target_key);
    const group = key.replace(/:(before|after)$/i, "");
    const sideMatch = key.match(/:(before|after)$/i);
    const side = sideMatch ? sideMatch[1].toLowerCase() : "";
    if (!group) continue;
    if (!pairGroups.has(group)) pairGroups.set(group, { before: null, after: null });
    if (side) pairGroups.get(group)[side] = clean(row.media_id) || null;
  }

  let completePairs = 0;
  let incompletePairs = 0;
  let sameMediaConflicts = 0;
  for (const pair of pairGroups.values()) {
    if (pair.before && pair.after) {
      if (pair.before === pair.after) sameMediaConflicts += 1;
      else completePairs += 1;
    } else {
      incompletePairs += 1;
    }
  }

  const observedSyncRows = libraryRows
    .map((row) => ({ at: validDate(row?.last_seen_at), prefix: clean(row?.r2_prefix) }))
    .filter((row) => row.at)
    .sort((a, b) => b.at - a.at);
  const latestSync = observedSyncRows[0]?.at || null;
  const latestSyncAgeDays = latestSync ? Math.max(0, Math.floor((now - latestSync) / 86400000)) : null;

  let syncClassification = "observed";
  if (!dbReady || !schemaReady || !bucketReady) syncClassification = "unavailable";
  else if (!latestSync || latestSyncAgeDays > 30) syncClassification = "owner_action";

  const assignmentClassification = !assignmentDbReady ? "unavailable" : activeAssignments.length ? "observed" : "owner_action";
  const pairClassification = !assignmentDbReady ? "unavailable" : sameMediaConflicts ? "review" : completePairs ? "observed" : "owner_action";

  const holds = [];
  if (syncClassification !== "observed") holds.push("r2_sync");
  if (assignmentClassification !== "observed") holds.push("recurring_assignment");
  if (pairClassification !== "observed") holds.push("before_after_proof");

  return Object.freeze({
    build: MEDIA_PROOF_BUILD,
    mode: "media_photo_studio_proof_operations",
    source_acceptance: Object.freeze({
      status: "ready",
      source_release_green_may_coexist_with_operational_hold: true
    }),
    operational_readiness: Object.freeze({
      status: holds.length ? "owner_action" : "observed",
      holds: Object.freeze([...new Set(holds)]),
      real_recovery_drill_inferred: false
    }),
    library: Object.freeze({
      classification: dbReady && schemaReady ? "observed" : "unavailable",
      managed_public_photos: libraryRows.length,
      assigned_photos: assignmentsByMedia.size,
      unassigned_photos: Math.max(0, libraryRows.length - assignmentsByMedia.size)
    }),
    assignments: Object.freeze({
      classification: assignmentClassification,
      active_placements: activeAssignments.length,
      assigned_media: assignmentsByMedia.size,
      multi_placement_media: [...assignmentsByMedia.values()].filter((count) => count > 1).length
    }),
    before_after: Object.freeze({
      classification: pairClassification,
      pair_groups: pairGroups.size,
      complete_pairs: completePairs,
      incomplete_pairs: incompletePairs,
      same_media_conflicts: sameMediaConflicts,
      complete_pair_requires_distinct_media: true
    }),
    r2_sync: Object.freeze({
      classification: syncClassification,
      rows_with_observed_sync: observedSyncRows.length,
      observed_prefixes: Object.freeze([...new Set(observedSyncRows.map((row) => row.prefix).filter(Boolean))]),
      latest_observed_at: latestSync ? latestSync.toISOString() : null,
      latest_age_days: latestSyncAgeDays,
      bounded_prefix_cursor_sync_required: true,
      automatic_full_bucket_scan_allowed: false
    }),
    recovery: Object.freeze({
      classification: "source_ready",
      same_key_upload_retry_source_ready: true,
      cursor_continuation_source_ready: true,
      operator_recovery_observation_required: true,
      real_recovery_drill_observed: false
    }),
    boundaries: Object.freeze({
      read_only_overview: true,
      r2_scan_per_overview: false,
      r2_mutation_per_overview: false,
      private_media_isolated: true,
      schema_authority: false,
      permanent_polling: false
    })
  });
}

function clean(value) { return String(value ?? "").trim(); }
function validDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}
