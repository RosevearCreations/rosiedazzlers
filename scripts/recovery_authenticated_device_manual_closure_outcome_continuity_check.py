#!/usr/bin/env python3
"""Build 520 source authority for Recovery Drill & Authenticated Device Manual Closure Outcome Continuity."""
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

helper=read("functions/api/_lib/recovery-authenticated-device-manual-closure-outcome-continuity.js")
endpoint=read("functions/api/admin/recovery_authenticated_device_closure_review.js")
launch=read("functions/api/admin/launch_readiness_consolidated.js")
asset=read("assets/launch-readiness-consolidation.js")
contract=read("BUILD520_RECOVERY_DRILL_AUTHENTICATED_DEVICE_MANUAL_CLOSURE_OUTCOME_CONTINUITY.md")
roadmap=read("FORWARD_BUILD_ROADMAP_516_525.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
docindex=read("DOC_INDEX.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/recovery-authenticated-device-manual-closure-outcome-continuity-authority.yml")

require(helper,[
    "manual_closure_outcome_build: 520",
    'manual_closure_outcome_authority: "recovery_authenticated_device_manual_closure_outcome_continuity"',
    '"manual_closure_outcomes_observed"',
    '"manual_holds_retained_observed"',
    '"manual_closure_operator_outcome_required"',
    '"manual_closure_evidence_conflict"',
    '"owning_hold_retained_by_current_evidence"',
    "recovery_and_device_populations_joined: false",
    "negative_missing_stale_or_unavailable_evidence_retains_owning_hold: true",
    "current_attributable_bounded_nonproduction_recovery_required: true",
    "current_direct_authenticated_role_device_browser_observation_required: true",
    "credentials_must_not_be_stored: true",
    "automatic_canonical_hold_narrowing_performed: false",
    "production_restore_performed: false",
    "authenticated_login_action_performed: false",
    "restricted_credentials_stored: false",
    "canonical_hold_mutated: false"
],"Build 520 helper")

require(endpoint,[
    "buildRecoveryAuthenticatedDeviceManualClosureOutcomeContinuity",
    "manual_closure_outcome_build:520",
    'manual_closure_outcome_authority:"recovery_authenticated_device_manual_closure_outcome_continuity"',
    "recovery_authenticated_device_manual_closure_outcome_continuity",
    "manual_recovery_hold_outcome: null",
    "manual_device_hold_outcome: null",
    '"X-Rosie-Recovery-Device-Manual-Closure":"build-520-read-only"',
    "GET,HEAD,OPTIONS"
],"Build 520 endpoint")
for forbidden in ["onRequestPost","onRequestPatch","onRequestDelete","onRequestPut","STAFF_SESSION_SECRET","SUPABASE_SERVICE_ROLE_KEY"]:
    if forbidden in endpoint: errors.append(f"Build 520 endpoint contains forbidden token {forbidden!r}")

require(launch,[
    "buildRecoveryAuthenticatedDeviceManualClosureOutcomeContinuity",
    "recovery_authenticated_device_manual_closure_outcome_continuity",
    'current_recovery_device_manual_closure_outcome_authority: "recovery_authenticated_device_manual_closure_outcome_continuity"'
],"Launch Readiness composition")
require(asset,[
    "Build 520 manual closure outcome continuity",
    "Recovery manual outcome",
    "Authenticated-device manual outcome",
    "Automatic canonical HOLD narrowing"
],"Launch Readiness UI")
require(contract,[
    "# Build 520 — Recovery Drill & Authenticated Device Manual Closure Outcome Continuity",
    "current attributable bounded non-Production recovery observations",
    "current direct authenticated role/device/browser observations",
    "Build 521 — Maintenance & Fleet Continuation Outcome Continuity"
],"Build 520 contract")
require(roadmap,[
    "### Build 520 — Recovery Drill & Authenticated Device Manual Closure Outcome Continuity",
    "### Build 521 — Maintenance & Fleet Continuation Outcome Continuity",
    "Negative, missing, stale or unavailable evidence retains the owning HOLD"
],"active roadmap")
require(queue,[
    "**Build 520 — Recovery Drill & Authenticated Device Manual Closure Outcome Continuity** is the active bounded release.",
    "**Build 521 — Maintenance & Fleet Continuation Outcome Continuity** is next",
    "BUILD520_RECOVERY_DRILL_AUTHENTICATED_DEVICE_MANUAL_CLOSURE_OUTCOME_CONTINUITY.md",
    "non-force fast-forward",
    "it has not run out"
],"Build 520 queue")
require(handoff,[
    "**Build 520 — Recovery Drill & Authenticated Device Manual Closure Outcome Continuity** is the active bounded release.",
    "BUILD520_RECOVERY_DRILL_AUTHENTICATED_DEVICE_MANUAL_CLOSURE_OUTCOME_CONTINUITY.md",
    "recovery_authenticated_device_manual_closure_outcome_continuity_check.py",
    "BUILD510_RECOVERY_DRILL_AUTHENTICATED_DEVICE_CLOSURE_REVIEW.md",
    "BUILD500_RECOVERY_DRILL_AUTHENTICATED_DEVICE_OBSERVATION_EXECUTION_EVIDENCE.md"
],"Build 520 handoff")
require(readme,[
    "Current source direction: **Build 520 — Recovery Drill & Authenticated Device Manual Closure Outcome Continuity**.",
    "BUILD520_RECOVERY_DRILL_AUTHENTICATED_DEVICE_MANUAL_CLOSURE_OUTCOME_CONTINUITY.md",
    "scripts/recovery_authenticated_device_manual_closure_outcome_continuity_check.py",
    "Production is not considered GREEN from source promotion alone."
],"Build 520 README")
require(blockers,[
    "Recovery / backup evidence",
    "Independent device / visual evidence",
    "Build 520 adds read-only recovery/device manual closure outcome continuity",
    "No canonical HOLD is narrowed automatically"
],"canonical HOLD backlog")
require(docindex,[
    "BUILD520_RECOVERY_DRILL_AUTHENTICATED_DEVICE_MANUAL_CLOSURE_OUTCOME_CONTINUITY.md",
    "current bounded release contract"
],"documentation index")

for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
        "python -m py_compile scripts/recovery_authenticated_device_manual_closure_outcome_continuity_check.py",
        "node --check scripts/recovery_authenticated_device_manual_closure_outcome_continuity_test.mjs",
        "node --check functions/api/_lib/recovery-authenticated-device-manual-closure-outcome-continuity.js",
        "python scripts/recovery_authenticated_device_manual_closure_outcome_continuity_check.py",
        "node scripts/recovery_authenticated_device_manual_closure_outcome_continuity_test.mjs"
    ],label)

require(prodcheck,[
    '"recovery_authenticated_device_manual_closure_outcome_continuity"',
    "scripts/recovery_authenticated_device_manual_closure_outcome_continuity_check.py",
    "scripts/recovery_authenticated_device_manual_closure_outcome_continuity_test.mjs"
],"central Production acceptance")
require(workflow,[
    "Recovery Drill & Authenticated Device Manual Closure Outcome Continuity Authority",
    "python scripts/recovery_authenticated_device_manual_closure_outcome_continuity_check.py",
    "node scripts/recovery_authenticated_device_manual_closure_outcome_continuity_test.mjs",
    "Recovery/device populations: SEPARATE",
    "Negative/missing/stale/unavailable evidence: OWNING HOLD RETAINED",
    "Production restore / authenticated login / credential storage: NONE",
    "Automatic canonical HOLD narrowing: NONE"
],"Build 520 workflow")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])520(?:[^0-9]|$)",p.name)]
if migrations: errors.append("Build 520 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

for p in [
    "functions/api/_lib/recovery-authenticated-device-manual-closure-outcome-continuity.js",
    "functions/api/admin/recovery_authenticated_device_closure_review.js",
    "functions/api/admin/launch_readiness_consolidated.js",
    "assets/launch-readiness-consolidation.js",
    "scripts/recovery_authenticated_device_manual_closure_outcome_continuity_test.mjs"
]:
    r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
    if r.returncode: errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")

if errors:
    print("BUILD 520 RECOVERY DRILL & AUTHENTICATED DEVICE MANUAL CLOSURE OUTCOME CONTINUITY AUTHORITY: FAIL")
    for e in errors: print(" -",e)
    sys.exit(1)

for cmd in [
    ["node","scripts/recovery_authenticated_device_manual_closure_outcome_continuity_test.mjs"],
    [sys.executable,"scripts/recovery_authenticated_device_closure_review_check.py"],
    ["node","scripts/recovery_authenticated_device_closure_review_test.mjs"],
    [sys.executable,"scripts/recovery_authenticated_device_observation_execution_evidence_check.py"],
    ["node","scripts/recovery_authenticated_device_observation_execution_evidence_test.mjs"],
    [sys.executable,"scripts/recovery_authenticated_device_evidence_continuity_check.py"],
    ["node","scripts/recovery_authenticated_device_evidence_continuity_test.mjs"],
    [sys.executable,"scripts/recovery_drill_evidence_refresh_closure_review_check.py"],
    ["node","scripts/recovery_drill_evidence_refresh_closure_review_test.mjs"],
    [sys.executable,"scripts/authenticated_device_observation_refresh_regression_triage_check.py"],
    ["node","scripts/authenticated_device_observation_refresh_regression_triage_test.mjs"]
]:
    r=subprocess.run(cmd,cwd=ROOT,text=True,capture_output=True)
    if r.returncode:
        print("BUILD 520 RECOVERY DRILL & AUTHENTICATED DEVICE MANUAL CLOSURE OUTCOME CONTINUITY AUTHORITY: FAIL")
        print(r.stderr.strip() or r.stdout.strip())
        sys.exit(r.returncode)

print("BUILD 520 RECOVERY DRILL & AUTHENTICATED DEVICE MANUAL CLOSURE OUTCOME CONTINUITY AUTHORITY: PASS")
print(" - recovery and authenticated-device populations remain separate")
print(" - current attributable bounded non-Production recovery evidence is required before a recovery narrowing outcome")
print(" - current direct authenticated role/device/browser evidence is required before a device narrowing outcome")
print(" - negative, missing, stale or unavailable evidence retains its owning HOLD")
print(" - operator outcomes must be explicit, dated, attributable and trace-matched")
print(" - no Production restore, authenticated login, credential storage, automatic HOLD mutation, schema/storage mutation or permanent polling")
