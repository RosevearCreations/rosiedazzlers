#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
errors = []

def read(path):
    p = ROOT / path
    if not p.exists():
        errors.append(f"missing {path}")
        return ""
    return p.read_text(encoding="utf-8", errors="ignore")

helper = read("functions/api/_lib/media-photo-studio-proof-operations.js")
endpoint = read("functions/api/admin/media_photo_studio_proof_operations.js")
studio = read("admin-photo-studio.html")
sync = read("functions/api/admin/photo_library_sync.js")
upload = read("functions/api/admin/media_asset_upload.js")
delete = read("functions/api/admin/photo_library_delete.js")
move = read("functions/api/admin/photo_library_move.js")
policy = read("BUILD422_MEDIA_PHOTO_STUDIO_PROOF_OPERATIONS.md").lower()
workflow = read(".github/workflows/media-photo-studio-proof-operations-authority.yml")

for token in (
    "MEDIA_PROOF_BUILD = 422",
    'mode: "media_photo_studio_proof_operations"',
    "source_release_green_may_coexist_with_operational_hold: true",
    "complete_pair_requires_distinct_media: true",
    "bounded_prefix_cursor_sync_required: true",
    "automatic_full_bucket_scan_allowed: false",
    "operator_recovery_observation_required: true",
    "real_recovery_drill_observed: false",
    "r2_scan_per_overview: false",
    "r2_mutation_per_overview: false",
):
    if token not in helper:
        errors.append(f"Build 422 helper missing {token}")

for token in (
    "requireStaffAccess",
    "loadMediaLibraryRows",
    "loadAssignmentRows",
    "isPhotoStudioPublicRow",
    "buildMediaPhotoStudioProofOperations",
    "mutation_authority: false",
    "r2_scan_per_request: false",
    "customer_identity_exposed: false",
):
    if token not in endpoint:
        errors.append(f"Build 422 endpoint missing {token}")

for token in (
    'data-build422="media-photo-studio-proof-operations"',
    "/api/admin/media_photo_studio_proof_operations",
    "refreshMediaProofOps",
    "data?.dry_run===true",
    "Deletion eligibility confirmed",
):
    if token not in studio:
        errors.append(f"Photo Studio Build 422 UI missing {token}")

for token in (
    "mode:'single_prefix_page'",
    "partial_result:resultStatus==='partial'",
    "next_cursor",
    "same_request_safe:true",
):
    if token not in sync:
        errors.append(f"retained bounded sync authority missing {token}")

for token in ("retry_safe_same_key:true", "retry_key:key"):
    if token not in upload:
        errors.append(f"retained upload recovery authority missing {token}")

for token in (
    "const DELETE_CONFIRM='DELETE_UNASSIGNED_R2_ASSET'",
    "dry_run:true",
    "explicit_authority_required:true",
    "adminAuthorized",
    "mutation_performed:false",
):
    if token not in delete:
        errors.append(f"retained deletion safety authority missing {token}")

for token in ("confirm(", "renamed_by:access.actor?.email"):
    if token not in studio + move:
        errors.append(f"retained explicit move/audit evidence missing {token}")

for token in (
    "recurring public media assignment",
    "before/after",
    "bounded r2 synchronization",
    "source green",
    "real recovery drill",
    "schema-neutral",
):
    if token not in policy:
        errors.append(f"Build 422 policy missing {token}")

for token in (
    "Build 422 — Media, Photo Studio & Proof Operations Authority",
    "python scripts/media_photo_studio_proof_operations_check.py",
    "node scripts/media_photo_studio_proof_operations_test.mjs",
):
    if token not in workflow:
        errors.append(f"Build 422 workflow missing {token}")

if any("422" in path.name.lower() for path in ROOT.rglob("*.sql")):
    errors.append("Build 422 must not introduce a schema migration")

commands = (
    ["node", "--check", "functions/api/_lib/media-photo-studio-proof-operations.js"],
    ["node", "--check", "functions/api/admin/media_photo_studio_proof_operations.js"],
    ["node", "--check", "scripts/media_photo_studio_proof_operations_test.mjs"],
    ["node", "scripts/media_photo_studio_proof_operations_test.mjs"],
)
for command in commands:
    proc = subprocess.run(command, cwd=ROOT, text=True, capture_output=True)
    if proc.returncode != 0:
        errors.append(f"{' '.join(command)} failed: {proc.stderr.strip() or proc.stdout.strip()}")

if errors:
    print("BUILD 422 MEDIA / PHOTO STUDIO / PROOF OPERATIONS AUTHORITY: FAIL")
    for error in errors:
        print(" -", error)
    raise SystemExit(1)

print("BUILD 422 MEDIA / PHOTO STUDIO / PROOF OPERATIONS AUTHORITY: PASS")
print(" - overview is read-only and performs no R2 scan")
print(" - recurring assignment, Before/After and sync observations stay separately classified")
print(" - same-key upload recovery and cursor continuation remain bounded")
print(" - deletion UI no longer mistakes a dry-run preflight for a completed deletion")
print(" - real recovery drill evidence is never fabricated")
print(" - no Build 422 schema migration detected")
