#!/usr/bin/env python3
"""Build 497 source authority for Winter Booking & Quote Rule Activation Readiness."""
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

helper=read("functions/api/_lib/winter-booking-quote-rule-activation-readiness.js")
endpoint=read("functions/api/admin/service_economics_commercial_capacity_review.js")
client=read("assets/build473-service-economics-allocation-margin-review-readiness.js")
page=read("admin-service-economics-commercial-capacity-review.html")
copy=read("admin-service-economics-commercial-capacity-review/index.html")
availability=read("functions/api/availability.js")
checkout=read("functions/api/checkout.js")
doc=read("BUILD497_WINTER_BOOKING_QUOTE_RULE_ACTIVATION_READINESS.md")
roadmap=read("FORWARD_BUILD_ROADMAP_496_505.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
workflow=read(".github/workflows/winter-booking-quote-rule-activation-readiness-authority.yml")
if page!=copy: errors.append("Build 497 protected route copies diverged")
if len(re.findall(r"<h1\b",page,re.I))!=1: errors.append("Build 497 page must retain exactly one H1")
require(helper,[
 "winter_booking_quote_activation_readiness_build: 497",
 'winter_booking_quote_activation_readiness_authority: "winter_booking_quote_rule_activation_readiness"',
 'retained_availability_authority: "/api/availability"',
 'retained_checkout_collision_authority: "checkout_server_side_collision_revalidation"',
 "activation_readiness_review_ready","hold_activation",
 "automatic_activation_authorized: false",
 "automatic_booking_rule_change_authorized: false",
 "automatic_quote_rule_change_authorized: false",
 "broad_winter_availability_authorized: false",
 "weather_ineligible_session_is_conversion_failure: false"
],"Build 497 helper")
require(endpoint,[
 "buildWinterBookingQuoteRuleActivationReadiness",
 'authority:"winter_booking_quote_rule_activation_readiness"',
 'retained_availability_authority:"/api/availability"'
],"Build 497 endpoint")
require(client,[
 "renderWinterRuleActivationReadiness","winterRuleActivationReadinessGrid",
 "Activation readiness review ready","No automatic winter rule activation"
],"Build 497 client")
require(page,[
 'data-build497="winter-booking-quote-rule-activation-readiness"',
 "Build 497 · Winter Booking &amp; Quote Rule Activation Readiness",
 'id="winterRuleActivationReadinessGrid"',
 "Availability and checkout collision revalidation remain authoritative."
],"Build 497 page")
require(availability,[
 "Existing AM/PM booleans remain authoritative; checkout revalidates collisions before booking."
],"availability authority")
require(checkout,[
 "Selected slot not available",
 "bookingConflict",
 "return corsJson({ error: \"Selected slot not available\" }, 409)"
],"checkout collision authority")
require(doc,[
 "# Build 497 — Winter Booking & Quote Rule Activation Readiness",
 "activation_readiness_review_ready",
 "Weather-ineligible sessions remain outside ordinary conversion interpretation",
 "Build 498 — Controlled-Environment Site Qualification & Service Routing Evidence"
],"Build 497 contract")
require(roadmap,[
 "### Build 497 — Winter Booking & Quote Rule Activation Readiness",
 "### Build 498 — Controlled-Environment Site Qualification & Service Routing Evidence"
],"active roadmap")
require(queue,[
 "**Build 497 — Winter Booking & Quote Rule Activation Readiness** is the active bounded release.",
 "**Build 498 — Controlled-Environment Site Qualification & Service Routing Evidence** is next",
 "BUILD497_WINTER_BOOKING_QUOTE_RULE_ACTIVATION_READINESS.md",
 "it has not run out"
],"Build 497 queue")
require(handoff,[
 "**Build 497 — Winter Booking & Quote Rule Activation Readiness** is the active bounded release.",
 "BUILD497_WINTER_BOOKING_QUOTE_RULE_ACTIVATION_READINESS.md",
 "winter_booking_quote_rule_activation_readiness_check.py"
],"Build 497 handoff")
require(readme,[
 "Current source direction: **Build 497 — Winter Booking & Quote Rule Activation Readiness**.",
 "BUILD497_WINTER_BOOKING_QUOTE_RULE_ACTIVATION_READINESS.md",
 "winter_booking_quote_rule_activation_readiness_check.py",
 "Production is not considered GREEN from source promotion alone."
],"Build 497 README")
require(blockers,[
 "Seasonal service capability & transparency",
 "Broad winter-availability claims remain held",
 "Build 497 adds read-only winter booking/quote rule activation-readiness evidence"
],"canonical HOLD backlog")
for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
      "python scripts/winter_booking_quote_rule_activation_readiness_check.py",
      "node scripts/winter_booking_quote_rule_activation_readiness_test.mjs"
    ],label)
require(workflow,[
 "Winter Booking & Quote Rule Activation Readiness Authority",
 "python scripts/winter_booking_quote_rule_activation_readiness_check.py",
 "node scripts/winter_booking_quote_rule_activation_readiness_test.mjs",
 "Automatic activation: NONE",
 "Broad winter availability: HOLD"
],"Build 497 workflow")
migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])497(?:[^0-9]|$)",p.name)]
if migrations: errors.append("Build 497 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))
if errors:
    print("BUILD 497 WINTER BOOKING & QUOTE RULE ACTIVATION READINESS AUTHORITY: FAIL")
    for e in errors: print(" -",e)
    sys.exit(1)
for command in [
 [sys.executable,"scripts/seasonal_capability_owner_review_public_claim_decision_check.py"],
 ["node","scripts/seasonal_capability_owner_review_public_claim_decision_test.mjs"],
 [sys.executable,"scripts/winter_booking_eligibility_customer_transparency_check.py"],
 ["node","scripts/winter_booking_eligibility_customer_transparency_test.mjs"],
 ["node","scripts/winter_booking_quote_rule_activation_readiness_test.mjs"]
]:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 497 WINTER BOOKING & QUOTE RULE ACTIVATION READINESS AUTHORITY: FAIL")
        print(proc.stderr.strip() or proc.stdout.strip()); sys.exit(proc.returncode)
print("BUILD 497 WINTER BOOKING & QUOTE RULE ACTIVATION READINESS AUTHORITY: PASS")
