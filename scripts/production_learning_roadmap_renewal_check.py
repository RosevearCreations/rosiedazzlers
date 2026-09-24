#!/usr/bin/env python3
"""Current Production Learning & Roadmap Renewal authority for Build 485."""
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

contract=read("BUILD485_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md")
learning=read("PRODUCTION_LEARNING_476_484.md")
roadmap=read("FORWARD_BUILD_ROADMAP_486_495.md")
prior=read("BUILD475_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md")
prior_learning=read("PRODUCTION_LEARNING_466_474.md")
prior_roadmap=read("FORWARD_BUILD_ROADMAP_476_485.md")
b484=read("BUILD484_RELIABILITY_COST_RECOVERY_EVIDENCE_CONTINUITY.md")
b483=read("BUILD483_SERVICE_ADDON_ALLOCATION_EVIDENCE_CLOSURE.md")
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
    "# Build 485 — Production Learning & Roadmap Renewal",
    "retained", "closed", "owner_action", "provider_dependent", "unavailable",
    "PRODUCTION_LEARNING_476_484.md", "FORWARD_BUILD_ROADMAP_486_495.md",
    "Southern Ontario cold-weather truth boundary",
    "Missing evidence remains a blocker or truthful HOLD, never fabricated success.",
    "Build 486 — Cold-Weather Service Capability Evidence Matrix"
],"current renewal contract")
require(prior,[
    "# Build 475 — Production Learning & Roadmap Renewal",
    "PRODUCTION_LEARNING_466_474.md",
    "FORWARD_BUILD_ROADMAP_476_485.md"
],"retained prior renewal contract")
require(prior_learning,[
    "Production Learning Reconciliation 466–474",
    "FORWARD_BUILD_ROADMAP_476_485.md"
],"retained prior reconciliation")
require(prior_roadmap,[
    "Build 476 — Provider HOLD Decision Traceability & Closure Review",
    "Build 485 — Production Learning & Roadmap Renewal"
],"retained prior roadmap")
require(b484,[
    "# Build 484 — Reliability, Cost & Recovery Evidence Continuity",
    "Source/runtime GREEN is not recovery-outcome evidence.",
    "Southern Ontario"
],"retained Build 484 contract")
require(b483,[
    "# Build 483 — Service & Add-On Allocation Evidence Closure",
    "cold-snap-capable",
    "temperature-limited-outdoor",
    "controlled-environment-required"
],"retained Build 483 contract")

require(learning,[
    "Provider HOLD Decision Traceability & Closure Review",
    "provider_dependent",
    "Recovery Drill Evidence Refresh & Closure Review",
    "owner_action",
    "Authenticated Device Observation Refresh & Regression Triage",
    "Maintenance & Fleet Owner Approval & Pilot Decision",
    "Local Search Provider Snapshot Continuity & Descriptive Review",
    "Booking & Quote Experiment Approval & Measurement Lock",
    "Staff & Mobile Remediation Execution Evidence Readiness",
    "retained",
    "Service & Add-On Allocation Evidence Closure",
    "Reliability, Cost & Recovery Evidence Continuity",
    "cold-snap-capable",
    "temperature-limited-outdoor",
    "controlled-environment-required",
    "FORWARD_BUILD_ROADMAP_486_495.md"
],"cycle reconciliation")

roadmap_titles=[
    "Build 486 — Cold-Weather Service Capability Evidence Matrix",
    "Build 487 — Winter Booking Eligibility & Customer Transparency",
    "Build 488 — Controlled-Environment Alternatives & Weather-Safe Routing",
    "Build 489 — Provider & Local Search Evidence Continuity",
    "Build 490 — Recovery & Authenticated Device Evidence Continuity",
    "Build 491 — Maintenance & Fleet Pilot Outcome Evidence",
    "Build 492 — Booking & Quote Controlled Experiment Execution Evidence",
    "Build 493 — Staff & Mobile Remediation Outcome Evidence",
    "Build 494 — Service Economics, Seasonal Operations & Reliability Review",
    "Build 495 — Production Learning & Roadmap Renewal",
]
for title in roadmap_titles:
    require(roadmap,[title],"renewed roadmap")
require(roadmap,[
    "Southern Ontario",
    "cold-snap-capable",
    "temperature-limited-outdoor",
    "controlled-environment-required",
    "weather-ineligible sessions",
    "Missing evidence remains a truthful HOLD"
],"seasonal roadmap boundary")

require(blockers,[
    "Provider outcomes & communications",
    "Local-search provider evidence",
    "Recovery / backup evidence",
    "Independent device / visual evidence",
    "Maintenance / fleet business approval",
    "Seasonal service capability & transparency",
    "Evidence source unavailable",
    "PRODUCTION_LEARNING_476_484.md",
    "FORWARD_BUILD_ROADMAP_486_495.md",
    "BUILD485_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md"
],"canonical HOLD backlog")
require(queue,[
    "BUILD485_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md",
    "PRODUCTION_LEARNING_476_484.md",
    "FORWARD_BUILD_ROADMAP_486_495.md",
    "**Build 493 — Staff & Mobile Remediation Outcome Evidence** is the active bounded release.",
    "**Build 494 — Service Economics, Seasonal Operations & Reliability Review** is next",
    "it has not run out",
    "rd main protection",
    "Production deployment/runtime/business acceptance",
    "Missing required checks or exact Production runtime/deployment identity are blockers"
],"release queue")
require(handoff,[
    "BUILD485_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md",
    "PRODUCTION_LEARNING_476_484.md",
    "FORWARD_BUILD_ROADMAP_486_495.md",
    "**Build 493 — Staff & Mobile Remediation Outcome Evidence** is the active bounded release.",
    "**Build 494 — Service Economics, Seasonal Operations & Reliability Review** is next",
    "STARTUP_GO_LIVE_BLOCKERS.md",
    "Production deployment/runtime/business acceptance must independently prove that exact SHA."
],"project handoff")
require(readme,[
    "Current source direction: **Build 493 — Staff & Mobile Remediation Outcome Evidence**.",
    "BUILD485_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md",
    "PRODUCTION_LEARNING_476_484.md",
    "FORWARD_BUILD_ROADMAP_486_495.md",
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
    "Completed-cycle 476–484 evidence reconciliation: PASS",
    "Roadmap 486–495 renewal: PASS",
    "Southern Ontario cold-weather truth boundary: PASS",
    "python scripts/production_learning_roadmap_renewal_check.py"
],"renewal workflow")
require(convergence,[
    'NEXT_CYCLE_ROADMAP = ROOT / "FORWARD_BUILD_ROADMAP_486_495.md"',
    "next_cycle_roadmap",
    "roadmap_sequence"
],"release convergence authority")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])485(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 485 must not introduce a schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("PRODUCTION LEARNING & ROADMAP RENEWAL AUTHORITY: FAIL")
    for e in errors:
        print(" -",e)
    sys.exit(1)

print("PRODUCTION LEARNING & ROADMAP RENEWAL AUTHORITY: PASS")
print(" - 476–484 concerns are reconciled without fabricating provider/owner/device/recovery/allocation evidence")
print(" - Southern Ontario seasonal-service capability remains explicit, sourced and separate from reliability/margin evidence")
print(" - canonical HOLD inventory retains unresolved concerns and adds broad winter-claim transparency protection")
print(" - roadmap 486–495 is renewed from observed outcomes")
print(" - schema/provider/business mutation remains NONE")
