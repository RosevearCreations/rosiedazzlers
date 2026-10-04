#!/usr/bin/env python3
"""Build 532 Booking & Quote Follow-Up Evidence Freshness Review authority."""
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

helper=read("functions/api/_lib/booking-quote-follow-up-evidence-freshness-review.js")
endpoint=read("functions/api/admin/booking_quote_experiment_follow_up_decision.js")
doc=read("BUILD532_BOOKING_QUOTE_FOLLOW_UP_EVIDENCE_FRESHNESS_REVIEW.md")
roadmap=read("FORWARD_BUILD_ROADMAP_526_535.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
docindex=read("DOC_INDEX.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/booking-quote-follow-up-evidence-freshness-review-authority.yml")

require(helper,[
    "booking_quote_follow_up_freshness_build: 532",
    'booking_quote_follow_up_freshness_authority: "booking_quote_follow_up_evidence_freshness_review"',
    '"owner_outcome_freshness_review_required"',
    '"follow_up_authorization_freshness_review_required"',
    '"follow_up_observation_freshness_review_required"',
    '"follow_up_stop_condition_review_required"',
    '"bounded_follow_up_observation_outcome_current"',
    "retained_measurement_lock_must_match: true",
    "southern_ontario_weather_eligibility_must_remain_explicit: true",
    "winner_selected: false",
    "price_or_discount_changed: false",
    "booking_rule_changed: false",
    "availability_rule_changed: false",
    "outreach_sent: false",
    "canonical_hold_mutated: false",
    "permanent_polling: false"
],"Build 532 helper")

require(endpoint,[
    "buildBookingQuoteFollowUpEvidenceFreshnessReview",
    "booking_quote_follow_up_freshness_build:532",
    'booking_quote_follow_up_freshness_authority:"booking_quote_follow_up_evidence_freshness_review"',
    "booking_quote_follow_up_evidence_freshness_review:freshness",
    '"X-Rosie-Booking-Quote-Follow-Up-Freshness":"build-532-read-only"',
    "GET,HEAD,OPTIONS"
],"Build 532 endpoint")
for forbidden in ["onRequestPost","onRequestPatch","onRequestDelete","onRequestPut","setInterval("]:
    if forbidden in endpoint:
        errors.append(f"Build 532 endpoint contains forbidden mutation/polling token {forbidden!r}")

require(doc,[
    "# Build 532 — Booking & Quote Follow-Up Evidence Freshness Review",
    "follow_up_observation_freshness_review_required",
    "follow_up_stop_condition_review_required",
    "Build 533 — Staff & Mobile Closure Evidence Freshness Review"
],"Build 532 contract")
require(roadmap,[
    "### Build 532 — Booking & Quote Follow-Up Evidence Freshness Review",
    "### Build 533 — Staff & Mobile Closure Evidence Freshness Review",
    "No winner, price/discount change, booking rule, outreach or availability mutation is inferred."
],"renewed roadmap")
require(queue,[
    "**Build 532 — Booking & Quote Follow-Up Evidence Freshness Review** is the active bounded release.",
    "**Build 533 — Staff & Mobile Closure Evidence Freshness Review** is next",
    "BUILD532_BOOKING_QUOTE_FOLLOW_UP_EVIDENCE_FRESHNESS_REVIEW.md",
    "non-force fast-forward",
    "it has not run out"
],"release queue")
require(handoff,[
    "**Build 532 — Booking & Quote Follow-Up Evidence Freshness Review** is the active bounded release.",
    "**Build 533 — Staff & Mobile Closure Evidence Freshness Review** is next",
    "BUILD532_BOOKING_QUOTE_FOLLOW_UP_EVIDENCE_FRESHNESS_REVIEW.md",
    "booking_quote_follow_up_evidence_freshness_review_check.py",
    "BUILD522_BOOKING_QUOTE_EXPERIMENT_FOLLOW_UP_OUTCOME_CONTINUITY.md"
],"project handoff")
require(readme,[
    "Current source direction: **Build 532 — Booking & Quote Follow-Up Evidence Freshness Review**.",
    "BUILD532_BOOKING_QUOTE_FOLLOW_UP_EVIDENCE_FRESHNESS_REVIEW.md",
    "scripts/booking_quote_follow_up_evidence_freshness_review_check.py",
    "Production is not considered GREEN from source promotion alone."
],"README")
require(blockers,[
    "Build 532 adds read-only booking/quote follow-up evidence freshness review",
    "Southern Ontario",
    "No winner or success is inferred"
],"canonical HOLD backlog")
require(docindex,[
    "BUILD532_BOOKING_QUOTE_FOLLOW_UP_EVIDENCE_FRESHNESS_REVIEW.md",
    "current bounded release contract"
],"documentation index")

for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
        "python -m py_compile scripts/booking_quote_follow_up_evidence_freshness_review_check.py",
        "node --check scripts/booking_quote_follow_up_evidence_freshness_review_test.mjs",
        "node --check functions/api/_lib/booking-quote-follow-up-evidence-freshness-review.js",
        "python scripts/booking_quote_follow_up_evidence_freshness_review_check.py",
        "node scripts/booking_quote_follow_up_evidence_freshness_review_test.mjs"
    ],label)

require(prodcheck,[
    '"booking_quote_follow_up_evidence_freshness_review"',
    "scripts/booking_quote_follow_up_evidence_freshness_review_check.py",
    "scripts/booking_quote_follow_up_evidence_freshness_review_test.mjs"
],"central Production acceptance")
require(workflow,[
    "Booking & Quote Follow-Up Evidence Freshness Review Authority",
    "booking-quote-follow-up-evidence-freshness-review",
    "python scripts/booking_quote_follow_up_evidence_freshness_review_check.py",
    "node scripts/booking_quote_follow_up_evidence_freshness_review_test.mjs",
    "Automatic canonical HOLD narrowing: NONE"
],"Build 532 workflow")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])532(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 532 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

for path in [
    "functions/api/_lib/booking-quote-follow-up-evidence-freshness-review.js",
    "functions/api/admin/booking_quote_experiment_follow_up_decision.js",
    "scripts/booking_quote_follow_up_evidence_freshness_review_test.mjs"
]:
    proc=subprocess.run(["node","--check",path],cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        errors.append(f"{path} syntax failed: {proc.stderr.strip() or proc.stdout.strip()}")

if errors:
    print("BUILD 532 BOOKING & QUOTE FOLLOW-UP EVIDENCE FRESHNESS REVIEW AUTHORITY: FAIL")
    for error in errors:
        print(" -",error)
    sys.exit(1)

for command in [
    ["node","scripts/booking_quote_follow_up_evidence_freshness_review_test.mjs"],
    ["node","scripts/booking_quote_experiment_follow_up_outcome_continuity_test.mjs"],
    ["node","scripts/booking_quote_experiment_follow_up_decision_test.mjs"],
    ["node","scripts/booking_quote_experiment_outcome_interpretation_test.mjs"],
    ["node","scripts/booking_quote_controlled_experiment_execution_evidence_test.mjs"],
    ["node","scripts/booking_quote_experiment_approval_measurement_lock_test.mjs"]
]:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 532 BOOKING & QUOTE FOLLOW-UP EVIDENCE FRESHNESS REVIEW AUTHORITY: FAIL")
        print(proc.stderr.strip() or proc.stdout.strip())
        sys.exit(proc.returncode)

print("BUILD 532 BOOKING & QUOTE FOLLOW-UP EVIDENCE FRESHNESS REVIEW AUTHORITY: PASS")
print(" - retained measurement lock, metric, allocation and duration remain matched")
print(" - Southern Ontario weather eligibility/exclusion remains explicit")
print(" - continue observation requires current authorization plus later current attributable observation")
print(" - current stop conditions remain review blockers")
print(" - no winner, success, pricing, booking-rule, outreach, availability or canonical-HOLD mutation is authorized")
