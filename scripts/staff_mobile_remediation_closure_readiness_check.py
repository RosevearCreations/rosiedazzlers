#!/usr/bin/env python3
"""Build 513 source authority for Staff & Mobile Remediation Closure Readiness."""
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

helper=read("functions/api/_lib/staff-mobile-remediation-closure-readiness.js")
endpoint=read("functions/api/admin/staff_mobile_remediation_closure_readiness.js")
contract=read("BUILD513_STAFF_MOBILE_REMEDIATION_CLOSURE_READINESS.md")
roadmap=read("FORWARD_BUILD_ROADMAP_506_515.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
workflow=read(".github/workflows/staff-mobile-remediation-closure-readiness-authority.yml")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")

require(helper,[
 "closure_readiness_build: 513",
 'closure_readiness_authority: "staff_mobile_remediation_closure_readiness"',
 '"interpretation_not_review_ready"',
 '"closure_evidence_source_required"',
 '"closure_follow_up_evidence_required"',
 '"closure_follow_up_unattributable"',
 '"like_for_like_closure_evidence_required"',
 '"material_confounder_review_required"',
 '"bounded_closure_readiness_review_ready"',
 "material_confounder_blocks_closure_readiness: true",
 "automatic_remediation_closure_allowed: false",
 "canonical_hold_mutation_allowed: false",
 "permanent_polling_allowed: false",
 "remediation_effective: null",
 "causation: null",
 "staff_fault: null",
 "device_fault: null"
],"Build 513 helper")
require(endpoint,[
 "getLearning",
 "buildStaffMobileRemediationClosureReadiness",
 "STAFF_MOBILE_REMEDIATION_CLOSURE_EVIDENCE_JSON",
 "staff_mobile_remediation_closure_readiness",
 '"X-Rosie-Staff-Mobile-Closure-Readiness":"build-513-read-only"',
 "GET,HEAD,OPTIONS"
],"Build 513 endpoint")
for forbidden in ["onRequestPost","onRequestPut","onRequestPatch","onRequestDelete","setInterval(","localStorage","sessionStorage"]:
    if forbidden in endpoint: errors.append(f"Build 513 endpoint contains forbidden mutation/polling token {forbidden!r}")
require(contract,[
 "# Build 513 — Staff & Mobile Remediation Closure Readiness",
 "Closure-readiness prerequisites",
 "material confounders are explicitly recorded",
 "No state closes a remediation",
 "Southern Ontario weather/site boundary",
 "Build 514 — Service Economics, Seasonal Capacity & Reliability Decision Readiness"
],"Build 513 contract")
require(roadmap,[
 "### Build 513 — Staff & Mobile Remediation Closure Readiness",
 "materially like-for-like before/after evidence",
 "### Build 514 — Service Economics, Seasonal Capacity & Reliability Decision Readiness"
],"active roadmap")
require(queue,[
 "**Build 514 — Service Economics, Seasonal Capacity & Reliability Decision Readiness** is the active bounded release.",
 "**Build 515 — Production Learning & Roadmap Renewal** is next",
 "BUILD513_STAFF_MOBILE_REMEDIATION_CLOSURE_READINESS.md",
 "it has not run out"
],"Build 513 queue")
require(handoff,[
 "**Build 514 — Service Economics, Seasonal Capacity & Reliability Decision Readiness** is the active bounded release.",
 "BUILD513_STAFF_MOBILE_REMEDIATION_CLOSURE_READINESS.md",
 "staff_mobile_remediation_closure_readiness_check.py",
 "BUILD503_STAFF_MOBILE_REMEDIATION_OUTCOME_INTERPRETATION_FOLLOW_UP.md"
],"Build 513 handoff")
require(readme,[
 "Current source direction: **Build 514 — Service Economics, Seasonal Capacity & Reliability Decision Readiness**.",
 "BUILD513_STAFF_MOBILE_REMEDIATION_CLOSURE_READINESS.md",
 "staff_mobile_remediation_closure_readiness_check.py",
 "Production is not considered GREEN from source promotion alone."
],"Build 513 README")
require(blockers,[
 "Build 513 adds a read-only staff/mobile remediation closure-readiness layer",
 "material confounder",
 "Southern Ontario"
],"canonical HOLD backlog")
for gate,label in [(dev,"Development source gate"),(prod,"Production business acceptance")]:
    require(gate,[
      "python -m py_compile scripts/staff_mobile_remediation_closure_readiness_check.py",
      "node --check functions/api/_lib/staff-mobile-remediation-closure-readiness.js",
      "node --check functions/api/admin/staff_mobile_remediation_closure_readiness.js",
      "node --check scripts/staff_mobile_remediation_closure_readiness_test.mjs",
      "python scripts/staff_mobile_remediation_closure_readiness_check.py",
      "node scripts/staff_mobile_remediation_closure_readiness_test.mjs"
    ],label)
require(workflow,[
 "Build 513 — Staff & Mobile Remediation Closure Readiness Authority",
 "staff-mobile-remediation-closure-readiness",
 "python scripts/staff_mobile_remediation_closure_readiness_check.py",
 "node scripts/staff_mobile_remediation_closure_readiness_test.mjs"
],"Build 513 workflow")

for command in [
 ["python","scripts/staff_mobile_remediation_outcome_interpretation_follow_up_check.py"],
 ["node","scripts/staff_mobile_remediation_outcome_interpretation_follow_up_test.mjs"],
 ["python","scripts/staff_mobile_remediation_outcome_evidence_check.py"],
 ["node","scripts/staff_mobile_remediation_outcome_evidence_test.mjs"],
 ["python","scripts/staff_mobile_remediation_execution_evidence_readiness_check.py"],
 ["node","scripts/staff_mobile_remediation_execution_evidence_readiness_test.mjs"],
 ["python","scripts/staff_mobile_remediation_verification_check.py"],
 ["node","scripts/staff_mobile_remediation_verification_test.mjs"],
 ["python","scripts/staff_mobile_friction_remediation_priorities_check.py"],
 ["node","scripts/staff_mobile_friction_remediation_priorities_test.mjs"],
 ["python","scripts/staff_support_mobile_efficiency_learning_check.py"],
 ["node","scripts/staff_support_mobile_efficiency_learning_test.mjs"],
 ["node","scripts/staff_mobile_remediation_closure_readiness_test.mjs"]
]:
    p=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if p.returncode: errors.append(f"retained/behavioral authority failed: {' '.join(command)}: {p.stderr.strip() or p.stdout.strip()}")

for p in [
 "functions/api/_lib/staff-mobile-remediation-closure-readiness.js",
 "functions/api/admin/staff_mobile_remediation_closure_readiness.js",
 "scripts/staff_mobile_remediation_closure_readiness_test.mjs"
]:
    r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
    if r.returncode: errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])513(?:[^0-9]|$)",p.name)]
if migrations: errors.append("Build 513 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("BUILD 513 STAFF & MOBILE REMEDIATION CLOSURE READINESS AUTHORITY: FAIL")
    for e in errors: print(" -",e)
    sys.exit(1)
print("BUILD 513 STAFF & MOBILE REMEDIATION CLOSURE READINESS AUTHORITY: PASS")
print(" - closure readiness is limited to retained Build 503/493/482 attributable evidence")
print(" - like-for-like workflow, role, representative device/browser, measure and sample/window context are required")
print(" - material confounders block closure readiness and weather/site restrictions remain separate")
print(" - effectiveness, causation, staff/device fault and business impact remain undecided")
print(" - no automatic remediation/closure, role change, outreach, HOLD/schema/storage mutation, telemetry or polling")
