#!/usr/bin/env python3
"""Build 510 source authority for Recovery Drill & Authenticated Device Closure Review."""
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

helper=read("functions/api/_lib/recovery-authenticated-device-closure-review.js")
endpoint=read("functions/api/admin/recovery_authenticated_device_closure_review.js")
launch=read("functions/api/admin/launch_readiness_consolidated.js")
asset=read("assets/launch-readiness-consolidation.js")
contract=read("BUILD510_RECOVERY_DRILL_AUTHENTICATED_DEVICE_CLOSURE_REVIEW.md")
roadmap=read("FORWARD_BUILD_ROADMAP_506_515.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/recovery-authenticated-device-closure-review-authority.yml")

require(helper,[
    "closure_review_build: 510",
    'closure_review_authority: "recovery_authenticated_device_closure_review"',
    "manual_closure_review_ready",
    "recovery_manual_closure_review_ready",
    "authenticated_device_manual_closure_review_ready",
    "current_recovery_negative_evidence_retains_hold",
    "current_authenticated_device_negative_evidence_retains_hold",
    "recovery_and_device_populations_joined: false",
    "current_negative_evidence_overrides_historical_acceptance: true",
    "historical_acceptance_can_close_current_hold: false",
    "source_runtime_green_can_close_hold: false",
    "manual_operator_review_required: true",
    "automatic_hold_narrowing_performed: false",
    "production_restore_performed: false",
    "browser_farm_created: false",
    "canonical_hold_mutated: false",
    "permanent_polling: false"
],"Build 510 helper")

require(endpoint,[
    "getExecutionEvidence",
    "buildRecoveryAuthenticatedDeviceClosureReview",
    "closure_review_build:510",
    'closure_review_authority:"recovery_authenticated_device_closure_review"',
    "recovery_authenticated_device_closure_review",
    '"X-Rosie-Recovery-Device-Closure-Review":"build-510-read-only"',
    "GET,HEAD,OPTIONS"
],"Build 510 endpoint")
for forbidden in ["onRequestPost","onRequestPatch","onRequestDelete","onRequestPut","setInterval(","SUPABASE_SERVICE_ROLE_KEY","STAFF_SESSION_SECRET"]:
    if forbidden in endpoint: errors.append(f"Build 510 endpoint contains forbidden token {forbidden!r}")

require(launch,[
    "buildRecoveryAuthenticatedDeviceClosureReview",
    "recovery_authenticated_device_closure_review",
    'current_recovery_device_closure_review_authority: "recovery_authenticated_device_closure_review"'
],"Launch Readiness composition")
require(asset,[
    "Build 510 closure review",
    "Manual HOLD update candidate",
    "Current negative evidence retains its own HOLD"
],"Launch Readiness UI")
require(contract,[
    "# Build 510 — Recovery Drill & Authenticated Device Closure Review",
    "current attributable bounded non-Production recovery observation",
    "current direct authenticated observations",
    "Build 511 — Maintenance & Fleet Pilot Continuation Decision"
],"Build 510 contract")
require(roadmap,[
    "### Build 510 — Recovery Drill & Authenticated Device Closure Review",
    "### Build 511 — Maintenance & Fleet Pilot Continuation Decision"
],"active roadmap")
require(queue,[
    "**Build 514 — Service Economics, Seasonal Capacity & Reliability Decision Readiness** is the active bounded release.",
    "**Build 515 — Production Learning & Roadmap Renewal** is next",
    "BUILD510_RECOVERY_DRILL_AUTHENTICATED_DEVICE_CLOSURE_REVIEW.md",
    "it has not run out"
],"Build 510 queue")
require(handoff,[
    "**Build 514 — Service Economics, Seasonal Capacity & Reliability Decision Readiness** is the active bounded release.",
    "BUILD510_RECOVERY_DRILL_AUTHENTICATED_DEVICE_CLOSURE_REVIEW.md",
    "recovery_authenticated_device_closure_review_check.py",
    "BUILD500_RECOVERY_DRILL_AUTHENTICATED_DEVICE_OBSERVATION_EXECUTION_EVIDENCE.md"
],"Build 510 handoff")
require(readme,[
    "Current source direction: **Build 514 — Service Economics, Seasonal Capacity & Reliability Decision Readiness**.",
    "BUILD510_RECOVERY_DRILL_AUTHENTICATED_DEVICE_CLOSURE_REVIEW.md",
    "recovery_authenticated_device_closure_review_check.py",
    "Production is not considered GREEN from source promotion alone."
],"Build 510 README")
require(blockers,[
    "Recovery / backup evidence",
    "Independent device / visual evidence",
    "Build 510",
    "manual operator-reviewed"
],"canonical HOLD backlog")
for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
        "python -m py_compile scripts/recovery_authenticated_device_closure_review_check.py",
        "node --check scripts/recovery_authenticated_device_closure_review_test.mjs",
        "node --check functions/api/_lib/recovery-authenticated-device-closure-review.js",
        "python scripts/recovery_authenticated_device_closure_review_check.py",
        "node scripts/recovery_authenticated_device_closure_review_test.mjs"
    ],label)
require(prodcheck,[
    '"recovery_authenticated_device_closure_review"',
    "scripts/recovery_authenticated_device_closure_review_check.py",
    "scripts/recovery_authenticated_device_closure_review_test.mjs",
    "Validate recovery drill & authenticated device closure review authority"
],"Production business acceptance checker")
require(workflow,[
    "Recovery Drill & Authenticated Device Closure Review Authority",
    "recovery-authenticated-device-closure-review",
    "recovery_authenticated_device_closure_review_check.py",
    "recovery_authenticated_device_closure_review_test.mjs",
    "Automatic HOLD narrowing: NONE"
],"Build 510 workflow")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])510(?:[^0-9]|$)",p.name)]
if migrations: errors.append("Build 510 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

for p in [
    "functions/api/_lib/recovery-authenticated-device-closure-review.js",
    "functions/api/admin/recovery_authenticated_device_closure_review.js",
    "functions/api/admin/launch_readiness_consolidated.js",
    "assets/launch-readiness-consolidation.js",
    "scripts/recovery_authenticated_device_closure_review_test.mjs"
]:
    r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
    if r.returncode: errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")

if errors:
    print("BUILD 510 RECOVERY DRILL & AUTHENTICATED DEVICE CLOSURE REVIEW AUTHORITY: FAIL")
    for e in errors: print(" -",e)
    sys.exit(1)

for cmd in [
    ["node","scripts/recovery_authenticated_device_closure_review_test.mjs"],
    ["python","scripts/recovery_authenticated_device_observation_execution_evidence_check.py"],
    ["node","scripts/recovery_authenticated_device_observation_execution_evidence_test.mjs"],
    ["python","scripts/recovery_authenticated_device_evidence_continuity_check.py"],
    ["node","scripts/recovery_authenticated_device_evidence_continuity_test.mjs"],
    ["python","scripts/recovery_drill_evidence_refresh_closure_review_check.py"],
    ["node","scripts/recovery_drill_evidence_refresh_closure_review_test.mjs"],
    ["python","scripts/authenticated_device_observation_refresh_regression_triage_check.py"],
    ["node","scripts/authenticated_device_observation_refresh_regression_triage_test.mjs"]
]:
    r=subprocess.run(cmd,cwd=ROOT,text=True,capture_output=True)
    if r.returncode:
        print("BUILD 510 RECOVERY DRILL & AUTHENTICATED DEVICE CLOSURE REVIEW AUTHORITY: FAIL")
        print(r.stderr.strip() or r.stdout.strip())
        sys.exit(r.returncode)

print("BUILD 510 RECOVERY DRILL & AUTHENTICATED DEVICE CLOSURE REVIEW AUTHORITY: PASS")
print(" - recovery closure requires current attributable bounded non-Production evidence and a successful recorded outcome")
print(" - authenticated-device closure requires current Customer/Detailer/Operations/Admin plus phone/tablet/desktop coverage without a current regression")
print(" - current negative, missing, stale or unavailable evidence retains its owning HOLD")
print(" - recovery and device populations remain separate and any HOLD update remains explicit/manual")
print(" - no Production restore, browser farm, remediation, HOLD mutation, schema/storage mutation or permanent polling")
