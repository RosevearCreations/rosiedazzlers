#!/usr/bin/env python3
"""Current Production Learning & Roadmap Renewal authority for Build 475."""
from pathlib import Path
import re
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

contract=read("BUILD475_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md")
learning=read("PRODUCTION_LEARNING_466_474.md")
roadmap=read("FORWARD_BUILD_ROADMAP_476_485.md")
prior=read("BUILD465_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md")
prior_learning=read("PRODUCTION_LEARNING_456_464.md")
prior_roadmap=read("FORWARD_BUILD_ROADMAP_466_475.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/production-learning-roadmap-renewal-authority.yml")

require(contract,[
    "# Build 475 — Production Learning & Roadmap Renewal",
    "retained", "closed", "owner_action", "provider_dependent", "unavailable",
    "PRODUCTION_LEARNING_466_474.md", "FORWARD_BUILD_ROADMAP_476_485.md",
    "Missing evidence remains a blocker or truthful HOLD, never fabricated success.",
    "Build 476 — Provider HOLD Decision Traceability & Closure Review"
],"current renewal contract")
require(prior,[
    "# Build 465 — Production Learning & Roadmap Renewal",
    "PRODUCTION_LEARNING_456_464.md",
    "FORWARD_BUILD_ROADMAP_466_475.md"
],"retained prior renewal contract")
require(prior_learning,[
    "Production Learning Reconciliation 456–464",
    "FORWARD_BUILD_ROADMAP_466_475.md"
],"retained prior reconciliation")
require(prior_roadmap,[
    "Build 466 — Provider Outcome Review & HOLD Decision Readiness",
    "Build 475 — Production Learning & Roadmap Renewal"
],"retained prior roadmap")

require(learning,[
    "Provider Outcome Review & HOLD Decision Readiness",
    "provider_dependent",
    "Recovery Evidence Validation & Drill Decision Readiness",
    "owner_action",
    "Authenticated Device Regression Closure",
    "Maintenance & Fleet Controlled Pilot Activation Readiness",
    "Local Search Provider Window & Attribution Closure",
    "Booking & Quote Controlled Experiment Framework",
    "Staff & Mobile Remediation Verification",
    "retained",
    "Service Economics Allocation & Margin Review Readiness",
    "Reliability, Cost & Resilience Trend Review",
    "awaiting_business_approval",
    "payment/refund/message-delivery provider outcomes",
    "backup / recovery artifact and bounded drill evidence",
    "authenticated real-device / visual regression evidence",
    "FORWARD_BUILD_ROADMAP_476_485.md"
],"cycle reconciliation")

roadmap_titles=[
    "Build 476 — Provider HOLD Decision Traceability & Closure Review",
    "Build 477 — Recovery Drill Evidence Refresh & Closure Review",
    "Build 478 — Authenticated Device Observation Refresh & Regression Triage",
    "Build 479 — Maintenance & Fleet Owner Approval & Pilot Decision",
    "Build 480 — Local Search Provider Snapshot Continuity & Descriptive Review",
    "Build 481 — Booking & Quote Experiment Approval & Measurement Lock",
    "Build 482 — Staff & Mobile Remediation Execution Evidence Readiness",
    "Build 483 — Service & Add-On Allocation Evidence Closure",
    "Build 484 — Reliability, Cost & Recovery Evidence Continuity",
    "Build 485 — Production Learning & Roadmap Renewal",
]
for title in roadmap_titles:
    require(roadmap,[title],"renewed roadmap")

require(blockers,[
    "Provider outcomes & communications",
    "Local-search provider evidence",
    "Recovery / backup evidence",
    "Independent device / visual evidence",
    "Maintenance / fleet business approval",
    "Evidence source unavailable",
    "PRODUCTION_LEARNING_466_474.md",
    "FORWARD_BUILD_ROADMAP_476_485.md",
    "BUILD475_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md"
],"canonical HOLD backlog")
require(queue,[
    "BUILD475_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md",
    "PRODUCTION_LEARNING_466_474.md",
    "FORWARD_BUILD_ROADMAP_476_485.md",
    "BUILD476_PROVIDER_HOLD_DECISION_TRACEABILITY_CLOSURE_REVIEW.md",
    "STARTUP_GO_LIVE_BLOCKERS.md",
    "rd main protection",
    "Production deployment/runtime/business acceptance",
    "Missing required checks or exact Production runtime/deployment identity are blockers"
],"release queue Build 475 retained authority")
require(handoff,[
    "BUILD475_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md",
    "PRODUCTION_LEARNING_466_474.md",
    "FORWARD_BUILD_ROADMAP_476_485.md",
    "STARTUP_GO_LIVE_BLOCKERS.md",
    "Production deployment/runtime/business acceptance must independently prove that exact SHA."
],"project handoff")
require(readme,[
    "BUILD475_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md",
    "PRODUCTION_LEARNING_466_474.md",
    "FORWARD_BUILD_ROADMAP_476_485.md",
    "python scripts/production_learning_roadmap_renewal_check.py",
    "Production is not considered GREEN from source promotion alone."
],"README")
for text,label in [(dev,"Development source gate"),(prod,"Production authority")]:
    require(text,["python scripts/production_learning_roadmap_renewal_check.py"],label)
require(prodcheck,[
    "production_learning_roadmap_renewal",
    "scripts/production_learning_roadmap_renewal_check.py",
    "Validate Production learning & roadmap renewal authority"
],"Production business acceptance source authority")
require(workflow,[
    "name: Production Learning & Roadmap Renewal Authority",
    "Completed-cycle 466–474 evidence reconciliation: PASS",
    "Roadmap 476–485 renewal: PASS",
    "python scripts/production_learning_roadmap_renewal_check.py"
],"renewal workflow")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])475(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 475 must not introduce a schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("PRODUCTION LEARNING & ROADMAP RENEWAL AUTHORITY: FAIL")
    for e in errors:
        print(" -",e)
    sys.exit(1)

print("PRODUCTION LEARNING & ROADMAP RENEWAL AUTHORITY: PASS")
print(" - 466–474 concerns are reconciled without fabricating provider/owner/device/recovery evidence")
print(" - canonical HOLD inventory remains current and singular")
print(" - renewed roadmap 476–485 is present and evidence-driven")
print(" - next cycle advances retained decision/evidence workflows without replacement systems")
print(" - no schema, provider, customer, pricing, staff, accounting, inventory, experiment, fleet, recovery or destructive-storage mutation is authorized")
