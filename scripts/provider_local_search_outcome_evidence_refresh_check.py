#!/usr/bin/env python3
"""Build 499 source authority for Provider & Local Search Outcome Evidence Refresh."""
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

helper=read("functions/api/_lib/provider-local-search-outcome-evidence-refresh.js")
endpoint=read("functions/api/admin/provider_local_search_evidence_continuity.js")
client=read("assets/build450-local-search-measurement-conversion-attribution.js")
page=read("admin-seo-tasks.html")
copy=read("admin-seo-tasks/index.html")
doc=read("BUILD499_PROVIDER_LOCAL_SEARCH_OUTCOME_EVIDENCE_REFRESH.md")
roadmap=read("FORWARD_BUILD_ROADMAP_496_505.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/provider-local-search-outcome-evidence-refresh-authority.yml")

if page!=copy:
    errors.append("Build 499 admin-seo-tasks route copies diverged")
if len(re.findall(r"<h1\b",page,re.I))!=1:
    errors.append("Build 499 page must retain exactly one H1")

require(helper,[
    "outcome_evidence_refresh_build: 499",
    'outcome_evidence_refresh_authority: "provider_local_search_outcome_evidence_refresh"',
    "stripe_payment","paypal_payment","refund","delivery",
    "search_console","google_business_profile",
    "search_console_property_identity_required: true",
    "google_business_profile_location_identity_required: true",
    "equal_length_distinct_windows_required: true",
    "first_party_context_remains_separate_descriptive_evidence: true",
    "cross_family_identity_join_performed: false",
    "weather_causation_inferred: false",
    "winter_demand_inferred: false",
    "booking_conversion_causation_inferred: false",
    "search_console_or_gbp_write_performed: false",
    "provider_snapshot_write_performed: false",
    "permanent_polling: false"
],"Build 499 helper")
require(endpoint,[
    "buildProviderLocalSearchOutcomeEvidenceRefresh",
    "outcome_evidence_refresh_build: 499",
    'outcome_evidence_refresh_authority: "provider_local_search_outcome_evidence_refresh"',
    "provider_local_search_outcome_evidence_refresh",
    '"X-Rosie-Provider-Local-Search-Outcome-Refresh":"build-499-read-only"',
    "GET,HEAD,OPTIONS"
],"Build 499 endpoint")
for forbidden in ["onRequestPost","onRequestPatch","onRequestDelete","onRequestPut","STRIPE_SECRET_KEY","PAYPAL_CLIENT_SECRET"]:
    if forbidden in endpoint:
        errors.append(f"Build 499 endpoint contains forbidden mutation/secret token {forbidden!r}")

require(client,[
    "renderProviderLocalSearchOutcomeRefresh499",
    "localProviderOutcomeRefresh499",
    "Build 499 outcome evidence refresh",
    "Correct provider/property/location/window sources"
],"Build 499 client")
require(page,[
    'data-build499="provider-local-search-outcome-evidence-refresh"',
    "Build 499 · Provider &amp; Local Search Outcome Evidence Refresh",
    'id="localProviderOutcomeRefresh499"',
    "First-party referral/funnel context remains separate descriptive evidence."
],"Build 499 page")
require(doc,[
    "# Build 499 — Provider & Local Search Outcome Evidence Refresh",
    "Stripe payment outcome","PayPal payment outcome",
    "Search Console requires the correct property identity",
    "Google Business Profile requires the correct location identity",
    "Build 500 — Recovery Drill & Authenticated Device Observation Execution Evidence"
],"Build 499 contract")
require(roadmap,[
    "### Build 499 — Provider & Local Search Outcome Evidence Refresh",
    "### Build 500 — Recovery Drill & Authenticated Device Observation Execution Evidence"
],"active roadmap")
require(queue,[
    "**Build 509 — Provider & Local Search Closure Evidence Continuity Review** is the active bounded release.",
    "**Build 510 — Recovery Drill & Authenticated Device Closure Review** is next",
    "BUILD499_PROVIDER_LOCAL_SEARCH_OUTCOME_EVIDENCE_REFRESH.md",
    "it has not run out"
],"Build 499 queue")
require(handoff,[
    "**Build 509 — Provider & Local Search Closure Evidence Continuity Review** is the active bounded release.",
    "BUILD499_PROVIDER_LOCAL_SEARCH_OUTCOME_EVIDENCE_REFRESH.md",
    "provider_local_search_outcome_evidence_refresh_check.py"
],"Build 499 handoff")
require(readme,[
    "Current source direction: **Build 509 — Provider & Local Search Closure Evidence Continuity Review**.",
    "BUILD499_PROVIDER_LOCAL_SEARCH_OUTCOME_EVIDENCE_REFRESH.md",
    "provider_local_search_outcome_evidence_refresh_check.py",
    "Production is not considered GREEN from source promotion alone."
],"Build 499 README")
require(blockers,[
    "Provider outcomes & communications","Local-search provider evidence","Build 499",
    "correct provider/property/location/window"
],"canonical HOLD backlog")
for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
        "python -m py_compile scripts/provider_local_search_outcome_evidence_refresh_check.py",
        "node --check functions/api/_lib/provider-local-search-outcome-evidence-refresh.js",
        "node --check scripts/provider_local_search_outcome_evidence_refresh_test.mjs",
        "python scripts/provider_local_search_outcome_evidence_refresh_check.py",
        "node scripts/provider_local_search_outcome_evidence_refresh_test.mjs"
    ],label)
require(prodcheck,[
    '"provider_local_search_outcome_evidence_refresh"',
    "scripts/provider_local_search_outcome_evidence_refresh_check.py",
    "scripts/provider_local_search_outcome_evidence_refresh_test.mjs",
    "Validate provider & local search outcome evidence refresh authority"
],"Production business acceptance source authority")
require(workflow,[
    "Provider & Local Search Outcome Evidence Refresh Authority",
    "provider-local-search-outcome-evidence-refresh",
    "provider_local_search_outcome_evidence_refresh_check.py",
    "provider_local_search_outcome_evidence_refresh_test.mjs"
],"Build 499 workflow")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])499(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 499 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("BUILD 499 PROVIDER & LOCAL SEARCH OUTCOME EVIDENCE REFRESH AUTHORITY: FAIL")
    for e in errors:
        print(" -",e)
    sys.exit(1)

for command in [
    ["node","scripts/provider_local_search_outcome_evidence_refresh_test.mjs"],
    [sys.executable,"scripts/provider_local_search_evidence_continuity_check.py"],
    ["node","scripts/provider_local_search_evidence_continuity_test.mjs"],
    [sys.executable,"scripts/local_search_provider_snapshot_continuity_descriptive_review_check.py"],
    ["node","scripts/local_search_provider_snapshot_continuity_descriptive_review_test.mjs"],
    [sys.executable,"scripts/provider_hold_decision_traceability_closure_review_check.py"],
    ["node","scripts/provider_hold_decision_traceability_closure_review_test.mjs"]
]:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 499 PROVIDER & LOCAL SEARCH OUTCOME EVIDENCE REFRESH AUTHORITY: FAIL")
        print(proc.stderr.strip() or proc.stdout.strip())
        sys.exit(proc.returncode)

print("BUILD 499 PROVIDER & LOCAL SEARCH OUTCOME EVIDENCE REFRESH AUTHORITY: PASS")
print(" - payment/refund/message outcomes require current attributable retained provider sources")
print(" - Search Console property and GBP location identity plus equal-length distinct windows are required")
print(" - first-party referral/funnel context remains a separate descriptive population")
print(" - ranking, weather, winter demand, service availability and booking causation are never inferred")
print(" - no provider/payment/message/search write, schema/storage mutation, customer outreach or permanent polling")
