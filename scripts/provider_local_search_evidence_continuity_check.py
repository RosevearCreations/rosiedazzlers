#!/usr/bin/env python3
"""Build 489 source authority for Provider & Local Search Evidence Continuity."""
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

helper=read("functions/api/_lib/provider-local-search-evidence-continuity.js")
endpoint=read("functions/api/admin/provider_local_search_evidence_continuity.js")
client=read("assets/build450-local-search-measurement-conversion-attribution.js")
page=read("admin-seo-tasks.html")
copy=read("admin-seo-tasks/index.html")
doc=read("BUILD489_PROVIDER_LOCAL_SEARCH_EVIDENCE_CONTINUITY.md")
roadmap=read("FORWARD_BUILD_ROADMAP_486_495.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
workflow=read(".github/workflows/provider-local-search-evidence-continuity-authority.yml")

if page!=copy: errors.append("Build 489 admin-seo-tasks route copies diverged")
if len(re.findall(r"<h1\b",page,re.I))!=1: errors.append("Build 489 page must retain exactly one H1")
require(helper,[
 "continuity_enrichment_build: 489",
 'continuity_authority: "provider_local_search_evidence_continuity"',
 "provider_outcome_identity_and_date_required: true",
 "local_search_property_or_location_identity_required: true",
 "local_search_equal_length_distinct_windows_required: true",
 "cross_family_identity_join_performed: false",
 "search_or_referral_movement_is_weather_causation: false",
 "local_search_metric_movement_causes_booking_conversion: false",
 "provider_snapshot_write_performed: false",
 "permanent_polling: false"
],"Build 489 helper")
require(endpoint,[
 "getProviderEvidence","getLocalSearch","buildProviderLocalSearchEvidenceContinuity",
 '"X-Rosie-Provider-Local-Search-Continuity":"build-489-read-only"',
 "GET,HEAD,OPTIONS"
],"Build 489 endpoint")
require(client,[
 "/api/admin/provider_local_search_evidence_continuity",
 "renderProviderLocalSearchContinuity489",
 "localProviderContinuity489",
 "Separate provider populations"
],"Build 489 client")
require(page,[
 'data-build489="provider-local-search-evidence-continuity"',
 "Build 489 · Provider &amp; Local Search Evidence Continuity",
 'id="localProviderContinuity489"',
 "Seasonal messaging or referral movement does not prove ranking, weather causation or booking causation."
],"Build 489 page")
require(doc,[
 "# Build 489 — Provider & Local Search Evidence Continuity",
 "same property/location identity",
 "Search Console and Google Business Profile",
 "weather causation",
 "Build 490 — Recovery & Authenticated Device Evidence Continuity"
],"Build 489 contract")
require(roadmap,["### Build 489 — Provider & Local Search Evidence Continuity","### Build 490 — Recovery & Authenticated Device Evidence Continuity"],"renewed roadmap")
require(queue,[
 "**Build 492 — Booking & Quote Controlled Experiment Execution Evidence** is the active bounded release.",
 "**Build 493 — Staff & Mobile Remediation Outcome Evidence** is next",
 "BUILD489_PROVIDER_LOCAL_SEARCH_EVIDENCE_CONTINUITY.md",
 "it has not run out"
],"Build 489 queue")
require(handoff,[
 "**Build 492 — Booking & Quote Controlled Experiment Execution Evidence** is the active bounded release.",
 "BUILD489_PROVIDER_LOCAL_SEARCH_EVIDENCE_CONTINUITY.md",
 "provider_local_search_evidence_continuity_check.py"
],"Build 489 handoff")
require(readme,[
 "Current source direction: **Build 492 — Booking & Quote Controlled Experiment Execution Evidence**.",
 "BUILD489_PROVIDER_LOCAL_SEARCH_EVIDENCE_CONTINUITY.md",
 "provider_local_search_evidence_continuity_check.py",
 "Production is not considered GREEN from source promotion alone."
],"Build 489 README")
require(blockers,["Provider outcomes & communications","Local-search provider evidence","Seasonal service capability & transparency"],"canonical HOLD backlog")
for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,["python scripts/provider_local_search_evidence_continuity_check.py","node scripts/provider_local_search_evidence_continuity_test.mjs"],label)
require(workflow,["Provider & Local Search Evidence Continuity Authority","python scripts/provider_local_search_evidence_continuity_check.py","node scripts/provider_local_search_evidence_continuity_test.mjs"],"Build 489 workflow")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])489(?:[^0-9]|$)",p.name)]
if migrations: errors.append("Build 489 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))
if errors:
    print("BUILD 489 PROVIDER & LOCAL SEARCH EVIDENCE CONTINUITY AUTHORITY: FAIL")
    for e in errors: print(" -",e)
    sys.exit(1)
for command in [
 [sys.executable,"scripts/local_search_provider_snapshot_continuity_descriptive_review_check.py"],
 ["node","scripts/local_search_provider_snapshot_continuity_descriptive_review_test.mjs"],
 [sys.executable,"scripts/provider_hold_decision_traceability_closure_review_check.py"],
 ["node","scripts/provider_hold_decision_traceability_closure_review_test.mjs"],
 ["node","scripts/provider_local_search_evidence_continuity_test.mjs"]
]:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 489 PROVIDER & LOCAL SEARCH EVIDENCE CONTINUITY AUTHORITY: FAIL")
        print(proc.stderr.strip() or proc.stdout.strip()); sys.exit(proc.returncode)
print("BUILD 489 PROVIDER & LOCAL SEARCH EVIDENCE CONTINUITY AUTHORITY: PASS")
