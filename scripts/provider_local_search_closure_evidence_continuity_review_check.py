#!/usr/bin/env python3
"""Build 509 source authority for Provider & Local Search Closure Evidence Continuity Review."""
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

helper=read("functions/api/_lib/provider-local-search-closure-evidence-continuity-review.js")
endpoint=read("functions/api/admin/provider_local_search_evidence_continuity.js")
client=read("assets/build450-local-search-measurement-conversion-attribution.js")
page=read("admin-seo-tasks.html")
copy=read("admin-seo-tasks/index.html")
doc=read("BUILD509_PROVIDER_LOCAL_SEARCH_CLOSURE_EVIDENCE_CONTINUITY_REVIEW.md")
roadmap=read("FORWARD_BUILD_ROADMAP_506_515.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/provider-local-search-closure-evidence-continuity-review-authority.yml")

if page!=copy:
    errors.append("Build 509 admin-seo-tasks route copies diverged")
if len(re.findall(r"<h1\b",page,re.I))!=1:
    errors.append("Build 509 page must retain exactly one H1")

require(helper,[
    "closure_evidence_continuity_review_build: 509",
    'closure_evidence_continuity_review_authority: "provider_local_search_closure_evidence_continuity_review"',
    "closure_evidence_continuity_review_ready",
    "provider_closure_evidence_review_ready",
    "local_search_closure_evidence_review_ready",
    "matching_provider_property_location_window_sources_required: true",
    "first_party_context_used_as_provider_substitute: false",
    "manual_hold_update_required: true",
    "automatic_hold_closure_performed: false",
    "weather_causation_inferred: false",
    "booking_conversion_causation_inferred: false",
    "hold_inventory_mutated: false"
],"Build 509 helper")

require(endpoint,[
    "buildProviderLocalSearchClosureEvidenceContinuityReview",
    "closure_evidence_continuity_review_build: 509",
    'closure_evidence_continuity_review_authority: "provider_local_search_closure_evidence_continuity_review"',
    "provider_local_search_closure_evidence_continuity_review",
    '"X-Rosie-Provider-Local-Search-Closure-Review":"build-509-read-only"',
    "GET,HEAD,OPTIONS"
],"Build 509 endpoint")
for forbidden in ["onRequestPost","onRequestPatch","onRequestDelete","onRequestPut","STRIPE_SECRET_KEY","PAYPAL_CLIENT_SECRET"]:
    if forbidden in endpoint:
        errors.append(f"Build 509 endpoint contains forbidden mutation/secret token {forbidden!r}")

require(client,[
    "renderProviderLocalSearchClosureReview509",
    "localProviderClosureReview509",
    "Build 509 closure evidence continuity review",
    "Manual source-owned closure review remains required"
],"Build 509 client")
require(page,[
    'data-build509="provider-local-search-closure-evidence-continuity-review"',
    "Build 509 · Provider &amp; Local Search Closure Evidence Continuity Review",
    'id="localProviderClosureReview509"',
    "First-party context remains separate descriptive evidence."
],"Build 509 page")
require(doc,[
    "# Build 509 — Provider & Local Search Closure Evidence Continuity Review",
    "provider_closure_evidence_review_ready",
    "correct Search Console property identity",
    "correct Google Business Profile location identity",
    "Build 510 — Recovery Drill & Authenticated Device Closure Review"
],"Build 509 contract")
require(roadmap,[
    "### Build 509 — Provider & Local Search Closure Evidence Continuity Review",
    "### Build 510 — Recovery Drill & Authenticated Device Closure Review"
],"active roadmap")
require(queue,[
    "**Build 509 — Provider & Local Search Closure Evidence Continuity Review** is the active bounded release.",
    "**Build 510 — Recovery Drill & Authenticated Device Closure Review** is next",
    "BUILD509_PROVIDER_LOCAL_SEARCH_CLOSURE_EVIDENCE_CONTINUITY_REVIEW.md",
    "it has not run out"
],"Build 509 queue")
require(handoff,[
    "**Build 509 — Provider & Local Search Closure Evidence Continuity Review** is the active bounded release.",
    "BUILD509_PROVIDER_LOCAL_SEARCH_CLOSURE_EVIDENCE_CONTINUITY_REVIEW.md",
    "provider_local_search_closure_evidence_continuity_review_check.py"
],"Build 509 handoff")
require(readme,[
    "Current source direction: **Build 509 — Provider & Local Search Closure Evidence Continuity Review**.",
    "BUILD509_PROVIDER_LOCAL_SEARCH_CLOSURE_EVIDENCE_CONTINUITY_REVIEW.md",
    "provider_local_search_closure_evidence_continuity_review_check.py",
    "Production is not considered GREEN from source promotion alone."
],"Build 509 README")
require(blockers,[
    "Provider outcomes & communications",
    "Local-search provider evidence",
    "Build 509",
    "manual source-owned closure review"
],"canonical HOLD backlog")

for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
        "python -m py_compile scripts/provider_local_search_closure_evidence_continuity_review_check.py",
        "node --check scripts/provider_local_search_closure_evidence_continuity_review_test.mjs",
        "node --check functions/api/_lib/provider-local-search-closure-evidence-continuity-review.js",
        "python scripts/provider_local_search_closure_evidence_continuity_review_check.py",
        "node scripts/provider_local_search_closure_evidence_continuity_review_test.mjs"
    ],label)
require(prodcheck,[
    '"provider_local_search_closure_evidence_continuity_review"',
    "scripts/provider_local_search_closure_evidence_continuity_review_check.py",
    "scripts/provider_local_search_closure_evidence_continuity_review_test.mjs",
    "Validate provider & local search closure evidence continuity review authority"
],"Production business acceptance source authority")
require(workflow,[
    "Provider & Local Search Closure Evidence Continuity Review Authority",
    "provider-local-search-closure-evidence-continuity-review",
    "provider_local_search_closure_evidence_continuity_review_check.py",
    "provider_local_search_closure_evidence_continuity_review_test.mjs",
    "Automatic HOLD closure: NONE"
],"Build 509 workflow")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])509(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 509 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("BUILD 509 PROVIDER & LOCAL SEARCH CLOSURE EVIDENCE CONTINUITY REVIEW AUTHORITY: FAIL")
    for e in errors:
        print(" -",e)
    sys.exit(1)

for command in [
    ["node","scripts/provider_local_search_closure_evidence_continuity_review_test.mjs"],
    [sys.executable,"scripts/provider_local_search_outcome_evidence_refresh_check.py"],
    ["node","scripts/provider_local_search_outcome_evidence_refresh_test.mjs"],
    [sys.executable,"scripts/provider_local_search_evidence_continuity_check.py"],
    ["node","scripts/provider_local_search_evidence_continuity_test.mjs"]
]:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 509 PROVIDER & LOCAL SEARCH CLOSURE EVIDENCE CONTINUITY REVIEW AUTHORITY: FAIL")
        print(proc.stderr.strip() or proc.stdout.strip())
        sys.exit(proc.returncode)

print("BUILD 509 PROVIDER & LOCAL SEARCH CLOSURE EVIDENCE CONTINUITY REVIEW AUTHORITY: PASS")
print(" - provider closure review requires all four current attributable provider-owned outcomes plus retained traceability")
print(" - Search Console property and GBP location require matching identities and equal-length distinct dated windows")
print(" - first-party context remains separate descriptive evidence and never substitutes for provider evidence")
print(" - manual source-owned closure review remains required; canonical HOLDs are not changed automatically")
print(" - ranking, weather, winter demand, service availability and booking-conversion causation remain unproven")
