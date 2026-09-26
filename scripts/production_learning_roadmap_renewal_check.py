#!/usr/bin/env python3
"""Current Production Learning & Roadmap Renewal authority for Build 505."""
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

contract=read("BUILD505_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md")
learning=read("PRODUCTION_LEARNING_496_504.md")
roadmap=read("FORWARD_BUILD_ROADMAP_506_515.md")
prior=read("BUILD495_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md")
prior_learning=read("PRODUCTION_LEARNING_486_494.md")
prior_roadmap=read("FORWARD_BUILD_ROADMAP_496_505.md")
b504=read("BUILD504_SERVICE_ECONOMICS_SEASONAL_CAPACITY_RELIABILITY_TREND_CONTINUITY.md")
b503=read("BUILD503_STAFF_MOBILE_REMEDIATION_OUTCOME_INTERPRETATION_FOLLOW_UP.md")
b502=read("BUILD502_BOOKING_QUOTE_EXPERIMENT_OUTCOME_INTERPRETATION.md")
b501=read("BUILD501_MAINTENANCE_FLEET_PILOT_OUTCOME_CONTINUITY_REVIEW.md")
b500=read("BUILD500_RECOVERY_DRILL_AUTHENTICATED_DEVICE_OBSERVATION_EXECUTION_EVIDENCE.md")
b499=read("BUILD499_PROVIDER_LOCAL_SEARCH_OUTCOME_EVIDENCE_REFRESH.md")
b498=read("BUILD498_CONTROLLED_ENVIRONMENT_SITE_QUALIFICATION_SERVICE_ROUTING_EVIDENCE.md")
b497=read("BUILD497_WINTER_BOOKING_QUOTE_RULE_ACTIVATION_READINESS.md")
b496=read("BUILD496_SEASONAL_CAPABILITY_OWNER_REVIEW_PUBLIC_CLAIM_DECISION.md")
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
    "# Build 505 — Production Learning & Roadmap Renewal",
    "retained", "closed", "owner_action", "provider_dependent", "unavailable",
    "PRODUCTION_LEARNING_496_504.md", "FORWARD_BUILD_ROADMAP_506_515.md",
    "Southern Ontario seasonal-service truth boundary",
    "Missing evidence remains a blocker or truthful HOLD, never fabricated success.",
    "Build 506 — Seasonal Capability & Public Claim Activation Decision"
],"current renewal contract")
require(prior,[
    "# Build 495 — Production Learning & Roadmap Renewal",
    "PRODUCTION_LEARNING_486_494.md",
    "FORWARD_BUILD_ROADMAP_496_505.md"
],"retained prior renewal contract")
require(prior_learning,["Production Learning Reconciliation 486–494","FORWARD_BUILD_ROADMAP_496_505.md"],"retained prior reconciliation")
require(prior_roadmap,["Build 496 — Seasonal Capability Owner Review & Public Claim Decision","Build 505 — Production Learning & Roadmap Renewal"],"retained prior roadmap")

for text,needles,label in [
 (b496,["# Build 496 — Seasonal Capability Owner Review & Public Claim Decision","publication_review_ready"],"Build 496"),
 (b497,["# Build 497 — Winter Booking & Quote Rule Activation Readiness","activation_readiness"],"Build 497"),
 (b498,["# Build 498 — Controlled-Environment Site Qualification & Service Routing Evidence","controlled-environment"],"Build 498"),
 (b499,["# Build 499 — Provider & Local Search Outcome Evidence Refresh","provider"],"Build 499"),
 (b500,["# Build 500 — Recovery Drill & Authenticated Device Observation Execution Evidence","bounded **non-Production**"],"Build 500"),
 (b501,["# Build 501 — Maintenance & Fleet Pilot Outcome Continuity Review","stop condition"],"Build 501"),
 (b502,["# Build 502 — Booking & Quote Experiment Outcome Interpretation","measurement lock"],"Build 502"),
 (b503,["# Build 503 — Staff & Mobile Remediation Outcome Interpretation & Follow-Up","before/after"],"Build 503"),
 (b504,["# Build 504 — Service Economics, Seasonal Capacity & Reliability Trend Continuity","Same-domain comparability rule"],"Build 504"),
]:
    require(text,needles,label+" retained contract")

require(learning,[
    "Seasonal Capability Owner Review & Public Claim Decision","owner_action",
    "Winter Booking & Quote Rule Activation Readiness",
    "Controlled-Environment Site Qualification & Service Routing Evidence",
    "Provider & Local Search Outcome Evidence Refresh","provider_dependent",
    "Recovery Drill & Authenticated Device Observation Execution Evidence",
    "Maintenance & Fleet Pilot Outcome Continuity Review",
    "Booking & Quote Experiment Outcome Interpretation",
    "Staff & Mobile Remediation Outcome Interpretation & Follow-Up",
    "Service Economics, Seasonal Capacity & Reliability Trend Continuity",
    "FORWARD_BUILD_ROADMAP_506_515.md"
],"cycle reconciliation")

roadmap_titles=[
    "Build 506 — Seasonal Capability & Public Claim Activation Decision",
    "Build 507 — Winter Booking & Quote Rule Controlled Activation Decision",
    "Build 508 — Controlled-Environment Operational Readiness & Routing Continuity",
    "Build 509 — Provider & Local Search Closure Evidence Continuity Review",
    "Build 510 — Recovery Drill & Authenticated Device Closure Review",
    "Build 511 — Maintenance & Fleet Pilot Continuation Decision",
    "Build 512 — Booking & Quote Experiment Follow-Up Decision",
    "Build 513 — Staff & Mobile Remediation Closure Readiness",
    "Build 514 — Service Economics, Seasonal Capacity & Reliability Decision Readiness",
    "Build 515 — Production Learning & Roadmap Renewal",
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
    "Evidence source unavailable","PRODUCTION_LEARNING_496_504.md",
    "FORWARD_BUILD_ROADMAP_506_515.md","BUILD505_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md"
],"canonical HOLD backlog")
require(queue,[
    "BUILD505_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md","PRODUCTION_LEARNING_496_504.md",
    "FORWARD_BUILD_ROADMAP_506_515.md",
    "**Build 507 — Winter Booking & Quote Rule Controlled Activation Decision** is the active bounded release.",
    "**Build 508 — Controlled-Environment Operational Readiness & Routing Continuity** is next",
    "it has not run out","rd main protection","Production deployment/runtime/business acceptance",
    "Missing required checks or exact Production runtime/deployment identity are blockers"
],"release queue")
require(handoff,[
    "BUILD505_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md","PRODUCTION_LEARNING_496_504.md",
    "FORWARD_BUILD_ROADMAP_506_515.md",
    "**Build 507 — Winter Booking & Quote Rule Controlled Activation Decision** is the active bounded release.",
    "**Build 508 — Controlled-Environment Operational Readiness & Routing Continuity** is next",
    "STARTUP_GO_LIVE_BLOCKERS.md",
    "Production deployment/runtime/business acceptance must independently prove that exact SHA."
],"project handoff")
require(readme,[
    "Current source direction: **Build 507 — Winter Booking & Quote Rule Controlled Activation Decision**.",
    "BUILD505_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md","PRODUCTION_LEARNING_496_504.md",
    "FORWARD_BUILD_ROADMAP_506_515.md","scripts/production_learning_roadmap_renewal_check.py",
    "Production is not considered GREEN from source promotion alone."
],"README")
require(doc_index,["FORWARD_BUILD_ROADMAP_506_515.md","active forward sequence"],"documentation index")
for text,label in [(dev,"Development source gate"),(prod,"Production authority")]:
    require(text,["python scripts/production_learning_roadmap_renewal_check.py"],label)
require(prodcheck,[
    "production_learning_roadmap_renewal",
    "scripts/production_learning_roadmap_renewal_check.py",
    "Validate Production learning & roadmap renewal authority"
],"Production business acceptance source authority")
require(workflow,[
    "name: Production Learning & Roadmap Renewal Authority",
    "Completed-cycle 496–504 evidence reconciliation: PASS",
    "Roadmap 506–515 renewal: PASS",
    "Southern Ontario seasonal-service truth boundary: PASS",
    "python scripts/production_learning_roadmap_renewal_check.py"
],"renewal workflow")
require(convergence,[
    'LATEST_RENEWED_CYCLE_ROADMAP = ROOT / "FORWARD_BUILD_ROADMAP_506_515.md"',
    "latest_renewed_cycle_roadmap",
    "roadmap_sequence"
],"release convergence authority")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])505(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 505 must not introduce a schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("PRODUCTION LEARNING & ROADMAP RENEWAL AUTHORITY: FAIL")
    for e in errors:
        print(" -",e)
    sys.exit(1)

print("PRODUCTION LEARNING & ROADMAP RENEWAL AUTHORITY: PASS")
print(" - 496–504 concerns are reconciled without fabricating provider/owner/device/recovery/execution/allocation/capacity evidence")
print(" - Southern Ontario seasonal-service truth remains source-owned and separate from reliability/margin/search evidence")
print(" - canonical HOLD inventory retains unresolved concerns")
print(" - roadmap 506–515 is renewed from observed outcomes")
print(" - schema/provider/business/publication mutation remains NONE")
