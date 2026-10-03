#!/usr/bin/env python3
"""Build 531 Maintenance & Fleet Continuation Evidence Freshness Review authority."""
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

helper=read("functions/api/_lib/maintenance-fleet-continuation-evidence-freshness-review.js")
endpoint=read("functions/api/admin/maintenance_fleet_pilot_continuation_decision.js")
ui=read("assets/build439-maintenance-fleet-owner-approval.js")
page=read("admin-maintenance-fleet-owner-approval.html")
copy=read("admin-maintenance-fleet-owner-approval/index.html")
doc=read("BUILD531_MAINTENANCE_FLEET_CONTINUATION_EVIDENCE_FRESHNESS_REVIEW.md")
roadmap=read("FORWARD_BUILD_ROADMAP_526_535.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
docindex=read("DOC_INDEX.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/maintenance-fleet-continuation-evidence-freshness-review-authority.yml")

if page != copy:
    errors.append("Build 531 owner-decision route copies diverged")
if len(re.findall(r"<h1\b",page,re.I)) != 1:
    errors.append("Build 531 page must retain exactly one H1")

require(helper,[
    "maintenance_fleet_continuation_freshness_build: 531",
    'maintenance_fleet_continuation_freshness_authority: "maintenance_fleet_continuation_evidence_freshness_review"',
    '"pilot_execution_evidence_source_unavailable"',
    '"pilot_execution_evidence_freshness_review_required"',
    '"owner_outcome_freshness_review_required"',
    '"continuation_observation_freshness_review_required"',
    '"continuation_hold_outcome_current"',
    '"bounded_pilot_continuation_outcome_current"',
    "capacity_revalidation_must_remain_current: true",
    "invoicing_evidence_must_remain_current: true",
    "travel_evidence_must_remain_current: true",
    "stop_condition_evidence_must_remain_current: true",
    "prior_continue_outcome_reserves_future_capacity: false",
    "recurring_billing_enabled: false",
    "capacity_reserved: false",
    "canonical_hold_mutated: false",
    "permanent_polling: false"
],"Build 531 helper")

require(endpoint,[
    "buildMaintenanceFleetContinuationEvidenceFreshnessReview",
    "maintenance_fleet_continuation_freshness_build:531",
    'maintenance_fleet_continuation_freshness_authority:"maintenance_fleet_continuation_evidence_freshness_review"',
    "maintenance_fleet_continuation_evidence_freshness_review:freshness",
    "pilot_outcome_evidence:pilotOutcomeEvidence",
    '"X-Rosie-Maintenance-Fleet-Continuation-Freshness":"build-531-read-only"',
    "GET,HEAD,OPTIONS"
],"Build 531 endpoint")
for forbidden in ["onRequestPost","onRequestPatch","onRequestDelete","onRequestPut","setInterval("]:
    if forbidden in endpoint:
        errors.append(f"Build 531 endpoint contains forbidden mutation/polling token {forbidden!r}")

require(ui,[
    "renderPilotContinuationFreshness",
    "maintenance_fleet_continuation_evidence_freshness_review",
    "Build 531 continuation evidence freshness",
    "A prior continue outcome does not reserve future capacity"
],"Build 531 UI")
require(page,[
    'data-build531="maintenance-fleet-continuation-evidence-freshness-review"',
    "Build 531 · continuation evidence freshness review",
    'id="pilotContinuationFreshness"',
    "participant/duration bounds",
    "A prior continue outcome never reserves future capacity"
],"Build 531 page")

require(doc,[
    "# Build 531 — Maintenance & Fleet Continuation Evidence Freshness Review",
    "pilot_execution_evidence_freshness_review_required",
    "owner_outcome_freshness_review_required",
    "continuation_observation_freshness_review_required",
    "Build 532 — Booking & Quote Follow-Up Evidence Freshness Review"
],"Build 531 contract")
require(roadmap,[
    "### Build 531 — Maintenance & Fleet Continuation Evidence Freshness Review",
    "### Build 532 — Booking & Quote Follow-Up Evidence Freshness Review",
    "No enrollment, recurring billing, booking mutation or capacity reservation is inferred."
],"renewed roadmap")
require(queue,[
    "**Build 531 — Maintenance & Fleet Continuation Evidence Freshness Review** is the active bounded release.",
    "**Build 532 — Booking & Quote Follow-Up Evidence Freshness Review** is next",
    "BUILD531_MAINTENANCE_FLEET_CONTINUATION_EVIDENCE_FRESHNESS_REVIEW.md",
    "non-force fast-forward",
    "it has not run out"
],"release queue")
require(handoff,[
    "**Build 531 — Maintenance & Fleet Continuation Evidence Freshness Review** is the active bounded release.",
    "**Build 532 — Booking & Quote Follow-Up Evidence Freshness Review** is next",
    "BUILD531_MAINTENANCE_FLEET_CONTINUATION_EVIDENCE_FRESHNESS_REVIEW.md",
    "maintenance_fleet_continuation_evidence_freshness_review_check.py",
    "BUILD521_MAINTENANCE_FLEET_CONTINUATION_OUTCOME_CONTINUITY.md"
],"project handoff")
require(readme,[
    "Current source direction: **Build 531 — Maintenance & Fleet Continuation Evidence Freshness Review**.",
    "BUILD531_MAINTENANCE_FLEET_CONTINUATION_EVIDENCE_FRESHNESS_REVIEW.md",
    "scripts/maintenance_fleet_continuation_evidence_freshness_review_check.py",
    "Production is not considered GREEN from source promotion alone."
],"README")
require(blockers,[
    "Maintenance / fleet business approval",
    "Build 531 revalidates that retained outcome",
    "prior continue outcome never reserves future capacity"
],"canonical HOLD backlog")
require(docindex,[
    "BUILD531_MAINTENANCE_FLEET_CONTINUATION_EVIDENCE_FRESHNESS_REVIEW.md",
    "current bounded release contract"
],"documentation index")

for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
        "python -m py_compile scripts/maintenance_fleet_continuation_evidence_freshness_review_check.py",
        "node --check scripts/maintenance_fleet_continuation_evidence_freshness_review_test.mjs",
        "node --check functions/api/_lib/maintenance-fleet-continuation-evidence-freshness-review.js",
        "python scripts/maintenance_fleet_continuation_evidence_freshness_review_check.py",
        "node scripts/maintenance_fleet_continuation_evidence_freshness_review_test.mjs"
    ],label)

require(prodcheck,[
    '"maintenance_fleet_continuation_evidence_freshness_review"',
    "scripts/maintenance_fleet_continuation_evidence_freshness_review_check.py",
    "scripts/maintenance_fleet_continuation_evidence_freshness_review_test.mjs"
],"central Production acceptance")
require(workflow,[
    "Maintenance & Fleet Continuation Evidence Freshness Review Authority",
    "maintenance-fleet-continuation-evidence-freshness-review",
    "python scripts/maintenance_fleet_continuation_evidence_freshness_review_check.py",
    "node scripts/maintenance_fleet_continuation_evidence_freshness_review_test.mjs",
    "Capacity reservation: NONE",
    "Automatic canonical HOLD narrowing: NONE"
],"Build 531 workflow")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])531(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 531 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

for path in [
    "functions/api/_lib/maintenance-fleet-continuation-evidence-freshness-review.js",
    "functions/api/admin/maintenance_fleet_pilot_continuation_decision.js",
    "assets/build439-maintenance-fleet-owner-approval.js",
    "scripts/maintenance_fleet_continuation_evidence_freshness_review_test.mjs"
]:
    proc=subprocess.run(["node","--check",path],cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        errors.append(f"{path} syntax failed: {proc.stderr.strip() or proc.stdout.strip()}")

if errors:
    print("BUILD 531 MAINTENANCE & FLEET CONTINUATION EVIDENCE FRESHNESS REVIEW AUTHORITY: FAIL")
    for error in errors:
        print(" -",error)
    sys.exit(1)

for command in [
    ["node","scripts/maintenance_fleet_continuation_evidence_freshness_review_test.mjs"],
    ["node","scripts/maintenance_fleet_continuation_outcome_continuity_test.mjs"],
    ["node","scripts/maintenance_fleet_pilot_continuation_decision_test.mjs"],
    ["node","scripts/maintenance_fleet_pilot_outcome_continuity_review_test.mjs"],
    ["node","scripts/maintenance_fleet_pilot_outcome_evidence_test.mjs"]
]:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 531 MAINTENANCE & FLEET CONTINUATION EVIDENCE FRESHNESS REVIEW AUTHORITY: FAIL")
        print(proc.stderr.strip() or proc.stdout.strip())
        sys.exit(proc.returncode)

print("BUILD 531 MAINTENANCE & FLEET CONTINUATION EVIDENCE FRESHNESS REVIEW AUTHORITY: PASS")
print(" - explicit owner continue-or-hold outcome remains trace-bound and freshness-bounded")
print(" - participant/duration, capacity, invoicing, travel and stop-condition evidence must remain current")
print(" - continue outcomes require current authorization plus a later current attributable observation")
print(" - prior continuation never reserves future capacity or creates recurring billing")
print(" - no enrollment, booking/invoice mutation, capacity reservation or canonical HOLD mutation is authorized")
