#!/usr/bin/env python3
"""Build 466 Provider Outcome Review & HOLD Decision Readiness authority."""
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

helper=read("functions/api/_lib/provider-outcome-review-hold-decision-readiness.js")
endpoint=read("functions/api/admin/provider_evidence_reconciliation_refresh.js")
launch=read("functions/api/admin/launch_readiness_consolidated.js")
asset=read("assets/launch-readiness-consolidation.js")
contract=read("BUILD466_PROVIDER_OUTCOME_REVIEW_HOLD_DECISION_READINESS.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
roadmap=read("FORWARD_BUILD_ROADMAP_466_475.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
workflow=read(".github/workflows/provider-outcome-review-hold-decision-readiness-authority.yml")

require(helper,[
    "provider_outcome_review_hold_decision_readiness",
    "operator_hold_decision_ready",
    "aging_evidence_review_required",
    "revalidate_before_hold_decision",
    "retain_hold_missing_evidence",
    "retain_hold_unavailable_source",
    "default_if_no_operator_action: \"retain_hold\"",
    "narrowing_review_eligible",
    "permitted_operator_actions",
    "canonical_hold_mutated: false",
    "payment_or_refund_mutation_performed: false",
    "permanent_polling: false"
],"Build 466 helper")
require(endpoint,[
    "buildProviderOutcomeReviewHoldDecisionReadiness",
    "current_hold_decision_build: 466",
    "current_hold_decision_authority: \"provider_outcome_review_hold_decision_readiness\"",
    "hold_decision_readiness: holdDecisionReadiness",
    "build:446","GET, HEAD, OPTIONS"
],"retained provider reconciliation endpoint")
for forbidden in ["onRequestPost","onRequestPut","onRequestPatch","onRequestDelete"]:
    if forbidden in endpoint:
        errors.append(f"retained provider endpoint contains forbidden mutation token {forbidden!r}")
require(launch,[
    "buildProviderOutcomeReviewHoldDecisionReadiness",
    "provider_outcome_review_hold_decision_readiness: providerOutcomeReviewHoldDecisionReadiness",
    "current_provider_hold_decision_authority"
],"Launch Readiness composition")
require(asset,[
    "provider_outcome_review_hold_decision_readiness",
    "Decision readiness","Narrowing review","Operator HOLD decision","Default without operator action"
],"Launch Readiness provider panel")
require(contract,[
    "# Build 466 — Provider Outcome Review & HOLD Decision Readiness",
    "/api/admin/provider_evidence_reconciliation_refresh",
    "operator_hold_decision_ready","retain_hold",
    "Build 467 — Recovery Evidence Validation & Drill Decision Readiness"
],"Build 466 contract")
require(blockers,[
    "Provider outcomes & communications","Build 466","operator HOLD-decision package",
    "operator_hold_decision_ready","retain_hold"
],"canonical HOLD backlog")
require(queue,[
    "BUILD466_PROVIDER_OUTCOME_REVIEW_HOLD_DECISION_READINESS.md",
    "Production deployment/runtime/business acceptance"
],"retained release queue Build 466 authority")
require(handoff,[
    "BUILD466_PROVIDER_OUTCOME_REVIEW_HOLD_DECISION_READINESS.md",
    "provider_outcome_review_hold_decision_readiness_check.py"
],"retained project handoff")
require(readme,[
    "BUILD466_PROVIDER_OUTCOME_REVIEW_HOLD_DECISION_READINESS.md",
    "provider_outcome_review_hold_decision_readiness_check.py"
],"retained README")
require(roadmap,[
    "Build 466 — Provider Outcome Review & HOLD Decision Readiness",
    "Build 467 — Recovery Evidence Validation & Drill Decision Readiness"
],"renewed roadmap")
for text,label in [(dev,"Development source gate"),(prod,"Production business acceptance")]:
    require(text,[
        "provider_outcome_review_hold_decision_readiness_check.py",
        "provider_outcome_review_hold_decision_readiness_test.mjs",
        "provider-outcome-review-hold-decision-readiness.js"
    ],label)
require(workflow,[
    "Build 466 — Provider Outcome Review & HOLD Decision Readiness Authority",
    "provider-outcome-review-hold-decision-readiness",
    "provider_outcome_review_hold_decision_readiness_check.py"
],"focused workflow")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])466(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 466 must not introduce a schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

for p in [
    "functions/api/_lib/provider-outcome-review-hold-decision-readiness.js",
    "functions/api/admin/provider_evidence_reconciliation_refresh.js",
    "functions/api/admin/launch_readiness_consolidated.js",
    "assets/launch-readiness-consolidation.js",
    "scripts/provider_outcome_review_hold_decision_readiness_test.mjs"
]:
    r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
    if r.returncode:
        errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")

for cmd in [
    ["node","scripts/provider_outcome_review_hold_decision_readiness_test.mjs"],
    ["python","scripts/provider_evidence_closure_availability_review_check.py"],
    ["node","scripts/provider_evidence_closure_availability_review_test.mjs"],
    ["python","scripts/provider_evidence_reconciliation_refresh_check.py"],
    ["node","scripts/provider_evidence_reconciliation_refresh_test.mjs"],
    ["python","scripts/provider_outcome_delivery_evidence_closure_check.py"],
    ["node","scripts/provider_outcome_delivery_evidence_closure_test.mjs"]
]:
    r=subprocess.run(cmd,cwd=ROOT,text=True,capture_output=True)
    if r.returncode:
        errors.append(f"retained authority failed: {' '.join(cmd)}: {r.stderr.strip() or r.stdout.strip()}")

if errors:
    print("PROVIDER OUTCOME REVIEW & HOLD DECISION READINESS AUTHORITY: FAIL")
    for e in errors:
        print(" -",e)
    sys.exit(1)

print("PROVIDER OUTCOME REVIEW & HOLD DECISION READINESS AUTHORITY: PASS")
print(" - provider outcome/delivery/freshness/source evidence converges into one operator decision package")
print(" - narrowing review requires complete current provider evidence")
print(" - aging/stale/missing/undated/unavailable evidence fails closed to retain-HOLD states")
print(" - canonical HOLD mutation remains operator-controlled")
