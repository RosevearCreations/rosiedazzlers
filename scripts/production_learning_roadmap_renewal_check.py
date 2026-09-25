#!/usr/bin/env python3
"""Current Production Learning & Roadmap Renewal authority for Build 495."""
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

contract=read("BUILD495_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md")
learning=read("PRODUCTION_LEARNING_486_494.md")
roadmap=read("FORWARD_BUILD_ROADMAP_496_505.md")
prior=read("BUILD485_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md")
prior_learning=read("PRODUCTION_LEARNING_476_484.md")
prior_roadmap=read("FORWARD_BUILD_ROADMAP_486_495.md")
b494=read("BUILD494_SERVICE_ECONOMICS_SEASONAL_OPERATIONS_RELIABILITY_REVIEW.md")
b493=read("BUILD493_STAFF_MOBILE_REMEDIATION_OUTCOME_EVIDENCE.md")
b492=read("BUILD492_BOOKING_QUOTE_CONTROLLED_EXPERIMENT_EXECUTION_EVIDENCE.md")
b491=read("BUILD491_MAINTENANCE_FLEET_PILOT_OUTCOME_EVIDENCE.md")
b490=read("BUILD490_RECOVERY_AUTHENTICATED_DEVICE_EVIDENCE_CONTINUITY.md")
b489=read("BUILD489_PROVIDER_LOCAL_SEARCH_EVIDENCE_CONTINUITY.md")
b488=read("BUILD488_CONTROLLED_ENVIRONMENT_ALTERNATIVES_WEATHER_SAFE_ROUTING.md")
b487=read("BUILD487_WINTER_BOOKING_ELIGIBILITY_CUSTOMER_TRANSPARENCY.md")
b486=read("BUILD486_COLD_WEATHER_SERVICE_CAPABILITY_EVIDENCE_MATRIX.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/production-learning-roadmap-renewal-authority.yml")
convergence=read("scripts/release_authority_documentation_convergence_check.py")

require(contract,[
    "# Build 495 — Production Learning & Roadmap Renewal",
    "retained", "closed", "owner_action", "provider_dependent", "unavailable",
    "PRODUCTION_LEARNING_486_494.md", "FORWARD_BUILD_ROADMAP_496_505.md",
    "Southern Ontario seasonal-service truth boundary",
    "Missing evidence remains a blocker or truthful HOLD, never fabricated success.",
    "Build 496 — Seasonal Capability Owner Review & Public Claim Decision"
],"current renewal contract")
require(prior,[
    "# Build 485 — Production Learning & Roadmap Renewal",
    "PRODUCTION_LEARNING_476_484.md",
    "FORWARD_BUILD_ROADMAP_486_495.md"
],"retained prior renewal contract")
require(prior_learning,["Production Learning Reconciliation 476–484","FORWARD_BUILD_ROADMAP_486_495.md"],"retained prior reconciliation")
require(prior_roadmap,["Build 486 — Cold-Weather Service Capability Evidence Matrix","Build 495 — Production Learning & Roadmap Renewal"],"retained prior roadmap")

for text,needles,label in [
 (b486,["# Build 486 — Cold-Weather Service Capability Evidence Matrix","cold-snap-capable","temperature-limited-outdoor","controlled-environment-required"],"Build 486"),
 (b487,["# Build 487 — Winter Booking Eligibility & Customer Transparency","weather-ineligible"],"Build 487"),
 (b488,["# Build 488 — Controlled-Environment Alternatives & Weather-Safe Routing","controlled-environment"],"Build 488"),
 (b489,["# Build 489 — Provider & Local Search Evidence Continuity","provider"],"Build 489"),
 (b490,["# Build 490 — Recovery & Authenticated Device Evidence Continuity","recovery"],"Build 490"),
 (b491,["# Build 491 — Maintenance & Fleet Pilot Outcome Evidence","owner"],"Build 491"),
 (b492,["# Build 492 — Booking & Quote Controlled Experiment Execution Evidence","execution"],"Build 492"),
 (b493,["# Build 493 — Staff & Mobile Remediation Outcome Evidence","before/after"],"Build 493"),
 (b494,["# Build 494 — Service Economics, Seasonal Operations & Reliability Review","Southern Ontario"],"Build 494"),
]:
    require(text,needles,label+" retained contract")

require(learning,[
    "Cold-Weather Service Capability Evidence Matrix","retained",
    "Winter Booking Eligibility & Customer Transparency","owner_action",
    "Controlled-Environment Alternatives & Weather-Safe Routing",
    "Provider & Local Search Evidence Continuity","provider_dependent",
    "Recovery & Authenticated Device Evidence Continuity",
    "Maintenance & Fleet Pilot Outcome Evidence",
    "Booking & Quote Controlled Experiment Execution Evidence",
    "Staff & Mobile Remediation Outcome Evidence",
    "Service Economics, Seasonal Operations & Reliability Review",
    "cold-snap-capable","temperature-limited-outdoor","controlled-environment-required",
    "FORWARD_BUILD_ROADMAP_496_505.md"
],"cycle reconciliation")

roadmap_titles=[
    "Build 496 — Seasonal Capability Owner Review & Public Claim Decision",
    "Build 497 — Winter Booking & Quote Rule Activation Readiness",
    "Build 498 — Controlled-Environment Site Qualification & Service Routing Evidence",
    "Build 499 — Provider & Local Search Outcome Evidence Refresh",
    "Build 500 — Recovery Drill & Authenticated Device Observation Execution Evidence",
    "Build 501 — Maintenance & Fleet Pilot Outcome Continuity Review",
    "Build 502 — Booking & Quote Experiment Outcome Interpretation",
    "Build 503 — Staff & Mobile Remediation Outcome Interpretation & Follow-Up",
    "Build 504 — Service Economics, Seasonal Capacity & Reliability Trend Continuity",
    "Build 505 — Production Learning & Roadmap Renewal",
]
for title in roadmap_titles:
    require(roadmap,[title],"renewed roadmap")
require(roadmap,[
    "Southern Ontario","Weather-ineligible sessions",
    "Missing evidence remains a truthful HOLD",
    "protected `main` PR governance"
],"renewed roadmap boundary")

require(blockers,[
    "Provider outcomes & communications","Local-search provider evidence",
    "Recovery / backup evidence","Independent device / visual evidence",
    "Maintenance / fleet business approval","Seasonal service capability & transparency",
    "Evidence source unavailable","PRODUCTION_LEARNING_486_494.md",
    "FORWARD_BUILD_ROADMAP_496_505.md","BUILD495_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md"
],"canonical HOLD backlog")
require(queue,[
    "BUILD495_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md","PRODUCTION_LEARNING_486_494.md",
    "FORWARD_BUILD_ROADMAP_496_505.md",
    "**Build 502 — Booking & Quote Experiment Outcome Interpretation** is the active bounded release.",
    "**Build 503 — Staff & Mobile Remediation Outcome Interpretation & Follow-Up** is next",
    "it has not run out","rd main protection","Production deployment/runtime/business acceptance",
    "Missing required checks or exact Production runtime/deployment identity are blockers"
],"release queue")
require(handoff,[
    "BUILD495_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md","PRODUCTION_LEARNING_486_494.md",
    "FORWARD_BUILD_ROADMAP_496_505.md",
    "**Build 502 — Booking & Quote Experiment Outcome Interpretation** is the active bounded release.",
    "**Build 503 — Staff & Mobile Remediation Outcome Interpretation & Follow-Up** is next",
    "STARTUP_GO_LIVE_BLOCKERS.md",
    "Production deployment/runtime/business acceptance must independently prove that exact SHA."
],"project handoff")
require(readme,[
    "Current source direction: **Build 502 — Booking & Quote Experiment Outcome Interpretation**.",
    "BUILD495_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md","PRODUCTION_LEARNING_486_494.md",
    "FORWARD_BUILD_ROADMAP_496_505.md","python scripts/production_learning_roadmap_renewal_check.py",
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
    "Completed-cycle 486–494 evidence reconciliation: PASS",
    "Roadmap 496–505 renewal: PASS",
    "Southern Ontario seasonal-service truth boundary: PASS",
    "python scripts/production_learning_roadmap_renewal_check.py"
],"renewal workflow")
require(convergence,[
    'RENEWED_CYCLE_ROADMAP = ROOT / "FORWARD_BUILD_ROADMAP_496_505.md"',
    "renewed_cycle_roadmap",
    "roadmap_sequence"
],"release convergence authority")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])495(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 495 must not introduce a schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("PRODUCTION LEARNING & ROADMAP RENEWAL AUTHORITY: FAIL")
    for e in errors:
        print(" -",e)
    sys.exit(1)

print("PRODUCTION LEARNING & ROADMAP RENEWAL AUTHORITY: PASS")
print(" - 486–494 concerns are reconciled without fabricating provider/owner/device/recovery/execution/allocation evidence")
print(" - Southern Ontario seasonal-service truth remains source-owned and separate from reliability/margin/search evidence")
print(" - canonical HOLD inventory retains unresolved concerns")
print(" - roadmap 496–505 is renewed from observed outcomes")
print(" - schema/provider/business/publication mutation remains NONE")
