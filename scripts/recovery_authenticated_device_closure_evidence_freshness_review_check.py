#!/usr/bin/env python3
from pathlib import Path
import subprocess, sys

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
        if needle not in text:
            errors.append(f"{label} missing {needle!r}")

helper=read("functions/api/_lib/recovery-authenticated-device-closure-evidence-freshness-review.js")
endpoint=read("functions/api/admin/recovery_authenticated_device_closure_review.js")
consolidated=read("functions/api/admin/launch_readiness_consolidated.js")
client=read("assets/launch-readiness-consolidation.js")
doc=read("BUILD530_RECOVERY_AUTHENTICATED_DEVICE_CLOSURE_EVIDENCE_FRESHNESS_REVIEW.md")
roadmap=read("FORWARD_BUILD_ROADMAP_526_535.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
docindex=read("DOC_INDEX.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/recovery-authenticated-device-closure-evidence-freshness-review-authority.yml")

require(helper,[
    "recovery_authenticated_device_closure_freshness_build: 530",
    'recovery_authenticated_device_closure_freshness_authority: "recovery_authenticated_device_closure_evidence_freshness_review"',
    '"recovery_evidence_current"',
    '"authenticated_device_evidence_current"',
    '"closure_evidence_current_operator_review_required"',
    '"operator_review_freshness_required"',
    "recovery_and_authenticated_device_populations_joined: false",
    "current_negative_device_observation_retains_owning_hold: true",
    "production_restore_performed: false",
    "automatic_canonical_hold_narrowing_performed: false"
],"Build 530 helper")
require(endpoint,[
    "buildRecoveryAuthenticatedDeviceClosureEvidenceFreshnessReview",
    "recovery_authenticated_device_closure_freshness_build:530",
    'recovery_authenticated_device_closure_freshness_authority:"recovery_authenticated_device_closure_evidence_freshness_review"',
    '"X-Rosie-Recovery-Device-Closure-Freshness":"build-530-read-only"',
    "GET,HEAD,OPTIONS"
],"Build 530 endpoint")
for forbidden in ["onRequestPost","onRequestPatch","onRequestDelete","onRequestPut"]:
    if forbidden in endpoint:
        errors.append(f"Build 530 endpoint contains forbidden mutation handler {forbidden!r}")
require(consolidated,[
    "buildRecoveryAuthenticatedDeviceClosureEvidenceFreshnessReview",
    "recovery_authenticated_device_closure_evidence_freshness_review",
    "current_recovery_device_closure_freshness_authority"
],"Launch readiness Build 530 composition")
require(client,[
    "Build 530 closure evidence freshness",
    "closureFreshness.status",
    "recovery_evidence_freshness_review_required",
    "authenticated_device_evidence_freshness_review_required"
],"Launch readiness Build 530 client")
require(doc,[
    "# Build 530 — Recovery & Authenticated Device Closure Evidence Freshness Review",
    "closure_evidence_current_operator_review_required",
    "operator_review_freshness_required",
    "Build 531 — Maintenance & Fleet Continuation Evidence Freshness Review"
],"Build 530 contract")
require(roadmap,[
    "### Build 530 — Recovery & Authenticated Device Closure Evidence Freshness Review",
    "### Build 531 — Maintenance & Fleet Continuation Evidence Freshness Review",
    "Missing, stale, negative or unavailable evidence retains the owning HOLD"
],"renewed roadmap")
require(queue,[
    "**Build 530 — Recovery & Authenticated Device Closure Evidence Freshness Review** is the active bounded release.",
    "**Build 531 — Maintenance & Fleet Continuation Evidence Freshness Review** is next",
    "BUILD530_RECOVERY_AUTHENTICATED_DEVICE_CLOSURE_EVIDENCE_FRESHNESS_REVIEW.md",
    "it has not run out"
],"release queue")
require(handoff,[
    "**Build 530 — Recovery & Authenticated Device Closure Evidence Freshness Review** is the active bounded release.",
    "**Build 531 — Maintenance & Fleet Continuation Evidence Freshness Review** is next",
    "BUILD530_RECOVERY_AUTHENTICATED_DEVICE_CLOSURE_EVIDENCE_FRESHNESS_REVIEW.md",
    "recovery_authenticated_device_closure_evidence_freshness_review_check.py"
],"project handoff")
require(readme,[
    "Current source direction: **Build 530 — Recovery & Authenticated Device Closure Evidence Freshness Review**.",
    "BUILD530_RECOVERY_AUTHENTICATED_DEVICE_CLOSURE_EVIDENCE_FRESHNESS_REVIEW.md",
    "scripts/recovery_authenticated_device_closure_evidence_freshness_review_check.py",
    "Production is not considered GREEN from source promotion alone."
],"README")
require(blockers,[
    "Recovery / backup evidence",
    "Independent device / visual evidence",
    "Build 530",
    "freshness"
],"canonical HOLD backlog")
require(docindex,[
    "BUILD530_RECOVERY_AUTHENTICATED_DEVICE_CLOSURE_EVIDENCE_FRESHNESS_REVIEW.md",
    "current bounded release contract"
],"documentation index")
for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
        "python -m py_compile scripts/recovery_authenticated_device_closure_evidence_freshness_review_check.py",
        "node --check scripts/recovery_authenticated_device_closure_evidence_freshness_review_test.mjs",
        "node --check functions/api/_lib/recovery-authenticated-device-closure-evidence-freshness-review.js",
        "python scripts/recovery_authenticated_device_closure_evidence_freshness_review_check.py",
        "node scripts/recovery_authenticated_device_closure_evidence_freshness_review_test.mjs",
        "python scripts/inventory_stock_usage_public_catalog_check.py"
    ],label)
require(prodcheck,[
    '"recovery_authenticated_device_closure_evidence_freshness_review"',
    "scripts/recovery_authenticated_device_closure_evidence_freshness_review_check.py",
    "scripts/recovery_authenticated_device_closure_evidence_freshness_review_test.mjs",
    '"inventory_stock_usage_public_catalog"'
],"central Production acceptance")
require(workflow,[
    "Recovery & Authenticated Device Closure Evidence Freshness Review Authority",
    "python scripts/recovery_authenticated_device_closure_evidence_freshness_review_check.py",
    "node scripts/recovery_authenticated_device_closure_evidence_freshness_review_test.mjs",
    "python scripts/inventory_stock_usage_public_catalog_check.py",
    "Recovery/device populations: SEPARATE",
    "Production restore: NONE",
    "Automatic canonical HOLD narrowing: NONE"
],"Build 530 workflow")

for path in [
    "functions/api/_lib/recovery-authenticated-device-closure-evidence-freshness-review.js",
    "functions/api/admin/recovery_authenticated_device_closure_review.js",
    "functions/api/admin/launch_readiness_consolidated.js",
    "assets/launch-readiness-consolidation.js",
    "scripts/recovery_authenticated_device_closure_evidence_freshness_review_test.mjs"
]:
    proc=subprocess.run(["node","--check",path],cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        errors.append(f"{path} syntax failed: {proc.stderr.strip() or proc.stdout.strip()}")

if errors:
    print("BUILD 530 RECOVERY & AUTHENTICATED DEVICE CLOSURE EVIDENCE FRESHNESS REVIEW: FAIL")
    for error in errors:
        print(" -",error)
    sys.exit(1)

for command in [
    ["node","scripts/recovery_authenticated_device_closure_evidence_freshness_review_test.mjs"],
    ["node","scripts/recovery_authenticated_device_manual_closure_outcome_continuity_test.mjs"],
    ["node","scripts/recovery_authenticated_device_closure_review_test.mjs"],
    ["node","scripts/recovery_authenticated_device_observation_execution_evidence_test.mjs"],
    ["python","scripts/inventory_stock_usage_public_catalog_check.py"]
]:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 530 RECOVERY & AUTHENTICATED DEVICE CLOSURE EVIDENCE FRESHNESS REVIEW: FAIL")
        print(proc.stderr.strip() or proc.stdout.strip())
        sys.exit(proc.returncode)

print("BUILD 530 RECOVERY & AUTHENTICATED DEVICE CLOSURE EVIDENCE FRESHNESS REVIEW: PASS")
