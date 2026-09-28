#!/usr/bin/env python3
"""Build 521 Maintenance & Fleet Continuation Outcome Continuity authority."""
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

helper=read("functions/api/_lib/maintenance-fleet-continuation-outcome-continuity.js")
endpoint=read("functions/api/admin/maintenance_fleet_pilot_continuation_decision.js")
ui=read("assets/build439-maintenance-fleet-owner-approval.js")
html=read("admin-maintenance-fleet-owner-approval.html")
html_copy=read("admin-maintenance-fleet-owner-approval/index.html")
contract=read("BUILD521_MAINTENANCE_FLEET_CONTINUATION_OUTCOME_CONTINUITY.md")
roadmap=read("FORWARD_BUILD_ROADMAP_516_525.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
docindex=read("DOC_INDEX.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/maintenance-fleet-continuation-outcome-continuity-authority.yml")

require(helper,[
 "continuation_outcome_build: 521",
 'continuation_outcome_authority: "maintenance_fleet_continuation_outcome_continuity"',
 '"owner_continuation_decision_required"',
 '"owner_continuation_outcome_required"',
 '"continuation_outcome_evidence_conflict"',
 '"continuation_observation_required"',
 '"continuation_hold_outcome_observed"',
 '"bounded_pilot_continuation_outcome_observed"',
 '"pilot_stop_condition_review_required"',
 "expected_decision_trace_key",
 "continuation_authorized_at",
 "continuation_observed_at",
 "maintenance_enrollment_performed: false",
 "booking_created_or_changed: false",
 "capacity_reserved: false",
 "recurring_billing_enabled: false",
 "canonical_hold_mutated: false",
 "permanent_polling: false"
],"Build 521 helper")
require(endpoint,[
 "buildMaintenanceFleetContinuationOutcomeContinuity",
 "MAINTENANCE_FLEET_CONTINUATION_OUTCOME_JSON",
 "maintenance_fleet_continuation_outcome_continuity",
 '"X-Rosie-Maintenance-Fleet-Continuation-Outcome":"build-521-read-only"',
 "GET,HEAD,OPTIONS"
],"Build 521 endpoint")
for token in ["onRequestPost","onRequestPatch","onRequestDelete","setInterval("]:
    if token in endpoint:
        errors.append(f"Build 521 endpoint contains forbidden mutation/polling token {token!r}")
require(ui,[
 "maintenance_fleet_pilot_continuation_decision",
 "maintenance_fleet_continuation_outcome_continuity",
 "renderPilotContinuationDecision",
 "renderPilotContinuationOutcome",
 "Automatic activation: none"
],"Build 521 UI")
require(html,[
 'data-build521="maintenance-fleet-continuation-outcome-continuity"',
 'id="pilotContinuationDecision"',
 'id="pilotContinuationOutcome"',
 "Build 521"
],"Build 521 HTML")
if html != html_copy:
    errors.append("Build 521 route-copy HTML differs from canonical admin-maintenance-fleet-owner-approval.html")
require(contract,[
 "# Build 521 — Maintenance & Fleet Continuation Outcome Continuity",
 "participant and duration",
 "capacity",
 "invoicing",
 "travel",
 "stop-condition",
 "explicit continuation authorization timestamp",
 "No state executes continuation",
 "Build 522 — Booking & Quote Experiment Follow-Up Outcome Continuity"
],"Build 521 contract")
require(roadmap,[
 "### Build 521 — Maintenance & Fleet Continuation Outcome Continuity",
 "### Build 522 — Booking & Quote Experiment Follow-Up Outcome Continuity"
],"Build 521 roadmap")
require(queue,[
 "**Build 521 — Maintenance & Fleet Continuation Outcome Continuity** is the active bounded release.",
 "**Build 522 — Booking & Quote Experiment Follow-Up Outcome Continuity** is next",
 "BUILD521_MAINTENANCE_FLEET_CONTINUATION_OUTCOME_CONTINUITY.md",
 "non-force fast-forward",
 "it has not run out"
],"Build 521 queue")
require(handoff,[
 "**Build 521 — Maintenance & Fleet Continuation Outcome Continuity** is the active bounded release.",
 "BUILD521_MAINTENANCE_FLEET_CONTINUATION_OUTCOME_CONTINUITY.md",
 "maintenance_fleet_continuation_outcome_continuity_check.py",
 "BUILD511_MAINTENANCE_FLEET_PILOT_CONTINUATION_DECISION.md",
 "BUILD501_MAINTENANCE_FLEET_PILOT_OUTCOME_CONTINUITY_REVIEW.md"
],"Build 521 handoff")
require(readme,[
 "Current source direction: **Build 521 — Maintenance & Fleet Continuation Outcome Continuity**.",
 "BUILD521_MAINTENANCE_FLEET_CONTINUATION_OUTCOME_CONTINUITY.md",
 "scripts/maintenance_fleet_continuation_outcome_continuity_check.py",
 "Production is not considered GREEN from source promotion alone."
],"Build 521 README")
require(blockers,[
 "Maintenance / fleet business approval",
 "Build 521 adds read-only maintenance/fleet continuation outcome continuity",
 "No canonical HOLD is narrowed automatically"
],"canonical HOLD backlog")
require(docindex,[
 "BUILD521_MAINTENANCE_FLEET_CONTINUATION_OUTCOME_CONTINUITY.md",
 "current bounded release contract"
],"documentation index")
for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
      "python -m py_compile scripts/maintenance_fleet_continuation_outcome_continuity_check.py",
      "node --check scripts/maintenance_fleet_continuation_outcome_continuity_test.mjs",
      "node --check functions/api/_lib/maintenance-fleet-continuation-outcome-continuity.js",
      "python scripts/maintenance_fleet_continuation_outcome_continuity_check.py",
      "node scripts/maintenance_fleet_continuation_outcome_continuity_test.mjs"
    ],label)
require(prodcheck,[
 '"maintenance_fleet_continuation_outcome_continuity"',
 "scripts/maintenance_fleet_continuation_outcome_continuity_check.py",
 "scripts/maintenance_fleet_continuation_outcome_continuity_test.mjs"
],"Production business checker registry")
require(workflow,[
 "Build 521 — Maintenance & Fleet Continuation Outcome Continuity Authority",
 "maintenance-fleet-continuation-outcome-continuity",
 "python scripts/maintenance_fleet_continuation_outcome_continuity_check.py",
 "node scripts/maintenance_fleet_continuation_outcome_continuity_test.mjs"
],"Build 521 workflow")

for command in [
 [sys.executable,"scripts/maintenance_fleet_pilot_continuation_decision_check.py"],
 ["node","scripts/maintenance_fleet_pilot_continuation_decision_test.mjs"],
 [sys.executable,"scripts/maintenance_fleet_pilot_outcome_continuity_review_check.py"],
 ["node","scripts/maintenance_fleet_pilot_outcome_continuity_review_test.mjs"],
 [sys.executable,"scripts/maintenance_fleet_pilot_outcome_evidence_check.py"],
 ["node","scripts/maintenance_fleet_pilot_outcome_evidence_test.mjs"],
 [sys.executable,"scripts/maintenance_fleet_owner_approval_pilot_decision_check.py"],
 ["node","scripts/maintenance_fleet_owner_approval_pilot_decision_test.mjs"],
 [sys.executable,"scripts/maintenance_fleet_controlled_pilot_activation_readiness_check.py"],
 ["node","scripts/maintenance_fleet_controlled_pilot_activation_readiness_test.mjs"],
 [sys.executable,"scripts/retention_maintenance_fleet_operational_pilot_check.py"],
 ["node","scripts/retention_maintenance_fleet_operational_pilot_test.mjs"],
 ["node","scripts/maintenance_fleet_continuation_outcome_continuity_test.mjs"]
]:
    p=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if p.returncode:
        errors.append(f"retained authority failed: {' '.join(command)}: {p.stderr.strip() or p.stdout.strip()}")

for p in [
 "functions/api/_lib/maintenance-fleet-continuation-outcome-continuity.js",
 "functions/api/admin/maintenance_fleet_pilot_continuation_decision.js",
 "assets/build439-maintenance-fleet-owner-approval.js",
 "scripts/maintenance_fleet_continuation_outcome_continuity_test.mjs"
]:
    r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
    if r.returncode:
        errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])521(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 521 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("BUILD 521 MAINTENANCE & FLEET CONTINUATION OUTCOME CONTINUITY AUTHORITY: FAIL")
    for e in errors: print(" -",e)
    sys.exit(1)
print("BUILD 521 MAINTENANCE & FLEET CONTINUATION OUTCOME CONTINUITY AUTHORITY: PASS")
print(" - exact Build 511 owner decision and current Build 501/491 evidence remain authoritative")
print(" - participant/duration/capacity/invoicing/travel/stop-condition evidence stays explicit")
print(" - continue outcomes require trace match plus explicit authorization and later observation")
print(" - triggered stop conditions require review before continuation outcome acceptance")
print(" - no enrollment, recurring billing, booking mutation, capacity reservation or canonical HOLD mutation is authorized")
