#!/usr/bin/env python3
"""Build 514 source authority for Service Economics, Seasonal Capacity & Reliability Decision Readiness."""
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
        if needle not in text: errors.append(f"{label} missing {needle!r}")

helper=read("functions/api/_lib/service-economics-seasonal-capacity-reliability-decision-readiness.js")
endpoint=read("functions/api/admin/service_economics_seasonal_capacity_reliability_decision_readiness.js")
test=read("scripts/service_economics_seasonal_capacity_reliability_decision_readiness_test.mjs")
contract=read("BUILD514_SERVICE_ECONOMICS_SEASONAL_CAPACITY_RELIABILITY_DECISION_READINESS.md")
roadmap=read("FORWARD_BUILD_ROADMAP_506_515.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
workflow=read(".github/workflows/service-economics-seasonal-capacity-reliability-decision-readiness-authority.yml")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")

require(helper,[
 "decision_readiness_build: 514",
 'decision_readiness_authority: "service_economics_seasonal_capacity_reliability_decision_readiness"',
 '"bounded_decision_readiness_review_ready"',
 '"bounded_decision_readiness_review_required"',
 '"evidence_sources_unavailable"',
 '"insufficient_comparable_history"',
 "cross_domain_substitution_allowed: false",
 "missing_comparable_history_remains_insufficient: true",
 "provider_billing_cpu_or_quota_inferred: false",
 "recovery_success_inferred: false",
 "observed_capacity_proves_future_capacity: false",
 "working_temperature_threshold_inferred: false",
 "seasonal_operability_proves_broad_winter_availability: false",
 "canonical_hold_mutation_allowed: false",
 "permanent_polling_allowed: false"
],"Build 514 helper")
require(endpoint,[
 "getTrendContinuity",
 "buildServiceEconomicsSeasonalCapacityReliabilityDecisionReadiness",
 "service_economics_seasonal_capacity_reliability_decision_readiness",
 '"X-Rosie-Service-Economics-Decision-Readiness":"build-514-read-only"',
 "GET,HEAD,OPTIONS"
],"Build 514 endpoint")
for forbidden in ["onRequestPost","onRequestPut","onRequestPatch","onRequestDelete","setInterval(","localStorage","sessionStorage"]:
    if forbidden in endpoint: errors.append(f"Build 514 endpoint contains forbidden mutation/polling token {forbidden!r}")
require(test,[
 "BUILD 514 SERVICE ECONOMICS, SEASONAL CAPACITY & RELIABILITY DECISION READINESS TEST: PASS",
 'assert.equal(ready.status,"bounded_decision_readiness_review_ready")',
 'assert.equal(gaps.status,"bounded_decision_readiness_review_required")',
 'assert.equal(unavailable.status,"evidence_sources_unavailable")'
],"Build 514 behavioral proof")
require(contract,[
 "# Build 514 — Service Economics, Seasonal Capacity & Reliability Decision Readiness",
 "Independent-domain decision readiness",
 "Southern Ontario seasonal operability",
 "Missing comparable history remains",
 "retain_current_controls_and_holds",
 "Build 515 — Production Learning & Roadmap Renewal"
],"Build 514 contract")
require(roadmap,[
 "### Build 514 — Service Economics, Seasonal Capacity & Reliability Decision Readiness",
 "Missing comparable history remains insufficient",
 "### Build 515 — Production Learning & Roadmap Renewal"
],"active roadmap")
require(queue,[
 "**Build 515 — Production Learning & Roadmap Renewal** is the active bounded release.",
 "**Build 516 — Seasonal Capability & Public Claim Decision Outcome Continuity** is next",
 "BUILD514_SERVICE_ECONOMICS_SEASONAL_CAPACITY_RELIABILITY_DECISION_READINESS.md",
 "BUILD504_SERVICE_ECONOMICS_SEASONAL_CAPACITY_RELIABILITY_TREND_CONTINUITY.md",
 "it has not run out"
],"Build 514 queue")
require(handoff,[
 "**Build 515 — Production Learning & Roadmap Renewal** is the active bounded release.",
 "BUILD514_SERVICE_ECONOMICS_SEASONAL_CAPACITY_RELIABILITY_DECISION_READINESS.md",
 "service_economics_seasonal_capacity_reliability_decision_readiness_check.py",
 "BUILD504_SERVICE_ECONOMICS_SEASONAL_CAPACITY_RELIABILITY_TREND_CONTINUITY.md"
],"Build 514 handoff")
require(readme,[
 "Current source direction: **Build 515 — Production Learning & Roadmap Renewal**.",
 "BUILD514_SERVICE_ECONOMICS_SEASONAL_CAPACITY_RELIABILITY_DECISION_READINESS.md",
 "service_economics_seasonal_capacity_reliability_decision_readiness_check.py",
 "Production is not considered GREEN from source promotion alone."
],"Build 514 README")
require(blockers,[
 "Build 514 adds a read-only service-economics, seasonal-capacity and reliability decision-readiness layer",
 "Southern Ontario",
 "Missing comparable history remains insufficient",
 "# Rosie Dazzlers — Current Production HOLD Inventory"
],"canonical HOLD backlog")
for gate,label in [(dev,"Development source gate"),(prod,"Production business acceptance")]:
    require(gate,[
      "python -m py_compile scripts/service_economics_seasonal_capacity_reliability_decision_readiness_check.py",
      "node --check scripts/service_economics_seasonal_capacity_reliability_decision_readiness_test.mjs",
      "node --check functions/api/_lib/service-economics-seasonal-capacity-reliability-decision-readiness.js",
      "node --check functions/api/admin/service_economics_seasonal_capacity_reliability_decision_readiness.js",
      "python scripts/service_economics_seasonal_capacity_reliability_decision_readiness_check.py",
      "node scripts/service_economics_seasonal_capacity_reliability_decision_readiness_test.mjs"
    ],label)
require(workflow,[
 "Build 514 — Service Economics, Seasonal Capacity & Reliability Decision Readiness Authority",
 "service-economics-seasonal-capacity-reliability-decision-readiness",
 "python scripts/service_economics_seasonal_capacity_reliability_decision_readiness_check.py",
 "node scripts/service_economics_seasonal_capacity_reliability_decision_readiness_test.mjs"
],"Build 514 workflow")

for command in [
 ["python","scripts/service_economics_seasonal_capacity_reliability_trend_continuity_check.py"],
 ["node","scripts/service_economics_seasonal_capacity_reliability_trend_continuity_test.mjs"],
 ["python","scripts/service_economics_seasonal_operations_reliability_review_check.py"],
 ["node","scripts/service_economics_seasonal_operations_reliability_review_test.mjs"],
 ["python","scripts/service_addon_allocation_evidence_closure_check.py"],
 ["node","scripts/service_addon_allocation_evidence_closure_test.mjs"],
 ["python","scripts/cold_weather_service_capability_evidence_matrix_check.py"],
 ["node","scripts/cold_weather_service_capability_evidence_matrix_test.mjs"],
 ["python","scripts/reliability_cost_recovery_evidence_continuity_check.py"],
 ["node","scripts/reliability_cost_recovery_evidence_continuity_test.mjs"],
 ["node","scripts/service_economics_seasonal_capacity_reliability_decision_readiness_test.mjs"]
]:
    p=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if p.returncode: errors.append(f"retained/behavioral authority failed: {' '.join(command)}: {p.stderr.strip() or p.stdout.strip()}")

for p in [
 "functions/api/_lib/service-economics-seasonal-capacity-reliability-decision-readiness.js",
 "functions/api/admin/service_economics_seasonal_capacity_reliability_decision_readiness.js",
 "scripts/service_economics_seasonal_capacity_reliability_decision_readiness_test.mjs"
]:
    r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
    if r.returncode: errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])514(?:[^0-9]|$)",p.name)]
if migrations: errors.append("Build 514 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("BUILD 514 SERVICE ECONOMICS, SEASONAL CAPACITY & RELIABILITY DECISION READINESS AUTHORITY: FAIL")
    for e in errors: print(" -",e)
    sys.exit(1)
print("BUILD 514 SERVICE ECONOMICS, SEASONAL CAPACITY & RELIABILITY DECISION READINESS AUTHORITY: PASS")
print(" - four owning evidence domains remain independent and require comparable same-domain history")
print(" - Southern Ontario field operability remains separate from application reliability and source-owned temperature limits")
print(" - provider billing/CPU/quota, recovery success, future capacity, price sensitivity and broad winter availability are not inferred")
print(" - decision readiness is human review only and performs no price, booking, capacity, provider, restore, HOLD, schema or polling mutation")
