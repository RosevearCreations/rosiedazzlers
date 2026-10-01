#!/usr/bin/env python3
"""Build 527 source authority for Winter Booking & Quote Rule Outcome Freshness Review."""
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

helper=read("functions/api/_lib/winter-booking-quote-rule-outcome-freshness-review.js")
endpoint=read("functions/api/admin/service_economics_commercial_capacity_review.js")
client=read("assets/build473-service-economics-allocation-margin-review-readiness.js")
page=read("admin-service-economics-commercial-capacity-review.html")
copy=read("admin-service-economics-commercial-capacity-review/index.html")
doc=read("BUILD527_WINTER_BOOKING_QUOTE_RULE_OUTCOME_FRESHNESS_REVIEW.md")
roadmap=read("FORWARD_BUILD_ROADMAP_526_535.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
docindex=read("DOC_INDEX.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")
workflow=read(".github/workflows/winter-booking-quote-rule-outcome-freshness-review-authority.yml")

if page!=copy: errors.append("Build 527 protected route copies diverged")
if len(re.findall(r"<h1\b",page,re.I))!=1: errors.append("Build 527 page must retain exactly one H1")

require(helper,["winter_booking_quote_outcome_freshness_build: 527",'winter_booking_quote_outcome_freshness_authority: "winter_booking_quote_rule_outcome_freshness_review"','["controlled_activation_current","retain_hold_current"]','"stale_outcome_review_required"','"applied_rule_drift_review_required"','"runtime_safety_revalidation_required"',"rule_state_may_be_inferred_from_source_or_runtime_green: false",'retained_availability_authority: "/api/availability"','retained_checkout_collision_authority: "checkout_server_side_collision_revalidation"'],"Build 527 helper")
require(endpoint,["buildWinterBookingQuoteRuleOutcomeFreshnessReview",'authority:"winter_booking_quote_rule_outcome_freshness_review"','retained_winter_rule_outcome_authority:"winter_booking_quote_rule_controlled_activation_outcome_continuity"','retained_availability_authority:"/api/availability"'],"Build 527 endpoint")
require(client,["renderWinterBookingQuoteRuleOutcomeFreshnessReview","winterRuleOutcomeFreshnessReviewGrid","Activation current","Applied rule drift","Runtime safety revalidation required"],"Build 527 client")
require(page,['data-build527="winter-booking-quote-rule-outcome-freshness-review"',"Build 527 · Winter Booking &amp; Quote Rule Outcome Freshness Review",'id="winterRuleOutcomeFreshnessReviewGrid"',"Weather-ineligible sessions remain outside ordinary conversion interpretation.","No booking, quote or checkout rule is changed automatically."],"Build 527 page")
require(doc,["# Build 527 — Winter Booking & Quote Rule Outcome Freshness Review","controlled_activation_current","retain_hold_current","stale_outcome_review_required","applied_rule_drift_review_required","runtime_safety_revalidation_required","Build 528 — Controlled-Environment Routing Outcome Freshness & Capacity Review"],"Build 527 contract")
require(roadmap,["### Build 527 — Winter Booking & Quote Rule Outcome Freshness Review","### Build 528 — Controlled-Environment Routing Outcome Freshness & Capacity Review","Weather-ineligible sessions remain outside ordinary conversion interpretation"],"renewed roadmap")
require(queue,["**Build 527 — Winter Booking & Quote Rule Outcome Freshness Review** is the active bounded release.","**Build 528 — Controlled-Environment Routing Outcome Freshness & Capacity Review** is next","BUILD527_WINTER_BOOKING_QUOTE_RULE_OUTCOME_FRESHNESS_REVIEW.md","it has not run out"],"release queue")
require(handoff,["**Build 527 — Winter Booking & Quote Rule Outcome Freshness Review** is the active bounded release.","**Build 528 — Controlled-Environment Routing Outcome Freshness & Capacity Review** is next","BUILD527_WINTER_BOOKING_QUOTE_RULE_OUTCOME_FRESHNESS_REVIEW.md","winter_booking_quote_rule_outcome_freshness_review_check.py"],"project handoff")
require(readme,["Current source direction: **Build 527 — Winter Booking & Quote Rule Outcome Freshness Review**.","BUILD527_WINTER_BOOKING_QUOTE_RULE_OUTCOME_FRESHNESS_REVIEW.md","scripts/winter_booking_quote_rule_outcome_freshness_review_check.py","Production is not considered GREEN from source promotion alone."],"README")
require(blockers,["Seasonal service capability & transparency","Build 527 adds read-only winter booking/quote rule outcome freshness review","weather-ineligible sessions remain outside ordinary conversion interpretation"],"canonical HOLD backlog")
require(docindex,["BUILD527_WINTER_BOOKING_QUOTE_RULE_OUTCOME_FRESHNESS_REVIEW.md","current bounded release contract"],"documentation index")
for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,["python -m py_compile scripts/winter_booking_quote_rule_outcome_freshness_review_check.py","node --check scripts/winter_booking_quote_rule_outcome_freshness_review_test.mjs","node --check functions/api/_lib/winter-booking-quote-rule-outcome-freshness-review.js","python scripts/winter_booking_quote_rule_outcome_freshness_review_check.py","node scripts/winter_booking_quote_rule_outcome_freshness_review_test.mjs"],label)
require(prodcheck,['"winter_booking_quote_rule_outcome_freshness_review"',"scripts/winter_booking_quote_rule_outcome_freshness_review_check.py","scripts/winter_booking_quote_rule_outcome_freshness_review_test.mjs"],"central Production acceptance")
require(workflow,["Winter Booking & Quote Rule Outcome Freshness Review Authority","python scripts/winter_booking_quote_rule_outcome_freshness_review_check.py","node scripts/winter_booking_quote_rule_outcome_freshness_review_test.mjs","Weather-ineligible sessions: EXCLUDED FROM ORDINARY CONVERSION INTERPRETATION","Automatic booking/quote/checkout/HOLD mutation: NONE"],"Build 527 workflow")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])527(?:[^0-9]|$)",p.name)]
if migrations: errors.append("Build 527 must not introduce a schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))
for path in ["functions/api/_lib/winter-booking-quote-rule-outcome-freshness-review.js","functions/api/admin/service_economics_commercial_capacity_review.js","assets/build473-service-economics-allocation-margin-review-readiness.js","scripts/winter_booking_quote_rule_outcome_freshness_review_test.mjs"]:
    proc=subprocess.run(["node","--check",path],cwd=ROOT,text=True,capture_output=True)
    if proc.returncode: errors.append(f"{path} syntax failed: {proc.stderr.strip() or proc.stdout.strip()}")

if errors:
    print("BUILD 527 WINTER BOOKING & QUOTE RULE OUTCOME FRESHNESS REVIEW AUTHORITY: FAIL")
    for error in errors: print(" -",error)
    sys.exit(1)

for command in [["node","scripts/winter_booking_quote_rule_controlled_activation_outcome_continuity_test.mjs"],["node","scripts/winter_booking_quote_rule_outcome_freshness_review_test.mjs"]]:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 527 WINTER BOOKING & QUOTE RULE OUTCOME FRESHNESS REVIEW AUTHORITY: FAIL")
        print(proc.stderr.strip() or proc.stdout.strip())
        sys.exit(proc.returncode)

print("BUILD 527 WINTER BOOKING & QUOTE RULE OUTCOME FRESHNESS REVIEW AUTHORITY: PASS")
print(" - retained Build 517 activation/HOLD outcomes are revalidated against current decision-trace and runtime evidence")
print(" - stale outcome/runtime evidence, service classification drift, wording/rule drift and missing safety revalidation remain manual review")
print(" - /api/availability and checkout collision revalidation remain authoritative")
print(" - weather-ineligible sessions remain outside ordinary conversion interpretation")
print(" - booking/quote/checkout/public-claim/HOLD/schema mutation remains NONE")
