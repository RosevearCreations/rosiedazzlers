#!/usr/bin/env python3
"""Build 528 source authority for Controlled-Environment Routing Outcome Freshness & Capacity Review."""
from pathlib import Path
import re, subprocess, sys
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

helper=read("functions/api/_lib/controlled-environment-routing-outcome-freshness-capacity-review.js")
endpoint=read("functions/api/admin/service_economics_commercial_capacity_review.js")
client=read("assets/build473-service-economics-allocation-margin-review-readiness.js")
page=read("admin-service-economics-commercial-capacity-review.html")
copy=read("admin-service-economics-commercial-capacity-review/index.html")
doc=read("BUILD528_CONTROLLED_ENVIRONMENT_ROUTING_OUTCOME_FRESHNESS_CAPACITY_REVIEW.md")
roadmap=read("FORWARD_BUILD_ROADMAP_526_535.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
docindex=read("DOC_INDEX.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/controlled-environment-routing-outcome-freshness-capacity-review-authority.yml")

if page!=copy:
    errors.append("Build 528 protected route copies diverged")
if len(re.findall(r"<h1\b",page,re.I))!=1:
    errors.append("Build 528 page must retain exactly one H1")

require(helper,[
    "controlled_environment_routing_freshness_capacity_build: 528",
    'controlled_environment_routing_freshness_capacity_authority: "controlled_environment_routing_outcome_freshness_capacity_review"',
    '["route_outcome_current","safe_reschedule_outcome_current"]',
    '"bounded_observed_capacity_current"',
    '"capacity_not_observed"',
    '"stale_observed_capacity_review_required"',
    "capacity_may_be_inferred_from_successful_route: false",
    "bounded_observed_capacity_proves_future_capacity: false",
    "automatic_capacity_reservation_allowed: false"
],"Build 528 helper")
require(endpoint,[
    "buildControlledEnvironmentRoutingOutcomeFreshnessCapacityReview",
    'authority:"controlled_environment_routing_outcome_freshness_capacity_review"',
    'retained_routing_outcome_authority:"controlled_environment_routing_outcome_evidence_continuity"'
],"Build 528 endpoint")
require(client,[
    "renderControlledEnvironmentRoutingOutcomeFreshnessCapacityReview",
    "controlledEnvironmentRoutingFreshnessCapacityGrid",
    "Route outcome current",
    "Bounded observed capacity current",
    "Historical observed capacity never establishes future capacity."
],"Build 528 client")
require(page,[
    'data-build528="controlled-environment-routing-outcome-freshness-capacity-review"',
    "Build 528 · Controlled-Environment Routing Outcome Freshness &amp; Capacity Review",
    'id="controlledEnvironmentRoutingFreshnessCapacityGrid"',
    "A successful route or prior site qualification does not establish universal indoor capability or future capacity."
],"Build 528 page")
require(doc,[
    "# Build 528 — Controlled-Environment Routing Outcome Freshness & Capacity Review",
    "route_outcome_current",
    "safe_reschedule_outcome_current",
    "bounded_observed_capacity_current",
    "capacity_not_observed",
    "Build 529 — Provider & Local Search Closure Evidence Freshness Review"
],"Build 528 contract")
require(roadmap,[
    "### Build 528 — Controlled-Environment Routing Outcome Freshness & Capacity Review",
    "### Build 529 — Provider & Local Search Closure Evidence Freshness Review",
    "A successful route or prior site qualification does not establish universal indoor capability or future capacity."
],"renewed roadmap")
require(queue,[
    "**Build 528 — Controlled-Environment Routing Outcome Freshness & Capacity Review** is the active bounded release.",
    "**Build 529 — Provider & Local Search Closure Evidence Freshness Review** is next",
    "BUILD528_CONTROLLED_ENVIRONMENT_ROUTING_OUTCOME_FRESHNESS_CAPACITY_REVIEW.md",
    "it has not run out"
],"release queue")
require(handoff,[
    "**Build 528 — Controlled-Environment Routing Outcome Freshness & Capacity Review** is the active bounded release.",
    "**Build 529 — Provider & Local Search Closure Evidence Freshness Review** is next",
    "BUILD528_CONTROLLED_ENVIRONMENT_ROUTING_OUTCOME_FRESHNESS_CAPACITY_REVIEW.md",
    "controlled_environment_routing_outcome_freshness_capacity_review_check.py"
],"project handoff")
require(readme,[
    "Current source direction: **Build 528 — Controlled-Environment Routing Outcome Freshness & Capacity Review**.",
    "BUILD528_CONTROLLED_ENVIRONMENT_ROUTING_OUTCOME_FRESHNESS_CAPACITY_REVIEW.md",
    "scripts/controlled_environment_routing_outcome_freshness_capacity_review_check.py",
    "Production is not considered GREEN from source promotion alone."
],"README")
require(blockers,[
    "Seasonal service capability & transparency",
    "Build 528 adds read-only controlled-environment routing outcome freshness and bounded observed-capacity review",
    "never establishes universal indoor capability or future capacity"
],"canonical HOLD backlog")
require(docindex,[
    "BUILD528_CONTROLLED_ENVIRONMENT_ROUTING_OUTCOME_FRESHNESS_CAPACITY_REVIEW.md",
    "current bounded release contract"
],"documentation index")

for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
        "python -m py_compile scripts/controlled_environment_routing_outcome_freshness_capacity_review_check.py",
        "node --check scripts/controlled_environment_routing_outcome_freshness_capacity_review_test.mjs",
        "node --check functions/api/_lib/controlled-environment-routing-outcome-freshness-capacity-review.js",
        "python scripts/controlled_environment_routing_outcome_freshness_capacity_review_check.py",
        "node scripts/controlled_environment_routing_outcome_freshness_capacity_review_test.mjs"
    ],label)
require(prodcheck,[
    '"controlled_environment_routing_outcome_freshness_capacity_review"',
    "scripts/controlled_environment_routing_outcome_freshness_capacity_review_check.py",
    "scripts/controlled_environment_routing_outcome_freshness_capacity_review_test.mjs"
],"central Production acceptance")
require(workflow,[
    "Controlled-Environment Routing Outcome Freshness & Capacity Review Authority",
    "python scripts/controlled_environment_routing_outcome_freshness_capacity_review_check.py",
    "node scripts/controlled_environment_routing_outcome_freshness_capacity_review_test.mjs",
    "One successful route establishes future capacity: NO",
    "Automatic appointment/routing/reschedule/capacity mutation: NONE"
],"Build 528 workflow")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])528(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 528 must not introduce a schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

for path in [
    "functions/api/_lib/controlled-environment-routing-outcome-freshness-capacity-review.js",
    "functions/api/admin/service_economics_commercial_capacity_review.js",
    "assets/build473-service-economics-allocation-margin-review-readiness.js",
    "scripts/controlled_environment_routing_outcome_freshness_capacity_review_test.mjs"
]:
    proc=subprocess.run(["node","--check",path],cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        errors.append(f"{path} syntax failed: {proc.stderr.strip() or proc.stdout.strip()}")

if errors:
    print("BUILD 528 CONTROLLED-ENVIRONMENT ROUTING OUTCOME FRESHNESS & CAPACITY REVIEW AUTHORITY: FAIL")
    for error in errors:
        print(" -",error)
    sys.exit(1)

for command in [
    ["node","scripts/controlled_environment_routing_outcome_evidence_continuity_test.mjs"],
    ["node","scripts/controlled_environment_routing_outcome_freshness_capacity_review_test.mjs"]
]:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 528 CONTROLLED-ENVIRONMENT ROUTING OUTCOME FRESHNESS & CAPACITY REVIEW AUTHORITY: FAIL")
        print(proc.stderr.strip() or proc.stdout.strip())
        sys.exit(proc.returncode)

print("BUILD 528 CONTROLLED-ENVIRONMENT ROUTING OUTCOME FRESHNESS & CAPACITY REVIEW AUTHORITY: PASS")
print(" - retained Build 518 route/safe-reschedule outcomes are revalidated against current service/site/workflow evidence")
print(" - bounded capacity is dated, attributable, site-matched and historical only")
print(" - successful routing never proves universal indoor capability or future capacity")
print(" - missing/stale/drifted route or capacity evidence remains manual review/HOLD")
print(" - appointment/routing/reschedule/capacity/booking/quote/public-claim/HOLD/schema mutation remains NONE")
