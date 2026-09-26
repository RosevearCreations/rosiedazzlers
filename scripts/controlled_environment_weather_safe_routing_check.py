#!/usr/bin/env python3
"""Build 488 source authority for Controlled-Environment Alternatives & Weather-Safe Routing."""
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

helper=read("functions/api/_lib/controlled-environment-weather-safe-routing.js")
endpoint=read("functions/api/admin/service_economics_commercial_capacity_review.js")
client=read("assets/build473-service-economics-allocation-margin-review-readiness.js")
page=read("admin-service-economics-commercial-capacity-review.html")
copy=read("admin-service-economics-commercial-capacity-review/index.html")
doc=read("BUILD488_CONTROLLED_ENVIRONMENT_ALTERNATIVES_WEATHER_SAFE_ROUTING.md")
roadmap=read("FORWARD_BUILD_ROADMAP_486_495.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
workflow=read(".github/workflows/controlled-environment-weather-safe-routing-authority.yml")
if page!=copy: errors.append("Build 488 protected route copies diverged")
if len(re.findall(r"<h1\b",page,re.I))!=1: errors.append("Build 488 page must retain exactly one H1")
require(helper,[
 "weather_safe_routing_enrichment_build: 488",
 'weather_safe_routing_authority: "controlled_environment_alternatives_weather_safe_routing"',
 "controlled_environment_alternative_available",
 "weather_safe_reschedule_review",
 "controlled_environment_site_confirmation_required",
 "every_service_can_move_indoors: false",
 "missing_controlled_environment_evidence_may_be_inferred: false",
 "automatic_reschedule_allowed: false",
 "automatic_route_change_allowed: false"
],"Build 488 helper")
require(endpoint,["buildControlledEnvironmentWeatherSafeRouting",'authority:"controlled_environment_alternatives_weather_safe_routing"','retained_winter_eligibility_authority:"winter_booking_eligibility_customer_transparency"'],"Build 488 endpoint")
require(client,["renderWeatherSafeRouting","weatherSafeRoutingGrid","Controlled-environment alternative","Do not assume an indoor move"],"Build 488 client")
require(page,[
 'data-build488="controlled-environment-alternatives-weather-safe-routing"',
 "Build 488 · Controlled-Environment Alternatives &amp; Weather-Safe Routing",
 'id="weatherSafeRoutingGrid"',
 "Not every service can move indoors."
],"Build 488 page")
require(doc,[
 "# Build 488 — Controlled-Environment Alternatives & Weather-Safe Routing",
 "Not every service can move indoors.",
 "safe rescheduling",
 "Build 489 — Provider & Local Search Evidence Continuity"
],"Build 488 contract")
require(roadmap,["### Build 488 — Controlled-Environment Alternatives & Weather-Safe Routing","### Build 489 — Provider & Local Search Evidence Continuity"],"renewed roadmap")
require(queue,[
 "**Build 507 — Winter Booking & Quote Rule Controlled Activation Decision** is the active bounded release.",
 "**Build 508 — Controlled-Environment Operational Readiness & Routing Continuity** is next",
 "BUILD488_CONTROLLED_ENVIRONMENT_ALTERNATIVES_WEATHER_SAFE_ROUTING.md",
 "it has not run out"
],"Build 488 queue")
require(handoff,[
 "**Build 507 — Winter Booking & Quote Rule Controlled Activation Decision** is the active bounded release.",
 "BUILD488_CONTROLLED_ENVIRONMENT_ALTERNATIVES_WEATHER_SAFE_ROUTING.md",
 "controlled_environment_weather_safe_routing_check.py"
],"Build 488 handoff")
require(readme,[
 "Current source direction: **Build 507 — Winter Booking & Quote Rule Controlled Activation Decision**.",
 "BUILD488_CONTROLLED_ENVIRONMENT_ALTERNATIVES_WEATHER_SAFE_ROUTING.md",
 "controlled_environment_weather_safe_routing_check.py",
 "Production is not considered GREEN from source promotion alone."
],"Build 488 README")
require(blockers,["Seasonal service capability & transparency","Broad winter-availability claims remain held"],"canonical HOLD backlog")
for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,["python scripts/controlled_environment_weather_safe_routing_check.py","node scripts/controlled_environment_weather_safe_routing_test.mjs"],label)
require(workflow,["Controlled-Environment Weather-Safe Routing Authority","python scripts/controlled_environment_weather_safe_routing_check.py","node scripts/controlled_environment_weather_safe_routing_test.mjs"],"Build 488 workflow")
migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])488(?:[^0-9]|$)",p.name)]
if migrations: errors.append("Build 488 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))
if errors:
    print("BUILD 488 CONTROLLED-ENVIRONMENT ALTERNATIVES & WEATHER-SAFE ROUTING AUTHORITY: FAIL")
    for e in errors: print(" -",e)
    sys.exit(1)
for command in [
 [sys.executable,"scripts/winter_booking_eligibility_customer_transparency_check.py"],
 ["node","scripts/winter_booking_eligibility_customer_transparency_test.mjs"],
 ["node","scripts/controlled_environment_weather_safe_routing_test.mjs"]
]:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 488 CONTROLLED-ENVIRONMENT ALTERNATIVES & WEATHER-SAFE ROUTING AUTHORITY: FAIL")
        print(proc.stderr.strip() or proc.stdout.strip()); sys.exit(proc.returncode)
print("BUILD 488 CONTROLLED-ENVIRONMENT ALTERNATIVES & WEATHER-SAFE ROUTING AUTHORITY: PASS")
