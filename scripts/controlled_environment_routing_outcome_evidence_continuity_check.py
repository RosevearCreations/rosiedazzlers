#!/usr/bin/env python3
"""Build 518 source authority for Controlled-Environment Routing Outcome Evidence Continuity."""
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

helper=read("functions/api/_lib/controlled-environment-routing-outcome-evidence-continuity.js")
endpoint=read("functions/api/admin/service_economics_commercial_capacity_review.js")
client=read("assets/build473-service-economics-allocation-margin-review-readiness.js")
page=read("admin-service-economics-commercial-capacity-review.html")
copy=read("admin-service-economics-commercial-capacity-review/index.html")
doc=read("BUILD518_CONTROLLED_ENVIRONMENT_ROUTING_OUTCOME_EVIDENCE_CONTINUITY.md")
roadmap=read("FORWARD_BUILD_ROADMAP_516_525.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/controlled-environment-routing-outcome-evidence-continuity-authority.yml")

if page!=copy:
    errors.append("Build 518 protected route copies diverged")
if len(re.findall(r"<h1\b",page,re.I))!=1:
    errors.append("Build 518 page must retain exactly one H1")

require(helper,[
    "controlled_environment_routing_outcome_build: 518",
    'controlled_environment_routing_outcome_authority: "controlled_environment_routing_outcome_evidence_continuity"',
    '"route_outcome_observed"',
    '"safe_reschedule_outcome_observed"',
    '"routing_outcome_evidence_conflict"',
    '"outcome_owner_action_required"',
    "routing_outcome_is_observed_not_inferred: true",
    "one_successful_route_proves_universal_indoor_capability: false",
    "one_successful_route_proves_future_capacity: false",
    "automatic_routing_authorized: false",
    "automatic_reschedule_authorized: false"
],"Build 518 helper")

require(endpoint,[
    "buildControlledEnvironmentRoutingOutcomeEvidenceContinuity",
    'authority:"controlled_environment_routing_outcome_evidence_continuity"',
    'retained_predecessor_authority:"winter_booking_quote_rule_controlled_activation_outcome_continuity"',
    'retained_operational_readiness_authority:"controlled_environment_operational_readiness_routing_continuity"'
],"Build 518 endpoint")

require(client,[
    "renderControlledEnvironmentRoutingOutcomeContinuity",
    "controlledEnvironmentRoutingOutcomeContinuityGrid",
    "Route observed",
    "Safe reschedule observed",
    "One successful route does not establish universal indoor capability or future capacity"
],"Build 518 client")

require(page,[
    'data-build518="controlled-environment-routing-outcome-evidence-continuity"',
    "Build 518 · Controlled-Environment Routing Outcome Evidence Continuity",
    'id="controlledEnvironmentRoutingOutcomeContinuityGrid"',
    "Route outcome is observed, never inferred.",
    "One successful route does not establish universal indoor capability or future capacity."
],"Build 518 page")

require(doc,[
    "# Build 518 — Controlled-Environment Routing Outcome Evidence Continuity",
    "route_outcome_observed",
    "safe_reschedule_outcome_observed",
    "routing_outcome_evidence_conflict",
    "outcome_owner_action_required",
    "One successful route does not establish",
    "Build 519 — Provider & Local Search Manual Closure Outcome Continuity"
],"Build 518 contract")

require(roadmap,[
    "### Build 518 — Controlled-Environment Routing Outcome Evidence Continuity",
    "### Build 519 — Provider & Local Search Manual Closure Outcome Continuity",
    "One successful route never establishes universal indoor capability or future capacity"
],"active roadmap")

require(queue,[
    "**Build 518 — Controlled-Environment Routing Outcome Evidence Continuity** is the active bounded release.",
    "**Build 519 — Provider & Local Search Manual Closure Outcome Continuity** is next",
    "BUILD518_CONTROLLED_ENVIRONMENT_ROUTING_OUTCOME_EVIDENCE_CONTINUITY.md",
    "it has not run out"
],"Build 518 queue")

require(handoff,[
    "**Build 518 — Controlled-Environment Routing Outcome Evidence Continuity** is the active bounded release.",
    "BUILD518_CONTROLLED_ENVIRONMENT_ROUTING_OUTCOME_EVIDENCE_CONTINUITY.md",
    "controlled_environment_routing_outcome_evidence_continuity_check.py"
],"Build 518 handoff")

require(readme,[
    "Current source direction: **Build 518 — Controlled-Environment Routing Outcome Evidence Continuity**.",
    "BUILD518_CONTROLLED_ENVIRONMENT_ROUTING_OUTCOME_EVIDENCE_CONTINUITY.md",
    "scripts/controlled_environment_routing_outcome_evidence_continuity_check.py",
    "Production is not considered GREEN from source promotion alone."
],"Build 518 README")

require(blockers,[
    "Seasonal service capability & transparency",
    "Build 518 adds read-only controlled-environment routing outcome evidence continuity",
    "one successful route does not establish universal indoor capability or future capacity"
],"canonical HOLD backlog")

for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
        "python -m py_compile scripts/controlled_environment_routing_outcome_evidence_continuity_check.py",
        "node --check scripts/controlled_environment_routing_outcome_evidence_continuity_test.mjs",
        "node --check functions/api/_lib/controlled-environment-routing-outcome-evidence-continuity.js",
        "python scripts/controlled_environment_routing_outcome_evidence_continuity_check.py",
        "node scripts/controlled_environment_routing_outcome_evidence_continuity_test.mjs"
    ],label)

require(prodcheck,[
    '"controlled_environment_routing_outcome_evidence_continuity"',
    "scripts/controlled_environment_routing_outcome_evidence_continuity_check.py",
    "scripts/controlled_environment_routing_outcome_evidence_continuity_test.mjs"
],"central Production acceptance")

require(workflow,[
    "Controlled-Environment Routing Outcome Evidence Continuity Authority",
    "python scripts/controlled_environment_routing_outcome_evidence_continuity_check.py",
    "node scripts/controlled_environment_routing_outcome_evidence_continuity_test.mjs",
    "Route outcome: OBSERVED, NEVER INFERRED",
    "Current site confirmation for routed outcome: REQUIRED",
    "Safe-reschedule outcome: OBSERVED + ATTRIBUTABLE",
    "Universal indoor capability: HOLD",
    "Future controlled-environment capacity: NOT INFERRED",
    "Automatic route/reschedule/HOLD mutation: NONE"
],"Build 518 workflow")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])518(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 518 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("BUILD 518 CONTROLLED-ENVIRONMENT ROUTING OUTCOME EVIDENCE CONTINUITY AUTHORITY: FAIL")
    for e in errors:
        print(" -",e)
    sys.exit(1)

for command in [
    ["node","scripts/controlled_environment_operational_readiness_routing_continuity_test.mjs"],
    ["node","scripts/winter_booking_quote_rule_controlled_activation_outcome_continuity_test.mjs"],
    ["node","scripts/controlled_environment_routing_outcome_evidence_continuity_test.mjs"]
]:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 518 CONTROLLED-ENVIRONMENT ROUTING OUTCOME EVIDENCE CONTINUITY AUTHORITY: FAIL")
        print(proc.stderr.strip() or proc.stdout.strip())
        sys.exit(proc.returncode)

print("BUILD 518 CONTROLLED-ENVIRONMENT ROUTING OUTCOME EVIDENCE CONTINUITY AUTHORITY: PASS")
print(" - route and safe-reschedule outcomes are observed from explicit dated attributable evidence only")
print(" - retained service/site qualification and current site confirmation remain authoritative")
print(" - missing or stale site/workflow/equipment/product evidence remains manual review")
print(" - one successful route does not establish universal indoor capability or future capacity")
print(" - automatic route/reschedule/booking/quote/customer/HOLD/schema mutation remains NONE")
