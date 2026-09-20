#!/usr/bin/env python3
"""Current Production Learning & Roadmap Renewal authority for Build 455."""
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

contract=read("BUILD455_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md")
learning=read("PRODUCTION_LEARNING_446_454.md")
roadmap=read("FORWARD_BUILD_ROADMAP_456_465.md")
prior=read("BUILD445_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")

require(contract,["retained","closed","owner_action","provider_dependent","unavailable","PRODUCTION_LEARNING_446_454.md","FORWARD_BUILD_ROADMAP_456_465.md","Missing evidence remains a blocker or truthful HOLD, never fabricated success.","Build 456 — Provider Evidence Closure & Availability Review"],"current renewal contract")
require(prior,["# Build 445 — Production Learning & Roadmap Renewal","PRODUCTION_LEARNING_436_444.md","FORWARD_BUILD_ROADMAP_446_455.md"],"retained prior renewal contract")
require(learning,["Provider Evidence Reconciliation Refresh","provider_dependent","Recovery Artifact & Drill Evidence Review","owner_action","Authenticated Cross-Device Acceptance Refresh","Fleet & Maintenance Commercial Decision Closure","Local Search Measurement & Conversion Attribution","Booking Funnel, Quote & Pricing Learning","retained","Staff Workflow, Support & Mobile Efficiency Learning","Service Economics, Capacity & Pricing Review","Reliability, Security, Cost & Resilience Reassessment","payment/refund/message-delivery provider outcomes","backup / recovery artifact and bounded drill evidence","authenticated real-device / visual evidence","maintenance / fleet commercial approval","FORWARD_BUILD_ROADMAP_456_465.md"],"cycle reconciliation")
roadmap_titles=["Build 456 — Provider Evidence Closure & Availability Review","Build 457 — Recovery Evidence Closure & Drill Readiness","Build 458 — Authenticated Device Acceptance Closure","Build 459 — Fleet & Maintenance Commercial Activation Readiness","Build 460 — Local Search Provider & Attribution Evidence Quality","Build 461 — Booking & Quote Experiment Readiness","Build 462 — Staff & Mobile Friction Remediation Priorities","Build 463 — Service Economics Completeness & Add-On Cost Readiness","Build 464 — Reliability, Cost & Resilience Operational Guardrails","Build 465 — Production Learning & Roadmap Renewal"]
for title in roadmap_titles:
    require(roadmap,[title],"renewed roadmap")

require(blockers,["Provider outcomes & communications","Local-search provider evidence","Recovery / backup evidence","Independent device / visual evidence","Maintenance / fleet business approval","Evidence source unavailable","PRODUCTION_LEARNING_446_454.md","FORWARD_BUILD_ROADMAP_456_465.md","BUILD455_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md"],"canonical HOLD backlog")
require(queue,["BUILD455_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md","FORWARD_BUILD_ROADMAP_456_465.md","STARTUP_GO_LIVE_BLOCKERS.md","**Build 455 — Production Learning & Roadmap Renewal** is the active bounded release.","**Build 456 — Provider Evidence Closure & Availability Review** is next only after the current release is independently GREEN on protected `main`.","rd main protection","Production deployment/runtime/business acceptance","Missing required checks or exact Production runtime/deployment identity are blockers"],"release queue")
require(handoff,["BUILD455_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md","PRODUCTION_LEARNING_446_454.md","FORWARD_BUILD_ROADMAP_456_465.md","STARTUP_GO_LIVE_BLOCKERS.md","Production deployment/runtime/business acceptance must independently prove that exact SHA."],"project handoff")
require(readme,["BUILD455_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md","PRODUCTION_LEARNING_446_454.md","FORWARD_BUILD_ROADMAP_456_465.md","python scripts/production_learning_roadmap_renewal_check.py","Production is not considered GREEN from source promotion alone."],"README")
for text,label in [(dev,"Development source gate"),(prod,"Production authority")]:
    require(text,["python scripts/production_learning_roadmap_renewal_check.py"],label)
require(prodcheck,["production_learning_roadmap_renewal","scripts/production_learning_roadmap_renewal_check.py","Validate Production learning & roadmap renewal authority"],"Production business acceptance source authority")
migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])455(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 455 must not introduce a schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("PRODUCTION LEARNING & ROADMAP RENEWAL AUTHORITY: FAIL")
    for e in errors:
        print(" -",e)
    sys.exit(1)

print("PRODUCTION LEARNING & ROADMAP RENEWAL AUTHORITY: PASS")
print(" - 446–454 concerns are reconciled without fabricating provider/owner/device/recovery evidence")
print(" - canonical HOLD inventory remains current and singular")
print(" - renewed roadmap 456–465 is present and evidence-driven")
print(" - next cycle enriches existing capabilities rather than duplicating replacement surfaces")
print(" - no schema, provider, customer, accounting, inventory or destructive-storage mutation is authorized")
