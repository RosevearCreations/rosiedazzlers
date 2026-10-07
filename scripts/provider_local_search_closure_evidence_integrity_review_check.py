#!/usr/bin/env python3
"""Build 539 source authority for Provider & Local Search Closure Evidence Integrity Review."""
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

helper=read("functions/api/_lib/provider-local-search-closure-evidence-integrity-review.js")
endpoint=read("functions/api/admin/provider_local_search_evidence_continuity.js")
client=read("assets/build450-local-search-measurement-conversion-attribution.js")
page=read("admin-seo-tasks.html"); copy=read("admin-seo-tasks/index.html")
doc=read("BUILD539_PROVIDER_LOCAL_SEARCH_CLOSURE_EVIDENCE_INTEGRITY_REVIEW.md")
roadmap=read("FORWARD_BUILD_ROADMAP_536_545.md"); queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md"); readme=read("README.md"); blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
docindex=read("DOC_INDEX.md"); dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/provider-local-search-closure-evidence-integrity-review-authority.yml")

if page!=copy: errors.append("Build 539 protected route copies diverged")
if len(re.findall(r"<h1\b",page,re.I))!=1: errors.append("Build 539 page must retain exactly one H1")

require(helper,[
    "provider_local_search_closure_integrity_build: 539",
    'provider_local_search_closure_integrity_authority: "provider_local_search_closure_evidence_integrity_review"',
    '"closure_integrity_current"',
    '"retained_freshness_review_required"',
    '"provider_source_identity_review_required"',
    '"provider_source_identity_drift_review_required"',
    '"local_search_identity_review_required"',
    '"local_search_identity_drift_review_required"',
    '"operator_review_identity_review_required"',
    '"operator_review_identity_drift_review_required"',
    '"integrity_source_unavailable"',
    "first_party_context_used_as_provider_or_local_search_substitute: false",
    "source_or_runtime_green_may_manufacture_missing_identity: false",
    "ranking_outcome_inferred: false",
    "booking_conversion_causation_inferred: false",
    "persistent_telemetry: false"
],"Build 539 helper")

require(endpoint,[
    "buildProviderLocalSearchClosureEvidenceIntegrityReview",
    "provider_local_search_closure_integrity_build: 539",
    'provider_local_search_closure_integrity_authority: "provider_local_search_closure_evidence_integrity_review"',
    "provider_local_search_closure_evidence_integrity_review: closureIntegrity"
],"Build 539 endpoint")

require(client,[
    "renderProviderLocalSearchClosureIntegrity539",
    "localProviderClosureIntegrity539",
    "Provider source trace",
    "Search Console / GBP property-location-window trace",
    "Ranking / demand / conversion causation"
],"Build 539 client")

require(page,[
    'data-build539="provider-local-search-closure-evidence-integrity-review"',
    "Build 539 · Provider &amp; Local Search Closure Evidence Integrity Review",
    'id="localProviderClosureIntegrity539"',
    "exact provider source trace",
    "First-party context remains separate descriptive evidence"
],"Build 539 page")

require(doc,[
    "# Build 539 — Provider & Local Search Closure Evidence Integrity Review",
    "closure_integrity_current",
    "provider_source_identity_review_required",
    "local_search_identity_review_required",
    "operator_review_identity_review_required",
    "First-party",
    "Build 540 — Recovery & Authenticated Device Closure Evidence Integrity Review"
],"Build 539 contract")

require(roadmap,[
    "### Build 539 — Provider & Local Search Closure Evidence Integrity Review",
    "### Build 540 — Recovery & Authenticated Device Closure Evidence Integrity Review",
    "ranking, demand and conversion causation are not inferred",
    "Storage and mutation rule"
],"renewed roadmap")

require(queue,[
    "**Build 539 — Provider & Local Search Closure Evidence Integrity Review** is the active bounded release.",
    "**Build 540 — Recovery & Authenticated Device Closure Evidence Integrity Review** is next",
    "BUILD539_PROVIDER_LOCAL_SEARCH_CLOSURE_EVIDENCE_INTEGRITY_REVIEW.md",
    "it has not run out",
    "Production deployment/runtime/business acceptance"
],"release queue")

require(handoff,[
    "**Build 539 — Provider & Local Search Closure Evidence Integrity Review** is the active bounded release.",
    "**Build 540 — Recovery & Authenticated Device Closure Evidence Integrity Review** is next",
    "BUILD539_PROVIDER_LOCAL_SEARCH_CLOSURE_EVIDENCE_INTEGRITY_REVIEW.md",
    "provider_local_search_closure_evidence_integrity_review_check.py",
    "Production deployment/runtime/business acceptance must independently prove that exact SHA."
],"project handoff")

require(readme,[
    "Current source direction: **Build 539 — Provider & Local Search Closure Evidence Integrity Review**.",
    "BUILD539_PROVIDER_LOCAL_SEARCH_CLOSURE_EVIDENCE_INTEGRITY_REVIEW.md",
    "scripts/provider_local_search_closure_evidence_integrity_review_check.py",
    "Production is not considered GREEN from source promotion alone."
],"README")

require(blockers,[
    "Build 539 adds read-only provider/local-search closure evidence integrity review",
    "ranking, demand or booking-conversion causation",
    "No provider/payment/refund/message"
],"canonical HOLD backlog")

require(docindex,[
    "BUILD539_PROVIDER_LOCAL_SEARCH_CLOSURE_EVIDENCE_INTEGRITY_REVIEW.md",
    "current bounded release contract"
],"documentation index")

for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
        "python -m py_compile scripts/provider_local_search_closure_evidence_integrity_review_check.py",
        "node --check scripts/provider_local_search_closure_evidence_integrity_review_test.mjs",
        "node --check functions/api/_lib/provider-local-search-closure-evidence-integrity-review.js",
        "python scripts/provider_local_search_closure_evidence_integrity_review_check.py",
        "node scripts/provider_local_search_closure_evidence_integrity_review_test.mjs"
    ],label)

require(prodcheck,[
    '"provider_local_search_closure_evidence_integrity_review"',
    "scripts/provider_local_search_closure_evidence_integrity_review_check.py",
    "scripts/provider_local_search_closure_evidence_integrity_review_test.mjs"
],"central Production acceptance")

require(workflow,[
    "Provider & Local Search Closure Evidence Integrity Review Authority",
    "python scripts/provider_local_search_closure_evidence_integrity_review_check.py",
    "node scripts/provider_local_search_closure_evidence_integrity_review_test.mjs",
    "Provider/payment/refund/message source trace: EXACT OR REVIEW",
    "Search Console / GBP property-location-window trace: EXACT OR REVIEW",
    "Explicit manual operator review: CURRENT + TRACE-MATCHED OR REVIEW",
    "Supabase/schema/storage/persistent telemetry growth: NONE"
],"Build 539 workflow")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])539(?:[^0-9]|$)",p.name)]
if migrations: errors.append("Build 539 must not introduce a schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

for path in [
    "functions/api/_lib/provider-local-search-closure-evidence-integrity-review.js",
    "functions/api/admin/provider_local_search_evidence_continuity.js",
    "assets/build450-local-search-measurement-conversion-attribution.js",
    "scripts/provider_local_search_closure_evidence_integrity_review_test.mjs"
]:
    proc=subprocess.run(["node","--check",path],cwd=ROOT,text=True,capture_output=True)
    if proc.returncode: errors.append(f"{path} syntax failed: {proc.stderr.strip() or proc.stdout.strip()}")

if errors:
    print("BUILD 539 PROVIDER & LOCAL SEARCH CLOSURE EVIDENCE INTEGRITY REVIEW AUTHORITY: FAIL")
    for error in errors: print(" -",error)
    sys.exit(1)

for command in [
    ["node","scripts/provider_local_search_closure_evidence_freshness_review_test.mjs"],
    ["node","scripts/provider_local_search_closure_evidence_integrity_review_test.mjs"]
]:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 539 PROVIDER & LOCAL SEARCH CLOSURE EVIDENCE INTEGRITY REVIEW AUTHORITY: FAIL")
        print(proc.stderr.strip() or proc.stdout.strip())
        sys.exit(proc.returncode)

print("BUILD 539 PROVIDER & LOCAL SEARCH CLOSURE EVIDENCE INTEGRITY REVIEW AUTHORITY: PASS")
print(" - Build 529 freshness remains the retained authority")
print(" - provider/payment/refund/message source identity is exact or fails closed to review/HOLD")
print(" - Search Console property / GBP location / dated window identity is exact or fails closed")
print(" - explicit operator review must remain current and trace-matched")
print(" - first-party context stays separate descriptive evidence; ranking/demand/conversion causation is never inferred")
print(" - provider/booking/publication/HOLD/Supabase/schema/storage/persistent-telemetry mutation remains NONE")
