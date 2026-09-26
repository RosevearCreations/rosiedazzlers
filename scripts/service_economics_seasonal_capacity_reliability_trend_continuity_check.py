#!/usr/bin/env python3
"""Build 504 source authority for Service Economics, Seasonal Capacity & Reliability Trend Continuity."""
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

helper = read("functions/api/_lib/service-economics-seasonal-capacity-reliability-trend-continuity.js")
endpoint = read("functions/api/admin/service_economics_seasonal_capacity_reliability_trend_continuity.js")
page = read("admin-service-economics-commercial-capacity-review.html")
route = read("admin-service-economics-commercial-capacity-review/index.html")
client = read("assets/build504-service-economics-seasonal-capacity-reliability-trend-continuity.js")
test = read("scripts/service_economics_seasonal_capacity_reliability_trend_continuity_test.mjs")
contract = read("BUILD504_SERVICE_ECONOMICS_SEASONAL_CAPACITY_RELIABILITY_TREND_CONTINUITY.md")
roadmap = read("FORWARD_BUILD_ROADMAP_496_505.md")
queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff = read("AI_PROJECT_HANDOFF.md")
readme = read("README.md")
blockers = read("STARTUP_GO_LIVE_BLOCKERS.md")
workflow = read(".github/workflows/service-economics-seasonal-capacity-reliability-trend-continuity-authority.yml")
dev = read(".github/workflows/development-source-gate.yml")
prod = read(".github/workflows/production-business-acceptance-authority.yml")
prod_check = read("scripts/production_business_acceptance_check.py")

if page != route:
    errors.append("Build 504 Service Economics .html and folder-index routes must remain byte-identical")
if len(re.findall(r"<h1\b", page, re.I)) != 1:
    errors.append("Build 504 retained Service Economics workbench must retain exactly one H1")

require(helper, [
    "build: 504",
    'authority: "service_economics_seasonal_capacity_reliability_trend_continuity"',
    '"bounded_trend_continuity_review_ready"',
    '"bounded_trend_continuity_review_required"',
    '"evidence_sources_unavailable"',
    "explicit_allocation",
    "seasonal_operability",
    "observed_capacity",
    "technical_reliability",
    "unrelated_evidence_classes_joined_for_trend: false",
    "seasonal_operability_continuity_proves_broad_winter_availability: false",
    "observed_capacity_continuity_proves_future_capacity: false",
    "technical_reliability_proves_provider_billing_cpu_or_quota: false",
    "source_runtime_green_proves_recovery_success: false",
    "provider_cost_or_quota_inferred: false",
    "permanent_polling: false"
], "Build 504 helper")

require(endpoint, [
    'capability:"manage_staff"',
    "getServiceEconomicsReview",
    "getReliabilityReview",
    "buildServiceEconomicsSeasonalCapacityReliabilityTrendContinuity",
    'release_authority:"service_economics_seasonal_capacity_reliability_trend_continuity"',
    "onRequestPost", "onRequestPut", "onRequestPatch", "onRequestDelete",
    '"X-Rosie-Build504-Continuity":"read-only"'
], "Build 504 endpoint")

require(page, [
    'data-build504="service-economics-seasonal-capacity-reliability-trend-continuity"',
    'id="build504ContinuityDetail"',
    'id="build504ContinuityGrid"',
    "/assets/build504-service-economics-seasonal-capacity-reliability-trend-continuity.js",
    "Service Economics, Seasonal Capacity &amp; Reliability Trend Continuity",
    "Southern Ontario"
], "Build 504 retained workbench")

require(client, [
    "refreshBuild504",
    "build504ContinuityGrid",
    "/api/admin/service_economics_seasonal_capacity_reliability_trend_continuity",
    "Southern Ontario field restrictions remain separate from application reliability."
], "Build 504 client")
for forbidden in ("setInterval(", "localStorage", "sessionStorage", 'method:"POST"', 'method:"PUT"', 'method:"PATCH"', 'method:"DELETE"'):
    if forbidden in client:
        errors.append(f"Build 504 client must not contain {forbidden!r}")

require(test, [
    "BUILD 504 SERVICE ECONOMICS, SEASONAL CAPACITY & RELIABILITY TREND CONTINUITY TEST: PASS",
    'assert.equal(ready.review_status,"bounded_trend_continuity_review_ready")',
    'assert.equal(gaps.review_status,"bounded_trend_continuity_review_required")'
], "Build 504 behavioral proof")

require(contract, [
    "# Build 504 — Service Economics, Seasonal Capacity & Reliability Trend Continuity",
    "Same-domain comparability rule",
    "Southern Ontario seasonal-operability continuity",
    "Observed-capacity continuity",
    "Technical-reliability continuity",
    "Build 505 — Production Learning & Roadmap Renewal"
], "Build 504 contract")
require(roadmap, [
    "### Build 504 — Service Economics, Seasonal Capacity & Reliability Trend Continuity",
    "Do not infer provider billing/CPU/quota, recovery success, future capacity, price sensitivity, temperature thresholds or broad winter availability.",
    "### Build 505 — Production Learning & Roadmap Renewal"
], "active roadmap")
require(queue, [
    "**Build 504 — Service Economics, Seasonal Capacity & Reliability Trend Continuity** is the active bounded release.",
    "**Build 505 — Production Learning & Roadmap Renewal** is next",
    "BUILD504_SERVICE_ECONOMICS_SEASONAL_CAPACITY_RELIABILITY_TREND_CONTINUITY.md",
    "it has not run out"
], "Build 504 queue")
require(handoff, [
    "**Build 504 — Service Economics, Seasonal Capacity & Reliability Trend Continuity** is the active bounded release.",
    "BUILD504_SERVICE_ECONOMICS_SEASONAL_CAPACITY_RELIABILITY_TREND_CONTINUITY.md",
    "service_economics_seasonal_capacity_reliability_trend_continuity_check.py"
], "Build 504 handoff")
require(readme, [
    "Current source direction: **Build 504 — Service Economics, Seasonal Capacity & Reliability Trend Continuity**.",
    "BUILD504_SERVICE_ECONOMICS_SEASONAL_CAPACITY_RELIABILITY_TREND_CONTINUITY.md",
    "service_economics_seasonal_capacity_reliability_trend_continuity_check.py",
    "Production is not considered GREEN from source promotion alone."
], "Build 504 README")
require(blockers, [
    "# Rosie Dazzlers — Current Production HOLD Inventory",
    "A HOLD remains open until dated, attributable evidence"
], "canonical HOLD backlog")
require(workflow, [
    "Build 504 — Service Economics, Seasonal Capacity & Reliability Trend Continuity Authority",
    "service-economics-seasonal-capacity-reliability-trend-continuity",
    "python scripts/service_economics_seasonal_capacity_reliability_trend_continuity_check.py",
    "node scripts/service_economics_seasonal_capacity_reliability_trend_continuity_test.mjs"
], "Build 504 focused workflow")

for gate, label in ((dev, "Development source gate"), (prod, "Production business acceptance")):
    require(gate, [
        "python -m py_compile scripts/service_economics_seasonal_capacity_reliability_trend_continuity_check.py",
        "node --check scripts/service_economics_seasonal_capacity_reliability_trend_continuity_test.mjs",
        "node --check functions/api/_lib/service-economics-seasonal-capacity-reliability-trend-continuity.js",
        "node --check functions/api/admin/service_economics_seasonal_capacity_reliability_trend_continuity.js",
        "python scripts/service_economics_seasonal_capacity_reliability_trend_continuity_check.py",
        "node scripts/service_economics_seasonal_capacity_reliability_trend_continuity_test.mjs"
    ], label)

require(prod_check, [
    '"service_economics_seasonal_capacity_reliability_trend_continuity"',
    "scripts/service_economics_seasonal_capacity_reliability_trend_continuity_check.py",
    "scripts/service_economics_seasonal_capacity_reliability_trend_continuity_test.mjs",
    "Validate service economics, seasonal capacity & reliability trend continuity authority"
], "central Production acceptance")

migrations = [p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])504(?:[^0-9]|$)", p.name)]
if migrations:
    errors.append("Build 504 must not introduce schema migration: " + ", ".join(str(p.relative_to(ROOT)) for p in migrations))

for p in [
    "functions/api/_lib/service-economics-seasonal-capacity-reliability-trend-continuity.js",
    "functions/api/admin/service_economics_seasonal_capacity_reliability_trend_continuity.js",
    "assets/build504-service-economics-seasonal-capacity-reliability-trend-continuity.js",
    "scripts/service_economics_seasonal_capacity_reliability_trend_continuity_test.mjs"
]:
    r = subprocess.run(["node", "--check", p], cwd=ROOT, text=True, capture_output=True)
    if r.returncode:
        errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")

for command in [
    ["node", "scripts/service_economics_seasonal_capacity_reliability_trend_continuity_test.mjs"],
    ["python", "scripts/service_economics_seasonal_operations_reliability_review_check.py"],
    ["node", "scripts/service_economics_seasonal_operations_reliability_review_test.mjs"],
    ["python", "scripts/service_addon_allocation_evidence_closure_check.py"],
    ["node", "scripts/service_addon_allocation_evidence_closure_test.mjs"],
    ["python", "scripts/cold_weather_service_capability_evidence_matrix_check.py"],
    ["node", "scripts/cold_weather_service_capability_evidence_matrix_test.mjs"],
    ["python", "scripts/reliability_cost_recovery_evidence_continuity_check.py"],
    ["node", "scripts/reliability_cost_recovery_evidence_continuity_test.mjs"]
]:
    r = subprocess.run(command, cwd=ROOT, text=True, capture_output=True)
    if r.returncode:
        errors.append(f"retained/behavioral authority failed: {' '.join(command)}: {r.stderr.strip() or r.stdout.strip()}")

if errors:
    print("BUILD 504 SERVICE ECONOMICS, SEASONAL CAPACITY & RELIABILITY TREND CONTINUITY AUTHORITY: FAIL")
    for error in errors:
        print(" -", error)
    sys.exit(1)

print("BUILD 504 SERVICE ECONOMICS, SEASONAL CAPACITY & RELIABILITY TREND CONTINUITY AUTHORITY: PASS")
print(" - explicit allocation, seasonal operability, observed capacity and technical reliability use separate same-domain comparability rules")
print(" - Southern Ontario field restrictions remain separate from application reliability")
print(" - missing history, provider billing/CPU/quota, recovery success, thresholds, price sensitivity and future capacity are not inferred")
print(" - the continuity layer is read-only and performs no price, booking, winter-claim, capacity, provider, restore, accounting, inventory, schema or polling mutation")
