#!/usr/bin/env python3
"""Build 457 Recovery Evidence Closure & Drill Readiness authority."""
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

helper=read("functions/api/_lib/recovery-evidence-closure-drill-readiness.js")
endpoint=read("functions/api/admin/recovery_artifact_drill_evidence_review.js")
launch=read("functions/api/admin/launch_readiness_consolidated.js")
asset=read("assets/launch-readiness-consolidation.js")
contract=read("BUILD457_RECOVERY_EVIDENCE_CLOSURE_DRILL_READINESS.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
workflow=read(".github/workflows/recovery-evidence-closure-drill-readiness-authority.yml")

require(helper,[
    "recovery_evidence_closure_drill_readiness","source_availability","closure_readiness",
    "drill_readiness","operator_review_ready","aging_review_required",
    "stale_revalidation_required","not_ready_owner_action","not_ready_unavailable_source",
    "production_restore_performed: false","backlog_mutated: false","permanent_polling: false"
],"Build 457 helper")
require(endpoint,[
    "buildRecoveryEvidenceClosureDrillReadiness","closure_readiness",
    "recovery_evidence_closure_drill_readiness","build:447","GET, HEAD, OPTIONS"
],"retained recovery endpoint")
for forbidden in ["onRequestPost","onRequestPut","onRequestPatch","onRequestDelete","SUPABASE_SERVICE_ROLE_KEY","STAFF_SESSION_SECRET"]:
    if forbidden in endpoint:
        errors.append(f"retained recovery endpoint contains forbidden token {forbidden!r}")
require(launch,[
    "buildRecoveryEvidenceClosureDrillReadiness",
    "recovery_evidence_closure_drill_readiness: recoveryEvidenceClosureDrillReadiness",
    "current_recovery_closure_readiness_authority"
],"Launch Readiness composition")
require(asset,[
    "recovery_evidence_closure_drill_readiness","Recovery sources","Closure readiness","Drill readiness"
],"Launch Readiness recovery panel")
require(contract,[
    "# Build 457 — Recovery Evidence Closure & Drill Readiness",
    "/api/admin/recovery_artifact_drill_evidence_review",
    "operator_review_ready",
    "Build 458 — Authenticated Device Acceptance Closure"
],"Build 457 contract")
require(blockers,[
    "Recovery / backup evidence","Build 457","closure/readiness","operator_review_ready"
],"canonical HOLD backlog")
require(queue,[
    "**Build 457 — Recovery Evidence Closure & Drill Readiness** is the active bounded release.",
    "Build 458 — Authenticated Device Acceptance Closure",
    "BUILD457_RECOVERY_EVIDENCE_CLOSURE_DRILL_READINESS.md",
    "Production deployment/runtime/business acceptance"
],"release queue")
require(handoff,[
    "**Build 457 — Recovery Evidence Closure & Drill Readiness** is the active bounded release.",
    "BUILD457_RECOVERY_EVIDENCE_CLOSURE_DRILL_READINESS.md",
    "recovery-evidence-closure-drill-readiness-authority.yml",
    "recovery_evidence_closure_drill_readiness_check.py"
],"project handoff")
require(readme,[
    "Current source direction: **Build 457 — Recovery Evidence Closure & Drill Readiness**.",
    "BUILD457_RECOVERY_EVIDENCE_CLOSURE_DRILL_READINESS.md",
    "recovery_evidence_closure_drill_readiness_check.py",
    "Build 458 — Authenticated Device Acceptance Closure"
],"README")
for text,label in [(dev,"Development source gate"),(prod,"Production business acceptance")]:
    require(text,[
        "recovery_evidence_closure_drill_readiness_check.py",
        "recovery_evidence_closure_drill_readiness_test.mjs",
        "recovery-evidence-closure-drill-readiness.js"
    ],label)
require(workflow,[
    "Build 457 — Recovery Evidence Closure & Drill Readiness Authority",
    "recovery-evidence-closure-drill-readiness",
    "recovery_evidence_closure_drill_readiness_check.py"
],"focused workflow")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])457(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 457 must not introduce a schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

for p in [
    "functions/api/_lib/recovery-evidence-closure-drill-readiness.js",
    "functions/api/admin/recovery_artifact_drill_evidence_review.js",
    "functions/api/admin/launch_readiness_consolidated.js",
    "assets/launch-readiness-consolidation.js",
    "scripts/recovery_evidence_closure_drill_readiness_test.mjs"
]:
    r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
    if r.returncode:
        errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")

for cmd in [
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
    print("RECOVERY EVIDENCE CLOSURE & DRILL READINESS AUTHORITY: FAIL")
    for e in errors:
        print(" -",e)
    sys.exit(1)

print("RECOVERY EVIDENCE CLOSURE & DRILL READINESS AUTHORITY: PASS")
print(" - backup artifact, retention location and bounded drill closure/readiness are explicit")
print(" - aging/stale/missing/unavailable recovery evidence remains fail-closed")
print(" - explicit operator review remains mandatory before canonical HOLD narrowing")
print(" - no restore/rollback/DNS/secret/R2/provider/schema/business mutation or permanent polling")
