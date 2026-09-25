#!/usr/bin/env python3
"""Build 494 source authority for Service Economics, Seasonal Operations & Reliability Review."""
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []

def read(path):
    p = ROOT / path
    if not p.is_file():
        errors.append(f"missing required file: {path}")
        return ""
    return p.read_text(encoding="utf-8", errors="ignore")

def require(text, needles, label):
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing {needle!r}")

helper = read("functions/api/_lib/service-economics-seasonal-operations-reliability-review.js")
endpoint = read("functions/api/admin/service_economics_seasonal_operations_reliability_review.js")
page = read("admin-service-economics-commercial-capacity-review.html")
route = read("admin-service-economics-commercial-capacity-review/index.html")
client = read("assets/build494-service-economics-seasonal-operations-reliability-review.js")
test = read("scripts/service_economics_seasonal_operations_reliability_review_test.mjs")
contract = read("BUILD494_SERVICE_ECONOMICS_SEASONAL_OPERATIONS_RELIABILITY_REVIEW.md")
roadmap = read("FORWARD_BUILD_ROADMAP_486_495.md")
queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff = read("AI_PROJECT_HANDOFF.md")
readme = read("README.md")
blockers = read("STARTUP_GO_LIVE_BLOCKERS.md")
workflow = read(".github/workflows/service-economics-seasonal-operations-reliability-review-authority.yml")
dev = read(".github/workflows/development-source-gate.yml")
prod = read(".github/workflows/production-business-acceptance-authority.yml")
prod_check = read("scripts/production_business_acceptance_check.py")

if page != route:
    errors.append("Build 494 Service Economics .html and folder-index routes must remain byte-identical")
if len(re.findall(r"<h1\b", page, re.I)) != 1:
    errors.append("Build 494 retained Service Economics workbench must retain exactly one H1")

require(helper, [
    "build: 494",
    'authority: "service_economics_seasonal_operations_reliability_review"',
    '"bounded_reconciliation_review_ready"',
    '"bounded_reconciliation_review_required"',
    '"evidence_sources_unavailable"',
    "service_add_on_allocation",
    "seasonal_operations",
    "operational_capacity",
    "reliability_continuity",
    "booking_total_allocation_inference_allowed: false",
    "exact_temperature_thresholds_inferred: false",
    "demand_used_as_capacity_proxy: false",
    "provider_billing_cpu_or_quota_inferred: false",
    "recovery_success_inferred_from_source_runtime_green: false",
    "seasonal_restriction_is_application_reliability_failure: false",
    "automatic_price_or_discount_change_allowed: false",
    "automatic_booking_or_availability_change_allowed: false",
    "automatic_production_restore_allowed: false",
    "permanent_polling: false"
], "Build 494 helper")

require(endpoint, [
    'capability: "manage_staff"',
    "getServiceEconomicsReview",
    "getReliabilityReview",
    "buildServiceEconomicsSeasonalOperationsReliabilityReview",
    'release_authority: "service_economics_seasonal_operations_reliability_review"',
    "onRequestPost", "onRequestPut", "onRequestPatch", "onRequestDelete",
    '"X-Rosie-Build494-Review": "read-only"'
], "Build 494 endpoint")

require(page, [
    'data-build494="service-economics-seasonal-operations-reliability-review"',
    'id="build494ReviewDetail"',
    'id="build494ReviewGrid"',
    "/assets/build494-service-economics-seasonal-operations-reliability-review.js",
    "Service Economics, Seasonal Operations &amp; Reliability Review",
    "Southern Ontario"
], "Build 494 retained workbench")

require(client, [
    "refreshBuild494",
    "build494ReviewGrid",
    "/api/admin/service_economics_seasonal_operations_reliability_review",
    "Demand is not used as a capacity proxy",
    "Southern Ontario seasonal restrictions are not application reliability failures."
], "Build 494 client")
for forbidden in ("setInterval(", "localStorage", "sessionStorage", 'method:"POST"', 'method:"PUT"', 'method:"PATCH"', 'method:"DELETE"'):
    if forbidden in client:
        errors.append(f"Build 494 client must not contain {forbidden!r}")

require(test, [
    "BUILD 494 SERVICE ECONOMICS, SEASONAL OPERATIONS & RELIABILITY REVIEW TEST: PASS",
    'assert.equal(ready.review_status,"bounded_reconciliation_review_ready")',
    'assert.equal(gaps.review_status,"bounded_reconciliation_review_required")'
], "Build 494 behavioral proof")

require(contract, [
    "# Build 494 — Service Economics, Seasonal Operations & Reliability Review",
    "Southern Ontario seasonal operations boundary",
    "Observed operational-capacity boundary",
    "Reliability continuity boundary",
    "Build 495 — Production Learning & Roadmap Renewal"
], "Build 494 contract")
require(roadmap, [
    "### Build 494 — Service Economics, Seasonal Operations & Reliability Review",
    "Do not infer allocation, provider billing/CPU/quota, recovery success, temperature thresholds, price sensitivity or winter availability from unrelated evidence.",
    "### Build 495 — Production Learning & Roadmap Renewal"
], "active roadmap")
require(queue, [
    "**Build 500 — Recovery Drill & Authenticated Device Observation Execution Evidence** is the active bounded release.",
    "**Build 501 — Maintenance & Fleet Pilot Outcome Continuity Review** is next",
    "BUILD494_SERVICE_ECONOMICS_SEASONAL_OPERATIONS_RELIABILITY_REVIEW.md",
    "it has not run out"
], "Build 494 queue")
require(handoff, [
    "**Build 500 — Recovery Drill & Authenticated Device Observation Execution Evidence** is the active bounded release.",
    "BUILD494_SERVICE_ECONOMICS_SEASONAL_OPERATIONS_RELIABILITY_REVIEW.md",
    "service_economics_seasonal_operations_reliability_review_check.py"
], "Build 494 handoff")
require(readme, [
    "Current source direction: **Build 500 — Recovery Drill & Authenticated Device Observation Execution Evidence**.",
    "BUILD494_SERVICE_ECONOMICS_SEASONAL_OPERATIONS_RELIABILITY_REVIEW.md",
    "service_economics_seasonal_operations_reliability_review_check.py",
    "Production is not considered GREEN from source promotion alone."
], "Build 494 README")
require(blockers, [
    "# Rosie Dazzlers — Current Production HOLD Inventory",
    "A HOLD remains open until dated, attributable evidence"
], "canonical HOLD backlog")
require(workflow, [
    "Build 494 — Service Economics, Seasonal Operations & Reliability Review Authority",
    "service-economics-seasonal-operations-reliability-review",
    "python scripts/service_economics_seasonal_operations_reliability_review_check.py",
    "node scripts/service_economics_seasonal_operations_reliability_review_test.mjs"
], "Build 494 focused workflow")

for gate, label in ((dev, "Development source gate"), (prod, "Production business acceptance")):
    require(gate, [
        "python -m py_compile scripts/service_economics_seasonal_operations_reliability_review_check.py",
        "node --check scripts/service_economics_seasonal_operations_reliability_review_test.mjs",
        "node --check functions/api/_lib/service-economics-seasonal-operations-reliability-review.js",
        "node --check functions/api/admin/service_economics_seasonal_operations_reliability_review.js",
        "python scripts/service_economics_seasonal_operations_reliability_review_check.py",
        "node scripts/service_economics_seasonal_operations_reliability_review_test.mjs"
    ], label)

require(prod_check, [
    '"service_economics_seasonal_operations_reliability_review"',
    "scripts/service_economics_seasonal_operations_reliability_review_check.py",
    "scripts/service_economics_seasonal_operations_reliability_review_test.mjs",
    "Validate service economics, seasonal operations & reliability review authority"
], "central Production acceptance")

migrations = [p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])494(?:[^0-9]|$)", p.name)]
if migrations:
    errors.append("Build 494 must not introduce schema migration: " + ", ".join(str(p.relative_to(ROOT)) for p in migrations))

for p in [
    "functions/api/_lib/service-economics-seasonal-operations-reliability-review.js",
    "functions/api/admin/service_economics_seasonal_operations_reliability_review.js",
    "assets/build494-service-economics-seasonal-operations-reliability-review.js",
    "scripts/service_economics_seasonal_operations_reliability_review_test.mjs"
]:
    r = subprocess.run(["node", "--check", p], cwd=ROOT, text=True, capture_output=True)
    if r.returncode:
        errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")

for command in [
    ["node", "scripts/service_economics_seasonal_operations_reliability_review_test.mjs"],
    ["python", "scripts/service_addon_allocation_evidence_closure_check.py"],
    ["node", "scripts/service_addon_allocation_evidence_closure_test.mjs"],
    ["python", "scripts/cold_weather_service_capability_evidence_matrix_check.py"],
    ["node", "scripts/cold_weather_service_capability_evidence_matrix_test.mjs"],
    ["python", "scripts/controlled_environment_weather_safe_routing_check.py"],
    ["node", "scripts/controlled_environment_weather_safe_routing_test.mjs"],
    ["python", "scripts/reliability_cost_recovery_evidence_continuity_check.py"],
    ["node", "scripts/reliability_cost_recovery_evidence_continuity_test.mjs"]
]:
    r = subprocess.run(command, cwd=ROOT, text=True, capture_output=True)
    if r.returncode:
        errors.append(f"retained/behavioral authority failed: {' '.join(command)}: {r.stderr.strip() or r.stdout.strip()}")

if errors:
    print("BUILD 494 SERVICE ECONOMICS, SEASONAL OPERATIONS & RELIABILITY REVIEW AUTHORITY: FAIL")
    for error in errors:
        print(" -", error)
    sys.exit(1)

print("BUILD 494 SERVICE ECONOMICS, SEASONAL OPERATIONS & RELIABILITY REVIEW AUTHORITY: PASS")
print(" - explicit service/add-on allocation, seasonal capability, observed capacity and reliability continuity remain independently sourced")
print(" - Southern Ontario cold-weather restrictions remain separate from application reliability")
print(" - provider billing/CPU/quota, recovery success, temperature thresholds, price sensitivity and winter availability are not inferred")
print(" - the reconciliation is read-only and performs no price, booking, provider, restore, accounting, inventory, schema or polling mutation")
