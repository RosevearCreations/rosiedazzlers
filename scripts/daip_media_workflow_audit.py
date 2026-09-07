#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def text(path: str) -> str:
    target = ROOT / path
    if not target.exists():
        raise SystemExit(f"FAIL: required file is missing: {path}")
    return target.read_text(encoding="utf-8")


def require(source: str, needle: str, label: str) -> None:
    if needle not in source:
        raise SystemExit(f"FAIL: {label}: missing {needle!r}")
    print(f"PASS: {label}")


def forbid(source: str, needle: str, label: str) -> None:
    if needle in source:
        raise SystemExit(f"FAIL: {label}: forbidden {needle!r}")
    print(f"PASS: {label}")


api = text("functions/api/admin/daip_media_workflow.js")
page = text("admin-daip-media-workflow.html")
shell = text("app/daip/index.html")
private_intake = text("admin-daip-media.html")
photo_studio = text("admin-photo-studio.html")

require(api, "project.content_package_status==='approved'", "content package approval is required")
require(api, "project.consent_status==='approved_public'", "project public consent is required")
require(api, "Boolean(project.public_publish_allowed)", "explicit project publish authority is required")
require(api, "selectedPublic.length===selected.length", "every selected item requires public-use consent")
require(api, "raw_media_public:false", "raw media remains non-public")
require(api, "raw_media_copy_to_public:false", "workflow does not copy raw media into public storage")
require(api, "auto_publish:false", "workflow cannot auto-publish")
require(api, "auto_processing_started_by_this_endpoint:false", "workflow read does not start processing")
require(api, "raw_object_keys_included:false", "handoff excludes private object keys")
require(api, "raw_urls_included:false", "handoff excludes private raw URLs")
require(api, "selected_private_asset_ids:selected.map", "handoff uses identifiers instead of raw locations")
require(api, "photo_studio:publicHandoffReady?", "Photo Studio link is readiness gated")
forbid(api, "method:'POST'", "workflow API performs no POST mutation")
forbid(api, "method:'PATCH'", "workflow API performs no PATCH mutation")
forbid(api, "method:'DELETE'", "workflow API performs no DELETE mutation")

require(page, "Creative Project, private Media Intake, review/content-package gate, and approved-public Photo Studio handoff", "workspace states the consolidated authority chain")
require(page, "This page does not upload, process, copy, publish, or expose raw media.", "workspace states its read-only boundary")
require(page, "/api/admin/daip_media_workflow", "workspace consumes the Build 352 read model")
require(page, "There is no timer, polling loop, or background job trigger.", "workspace states bounded manual loading")
forbid(page, "setInterval(", "workspace has no polling interval")
forbid(page, "setTimeout(", "workspace has no background retry timer")

require(shell, "/admin-daip-media-workflow.html", "DAIP shell exposes the governed workflow entry point")
require(shell, "Creative Project → private Media Intake → evidence review → Content Package → explicit approved-public Photo Studio handoff", "DAIP shell documents the same workflow")
require(private_intake, "Nothing uploaded here is automatically published", "private intake retains non-publishing boundary")
require(private_intake, "Raw privacy remains private_internal and public destination remains disabled.", "private asset review retains private destination")
require(photo_studio, "Sync approved R2 photos", "Photo Studio remains the approved-public image authority")
require(photo_studio, "Only <em>Save explicit override</em> intentionally changes an established image target", "Photo Studio retains deliberate placement authority")

print("PASS: Build 352 DAIP media workflow authority is converged without schema changes or background processing.")
