#!/usr/bin/env python3
"""Build 486 source authority for Cold-Weather Service Capability Evidence Matrix."""
from pathlib import Path
import re, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def read(path):
    p=ROOT/path
    if not p.is_file():
        errors.append(f"missing required file: {path}"); return ""
    return p.read_text(encoding="utf-8",errors="ignore")
def require(text,needles,label):
    for needle in needles:
        if needle not in text: errors.append(f"{label} missing {needle!r}")

helper=read("functions/api/_lib/cold-weather-service-capability-evidence-matrix.js")
endpoint=read("functions/api/admin/service_economics_commercial_capacity_review.js")
client=read("assets/build473-service-economics-allocation-margin-review-readiness.js")
page=read("admin-service-economics-commercial-capacity-review.html")
copy=read("admin-service-economics-commercial-capacity-review/index.html")
doc=read("BUILD486_COLD_WEATHER_SERVICE_CAPABILITY_EVIDENCE_MATRIX.md")
roadmap=read("FORWARD_BUILD_ROADMAP_486_495.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
source_gate=read(".github/workflows/development-source-gate.yml")
prod_gate=read(".github/workflows/production-business-acceptance-authority.yml")
workflow=read(".github/workflows/cold-weather-service-capability-evidence-matrix-authority.yml")
if page!=copy: errors.append("Build 486 protected route copies diverged")
if len(re.findall(r"<h1\b",page,re.I))!=1: errors.append("Build 486 page must retain exactly one H1")
require(helper,[
 "cold_weather_capability_enrichment_build: 486",
 'cold_weather_capability_authority: "cold_weather_service_capability_evidence_matrix"',
 "cold_snap_capable","temperature_limited_outdoor","controlled_environment_required",
 "service","product","equipment","site","process",
 "broad_winter_availability_claim_supported_by_matrix_presence: false",
 "missing_temperature_limit_may_be_inferred: false",
 "automatic_booking_availability_change_allowed: false"
],"Build 486 helper")
require(endpoint,[
 "buildColdWeatherServiceCapabilityEvidenceMatrix",
 'authority:"cold_weather_service_capability_evidence_matrix"',
 'retained_seasonal_authority:"service_addon_allocation_evidence_closure"'
],"Build 486 endpoint")
require(client,["renderColdWeatherCapabilityMatrix","capabilityMatrixGrid","Source-owned limit","Broad winter claim: HOLD"],"Build 486 client")
require(page,[
 'data-build486="cold-weather-service-capability-evidence-matrix"',
 "Build 486 · Cold-Weather Service Capability Evidence Matrix",
 'id="capabilityMatrixGrid"',
 "Weather forecasts, booking demand, margin and application uptime do not prove service capability."
],"Build 486 page")
require(doc,[
 "# Build 486 — Cold-Weather Service Capability Evidence Matrix",
 "service/product/equipment/site/process evidence",
 "No invented threshold",
 "Build 487 — Winter Booking Eligibility & Customer Transparency"
],"Build 486 contract")
require(roadmap,[
 "### Build 486 — Cold-Weather Service Capability Evidence Matrix",
 "### Build 487 — Winter Booking Eligibility & Customer Transparency"
],"renewed roadmap")
require(queue,[
 "**Build 504 — Service Economics, Seasonal Capacity & Reliability Trend Continuity** is the active bounded release.",
 "**Build 505 — Production Learning & Roadmap Renewal** is next",
 "BUILD486_COLD_WEATHER_SERVICE_CAPABILITY_EVIDENCE_MATRIX.md",
 "it has not run out"
],"Build 486 queue")
require(handoff,[
 "**Build 504 — Service Economics, Seasonal Capacity & Reliability Trend Continuity** is the active bounded release.",
 "BUILD486_COLD_WEATHER_SERVICE_CAPABILITY_EVIDENCE_MATRIX.md",
 "cold_weather_service_capability_evidence_matrix_check.py"
],"retained Build 486 handoff")
require(readme,[
 "Current source direction: **Build 504 — Service Economics, Seasonal Capacity & Reliability Trend Continuity**.",
 "BUILD486_COLD_WEATHER_SERVICE_CAPABILITY_EVIDENCE_MATRIX.md",
 "cold_weather_service_capability_evidence_matrix_check.py",
 "Production is not considered GREEN from source promotion alone."
],"Build 486 README")
require(blockers,["Seasonal service capability & transparency","Broad winter-availability claims remain held"],"canonical HOLD backlog")
for text,label in [(source_gate,"Development Source Gate"),(prod_gate,"Production Business Acceptance")]:
    require(text,["python scripts/cold_weather_service_capability_evidence_matrix_check.py","node scripts/cold_weather_service_capability_evidence_matrix_test.mjs"],label)
require(workflow,[
 "Cold-Weather Service Capability Evidence Matrix Authority",
 "python scripts/cold_weather_service_capability_evidence_matrix_check.py",
 "node scripts/cold_weather_service_capability_evidence_matrix_test.mjs"
],"Build 486 workflow")
migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])486(?:[^0-9]|$)",p.name)]
if migrations: errors.append("Build 486 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))
if errors:
    print("BUILD 486 COLD-WEATHER SERVICE CAPABILITY EVIDENCE MATRIX AUTHORITY: FAIL")
    for e in errors: print(" -",e)
    sys.exit(1)
for command in [
 [sys.executable,"scripts/service_addon_allocation_evidence_closure_check.py"],
 ["node","scripts/service_addon_allocation_evidence_closure_test.mjs"],
 ["node","scripts/cold_weather_service_capability_evidence_matrix_test.mjs"]
]:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 486 COLD-WEATHER SERVICE CAPABILITY EVIDENCE MATRIX AUTHORITY: FAIL")
        print(proc.stderr.strip() or proc.stdout.strip()); sys.exit(proc.returncode)
print("BUILD 486 COLD-WEATHER SERVICE CAPABILITY EVIDENCE MATRIX AUTHORITY: PASS")
