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
LOCATION_SLUGS = [
    "tillsonburg-auto-detailing", "woodstock-ingersoll-auto-detailing", "norwich-otterville-auto-detailing",
    "zorra-thamesford-embro-auto-detailing", "simcoe-delhi-auto-detailing", "port-dover-auto-detailing",
    "waterford-vittoria-auto-detailing", "port-rowan-turkey-point-auto-detailing"
]
errors = []


def read(rel):
    path = ROOT / rel
    if not path.exists():
        errors.append(f"missing {rel}")
        return ""
    return path.read_text(encoding="utf-8", errors="ignore")

sitemap = read("sitemap.xml")
for slug in ADDON_SLUGS + LOCATION_SLUGS:
    loc = f"https://rosiedazzlers.ca/{slug}/"
    if sitemap.count(f"<loc>{loc}</loc>") != 1:
        errors.append(f"sitemap must contain exactly one {loc}")

for slug in LOCATION_SLUGS:
    match = re.search(
        rf"<loc>https://rosiedazzlers\.ca/{re.escape(slug)}/</loc>\s*<lastmod>([^<]+)</lastmod>",
        sitemap,
        flags=re.S,
    )
    if not match or match.group(1).strip() != "2026-08-31":
        errors.append(f"{slug} sitemap lastmod must be 2026-08-31")

for slug in ADDON_SLUGS + LOCATION_SLUGS:
    body = read(f"{slug}/index.html")
    if len(re.findall(r"<h1\b", body, flags=re.I)) != 1:
        errors.append(f"{slug} must retain exactly one H1")
    if f"https://rosiedazzlers.ca/{slug}" not in body:
        errors.append(f"{slug} missing production canonical URL")

feature_gate = read(".github/workflows/build277-280-source-gate.yml")
dev_gate = read(".github/workflows/development-source-gate.yml")
dev_accept = read(".github/workflows/cloudflare-development-acceptance.yml")
for build in range(277, 281):
    token = f"python scripts/build{build}_release_check.py"
    if token not in feature_gate:
        errors.append(f"feature source gate missing Build {build}")
    if token not in dev_gate:
        errors.append(f"Development Source Gate missing Build {build}")
    if token not in dev_accept:
        errors.append(f"Development acceptance missing Build {build}")

summary = read("BUILD277_280_SUMMARY.md")
for token in ("Build 277", "Build 278", "Build 279", "Build 280", "Production/main remains closed"):
    if token not in summary:
        errors.append(f"batch summary missing {token}")

if errors:
    print("Build 280 SEO closure check FAILED:")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("Build 280 SEO closure check: PASS")
print("- service/add-on and location destinations are covered exactly once by sitemap")
print("- changed local pages carry current lastmod, one-H1 and production canonical authority")
print("- Builds 277-280 are wired into feature, Development source and Development acceptance gates")
print("- Production remains explicitly closed")
