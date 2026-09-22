#!/usr/bin/env python3
"""Build 456 Provider Evidence Closure & Availability Review authority."""
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

helper=read("functions/api/_lib/provider-evidence-closure-availability-review.js")
endpoint=read("functions/api/admin/provider_evidence_reconciliation_refresh.js")
launch=read("functions/api/admin/launch_readiness_consolidated.js")
asset=read("assets/launch-readiness-consolidation.js")
contract=read("BUILD456_PROVIDER_EVIDENCE_CLOSURE_AVAILABILITY_REVIEW.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
workflow=read(".github/workflows/provider-evidence-closure-availability-review-authority.yml")

require(helper,[
    "provider_evidence_closure_availability_review","source_availability","evidence_freshness",
    "closure_candidate_review","operator_review_ready","aging_review_required",
    "stale_revalidation_required","not_candidate_unavailable_source",
    "backlog_mutated: false","provider_contact_performed: false","permanent_polling: false"
],"Build 456 helper")
require(endpoint,[
    "buildProviderEvidenceClosureAvailabilityReview","closure_availability_review",
    "provider_evidence_closure_availability_review","build:446","GET, HEAD, OPTIONS"
],"retained provider endpoint")
for forbidden in ["onRequestPost","onRequestPut","onRequestPatch","onRequestDelete","STRIPE_SECRET_KEY","PAYPAL_CLIENT_SECRET"]:
    if forbidden in endpoint:
        errors.append(f"retained provider endpoint contains forbidden token {forbidden!r}")
require(launch,[
    "buildProviderEvidenceClosureAvailabilityReview",
    "provider_evidence_closure_availability_review: providerEvidenceClosureAvailabilityReview",
    "current_provider_availability_review_authority"
],"Launch Readiness composition")
require(asset,[
    "provider_evidence_closure_availability_review","Sources available","Closure review","Closure candidate"
],"Launch Readiness provider panel")
require(contract,[
    "# Build 456 — Provider Evidence Closure & Availability Review",
    "/api/admin/provider_evidence_reconciliation_refresh",
    "operator_review_ready","Build 457 — Recovery Evidence Closure & Drill Readiness"
],"Build 456 contract")
require(blockers,[
    "Provider outcomes & communications","Build 456","closure-candidate","source availability"
],"canonical HOLD backlog")
require(queue,[
    "BUILD456_PROVIDER_EVIDENCE_CLOSURE_AVAILABILITY_REVIEW.md",
    "Production deployment/runtime/business acceptance"
],"release queue retained Build 456 authority")
require(handoff,[
    "BUILD456_PROVIDER_EVIDENCE_CLOSURE_AVAILABILITY_REVIEW.md",
    "provider_evidence_closure_availability_review_check.py"
],"project handoff retained Build 456 authority")
require(readme,[
    "BUILD456_PROVIDER_EVIDENCE_CLOSURE_AVAILABILITY_REVIEW.md",
    "Production is not considered GREEN from source promotion alone."
],"README retained Build 456 authority")
for text,label in [(dev,"Development source gate"),(prod,"Production business acceptance")]:
    require(text,[
        "provider_evidence_closure_availability_review_check.py",
        "provider_evidence_closure_availability_review_test.mjs",
        "provider-evidence-closure-availability-review.js"
    ],label)
require(workflow,[
    "Build 456 — Provider Evidence Closure & Availability Review Authority",
    "provider-evidence-closure-availability-review",
    "provider_evidence_closure_availability_review_check.py"
],"focused workflow")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])456(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 456 must not introduce a schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

for p in [
    "functions/api/_lib/provider-evidence-closure-availability-review.js",
    "functions/api/admin/provider_evidence_reconciliation_refresh.js",
    "functions/api/admin/launch_readiness_consolidated.js",
    "assets/launch-readiness-consolidation.js",
    "scripts/provider_evidence_closure_availability_review_test.mjs"
]:
    r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
    if r.returncode:
        errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")

for cmd in [
    ["node","scripts/provider_evidence_closure_availability_review_test.mjs"],
    ["python","scripts/provider_evidence_reconciliation_refresh_check.py"],
    ["node","scripts/provider_evidence_reconciliation_refresh_test.mjs"],
    ["python","scripts/provider_outcome_delivery_evidence_closure_check.py"]
]:
    r=subprocess.run(cmd,cwd=ROOT,text=True,capture_output=True)
    if r.returncode:
        errors.append(f"retained authority failed: {' '.join(cmd)}: {r.stderr.strip() or r.stdout.strip()}")

if errors:
    print("PROVIDER EVIDENCE CLOSURE & AVAILABILITY REVIEW AUTHORITY: FAIL")
    for e in errors:
        print(" -",e)
    sys.exit(1)

print("PROVIDER EVIDENCE CLOSURE & AVAILABILITY REVIEW AUTHORITY: PASS")
print(" - retained provider evidence now has explicit source-availability and closure-candidate review")
print(" - aging/stale/missing/unavailable evidence stays distinct and fail-closed")
print(" - operator review remains mandatory before canonical HOLD narrowing")
print(" - no synthetic provider activity, schema mutation or permanent polling is introduced")
