import { requireStaffAccess, json } from "../_lib/staff-auth.js";
import { getPublicAssetsBucket, loadAssignmentRows, loadMediaLibraryRows, photoSchemaStatus } from "../_lib/photo-library.js";
import { isPhotoStudioPublicRow } from "../_lib/photo-studio-safety.js";
import { buildMediaPhotoStudioProofOperations } from "../_lib/media-photo-studio-proof-operations.js";

export async function onRequestGet({ request, env }) {
  const access = await requireStaffAccess({ request, env, capability: "manage_bookings", allowLegacyAdminFallback: true });
  if (!access.ok) return access.response;
  try {
    const [library, assignments, schema] = await Promise.all([
      loadMediaLibraryRows(env, { includeArchived: false, limit: 1200 }),
      loadAssignmentRows(env, { activeOnly: true, limit: 1600 }),
      photoSchemaStatus(env)
    ]);
    const publicRows = (library.rows || []).filter(isPhotoStudioPublicRow);
    const publicIds = new Set(publicRows.map((row) => String(row?.id || "")).filter(Boolean));
    const publicAssignments = (assignments.rows || []).filter((row) => publicIds.has(String(row?.media_id || "")));
    const operations = buildMediaPhotoStudioProofOperations({
      db_ready: library.ready === true,
      assignment_db_ready: assignments.ready === true,
      schema_ready: schema.ready === true,
      bucket_ready: !!getPublicAssetsBucket(env),
      library_rows: publicRows,
      assignment_rows: publicAssignments,
      now: new Date()
    });
    return json({
      ok: true,
      build: 422,
      operations,
      source_authorities: {
        photo_library: "app_media_library",
        assignments: "app_media_assignments",
        bounded_r2_sync: "/api/admin/photo_library_sync",
        upload_recovery: "/api/admin/media_asset_upload",
        deletion_safety: "/api/admin/photo_library_delete"
      },
      mutation_authority: false,
      r2_scan_per_request: false,
      customer_identity_exposed: false,
      warnings: [library.warning, assignments.warning, schema.warning].filter(Boolean)
    });
  } catch (err) {
    return json({ ok:false, build:422, error:err?.message || "Could not load Media / Photo Studio proof operations.", mutation_authority:false }, 500);
  }
}
export async function onRequestPost() {
  return json({ ok:false, build:422, error:"GET required.", mutation_authority:false }, 405);
}
