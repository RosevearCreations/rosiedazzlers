#!/usr/bin/env python3
"""Build 519 source authority for Provider & Local Search Manual Closure Outcome Continuity."""
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

helper=read("functions/api/_lib/provider-local-search-manual-closure-outcome-continuity.js")
endpoint=read("functions/api/admin/provider_local_search_evidence_continuity.js")
client=read("assets/build450-local-search-measurement-conversion-attribution.js")
page=read("admin-seo-tasks.html")
copy=read("admin-seo-tasks/index.html")
doc=read("BUILD519_PROVIDER_LOCAL_SEARCH_MANUAL_CLOSURE_OUTCOME_CONTINUITY.md")
roadmap=read("FORWARD_BUILD_ROADMAP_516_525.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
docindex=read("DOC_INDEX.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/provider-local-search-manual-closure-outcome-continuity-authority.yml")

if page!=copy:
    errors.append("Build 519 admin-seo-tasks route copies diverged")
if len(re.findall(r"<h1\b",page,re.I))!=1:
    errors.append("Build 519 page must retain exactly one H1")

require(helper,[
    "manual_closure_outcome_build: 519",
    'manual_closure_outcome_authority: "provider_local_search_manual_closure_outcome_continuity"',
    '"manual_closure_outcome_observed"',
    '"manual_hold_retained_observed"',
    '"manual_closure_operator_outcome_required"',
    '"manual_closure_evidence_conflict"',
    "matching_fresh_provider_payment_refund_message_evidence_required: true",
    "explicit_operator_reviewed_manual_hold_outcome_required: true",
    "automatic_canonical_hold_narrowing_performed: false",
    "first_party_context_remains_separate_descriptive_evidence: true",
    "hold_inventory_mutated: false"
],"Build 519 helper")
require(endpoint,[
    "buildProviderLocalSearchManualClosureOutcomeContinuity",
    "manual_closure_outcome_build: 519",
    'manual_closure_outcome_authority: "provider_local_search_manual_closure_outcome_continuity"',
    "provider_local_search_manual_closure_outcome_continuity",
    '"X-Rosie-Provider-Local-Search-Manual-Closure":"build-519-read-only"',
    "manual_hold_outcome: null",
    "GET,HEAD,OPTIONS"
],"Build 519 endpoint")
for forbidden in ["onRequestPost","onRequestPatch","onRequestDelete","onRequestPut"]:
    if forbidden in endpoint:
        errors.append(f"Build 519 endpoint contains forbidden mutation handler {forbidden!r}")

require(client,[
    "renderProviderLocalSearchManualClosureOutcome519",
    "localProviderManualClosureOutcome519",
    "Build 519 manual closure outcome continuity",
    "Explicit operator-reviewed manual HOLD outcome",
    "Automatic canonical HOLD narrowing"
],"Build 519 client")
require(page,[
    'data-build519="provider-local-search-manual-closure-outcome-continuity"',
    "Build 519 · Provider &amp; Local Search Manual Closure Outcome Continuity",
    'id="localProviderManualClosureOutcome519"',
    "Explicit operator-reviewed manual HOLD outcome",
    "No canonical HOLD is narrowed automatically."
],"Build 519 page")
require(doc,[
    "# Build 519 — Provider & Local Search Manual Closure Outcome Continuity",
    "manual_closure_outcome_observed",
    "manual_hold_retained_observed",
    "manual_closure_operator_outcome_required",
    "manual_closure_evidence_conflict",
    "Build 520 — Recovery Drill & Authenticated Device Manual Closure Outcome Continuity"
],"Build 519 contract")
require(roadmap,[
    "### Build 519 — Provider & Local Search Manual Closure Outcome Continuity",
    "### Build 520 — Recovery Drill & Authenticated Device Manual Closure Outcome Continuity",
    "explicit operator-reviewed manual HOLD outcome"
],"active roadmap")
require(queue,[
    "**Build 519 — Provider & Local Search Manual Closure Outcome Continuity** is the active bounded release.",
    "**Build 520 — Recovery Drill & Authenticated Device Manual Closure Outcome Continuity** is next",
    "BUILD519_PROVIDER_LOCAL_SEARCH_MANUAL_CLOSURE_OUTCOME_CONTINUITY.md",
    "it has not run out"
],"Build 519 queue")
require(handoff,[
    "**Build 519 — Provider & Local Search Manual Closure Outcome Continuity** is the active bounded release.",
    "BUILD519_PROVIDER_LOCAL_SEARCH_MANUAL_CLOSURE_OUTCOME_CONTINUITY.md",
    "provider_local_search_manual_closure_outcome_continuity_check.py"
],"Build 519 handoff")
require(readme,[
    "Current source direction: **Build 519 — Provider & Local Search Manual Closure Outcome Continuity**.",
    "BUILD519_PROVIDER_LOCAL_SEARCH_MANUAL_CLOSURE_OUTCOME_CONTINUITY.md",
    "scripts/provider_local_search_manual_closure_outcome_continuity_check.py",
    "Production is not considered GREEN from source promotion alone."
],"Build 519 README")
require(blockers,[
    "Provider outcomes & communications",
    "Local-search provider evidence",
    "Build 519 adds read-only provider/local-search manual closure outcome continuity",
    "No canonical HOLD is narrowed automatically"
],"canonical HOLD backlog")
require(docindex,[
    "BUILD519_PROVIDER_LOCAL_SEARCH_MANUAL_CLOSURE_OUTCOME_CONTINUITY.md",
    "current bounded release contract"
],"documentation index")

for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
        "python -m py_compile scripts/provider_local_search_manual_closure_outcome_continuity_check.py",
        "node --check scripts/provider_local_search_manual_closure_outcome_continuity_test.mjs",
        "node --check functions/api/_lib/provider-local-search-manual-closure-outcome-continuity.js",
        "python scripts/provider_local_search_manual_closure_outcome_continuity_check.py",
        "node scripts/provider_local_search_manual_closure_outcome_continuity_test.mjs"
    ],label)

require(prodcheck,[
    '"provider_local_search_manual_closure_outcome_continuity"',
    "scripts/provider_local_search_manual_closure_outcome_continuity_check.py",
    "scripts/provider_local_search_manual_closure_outcome_continuity_test.mjs"
],"central Production acceptance")
require(workflow,[
    "Provider & Local Search Manual Closure Outcome Continuity Authority",
    "python scripts/provider_local_search_manual_closure_outcome_continuity_check.py",
    "node scripts/provider_local_search_manual_closure_outcome_continuity_test.mjs",
    "Operator-reviewed manual HOLD outcome: EXPLICIT + TRACE-MATCHED REQUIRED",
    "First-party context: SEPARATE DESCRIPTIVE EVIDENCE",
    "Automatic canonical HOLD narrowing: NONE"
],"Build 519 workflow")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])519(?:[^0-9]|$)",p.name)]
if migrations:
    errors.append("Build 519 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("BUILD 519 PROVIDER & LOCAL SEARCH MANUAL CLOSURE OUTCOME CONTINUITY AUTHORITY: FAIL")
    for e in errors:
        print(" -",e)
    sys.exit(1)

for command in [
    ["node","scripts/provider_local_search_manual_closure_outcome_continuity_test.mjs"],
    [sys.executable,"scripts/provider_local_search_closure_evidence_continuity_review_check.py"],
    ["node","scripts/provider_local_search_closure_evidence_continuity_review_test.mjs"],
    [sys.executable,"scripts/provider_local_search_outcome_evidence_refresh_check.py"],
    ["node","scripts/provider_local_search_outcome_evidence_refresh_test.mjs"],
    [sys.executable,"scripts/provider_local_search_evidence_continuity_check.py"],
    ["node","scripts/provider_local_search_evidence_continuity_test.mjs"]
]:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 519 PROVIDER & LOCAL SEARCH MANUAL CLOSURE OUTCOME CONTINUITY AUTHORITY: FAIL")
        print(proc.stderr.strip() or proc.stdout.strip())
        sys.exit(proc.returncode)

print("BUILD 519 PROVIDER & LOCAL SEARCH MANUAL CLOSURE OUTCOME CONTINUITY AUTHORITY: PASS")
print(" - fresh provider/payment/refund/message evidence and matching Search Console/GBP windows remain required")
print(" - explicit operator-reviewed manual HOLD outcome must match the current combined evidence trace")
print(" - first-party context remains separate descriptive evidence")
print(" - ranking, weather, demand and booking-conversion causation remain unproven")
print(" - automatic provider/search/booking/content/HOLD/schema mutation remains NONE")
