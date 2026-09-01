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

for slug in ADDON_SLUGS:
    body = read(f"{slug}/index.html")
    for href in ("/book", "/pricing", "/services"):
        if href not in body:
            errors.append(f"{slug} missing customer next-step link {href}")
    if "What’s included" not in body and "What's included" not in body:
        errors.append(f"{slug} missing included-scope guidance")
    if "What is not automatically included" not in body:
        errors.append(f"{slug} missing scope-exclusion guidance")

for slug in LOCATION_SLUGS:
    body = read(f"{slug}/index.html")
    for href in ("/book", "/pricing#booking-planner", "/services"):
        if href not in body:
            errors.append(f"{slug} missing local next-step link {href}")
    if not re.search(r"maintenance|routine|package", body, flags=re.I):
        errors.append(f"{slug} does not explain maintenance/package fit")
    if not re.search(r"specialist|restoration|focused service", body, flags=re.I):
        errors.append(f"{slug} does not distinguish specialist/restoration work")

landing_js = read("assets/landing-page.js")
for token in (
    'href="/book"',
    'href="/pricing#booking-planner"',
    'href="/services"',
    'h2 style="margin-top:0">Related pages',
    "row.nav_group === page.nav_group",
    "When we pause and re-quote",
):
    if token not in landing_js:
        errors.append(f"landing-page.js missing Build 279 decision/internal-link token: {token}")

if errors:
    print("Build 279 decision-path/internal-link check FAILED:")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("Build 279 decision-path/internal-link check: PASS")
print("- indexed add-on pages expose booking, pricing, service, included-scope and exclusion paths")
print("- indexed town pages distinguish routine package fit from specialist/restoration work")
print("- runtime related-page and re-quote navigation remains intact")
