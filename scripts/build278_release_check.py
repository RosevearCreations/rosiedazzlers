#!/usr/bin/env python3
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
LOCATION_SLUGS = [
    "tillsonburg-auto-detailing",
    "woodstock-ingersoll-auto-detailing",
    "norwich-otterville-auto-detailing",
    "zorra-thamesford-embro-auto-detailing",
    "simcoe-delhi-auto-detailing",
    "port-dover-auto-detailing",
    "waterford-vittoria-auto-detailing",
    "port-rowan-turkey-point-auto-detailing",
]
errors = []


def read(rel):
    path = ROOT / rel
    if not path.exists():
        errors.append(f"missing {rel}")
        return ""
    return path.read_text(encoding="utf-8", errors="ignore")

for slug in LOCATION_SLUGS:
    rel = f"{slug}/index.html"
    body = read(rel)
    if not body:
        continue
    if 'data-build278="local-seo-depth"' not in body:
        errors.append(f"{rel} missing Build 278 depth marker")
    if len(re.findall(r"<h1\b", body, flags=re.I)) != 1:
        errors.append(f"{rel} must contain exactly one H1")
    canonical = f"https://rosiedazzlers.ca/{slug}"
    if canonical not in body:
        errors.append(f"{rel} missing canonical {canonical}")
    for token in ("/book", "/pricing#booking-planner", "/services", "operating water", "power"):
        if token not in body:
            errors.append(f"{rel} missing local decision/service-model token: {token}")
    for stale in ("customer-supplied garden hose", "household electricity rate", "standard exterior outlet"):
        if stale.lower() in body.lower():
            errors.append(f"{rel} contains stale customer-utility assumption: {stale}")

api = read("functions/api/landing_pages_public.js")
for token in (
    "LOCATION_UTILITY_ASSUMPTION_PATTERNS",
    "normalizeLocationServiceModel",
    "finalizeLandingPages",
    "self-contained mobile operating water and power",
    "does not depend on a customer hose or electrical outlet",
    "Local water-use restrictions, site rules, weather, drainage, or safety conditions"
):
    if token not in api:
        errors.append(f"landing_pages_public.js missing Build 278 service-model guard: {token}")

if "return finalizeLandingPages(applyWaterRestrictionRulesToLandingPages(found ? merged : fallback, waterRules));" not in api:
    errors.append("editable landing-page overrides are not finalized through the Build 278 service-model normalizer")

if errors:
    print("Build 278 local SEO/service-model check FAILED:")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("Build 278 local SEO/service-model check: PASS")
print(f"- {len(LOCATION_SLUGS)} indexed town pages have useful static fallback depth")
print("- customer hose/outlet assumptions are fail-closed at the final public API boundary")
print("- Rosie-supplied operating water/power remains canonical while real local restrictions can still affect timing")
