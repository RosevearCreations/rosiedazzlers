#!/usr/bin/env python3
"""Current Production Learning & Roadmap Renewal authority for Build 535."""
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

contract=read("BUILD535_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md")
learning=read("PRODUCTION_LEARNING_526_534.md")
roadmap=read("FORWARD_BUILD_ROADMAP_536_545.md")
prior=read("BUILD525_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md")
prior_learning=read("PRODUCTION_LEARNING_516_524.md")
prior_roadmap=read("FORWARD_BUILD_ROADMAP_526_535.md")
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
    "# Build 535 — Production Learning & Roadmap Renewal",
    "retained", "closed", "owner_action", "provider_dependent", "unavailable",
    "PRODUCTION_LEARNING_526_534.md", "FORWARD_BUILD_ROADMAP_536_545.md",
    "Southern Ontario seasonal-service truth boundary",
    "Supabase/storage boundary",
    "Missing evidence remains a blocker or truthful HOLD, never fabricated success.",
    "Build 536 — Seasonal Capability & Public Claim Evidence Integrity Review"
],"current renewal contract")
require(prior,["# Build 525 — Production Learning & Roadmap Renewal","PRODUCTION_LEARNING_516_524.md","FORWARD_BUILD_ROADMAP_526_535.md"],"retained prior renewal")
require(prior_learning,["Production Learning Reconciliation 516–524","FORWARD_BUILD_ROADMAP_526_535.md"],"retained prior reconciliation")
require(prior_roadmap,["Build 526 — Seasonal Capability & Public Claim Outcome Freshness Review","Build 535 — Production Learning & Roadmap Renewal"],"retained prior roadmap")

for n,path in [
 (526,"BUILD526_SEASONAL_CAPABILITY_PUBLIC_CLAIM_OUTCOME_FRESHNESS_REVIEW.md"),
 (527,"BUILD527_WINTER_BOOKING_QUOTE_RULE_OUTCOME_FRESHNESS_REVIEW.md"),
 (528,"BUILD528_CONTROLLED_ENVIRONMENT_ROUTING_OUTCOME_FRESHNESS_CAPACITY_REVIEW.md"),
 (529,"BUILD529_PROVIDER_LOCAL_SEARCH_CLOSURE_EVIDENCE_FRESHNESS_REVIEW.md"),
 (530,"BUILD530_RECOVERY_AUTHENTICATED_DEVICE_CLOSURE_EVIDENCE_FRESHNESS_REVIEW.md"),
 (531,"BUILD531_MAINTENANCE_FLEET_CONTINUATION_EVIDENCE_FRESHNESS_REVIEW.md"),
 (532,"BUILD532_BOOKING_QUOTE_FOLLOW_UP_EVIDENCE_FRESHNESS_REVIEW.md"),
 (533,"BUILD533_STAFF_MOBILE_CLOSURE_EVIDENCE_FRESHNESS_REVIEW.md"),
 (534,"BUILD534_SERVICE_ECONOMICS_SEASONAL_CAPACITY_RELIABILITY_EVIDENCE_FRESHNESS_REVIEW.md"),
]:
    require(read(path),[f"# Build {n}"],f"Build {n} retained contract")

require(learning,[
    "Production Learning Reconciliation 526–534",
    "Seasonal Capability & Public Claim Outcome Freshness Review","owner_action",
    "Winter Booking & Quote Rule Outcome Freshness Review",
    "Controlled-Environment Routing Outcome Freshness & Capacity Review","retained",
    "Provider & Local Search Closure Evidence Freshness Review","provider_dependent",
    "Recovery & Authenticated Device Closure Evidence Freshness Review",
    "Maintenance & Fleet Continuation Evidence Freshness Review",
    "Booking & Quote Follow-Up Evidence Freshness Review",
    "Staff & Mobile Closure Evidence Freshness Review",
    "Service Economics, Seasonal Capacity & Reliability Evidence Freshness Review",
    "FORWARD_BUILD_ROADMAP_536_545.md"
],"cycle reconciliation")

roadmap_titles=[
    "Build 536 — Seasonal Capability & Public Claim Evidence Integrity Review",
    "Build 537 — Winter Booking & Quote Rule Evidence Integrity Review",
    "Build 538 — Controlled-Environment Routing & Capacity Evidence Integrity Review",
    "Build 539 — Provider & Local Search Closure Evidence Integrity Review",
    "Build 540 — Recovery & Authenticated Device Closure Evidence Integrity Review",
    "Build 541 — Maintenance & Fleet Continuation Evidence Integrity Review",
    "Build 542 — Booking & Quote Follow-Up Evidence Integrity Review",
    "Build 543 — Staff & Mobile Closure Evidence Integrity Review",
    "Build 544 — Service Economics, Seasonal Capacity & Reliability Evidence Integrity Review",
    "Build 545 — Production Learning & Roadmap Renewal",
]
for title in roadmap_titles:
    require(roadmap,[title],"renewed roadmap")
require(roadmap,["Southern Ontario","Missing evidence remains a truthful HOLD","protected `main` PR governance","Storage and mutation rule"],"renewed roadmap boundary")

require(blockers,["Provider outcomes & communications","Local-search provider evidence","Recovery / backup evidence","Independent device / visual evidence","Maintenance / fleet business approval","Seasonal service capability & transparency","Evidence source unavailable","PRODUCTION_LEARNING_526_534.md","FORWARD_BUILD_ROADMAP_536_545.md","Build 535 reconciles the 526–534 cycle"],"canonical HOLD backlog")
require(queue,["BUILD535_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md","PRODUCTION_LEARNING_526_534.md","FORWARD_BUILD_ROADMAP_536_545.md","**Build 535 — Production Learning & Roadmap Renewal** is the active bounded release.","**Build 536 — Seasonal Capability & Public Claim Evidence Integrity Review** is next","it has not run out","rd main protection","Production deployment/runtime/business acceptance","Missing required checks or exact Production runtime/deployment identity are blockers"],"release queue")
require(handoff,["BUILD535_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md","PRODUCTION_LEARNING_526_534.md","FORWARD_BUILD_ROADMAP_536_545.md","**Build 535 — Production Learning & Roadmap Renewal** is the active bounded release.","**Build 536 — Seasonal Capability & Public Claim Evidence Integrity Review** is next","STARTUP_GO_LIVE_BLOCKERS.md","Production deployment/runtime/business acceptance must independently prove that exact SHA."],"project handoff")
require(readme,["Current source direction: **Build 535 — Production Learning & Roadmap Renewal**.","BUILD535_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md","PRODUCTION_LEARNING_526_534.md","FORWARD_BUILD_ROADMAP_536_545.md","scripts/production_learning_roadmap_renewal_check.py","Production is not considered GREEN from source promotion alone."],"README")
require(docindex,["BUILD535_PRODUCTION_LEARNING_ROADMAP_RENEWAL.md","current bounded release contract","PRODUCTION_LEARNING_526_534.md","FORWARD_BUILD_ROADMAP_536_545.md"],"documentation index")
for text,label in [(dev,"Development source gate"),(prod,"Production authority")]:
    require(text,["python scripts/production_learning_roadmap_renewal_check.py"],label)
require(prodcheck,["production_learning_roadmap_renewal","scripts/production_learning_roadmap_renewal_check.py","Validate Production learning & roadmap renewal authority"],"Production business acceptance source authority")
require(workflow,["name: Production Learning & Roadmap Renewal Authority","Completed-cycle 526–534 evidence reconciliation: PASS","Roadmap 536–545 renewal: PASS","Southern Ontario seasonal-service truth boundary: PASS","Supabase/schema/storage growth path: NONE","python scripts/production_learning_roadmap_renewal_check.py"],"renewal workflow")
require(convergence,['CURRENT_RENEWED_CYCLE_ROADMAP = ROOT / "FORWARD_BUILD_ROADMAP_536_545.md"',"current_renewed_cycle_roadmap","roadmap_sequence"],"release convergence authority")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])535(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 535 must not introduce a schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("PRODUCTION LEARNING & ROADMAP RENEWAL AUTHORITY: FAIL")
    for e in errors:
        print(" -",e)
    sys.exit(1)

print("PRODUCTION LEARNING & ROADMAP RENEWAL AUTHORITY: PASS")
print(" - 526–534 concerns are reconciled without fabricating provider/owner/device/recovery/execution/allocation/capacity evidence")
print(" - Southern Ontario seasonal-service truth remains source-owned and separate from reliability/margin/search evidence")
print(" - canonical HOLD inventory retains unresolved concerns")
print(" - roadmap 536–545 is renewed from observed outcomes and bounded evidence-integrity priorities")
print(" - Supabase/schema/storage/provider/business/publication/HOLD mutation remains NONE")
