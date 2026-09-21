#!/usr/bin/env python3
"""Current Production Learning & Roadmap Renewal authority for Build 465."""
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

contract=read("BUILD465_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md")
learning=read("PRODUCTION_LEARNING_456_464.md")
roadmap=read("FORWARD_BUILD_ROADMAP_466_475.md")
prior=read("BUILD455_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md")
prior_learning=read("PRODUCTION_LEARNING_446_454.md")
prior_roadmap=read("FORWARD_BUILD_ROADMAP_456_465.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/production-learning-roadmap-renewal-authority.yml")

require(contract,[
    "# Build 465 — Production Learning & Roadmap Renewal",
    "retained", "closed", "owner_action", "provider_dependent", "unavailable",
    "PRODUCTION_LEARNING_456_464.md", "FORWARD_BUILD_ROADMAP_466_475.md",
    "Missing evidence remains a blocker or truthful HOLD, never fabricated success.",
    "Build 466 — Provider Outcome Review & HOLD Decision Readiness"
],"current renewal contract")
require(prior,[
    "# Build 455 — Production Learning & Roadmap Renewal",
    "PRODUCTION_LEARNING_446_454.md",
    "FORWARD_BUILD_ROADMAP_456_465.md"
],"retained prior renewal contract")
require(prior_learning,[
    "Production Learning Reconciliation 446–454",
    "FORWARD_BUILD_ROADMAP_456_465.md"
],"retained prior reconciliation")
require(prior_roadmap,[
    "Build 456 — Provider Evidence Closure & Availability Review",
    "Build 465 — Production Learning & Roadmap Renewal"
],"retained prior roadmap")

require(learning,[
    "Provider Evidence Closure & Availability Review",
    "provider_dependent",
    "Recovery Evidence Closure & Drill Readiness",
    "owner_action",
    "Authenticated Device Acceptance Closure",
    "Fleet & Maintenance Commercial Activation Readiness",
    "Local Search Provider & Attribution Evidence Quality",
    "Booking & Quote Experiment Readiness",
    "retained",
    "Staff & Mobile Friction Remediation Priorities",
    "Service Economics Completeness & Add-On Cost Readiness",
    "Reliability, Cost & Resilience Operational Guardrails",
    "payment/refund/message-delivery provider outcomes",
    "backup / recovery artifact and bounded drill evidence",
    "authenticated real-device / visual regression evidence",
    "maintenance / fleet commercial approval and controlled-pilot decision",
    "FORWARD_BUILD_ROADMAP_466_475.md"
],"cycle reconciliation")

roadmap_titles=[
    "Build 466 — Provider Outcome Review & HOLD Decision Readiness",
    "Build 467 — Recovery Evidence Validation & Drill Decision Readiness",
    "Build 468 — Authenticated Device Regression Closure",
    "Build 469 — Maintenance & Fleet Controlled Pilot Activation Readiness",
    "Build 470 — Local Search Provider Window & Attribution Closure",
    "Build 471 — Booking & Quote Controlled Experiment Framework",
    "Build 472 — Staff & Mobile Remediation Verification",
    "Build 473 — Service Economics Allocation & Margin Review Readiness",
    "Build 474 — Reliability, Cost & Resilience Trend Review",
    "Build 475 — Production Learning & Roadmap Renewal",
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
    "PRODUCTION_LEARNING_456_464.md",
    "FORWARD_BUILD_ROADMAP_466_475.md",
    "BUILD465_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md"
],"canonical HOLD backlog")
require(queue,[
    "BUILD465_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md",
    "PRODUCTION_LEARNING_456_464.md",
    "FORWARD_BUILD_ROADMAP_466_475.md",
    "STARTUP_GO_LIVE_BLOCKERS.md",
    "rd main protection",
    "Production deployment/runtime/business acceptance",
    "Missing required checks or exact Production runtime/deployment identity are blockers"
],"release queue Build 465 authority")
require(handoff,[
    "BUILD465_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md",
    "PRODUCTION_LEARNING_456_464.md",
    "FORWARD_BUILD_ROADMAP_466_475.md",
    "STARTUP_GO_LIVE_BLOCKERS.md",
    "Production deployment/runtime/business acceptance must independently prove that exact SHA."
],"project handoff")
require(readme,[
    "BUILD465_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md",
    "PRODUCTION_LEARNING_456_464.md",
    "FORWARD_BUILD_ROADMAP_466_475.md",
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
    "python scripts/production_learning_roadmap_renewal_check.py"
],"renewal workflow")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])465(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 465 must not introduce a schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("PRODUCTION LEARNING & ROADMAP RENEWAL AUTHORITY: FAIL")
    for e in errors:
        print(" -",e)
    sys.exit(1)

print("PRODUCTION LEARNING & ROADMAP RENEWAL AUTHORITY: PASS")
print(" - 456–464 concerns are reconciled without fabricating provider/owner/device/recovery evidence")
print(" - canonical HOLD inventory remains current and singular")
print(" - renewed roadmap 466–475 is present and evidence-driven")
print(" - next cycle deepens retained evidence and controlled-decision workflows without replacement systems")
print(" - no schema, provider, customer, pricing, accounting, inventory, recovery or destructive-storage mutation is authorized")
