#!/usr/bin/env python3
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
errors=[]

def text(rel):
    path=ROOT/rel
    if not path.exists():
        errors.append(f"missing {rel}")
        return ""
    return path.read_text(encoding="utf-8",errors="ignore")

def require(rel,*tokens):
    body=text(rel)
    for token in tokens:
        if token not in body:
            errors.append(f"{rel} missing {token}")
    return body

upload=require(
    "functions/api/admin/media_asset_upload.js",
    "const BUILD=408",
    "bucket_identity:identity",
    "retry_safe_same_key:true",
    "retry_key:key",
    "result_status:\"complete\"",
    "customMetadata: { uploaded_by: access.actor?.email || \"staff\", build: String(BUILD) }",
)
for binding in ["ROSIE_PUBLIC_ASSETS_BUCKET","PUBLIC_ASSETS_BUCKET","R2_PUBLIC_ASSETS_BUCKET","ASSETS_BUCKET"]:
    if binding not in upload: errors.append(f"upload binding identity missing {binding}")

sync=require(
    "functions/api/admin/photo_library_sync.js",
    "const BUILD=408",
    "Build 260 sync requires one approved R2 prefix per request.",
    "mode:'single_prefix_page'",
    "result_status:resultStatus",
    "partial_result:resultStatus==='partial'",
    "retry:{prefix:requested,cursor:String(result?.next_cursor||''),same_request_safe:true}",
    "bucket_identity:identity",
)

library=require(
    "functions/api/_lib/photo-library.js",
    "maxListPagesPerPrefix:1",
    "limitPerPrefix:100",
    "next_cursor:nextCursor",
    "has_more:Boolean(nextCursor)",
)

assignment=require(
    "functions/api/admin/photo_assignment_save.js",
    "loadAssignablePublicPhoto",
    "action==='remove'||action==='reset'||action==='unassign'",
    "asset_deleted:false",
    "Before and After must use two different photos",
)

delete=require(
    "functions/api/admin/photo_library_delete.js",
    "const BUILD=408",
    "const DELETE_CONFIRM='DELETE_UNASSIGNED_R2_ASSET'",
    "dry_run:true",
    "eligible:true",
    "unassigned:true",
    "mutation_performed:false",
    "asset_deleted:false",
    "body.allow_r2_delete!==true",
    "adminAuthorized",
    "currently assigned and cannot be deleted",
    "Gallery Before/After row and cannot be deleted",
    "await bucket.delete(r2Key)",
    "mutation_performed:true",
    "asset_deleted:true",
    "explicit_authority_used:true",
    "bucket_identity:identity",
)

# Dry-run must occur before any destructive persistence block.
dry_pos=delete.find("if(!executeRequested)")
mutation_pos=delete.find("const restoreHistory")
if dry_pos < 0 or mutation_pos < 0 or dry_pos >= mutation_pos:
    errors.append("delete dry-run guard does not precede destructive persistence")
admin_pos=delete.find("const adminAuthorized")
confirmation_pos=delete.find("body.allow_r2_delete!==true")
r2_delete_pos=delete.find("await bucket.delete(r2Key)")
if not (0 <= admin_pos < confirmation_pos < r2_delete_pos):
    errors.append("explicit admin + confirmation authority does not precede R2 delete")

if errors:
    print("Build 408 Media / R2 Operational Acceptance: FAIL")
    for error in errors:
        print(" -",error)
    raise SystemExit(1)

print("Build 408 Media / R2 Operational Acceptance: PASS")
print(" - upload reports bucket/environment identity and same-key recovery evidence")
print(" - listing/sync remains prefix-bounded with truthful continuation/partial status")
print(" - assignment remains public-only and unassign/reset is non-destructive")
print(" - deletion is dry-run by default and destructive R2 mutation is separately authorized")
