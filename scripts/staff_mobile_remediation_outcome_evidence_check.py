#!/usr/bin/env python3
"""Build 493 source authority for Staff & Mobile Remediation Outcome Evidence."""
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
def require(text, needles, label):
    for needle in needles:
        if needle not in text: errors.append(f"{label} missing {needle!r}")

helper=read("functions/api/_lib/staff-support-mobile-efficiency-learning.js")
endpoint=read("functions/api/admin/staff_support_mobile_efficiency_learning.js")
page=read("admin-staff-workflow-support-learning.html")
route=read("admin-staff-workflow-support-learning/index.html")
client=read("assets/build452-staff-support-mobile-efficiency-learning.js")
test=read("scripts/staff_mobile_remediation_outcome_evidence_test.mjs")
contract=read("BUILD493_STAFF_MOBILE_REMEDIATION_OUTCOME_EVIDENCE.md")
roadmap=read("FORWARD_BUILD_ROADMAP_486_495.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
workflow=read(".github/workflows/staff-mobile-remediation-outcome-evidence-authority.yml")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prod_check=read("scripts/production_business_acceptance_check.py")
retained482=read("scripts/staff_mobile_remediation_execution_evidence_readiness_check.py")

if page != route: errors.append("Build 493 .html and folder-index routes must remain byte-identical")
if len(re.findall(r"<h1\b",page,re.I)) != 1: errors.append("Build 493 learning page must retain exactly one H1")

require(helper,[
 "remediation_outcome_evidence_build: 493",
 'remediation_outcome_evidence_authority: "staff_mobile_remediation_outcome_evidence"',
 "remediation_outcome_evidence_summary","remediation_outcome_evidence",
 '"outcome_evidence_source_required"','"remediation_execution_evidence_required"',
 '"outcome_evidence_unattributable"','"materially_comparable_before_after_required"',
 '"bounded_outcome_evidence_review_ready"',
 "same_device_browser_context","same_role_scope","same_owning_workflow_scope",
 "material_confounders_recorded","before_observed_before_execution","after_observed_after_execution",
 '"temperature_limited_outdoor"','"controlled_environment_required"',
 "counts_as_staff_mobile_friction: false","service_temperature_limit_inferred: false",
 "attributable_execution_alone_proves_effectiveness: false",
 "materially_comparable_observation_alone_proves_causation: false",
 "automatic_outcome_claim_allowed: false","outcome_evidence_persistence_allowed: false"
],"Build 493 helper")
require(endpoint,[
 "remediation_outcome_evidence: []","remediation_outcome_source_available: false",
 'capability: "manage_bookings"','requireActionAccess(access.actor, "it.runtime.view")',
 "onRequestPost","onRequestPut","onRequestPatch","onRequestDelete"
],"Build 493 retained GET-only endpoint")
require(page,[
 'data-build493="staff-mobile-remediation-outcome-evidence"',
 "Build 493 · Staff &amp; Mobile Remediation Outcome Evidence",
 "Staff &amp; Mobile Remediation Outcome Evidence",
 'id="remediationOutcomeEvidenceList"',
 "Build 482 execution evidence readiness",
 "Southern Ontario weather/site restrictions remain separate operational evidence."
],"Build 493 page")
require(client,[
 "renderOutcomeEvidence","remediationOutcomeEvidenceList",
 "Build 493 outcome evidence","Effectiveness claimed: NO","Causation claimed: NO",
 "No background monitoring is running.","/api/admin/staff_support_mobile_efficiency_learning"
],"Build 493 client")
for forbidden in ("setInterval(", "localStorage", "sessionStorage", 'method: "POST"', 'method: "PUT"', 'method: "PATCH"', 'method: "DELETE"'):
    if forbidden in client: errors.append(f"Build 493 client must not contain {forbidden!r}")

require(test,["BUILD 493 STAFF & MOBILE REMEDIATION OUTCOME EVIDENCE TEST: PASS"],"Build 493 behavioral proof")
require(contract,[
 "# Build 493 — Staff & Mobile Remediation Outcome Evidence",
 "Materially like-for-like before/after evidence","Southern Ontario weather/site boundary",
 "Build 494 — Service Economics, Seasonal Operations & Reliability Review"
],"Build 493 contract")
require(roadmap,[
 "### Build 493 — Staff & Mobile Remediation Outcome Evidence",
 "materially like-for-like before/after observations",
 "### Build 494 — Service Economics, Seasonal Operations & Reliability Review"
],"active roadmap")
require(queue,[
 "**Build 494 — Service Economics, Seasonal Operations & Reliability Review** is the active bounded release.",
 "**Build 495 — Production Learning & Roadmap Renewal** is next",
 "BUILD493_STAFF_MOBILE_REMEDIATION_OUTCOME_EVIDENCE.md","it has not run out"
],"Build 493 queue")
require(handoff,[
 "**Build 494 — Service Economics, Seasonal Operations & Reliability Review** is the active bounded release.",
 "BUILD493_STAFF_MOBILE_REMEDIATION_OUTCOME_EVIDENCE.md",
 "staff_mobile_remediation_outcome_evidence_check.py"
],"Build 493 handoff")
require(readme,[
 "Current source direction: **Build 494 — Service Economics, Seasonal Operations & Reliability Review**.",
 "BUILD493_STAFF_MOBILE_REMEDIATION_OUTCOME_EVIDENCE.md",
 "staff_mobile_remediation_outcome_evidence_check.py",
 "Production is not considered GREEN from source promotion alone."
],"Build 493 README")
require(blockers,["# Rosie Dazzlers — Current Production HOLD Inventory","A HOLD remains open until dated, attributable evidence"],"canonical HOLD backlog")
require(workflow,[
 "Build 493 — Staff & Mobile Remediation Outcome Evidence Authority",
 "staff-mobile-remediation-outcome-evidence",
 "python scripts/staff_mobile_remediation_outcome_evidence_check.py",
 "node scripts/staff_mobile_remediation_outcome_evidence_test.mjs"
],"Build 493 focused workflow")
for gate,label in ((dev,"Development source gate"),(prod,"Production business acceptance")):
    require(gate,[
      "python -m py_compile scripts/staff_mobile_remediation_outcome_evidence_check.py",
      "node --check scripts/staff_mobile_remediation_outcome_evidence_test.mjs",
      "python scripts/staff_mobile_remediation_outcome_evidence_check.py",
      "node scripts/staff_mobile_remediation_outcome_evidence_test.mjs"
    ],label)
require(prod_check,[
 '"staff_mobile_remediation_outcome_evidence"',
 "scripts/staff_mobile_remediation_outcome_evidence_check.py",
 "scripts/staff_mobile_remediation_outcome_evidence_test.mjs",
 "Validate staff & mobile remediation outcome evidence authority"
],"central Production acceptance")
require(retained482,[
 "BUILD482_STAFF_MOBILE_REMEDIATION_EXECUTION_EVIDENCE_READINESS.md",
 "staff_mobile_remediation_execution_evidence_readiness_test.mjs"
],"retained Build 482 authority")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])493(?:[^0-9]|$)",p.name)]
if migrations: errors.append("Build 493 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

for p in [
 "functions/api/_lib/staff-support-mobile-efficiency-learning.js",
 "functions/api/admin/staff_support_mobile_efficiency_learning.js",
 "assets/build452-staff-support-mobile-efficiency-learning.js",
 "scripts/staff_mobile_remediation_outcome_evidence_test.mjs"
]:
    r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
    if r.returncode: errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")

for command in [
 ["node","scripts/staff_mobile_remediation_outcome_evidence_test.mjs"],
 ["python","scripts/staff_mobile_remediation_execution_evidence_readiness_check.py"],
 ["node","scripts/staff_mobile_remediation_execution_evidence_readiness_test.mjs"]
]:
    r=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if r.returncode: errors.append(f"retained/behavioral authority failed: {' '.join(command)}: {r.stderr.strip() or r.stdout.strip()}")

if errors:
    print("BUILD 493 STAFF & MOBILE REMEDIATION OUTCOME EVIDENCE AUTHORITY: FAIL")
    for e in errors: print(" -",e)
    sys.exit(1)
print("BUILD 493 STAFF & MOBILE REMEDIATION OUTCOME EVIDENCE AUTHORITY: PASS")
print(" - outcome review requires attributable remediation execution plus materially like-for-like before/after observations")
print(" - role, workflow and representative device/browser context remain explicit")
print(" - Southern Ontario weather/site restrictions remain separate from staff/mobile friction")
print(" - source/runtime GREEN never manufactures execution, outcome, effectiveness or causation evidence")
