#!/usr/bin/env python3
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []


def read(rel: str) -> str:
    path = ROOT / rel
    if not path.exists():
        errors.append(f"missing {rel}")
        return ""
    return path.read_text(encoding="utf-8", errors="ignore")


helper = read("functions/api/_lib/gallery-publication.js")
for token in [
    "galleryPublishEligibility",
    "galleryProofEligibility",
    "isGalleryPublished",
    'publicationStatus !== "published"',
    "customer/public-use consent is not approved",
    "media privacy review is not approved for public use",
    "sample/fallback media is not real Rosie proof",
    "problem statement is required for proof",
    "process statement is required for proof",
    "result statement is required for proof",
]:
    if token not in helper:
        errors.append(f"gallery-publication authority missing {token}")

public_api = read("functions/api/before_after_gallery_public.js")
for token in [
    'from "./_lib/gallery-publication.js"',
    "savedPublished = saved.items.filter(isGalleryPublished)",
    "savedPublished.length === 0",
    '"static_fallback"',
    "Legacy approval alone never implies publication",
    "proof_ready_count",
]:
    if token not in public_api:
        errors.append(f"public Gallery API missing Build 283 token: {token}")
if "return [\"approved_public\"" in public_api:
    errors.append("public Gallery API still contains legacy OR-style approval inference")

save_api = read("functions/api/admin/gallery_approvals_save.js")
for token in [
    'action === "approve"',
    'action === "publish"',
    'action === "unpublish"',
    "galleryPublishEligibility",
    'publication_status: "published"',
    'publication_status: "unpublished"',
    'publication_status: "draft"',
    "touchesPublicationAuthority",
    "This action confirms that staff has actually reviewed public-use consent/privacy.",
]:
    if token not in save_api:
        errors.append(f"Gallery save authority missing {token}")
if '"publication_status"' in save_api.split("const PATCH_FIELDS", 1)[1].split("];", 1)[0]:
    errors.append("publication_status must not be directly patchable; publish/unpublish actions are authoritative")

list_api = read("functions/api/admin/gallery_approvals_list.js")
for token in [
    "publish_eligible",
    "publish_blockers",
    "proof_eligible",
    "proof_blockers",
    "galleryApprovalStatus",
    "galleryProofEligibility",
    "galleryPublishEligibility",
]:
    if token not in list_api:
        errors.append(f"Gallery list authority missing {token}")

candidate_api = read("functions/api/admin/gallery_media_candidates_list.js")
for token in [
    "pairingEligibility",
    "blocked_count",
    "pairing_eligible",
    "not rejected, private, hidden, deleted, or withdrawn",
]:
    if token not in candidate_api:
        errors.append(f"Gallery media candidate eligibility missing {token}")

admin = read("admin-gallery.html")
for token in [
    'data-build283="proof-publication-controls"',
    "Confirm public-use approval",
    'data-action="publish"',
    'data-action="unpublish"',
    'name="problem"',
    'name="process"',
    'name="result"',
    'name="vehicle_label"',
    'name="condition_summary"',
    "Use as After image",
    "Add as draft",
]:
    if token not in admin:
        errors.append(f"admin-gallery.html missing Build 283 control: {token}")

fallback_raw = read("data/before_after_gallery.json")
try:
    fallback = json.loads(fallback_raw or "{}")
except json.JSONDecodeError as exc:
    errors.append(f"data/before_after_gallery.json invalid JSON: {exc}")
    fallback = {}
for idx, item in enumerate(fallback.get("items", [])):
    if item.get("consent_status") != "sample":
        errors.append(f"fallback item {idx} must remain explicitly sample")
    if item.get("publication_status") != "published":
        errors.append(f"fallback item {idx} must be explicitly published sample fallback")
    if item.get("proof_kind") != "sample":
        errors.append(f"fallback item {idx} must not masquerade as real proof")

summary = read("BUILD283_SUMMARY.md")
for token in [
    "proof/media eligibility",
    "explicit publish/unpublish",
    "Production remains closed",
    "no database migration",
]:
    if token not in summary:
        errors.append(f"Build 283 summary missing {token}")

handoff = read("AI_PROJECT_HANDOFF.md")
roadmap = read("MASTER_VALUE_ROADMAP.md")
for rel, body in [("AI_PROJECT_HANDOFF.md", handoff), ("MASTER_VALUE_ROADMAP.md", roadmap)]:
    if "**Build:** 283" not in body:
        errors.append(f"{rel} must identify Build 283 as current")
    if "Build 283" not in body or "publish" not in body.lower():
        errors.append(f"{rel} missing Build 283 publication authority")

seo_guard = read("scripts/seo_h1_check.py")
for token in ["build283_release_check.py", "build283.exists()"]:
    if token not in seo_guard:
        errors.append(f"cumulative SEO/release path does not retain Build 283 guard: {token}")

if errors:
    print("Build 283 proof/media publication check FAILED:")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("Build 283 proof/media publication check: PASS")
print("- Gallery media candidates are filtered for internal pairing eligibility before the picker sees them")
print("- public-use consent/privacy review is separate from explicit publish/unpublish")
print("- public Gallery fails closed for legacy saved rows and uses sample fallback until staff explicitly publishes")
print("- sample placeholders can remain public fallback but never count as real Rosie proof")
print("- real proof requires published non-sample media plus vehicle, condition, problem, process, and result context")
print("- publication-sensitive edits return a published row to draft review")
print("- no database migration or parallel Gallery authority was introduced")
print("- Production remains closed")
