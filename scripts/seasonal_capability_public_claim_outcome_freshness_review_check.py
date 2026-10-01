#!/usr/bin/env python3
"""Build 526 source authority for Seasonal Capability & Public Claim Outcome Freshness Review."""
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

helper=read("functions/api/_lib/seasonal-capability-public-claim-outcome-freshness-review.js")
endpoint=read("functions/api/admin/service_economics_commercial_capacity_review.js")
client=read("assets/build473-service-economics-allocation-margin-review-readiness.js")
page=read("admin-service-economics-commercial-capacity-review.html")
copy=read("admin-service-economics-commercial-capacity-review/index.html")
doc=read("BUILD526_SEASONAL_CAPABILITY_PUBLIC_CLAIM_OUTCOME_FRESHNESS_REVIEW.md")
roadmap=read("FORWARD_BUILD_ROADMAP_526_535.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
docindex=read("DOC_INDEX.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/seasonal-capability-public-claim-outcome-freshness-review-authority.yml")

if page!=copy: errors.append("Build 526 protected route copies diverged")
if len(re.findall(r"<h1\b",page,re.I))!=1: errors.append("Build 526 page must retain exactly one H1")

require(helper,["seasonal_public_claim_freshness_build: 526",'seasonal_public_claim_freshness_authority: "seasonal_capability_public_claim_outcome_freshness_review"','["publication_current","retain_hold_current","no_action_current"]','"stale_outcome_review_required"','"source_owned_threshold_change_review_required"','"public_wording_drift_review_required"',"freshness_may_be_inferred_from_source_or_runtime_green: false","broad_winter_availability_authorized: false","source_owned_temperature_limit_may_be_widened: false"],"Build 526 helper")
require(endpoint,["buildSeasonalCapabilityPublicClaimOutcomeFreshnessReview",'authority:"seasonal_capability_public_claim_outcome_freshness_review"','retained_public_claim_outcome_authority:"seasonal_capability_public_claim_decision_outcome_continuity"','retained_controlled_environment_routing_outcome_authority:"controlled_environment_routing_outcome_evidence_continuity"'],"Build 526 endpoint")
require(client,["renderSeasonalPublicClaimOutcomeFreshnessReview","seasonalPublicClaimOutcomeFreshnessReviewGrid","Publication current","Stale outcome review required","Source-owned threshold changed"],"Build 526 client")
require(page,['data-build526="seasonal-capability-public-claim-outcome-freshness-review"',"Build 526 · Seasonal Capability &amp; Public Claim Outcome Freshness Review",'id="seasonalPublicClaimOutcomeFreshnessReviewGrid"',"Stale evidence never extends a public claim.","Broad winter availability remains HOLD."],"Build 526 page")
require(doc,["# Build 526 — Seasonal Capability & Public Claim Outcome Freshness Review","publication_current","retain_hold_current","no_action_current","stale_outcome_review_required","source_owned_threshold_change_review_required","public_wording_drift_review_required","Build 527 — Winter Booking & Quote Rule Outcome Freshness Review"],"Build 526 contract")
require(roadmap,["### Build 526 — Seasonal Capability & Public Claim Outcome Freshness Review","### Build 527 — Winter Booking & Quote Rule Outcome Freshness Review","Detect stale wording, evidence drift and source-owned threshold changes"],"renewed roadmap")
require(queue,["**Build 526 — Seasonal Capability & Public Claim Outcome Freshness Review** is the active bounded release.","**Build 527 — Winter Booking & Quote Rule Outcome Freshness Review** is next","BUILD526_SEASONAL_CAPABILITY_PUBLIC_CLAIM_OUTCOME_FRESHNESS_REVIEW.md","it has not run out"],"release queue")
require(handoff,["**Build 526 — Seasonal Capability & Public Claim Outcome Freshness Review** is the active bounded release.","**Build 527 — Winter Booking & Quote Rule Outcome Freshness Review** is next","BUILD526_SEASONAL_CAPABILITY_PUBLIC_CLAIM_OUTCOME_FRESHNESS_REVIEW.md","seasonal_capability_public_claim_outcome_freshness_review_check.py"],"project handoff")
require(readme,["Current source direction: **Build 526 — Seasonal Capability & Public Claim Outcome Freshness Review**.","BUILD526_SEASONAL_CAPABILITY_PUBLIC_CLAIM_OUTCOME_FRESHNESS_REVIEW.md","scripts/seasonal_capability_public_claim_outcome_freshness_review_check.py","Production is not considered GREEN from source promotion alone."],"README")
require(blockers,["Seasonal service capability & transparency","Build 526 adds read-only seasonal public-claim outcome freshness review","stale evidence never widens a public claim"],"canonical HOLD backlog")
require(docindex,["BUILD526_SEASONAL_CAPABILITY_PUBLIC_CLAIM_OUTCOME_FRESHNESS_REVIEW.md","current bounded release contract"],"documentation index")

for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,["python -m py_compile scripts/seasonal_capability_public_claim_outcome_freshness_review_check.py","node --check scripts/seasonal_capability_public_claim_outcome_freshness_review_test.mjs","node --check functions/api/_lib/seasonal-capability-public-claim-outcome-freshness-review.js","python scripts/seasonal_capability_public_claim_outcome_freshness_review_check.py","node scripts/seasonal_capability_public_claim_outcome_freshness_review_test.mjs"],label)
require(prodcheck,['"seasonal_capability_public_claim_outcome_freshness_review"',"scripts/seasonal_capability_public_claim_outcome_freshness_review_check.py","scripts/seasonal_capability_public_claim_outcome_freshness_review_test.mjs"],"central Production acceptance")
require(workflow,["Seasonal Capability & Public Claim Outcome Freshness Review Authority","python scripts/seasonal_capability_public_claim_outcome_freshness_review_check.py","node scripts/seasonal_capability_public_claim_outcome_freshness_review_test.mjs","Stale outcome evidence: REVIEW, NEVER EXTEND CLAIM","Broad winter availability: HOLD","Automatic publication/booking/quote/HOLD mutation: NONE"],"Build 526 workflow")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])526(?:[^0-9]|$)",p.name)]
if migrations: errors.append("Build 526 must not introduce a schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))
for path in ["functions/api/_lib/seasonal-capability-public-claim-outcome-freshness-review.js","functions/api/admin/service_economics_commercial_capacity_review.js","assets/build473-service-economics-allocation-margin-review-readiness.js","scripts/seasonal_capability_public_claim_outcome_freshness_review_test.mjs"]:
    proc=subprocess.run(["node","--check",path],cwd=ROOT,text=True,capture_output=True)
    if proc.returncode: errors.append(f"{path} syntax failed: {proc.stderr.strip() or proc.stdout.strip()}")
if errors:
    print("BUILD 526 SEASONAL CAPABILITY & PUBLIC CLAIM OUTCOME FRESHNESS REVIEW AUTHORITY: FAIL")
    for error in errors: print(" -",error)
    sys.exit(1)
for command in [["node","scripts/seasonal_capability_public_claim_decision_outcome_continuity_test.mjs"],["node","scripts/seasonal_capability_public_claim_outcome_freshness_review_test.mjs"]]:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 526 SEASONAL CAPABILITY & PUBLIC CLAIM OUTCOME FRESHNESS REVIEW AUTHORITY: FAIL")
        print(proc.stderr.strip() or proc.stdout.strip()); sys.exit(proc.returncode)
print("BUILD 526 SEASONAL CAPABILITY & PUBLIC CLAIM OUTCOME FRESHNESS REVIEW AUTHORITY: PASS")
print(" - dated publication / retain-HOLD / no-action outcomes are revalidated against current owning evidence")
print(" - stale outcomes, explicit wording drift and source-owned threshold changes remain manual review")
print(" - stale evidence never widens a public claim or becomes broad winter availability")
print(" - source/runtime GREEN never substitutes for freshness evidence")
print(" - schema/provider/business/booking/quote/publication/HOLD mutation remains NONE")
