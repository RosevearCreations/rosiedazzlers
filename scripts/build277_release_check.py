#!/usr/bin/env python3
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
ADDON_SLUGS = [
    "full-clay-treatment", "two-stage-polish", "high-grade-paint-sealant", "uv-protectant",
    "de-ionizing-treatment", "de-badging", "engine-cleaning", "ceramic-coating", "graphene-finish",
    "exterior-wax", "vinyl-wrapping", "window-tinting", "pet-hair-removal", "odor-removal",
    "seat-shampoo", "carpet-shampoo", "salt-stain-treatment", "headlight-restoration",
    "windshield-ceramic-coating", "ceramic-spray-wax", "trim-restoration", "bug-tar-removal",
    "truck-box-wash", "fleet-vehicle-add-on"
]
errors = []


def read(rel):
    path = ROOT / rel
    if not path.exists():
        errors.append(f"missing {rel}")
        return ""
    return path.read_text(encoding="utf-8", errors="ignore")

sitemap = read("sitemap.xml")
for slug in ADDON_SLUGS:
    rel = f"{slug}/index.html"
    body = read(rel)
    if not body:
        continue
    if len(re.findall(r"<h1\b", body, flags=re.I)) != 1:
        errors.append(f"{rel} must contain exactly one H1")
    canonical = f'https://rosiedazzlers.ca/{slug}'
    if canonical not in body:
        errors.append(f"{rel} missing production canonical {canonical}")
    if f"<loc>{canonical}/</loc>" not in sitemap:
        errors.append(f"sitemap missing {slug}")
    for marker in ("service-condition-pricing", "When we pause and re-quote", "Frequently asked questions"):
        if marker not in body:
            errors.append(f"{rel} missing decision-depth marker: {marker}")
    if not re.search(r'<meta name="description" content=".{70,220}"', body, flags=re.I):
        errors.append(f"{rel} needs a useful meta description")

api = read("functions/api/landing_pages_public.js")
for token in (
    "defaultAddonLandingHighlights",
    "condition, preparation, labour, and safe expectations",
    "pricing basis, process, limitations, aftercare",
    "Zero-dollar or missing prices mean Quote required, not a free service."
):
    if token not in api:
        errors.append(f"landing_pages_public.js missing Build 277 token: {token}")

# Generated fallback copy must talk to customers, not explain SEO mechanics to them.
for stale in ("It gives local search engines", "stronger local destination for service-specific search intent"):
    if stale in api:
        errors.append(f"generated add-on fallback still contains SEO-about-SEO copy: {stale}")

if errors:
    print("Build 277 service/add-on depth check FAILED:")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("Build 277 service/add-on depth check: PASS")
print(f"- {len(ADDON_SLUGS)} indexed add-on pages retain one-H1, canonical, condition pricing, quote triggers and FAQ depth")
print("- generated fallback guidance is customer-facing rather than SEO-about-SEO")
