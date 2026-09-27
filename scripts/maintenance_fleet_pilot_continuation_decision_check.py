#!/usr/bin/env python3
"""Build 511 Maintenance & Fleet Pilot Continuation Decision authority."""
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

helper=read("functions/api/_lib/maintenance-fleet-pilot-continuation-decision.js")
endpoint=read("functions/api/admin/maintenance_fleet_pilot_continuation_decision.js")
contract=read("BUILD511_MAINTENANCE_FLEET_PILOT_CONTINUATION_DECISION.md")
roadmap=read("FORWARD_BUILD_ROADMAP_506_515.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
workflow=read(".github/workflows/maintenance-fleet-pilot-continuation-decision-authority.yml")

require(helper,[
 "continuation_decision_build: 511",
 'continuation_decision_authority: "maintenance_fleet_pilot_continuation_decision"',
 '"owner_action_authorization_required"',
 '"owner_action_execution_evidence_required"',
 '"pilot_bounds_review_required"',
 '"pilot_stop_condition_review_required"',
 '"continuation_evidence_incomplete"',
 '"owner_action_continuation_decision_required"',
 '"continuation_hold_recorded"',
 '"bounded_pilot_continuation_decision_recorded"',
 "pilot_continuation_execution_authorized: false",
 "capacity_reserved: false",
 "recurring_billing_enabled: false",
 "canonical_hold_mutated: false",
 "permanent_polling: false"
],"Build 511 helper")
require(endpoint,[
 "getContinuityReview",
 "buildMaintenanceFleetPilotContinuationDecision",
 "MAINTENANCE_FLEET_PILOT_CONTINUATION_DECISION_JSON",
 "maintenance_fleet_pilot_continuation_decision",
 '"X-Rosie-Maintenance-Fleet-Pilot-Continuation-Decision":"build-511-read-only"',
 "GET,HEAD,OPTIONS"
],"Build 511 endpoint")
for token in ["onRequestPost","onRequestPatch","onRequestDelete","setInterval("]:
    if token in endpoint:
        errors.append(f"Build 511 endpoint contains forbidden mutation/polling token {token!r}")
require(contract,[
 "# Build 511 — Maintenance & Fleet Pilot Continuation Decision",
 "participant and duration",
 "capacity",
 "invoicing",
 "travel",
 "stop-condition",
 "explicit owner continuation decision",
 "No state executes continuation",
 "Build 512 — Booking & Quote Experiment Follow-Up Decision"
],"Build 511 contract")
require(roadmap,[
 "### Build 511 — Maintenance & Fleet Pilot Continuation Decision",
 "### Build 512 — Booking & Quote Experiment Follow-Up Decision"
],"roadmap")
require(queue,[
 "**Build 514 — Service Economics, Seasonal Capacity & Reliability Decision Readiness** is the active bounded release.",
 "**Build 515 — Production Learning & Roadmap Renewal** is next",
 "BUILD511_MAINTENANCE_FLEET_PILOT_CONTINUATION_DECISION.md",
 "it has not run out"
],"Build 511 queue")
require(handoff,[
 "**Build 514 — Service Economics, Seasonal Capacity & Reliability Decision Readiness** is the active bounded release.",
 "BUILD511_MAINTENANCE_FLEET_PILOT_CONTINUATION_DECISION.md",
 "maintenance_fleet_pilot_continuation_decision_check.py"
],"Build 511 handoff")
require(readme,[
 "Current source direction: **Build 514 — Service Economics, Seasonal Capacity & Reliability Decision Readiness**.",
 "BUILD511_MAINTENANCE_FLEET_PILOT_CONTINUATION_DECISION.md",
 "maintenance_fleet_pilot_continuation_decision_check.py",
 "Production is not considered GREEN from source promotion alone."
],"Build 511 README")
require(blockers,["Maintenance / fleet business approval","Build 511"],"canonical HOLD backlog")
for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
      "python -m py_compile scripts/maintenance_fleet_pilot_continuation_decision_check.py",
      "node --check scripts/maintenance_fleet_pilot_continuation_decision_test.mjs",
      "node --check functions/api/_lib/maintenance-fleet-pilot-continuation-decision.js",
      "node --check functions/api/admin/maintenance_fleet_pilot_continuation_decision.js",
      "python scripts/maintenance_fleet_pilot_continuation_decision_check.py",
      "node scripts/maintenance_fleet_pilot_continuation_decision_test.mjs"
    ],label)
require(workflow,[
 "Build 511 — Maintenance & Fleet Pilot Continuation Decision Authority",
 "maintenance-fleet-pilot-continuation-decision",
 "python scripts/maintenance_fleet_pilot_continuation_decision_check.py",
 "node scripts/maintenance_fleet_pilot_continuation_decision_test.mjs"
],"Build 511 workflow")

for command in [
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
 ["node","scripts/maintenance_fleet_pilot_continuation_decision_test.mjs"]
]:
    p=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if p.returncode:
        errors.append(f"retained authority failed: {' '.join(command)}: {p.stderr.strip() or p.stdout.strip()}")

for p in [
 "functions/api/_lib/maintenance-fleet-pilot-continuation-decision.js",
 "functions/api/admin/maintenance_fleet_pilot_continuation_decision.js",
 "scripts/maintenance_fleet_pilot_continuation_decision_test.mjs"
]:
    r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
    if r.returncode:
        errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])511(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 511 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("BUILD 511 MAINTENANCE & FLEET PILOT CONTINUATION DECISION AUTHORITY: FAIL")
    for e in errors:
        print(" -",e)
    sys.exit(1)
print("BUILD 511 MAINTENANCE & FLEET PILOT CONTINUATION DECISION AUTHORITY: PASS")
print(" - continuation review stays bound to retained Build 501 current attributable evidence")
print(" - participant/duration/capacity/invoicing/travel/stop-condition evidence stays explicit")
print(" - triggered stop conditions require review and block accepted continue decisions")
print(" - explicit continue/hold records never execute pilot continuation")
print(" - no activation, recurring billing, invoice creation, capacity reservation, HOLD mutation or polling is authorized")
