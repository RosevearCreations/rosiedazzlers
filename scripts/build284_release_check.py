#!/usr/bin/env python3
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []

ADDON_SLUGS = [
    "full-clay-treatment", "two-stage-polish", "high-grade-paint-sealant", "uv-protectant",
    "de-ionizing-treatment", "de-badging", "engine-cleaning", "ceramic-coating", "graphene-finish",
    "exterior-wax", "vinyl-wrapping", "window-tinting", "pet-hair-removal", "odor-removal",
    "seat-shampoo", "carpet-shampoo", "salt-stain-treatment", "headlight-restoration",
    "windshield-ceramic-coating", "ceramic-spray-wax", "trim-restoration", "bug-tar-removal",
    "truck-box-wash", "fleet-vehicle-add-on"
]
LOCATION_SLUGS = [
    "tillsonburg-auto-detailing", "woodstock-ingersoll-auto-detailing", "norwich-otterville-auto-detailing",
    "zorra-thamesford-embro-auto-detailing", "simcoe-delhi-auto-detailing", "port-dover-auto-detailing",
    "waterford-vittoria-auto-detailing", "port-rowan-turkey-point-auto-detailing"
]
USE_CASE_SLUGS = [
    "pre-sale-lease-return-detailing", "spring-salt-recovery-detailing", "fall-winter-protection-detailing"
]


def read(rel: str) -> str:
    path = ROOT / rel
    if not path.exists():
        errors.append(f"missing {rel}")
        return ""
    return path.read_text(encoding="utf-8", errors="ignore")


proof = read("assets/contextual-proof-v284.js")
for token in [
    "Build 284",
    'PUBLIC_GALLERY_API = "/api/before_after_gallery_public"',
    "isRealProof",
    'normalizePublication(item.publication_status) !== "published"',
    "PUBLIC_APPROVALS.has(normalizeApproval(item.consent_status))",
    "PUBLIC_APPROVALS.has(normalizeApproval(item.media_privacy_status))",
    'clean(item.proof_kind).toLowerCase() === "sample"',
    "vehicle_label",
    "condition_summary",
    "item.problem",
    "item.process",
    "item.result",
    "MAX_PROOF_CARDS = 3",
    'kind: "service"',
    'kind: "location"',
    'kind: "usecase"',
    "LOCATION_TOWNS",
    "USE_CASES",
    'data-build284-contextual-proof',
    'no-real-matching-proof',
    "relevant evidence, not a claim",
    "Published customer-approved proof",
    "Real Rosie work",
]:
    if token not in proof:
        errors.append(f"contextual-proof-v284.js missing {token}")

for forbidden in [
    "customer_name", "testimonial", "STRIPE_SECRET", "PAYPAL_CLIENT_SECRET", "/api/admin/",
    "SUPABASE_SERVICE", "INSERT INTO", "UPDATE gallery", "prices_cad", "deposit_cad"
]:
    if forbidden.lower() in proof.lower():
        errors.append(f"contextual-proof-v284.js must not own private/review/transaction authority: {forbidden}")

bootstrap = read("assets/visual-placeholders.js")
for token in [
    "loadBuild284ContextualProof",
    "/assets/contextual-proof-v284.js",
    "data-build284-contextual-proof-bootstrap",
    'data-build282="usecase-conversion"',
    'data-build278="local-seo-depth"',
    "data-landing-slug",
    "#rd-landing",
]:
    if token not in bootstrap:
        errors.append(f"visual-placeholders.js missing Build 284 bootstrap token: {token}")

# Every page class covered by Build 284 must already participate in the first-party chrome/visual bootstrap.
for slug in ADDON_SLUGS:
    rel = f"{slug}/index.html"
    body = read(rel)
    if body and "/assets/chrome.js" not in body:
        errors.append(f"{rel} does not load the shared chrome/visual bootstrap")
    if body and not ("data-landing-slug" in body or 'id="rd-landing"' in body):
        errors.append(f"{rel} lacks a service landing marker for Build 284")

for slug in LOCATION_SLUGS:
    rel = f"{slug}/index.html"
    body = read(rel)
    if body and "/assets/chrome.js" not in body:
        errors.append(f"{rel} does not load the shared chrome/visual bootstrap")
    if body and not ('data-build278="local-seo-depth"' in body or 'id="rd-landing"' in body):
        errors.append(f"{rel} lacks a location marker for Build 284")

for slug in USE_CASE_SLUGS:
    rel = f"{slug}/index.html"
    body = read(rel)
    if body and "/assets/chrome.js" not in body:
        errors.append(f"{rel} does not load the shared chrome/visual bootstrap")
    if body and 'data-build282="usecase-conversion"' not in body:
        errors.append(f"{rel} lacks the retained Build 282 use-case marker")

# Build 283 remains the only publication/proof authority.
publication = read("functions/api/_lib/gallery-publication.js")
public_api = read("functions/api/before_after_gallery_public.js")
for token in ["galleryProofEligibility", "galleryPublishEligibility", "isGalleryPublished"]:
    if token not in publication:
        errors.append(f"Build 283 publication authority missing {token}")
for token in ["real Rosie proof", "publication_rule", "proof_rule"]:
    if token.lower() not in public_api.lower():
        errors.append(f"public Gallery API missing retained Build 283 contract: {token}")

summary = read("BUILD284_SUMMARY.md")
for token in [
    "contextual proof placement", "service", "location", "use-case", "fail-closed",
    "Build 283", "sample", "Production remains closed"
]:
    if token.lower() not in summary.lower():
        errors.append(f"Build 284 summary missing {token}")

handoff = read("AI_PROJECT_HANDOFF.md")
roadmap = read("MASTER_VALUE_ROADMAP.md")
for rel, body in [("AI_PROJECT_HANDOFF.md", handoff), ("MASTER_VALUE_ROADMAP.md", roadmap)]:
    for token in ["Build:** 284", "Build 284", "contextual proof"]:
        if token.lower() not in body.lower():
            errors.append(f"{rel} missing {token}")

# Retained literal compatibility contract from Build 273.
if "### 9. Payments / Finance / accounting" not in roadmap:
    errors.append("MASTER_VALUE_ROADMAP.md must retain Finance heading ### 9. Payments / Finance / accounting")

feature_gate = read(".github/workflows/build284-source-gate.yml")
for token in ["Build 284 Source Gate", "build284-contextual-proof-placement", "build284_release_check.py", "build283_release_check.py"]:
    if token not in feature_gate:
        errors.append(f"Build 284 feature gate missing {token}")

dev_gate = read(".github/workflows/development-source-gate.yml")
cf_gate = read(".github/workflows/cloudflare-development-acceptance.yml")
for rel, body in [("development-source-gate.yml", dev_gate), ("cloudflare-development-acceptance.yml", cf_gate)]:
    if "build284_release_check.py" not in body:
        errors.append(f"{rel} does not run Build 284 guard")
if "through Build 276" not in cf_gate:
    errors.append("cloudflare-development-acceptance.yml must retain literal through Build 276 compatibility marker")

smoke = read("scripts/development_http_smoke.sh")
for token in ["/assets/contextual-proof-v284.js", "Build 284", "no-real-matching-proof"]:
    if token not in smoke:
        errors.append(f"development_http_smoke.sh missing Build 284 token: {token}")

seo_guard = read("scripts/seo_h1_check.py")
for token in ["build284_release_check.py", "subprocess.run"]:
    if token not in seo_guard:
        errors.append(f"cumulative SEO path does not retain Build 284 guard: {token}")

if errors:
    print("Build 284 contextual proof placement check FAILED:")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("Build 284 contextual proof placement check: PASS")
print("- one shared public renderer uses only the Build 283 public Gallery authority")
print("- client presentation independently rejects sample/unpublished/unapproved/incomplete rows")
print("- service, location and Build 282 use-case page classes are context-matched without fabricated claims")
print("- zero matching real proof fails closed and existing public proof placeholders are hidden")
print("- at most three published before/after records are shown with vehicle, condition and problem/process/result context")
print("- no database, pricing, booking, review or private-media authority was introduced")
print("- Production remains closed")
