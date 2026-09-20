#!/usr/bin/env python3
"""Build 453 source authority for Service Economics, Capacity & Pricing Review."""
from pathlib import Path
import re, subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
errors=[]
def read(path):
    target=ROOT/path
    if not target.is_file():
        errors.append(f"missing required file: {path}")
        return ""
    return target.read_text(encoding="utf-8",errors="ignore")
def require(text,needles,label):
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing {needle!r}")

helper=read("functions/api/_lib/service-economics-commercial-capacity-review.js")
endpoint=read("functions/api/admin/service_economics_commercial_capacity_review.js")
page=read("admin-service-economics-commercial-capacity-review.html")
route=read("admin-service-economics-commercial-capacity-review/index.html")
client=read("assets/build453-service-economics-capacity-pricing-review.js")
test=read("scripts/service_economics_capacity_pricing_review_test.mjs")
contract=read("BUILD453_SERVICE_ECONOMICS_CAPACITY_PRICING_REVIEW.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")

if page!=route:
    errors.append("Build 453 .html and folder-index routes must remain byte-identical")
if len(re.findall(r"<h1\b",page,re.I))!=1:
    errors.append("Build 453 page must retain exactly one H1")

require(helper,[
    "build:453",
    'authority:"service_economics_capacity_pricing_review"',
    "retained_authorities:[428,443,451]",
    "service_package_cohorts",
    'add_on_cost_attribution_status:"unavailable"',
    "add_on_margin_inferred:false",
    "sufficient_value_band_count",
    "causal_price_sensitivity_claimed:false",
    "service_margin_to_quote_band_join:false",
    "missing_material_labor_cash_refund_cogs_blocks_margin:true",
    "demand_proves_capacity:false",
    "add_on_cost_inference_allowed:false",
    "automatic_price_change_allowed:false",
    "automatic_discount_allowed:false"
],"Build 453 helper")
for forbidden in ("customer_name","customer_email","raw_quote_identifier"):
    if forbidden in helper:
        errors.append(f"Build 453 helper exposes forbidden identity token {forbidden!r}")

require(endpoint,[
    'capability:"manage_staff"',
    "getAccountingStatement","getFleetLearning","getPricingLearning",
    'collect("pricing_learning"',
    "buildServiceEconomicsCapacityPricingReview",
    'authority:"service_economics_capacity_pricing_review"',
    "onRequestPost","onRequestPut","onRequestPatch","onRequestDelete"
],"Build 453 endpoint")
for forbidden in ("SUPABASE_SERVICE_ROLE_KEY","setInterval("):
    if forbidden in endpoint:
        errors.append(f"Build 453 endpoint contains forbidden token {forbidden!r}")

require(page,[
    'data-build443="service-economics-commercial-capacity-review"',
    'data-build453="service-economics-capacity-pricing-review"',
    "Build 453 · read-only economics, capacity &amp; pricing review",
    "Service Economics, Capacity &amp; Pricing Review",
    "add-on margin remains unavailable",
    "/assets/build453-service-economics-capacity-pricing-review.js"
],"Build 453 page")
require(client,[
    "/api/admin/service_economics_commercial_capacity_review",
    'method:"GET"',
    "No background monitoring is running.",
    "No pricing, discount, booking, accounting, inventory or provider action was performed."
],"Build 453 client")
for forbidden in ("setInterval(","localStorage","sessionStorage",'method:"POST"','method:"PUT"','method:"PATCH"','method:"DELETE"'):
    if forbidden in client:
        errors.append(f"Build 453 client must not contain {forbidden!r}")

require(test,["BUILD 453 SERVICE ECONOMICS CAPACITY PRICING REVIEW TEST: PASS"],"Build 453 test")
require(contract,[
    "# Build 453 — Service Economics, Capacity & Pricing Review",
    "add-on margin remains unavailable rather than inferred",
    "do not prove price sensitivity",
    "No automatic:",
    "Build 454 — Reliability, Security, Cost & Resilience Reassessment"
],"Build 453 contract")
require(blockers,["Build 453","add-on","does not close any HOLD"],"canonical HOLD backlog")
require(queue,[
    "BUILD453_SERVICE_ECONOMICS_CAPACITY_PRICING_REVIEW.md",
    "FORWARD_BUILD_ROADMAP_446_455.md",
    "Production deployment/runtime/business acceptance"
],"release queue retained Build 453 authority")
require(handoff,[
    "BUILD453_SERVICE_ECONOMICS_CAPACITY_PRICING_REVIEW.md",
    "FORWARD_BUILD_ROADMAP_446_455.md",
    "Production deployment/runtime/business acceptance"
],"handoff retained Build 453 authority")
require(readme,[
    "BUILD453_SERVICE_ECONOMICS_CAPACITY_PRICING_REVIEW.md",
    "service_economics_capacity_pricing_review_check.py",
    "Production is not considered GREEN from source promotion alone."
],"README retained Build 453 authority")
for gate,label in ((dev,"Development gate"),(prod,"Production gate")):
    require(gate,["service_economics_capacity_pricing_review_check.py","service_economics_capacity_pricing_review_test.mjs"],label)

for path in [
    "functions/api/_lib/service-economics-commercial-capacity-review.js",
    "functions/api/admin/service_economics_commercial_capacity_review.js",
    "assets/build453-service-economics-capacity-pricing-review.js",
    "scripts/service_economics_capacity_pricing_review_test.mjs"
]:
    result=subprocess.run(["node","--check",path],cwd=ROOT,text=True,capture_output=True)
    if result.returncode:
        errors.append(f"{path} syntax failed: {result.stderr.strip() or result.stdout.strip()}")

commands=[
    ["node","scripts/service_economics_capacity_pricing_review_test.mjs"],
    ["python","scripts/service_economics_commercial_capacity_review_check.py"],
    ["node","scripts/service_economics_commercial_capacity_review_test.mjs"],
    ["python","scripts/build428_service_economics_job_profitability_check.py"],
    ["python","scripts/booking_funnel_quote_pricing_learning_check.py"],
    ["node","scripts/booking_funnel_quote_pricing_learning_test.mjs"],
    ["python","scripts/fleet_commercial_operations_learning_check.py"],
    ["python","scripts/fleet_maintenance_commercial_decision_closure_check.py"]
]
for command in commands:
    result=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if result.returncode:
        errors.append(f"retained authority failed: {' '.join(command)}: {result.stderr.strip() or result.stdout.strip()}")

if errors:
    print("BUILD 453 SERVICE ECONOMICS CAPACITY PRICING REVIEW AUTHORITY: FAIL")
    for error in errors:
        print(" -",error)
    sys.exit(1)

print("BUILD 453 SERVICE ECONOMICS CAPACITY PRICING REVIEW AUTHORITY: PASS")
print(" - retained Build 428/443 economics and Build 451 pricing learning remain authoritative")
print(" - add-on margin, price sensitivity and live capacity are never inferred from missing or non-causal evidence")
print(" - no price/discount, booking, accounting/inventory, provider or polling mutation")
