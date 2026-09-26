#!/usr/bin/env python3
"""Build 508 source authority for Controlled-Environment Operational Readiness & Routing Continuity."""
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

helper=read("functions/api/_lib/controlled-environment-operational-readiness-routing-continuity.js")
endpoint=read("functions/api/admin/service_economics_commercial_capacity_review.js")
client=read("assets/build473-service-economics-allocation-margin-review-readiness.js")
page=read("admin-service-economics-commercial-capacity-review.html")
copy=read("admin-service-economics-commercial-capacity-review/index.html")
doc=read("BUILD508_CONTROLLED_ENVIRONMENT_OPERATIONAL_READINESS_ROUTING_CONTINUITY.md")
roadmap=read("FORWARD_BUILD_ROADMAP_506_515.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/controlled-environment-operational-readiness-routing-continuity-authority.yml")

if page!=copy:
    errors.append("Build 508 protected route copies diverged")
if len(re.findall(r"<h1\b",page,re.I))!=1:
    errors.append("Build 508 page must retain exactly one H1")

require(helper,[
    "controlled_environment_operational_readiness_build: 508",
    'controlled_environment_operational_readiness_authority: "controlled_environment_operational_readiness_routing_continuity"',
    "controlled_environment_operational_review_ready",
    "routing_continuity_evidence_required",
    "qualification_or_site_confirmation_required",
    "manual_site_confirmation_required: true",
    "manual_safe_reschedule_preserved: true",
    "automatic_appointment_move_authorized: false",
    "automatic_routing_authorized: false",
    "universal_indoor_capability_authorized: false",
    "operational_review_ready_is_execution_authorization: false"
],"Build 508 helper")

require(endpoint,[
    "buildControlledEnvironmentOperationalReadinessRoutingContinuity",
    'authority:"controlled_environment_operational_readiness_routing_continuity"',
    'retained_site_qualification_authority:"controlled_environment_site_qualification_service_routing_evidence"',
    'retained_controlled_activation_decision_authority:"winter_booking_quote_rule_controlled_activation_decision"'
],"Build 508 endpoint")

require(client,[
    "renderControlledEnvironmentOperationalReadiness",
    "controlledEnvironmentOperationalReadinessGrid",
    "Operational review ready",
    "Manual site confirmation remains required"
],"Build 508 client")

require(page,[
    'data-build508="controlled-environment-operational-readiness-routing-continuity"',
    "Build 508 · Controlled-Environment Operational Readiness &amp; Routing Continuity",
    'id="controlledEnvironmentOperationalReadinessGrid"',
    "Manual site confirmation remains required.",
    "Universal indoor capability remains HOLD."
],"Build 508 page")

require(doc,[
    "# Build 508 — Controlled-Environment Operational Readiness & Routing Continuity",
    "controlled_environment_operational_review_ready",
    "routing_continuity_evidence_required",
    "Build 509 — Provider & Local Search Closure Evidence Continuity Review"
],"Build 508 contract")

require(roadmap,[
    "### Build 508 — Controlled-Environment Operational Readiness & Routing Continuity",
    "### Build 509 — Provider & Local Search Closure Evidence Continuity Review"
],"active roadmap")

require(queue,[
    "**Build 508 — Controlled-Environment Operational Readiness & Routing Continuity** is the active bounded release.",
    "**Build 509 — Provider & Local Search Closure Evidence Continuity Review** is next",
    "BUILD508_CONTROLLED_ENVIRONMENT_OPERATIONAL_READINESS_ROUTING_CONTINUITY.md",
    "it has not run out"
],"Build 508 queue")

require(handoff,[
    "**Build 508 — Controlled-Environment Operational Readiness & Routing Continuity** is the active bounded release.",
    "BUILD508_CONTROLLED_ENVIRONMENT_OPERATIONAL_READINESS_ROUTING_CONTINUITY.md",
    "controlled_environment_operational_readiness_routing_continuity_check.py"
],"Build 508 handoff")

require(readme,[
    "Current source direction: **Build 508 — Controlled-Environment Operational Readiness & Routing Continuity**.",
    "BUILD508_CONTROLLED_ENVIRONMENT_OPERATIONAL_READINESS_ROUTING_CONTINUITY.md",
    "controlled_environment_operational_readiness_routing_continuity_check.py",
    "Production is not considered GREEN from source promotion alone."
],"Build 508 README")

require(blockers,[
    "Seasonal service capability & transparency",
    "Broad winter-availability claims remain held",
    "Build 508 adds a read-only controlled-environment operational-readiness and routing-continuity package"
],"canonical HOLD backlog")

for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
        "python -m py_compile scripts/controlled_environment_operational_readiness_routing_continuity_check.py",
        "node --check scripts/controlled_environment_operational_readiness_routing_continuity_test.mjs",
        "node --check functions/api/_lib/controlled-environment-operational-readiness-routing-continuity.js",
        "python scripts/controlled_environment_operational_readiness_routing_continuity_check.py",
        "node scripts/controlled_environment_operational_readiness_routing_continuity_test.mjs"
    ],label)

require(prodcheck,[
    '"controlled_environment_operational_readiness_routing_continuity"',
    "scripts/controlled_environment_operational_readiness_routing_continuity_check.py",
    "scripts/controlled_environment_operational_readiness_routing_continuity_test.mjs",
    "Validate controlled-environment operational readiness & routing continuity authority"
],"central Production acceptance")

require(workflow,[
    "Controlled-Environment Operational Readiness & Routing Continuity Authority",
    "python scripts/controlled_environment_operational_readiness_routing_continuity_check.py",
    "node scripts/controlled_environment_operational_readiness_routing_continuity_test.mjs",
    "Manual site confirmation: REQUIRED",
    "Automatic appointment move/routing: NONE",
    "Universal indoor capability: HOLD"
],"Build 508 workflow")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])508(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 508 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("BUILD 508 CONTROLLED-ENVIRONMENT OPERATIONAL READINESS & ROUTING CONTINUITY AUTHORITY: FAIL")
    for e in errors:
        print(" -",e)
    sys.exit(1)

for command in [
    [sys.executable,"scripts/controlled_environment_site_qualification_service_routing_evidence_check.py"],
    ["node","scripts/controlled_environment_site_qualification_service_routing_evidence_test.mjs"],
    [sys.executable,"scripts/winter_booking_quote_rule_controlled_activation_decision_check.py"],
    ["node","scripts/winter_booking_quote_rule_controlled_activation_decision_test.mjs"],
    ["node","scripts/controlled_environment_operational_readiness_routing_continuity_test.mjs"]
]:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 508 CONTROLLED-ENVIRONMENT OPERATIONAL READINESS & ROUTING CONTINUITY AUTHORITY: FAIL")
        print(proc.stderr.strip() or proc.stdout.strip())
        sys.exit(proc.returncode)

print("BUILD 508 CONTROLLED-ENVIRONMENT OPERATIONAL READINESS & ROUTING CONTINUITY AUTHORITY: PASS")
print(" - retained site/workflow/equipment/product qualification remains service-specific")
print(" - current routing, manual site-confirmation and safe-reschedule practice evidence is required")
print(" - operational review readiness never moves an appointment or authorizes universal indoor capability")
print(" - exact temperature limits remain source-owned and broad winter availability remains HOLD")
print(" - schema/provider/business/booking/quote/customer-message mutation remains NONE")
