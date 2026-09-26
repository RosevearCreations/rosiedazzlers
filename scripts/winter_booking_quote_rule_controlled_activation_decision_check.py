#!/usr/bin/env python3
"""Build 507 source authority for Winter Booking & Quote Rule Controlled Activation Decision."""
from pathlib import Path
import re, subprocess, sys

ROOT=Path(__file__).resolve().parents[1]
errors=[]

def read(path):
    p=ROOT/path
    if not p.is_file():
        errors.append(f"missing required file: {path}")
        return ""
    return p.read_text(encoding="utf-8",errors="ignore")

def require(text,needles,label):
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing {needle!r}")

helper=read("functions/api/_lib/winter-booking-quote-rule-controlled-activation-decision.js")
endpoint=read("functions/api/admin/service_economics_commercial_capacity_review.js")
client=read("assets/build473-service-economics-allocation-margin-review-readiness.js")
page=read("admin-service-economics-commercial-capacity-review.html")
copy=read("admin-service-economics-commercial-capacity-review/index.html")
availability=read("functions/api/availability.js")
checkout=read("functions/api/checkout.js")
doc=read("BUILD507_WINTER_BOOKING_QUOTE_RULE_CONTROLLED_ACTIVATION_DECISION.md")
roadmap=read("FORWARD_BUILD_ROADMAP_506_515.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/winter-booking-quote-rule-controlled-activation-decision-authority.yml")

if page!=copy:
    errors.append("Build 507 protected route copies diverged")
if len(re.findall(r"<h1\b",page,re.I))!=1:
    errors.append("Build 507 page must retain exactly one H1")

require(helper,[
    "winter_booking_quote_controlled_activation_build: 507",
    'winter_booking_quote_controlled_activation_authority: "winter_booking_quote_rule_controlled_activation_decision"',
    "approve_controlled_activation","hold_controlled_activation",
    "controlled_activation_decision_ready","controlled_activation_owner_review_required","owner_hold",
    "manual_rule_activation_required: true",
    "automatic_rule_activation_authorized: false",
    "automatic_booking_availability_change_authorized: false",
    "automatic_quote_rule_change_authorized: false",
    "broad_winter_availability_authorized: false",
    "weather_ineligible_session_is_conversion_failure: false",
    "controlled_activation_decision_ready_is_live_activation: false"
],"Build 507 helper")

require(endpoint,[
    "buildWinterBookingQuoteRuleControlledActivationDecision",
    'authority:"winter_booking_quote_rule_controlled_activation_decision"',
    'retained_activation_readiness_authority:"winter_booking_quote_rule_activation_readiness"',
    'retained_customer_transparency_authority:"winter_booking_eligibility_customer_transparency"',
    'retained_availability_authority:"/api/availability"'
],"Build 507 endpoint")

require(client,[
    "renderWinterRuleControlledActivationDecision",
    "winterRuleControlledActivationDecisionGrid",
    "Controlled activation decision ready",
    "Actual rule activation remains manual"
],"Build 507 client")

require(page,[
    'data-build507="winter-booking-quote-rule-controlled-activation-decision"',
    "Build 507 · Winter Booking &amp; Quote Rule Controlled Activation Decision",
    'id="winterRuleControlledActivationDecisionGrid"',
    "Actual rule activation remains a separate manual change.",
    "Broad winter availability remains HOLD."
],"Build 507 page")

require(availability,[
    "Existing AM/PM booleans remain authoritative; checkout revalidates collisions before booking."
],"availability authority")
require(checkout,[
    "Selected slot not available",
    "bookingConflict",
    'return corsJson({ error: "Selected slot not available" }, 409)'
],"checkout collision authority")

require(doc,[
    "# Build 507 — Winter Booking & Quote Rule Controlled Activation Decision",
    "controlled_activation_decision_ready",
    "Actual rule implementation or activation remains a separate manual change",
    "Build 508 — Controlled-Environment Operational Readiness & Routing Continuity"
],"Build 507 contract")

require(roadmap,[
    "### Build 507 — Winter Booking & Quote Rule Controlled Activation Decision",
    "### Build 508 — Controlled-Environment Operational Readiness & Routing Continuity"
],"active roadmap")

require(queue,[
    "**Build 508 — Controlled-Environment Operational Readiness & Routing Continuity** is the active bounded release.",
    "**Build 509 — Provider & Local Search Closure Evidence Continuity Review** is next",
    "BUILD507_WINTER_BOOKING_QUOTE_RULE_CONTROLLED_ACTIVATION_DECISION.md",
    "it has not run out"
],"Build 507 queue")

require(handoff,[
    "**Build 508 — Controlled-Environment Operational Readiness & Routing Continuity** is the active bounded release.",
    "BUILD507_WINTER_BOOKING_QUOTE_RULE_CONTROLLED_ACTIVATION_DECISION.md",
    "winter_booking_quote_rule_controlled_activation_decision_check.py"
],"Build 507 handoff")

require(readme,[
    "Current source direction: **Build 508 — Controlled-Environment Operational Readiness & Routing Continuity**.",
    "BUILD507_WINTER_BOOKING_QUOTE_RULE_CONTROLLED_ACTIVATION_DECISION.md",
    "winter_booking_quote_rule_controlled_activation_decision_check.py",
    "Production is not considered GREEN from source promotion alone."
],"Build 507 README")

require(blockers,[
    "Seasonal service capability & transparency",
    "Broad winter-availability claims remain held",
    "Build 507 adds a read-only winter booking/quote controlled-activation decision package"
],"canonical HOLD backlog")

for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
        "python -m py_compile scripts/winter_booking_quote_rule_controlled_activation_decision_check.py",
        "node --check scripts/winter_booking_quote_rule_controlled_activation_decision_test.mjs",
        "node --check functions/api/_lib/winter-booking-quote-rule-controlled-activation-decision.js",
        "python scripts/winter_booking_quote_rule_controlled_activation_decision_check.py",
        "node scripts/winter_booking_quote_rule_controlled_activation_decision_test.mjs"
    ],label)

require(prodcheck,[
    '"winter_booking_quote_rule_controlled_activation_decision"',
    "scripts/winter_booking_quote_rule_controlled_activation_decision_check.py",
    "scripts/winter_booking_quote_rule_controlled_activation_decision_test.mjs",
    "Validate winter booking & quote rule controlled activation decision authority"
],"central Production acceptance")

require(workflow,[
    "Winter Booking & Quote Rule Controlled Activation Decision Authority",
    "python scripts/winter_booking_quote_rule_controlled_activation_decision_check.py",
    "node scripts/winter_booking_quote_rule_controlled_activation_decision_test.mjs",
    "Rule activation: MANUAL",
    "Broad winter availability: HOLD",
    "Automatic booking/quote/customer-message mutation: NONE"
],"Build 507 workflow")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])507(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 507 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("BUILD 507 WINTER BOOKING & QUOTE RULE CONTROLLED ACTIVATION DECISION AUTHORITY: FAIL")
    for e in errors:
        print(" -",e)
    sys.exit(1)

for command in [
    [sys.executable,"scripts/winter_booking_quote_rule_activation_readiness_check.py"],
    ["node","scripts/winter_booking_quote_rule_activation_readiness_test.mjs"],
    [sys.executable,"scripts/seasonal_capability_public_claim_activation_decision_check.py"],
    ["node","scripts/seasonal_capability_public_claim_activation_decision_test.mjs"],
    ["node","scripts/winter_booking_quote_rule_controlled_activation_decision_test.mjs"]
]:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 507 WINTER BOOKING & QUOTE RULE CONTROLLED ACTIVATION DECISION AUTHORITY: FAIL")
        print(proc.stderr.strip() or proc.stdout.strip())
        sys.exit(proc.returncode)

print("BUILD 507 WINTER BOOKING & QUOTE RULE CONTROLLED ACTIVATION DECISION AUTHORITY: PASS")
print(" - only owner-approved service-specific rule pairs can become decision-ready")
print(" - customer-transparency wording confirmation remains explicit")
print(" - /api/availability and checkout collision revalidation remain authoritative")
print(" - weather-ineligible sessions remain outside ordinary conversion interpretation")
print(" - actual rule activation remains manual and broad winter availability remains HOLD")
print(" - schema/provider/business/booking/quote/customer-message mutation remains NONE")
