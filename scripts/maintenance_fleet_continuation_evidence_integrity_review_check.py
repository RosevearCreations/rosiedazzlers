#!/usr/bin/env python3
"""Build 541 source authority for Maintenance & Fleet Continuation Evidence Integrity Review."""
from pathlib import Path
import re, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def read(path):
    p=ROOT/path
    if not p.is_file(): errors.append(f"missing required file: {path}"); return ""
    return p.read_text(encoding="utf-8",errors="ignore")
def require(text,needles,label):
    for needle in needles:
        if needle not in text: errors.append(f"{label} missing {needle!r}")

helper=read("functions/api/_lib/maintenance-fleet-continuation-evidence-integrity-review.js")
endpoint=read("functions/api/admin/maintenance_fleet_pilot_continuation_decision.js")
client=read("assets/build439-maintenance-fleet-owner-approval.js")
page=read("admin-maintenance-fleet-owner-approval.html"); copy=read("admin-maintenance-fleet-owner-approval/index.html")
doc=read("BUILD541_MAINTENANCE_FLEET_CONTINUATION_EVIDENCE_INTEGRITY_REVIEW.md")
roadmap=read("FORWARD_BUILD_ROADMAP_536_545.md"); queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md"); readme=read("README.md"); blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
docindex=read("DOC_INDEX.md"); dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/maintenance-fleet-continuation-evidence-integrity-review-authority.yml")

if page!=copy: errors.append("Build 541 maintenance/fleet route copies diverged")
if len(re.findall(r"<h1\b",page,re.I))!=1: errors.append("Build 541 page must retain exactly one H1")
require(helper,[
    "maintenance_fleet_continuation_integrity_build: 541",
    'maintenance_fleet_continuation_integrity_authority: "maintenance_fleet_continuation_evidence_integrity_review"',
    '"maintenance_fleet_continuation_integrity_current"',
    '"retained_freshness_review_required"',
    '"pilot_execution_identity_review_required"',
    '"pilot_execution_identity_drift_review_required"',
    '"owner_outcome_identity_review_required"',
    '"continuation_observation_identity_review_required"',
    "exact_build491_execution_trace_required: true",
    "capacity_invoicing_travel_stop_identity_required: true",
    "source_runtime_green_can_prove_continuation: false",
    "historical_continue_can_reserve_future_capacity: false",
    "recurring_billing_enabled: false",
    "capacity_reserved: false",
    "canonical_hold_mutated: false",
    "persistent_telemetry: false"
],"Build 541 helper")
require(endpoint,[
    "buildMaintenanceFleetContinuationEvidenceIntegrityReview",
    "maintenance_fleet_continuation_integrity_build:541",
    'maintenance_fleet_continuation_integrity_authority:"maintenance_fleet_continuation_evidence_integrity_review"',
    "maintenance_fleet_continuation_evidence_integrity_review:integrity",
    '"X-Rosie-Maintenance-Fleet-Continuation-Integrity":"build-541-read-only"'
],"Build 541 endpoint")
for forbidden in ["onRequestPost","onRequestPatch","onRequestDelete","onRequestPut","setInterval("]:
    if forbidden in endpoint: errors.append(f"Build 541 endpoint contains forbidden mutation/polling token {forbidden!r}")
require(client,[
    "renderPilotContinuationIntegrity",
    "maintenance_fleet_continuation_evidence_integrity_review",
    "Build 541 continuation evidence integrity",
    "Historical continuation cannot reserve future capacity"
],"Build 541 UI")
require(page,[
    'data-build541="maintenance-fleet-continuation-evidence-integrity-review"',
    "Build 541 · continuation evidence integrity review",
    'id="pilotContinuationIntegrity"',
    "Participant/duration, capacity, invoicing, travel and stop-condition evidence must remain complete and exact"
],"Build 541 page")
require(doc,[
    "# Build 541 — Maintenance & Fleet Continuation Evidence Integrity Review",
    "exact Build 491 execution trace match",
    "Historical continuation cannot override a current stop condition",
    "Build 542 — Booking & Quote Follow-Up Evidence Integrity Review"
],"Build 541 contract")
require(roadmap,[
    "### Build 541 — Maintenance & Fleet Continuation Evidence Integrity Review",
    "### Build 542 — Booking & Quote Follow-Up Evidence Integrity Review",
    "No enrollment, recurring billing, booking mutation or capacity reservation is inferred."
],"renewed roadmap")
require(queue,[
    "**Build 541 — Maintenance & Fleet Continuation Evidence Integrity Review** is the active bounded release.",
    "**Build 542 — Booking & Quote Follow-Up Evidence Integrity Review** is next",
    "BUILD541_MAINTENANCE_FLEET_CONTINUATION_EVIDENCE_INTEGRITY_REVIEW.md",
    "Production deployment/runtime/business acceptance"
],"release queue")
require(handoff,[
    "**Build 541 — Maintenance & Fleet Continuation Evidence Integrity Review** is the active bounded release.",
    "**Build 542 — Booking & Quote Follow-Up Evidence Integrity Review** is next",
    "BUILD541_MAINTENANCE_FLEET_CONTINUATION_EVIDENCE_INTEGRITY_REVIEW.md",
    "maintenance_fleet_continuation_evidence_integrity_review_check.py"
],"project handoff")
require(readme,[
    "Current source direction: **Build 541 — Maintenance & Fleet Continuation Evidence Integrity Review**.",
    "BUILD541_MAINTENANCE_FLEET_CONTINUATION_EVIDENCE_INTEGRITY_REVIEW.md",
    "scripts/maintenance_fleet_continuation_evidence_integrity_review_check.py",
    "Production is not considered GREEN from source promotion alone."
],"README")
require(blockers,[
    "Build 541 adds read-only maintenance/fleet continuation evidence integrity review",
    "exact bounded execution trace",
    "triggered stop condition",
    "No enrollment, recurring billing, booking or invoice mutation"
],"canonical HOLD backlog")
require(docindex,["BUILD541_MAINTENANCE_FLEET_CONTINUATION_EVIDENCE_INTEGRITY_REVIEW.md","current bounded release contract"],"documentation index")
for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
        "python -m py_compile scripts/maintenance_fleet_continuation_evidence_integrity_review_check.py",
        "node --check scripts/maintenance_fleet_continuation_evidence_integrity_review_test.mjs",
        "node --check functions/api/_lib/maintenance-fleet-continuation-evidence-integrity-review.js",
        "python scripts/maintenance_fleet_continuation_evidence_integrity_review_check.py",
        "node scripts/maintenance_fleet_continuation_evidence_integrity_review_test.mjs"
    ],label)
require(prodcheck,[
    '"maintenance_fleet_continuation_evidence_integrity_review"',
    "scripts/maintenance_fleet_continuation_evidence_integrity_review_check.py",
    "scripts/maintenance_fleet_continuation_evidence_integrity_review_test.mjs"
],"central Production acceptance")
require(workflow,[
    "Maintenance & Fleet Continuation Evidence Integrity Review Authority",
    "maintenance-fleet-continuation-evidence-integrity-review",
    "python scripts/maintenance_fleet_continuation_evidence_integrity_review_check.py",
    "node scripts/maintenance_fleet_continuation_evidence_integrity_review_test.mjs",
    "Participant/duration + execution trace: EXACT OR REVIEW",
    "Capacity reservation / canonical HOLD mutation: NONE"
],"Build 541 workflow")
migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])541(?:[^0-9]|$)",p.name)]
if migrations: errors.append("Build 541 must not introduce a schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))
for path in [
    "functions/api/_lib/maintenance-fleet-continuation-evidence-integrity-review.js",
    "functions/api/admin/maintenance_fleet_pilot_continuation_decision.js",
    "assets/build439-maintenance-fleet-owner-approval.js",
    "scripts/maintenance_fleet_continuation_evidence_integrity_review_test.mjs"
]:
    proc=subprocess.run(["node","--check",path],cwd=ROOT,text=True,capture_output=True)
    if proc.returncode: errors.append(f"{path} syntax failed: {proc.stderr.strip() or proc.stdout.strip()}")
if errors:
    print("BUILD 541 MAINTENANCE & FLEET CONTINUATION EVIDENCE INTEGRITY REVIEW AUTHORITY: FAIL")
    for error in errors: print(" -",error)
    sys.exit(1)
for command in [
    ["node","scripts/maintenance_fleet_continuation_evidence_freshness_review_test.mjs"],
    ["node","scripts/maintenance_fleet_continuation_outcome_continuity_test.mjs"],
    ["node","scripts/maintenance_fleet_continuation_evidence_integrity_review_test.mjs"]
]:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 541 MAINTENANCE & FLEET CONTINUATION EVIDENCE INTEGRITY REVIEW AUTHORITY: FAIL")
        print(proc.stderr.strip() or proc.stdout.strip())
        sys.exit(proc.returncode)
print("BUILD 541 MAINTENANCE & FLEET CONTINUATION EVIDENCE INTEGRITY REVIEW AUTHORITY: PASS")
print(" - retained Build 531 freshness remains current or integrity fails closed")
print(" - exact bounded execution identity must match retained Build 521/491 evidence")
print(" - owner continue-or-hold identity remains current and exact")
print(" - triggered stop conditions cannot be overridden by historical continuation")
print(" - enrollment/billing/booking/invoice/capacity/HOLD/schema/storage/telemetry mutation: NONE")
