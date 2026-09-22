#!/usr/bin/env python3
"""Build 476 Provider HOLD Decision Traceability & Closure Review authority."""
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

helper=read("functions/api/_lib/provider-hold-decision-traceability-closure-review.js")
endpoint=read("functions/api/admin/provider_evidence_reconciliation_refresh.js")
launch=read("functions/api/admin/launch_readiness_consolidated.js")
asset=read("assets/launch-readiness-consolidation.js")
contract=read("BUILD476_PROVIDER_HOLD_DECISION_TRACEABILITY_CLOSURE_REVIEW.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/provider-hold-decision-traceability-closure-review-authority.yml")

require(helper,[
    "provider_hold_decision_traceability_closure_review",
    "current_complete","aging_review_required","revalidation_required",
    "incomplete_missing_or_invalid_date","unavailable_source",
    "operator_review_not_recorded","operator_review_trace_mismatch",
    "retain_hold_operator_review_required",
    "closure_review_ready_for_manual_hold_update",
    'default_if_no_operator_action: "retain_hold"',
    "operator_review_record_persisted: false",
    "canonical_hold_mutated: false",
    "schema_or_storage_mutated: false",
    "permanent_polling: false"
],"Build 476 helper")
require(endpoint,[
    "buildProviderHoldDecisionTraceabilityClosureReview",
    "current_hold_traceability_build: 476",
    'current_hold_traceability_authority: "provider_hold_decision_traceability_closure_review"',
    "hold_decision_traceability_closure_review",
    "operator_review: null",
    "GET, HEAD, OPTIONS"
],"retained provider endpoint")
for forbidden in ["onRequestPost","onRequestPut","onRequestPatch","onRequestDelete","STRIPE_SECRET_KEY","PAYPAL_CLIENT_SECRET"]:
    if forbidden in endpoint:
        errors.append(f"retained provider endpoint contains forbidden mutation/secret token {forbidden!r}")
require(launch,[
    "buildProviderHoldDecisionTraceabilityClosureReview",
    "provider_hold_decision_traceability_closure_review: providerHoldDecisionTraceabilityClosureReview",
    'current_provider_hold_traceability_authority: "provider_hold_decision_traceability_closure_review"',
    "operator_review: null"
],"Launch Readiness composition")
require(asset,[
    "provider_hold_decision_traceability_closure_review",
    "Date continuity","Operator review trace","Build 476 closure review",
    "Evidence trace key","Manual HOLD update candidate"
],"Launch Readiness provider panel")
require(contract,[
    "# Build 476 — Provider HOLD Decision Traceability & Closure Review",
    "evidence_trace_key","operator_review_not_recorded",
    "closure_review_ready_for_manual_hold_update",
    "Build 477 — Recovery Drill Evidence Refresh & Closure Review"
],"Build 476 contract")
require(blockers,[
    "Provider outcomes & communications",
    "Build 476",
    "evidence trace",
    "operator review",
    "manual update"
],"canonical HOLD backlog")
require(queue,[
    "BUILD476_PROVIDER_HOLD_DECISION_TRACEABILITY_CLOSURE_REVIEW.md",
    "FORWARD_BUILD_ROADMAP_476_485.md",
    "Production deployment/runtime/business acceptance",
    "it has not run out"
],"current release queue retained authority")
require(handoff,[
    "BUILD476_PROVIDER_HOLD_DECISION_TRACEABILITY_CLOSURE_REVIEW.md",
    "provider-hold-decision-traceability-closure-review-authority.yml",
    "provider_hold_decision_traceability_closure_review_check.py",
    "Production deployment/runtime/business acceptance must independently prove that exact SHA."
],"project handoff")
require(readme,[
    "BUILD476_PROVIDER_HOLD_DECISION_TRACEABILITY_CLOSURE_REVIEW.md",
    "provider_hold_decision_traceability_closure_review_check.py",
    "Production is not considered GREEN from source promotion alone."
],"README")
for text,label in [(dev,"Development source gate"),(prod,"Production business acceptance")]:
    require(text,[
        "provider_hold_decision_traceability_closure_review_check.py",
        "provider_hold_decision_traceability_closure_review_test.mjs",
        "provider-hold-decision-traceability-closure-review.js"
    ],label)
require(prodcheck,[
    '"provider_hold_decision_traceability_closure_review"',
    "scripts/provider_hold_decision_traceability_closure_review_check.py",
    "scripts/provider_hold_decision_traceability_closure_review_test.mjs",
    "Validate provider HOLD decision traceability & closure review authority"
],"Production business acceptance source authority")
require(workflow,[
    "Build 476 — Provider HOLD Decision Traceability & Closure Review Authority",
    "provider-hold-decision-traceability-closure-review",
    "provider_hold_decision_traceability_closure_review_check.py"
],"focused workflow")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])476(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 476 must not introduce a schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

for p in [
    "functions/api/_lib/provider-hold-decision-traceability-closure-review.js",
    "functions/api/admin/provider_evidence_reconciliation_refresh.js",
    "functions/api/admin/launch_readiness_consolidated.js",
    "assets/launch-readiness-consolidation.js",
    "scripts/provider_hold_decision_traceability_closure_review_test.mjs"
]:
    r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
    if r.returncode:
        errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")

for cmd in [
    ["node","scripts/provider_hold_decision_traceability_closure_review_test.mjs"],
    ["python","scripts/provider_outcome_review_hold_decision_readiness_check.py"],
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
    print("PROVIDER HOLD DECISION TRACEABILITY & CLOSURE REVIEW AUTHORITY: FAIL")
    for e in errors:
        print(" -",e)
    sys.exit(1)

print("PROVIDER HOLD DECISION TRACEABILITY & CLOSURE REVIEW AUTHORITY: PASS")
print(" - evidence-date continuity and deterministic evidence trace keys are explicit")
print(" - operator review must match the exact retained evidence snapshot")
print(" - missing/unmatched operator review remains retain_hold")
print(" - closure-review readiness still requires a separate manual canonical-HOLD update")
print(" - no provider/schema/storage/business mutation, operator-review persistence or permanent polling")
