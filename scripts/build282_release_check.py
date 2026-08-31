#!/usr/bin/env python3
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []
USE_CASES = {
    "pre-sale-lease-return-detailing": ("need=presale", "Complete Detail"),
    "spring-salt-recovery-detailing": ("need=spring_salt", "Interior Detail"),
    "fall-winter-protection-detailing": ("need=winter_prep", "Exterior Detail"),
}


def read(rel: str) -> str:
    path = ROOT / rel
    if not path.exists():
        errors.append(f"missing {rel}")
        return ""
    return path.read_text(encoding="utf-8", errors="ignore")


sitemap = read("sitemap.xml")
for slug, (need_param, starting_service) in USE_CASES.items():
    rel = f"{slug}/index.html"
    body = read(rel)
    if len(re.findall(r"<h1\b", body, flags=re.I)) != 1:
        errors.append(f"{rel} must contain exactly one H1")
    canonical = f"https://rosiedazzlers.ca/{slug}"
    if canonical not in body:
        errors.append(f"{rel} missing production canonical {canonical}")
    if f"<loc>{canonical}/</loc>" not in sitemap:
        errors.append(f"sitemap missing {slug}")
    for token in [
        'data-build282="usecase-conversion"',
        '"@type":"Service"',
        '"@type":"BreadcrumbList"',
        '"@type":"FAQPage"',
        "Rosie brings standard detailing water and power",
        need_param,
        starting_service,
    ]:
        if token not in body:
            errors.append(f"{rel} missing Build 282 token: {token}")
    if not re.search(r"confirm(?:s|ed)? (?:the )?(?:expanded )?scope|pause and re-quote|before proceeding", body, flags=re.I):
        errors.append(f"{rel} missing expanded-work confirmation boundary")
    if not re.search(r'<meta name="description" content=".{70,240}"', body, flags=re.I):
        errors.append(f"{rel} needs a useful meta description")

entry = read("assets/booking-usecase-entry-v282.js")
for token in [
    "booking_usecase_entry",
    'presale:',
    'spring_salt:',
    'winter_prep:',
    'buttonNeed: "presale"',
    'buttonNeed: "deep_interior"',
    'buttonNeed: "paint"',
    "Build 282 use case:",
    "startingService",
]:
    if token not in entry:
        errors.append(f"booking-usecase-entry-v282.js missing {token}")
for forbidden in ["/api/checkout", "STRIPE_SECRET_KEY", "PAYPAL_CLIENT_SECRET", "prices_cad", "deposit_cad"]:
    if forbidden in entry:
        errors.append(f"booking-usecase-entry-v282.js must not own transaction/pricing authority: {forbidden}")

hours = read("assets/booking-hours.js")
for token in ["loadBuild282UseCaseEntry", "/assets/booking-usecase-entry-v282.js", "Standard booking remains available"]:
    if token not in hours:
        errors.append(f"booking-hours.js missing Build 282 fail-open loader token: {token}")

specials = read("specials.html")
specials_clean = read("specials/index.html")
if specials != specials_clean:
    errors.append("specials.html and specials/index.html route copies drifted")
for slug in USE_CASES:
    if f'href="/{slug}"' not in specials:
        errors.append(f"specials discovery missing {slug}")
for stale in ["Multi-Vehicle Same-Address Discount", "Senior-Friendly Offer"]:
    if stale in specials:
        errors.append(f"specials still presents unapproved offer language: {stale}")

summary = read("BUILD282_SUMMARY.md")
for token in ["Pre-Sale / Lease-Return", "Spring Salt Recovery", "Fall / Winter Protection", "Production remains closed"]:
    if token not in summary:
        errors.append(f"Build 282 summary missing {token}")

release = read("scripts/release_check.py")
if "scripts/build282_release_check.py" not in release:
    errors.append("cumulative release check does not invoke Build 282 guard")

if errors:
    print("Build 282 use-case conversion check FAILED:")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("Build 282 use-case conversion check: PASS")
print("- three crawlable high-intent use-case pages retain one-H1, canonical, Service/Breadcrumb/FAQ and mobile operating authority")
print("- acquisition URLs map into existing Quick Book recommendations without owning pricing/checkout authority")
print("- condition-dependent work retains photo/re-quote boundaries")
print("- specials discovery no longer implies unapproved discounts")
print("- Production remains closed")
