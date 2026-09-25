#!/usr/bin/env python3
"""Build 498 source authority for Controlled-Environment Site Qualification & Service Routing Evidence."""
from pathlib import Path
import re, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def read(path):
    p=ROOT/path
    if not p.is_file(): errors.append(f"missing required file: {path}"); return ""
    return p.read_text(encoding="utf-8",errors="ignore")
def require(text,needles,label):
    for needle in needles:
        if needle not in text: errors.append(f"{label} missing {needle!r}")

helper=read("functions/api/_lib/controlled-environment-site-qualification-service-routing-evidence.js")
endpoint=read("functions/api/admin/service_economics_commercial_capacity_review.js")
client=read("assets/build473-service-economics-allocation-margin-review-readiness.js")
page=read("admin-service-economics-commercial-capacity-review.html")
copy=read("admin-service-economics-commercial-capacity-review/index.html")
doc=read("BUILD498_CONTROLLED_ENVIRONMENT_SITE_QUALIFICATION_SERVICE_ROUTING_EVIDENCE.md")
roadmap=read("FORWARD_BUILD_ROADMAP_496_505.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
workflow=read(".github/workflows/controlled-environment-site-qualification-service-routing-evidence-authority.yml")
if page!=copy: errors.append("Build 498 protected route copies diverged")
if len(re.findall(r"<h1\b",page,re.I))!=1: errors.append("Build 498 page must retain exactly one H1")
require(helper,[
 "controlled_environment_site_qualification_build: 498",
 'controlled_environment_site_qualification_authority: "controlled_environment_site_qualification_service_routing_evidence"',
 "qualification_requires_site_workflow_equipment_product_evidence: true",
 "controlled_environment_site_qualified",
 "controlled_environment_route_review_ready",
 "manual_safe_reschedule_review",
 "controlled_environment_site_confirmation_required",
 "universal_indoor_capability_authorized: false",
 "automatic_appointment_move_authorized: false",
 "one_qualified_service_proves_universal_indoor_capability: false"
],"Build 498 helper")
require(endpoint,[
 "buildControlledEnvironmentSiteQualificationServiceRoutingEvidence",
 'authority:"controlled_environment_site_qualification_service_routing_evidence"',
 'retained_activation_readiness_authority:"winter_booking_quote_rule_activation_readiness"'
],"Build 498 endpoint")
require(client,[
 "renderControlledEnvironmentSiteQualification",
 "controlledEnvironmentSiteQualificationGrid",
 "Site qualified",
 "Universal indoor capability: HOLD"
],"Build 498 client")
require(page,[
 'data-build498="controlled-environment-site-qualification-service-routing-evidence"',
 "Build 498 · Controlled-Environment Site Qualification &amp; Service Routing Evidence",
 'id="controlledEnvironmentSiteQualificationGrid"',
 "requires current attributable site, workflow, equipment and product evidence",
 "No appointment is moved automatically."
],"Build 498 page")
require(doc,[
 "# Build 498 — Controlled-Environment Site Qualification & Service Routing Evidence",
 "site suitability",
 "workflow support",
 "equipment compatibility",
 "product compatibility",
 "Build 499 — Provider & Local Search Outcome Evidence Refresh"
],"Build 498 contract")
require(roadmap,[
 "### Build 498 — Controlled-Environment Site Qualification & Service Routing Evidence",
 "### Build 499 — Provider & Local Search Outcome Evidence Refresh"
],"active roadmap")
require(queue,[
 "**Build 501 — Maintenance & Fleet Pilot Outcome Continuity Review** is the active bounded release.",
 "**Build 502 — Booking & Quote Experiment Outcome Interpretation** is next",
 "BUILD498_CONTROLLED_ENVIRONMENT_SITE_QUALIFICATION_SERVICE_ROUTING_EVIDENCE.md",
 "it has not run out"
],"Build 498 queue")
require(handoff,[
 "**Build 501 — Maintenance & Fleet Pilot Outcome Continuity Review** is the active bounded release.",
 "BUILD498_CONTROLLED_ENVIRONMENT_SITE_QUALIFICATION_SERVICE_ROUTING_EVIDENCE.md",
 "controlled_environment_site_qualification_service_routing_evidence_check.py"
],"Build 498 handoff")
require(readme,[
 "Current source direction: **Build 501 — Maintenance & Fleet Pilot Outcome Continuity Review**.",
 "BUILD498_CONTROLLED_ENVIRONMENT_SITE_QUALIFICATION_SERVICE_ROUTING_EVIDENCE.md",
 "controlled_environment_site_qualification_service_routing_evidence_check.py",
 "Production is not considered GREEN from source promotion alone."
],"Build 498 README")
require(blockers,[
 "Seasonal service capability & transparency",
 "Broad winter-availability claims remain held",
 "Build 498 adds read-only controlled-environment site qualification and service-routing evidence"
],"canonical HOLD backlog")
for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
      "python scripts/controlled_environment_site_qualification_service_routing_evidence_check.py",
      "node scripts/controlled_environment_site_qualification_service_routing_evidence_test.mjs"
    ],label)
require(workflow,[
 "Controlled-Environment Site Qualification & Service Routing Evidence Authority",
 "python scripts/controlled_environment_site_qualification_service_routing_evidence_check.py",
 "node scripts/controlled_environment_site_qualification_service_routing_evidence_test.mjs",
 "Site + workflow + equipment + product evidence: REQUIRED",
 "Automatic appointment move: NONE",
 "Universal indoor capability claim: HOLD"
],"Build 498 workflow")
migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])498(?:[^0-9]|$)",p.name)]
if migrations: errors.append("Build 498 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))
if errors:
    print("BUILD 498 CONTROLLED-ENVIRONMENT SITE QUALIFICATION & SERVICE ROUTING EVIDENCE AUTHORITY: FAIL")
    for e in errors: print(" -",e)
    sys.exit(1)
for command in [
 [sys.executable,"scripts/winter_booking_quote_rule_activation_readiness_check.py"],
 ["node","scripts/winter_booking_quote_rule_activation_readiness_test.mjs"],
 [sys.executable,"scripts/controlled_environment_weather_safe_routing_check.py"],
 ["node","scripts/controlled_environment_weather_safe_routing_test.mjs"],
 ["node","scripts/controlled_environment_site_qualification_service_routing_evidence_test.mjs"]
]:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 498 CONTROLLED-ENVIRONMENT SITE QUALIFICATION & SERVICE ROUTING EVIDENCE AUTHORITY: FAIL")
        print(proc.stderr.strip() or proc.stdout.strip()); sys.exit(proc.returncode)
print("BUILD 498 CONTROLLED-ENVIRONMENT SITE QUALIFICATION & SERVICE ROUTING EVIDENCE AUTHORITY: PASS")
