#!/usr/bin/env python3
"""Build 467 Recovery Evidence Validation & Drill Decision Readiness authority."""
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

helper=read("functions/api/_lib/recovery-evidence-validation-drill-decision-readiness.js")
endpoint=read("functions/api/admin/recovery_artifact_drill_evidence_review.js")
launch=read("functions/api/admin/launch_readiness_consolidated.js")
asset=read("assets/launch-readiness-consolidation.js")
contract=read("BUILD467_RECOVERY_EVIDENCE_VALIDATION_DRILL_DECISION_READINESS.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
workflow=read(".github/workflows/recovery-evidence-validation-drill-decision-readiness-authority.yml")

require(helper,[
    "recovery_evidence_validation_drill_decision_readiness",
    "operator_recovery_decision_ready","aging_evidence_review_required",
    "revalidate_before_drill_decision","retain_hold_missing_evidence",
    "retain_hold_unavailable_source","bounded_nonproduction_drill_candidate",
    "default_if_no_operator_action: \"retain_hold\"",
    "production_restore_authorized: false","automatic_drill_execution: false",
    "drill_executed: false","backlog_mutated: false","permanent_polling: false"
],"Build 467 helper")
require(endpoint,[
    "buildRecoveryEvidenceValidationDrillDecisionReadiness",
    "validation_drill_decision_readiness",
    "current_validation_build: 467",
    "GET, HEAD, OPTIONS"
],"retained recovery endpoint")
for forbidden in ["onRequestPost","onRequestPut","onRequestPatch","onRequestDelete","SUPABASE_SERVICE_ROLE_KEY","STAFF_SESSION_SECRET"]:
    if forbidden in endpoint:
        errors.append(f"retained recovery endpoint contains forbidden token {forbidden!r}")
require(launch,[
    "buildRecoveryEvidenceValidationDrillDecisionReadiness",
    "recovery_evidence_validation_drill_decision_readiness: recoveryEvidenceValidationDrillDecisionReadiness",
    "current_recovery_validation_decision_authority"
],"Launch Readiness composition")
require(asset,[
    "recovery_evidence_validation_drill_decision_readiness",
    "Decision readiness","Drill decision","Default without operator action"
],"Launch Readiness recovery panel")
require(contract,[
    "# Build 467 — Recovery Evidence Validation & Drill Decision Readiness",
    "/api/admin/recovery_artifact_drill_evidence_review",
    "operator_recovery_decision_ready",
    "Build 468 — Authenticated Device Regression Closure"
],"Build 467 contract")
require(blockers,[
    "Recovery / backup evidence","Build 467","drill decision","retain_hold"
],"canonical HOLD backlog")
require(queue,[
    "BUILD467_RECOVERY_EVIDENCE_VALIDATION_DRILL_DECISION_READINESS.md"
],"release queue retained Build 467 authority")
require(handoff,[
    "BUILD467_RECOVERY_EVIDENCE_VALIDATION_DRILL_DECISION_READINESS.md",
    "recovery-evidence-validation-drill-decision-readiness-authority.yml",
    "recovery_evidence_validation_drill_decision_readiness_check.py"
],"project handoff")
require(readme,[
    "BUILD467_RECOVERY_EVIDENCE_VALIDATION_DRILL_DECISION_READINESS.md",
    "recovery_evidence_validation_drill_decision_readiness_check.py"
],"README retained authority")
for text,label in [(dev,"Development source gate"),(prod,"Production business acceptance")]:
    require(text,[
        "recovery_evidence_validation_drill_decision_readiness_check.py",
        "recovery_evidence_validation_drill_decision_readiness_test.mjs",
        "recovery-evidence-validation-drill-decision-readiness.js"
    ],label)
require(workflow,[
    "Build 467 — Recovery Evidence Validation & Drill Decision Readiness Authority",
    "recovery-evidence-validation-drill-decision-readiness",
    "recovery_evidence_validation_drill_decision_readiness_check.py"
],"focused workflow")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])467(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 467 must not introduce a schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

for p in [
    "functions/api/_lib/recovery-evidence-validation-drill-decision-readiness.js",
    "functions/api/admin/recovery_artifact_drill_evidence_review.js",
    "functions/api/admin/launch_readiness_consolidated.js",
    "assets/launch-readiness-consolidation.js",
    "scripts/recovery_evidence_validation_drill_decision_readiness_test.mjs"
]:
    r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
    if r.returncode:
        errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")

for cmd in [
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
    print("RECOVERY EVIDENCE VALIDATION & DRILL DECISION READINESS AUTHORITY: FAIL")
    for e in errors:
        print(" -",e)
    sys.exit(1)

print("RECOVERY EVIDENCE VALIDATION & DRILL DECISION READINESS AUTHORITY: PASS")
print(" - recovery evidence freshness and operator decision states are explicit")
print(" - stale/missing drill evidence may become bounded non-Production drill review candidates only")
print(" - default without operator action remains retain_hold")
print(" - no restore/rollback/drill/DNS/secret/R2/provider/schema/business mutation or permanent polling")
