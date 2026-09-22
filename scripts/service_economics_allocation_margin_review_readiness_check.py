#!/usr/bin/env python3
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
def read(path): return (ROOT / path).read_text(encoding="utf-8")
def require(text, needles, label):
    for needle in needles:
        if needle not in text:
            raise SystemExit(f"{label}: missing required marker: {needle}")

lib=read("functions/api/_lib/service-economics-allocation-margin-review-readiness.js")
endpoint=read("functions/api/admin/service_economics_commercial_capacity_review.js")
asset=read("assets/build473-service-economics-allocation-margin-review-readiness.js")
page=read("admin-service-economics-commercial-capacity-review.html")
route=read("admin-service-economics-commercial-capacity-review/index.html")
doc=read("BUILD473_SERVICE_ECONOMICS_ALLOCATION_MARGIN_REVIEW_READINESS.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
source_gate=read(".github/workflows/development-source-gate.yml")
production_gate=read(".github/workflows/production-business-acceptance-authority.yml")
workflow=read(".github/workflows/service-economics-allocation-margin-review-readiness-authority.yml")
if page != route: raise SystemExit("Build 473 protected route copies diverged")
require(lib,["allocation_enrichment_build: 473",'allocation_authority: "service_economics_allocation_margin_review_readiness"',"recorded_booking_to_package_linkage","recorded_explicit_add_on_linkage","booking_level_total_reallocation_allowed: false","overhead_allocation_margin_claim_allowed: false","add_on_margin_without_explicit_row_linkage_allowed: false","aggregate_add_on_flags_prove_allocation: false"],"Build 473 library")
require(endpoint,["buildServiceEconomicsAllocationMarginReviewReadiness",'authority:"service_economics_allocation_margin_review_readiness"','retained_authority:"service_economics_completeness_addon_cost_readiness"'],"Build 473 endpoint")
require(asset,["Booking-total split, equal split, price-weighted split","No background monitoring is running."],"Build 473 client")
require(page,['data-build473="service-economics-allocation-margin-review-readiness"',"Build 473 · Service Economics Allocation &amp; Margin Review Readiness",'id="allocationGrid"',"/assets/build473-service-economics-allocation-margin-review-readiness.js","Estimated overhead is not used"],"Build 473 page")
require(doc,["# Build 473 — Service Economics Allocation & Margin Review Readiness","Aggregate booleans, a booking total, package price, add-on count or percentage assumption do not prove add-on allocation.","Source promotion alone is never Production GREEN.","Build 474 — Reliability, Cost & Resilience Trend Review"],"Build 473 contract")
require(queue,["BUILD473_SERVICE_ECONOMICS_ALLOCATION_MARGIN_REVIEW_READINESS.md","FORWARD_BUILD_ROADMAP_466_475.md","it has not run out"],"retained Build 473 queue authority")
require(handoff,["BUILD473_SERVICE_ECONOMICS_ALLOCATION_MARGIN_REVIEW_READINESS.md","provider-owned billing/CPU","real Production recovery"],"retained Build 473 handoff authority")
for text,label in [(source_gate,"Development Source Gate"),(production_gate,"Production Business Acceptance")]:
    require(text,["python scripts/service_economics_allocation_margin_review_readiness_check.py","node scripts/service_economics_allocation_margin_review_readiness_test.mjs"],label)
require(workflow,["Service Economics Allocation Margin Review Readiness Authority","python scripts/service_economics_allocation_margin_review_readiness_check.py","node scripts/service_economics_allocation_margin_review_readiness_test.mjs"],"Build 473 workflow")
print("BUILD 473 SERVICE ECONOMICS ALLOCATION MARGIN REVIEW READINESS CHECK: PASS")
