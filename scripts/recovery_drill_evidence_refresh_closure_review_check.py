#!/usr/bin/env python3
"""Build 477 Recovery Drill Evidence Refresh & Closure Review authority."""
from pathlib import Path
import re
import subprocess
import sys

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

helper=read("functions/api/_lib/recovery-drill-evidence-refresh-closure-review.js")
endpoint=read("functions/api/admin/recovery_artifact_drill_evidence_review.js")
launch=read("functions/api/admin/launch_readiness_consolidated.js")
asset=read("assets/launch-readiness-consolidation.js")
contract=read("BUILD477_RECOVERY_DRILL_EVIDENCE_REFRESH_CLOSURE_REVIEW.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/recovery-drill-evidence-refresh-closure-review-authority.yml")

require(helper,[
    "recovery_drill_evidence_refresh_closure_review",
    "retain_hold_evidence_refresh_review_required",
    "retain_hold_bounded_drill_plan_review_required",
    "evidence_refresh_plan_ready_for_separate_execution",
    "bounded_nonproduction_drill_plan_ready_for_separate_execution",
    "closure_review_ready_for_manual_hold_update",
    'default_if_no_owner_action: "retain_hold"',
    "post_observation_evidence_requirements",
    "execution_authorized_by_this_package: false",
    "production_restore_authorized: false",
    "drill_executed: false",
    "evidence_refresh_executed: false",
    "owner_review_record_persisted: false",
    "canonical_hold_mutated: false",
    "permanent_polling: false"
],"Build 477 helper")
require(endpoint,[
    "buildRecoveryDrillEvidenceRefreshClosureReview",
    "current_refresh_closure_build: 477",
    'current_refresh_closure_authority:"recovery_drill_evidence_refresh_closure_review"',
    "refresh_closure_review",
    "owner_review:null",
    "GET, HEAD, OPTIONS"
],"retained recovery endpoint")
for forbidden in ["onRequestPost","onRequestPut","onRequestPatch","onRequestDelete","SUPABASE_SERVICE_ROLE_KEY","STAFF_SESSION_SECRET"]:
    if forbidden in endpoint:
        errors.append(f"retained recovery endpoint contains forbidden token {forbidden!r}")
require(launch,[
    "buildRecoveryDrillEvidenceRefreshClosureReview",
    "recovery_drill_evidence_refresh_closure_review: recoveryDrillEvidenceRefreshClosureReview",
    'current_recovery_refresh_closure_authority: "recovery_drill_evidence_refresh_closure_review"',
    "owner_review: null"
],"Launch Readiness composition")
require(asset,[
    "recovery_drill_evidence_refresh_closure_review",
    "Build 477 refresh / closure review",
    "Plan kind",
    "Owner review trace",
    "Post-observation evidence",
    "Production restore authorized"
],"Launch Readiness recovery panel")
require(contract,[
    "# Build 477 — Recovery Drill Evidence Refresh & Closure Review",
    "/api/admin/recovery_artifact_drill_evidence_review",
    "bounded_nonproduction_drill_plan_ready_for_separate_execution",
    "Build 478 — Authenticated Device Observation Refresh & Regression Triage"
],"Build 477 contract")
require(blockers,[
    "Recovery / backup evidence","Build 477","owner-reviewed","post-observation"
],"canonical HOLD backlog")
require(queue,[
    "BUILD477_RECOVERY_DRILL_EVIDENCE_REFRESH_CLOSURE_REVIEW.md",
    "Build 478 — Authenticated Device Observation Refresh & Regression Triage",
    "Production deployment/runtime/business acceptance",
    "it has not run out"
],"current release queue")
require(handoff,[
    "BUILD477_RECOVERY_DRILL_EVIDENCE_REFRESH_CLOSURE_REVIEW.md",
    "recovery-drill-evidence-refresh-closure-review-authority.yml",
    "recovery_drill_evidence_refresh_closure_review_check.py",
    "Production deployment/runtime/business acceptance must independently prove that exact SHA."
],"project handoff")
require(readme,[
    "BUILD477_RECOVERY_DRILL_EVIDENCE_REFRESH_CLOSURE_REVIEW.md",
    "recovery_drill_evidence_refresh_closure_review_check.py",
    "Production is not considered GREEN from source promotion alone."
],"README")
for text,label in [(dev,"Development source gate"),(prod,"Production business acceptance")]:
    require(text,[
        "recovery_drill_evidence_refresh_closure_review_check.py",
        "recovery_drill_evidence_refresh_closure_review_test.mjs",
        "recovery-drill-evidence-refresh-closure-review.js"
    ],label)
require(prodcheck,[
    '"recovery_drill_evidence_refresh_closure_review"',
    "scripts/recovery_drill_evidence_refresh_closure_review_check.py",
    "scripts/recovery_drill_evidence_refresh_closure_review_test.mjs",
    "Validate recovery drill evidence refresh & closure review authority"
],"Production business acceptance source authority")
require(workflow,[
    "Build 477 — Recovery Drill Evidence Refresh & Closure Review Authority",
    "recovery-drill-evidence-refresh-closure-review",
    "recovery_drill_evidence_refresh_closure_review_check.py"
],"focused workflow")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])477(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 477 must not introduce a schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

for p in [
    "functions/api/_lib/recovery-drill-evidence-refresh-closure-review.js",
    "functions/api/admin/recovery_artifact_drill_evidence_review.js",
    "functions/api/admin/launch_readiness_consolidated.js",
    "assets/launch-readiness-consolidation.js",
    "scripts/recovery_drill_evidence_refresh_closure_review_test.mjs"
]:
    r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
    if r.returncode:
        errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")

for cmd in [
    ["node","scripts/recovery_drill_evidence_refresh_closure_review_test.mjs"],
    ["python","scripts/recovery_evidence_validation_drill_decision_readiness_check.py"],
    ["node","scripts/recovery_evidence_validation_drill_decision_readiness_test.mjs"],
    ["python","scripts/recovery_evidence_closure_drill_readiness_check.py"],
    ["node","scripts/recovery_evidence_closure_drill_readiness_test.mjs"],
    ["python","scripts/recovery_artifact_drill_evidence_review_check.py"],
    ["node","scripts/recovery_artifact_drill_evidence_review_test.mjs"],
    ["python","scripts/backup_recovery_evidence_closure_check.py"],
    ["node","scripts/backup_recovery_evidence_closure_test.mjs"],
    ["python","scripts/recovery_export_operational_proof_check.py"],
    ["node","scripts/recovery_export_operational_proof_test.mjs"],
    ["python","scripts/release_rollback_recovery_check.py"]
]:
    r=subprocess.run(cmd,cwd=ROOT,text=True,capture_output=True)
    if r.returncode:
        errors.append(f"retained authority failed: {' '.join(cmd)}: {r.stderr.strip() or r.stdout.strip()}")

if errors:
    print("RECOVERY DRILL EVIDENCE REFRESH & CLOSURE REVIEW AUTHORITY: FAIL")
    for e in errors:
        print(" -",e)
    sys.exit(1)

print("RECOVERY DRILL EVIDENCE REFRESH & CLOSURE REVIEW AUTHORITY: PASS")
print(" - stale/missing recovery evidence maps to explicit owner-reviewed refresh or bounded non-Production drill planning")
print(" - drill plans record prerequisites and required post-observation evidence")
print(" - current evidence still requires an explicit matching owner review before manual HOLD update")
print(" - no refresh/drill/restore/HOLD/schema/storage/business mutation or permanent polling")
