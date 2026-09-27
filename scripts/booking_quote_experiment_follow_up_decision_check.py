#!/usr/bin/env python3
"""Build 512 Booking & Quote Experiment Follow-Up Decision authority."""
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

helper=read("functions/api/_lib/booking-quote-experiment-follow-up-decision.js")
endpoint=read("functions/api/admin/booking_quote_experiment_follow_up_decision.js")
contract=read("BUILD512_BOOKING_QUOTE_EXPERIMENT_FOLLOW_UP_DECISION.md")
roadmap=read("FORWARD_BUILD_ROADMAP_506_515.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
workflow=read(".github/workflows/booking-quote-experiment-follow-up-decision-authority.yml")

require(helper,[
 "buildBookingQuoteExperimentFollowUpDecision",
 "follow_up_decision_build: 512",
 'follow_up_decision_authority: "booking_quote_experiment_follow_up_decision"',
 '"outcome_interpretation_source_unavailable"',
 '"stop_condition_review_required"',
 '"comparable_outcomes_required"',
 '"owner_follow_up_decision_required"',
 '"follow_up_hold_recorded"',
 '"continued_observation_decision_recorded"',
 '"no_change_closure_decision_recorded"',
 '"separate_change_review_decision_recorded"',
 "business_change_authorized: false",
 "winner_selection_authorized: false",
 "weather_ineligible_session_is_conversion_failure: false",
 "price_or_discount_changed: false",
 "booking_rule_changed: false",
 "availability_rule_changed: false",
 "canonical_hold_mutated: false",
 "permanent_polling: false"
],"Build 512 helper")
require(endpoint,[
 "getLearning",
 "buildBookingQuoteExperimentFollowUpDecision",
 "BOOKING_QUOTE_EXPERIMENT_FOLLOW_UP_DECISION_JSON",
 "booking_quote_experiment_follow_up_decision",
 '"X-Rosie-Booking-Quote-Experiment-Follow-Up-Decision":"build-512-read-only"',
 "GET,HEAD,OPTIONS"
],"Build 512 endpoint")
for token in ["onRequestPost","onRequestPut","onRequestPatch","onRequestDelete","setInterval("]:
    if token in endpoint:
        errors.append(f"Build 512 endpoint contains forbidden mutation/polling token {token!r}")
require(contract,[
 "# Build 512 — Booking & Quote Experiment Follow-Up Decision",
 "comparable primary-metric observations",
 "weather-ineligible sessions remain excluded",
 "Explicit owner follow-up",
 "No state selects a winner",
 "Build 513 — Staff & Mobile Remediation Closure Readiness"
],"Build 512 contract")
require(roadmap,[
 "### Build 512 — Booking & Quote Experiment Follow-Up Decision",
 "### Build 513 — Staff & Mobile Remediation Closure Readiness"
],"roadmap")
require(queue,[
 "**Build 516 — Seasonal Capability & Public Claim Decision Outcome Continuity** is the active bounded release.",
 "**Build 517 — Winter Booking & Quote Rule Controlled-Activation Outcome Continuity** is next",
 "BUILD512_BOOKING_QUOTE_EXPERIMENT_FOLLOW_UP_DECISION.md",
 "it has not run out"
],"Build 512 queue")
require(handoff,[
 "**Build 516 — Seasonal Capability & Public Claim Decision Outcome Continuity** is the active bounded release.",
 "BUILD512_BOOKING_QUOTE_EXPERIMENT_FOLLOW_UP_DECISION.md",
 "booking_quote_experiment_follow_up_decision_check.py"
],"Build 512 handoff")
require(readme,[
 "Current source direction: **Build 516 — Seasonal Capability & Public Claim Decision Outcome Continuity**.",
 "BUILD512_BOOKING_QUOTE_EXPERIMENT_FOLLOW_UP_DECISION.md",
 "booking_quote_experiment_follow_up_decision_check.py",
 "Production is not considered GREEN from source promotion alone."
],"Build 512 README")
require(blockers,["Build 512 adds a read-only booking/quote experiment follow-up decision layer","Southern Ontario"],"canonical HOLD backlog")
for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
      "python -m py_compile scripts/booking_quote_experiment_follow_up_decision_check.py",
      "node --check scripts/booking_quote_experiment_follow_up_decision_test.mjs",
      "node --check functions/api/_lib/booking-quote-experiment-follow-up-decision.js",
      "node --check functions/api/admin/booking_quote_experiment_follow_up_decision.js",
      "python scripts/booking_quote_experiment_follow_up_decision_check.py",
      "node scripts/booking_quote_experiment_follow_up_decision_test.mjs"
    ],label)
require(workflow,[
 "Build 512 — Booking & Quote Experiment Follow-Up Decision Authority",
 "booking-quote-experiment-follow-up-decision",
 "python scripts/booking_quote_experiment_follow_up_decision_check.py",
 "node scripts/booking_quote_experiment_follow_up_decision_test.mjs"
],"Build 512 workflow")

for command in [
 [sys.executable,"scripts/booking_quote_experiment_outcome_interpretation_check.py"],
 ["node","scripts/booking_quote_experiment_outcome_interpretation_test.mjs"],
 [sys.executable,"scripts/booking_quote_controlled_experiment_execution_evidence_check.py"],
 ["node","scripts/booking_quote_controlled_experiment_execution_evidence_test.mjs"],
 [sys.executable,"scripts/booking_quote_experiment_approval_measurement_lock_check.py"],
 ["node","scripts/booking_quote_experiment_approval_measurement_lock_test.mjs"],
 [sys.executable,"scripts/booking_quote_controlled_experiment_framework_check.py"],
 ["node","scripts/booking_quote_controlled_experiment_framework_test.mjs"],
 [sys.executable,"scripts/booking_quote_experiment_readiness_check.py"],
 ["node","scripts/booking_quote_experiment_readiness_test.mjs"],
 ["node","scripts/booking_quote_experiment_follow_up_decision_test.mjs"]
]:
    p=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if p.returncode:
        errors.append(f"retained authority failed: {' '.join(command)}: {p.stderr.strip() or p.stdout.strip()}")

for p in [
 "functions/api/_lib/booking-quote-experiment-follow-up-decision.js",
 "functions/api/admin/booking_quote_experiment_follow_up_decision.js",
 "scripts/booking_quote_experiment_follow_up_decision_test.mjs"
]:
    r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
    if r.returncode:
        errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])512(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 512 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("BUILD 512 BOOKING & QUOTE EXPERIMENT FOLLOW-UP DECISION AUTHORITY: FAIL")
    for e in errors: print(" -",e)
    sys.exit(1)
print("BUILD 512 BOOKING & QUOTE EXPERIMENT FOLLOW-UP DECISION AUTHORITY: PASS")
print(" - follow-up remains bound to retained Build 502/492/481 attributable evidence")
print(" - Southern Ontario weather-ineligible sessions stay outside the conversion denominator")
print(" - triggered stop conditions and incomparable outcomes block accepted follow-up readiness")
print(" - explicit owner follow-up never selects a winner or executes a business change")
print(" - no pricing/discount, booking-rule, availability, outreach, booking, provider, HOLD, schema/storage mutation or polling is authorized")
