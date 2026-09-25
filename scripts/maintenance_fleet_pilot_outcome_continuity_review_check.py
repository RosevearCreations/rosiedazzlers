#!/usr/bin/env python3
"""Build 501 Maintenance & Fleet Pilot Outcome Continuity Review authority."""
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

helper=read("functions/api/_lib/maintenance-fleet-pilot-outcome-continuity-review.js")
endpoint=read("functions/api/admin/maintenance_fleet_pilot_outcome_continuity_review.js")
client=read("assets/build439-maintenance-fleet-owner-approval.js")
page=read("admin-maintenance-fleet-owner-approval.html")
copy=read("admin-maintenance-fleet-owner-approval/index.html")
contract=read("BUILD501_MAINTENANCE_FLEET_PILOT_OUTCOME_CONTINUITY_REVIEW.md")
roadmap=read("FORWARD_BUILD_ROADMAP_496_505.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
workflow=read(".github/workflows/maintenance-fleet-pilot-outcome-continuity-review-authority.yml")

require(helper,[
 "continuity_review_build: 501",
 'continuity_authority: "maintenance_fleet_pilot_outcome_continuity_review"',
 '"owner_action_authorization_required"',
 '"owner_action_execution_evidence_required"',
 '"pilot_bounds_review_required"',
 '"pilot_stop_condition_review_required"',
 '"bounded_pilot_continuity_review_ready"',
 "historical_outcome_carry_forward_used: false",
 "continue_pilot_authorized: false",
 "capacity_reserved: false",
 "recurring_billing_enabled: false",
 "canonical_hold_mutated: false",
 "permanent_polling: false"
],"Build 501 helper")
require(endpoint,[
 "getPilotOutcomeEvidence",
 "buildMaintenanceFleetPilotOutcomeContinuityReview",
 "pilot_outcome_continuity_review",
 '"X-Rosie-Maintenance-Fleet-Pilot-Continuity":"build-501-read-only"',
 "GET,HEAD,OPTIONS"
],"Build 501 endpoint")
for token in ["onRequestPost","onRequestPatch","onRequestDelete","setInterval("]:
    if token in endpoint:
        errors.append(f"Build 501 endpoint contains forbidden mutation/polling token {token!r}")
require(client,[
 "/api/admin/maintenance_fleet_pilot_outcome_continuity_review",
 "renderPilotOutcomeContinuity",
 "Pilot outcome continuity review",
 "Triggered stop conditions require explicit review"
],"maintenance/fleet owner-decision client")
require(page,[
 'data-build501="maintenance-fleet-pilot-outcome-continuity-review"',
 'id="pilotOutcomeContinuity"',
 "Maintenance &amp; Fleet Pilot Outcome Continuity Review",
 "No pilot continuation, recurring billing or capacity reservation is authorized by this review."
],"Build 501 workbench")
if page!=copy:
    errors.append("Build 501 workbench route copy drift")
if len(re.findall(r"<h1\b",page,re.I))!=1:
    errors.append("Build 501 workbench must retain exactly one H1")
require(contract,[
 "# Build 501 — Maintenance & Fleet Pilot Outcome Continuity Review",
 "participant and duration",
 "capacity",
 "invoicing",
 "travel",
 "stop-condition",
 "Missing execution remains owner action",
 "Build 502 — Booking & Quote Experiment Outcome Interpretation"
],"Build 501 contract")
require(roadmap,[
 "### Build 501 — Maintenance & Fleet Pilot Outcome Continuity Review",
 "### Build 502 — Booking & Quote Experiment Outcome Interpretation"
],"roadmap")
require(queue,[
 "**Build 503 — Staff & Mobile Remediation Outcome Interpretation & Follow-Up** is the active bounded release.",
 "**Build 504 — Service Economics, Seasonal Capacity & Reliability Trend Continuity** is next",
 "BUILD501_MAINTENANCE_FLEET_PILOT_OUTCOME_CONTINUITY_REVIEW.md",
 "it has not run out"
],"Build 501 queue")
require(handoff,[
 "**Build 503 — Staff & Mobile Remediation Outcome Interpretation & Follow-Up** is the active bounded release.",
 "BUILD501_MAINTENANCE_FLEET_PILOT_OUTCOME_CONTINUITY_REVIEW.md",
 "maintenance_fleet_pilot_outcome_continuity_review_check.py"
],"Build 501 handoff")
require(readme,[
 "Current source direction: **Build 503 — Staff & Mobile Remediation Outcome Interpretation & Follow-Up**.",
 "BUILD501_MAINTENANCE_FLEET_PILOT_OUTCOME_CONTINUITY_REVIEW.md",
 "maintenance_fleet_pilot_outcome_continuity_review_check.py",
 "Production is not considered GREEN from source promotion alone."
],"Build 501 README")
require(blockers,["Maintenance / fleet business approval","Build 501"],"canonical HOLD backlog")
for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
      "python scripts/maintenance_fleet_pilot_outcome_continuity_review_check.py",
      "node scripts/maintenance_fleet_pilot_outcome_continuity_review_test.mjs"
    ],label)
require(workflow,[
 "Build 501 — Maintenance & Fleet Pilot Outcome Continuity Review Authority",
 "maintenance-fleet-pilot-outcome-continuity-review",
 "python scripts/maintenance_fleet_pilot_outcome_continuity_review_check.py",
 "node scripts/maintenance_fleet_pilot_outcome_continuity_review_test.mjs"
],"Build 501 workflow")

for command in [
 [sys.executable,"scripts/maintenance_fleet_pilot_outcome_evidence_check.py"],
 ["node","scripts/maintenance_fleet_pilot_outcome_evidence_test.mjs"],
 [sys.executable,"scripts/maintenance_fleet_owner_approval_pilot_decision_check.py"],
 ["node","scripts/maintenance_fleet_owner_approval_pilot_decision_test.mjs"],
 [sys.executable,"scripts/maintenance_fleet_controlled_pilot_activation_readiness_check.py"],
 ["node","scripts/maintenance_fleet_controlled_pilot_activation_readiness_test.mjs"],
 [sys.executable,"scripts/retention_maintenance_fleet_operational_pilot_check.py"],
 ["node","scripts/retention_maintenance_fleet_operational_pilot_test.mjs"],
 ["node","scripts/maintenance_fleet_pilot_outcome_continuity_review_test.mjs"]
]:
    p=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if p.returncode:
        errors.append(f"retained authority failed: {' '.join(command)}: {p.stderr.strip() or p.stdout.strip()}")

for p in [
 "functions/api/_lib/maintenance-fleet-pilot-outcome-continuity-review.js",
 "functions/api/admin/maintenance_fleet_pilot_outcome_continuity_review.js",
 "assets/build439-maintenance-fleet-owner-approval.js",
 "scripts/maintenance_fleet_pilot_outcome_continuity_review_test.mjs"
]:
    r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
    if r.returncode:
        errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])501(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 501 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("BUILD 501 MAINTENANCE & FLEET PILOT OUTCOME CONTINUITY REVIEW AUTHORITY: FAIL")
    for e in errors:
        print(" -",e)
    sys.exit(1)
print("BUILD 501 MAINTENANCE & FLEET PILOT OUTCOME CONTINUITY REVIEW AUTHORITY: PASS")
print(" - current execution evidence remains bounded by explicit owner approval and participant/duration limits")
print(" - capacity, invoicing, travel and stop-condition continuity require attributable observations")
print(" - triggered stop conditions require explicit review and never authorize continuation")
print(" - missing execution remains owner action; historical or source/runtime GREEN evidence is not promoted into pilot success")
print(" - no activation, recurring billing, invoice creation, capacity reservation, provider/business mutation or polling is authorized")
