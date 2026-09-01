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


def has_quote_boundary(body):
    # Pages may use the shared generic heading or specialist wording. What matters
    # is that deeper/expanded work cannot silently proceed without scope confirmation.
    patterns = [
        r"When we pause and re-quote",
        r"confirm(?:s|ed)? (?:the )?(?:expanded|extra|deeper|additional) (?:scope|work|labou?r)",
        r"confirm expanded scope before proceeding",
        r"before extra work begins",
        r"stop(?:s)? (?:and )?confirm",
        r"approval.*(?:deeper|expanded|additional) (?:work|scope|labou?r)",
    ]
    return any(re.search(pattern, body, flags=re.I | re.S) for pattern in patterns)


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
    for marker in ("service-condition-pricing", "Frequently asked questions"):
        if marker not in body:
            errors.append(f"{rel} missing decision-depth marker: {marker}")
    if not has_quote_boundary(body):
        errors.append(f"{rel} missing a clear expanded-work confirmation/re-quote boundary")
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
print(f"- {len(ADDON_SLUGS)} indexed add-on pages retain one-H1, canonical, condition pricing, explicit expanded-work boundaries and FAQ depth")
print("- specialist pages may use service-specific quote language without being forced into duplicated boilerplate")
print("- generated fallback guidance is customer-facing rather than SEO-about-SEO")
