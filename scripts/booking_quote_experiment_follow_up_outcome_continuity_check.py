#!/usr/bin/env python3
"""Build 522 Booking & Quote Experiment Follow-Up Outcome Continuity authority."""
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

helper=read("functions/api/_lib/booking-quote-experiment-follow-up-outcome-continuity.js")
endpoint=read("functions/api/admin/booking_quote_experiment_follow_up_decision.js")
contract=read("BUILD522_BOOKING_QUOTE_EXPERIMENT_FOLLOW_UP_OUTCOME_CONTINUITY.md")
roadmap=read("FORWARD_BUILD_ROADMAP_516_525.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
docindex=read("DOC_INDEX.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/booking-quote-experiment-follow-up-outcome-continuity-authority.yml")

require(helper,[
 "buildBookingQuoteExperimentFollowUpOutcomeContinuity",
 "follow_up_outcome_build: 522",
 'follow_up_outcome_authority: "booking_quote_experiment_follow_up_outcome_continuity"',
 '"owner_follow_up_outcome_required"',
 '"follow_up_outcome_evidence_conflict"',
 '"follow_up_activity_authorization_required"',
 '"follow_up_activity_stop_condition_review_required"',
 '"follow_up_activity_evidence_incomplete"',
 '"bounded_follow_up_observation_outcome_observed"',
 "expected_decision_trace_key",
 "measurement_lock_revision",
 "primary_metric",
 "weather_ineligible_excluded",
 "comparable_allocation_observations",
 "price_or_discount_changed: false",
 "booking_rule_changed: false",
 "availability_rule_changed: false",
 "canonical_hold_mutated: false",
 "permanent_polling: false"
],"Build 522 helper")
require(endpoint,[
 "buildBookingQuoteExperimentFollowUpOutcomeContinuity",
 "BOOKING_QUOTE_EXPERIMENT_FOLLOW_UP_OUTCOME_JSON",
 "booking_quote_experiment_follow_up_outcome_continuity",
 '"X-Rosie-Booking-Quote-Experiment-Follow-Up-Outcome":"build-522-read-only"',
 "GET,HEAD,OPTIONS"
],"Build 522 endpoint")
for token in ["onRequestPost","onRequestPut","onRequestPatch","onRequestDelete","setInterval("]:
    if token in endpoint:
        errors.append(f"Build 522 endpoint contains forbidden mutation/polling token {token!r}")
require(contract,[
 "# Build 522 — Booking & Quote Experiment Follow-Up Outcome Continuity",
 "locked measurement revision and primary metric",
 "Southern Ontario",
 "separate authorization",
 "No state selects a winner",
 "Build 523 — Staff & Mobile Remediation Closure Outcome Continuity"
],"Build 522 contract")
require(roadmap,[
 "### Build 522 — Booking & Quote Experiment Follow-Up Outcome Continuity",
 "### Build 523 — Staff & Mobile Remediation Closure Outcome Continuity"
],"Build 522 roadmap")
require(queue,[
 "**Build 522 — Booking & Quote Experiment Follow-Up Outcome Continuity** is the active bounded release.",
 "**Build 523 — Staff & Mobile Remediation Closure Outcome Continuity** is next",
 "BUILD522_BOOKING_QUOTE_EXPERIMENT_FOLLOW_UP_OUTCOME_CONTINUITY.md",
 "non-force fast-forward",
 "it has not run out"
],"Build 522 queue")
require(handoff,[
 "**Build 522 — Booking & Quote Experiment Follow-Up Outcome Continuity** is the active bounded release.",
 "BUILD522_BOOKING_QUOTE_EXPERIMENT_FOLLOW_UP_OUTCOME_CONTINUITY.md",
 "booking_quote_experiment_follow_up_outcome_continuity_check.py",
 "BUILD512_BOOKING_QUOTE_EXPERIMENT_FOLLOW_UP_DECISION.md",
 "BUILD502_BOOKING_QUOTE_EXPERIMENT_OUTCOME_INTERPRETATION.md"
],"Build 522 handoff")
require(readme,[
 "Current source direction: **Build 522 — Booking & Quote Experiment Follow-Up Outcome Continuity**.",
 "BUILD522_BOOKING_QUOTE_EXPERIMENT_FOLLOW_UP_OUTCOME_CONTINUITY.md",
 "scripts/booking_quote_experiment_follow_up_outcome_continuity_check.py",
 "Production is not considered GREEN from source promotion alone."
],"Build 522 README")
require(blockers,["Build 522 adds read-only booking/quote experiment follow-up outcome continuity","Southern Ontario"],"canonical HOLD backlog")
require(docindex,["BUILD522_BOOKING_QUOTE_EXPERIMENT_FOLLOW_UP_OUTCOME_CONTINUITY.md","current bounded release contract"],"documentation index")
for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
      "python -m py_compile scripts/booking_quote_experiment_follow_up_outcome_continuity_check.py",
      "node --check scripts/booking_quote_experiment_follow_up_outcome_continuity_test.mjs",
      "node --check functions/api/_lib/booking-quote-experiment-follow-up-outcome-continuity.js",
      "python scripts/booking_quote_experiment_follow_up_outcome_continuity_check.py",
      "node scripts/booking_quote_experiment_follow_up_outcome_continuity_test.mjs"
    ],label)
require(prodcheck,[
 '"booking_quote_experiment_follow_up_outcome_continuity"',
 "scripts/booking_quote_experiment_follow_up_outcome_continuity_check.py",
 "scripts/booking_quote_experiment_follow_up_outcome_continuity_test.mjs"
],"Production business checker registry")
require(workflow,[
 "Build 522 — Booking & Quote Experiment Follow-Up Outcome Continuity Authority",
 "booking-quote-experiment-follow-up-outcome-continuity",
 "python scripts/booking_quote_experiment_follow_up_outcome_continuity_check.py",
 "node scripts/booking_quote_experiment_follow_up_outcome_continuity_test.mjs"
],"Build 522 workflow")

for command in [
 [sys.executable,"scripts/booking_quote_experiment_follow_up_decision_check.py"],
 ["node","scripts/booking_quote_experiment_follow_up_decision_test.mjs"],
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
 [sys.executable,"scripts/maintenance_fleet_continuation_outcome_continuity_check.py"],
 ["node","scripts/maintenance_fleet_continuation_outcome_continuity_test.mjs"],
 ["node","scripts/booking_quote_experiment_follow_up_outcome_continuity_test.mjs"]
]:
    p=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if p.returncode:
        errors.append(f"retained authority failed: {' '.join(command)}: {p.stderr.strip() or p.stdout.strip()}")

for p in [
 "functions/api/_lib/booking-quote-experiment-follow-up-outcome-continuity.js",
 "functions/api/admin/booking_quote_experiment_follow_up_decision.js",
 "scripts/booking_quote_experiment_follow_up_outcome_continuity_test.mjs"
]:
    r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
    if r.returncode:
        errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])522(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 522 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("BUILD 522 BOOKING & QUOTE EXPERIMENT FOLLOW-UP OUTCOME CONTINUITY AUTHORITY: FAIL")
    for e in errors: print(" -",e)
    sys.exit(1)
print("BUILD 522 BOOKING & QUOTE EXPERIMENT FOLLOW-UP OUTCOME CONTINUITY AUTHORITY: PASS")
print(" - exact Build 512 owner follow-up decision plus current Build 502/492/481 evidence remain authoritative")
print(" - continued observation requires a separate authorization and later attributable bounded observation")
print(" - allocation/duration, locked metric/revision, Southern Ontario weather eligibility and stop conditions remain explicit")
print(" - incomplete, incomparable or stop-blocked evidence never selects a winner or declares success")
print(" - no price/discount, booking-rule, availability, outreach, booking, provider or canonical-HOLD mutation is authorized")
