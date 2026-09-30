#!/usr/bin/env python3
"""Current Production Learning & Roadmap Renewal authority for Build 525."""
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

contract=read("BUILD525_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md")
learning=read("PRODUCTION_LEARNING_516_524.md")
roadmap=read("FORWARD_BUILD_ROADMAP_526_535.md")
prior=read("BUILD515_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md")
prior_learning=read("PRODUCTION_LEARNING_506_514.md")
prior_roadmap=read("FORWARD_BUILD_ROADMAP_516_525.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
docindex=read("DOC_INDEX.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/production-learning-roadmap-renewal-authority.yml")
convergence=read("scripts/release_authority_documentation_convergence_check.py")

require(contract,[
    "# Build 525 — Production Learning & Roadmap Renewal",
    "retained", "closed", "owner_action", "provider_dependent", "unavailable",
    "PRODUCTION_LEARNING_516_524.md", "FORWARD_BUILD_ROADMAP_526_535.md",
    "Southern Ontario seasonal-service truth boundary",
    "Missing evidence remains a blocker or truthful HOLD, never fabricated success.",
    "Build 526 — Seasonal Capability & Public Claim Outcome Freshness Review"
],"current renewal contract")
require(prior,["# Build 515 — Production Learning & Roadmap Renewal","PRODUCTION_LEARNING_506_514.md","FORWARD_BUILD_ROADMAP_516_525.md"],"retained prior renewal")
require(prior_learning,["Production Learning Reconciliation 506–514","FORWARD_BUILD_ROADMAP_516_525.md"],"retained prior reconciliation")
require(prior_roadmap,["Build 516 — Seasonal Capability & Public Claim Decision Outcome Continuity","Build 525 — Production Learning & Roadmap Renewal"],"retained prior roadmap")

for n,path in [
 (516,"BUILD516_SEASONAL_CAPABILITY_PUBLIC_CLAIM_DECISION_OUTCOME_CONTINUITY.md"),
 (517,"BUILD517_WINTER_BOOKING_QUOTE_RULE_CONTROLLED_ACTIVATION_OUTCOME_CONTINUITY.md"),
 (518,"BUILD518_CONTROLLED_ENVIRONMENT_ROUTING_OUTCOME_EVIDENCE_CONTINUITY.md"),
 (519,"BUILD519_PROVIDER_LOCAL_SEARCH_MANUAL_CLOSURE_OUTCOME_CONTINUITY.md"),
 (520,"BUILD520_RECOVERY_DRILL_AUTHENTICATED_DEVICE_MANUAL_CLOSURE_OUTCOME_CONTINUITY.md"),
 (521,"BUILD521_MAINTENANCE_FLEET_CONTINUATION_OUTCOME_CONTINUITY.md"),
 (522,"BUILD522_BOOKING_QUOTE_EXPERIMENT_FOLLOW_UP_OUTCOME_CONTINUITY.md"),
 (523,"BUILD523_STAFF_MOBILE_REMEDIATION_CLOSURE_OUTCOME_CONTINUITY.md"),
 (524,"BUILD524_SERVICE_ECONOMICS_SEASONAL_CAPACITY_RELIABILITY_DECISION_OUTCOME_CONTINUITY.md"),
]:
    require(read(path),[f"# Build {n}"],f"Build {n} retained contract")

require(learning,[
    "Production Learning Reconciliation 516–524",
    "Seasonal Capability & Public Claim Decision Outcome Continuity","owner_action",
    "Winter Booking & Quote Rule Controlled-Activation Outcome Continuity",
    "Controlled-Environment Routing Outcome Evidence Continuity","retained",
    "Provider & Local Search Manual Closure Outcome Continuity","provider_dependent",
    "Recovery Drill & Authenticated Device Manual Closure Outcome Continuity",
    "Maintenance & Fleet Continuation Outcome Continuity",
    "Booking & Quote Experiment Follow-Up Outcome Continuity",
    "Staff & Mobile Remediation Closure Outcome Continuity",
    "Service Economics, Seasonal Capacity & Reliability Decision Outcome Continuity",
    "FORWARD_BUILD_ROADMAP_526_535.md"
],"cycle reconciliation")

roadmap_titles=[
    "Build 526 — Seasonal Capability & Public Claim Outcome Freshness Review",
    "Build 527 — Winter Booking & Quote Rule Outcome Freshness Review",
    "Build 528 — Controlled-Environment Routing Outcome Freshness & Capacity Review",
    "Build 529 — Provider & Local Search Closure Evidence Freshness Review",
    "Build 530 — Recovery & Authenticated Device Closure Evidence Freshness Review",
    "Build 531 — Maintenance & Fleet Continuation Evidence Freshness Review",
    "Build 532 — Booking & Quote Follow-Up Evidence Freshness Review",
    "Build 533 — Staff & Mobile Closure Evidence Freshness Review",
    "Build 534 — Service Economics, Seasonal Capacity & Reliability Evidence Freshness Review",
    "Build 535 — Production Learning & Roadmap Renewal",
]
for title in roadmap_titles:
    require(roadmap,[title],"renewed roadmap")
require(roadmap,["Southern Ontario","Missing evidence remains a truthful HOLD","protected `main` PR governance"],"renewed roadmap boundary")

require(blockers,["Provider outcomes & communications","Local-search provider evidence","Recovery / backup evidence","Independent device / visual evidence","Maintenance / fleet business approval","Seasonal service capability & transparency","Evidence source unavailable","PRODUCTION_LEARNING_516_524.md","FORWARD_BUILD_ROADMAP_526_535.md","Build 525 reconciles the 516–524 cycle"],"canonical HOLD backlog")
require(queue,["BUILD525_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md","PRODUCTION_LEARNING_516_524.md","FORWARD_BUILD_ROADMAP_526_535.md","**Build 525 — Production Learning & Roadmap Renewal** is the active bounded release.","**Build 526 — Seasonal Capability & Public Claim Outcome Freshness Review** is next","it has not run out","rd main protection","Production deployment/runtime/business acceptance","Missing required checks or exact Production runtime/deployment identity are blockers"],"release queue")
require(handoff,["BUILD525_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md","PRODUCTION_LEARNING_516_524.md","FORWARD_BUILD_ROADMAP_526_535.md","**Build 525 — Production Learning & Roadmap Renewal** is the active bounded release.","**Build 526 — Seasonal Capability & Public Claim Outcome Freshness Review** is next","STARTUP_GO_LIVE_BLOCKERS.md","Production deployment/runtime/business acceptance must independently prove that exact SHA."],"project handoff")
require(readme,["Current source direction: **Build 525 — Production Learning & Roadmap Renewal**.","BUILD525_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md","PRODUCTION_LEARNING_516_524.md","FORWARD_BUILD_ROADMAP_526_535.md","scripts/production_learning_roadmap_renewal_check.py","Production is not considered GREEN from source promotion alone."],"README")
require(docindex,["BUILD525_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md","current bounded release contract","PRODUCTION_LEARNING_516_524.md","FORWARD_BUILD_ROADMAP_526_535.md"],"documentation index")
for text,label in [(dev,"Development source gate"),(prod,"Production authority")]:
    require(text,["python scripts/production_learning_roadmap_renewal_check.py"],label)
require(prodcheck,["production_learning_roadmap_renewal","scripts/production_learning_roadmap_renewal_check.py","Validate Production learning & roadmap renewal authority"],"Production business acceptance source authority")
require(workflow,["name: Production Learning & Roadmap Renewal Authority","Completed-cycle 516–524 evidence reconciliation: PASS","Roadmap 526–535 renewal: PASS","Southern Ontario seasonal-service truth boundary: PASS","python scripts/production_learning_roadmap_renewal_check.py"],"renewal workflow")
require(convergence,['FUTURE_RENEWED_CYCLE_ROADMAP = ROOT / "FORWARD_BUILD_ROADMAP_526_535.md"',"future_renewed_cycle_roadmap","roadmap_sequence"],"release convergence authority")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])525(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 525 must not introduce a schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("PRODUCTION LEARNING & ROADMAP RENEWAL AUTHORITY: FAIL")
    for e in errors:
        print(" -",e)
    sys.exit(1)

print("PRODUCTION LEARNING & ROADMAP RENEWAL AUTHORITY: PASS")
print(" - 516–524 concerns are reconciled without fabricating provider/owner/device/recovery/execution/allocation/capacity evidence")
print(" - Southern Ontario seasonal-service truth remains source-owned and separate from reliability/margin/search evidence")
print(" - canonical HOLD inventory retains unresolved concerns")
print(" - roadmap 526–535 is renewed from observed outcomes and bounded freshness priorities")
print(" - schema/provider/business/publication/HOLD mutation remains NONE")
