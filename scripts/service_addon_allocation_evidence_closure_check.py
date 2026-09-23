#!/usr/bin/env python3
"""Build 483 source authority for Service & Add-On Allocation Evidence Closure."""
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
helper=read("functions/api/_lib/service-addon-allocation-evidence-closure.js")
endpoint=read("functions/api/admin/service_economics_commercial_capacity_review.js")
asset=read("assets/build473-service-economics-allocation-margin-review-readiness.js")
page=read("admin-service-economics-commercial-capacity-review.html")
copy=read("admin-service-economics-commercial-capacity-review/index.html")
doc=read("BUILD483_SERVICE_ADDON_ALLOCATION_EVIDENCE_CLOSURE.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
source_gate=read(".github/workflows/development-source-gate.yml")
prod_gate=read(".github/workflows/production-business-acceptance-authority.yml")
workflow=read(".github/workflows/service-addon-allocation-evidence-closure-authority.yml")
if page!=copy: errors.append("Build 483 protected route copies diverged")
require(helper,[
 "allocation_closure_enrichment_build:483",
 'allocation_closure_authority:"service_addon_allocation_evidence_closure"',
 "service_package_gaps:serviceGaps","add_on_gaps:addOnGaps",
 "cold_snap_capable","temperature_limited_outdoor","controlled_environment_required",
 "inferred_temperature_threshold_allowed:false",
 "seasonal_operability_is_separate_from_margin:true",
 "automatic_public_winter_claim_allowed:false"
],"Build 483 helper")
require(endpoint,[
 "buildServiceAddOnAllocationEvidenceClosure",
 'authority:"service_addon_allocation_evidence_closure"',
 'retained_allocation_authority:"service_economics_allocation_margin_review_readiness"'
],"Build 483 endpoint")
require(asset,["renderClosure","Allocation evidence closure","Seasonal operability"],"Build 483 client")
require(page,[
 'data-build483="service-addon-allocation-evidence-closure"',
 "Build 483 · Service &amp; Add-On Allocation Evidence Closure",
 'id="closureGrid"','id="seasonalGrid"',
 "Exact working-temperature limits require explicit product, equipment, site or process evidence."
],"Build 483 page")
require(doc,[
 "# Build 483 — Service & Add-On Allocation Evidence Closure",
 "Never invent allocation from booking totals, percentages, equal splits or price weighting.",
 "cold-snap-capable",
 "Build 484 — Reliability, Cost & Recovery Evidence Continuity"
],"Build 483 contract")
require(queue,[
 "BUILD483_SERVICE_ADDON_ALLOCATION_EVIDENCE_CLOSURE.md",
 "**Build 488 — Controlled-Environment Alternatives & Weather-Safe Routing** is the active bounded release.",
 "**Build 489 — Provider & Local Search Evidence Continuity** is next",
 "it has not run out"
],"retained Build 483 queue")
require(handoff,[
 "BUILD483_SERVICE_ADDON_ALLOCATION_EVIDENCE_CLOSURE.md",
 "service_addon_allocation_evidence_closure_check.py",
 "**Build 488 — Controlled-Environment Alternatives & Weather-Safe Routing** is the active bounded release."
],"retained Build 483 handoff")
require(readme,[
 "BUILD483_SERVICE_ADDON_ALLOCATION_EVIDENCE_CLOSURE.md",
 "service_addon_allocation_evidence_closure_check.py",
 "Current source direction: **Build 488 — Controlled-Environment Alternatives & Weather-Safe Routing**.",
 "Production is not considered GREEN from source promotion alone."
],"retained Build 483 README")
for text,label in [(source_gate,"Development Source Gate"),(prod_gate,"Production Business Acceptance")]:
    require(text,["python scripts/service_addon_allocation_evidence_closure_check.py","node scripts/service_addon_allocation_evidence_closure_test.mjs"],label)
require(workflow,[
 "Service Add-On Allocation Evidence Closure Authority",
 "python scripts/service_addon_allocation_evidence_closure_check.py",
 "node scripts/service_addon_allocation_evidence_closure_test.mjs"
],"Build 483 workflow")
migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])483(?:[^0-9]|$)",p.name)]
if migrations: errors.append("Build 483 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))
if errors:
    print("BUILD 483 SERVICE ADD-ON ALLOCATION EVIDENCE CLOSURE AUTHORITY: FAIL")
    for error in errors: print(" -",error)
    sys.exit(1)
for command in [
 [sys.executable,"scripts/service_economics_allocation_margin_review_readiness_check.py"],
 ["node","scripts/service_economics_allocation_margin_review_readiness_test.mjs"],
 ["node","scripts/service_addon_allocation_evidence_closure_test.mjs"]
]:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 483 SERVICE ADD-ON ALLOCATION EVIDENCE CLOSURE AUTHORITY: FAIL")
        print(proc.stderr.strip() or proc.stdout.strip()); sys.exit(proc.returncode)
print("BUILD 483 SERVICE ADD-ON ALLOCATION EVIDENCE CLOSURE AUTHORITY: PASS")
