#!/usr/bin/env python3
"""Build 502 Booking & Quote Experiment Outcome Interpretation authority."""
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

helper=read("functions/api/_lib/booking-quote-experiment-outcome-interpretation.js")
execution=read("functions/api/_lib/booking-quote-controlled-experiment-execution-evidence.js")
learning=read("functions/api/_lib/booking-funnel-quote-pricing-learning.js")
endpoint=read("functions/api/admin/booking_funnel_quote_pricing_learning.js")
client=read("assets/build451-booking-funnel-quote-pricing-learning.js")
page=read("admin-booking-quote-retention-learning.html")
copy=read("admin-booking-quote-retention-learning/index.html")
contract=read("BUILD502_BOOKING_QUOTE_EXPERIMENT_OUTCOME_INTERPRETATION.md")
roadmap=read("FORWARD_BUILD_ROADMAP_496_505.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
workflow=read(".github/workflows/booking-quote-experiment-outcome-interpretation-authority.yml")

require(helper,[
 "buildBookingQuoteExperimentOutcomeInterpretation",
 "build: 502",
 'authority: "booking_quote_experiment_outcome_interpretation"',
 '"execution_evidence_not_ready"',
 '"stop_condition_review_required"',
 '"outcome_measurement_incomplete"',
 '"allocation_comparison_incomplete"',
 '"descriptive_outcome_interpretation_ready"',
 'threshold_evaluation: "owner_review_required"',
 "success: null",
 "winner: null",
 "automatic_winner_selection_allowed: false",
 "weather_ineligible_excluded_from_conversion_denominator: true",
 "permanent_polling_allowed: false"
],"Build 502 helper")
require(execution,[
 "metric_value: finiteNumber(outcome.metric_value)",
 "metric_unit: clean(outcome.metric_unit) || null",
 "winner_inferred: false",
 "success_inferred: false"
],"retained Build 492 evidence")
require(learning,[
 "buildBookingQuoteExperimentOutcomeInterpretation",
 "controlled_experiment_outcome_interpretation",
 "controlled_experiment_outcome_interpretation_build:502",
 'controlled_experiment_outcome_interpretation_authority:"booking_quote_experiment_outcome_interpretation"'
],"retained learning composition")
require(endpoint,[
 "Build 502 outcome interpretation remains read-only",
 "execution_authorization:{}",
 "execution_evidence:[]",
 "execution_source_available:false"
],"retained GET endpoint")
require(client,[
 "outcomeInterpretation502",
 "Build 502 outcome interpretation",
 "Threshold evaluation: OWNER REVIEW REQUIRED",
 "Winner selected: NO"
],"retained workbench client")
require(page,[
 'data-build502="booking-quote-experiment-outcome-interpretation"',
 'id="experimentOutcomeInterpretation502"',
 "Build 502 experiment outcome interpretation",
 "No automatic winner, success claim, price/discount change, booking-rule change or availability mutation"
],"Build 502 workbench")
if page!=copy: errors.append("booking/quote learning route copies must remain byte-identical")
if len(re.findall(r"<h1\b",page,re.I))!=1: errors.append("Build 502 workbench must retain exactly one H1")
require(contract,[
 "# Build 502 — Booking & Quote Experiment Outcome Interpretation",
 "Descriptive interpretation only",
 "Weather-ineligible sessions",
 "success: null",
 "winner: null",
 "Build 503 — Staff & Mobile Remediation Outcome Interpretation & Follow-Up"
],"Build 502 contract")
require(roadmap,[
 "### Build 502 — Booking & Quote Experiment Outcome Interpretation",
 "### Build 503 — Staff & Mobile Remediation Outcome Interpretation & Follow-Up"
],"roadmap")
require(queue,[
 "**Build 508 — Controlled-Environment Operational Readiness & Routing Continuity** is the active bounded release.",
 "**Build 509 — Provider & Local Search Closure Evidence Continuity Review** is next",
 "BUILD502_BOOKING_QUOTE_EXPERIMENT_OUTCOME_INTERPRETATION.md",
 "it has not run out"
],"Build 502 queue")
require(handoff,[
 "**Build 508 — Controlled-Environment Operational Readiness & Routing Continuity** is the active bounded release.",
 "BUILD502_BOOKING_QUOTE_EXPERIMENT_OUTCOME_INTERPRETATION.md",
 "booking_quote_experiment_outcome_interpretation_check.py"
],"Build 502 handoff")
require(readme,[
 "Current source direction: **Build 508 — Controlled-Environment Operational Readiness & Routing Continuity**.",
 "BUILD502_BOOKING_QUOTE_EXPERIMENT_OUTCOME_INTERPRETATION.md",
 "booking_quote_experiment_outcome_interpretation_check.py",
 "Production is not considered GREEN from source promotion alone."
],"Build 502 README")
for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
      "python scripts/booking_quote_experiment_outcome_interpretation_check.py",
      "node scripts/booking_quote_experiment_outcome_interpretation_test.mjs"
    ],label)
require(workflow,[
 "Build 502 — Booking & Quote Experiment Outcome Interpretation Authority",
 "booking-quote-experiment-outcome-interpretation",
 "python scripts/booking_quote_experiment_outcome_interpretation_check.py",
 "node scripts/booking_quote_experiment_outcome_interpretation_test.mjs"
],"Build 502 workflow")

for retained in [
 ["python","scripts/booking_quote_controlled_experiment_execution_evidence_check.py"],
 ["node","scripts/booking_quote_controlled_experiment_execution_evidence_test.mjs"],
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
 "functions/api/_lib/booking-quote-experiment-outcome-interpretation.js",
 "functions/api/_lib/booking-quote-controlled-experiment-execution-evidence.js",
 "functions/api/_lib/booking-funnel-quote-pricing-learning.js",
 "functions/api/admin/booking_funnel_quote_pricing_learning.js",
 "assets/build451-booking-funnel-quote-pricing-learning.js",
 "scripts/booking_quote_experiment_outcome_interpretation_test.mjs"
]:
    r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
    if r.returncode:
        errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")

r=subprocess.run(["node","scripts/booking_quote_experiment_outcome_interpretation_test.mjs"],cwd=ROOT,text=True,capture_output=True)
if r.returncode:
    errors.append(f"Build 502 behavioral proof failed: {r.stderr.strip() or r.stdout.strip()}")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])502(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 502 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("BUILD 502 BOOKING & QUOTE EXPERIMENT OUTCOME INTERPRETATION AUTHORITY: FAIL")
    for e in errors: print(" -",e)
    sys.exit(1)

print("BUILD 502 BOOKING & QUOTE EXPERIMENT OUTCOME INTERPRETATION AUTHORITY: PASS")
print(" - interpretation requires separately authorized attributable Build 492 execution evidence")
print(" - locked primary metric, allocation, duration, weather eligibility and stop conditions remain explicit")
print(" - weather-ineligible sessions remain outside the conversion denominator")
print(" - arm summaries are descriptive only; threshold evaluation and winner selection remain owner review")
print(" - no pricing/discount, booking-rule, availability, provider, schema/storage mutation or polling is authorized")
