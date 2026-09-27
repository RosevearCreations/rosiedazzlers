#!/usr/bin/env python3
"""Current Production Learning & Roadmap Renewal authority for Build 515."""
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

contract=read("BUILD515_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md")
learning=read("PRODUCTION_LEARNING_506_514.md")
roadmap=read("FORWARD_BUILD_ROADMAP_516_525.md")
prior=read("BUILD505_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md")
prior_learning=read("PRODUCTION_LEARNING_496_504.md")
prior_roadmap=read("FORWARD_BUILD_ROADMAP_506_515.md")
b514=read("BUILD514_SERVICE_ECONOMICS_SEASONAL_CAPACITY_RELIABILITY_DECISION_READINESS.md")
b513=read("BUILD513_STAFF_MOBILE_REMEDIATION_CLOSURE_READINESS.md")
b512=read("BUILD512_BOOKING_QUOTE_EXPERIMENT_FOLLOW_UP_DECISION.md")
b511=read("BUILD511_MAINTENANCE_FLEET_PILOT_CONTINUATION_DECISION.md")
b510=read("BUILD510_RECOVERY_DRILL_AUTHENTICATED_DEVICE_CLOSURE_REVIEW.md")
b509=read("BUILD509_PROVIDER_LOCAL_SEARCH_CLOSURE_EVIDENCE_CONTINUITY_REVIEW.md")
b508=read("BUILD508_CONTROLLED_ENVIRONMENT_OPERATIONAL_READINESS_ROUTING_CONTINUITY.md")
b507=read("BUILD507_WINTER_BOOKING_QUOTE_RULE_CONTROLLED_ACTIVATION_DECISION.md")
b506=read("BUILD506_SEASONAL_CAPABILITY_PUBLIC_CLAIM_ACTIVATION_DECISION.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/production-learning-roadmap-renewal-authority.yml")
convergence=read("scripts/release_authority_documentation_convergence_check.py")
doc_index=read("DOC_INDEX.md")

require(contract,[
    "# Build 515 — Production Learning & Roadmap Renewal",
    "retained", "closed", "owner_action", "provider_dependent", "unavailable",
    "PRODUCTION_LEARNING_506_514.md", "FORWARD_BUILD_ROADMAP_516_525.md",
    "Southern Ontario seasonal-service truth boundary",
    "Missing evidence remains a blocker or truthful HOLD, never fabricated success.",
    "Build 516 — Seasonal Capability & Public Claim Decision Outcome Continuity"
],"current renewal contract")
require(prior,[
    "# Build 505 — Production Learning & Roadmap Renewal",
    "PRODUCTION_LEARNING_496_504.md",
    "FORWARD_BUILD_ROADMAP_506_515.md"
],"retained prior renewal contract")
require(prior_learning,["Production Learning Reconciliation 496–504","FORWARD_BUILD_ROADMAP_506_515.md"],"retained prior reconciliation")
require(prior_roadmap,["Build 506 — Seasonal Capability & Public Claim Activation Decision","Build 515 — Production Learning & Roadmap Renewal"],"retained prior roadmap")

for text,title,label in [
 (b506,"# Build 506 — Seasonal Capability & Public Claim Activation Decision","Build 506"),
 (b507,"# Build 507 — Winter Booking & Quote Rule Controlled Activation Decision","Build 507"),
 (b508,"# Build 508 — Controlled-Environment Operational Readiness & Routing Continuity","Build 508"),
 (b509,"# Build 509 — Provider & Local Search Closure Evidence Continuity Review","Build 509"),
 (b510,"# Build 510 — Recovery Drill & Authenticated Device Closure Review","Build 510"),
 (b511,"# Build 511 — Maintenance & Fleet Pilot Continuation Decision","Build 511"),
 (b512,"# Build 512 — Booking & Quote Experiment Follow-Up Decision","Build 512"),
 (b513,"# Build 513 — Staff & Mobile Remediation Closure Readiness","Build 513"),
 (b514,"# Build 514 — Service Economics, Seasonal Capacity & Reliability Decision Readiness","Build 514"),
]:
    require(text,[title],label+" retained contract")

require(learning,[
    "Seasonal Capability & Public Claim Activation Decision","owner_action",
    "Winter Booking & Quote Rule Controlled Activation Decision",
    "Controlled-Environment Operational Readiness & Routing Continuity",
    "Provider & Local Search Closure Evidence Continuity Review","provider_dependent",
    "Recovery Drill & Authenticated Device Closure Review",
    "Maintenance & Fleet Pilot Continuation Decision",
    "Booking & Quote Experiment Follow-Up Decision",
    "Staff & Mobile Remediation Closure Readiness",
    "Service Economics, Seasonal Capacity & Reliability Decision Readiness",
    "FORWARD_BUILD_ROADMAP_516_525.md"
],"cycle reconciliation")

roadmap_titles=[
    "Build 516 — Seasonal Capability & Public Claim Decision Outcome Continuity",
    "Build 517 — Winter Booking & Quote Rule Controlled-Activation Outcome Continuity",
    "Build 518 — Controlled-Environment Routing Outcome Evidence Continuity",
    "Build 519 — Provider & Local Search Manual Closure Outcome Continuity",
    "Build 520 — Recovery Drill & Authenticated Device Manual Closure Outcome Continuity",
    "Build 521 — Maintenance & Fleet Continuation Outcome Continuity",
    "Build 522 — Booking & Quote Experiment Follow-Up Outcome Continuity",
    "Build 523 — Staff & Mobile Remediation Closure Outcome Continuity",
    "Build 524 — Service Economics, Seasonal Capacity & Reliability Decision Outcome Continuity",
    "Build 525 — Production Learning & Roadmap Renewal",
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
    "Evidence source unavailable","PRODUCTION_LEARNING_506_514.md",
    "FORWARD_BUILD_ROADMAP_516_525.md","BUILD515_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md"
],"canonical HOLD backlog")
require(queue,[
    "BUILD515_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md","PRODUCTION_LEARNING_506_514.md",
    "FORWARD_BUILD_ROADMAP_516_525.md",
    "**Build 515 — Production Learning & Roadmap Renewal** is the active bounded release.",
    "**Build 516 — Seasonal Capability & Public Claim Decision Outcome Continuity** is next",
    "it has not run out","rd main protection","Production deployment/runtime/business acceptance",
    "Missing required checks or exact Production runtime/deployment identity are blockers"
],"release queue")
require(handoff,[
    "BUILD515_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md","PRODUCTION_LEARNING_506_514.md",
    "FORWARD_BUILD_ROADMAP_516_525.md",
    "**Build 515 — Production Learning & Roadmap Renewal** is the active bounded release.",
    "**Build 516 — Seasonal Capability & Public Claim Decision Outcome Continuity** is next",
    "STARTUP_GO_LIVE_BLOCKERS.md",
    "Production deployment/runtime/business acceptance must independently prove that exact SHA."
],"project handoff")
require(readme,[
    "Current source direction: **Build 515 — Production Learning & Roadmap Renewal**.",
    "BUILD515_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md","PRODUCTION_LEARNING_506_514.md",
    "FORWARD_BUILD_ROADMAP_516_525.md","scripts/production_learning_roadmap_renewal_check.py",
    "Production is not considered GREEN from source promotion alone."
],"README")
require(doc_index,["FORWARD_BUILD_ROADMAP_516_525.md","active forward sequence"],"documentation index")
for text,label in [(dev,"Development source gate"),(prod,"Production authority")]:
    require(text,["python scripts/production_learning_roadmap_renewal_check.py"],label)
require(prodcheck,[
    "production_learning_roadmap_renewal",
    "scripts/production_learning_roadmap_renewal_check.py",
    "Validate Production learning & roadmap renewal authority"
],"Production business acceptance source authority")
require(workflow,[
    "name: Production Learning & Roadmap Renewal Authority",
    "Completed-cycle 506–514 evidence reconciliation: PASS",
    "Roadmap 516–525 renewal: PASS",
    "Southern Ontario seasonal-service truth boundary: PASS",
    "python scripts/production_learning_roadmap_renewal_check.py"
],"renewal workflow")
require(convergence,[
    'NEXT_RENEWED_CYCLE_ROADMAP = ROOT / "FORWARD_BUILD_ROADMAP_516_525.md"',
    "next_renewed_cycle_roadmap",
    "roadmap_sequence"
],"release convergence authority")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])515(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 515 must not introduce a schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("PRODUCTION LEARNING & ROADMAP RENEWAL AUTHORITY: FAIL")
    for e in errors:
        print(" -",e)
    sys.exit(1)

print("PRODUCTION LEARNING & ROADMAP RENEWAL AUTHORITY: PASS")
print(" - 506–514 concerns are reconciled without fabricating provider/owner/device/recovery/execution/allocation/capacity evidence")
print(" - Southern Ontario seasonal-service truth remains source-owned and separate from reliability/margin/search evidence")
print(" - canonical HOLD inventory retains unresolved concerns")
print(" - roadmap 516–525 is renewed from observed outcomes")
print(" - schema/provider/business/publication/HOLD mutation remains NONE")
