#!/usr/bin/env python3
"""Build 487 source authority for Winter Booking Eligibility & Customer Transparency."""
from pathlib import Path
import re, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def read(path):
    p=ROOT/path
    if not p.is_file(): errors.append(f"missing required file: {path}"); return ""
    return p.read_text(encoding="utf-8",errors="ignore")
def require(text,needles,label):
    for needle in needles:
        if needle not in text: errors.append(f"{label} missing {needle!r}")
helper=read("functions/api/_lib/winter-booking-eligibility-customer-transparency.js")
endpoint=read("functions/api/admin/service_economics_commercial_capacity_review.js")
client=read("assets/build473-service-economics-allocation-margin-review-readiness.js")
page=read("admin-service-economics-commercial-capacity-review.html")
copy=read("admin-service-economics-commercial-capacity-review/index.html")
booking=read("functions/api/_lib/booking-funnel-quote-pricing-learning.js")
doc=read("BUILD487_WINTER_BOOKING_ELIGIBILITY_CUSTOMER_TRANSPARENCY.md")
roadmap=read("FORWARD_BUILD_ROADMAP_486_495.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
workflow=read(".github/workflows/winter-booking-eligibility-customer-transparency-authority.yml")
if page!=copy: errors.append("Build 487 protected route copies diverged")
if len(re.findall(r"<h1\b",page,re.I))!=1: errors.append("Build 487 page must retain exactly one H1")
require(helper,[
 "winter_booking_eligibility_enrichment_build: 487",
 'winter_booking_eligibility_authority: "winter_booking_eligibility_customer_transparency"',
 "conditional_winter_consideration","weather_condition_check_required","controlled_environment_required",
 "draft_owner_review_required",
 "ordinary_conversion_denominator_excludes_weather_ineligible: true",
 "weather_ineligible_session_is_conversion_failure: false",
 "automatic_booking_availability_change_allowed: false"
],"Build 487 helper")
require(endpoint,["buildWinterBookingEligibilityCustomerTransparency",'authority:"winter_booking_eligibility_customer_transparency"','retained_capability_authority:"cold_weather_service_capability_evidence_matrix"'],"Build 487 endpoint")
require(client,["renderWinterBookingEligibility","winterEligibilityGrid","Draft customer wording","Weather-ineligible sessions are excluded"],"Build 487 client")
require(page,[
 'data-build487="winter-booking-eligibility-customer-transparency"',
 "Build 487 · Winter Booking Eligibility &amp; Customer Transparency",
 'id="winterEligibilityGrid"',
 "Prepared wording is not published automatically."
],"Build 487 page")
require(booking,["weather_ineligible_session_is_conversion_failure:false","service_temperature_limit_inferred:false"],"retained booking conversion truth boundary")
require(doc,[
 "# Build 487 — Winter Booking Eligibility & Customer Transparency",
 "weather-ineligible sessions are excluded from ordinary conversion interpretation",
 "Prepared customer wording remains draft",
 "Build 488 — Controlled-Environment Alternatives & Weather-Safe Routing"
],"Build 487 contract")
require(roadmap,["### Build 487 — Winter Booking Eligibility & Customer Transparency","### Build 488 — Controlled-Environment Alternatives & Weather-Safe Routing"],"renewed roadmap")
require(queue,[
 "**Build 495 — Production Learning & Roadmap Renewal** is the active bounded release.",
 "**Build 496 — Seasonal Capability Owner Review & Public Claim Decision** is next",
 "BUILD487_WINTER_BOOKING_ELIGIBILITY_CUSTOMER_TRANSPARENCY.md",
 "it has not run out"
],"Build 487 queue")
require(handoff,[
 "**Build 495 — Production Learning & Roadmap Renewal** is the active bounded release.",
 "BUILD487_WINTER_BOOKING_ELIGIBILITY_CUSTOMER_TRANSPARENCY.md",
 "winter_booking_eligibility_customer_transparency_check.py"
],"Build 487 handoff")
require(readme,[
 "Current source direction: **Build 495 — Production Learning & Roadmap Renewal**.",
 "BUILD487_WINTER_BOOKING_ELIGIBILITY_CUSTOMER_TRANSPARENCY.md",
 "winter_booking_eligibility_customer_transparency_check.py",
 "Production is not considered GREEN from source promotion alone."
],"Build 487 README")
require(blockers,["Seasonal service capability & transparency","Broad winter-availability claims remain held"],"canonical HOLD backlog")
for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,["python scripts/winter_booking_eligibility_customer_transparency_check.py","node scripts/winter_booking_eligibility_customer_transparency_test.mjs"],label)
require(workflow,["Winter Booking Eligibility Customer Transparency Authority","python scripts/winter_booking_eligibility_customer_transparency_check.py","node scripts/winter_booking_eligibility_customer_transparency_test.mjs"],"Build 487 workflow")
migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])487(?:[^0-9]|$)",p.name)]
if migrations: errors.append("Build 487 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))
if errors:
    print("BUILD 487 WINTER BOOKING ELIGIBILITY & CUSTOMER TRANSPARENCY AUTHORITY: FAIL")
    for e in errors: print(" -",e)
    sys.exit(1)
for command in [
 [sys.executable,"scripts/cold_weather_service_capability_evidence_matrix_check.py"],
 ["node","scripts/cold_weather_service_capability_evidence_matrix_test.mjs"],
 ["node","scripts/winter_booking_eligibility_customer_transparency_test.mjs"]
]:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 487 WINTER BOOKING ELIGIBILITY & CUSTOMER TRANSPARENCY AUTHORITY: FAIL")
        print(proc.stderr.strip() or proc.stdout.strip()); sys.exit(proc.returncode)
print("BUILD 487 WINTER BOOKING ELIGIBILITY & CUSTOMER TRANSPARENCY AUTHORITY: PASS")
