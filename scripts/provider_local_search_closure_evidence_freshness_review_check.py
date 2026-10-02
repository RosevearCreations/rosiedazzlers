#!/usr/bin/env python3
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
helper=read("functions/api/_lib/provider-local-search-closure-evidence-freshness-review.js")
endpoint=read("functions/api/admin/provider_local_search_evidence_continuity.js")
client=read("assets/build450-local-search-measurement-conversion-attribution.js")
page=read("admin-seo-tasks.html"); copy=read("admin-seo-tasks/index.html")
doc=read("BUILD529_PROVIDER_LOCAL_SEARCH_CLOSURE_EVIDENCE_FRESHNESS_REVIEW.md")
roadmap=read("FORWARD_BUILD_ROADMAP_526_535.md"); queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md"); readme=read("README.md"); blockers=read("STARTUP_GO_LIVE_BLOCKERS.md"); docindex=read("DOC_INDEX.md")
dev=read(".github/workflows/development-source-gate.yml"); prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py"); workflow=read(".github/workflows/provider-local-search-closure-evidence-freshness-review-authority.yml")
if page!=copy: errors.append("Build 529 admin-seo-tasks route copies diverged")
if len(re.findall(r"<h1\b",page,re.I))!=1: errors.append("Build 529 page must retain exactly one H1")
require(helper,["provider_local_search_closure_freshness_build: 529",'provider_local_search_closure_freshness_authority: "provider_local_search_closure_evidence_freshness_review"','"provider_evidence_current"','"local_search_evidence_current"','"closure_evidence_current_operator_review_required"','"operator_review_freshness_required"',"first_party_context_used_as_provider_substitute: false","stale_evidence_may_be_treated_as_current: false","hold_inventory_mutated: false"],"Build 529 helper")
require(endpoint,["buildProviderLocalSearchClosureEvidenceFreshnessReview","provider_local_search_closure_freshness_build: 529",'provider_local_search_closure_freshness_authority: "provider_local_search_closure_evidence_freshness_review"',"provider_local_search_closure_evidence_freshness_review",'"X-Rosie-Provider-Local-Search-Closure-Freshness":"build-529-read-only"',"GET,HEAD,OPTIONS"],"Build 529 endpoint")
for forbidden in ["onRequestPost","onRequestPatch","onRequestDelete","onRequestPut"]:
    if forbidden in endpoint: errors.append(f"Build 529 endpoint contains forbidden mutation handler {forbidden!r}")
require(client,["renderProviderLocalSearchClosureFreshness529","localProviderClosureFreshness529","Build 529 closure evidence freshness","Provider evidence freshness","Current operator review"],"Build 529 client")
require(page,['data-build529="provider-local-search-closure-evidence-freshness-review"',"Build 529 · Provider &amp; Local Search Closure Evidence Freshness Review",'id="localProviderClosureFreshness529"',"First-party context remains separate descriptive evidence.","Current provider/search evidence without a current explicit operator review is not treated as closed."],"Build 529 page")
require(doc,["# Build 529 — Provider & Local Search Closure Evidence Freshness Review","closure_evidence_current_operator_review_required","operator_review_freshness_required","Build 530 — Recovery & Authenticated Device Closure Evidence Freshness Review"],"Build 529 contract")
require(roadmap,["### Build 529 — Provider & Local Search Closure Evidence Freshness Review","### Build 530 — Recovery & Authenticated Device Closure Evidence Freshness Review","First-party context stays descriptive; ranking, demand and conversion causation are not inferred."],"renewed roadmap")
require(queue,["**Build 529 — Provider & Local Search Closure Evidence Freshness Review** is the active bounded release.","**Build 530 — Recovery & Authenticated Device Closure Evidence Freshness Review** is next","BUILD529_PROVIDER_LOCAL_SEARCH_CLOSURE_EVIDENCE_FRESHNESS_REVIEW.md","it has not run out"],"release queue")
require(handoff,["**Build 529 — Provider & Local Search Closure Evidence Freshness Review** is the active bounded release.","**Build 530 — Recovery & Authenticated Device Closure Evidence Freshness Review** is next","BUILD529_PROVIDER_LOCAL_SEARCH_CLOSURE_EVIDENCE_FRESHNESS_REVIEW.md","provider_local_search_closure_evidence_freshness_review_check.py"],"project handoff")
require(readme,["Current source direction: **Build 529 — Provider & Local Search Closure Evidence Freshness Review**.","BUILD529_PROVIDER_LOCAL_SEARCH_CLOSURE_EVIDENCE_FRESHNESS_REVIEW.md","scripts/provider_local_search_closure_evidence_freshness_review_check.py","Production is not considered GREEN from source promotion alone."],"README")
require(blockers,["Provider outcomes & communications","Local-search provider evidence","Build 529 adds read-only provider/local-search closure evidence freshness review","Current provider/search evidence without a current explicit operator review is not treated as closed"],"canonical HOLD backlog")
require(docindex,["BUILD529_PROVIDER_LOCAL_SEARCH_CLOSURE_EVIDENCE_FRESHNESS_REVIEW.md","current bounded release contract"],"documentation index")
for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,["python -m py_compile scripts/provider_local_search_closure_evidence_freshness_review_check.py","node --check scripts/provider_local_search_closure_evidence_freshness_review_test.mjs","node --check functions/api/_lib/provider-local-search-closure-evidence-freshness-review.js","python scripts/provider_local_search_closure_evidence_freshness_review_check.py","node scripts/provider_local_search_closure_evidence_freshness_review_test.mjs"],label)
require(prodcheck,['"provider_local_search_closure_evidence_freshness_review"',"scripts/provider_local_search_closure_evidence_freshness_review_check.py","scripts/provider_local_search_closure_evidence_freshness_review_test.mjs"],"central Production acceptance")
require(workflow,["Provider & Local Search Closure Evidence Freshness Review Authority","python scripts/provider_local_search_closure_evidence_freshness_review_check.py","node scripts/provider_local_search_closure_evidence_freshness_review_test.mjs","First-party context: SEPARATE DESCRIPTIVE EVIDENCE","Automatic canonical HOLD narrowing: NONE"],"Build 529 workflow")
migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])529(?:[^0-9]|$)",p.name)]
if migrations: errors.append("Build 529 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))
for path in ["functions/api/_lib/provider-local-search-closure-evidence-freshness-review.js","functions/api/admin/provider_local_search_evidence_continuity.js","assets/build450-local-search-measurement-conversion-attribution.js","scripts/provider_local_search_closure_evidence_freshness_review_test.mjs"]:
    proc=subprocess.run(["node","--check",path],cwd=ROOT,text=True,capture_output=True)
    if proc.returncode: errors.append(f"{path} syntax failed: {proc.stderr.strip() or proc.stdout.strip()}")
if errors:
    print("BUILD 529 PROVIDER & LOCAL SEARCH CLOSURE EVIDENCE FRESHNESS REVIEW AUTHORITY: FAIL")
    for error in errors: print(" -",error)
    sys.exit(1)
for command in [["node","scripts/provider_local_search_closure_evidence_freshness_review_test.mjs"],["node","scripts/provider_local_search_manual_closure_outcome_continuity_test.mjs"],["node","scripts/provider_local_search_closure_evidence_continuity_review_test.mjs"],["node","scripts/provider_local_search_outcome_evidence_refresh_test.mjs"],["node","scripts/provider_local_search_evidence_continuity_test.mjs"]]:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 529 PROVIDER & LOCAL SEARCH CLOSURE EVIDENCE FRESHNESS REVIEW AUTHORITY: FAIL")
        print(proc.stderr.strip() or proc.stdout.strip()); sys.exit(proc.returncode)
print("BUILD 529 PROVIDER & LOCAL SEARCH CLOSURE EVIDENCE FRESHNESS REVIEW AUTHORITY: PASS")
