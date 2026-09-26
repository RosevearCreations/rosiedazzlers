#!/usr/bin/env python3
"""Build 492 Booking & Quote Controlled Experiment Execution Evidence authority."""
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

helper=read("functions/api/_lib/booking-quote-controlled-experiment-execution-evidence.js")
learning=read("functions/api/_lib/booking-funnel-quote-pricing-learning.js")
endpoint=read("functions/api/admin/booking_funnel_quote_pricing_learning.js")
client=read("assets/build451-booking-funnel-quote-pricing-learning.js")
page=read("admin-booking-quote-retention-learning.html")
copy=read("admin-booking-quote-retention-learning/index.html")
contract=read("BUILD492_BOOKING_QUOTE_CONTROLLED_EXPERIMENT_EXECUTION_EVIDENCE.md")
roadmap=read("FORWARD_BUILD_ROADMAP_486_495.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
workflow=read(".github/workflows/booking-quote-controlled-experiment-execution-evidence-authority.yml")

require(helper,[
 "buildBookingQuoteControlledExperimentExecutionEvidence",
 "build: 492",
 'authority: "booking_quote_controlled_experiment_execution_evidence"',
 '"execution_authorization_required"',
 '"bounded_execution_evidence_review_ready"',
 '"stop_condition_triggered_review_required"',
 "weather_ineligible_session_is_conversion_failure: false",
 "winner_selected: false",
 "experiment_success_claimed: false",
 "automatic_winner_selection_allowed: false",
 "weather_ineligible_excluded_from_conversion_denominator: true",
 "permanent_polling_allowed: false"
],"Build 492 helper")
require(learning,[
 "buildBookingQuoteControlledExperimentExecutionEvidence",
 "controlled_experiment_execution_evidence",
 "controlled_experiment_execution_evidence_build:492",
 'controlled_experiment_execution_evidence_authority:"booking_quote_controlled_experiment_execution_evidence"'
],"retained learning composition")
require(endpoint,[
 "execution_authorization:{}",
 "execution_evidence:[]",
 "execution_source_available:false",
 "Build 492 execution evidence remains read-only"
],"retained GET endpoint")
require(client,[
 "executionEvidence492",
 "Build 492 execution evidence",
 "Measurement lock is not execution authorization",
 "Winner selected: NO"
],"retained workbench client")
require(page,[
 'data-build492="booking-quote-controlled-experiment-execution-evidence"',
 'id="experimentExecutionEvidence492"',
 "Build 492 execution evidence"
],"Build 492 workbench")
if page!=copy: errors.append("booking/quote learning route copies must remain byte-identical")
if len(re.findall(r"<h1\b",page,re.I))!=1: errors.append("Build 492 workbench must retain exactly one H1")
require(contract,[
 "# Build 492 — Booking & Quote Controlled Experiment Execution Evidence",
 "Lock is not execution",
 "Weather-ineligible sessions are excluded from the conversion denominator",
 "No state selects a winner or declares success",
 "Build 493 — Staff & Mobile Remediation Outcome Evidence"
],"Build 492 contract")
require(roadmap,[
 "### Build 492 — Booking & Quote Controlled Experiment Execution Evidence",
 "### Build 493 — Staff & Mobile Remediation Outcome Evidence"
],"roadmap")
require(queue,[
 "**Build 507 — Winter Booking & Quote Rule Controlled Activation Decision** is the active bounded release.",
 "**Build 508 — Controlled-Environment Operational Readiness & Routing Continuity** is next",
 "BUILD492_BOOKING_QUOTE_CONTROLLED_EXPERIMENT_EXECUTION_EVIDENCE.md",
 "STARTUP_GO_LIVE_BLOCKERS.md",
 "it has not run out"
],"Build 492 queue")
require(handoff,[
 "**Build 507 — Winter Booking & Quote Rule Controlled Activation Decision** is the active bounded release.",
 "BUILD492_BOOKING_QUOTE_CONTROLLED_EXPERIMENT_EXECUTION_EVIDENCE.md",
 "booking_quote_controlled_experiment_execution_evidence_check.py"
],"Build 492 handoff")
require(readme,[
 "Current source direction: **Build 507 — Winter Booking & Quote Rule Controlled Activation Decision**.",
 "BUILD492_BOOKING_QUOTE_CONTROLLED_EXPERIMENT_EXECUTION_EVIDENCE.md",
 "booking_quote_controlled_experiment_execution_evidence_check.py",
 "Production is not considered GREEN from source promotion alone."
],"Build 492 README")
for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
      "python scripts/booking_quote_controlled_experiment_execution_evidence_check.py",
      "node scripts/booking_quote_controlled_experiment_execution_evidence_test.mjs"
    ],label)
require(workflow,[
 "Build 492 — Booking & Quote Controlled Experiment Execution Evidence Authority",
 "booking-quote-controlled-experiment-execution-evidence",
 "python scripts/booking_quote_controlled_experiment_execution_evidence_check.py",
 "node scripts/booking_quote_controlled_experiment_execution_evidence_test.mjs"
],"Build 492 workflow")

for retained in [
 ["python","scripts/booking_quote_experiment_approval_measurement_lock_check.py"],
 ["node","scripts/booking_quote_experiment_approval_measurement_lock_test.mjs"],
 ["python","scripts/booking_quote_controlled_experiment_framework_check.py"],
 ["node","scripts/booking_quote_controlled_experiment_framework_test.mjs"],
 ["python","scripts/booking_quote_experiment_readiness_check.py"],
 ["node","scripts/booking_quote_experiment_readiness_test.mjs"]
]:
    p=subprocess.run(retained,cwd=ROOT,text=True,capture_output=True)
    if p.returncode:
        errors.append(f"retained authority failed: {' '.join(retained)}: {p.stderr.strip() or p.stdout.strip()}")

for p in [
 "functions/api/_lib/booking-quote-controlled-experiment-execution-evidence.js",
 "functions/api/_lib/booking-funnel-quote-pricing-learning.js",
 "functions/api/admin/booking_funnel_quote_pricing_learning.js",
 "assets/build451-booking-funnel-quote-pricing-learning.js",
 "scripts/booking_quote_controlled_experiment_execution_evidence_test.mjs"
]:
    r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
    if r.returncode:
        errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")

r=subprocess.run(["node","scripts/booking_quote_controlled_experiment_execution_evidence_test.mjs"],cwd=ROOT,text=True,capture_output=True)
if r.returncode:
    errors.append(f"Build 492 behavioral proof failed: {r.stderr.strip() or r.stdout.strip()}")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])492(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 492 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("BUILD 492 BOOKING & QUOTE CONTROLLED EXPERIMENT EXECUTION EVIDENCE AUTHORITY: FAIL")
    for e in errors: print(" -",e)
    sys.exit(1)

print("BUILD 492 BOOKING & QUOTE CONTROLLED EXPERIMENT EXECUTION EVIDENCE AUTHORITY: PASS")
print(" - Build 481 measurement lock is retained as governance, not execution authorization")
print(" - execution authorization, allocation/duration, weather eligibility, stop conditions and outcome capture remain explicit")
print(" - weather-ineligible sessions stay outside the conversion denominator")
print(" - no winner/success claim, pricing/booking/availability/outreach/provider/schema mutation or polling is authorized")
