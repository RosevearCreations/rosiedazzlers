#!/usr/bin/env python3
"""Build 314 — Media / Photo Studio reliability source acceptance."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def require(text: str, needle: str, label: str) -> None:
    if needle not in text:
        raise SystemExit(f"Build 314 FAIL: {label} missing: {needle}")


def reject(text: str, needle: str, label: str) -> None:
    if needle in text:
        raise SystemExit(f"Build 314 FAIL: {label} unexpectedly contains: {needle}")


sync = read("functions/api/admin/photo_library_sync.js")
photo_lib = read("functions/api/_lib/photo-library.js")
listing = read("functions/api/admin/photo_library_list.js")
assignment = read("functions/api/admin/photo_assignment_save.js")
delete = read("functions/api/admin/photo_library_delete.js")
studio = read("admin-photo-studio.html")

# Cloudflare/R2 safety: one explicit sync call is a bounded page, while ordinary
# Photo Studio loads remain database-only.
require(sync, "limit:100", "bounded R2 sync page")
require(photo_lib, "loadMediaLibraryRowsByR2Keys", "bounded sync reconciliation")
require(listing, "r2_scan_per_load:false", "database-only ordinary Photo Studio load")
reject(listing, "listApprovedR2Images", "ordinary library load")
require(studio, "R2 sync complete in ${totals.pages} bounded request", "bounded sync UI reporting")

# Assignment tracking is carried on each photo so deletion/editor views do not
# have to guess whether a photo is in use.
require(listing, "assignment_tracking:'per_photo_active_targets'", "per-photo assignment authority")
require(listing, "photo.assigned_targets=placements", "exact assigned target list")
require(listing, "photo.before_after_slots=placements.filter", "before/after placement tracking")
require(listing, "limit:1600", "assignment-query safety cap")

# Before/After pairs must use different source images.
require(assignment, "counterpartTargetKey", "pair counterpart resolver")
require(assignment, "Before and After must use two different photos", "same-photo pair rejection")
require(assignment, "pair_conflict", "pair conflict response")

# Deletion is fail-closed for both Photo Studio assignments and Gallery proof,
# which is stored outside app_media_assignments.
require(delete, "is_active=eq.true", "active assignment delete guard")
require(delete, "loadEditableSetting(env,'before_after_gallery'", "Gallery reference lookup")
require(delete, "gallery_referenced:true", "Gallery delete refusal")
require(delete, "Gallery Before/After row", "operator-facing Gallery delete reason")
require(delete, "restored:true", "R2 delete compensation")

# Existing Studio UX must continue to explain paired-slot behavior and require
# explicit writes; Build 314 is reliability hardening, not an automatic remap.
require(studio, "The public Before & After set appears only when both sides are assigned", "paired-slot UX")
require(studio, "Nothing changes until you press", "explicit assignment UX")

print("Build 314 GREEN: bounded sync, exact placement tracking, distinct Before/After pairing, and fail-closed deletion are present.")
