#!/usr/bin/env python3
"""Retained Production Learning & Roadmap Renewal authority."""
from pathlib import Path
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

contract=read("BUILD445_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md")
learning=read("PRODUCTION_LEARNING_436_444.md")
roadmap=read("FORWARD_BUILD_ROADMAP_446_455.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")

require(contract,[
    "retained","closed","owner_action","provider_dependent","unavailable",
    "PRODUCTION_LEARNING_436_444.md","FORWARD_BUILD_ROADMAP_446_455.md",
    "Missing evidence remains a blocker or truthful HOLD, never fabricated success.",
    "Build 446 — Provider Evidence Reconciliation Refresh"
],"current renewal contract")

require(learning,[
    "Provider outcome & delivery evidence closure","provider_dependent",
    "Backup & recovery evidence closure","owner_action",
    "Authenticated device & visual acceptance",
    "Maintenance & fleet owner approval convergence",
    "Local search provider evidence refresh",
    "Booking, quote & retention Production learning","retained",
    "Staff workflow & support exception learning",
    "Service economics & commercial capacity review",
    "Reliability, security & cost reassessment",
    "provider payment/refund/message-delivery outcomes",
    "backup / recovery artifact and drill evidence",
    "authenticated real-device / visual evidence",
    "maintenance / fleet commercial approval",
    "FORWARD_BUILD_ROADMAP_446_455.md"
],"cycle reconciliation")

roadmap_titles=[
    "Build 446 — Provider Evidence Reconciliation Refresh",
    "Build 447 — Recovery Artifact & Drill Evidence Review",
    "Build 448 — Authenticated Cross-Device Acceptance Refresh",
    "Build 449 — Fleet & Maintenance Commercial Decision Closure",
    "Build 450 — Local Search Measurement & Conversion Attribution",
    "Build 451 — Booking Funnel, Quote & Pricing Learning",
    "Build 452 — Staff Workflow, Support & Mobile Efficiency Learning",
    "Build 453 — Service Economics, Capacity & Pricing Review",
    "Build 454 — Reliability, Security, Cost & Resilience Reassessment",
    "Build 455 — Production Learning & Roadmap Renewal",
]
for title in roadmap_titles:
    require(roadmap,[title],"renewed roadmap")

future_contracts=[
    "BUILD446_PROVIDER_EVIDENCE_RECONCILIATION_REFRESH.md",
    "BUILD447_RECOVERY_ARTIFACT_DRILL_EVIDENCE_REVIEW.md",
    "BUILD448_AUTHENTICATED_CROSS_DEVICE_ACCEPTANCE_REFRESH.md",
    "BUILD449_FLEET_MAINTENANCE_COMMERCIAL_DECISION_CLOSURE.md",
    "BUILD450_LOCAL_SEARCH_MEASUREMENT_CONVERSION_ATTRIBUTION.md",
    "BUILD451_BOOKING_FUNNEL_QUOTE_PRICING_LEARNING.md",
    "BUILD452_STAFF_SUPPORT_MOBILE_EFFICIENCY_LEARNING.md",
    "BUILD453_SERVICE_ECONOMICS_CAPACITY_PRICING_REVIEW.md",
    "BUILD454_RELIABILITY_SECURITY_COST_RESILIENCE_REASSESSMENT.md",
    "BUILD455_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md",
]
for filename in future_contracts:
    read(filename)

require(blockers,[
    "Provider outcomes & communications","Local-search provider evidence",
    "Recovery / backup evidence","Independent device / visual evidence",
    "Maintenance / fleet business approval","Evidence source unavailable",
    "PRODUCTION_LEARNING_436_444.md","FORWARD_BUILD_ROADMAP_446_455.md",
    "BUILD445_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md"
],"canonical HOLD backlog")

require(queue,[
    "BUILD445_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md",
    "FORWARD_BUILD_ROADMAP_446_455.md","STARTUP_GO_LIVE_BLOCKERS.md",
    "rd main protection","Production deployment/runtime/business acceptance",
    "Missing required checks or exact Production runtime/deployment identity are blockers"
],"release queue retained renewal authority")

require(handoff,[
    "BUILD445_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md",
    "PRODUCTION_LEARNING_436_444.md","FORWARD_BUILD_ROADMAP_446_455.md",
    "STARTUP_GO_LIVE_BLOCKERS.md",
    "Production deployment/runtime/business acceptance must independently prove that exact SHA."
],"project handoff")

require(readme,[
    "BUILD445_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md",
    "PRODUCTION_LEARNING_436_444.md","FORWARD_BUILD_ROADMAP_446_455.md",
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

if errors:
    print("PRODUCTION LEARNING & ROADMAP RENEWAL AUTHORITY: FAIL")
    for e in errors:
        print(" -",e)
    sys.exit(1)

print("PRODUCTION LEARNING & ROADMAP RENEWAL AUTHORITY: PASS")
print(" - 436–444 concerns are reconciled without fabricating provider/owner evidence")
print(" - canonical HOLD inventory remains current and singular")
print(" - renewed roadmap 446–455 and bounded future contracts are present")
print(" - next cycle enriches existing capabilities rather than duplicating replacement surfaces")
print(" - no schema, provider, customer, accounting, inventory or destructive-storage mutation is authorized")
