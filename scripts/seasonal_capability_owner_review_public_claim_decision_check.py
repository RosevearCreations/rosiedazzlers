#!/usr/bin/env python3
"""Build 496 source authority for Seasonal Capability Owner Review & Public Claim Decision."""
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

helper=read("functions/api/_lib/seasonal-capability-owner-review-public-claim-decision.js")
endpoint=read("functions/api/admin/service_economics_commercial_capacity_review.js")
client=read("assets/build473-service-economics-allocation-margin-review-readiness.js")
page=read("admin-service-economics-commercial-capacity-review.html")
copy=read("admin-service-economics-commercial-capacity-review/index.html")
doc=read("BUILD496_SEASONAL_CAPABILITY_OWNER_REVIEW_PUBLIC_CLAIM_DECISION.md")
roadmap=read("FORWARD_BUILD_ROADMAP_496_505.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
workflow=read(".github/workflows/seasonal-capability-owner-review-public-claim-decision-authority.yml")
if page!=copy: errors.append("Build 496 protected route copies diverged")
if len(re.findall(r"<h1\b",page,re.I))!=1: errors.append("Build 496 page must retain exactly one H1")
require(helper,[
 "seasonal_owner_review_enrichment_build: 496",
 'seasonal_owner_review_authority: "seasonal_capability_owner_review_public_claim_decision"',
 "approve_public_claim_review","hold_public_claim","publication_review_ready",
 "owner_review_required","owner_hold",
 "broad_winter_availability_claim_authorized: false",
 "automatic_publication_authorized: false",
 "missing_owner_review_may_be_inferred: false",
 "automatic_publication_allowed: false"
],"Build 496 helper")
require(endpoint,[
 "buildSeasonalCapabilityOwnerReviewPublicClaimDecision",
 'authority:"seasonal_capability_owner_review_public_claim_decision"',
 'retained_weather_safe_routing_authority:"controlled_environment_alternatives_weather_safe_routing"'
],"Build 496 endpoint")
require(client,[
 "renderSeasonalOwnerReview","seasonalOwnerReviewGrid",
 "Publication review ready","Broad winter availability remains HOLD"
],"Build 496 client")
require(page,[
 'data-build496="seasonal-capability-owner-review-public-claim-decision"',
 "Build 496 · Seasonal Capability Owner Review &amp; Public Claim Decision",
 'id="seasonalOwnerReviewGrid"',
 "Nothing here publishes content or changes booking availability automatically."
],"Build 496 page")
require(doc,[
 "# Build 496 — Seasonal Capability Owner Review & Public Claim Decision",
 "publication_review_ready",
 "Exact working-temperature limits remain source-owned",
 "Build 497 — Winter Booking & Quote Rule Activation Readiness"
],"Build 496 contract")
require(roadmap,[
 "### Build 496 — Seasonal Capability Owner Review & Public Claim Decision",
 "### Build 497 — Winter Booking & Quote Rule Activation Readiness"
],"active roadmap")
require(queue,[
 "**Build 498 — Controlled-Environment Site Qualification & Service Routing Evidence** is the active bounded release.",
 "**Build 499 — Provider & Local Search Outcome Evidence Refresh** is next",
 "BUILD496_SEASONAL_CAPABILITY_OWNER_REVIEW_PUBLIC_CLAIM_DECISION.md",
 "it has not run out"
],"Build 496 queue")
require(handoff,[
 "**Build 498 — Controlled-Environment Site Qualification & Service Routing Evidence** is the active bounded release.",
 "BUILD496_SEASONAL_CAPABILITY_OWNER_REVIEW_PUBLIC_CLAIM_DECISION.md",
 "seasonal_capability_owner_review_public_claim_decision_check.py"
],"Build 496 handoff")
require(readme,[
 "Current source direction: **Build 498 — Controlled-Environment Site Qualification & Service Routing Evidence**.",
 "BUILD496_SEASONAL_CAPABILITY_OWNER_REVIEW_PUBLIC_CLAIM_DECISION.md",
 "seasonal_capability_owner_review_public_claim_decision_check.py",
 "Production is not considered GREEN from source promotion alone."
],"Build 496 README")
require(blockers,[
 "Seasonal service capability & transparency",
 "Broad winter-availability claims remain held",
 "Build 496 adds a read-only owner/public-claim decision package"
],"canonical HOLD backlog")
for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
      "python scripts/seasonal_capability_owner_review_public_claim_decision_check.py",
      "node scripts/seasonal_capability_owner_review_public_claim_decision_test.mjs"
    ],label)
require(workflow,[
 "Seasonal Capability Owner Review & Public Claim Decision Authority",
 "python scripts/seasonal_capability_owner_review_public_claim_decision_check.py",
 "node scripts/seasonal_capability_owner_review_public_claim_decision_test.mjs",
 "Broad winter availability: HOLD",
 "Automatic publication: NONE"
],"Build 496 workflow")
migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])496(?:[^0-9]|$)",p.name)]
if migrations: errors.append("Build 496 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))
if errors:
    print("BUILD 496 SEASONAL CAPABILITY OWNER REVIEW & PUBLIC CLAIM DECISION AUTHORITY: FAIL")
    for e in errors: print(" -",e)
    sys.exit(1)
for command in [
 [sys.executable,"scripts/controlled_environment_weather_safe_routing_check.py"],
 ["node","scripts/controlled_environment_weather_safe_routing_test.mjs"],
 ["node","scripts/seasonal_capability_owner_review_public_claim_decision_test.mjs"]
]:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 496 SEASONAL CAPABILITY OWNER REVIEW & PUBLIC CLAIM DECISION AUTHORITY: FAIL")
        print(proc.stderr.strip() or proc.stdout.strip()); sys.exit(proc.returncode)
print("BUILD 496 SEASONAL CAPABILITY OWNER REVIEW & PUBLIC CLAIM DECISION AUTHORITY: PASS")
