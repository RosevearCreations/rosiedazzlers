#!/usr/bin/env python3
"""Build 491 Maintenance & Fleet Pilot Outcome Evidence authority."""
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
        if needle not in text: errors.append(f"{label} missing {needle!r}")

helper=read("functions/api/_lib/maintenance-fleet-pilot-outcome-evidence.js")
endpoint=read("functions/api/admin/maintenance_fleet_pilot_outcome_evidence.js")
client=read("assets/build439-maintenance-fleet-owner-approval.js")
page=read("admin-maintenance-fleet-owner-approval.html")
copy=read("admin-maintenance-fleet-owner-approval/index.html")
contract=read("BUILD491_MAINTENANCE_FLEET_PILOT_OUTCOME_EVIDENCE.md")
roadmap=read("FORWARD_BUILD_ROADMAP_486_495.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
workflow=read(".github/workflows/maintenance-fleet-pilot-outcome-evidence-authority.yml")

require(helper,[
 'build: 491','authority: "maintenance_fleet_pilot_outcome_evidence"',
 '"owner_action_authorization_required"','"owner_action_execution_evidence_required"',
 '"bounded_pilot_outcome_review_ready"',
 'availability_authority: "/api/availability"','collision_revalidation_authority: "/api/checkout"',
 'participant_identity_exposed: false','participant_selection_inferred: false',
 'capacity_reservation_inferred: false','automatic_invoice_created: false',
 'execution_success_inferred_from_source_green: false','permanent_polling: false'
],"Build 491 helper")
require(endpoint,[
 "getOwnerApproval","buildMaintenanceFleetPilotOutcomeEvidence",
 "execution_evidence: []","execution_source_available: false",
 '"X-Rosie-Maintenance-Fleet-Pilot-Outcome":"build-491-read-only"',
 "GET,HEAD,OPTIONS"
],"Build 491 endpoint")
for token in ["onRequestPost","onRequestPatch","onRequestDelete","setInterval("]:
    if token in endpoint: errors.append(f"Build 491 endpoint contains forbidden mutation/polling token {token!r}")
require(client,[
 "/api/admin/maintenance_fleet_pilot_outcome_evidence",
 "renderPilotOutcome",
 "Pilot outcome evidence",
 "No participant, duration, capacity, invoicing, travel or stop-condition outcome is inferred"
],"retained owner-decision workbench client")
require(page,[
 'data-build491="maintenance-fleet-pilot-outcome-evidence"',
 'id="pilotOutcomeEvidence"',
 "Maintenance &amp; Fleet Pilot Outcome Evidence"
],"Build 491 workbench")
if page!=copy: errors.append("Build 491 workbench route copy drift")
if len(re.findall(r"<h1\b",page,re.I))!=1: errors.append("Build 491 workbench must retain exactly one H1")
require(contract,[
 "# Build 491 — Maintenance & Fleet Pilot Outcome Evidence",
 "participants","duration","capacity","invoicing","travel","stop-condition",
 "Missing execution evidence remains owner_action",
 "Build 492 — Booking & Quote Controlled Experiment Execution Evidence"
],"Build 491 contract")
require(roadmap,[
 "### Build 491 — Maintenance & Fleet Pilot Outcome Evidence",
 "### Build 492 — Booking & Quote Controlled Experiment Execution Evidence"
],"roadmap")
require(queue,[
 "**Build 505 — Production Learning & Roadmap Renewal** is the active bounded release.",
 "**Build 506 — Seasonal Capability & Public Claim Activation Decision** is next",
 "BUILD491_MAINTENANCE_FLEET_PILOT_OUTCOME_EVIDENCE.md","it has not run out"
],"Build 491 queue")
require(handoff,[
 "**Build 505 — Production Learning & Roadmap Renewal** is the active bounded release.",
 "BUILD491_MAINTENANCE_FLEET_PILOT_OUTCOME_EVIDENCE.md",
 "maintenance_fleet_pilot_outcome_evidence_check.py"
],"Build 491 handoff")
require(readme,[
 "Current source direction: **Build 505 — Production Learning & Roadmap Renewal**.",
 "BUILD491_MAINTENANCE_FLEET_PILOT_OUTCOME_EVIDENCE.md",
 "maintenance_fleet_pilot_outcome_evidence_check.py",
 "Production is not considered GREEN from source promotion alone."
],"Build 491 README")
for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
      "python scripts/maintenance_fleet_pilot_outcome_evidence_check.py",
      "node scripts/maintenance_fleet_pilot_outcome_evidence_test.mjs"
    ],label)
require(workflow,[
 "Build 491 — Maintenance & Fleet Pilot Outcome Evidence Authority",
 "maintenance-fleet-pilot-outcome-evidence",
 "python scripts/maintenance_fleet_pilot_outcome_evidence_check.py",
 "node scripts/maintenance_fleet_pilot_outcome_evidence_test.mjs"
],"Build 491 workflow")

for retained in [
 ["python","scripts/maintenance_fleet_owner_approval_pilot_decision_check.py"],
 ["node","scripts/maintenance_fleet_owner_approval_pilot_decision_test.mjs"],
 ["python","scripts/maintenance_fleet_controlled_pilot_activation_readiness_check.py"],
 ["node","scripts/maintenance_fleet_controlled_pilot_activation_readiness_test.mjs"],
 ["python","scripts/retention_maintenance_fleet_operational_pilot_check.py"],
 ["node","scripts/retention_maintenance_fleet_operational_pilot_test.mjs"]
]:
    p=subprocess.run(retained,cwd=ROOT,text=True,capture_output=True)
    if p.returncode: errors.append(f"retained authority failed: {' '.join(retained)}: {p.stderr.strip() or p.stdout.strip()}")

for p in [
 "functions/api/_lib/maintenance-fleet-pilot-outcome-evidence.js",
 "functions/api/admin/maintenance_fleet_pilot_outcome_evidence.js",
 "assets/build439-maintenance-fleet-owner-approval.js",
 "scripts/maintenance_fleet_pilot_outcome_evidence_test.mjs"
]:
    r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
    if r.returncode: errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")

r=subprocess.run(["node","scripts/maintenance_fleet_pilot_outcome_evidence_test.mjs"],cwd=ROOT,text=True,capture_output=True)
if r.returncode: errors.append(f"Build 491 behavioral proof failed: {r.stderr.strip() or r.stdout.strip()}")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])491(?:[^0-9]|$)",p.name)]
if migrations: errors.append("Build 491 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("BUILD 491 MAINTENANCE & FLEET PILOT OUTCOME EVIDENCE AUTHORITY: FAIL")
    for e in errors: print(" -",e)
    sys.exit(1)
print("BUILD 491 MAINTENANCE & FLEET PILOT OUTCOME EVIDENCE AUTHORITY: PASS")
print(" - explicit owner approval and bounded pilot authorization remain prerequisites")
print(" - participants, duration, capacity, invoicing, travel and stop-condition outcomes require observed execution evidence")
print(" - missing execution evidence remains owner action; source GREEN never proves execution")
print(" - no customer activation, booking, capacity reservation, invoice/provider/business mutation or polling is authorized")
