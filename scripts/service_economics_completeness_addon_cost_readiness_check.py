#!/usr/bin/env python3
"""Build 463 source authority for Service Economics Completeness & Add-On Cost Readiness."""
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []

def read(path):
    target = ROOT / path
    if not target.is_file():
        errors.append(f"missing required file: {path}")
        return ""
    return target.read_text(encoding="utf-8", errors="ignore")

def require(text, needles, label):
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing {needle!r}")

helper = read("functions/api/_lib/service-economics-completeness-addon-cost-readiness.js")
endpoint = read("functions/api/admin/service_economics_commercial_capacity_review.js")
page = read("admin-service-economics-commercial-capacity-review.html")
route = read("admin-service-economics-commercial-capacity-review/index.html")
client = read("assets/build463-service-economics-completeness-addon-cost-readiness.js")
test = read("scripts/service_economics_completeness_addon_cost_readiness_test.mjs")
contract = read("BUILD463_SERVICE_ECONOMICS_COMPLETENESS_ADDON_COST_READINESS.md")
queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff = read("AI_PROJECT_HANDOFF.md")
readme = read("README.md")
blockers = read("STARTUP_GO_LIVE_BLOCKERS.md")
dev = read(".github/workflows/development-source-gate.yml")
prod = read(".github/workflows/production-business-acceptance-authority.yml")

if page != route:
    errors.append("Build 463 .html and folder-index routes must remain byte-identical")
if len(re.findall(r"<h1\b", page, re.I)) != 1:
    errors.append("Build 463 economics page must retain exactly one H1")

require(helper, [
    "release_enrichment_build: 463",
    'release_authority: "service_economics_completeness_addon_cost_readiness"',
    "evidence_completeness",
    "recorded_add_on_revenue",
    "material_usage_linked_to_add_on",
    "labor_time_linked_to_add_on",
    "cash_refund_linked_to_add_on",
    "posted_cogs_linked_to_add_on",
    "defensible_allocation_ready",
    "inferred_equal_split_allowed: false",
    "inferred_price_weighted_split_allowed: false",
    "add_on_allocation_without_recorded_basis_allowed: false",
    "automatic_margin_conclusion_allowed: false",
    "schema_mutation_allowed: false"
], "Build 463 helper")
for forbidden in ("customer_name", "customer_email", "raw_booking_identifier", "raw_quote_identifier"):
    if forbidden in helper:
        errors.append(f"Build 463 helper exposes forbidden identity token {forbidden!r}")

require(endpoint, [
    'capability:"manage_staff"',
    "getAccountingStatement", "getFleetLearning", "getPricingLearning",
    "buildServiceEconomicsCompletenessAddOnCostReadiness",
    'release_authority:"service_economics_completeness_addon_cost_readiness"',
    "onRequestPost", "onRequestPut", "onRequestPatch", "onRequestDelete"
], "Build 463 endpoint")

require(page, [
    'data-build443="service-economics-commercial-capacity-review"',
    'data-build453="service-economics-capacity-pricing-review"',
    'data-build463="service-economics-completeness-addon-cost-readiness"',
    "Build 463 · Service Economics Completeness &amp; Add-On Cost Readiness",
    'id="completenessGrid"',
    "explicit recorded add-on",
    "/assets/build463-service-economics-completeness-addon-cost-readiness.js",
    "Build 453 · read-only economics, capacity &amp; pricing review"
], "Build 463 page")

require(client, [
    "/api/admin/service_economics_commercial_capacity_review",
    'method: "GET"',
    "renderCompleteness",
    "completenessGrid",
    "No background monitoring is running.",
    "No pricing, discount, booking, accounting, inventory, provider or schema action was performed."
], "Build 463 client")
for forbidden in ("setInterval(", "localStorage", "sessionStorage", 'method: "POST"', 'method: "PUT"', 'method: "PATCH"', 'method: "DELETE"'):
    if forbidden in client:
        errors.append(f"Build 463 client must not contain {forbidden!r}")

require(test, ["BUILD 463 SERVICE ECONOMICS COMPLETENESS ADD-ON COST READINESS TEST: PASS"], "Build 463 test")
require(contract, [
    "# Build 463 — Service Economics Completeness & Add-On Cost Readiness",
    "equal split, price-weighted split, booking-cost division",
    "No automatic:",
    "does not close provider, recovery, real-device, owner-approval or unavailable-evidence HOLDs",
    "Build 464 — Reliability, Cost & Resilience Operational Guardrails"
], "Build 463 contract")
require(blockers, [
    "Build 463",
    "add-on allocation",
    "does not close any HOLD"
], "canonical HOLD backlog")
require(queue, [
    "BUILD463_SERVICE_ECONOMICS_COMPLETENESS_ADDON_COST_READINESS.md",
    "FORWARD_BUILD_ROADMAP_456_465.md",
    "Production deployment/runtime/business acceptance"
], "retained release queue authority")
require(handoff, [
    "BUILD463_SERVICE_ECONOMICS_COMPLETENESS_ADDON_COST_READINESS.md",
    "service_economics_completeness_addon_cost_readiness_check.py",
    "FORWARD_BUILD_ROADMAP_456_465.md"
], "handoff")
require(readme, [
    "BUILD463_SERVICE_ECONOMICS_COMPLETENESS_ADDON_COST_READINESS.md",
    "service_economics_completeness_addon_cost_readiness_check.py",
    "Production is not considered GREEN from source promotion alone."
], "README")
for gate, label in ((dev, "Development gate"), (prod, "Production gate")):
    require(gate, [
        "service_economics_completeness_addon_cost_readiness_check.py",
        "service_economics_completeness_addon_cost_readiness_test.mjs"
    ], label)

for path in [
    "functions/api/_lib/service-economics-completeness-addon-cost-readiness.js",
    "functions/api/admin/service_economics_commercial_capacity_review.js",
    "assets/build463-service-economics-completeness-addon-cost-readiness.js",
    "scripts/service_economics_completeness_addon_cost_readiness_test.mjs"
]:
    result = subprocess.run(["node", "--check", path], cwd=ROOT, text=True, capture_output=True)
    if result.returncode:
        errors.append(f"{path} syntax failed: {result.stderr.strip() or result.stdout.strip()}")

commands = [
    ["node", "scripts/service_economics_completeness_addon_cost_readiness_test.mjs"],
    ["python", "scripts/service_economics_capacity_pricing_review_check.py"],
    ["node", "scripts/service_economics_capacity_pricing_review_test.mjs"],
    ["python", "scripts/service_economics_commercial_capacity_review_check.py"],
    ["node", "scripts/service_economics_commercial_capacity_review_test.mjs"],
    ["python", "scripts/build428_service_economics_job_profitability_check.py"],
    ["python", "scripts/booking_funnel_quote_pricing_learning_check.py"],
    ["node", "scripts/booking_funnel_quote_pricing_learning_test.mjs"]
]
for command in commands:
    result = subprocess.run(command, cwd=ROOT, text=True, capture_output=True)
    if result.returncode:
        errors.append(f"retained authority failed: {' '.join(command)}: {result.stderr.strip() or result.stdout.strip()}")

if errors:
    print("BUILD 463 SERVICE ECONOMICS COMPLETENESS ADD-ON COST READINESS AUTHORITY: FAIL")
    for error in errors:
        print(" -", error)
    sys.exit(1)

print("BUILD 463 SERVICE ECONOMICS COMPLETENESS ADD-ON COST READINESS AUTHORITY: PASS")
print(" - retained Build 428/443/451/453 authorities remain authoritative")
print(" - material, labour, cash/refund and COGS gaps block bounded margin review")
print(" - add-on margin requires explicit recorded add-on allocation evidence; inferred split methods remain locked")
print(" - no automatic pricing, discount, booking, accounting/inventory, provider, schema or polling mutation")
