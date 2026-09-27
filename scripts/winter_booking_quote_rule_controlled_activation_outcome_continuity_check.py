#!/usr/bin/env python3
"""Build 517 source authority for Winter Booking & Quote Rule Controlled-Activation Outcome Continuity."""
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

helper=read("functions/api/_lib/winter-booking-quote-rule-controlled-activation-outcome-continuity.js")
endpoint=read("functions/api/admin/service_economics_commercial_capacity_review.js")
client=read("assets/build473-service-economics-allocation-margin-review-readiness.js")
page=read("admin-service-economics-commercial-capacity-review.html")
copy=read("admin-service-economics-commercial-capacity-review/index.html")
availability=read("functions/api/availability.js")
checkout=read("functions/api/checkout.js")
doc=read("BUILD517_WINTER_BOOKING_QUOTE_RULE_CONTROLLED_ACTIVATION_OUTCOME_CONTINUITY.md")
roadmap=read("FORWARD_BUILD_ROADMAP_516_525.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/winter-booking-quote-rule-controlled-activation-outcome-continuity-authority.yml")

if page!=copy:
    errors.append("Build 517 protected route copies diverged")
if len(re.findall(r"<h1\b",page,re.I))!=1:
    errors.append("Build 517 page must retain exactly one H1")

require(helper,[
    "winter_booking_quote_controlled_activation_outcome_build: 517",
    'winter_booking_quote_controlled_activation_outcome_authority: "winter_booking_quote_rule_controlled_activation_outcome_continuity"',
    '"activated","retain_hold"',
    '"controlled_activation_observed"',"retain_hold_observed",
    '"controlled_activation_evidence_conflict"',"retain_hold_evidence_conflict","outcome_owner_action_required",
    "controlled_activation_state_observed_not_inferred: true",
    'availability_authority: "/api/availability"',
    'checkout_collision_revalidation_authority: "checkout_server_side_collision_revalidation"',
    "weather_ineligible_excluded_from_ordinary_conversion_interpretation: true",
    "automatic_rule_activation_authorized: false",
    "broad_winter_availability_authorized: false"
],"Build 517 helper")

require(endpoint,[
    "buildWinterBookingQuoteRuleControlledActivationOutcomeContinuity",
    'authority:"winter_booking_quote_rule_controlled_activation_outcome_continuity"',
    'retained_public_claim_outcome_authority:"seasonal_capability_public_claim_decision_outcome_continuity"',
    'retained_controlled_activation_decision_authority:"winter_booking_quote_rule_controlled_activation_decision"',
    'retained_availability_authority:"/api/availability"',
    'retained_checkout_collision_authority:"checkout_server_side_collision_revalidation"'
],"Build 517 endpoint")

require(client,[
    "renderWinterRuleControlledActivationOutcomeContinuity",
    "winterRuleControlledActivationOutcomeContinuityGrid",
    "Activation observed",
    "Activation state is observed, never inferred",
    "/api/availability and checkout collision revalidation remain authoritative"
],"Build 517 client")

require(page,[
    'data-build517="winter-booking-quote-rule-controlled-activation-outcome-continuity"',
    "Build 517 · Winter Booking &amp; Quote Rule Controlled-Activation Outcome Continuity",
    'id="winterRuleControlledActivationOutcomeContinuityGrid"',
    "Activation state is observed, never inferred.",
    "Weather-ineligible sessions stay outside ordinary conversion interpretation.",
    "Broad winter availability remains HOLD."
],"Build 517 page")

require(availability,[
    "Existing AM/PM booleans remain authoritative; checkout revalidates collisions before booking."
],"availability authority")
require(checkout,[
    "Selected slot not available",
    "bookingConflict",
    'return corsJson({ error: "Selected slot not available" }, 409)'
],"checkout collision authority")

require(doc,[
    "# Build 517 — Winter Booking & Quote Rule Controlled-Activation Outcome Continuity",
    "controlled_activation_observed","retain_hold_observed",
    "Build 507 decision readiness never means live activation",
    "/api/availability",
    "Weather-ineligible sessions stay outside ordinary conversion interpretation",
    "Build 518 — Controlled-Environment Routing Outcome Evidence Continuity"
],"Build 517 contract")

require(roadmap,[
    "### Build 517 — Winter Booking & Quote Rule Controlled-Activation Outcome Continuity",
    "### Build 518 — Controlled-Environment Routing Outcome Evidence Continuity",
    "No rule action is inferred from decision readiness"
],"active roadmap")

require(queue,[
    "**Build 517 — Winter Booking & Quote Rule Controlled-Activation Outcome Continuity** is the active bounded release.",
    "**Build 518 — Controlled-Environment Routing Outcome Evidence Continuity** is next",
    "BUILD517_WINTER_BOOKING_QUOTE_RULE_CONTROLLED_ACTIVATION_OUTCOME_CONTINUITY.md",
    "it has not run out"
],"Build 517 queue")

require(handoff,[
    "**Build 517 — Winter Booking & Quote Rule Controlled-Activation Outcome Continuity** is the active bounded release.",
    "BUILD517_WINTER_BOOKING_QUOTE_RULE_CONTROLLED_ACTIVATION_OUTCOME_CONTINUITY.md",
    "winter_booking_quote_rule_controlled_activation_outcome_continuity_check.py"
],"Build 517 handoff")

require(readme,[
    "Current source direction: **Build 517 — Winter Booking & Quote Rule Controlled-Activation Outcome Continuity**.",
    "BUILD517_WINTER_BOOKING_QUOTE_RULE_CONTROLLED_ACTIVATION_OUTCOME_CONTINUITY.md",
    "scripts/winter_booking_quote_rule_controlled_activation_outcome_continuity_check.py",
    "Production is not considered GREEN from source promotion alone."
],"Build 517 README")

require(blockers,[
    "Seasonal service capability & transparency",
    "Build 517 adds read-only winter booking/quote controlled-activation outcome continuity",
    "activation is observed rather than inferred"
],"canonical HOLD backlog")

for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
        "python -m py_compile scripts/winter_booking_quote_rule_controlled_activation_outcome_continuity_check.py",
        "node --check scripts/winter_booking_quote_rule_controlled_activation_outcome_continuity_test.mjs",
        "node --check functions/api/_lib/winter-booking-quote-rule-controlled-activation-outcome-continuity.js",
        "python scripts/winter_booking_quote_rule_controlled_activation_outcome_continuity_check.py",
        "node scripts/winter_booking_quote_rule_controlled_activation_outcome_continuity_test.mjs"
    ],label)

require(prodcheck,[
    '"winter_booking_quote_rule_controlled_activation_outcome_continuity"',
    "scripts/winter_booking_quote_rule_controlled_activation_outcome_continuity_check.py",
    "scripts/winter_booking_quote_rule_controlled_activation_outcome_continuity_test.mjs"
],"central Production acceptance")

require(workflow,[
    "Winter Booking & Quote Rule Controlled-Activation Outcome Continuity Authority",
    "python scripts/winter_booking_quote_rule_controlled_activation_outcome_continuity_check.py",
    "node scripts/winter_booking_quote_rule_controlled_activation_outcome_continuity_test.mjs",
    "Activation state: OBSERVED, NEVER INFERRED",
    "/api/availability + checkout collision revalidation: REQUIRED",
    "Weather-ineligible conversion interpretation: EXCLUDED",
    "Broad winter availability: HOLD",
    "Automatic booking/quote/rule/HOLD mutation: NONE"
],"Build 517 workflow")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])517(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 517 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("BUILD 517 WINTER BOOKING & QUOTE RULE CONTROLLED-ACTIVATION OUTCOME CONTINUITY AUTHORITY: FAIL")
    for e in errors:
        print(" -",e)
    sys.exit(1)

for command in [
    ["node","scripts/winter_booking_quote_rule_controlled_activation_decision_test.mjs"],
    ["node","scripts/seasonal_capability_public_claim_decision_outcome_continuity_test.mjs"],
    ["node","scripts/winter_booking_quote_rule_controlled_activation_outcome_continuity_test.mjs"]
]:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 517 WINTER BOOKING & QUOTE RULE CONTROLLED-ACTIVATION OUTCOME CONTINUITY AUTHORITY: FAIL")
        print(proc.stderr.strip() or proc.stdout.strip())
        sys.exit(proc.returncode)

print("BUILD 517 WINTER BOOKING & QUOTE RULE CONTROLLED-ACTIVATION OUTCOME CONTINUITY AUTHORITY: PASS")
print(" - live activation is counted only from explicit dated attributable manual outcome evidence")
print(" - retained HOLD remains explicit and traceable to current service-specific Build 507 evidence")
print(" - /api/availability and checkout collision behavior require dated attributable revalidation")
print(" - weather-ineligible sessions remain outside ordinary conversion interpretation")
print(" - broad winter availability and source-owned temperature limits remain truthful")
print(" - schema/provider/business/booking/quote/rule/HOLD mutation remains NONE")
