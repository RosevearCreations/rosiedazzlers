#!/usr/bin/env python3
"""Build 524 source authority for Service Economics, Seasonal Capacity & Reliability Decision Outcome Continuity."""
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

helper=read("functions/api/_lib/service-economics-seasonal-capacity-reliability-decision-outcome-continuity.js")
endpoint=read("functions/api/admin/service_economics_seasonal_capacity_reliability_decision_readiness.js")
test=read("scripts/service_economics_seasonal_capacity_reliability_decision_outcome_continuity_test.mjs")
contract=read("BUILD524_SERVICE_ECONOMICS_SEASONAL_CAPACITY_RELIABILITY_DECISION_OUTCOME_CONTINUITY.md")
roadmap=read("FORWARD_BUILD_ROADMAP_516_525.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")
docindex=read("DOC_INDEX.md")
workflow=read(".github/workflows/service-economics-seasonal-capacity-reliability-decision-outcome-continuity-authority.yml")
dev=read(".github/workflows/development-source-gate.yml")
prod=read(".github/workflows/production-business-acceptance-authority.yml")
prodcheck=read("scripts/production_business_acceptance_check.py")

require(helper,[
 "decision_outcome_build:524",'decision_outcome_authority:"service_economics_seasonal_capacity_reliability_decision_outcome_continuity"',
 '"decision_readiness_source_unavailable"','"decision_readiness_not_review_ready"','"decision_outcome_required"',
 '"decision_outcome_unattributable"','"decision_outcome_evidence_conflict"','"decision_outcome_review_incomplete"',
 '"retain_current_controls_outcome_observed"','"retain_hold_outcome_observed"','"bounded_manual_follow_up_outcome_observed"',
 "missing_comparable_history_remains_insufficient:true","cross_domain_substitution_allowed:false",
 "provider_billing_cpu_or_quota_inferred:false","recovery_success_inferred:false","future_capacity_inferred:false",
 "working_temperature_threshold_inferred:false","broad_winter_availability_inferred:false",
 "canonical_hold_mutation_allowed:false","permanent_polling_allowed:false"
],"Build 524 helper")
require(endpoint,[
 "buildServiceEconomicsSeasonalCapacityReliabilityDecisionOutcomeContinuity",
 "SERVICE_ECONOMICS_SEASONAL_CAPACITY_RELIABILITY_DECISION_OUTCOME_JSON",
 "service_economics_seasonal_capacity_reliability_decision_outcome_continuity",
 '"X-Rosie-Service-Economics-Decision-Outcome":"build-524-read-only"',"GET,HEAD,OPTIONS"
],"Build 524 endpoint")
for forbidden in ["onRequestPost","onRequestPut","onRequestPatch","onRequestDelete","setInterval(","localStorage","sessionStorage"]:
    if forbidden in endpoint: errors.append(f"Build 524 endpoint contains forbidden mutation/polling token {forbidden!r}")
require(test,[
 "BUILD 524 SERVICE ECONOMICS, SEASONAL CAPACITY & RELIABILITY DECISION OUTCOME CONTINUITY TEST: PASS",
 'assert.equal(observed.status,"bounded_decision_outcome_continuity_observed")',
 '"decision_outcome_evidence_conflict"','"decision_outcome_review_incomplete"','"decision_readiness_not_review_ready"','"evidence_sources_unavailable"'
],"Build 524 behavioral proof")
require(contract,[
 "# Build 524 — Service Economics, Seasonal Capacity & Reliability Decision Outcome Continuity",
 "explicit human decision outcomes","Independent evidence domains","Southern Ontario seasonal truth boundary",
 "Missing comparable history remains insufficient","Non-executing decision outcomes","Build 525 — Production Learning & Roadmap Renewal"
],"Build 524 contract")
require(roadmap,[
 "### Build 524 — Service Economics, Seasonal Capacity & Reliability Decision Outcome Continuity",
 "Missing comparable history remains insufficient","### Build 525 — Production Learning & Roadmap Renewal"
],"active roadmap")
require(queue,[
 "**Build 524 — Service Economics, Seasonal Capacity & Reliability Decision Outcome Continuity** is the active bounded release.",
 "**Build 525 — Production Learning & Roadmap Renewal** is next only after the current release is independently GREEN on protected main.",
 "BUILD524_SERVICE_ECONOMICS_SEASONAL_CAPACITY_RELIABILITY_DECISION_OUTCOME_CONTINUITY.md",
 "BUILD514_SERVICE_ECONOMICS_SEASONAL_CAPACITY_RELIABILITY_DECISION_READINESS.md","non-force fast-forward","it has not run out"
],"Build 524 queue")
require(handoff,[
 "**Build 524 — Service Economics, Seasonal Capacity & Reliability Decision Outcome Continuity** is the active bounded release.",
 "**Build 525 — Production Learning & Roadmap Renewal** is next only after the current release is independently GREEN on protected main.",
 "BUILD524_SERVICE_ECONOMICS_SEASONAL_CAPACITY_RELIABILITY_DECISION_OUTCOME_CONTINUITY.md",
 "service_economics_seasonal_capacity_reliability_decision_outcome_continuity_check.py",
 "BUILD514_SERVICE_ECONOMICS_SEASONAL_CAPACITY_RELIABILITY_DECISION_READINESS.md"
],"Build 524 handoff")
require(readme,[
 "Current source direction: **Build 524 — Service Economics, Seasonal Capacity & Reliability Decision Outcome Continuity**.",
 "BUILD524_SERVICE_ECONOMICS_SEASONAL_CAPACITY_RELIABILITY_DECISION_OUTCOME_CONTINUITY.md",
 "scripts/service_economics_seasonal_capacity_reliability_decision_outcome_continuity_check.py",
 "Production is not considered GREEN from source promotion alone."
],"Build 524 README")
require(blockers,[
 "Build 524 adds read-only service-economics, seasonal-capacity and reliability decision outcome continuity",
 "explicit human decision outcome","Southern Ontario","provider billing/CPU/quota","# Rosie Dazzlers — Current Production HOLD Inventory"
],"canonical HOLD backlog")
require(docindex,["BUILD524_SERVICE_ECONOMICS_SEASONAL_CAPACITY_RELIABILITY_DECISION_OUTCOME_CONTINUITY.md","current bounded release contract"],"documentation index")
for text,label in [(dev,"Development Source Gate"),(prod,"Production Business Acceptance")]:
    require(text,[
      "python -m py_compile scripts/service_economics_seasonal_capacity_reliability_decision_outcome_continuity_check.py",
      "node --check scripts/service_economics_seasonal_capacity_reliability_decision_outcome_continuity_test.mjs",
      "node --check functions/api/_lib/service-economics-seasonal-capacity-reliability-decision-outcome-continuity.js",
      "node --check functions/api/admin/service_economics_seasonal_capacity_reliability_decision_readiness.js",
      "python scripts/service_economics_seasonal_capacity_reliability_decision_outcome_continuity_check.py",
      "node scripts/service_economics_seasonal_capacity_reliability_decision_outcome_continuity_test.mjs"
    ],label)
require(prodcheck,[
 '"service_economics_seasonal_capacity_reliability_decision_outcome_continuity"',
 "scripts/service_economics_seasonal_capacity_reliability_decision_outcome_continuity_check.py",
 "scripts/service_economics_seasonal_capacity_reliability_decision_outcome_continuity_test.mjs"
],"Production business checker registry")
require(workflow,[
 "Build 524 — Service Economics, Seasonal Capacity & Reliability Decision Outcome Continuity Authority",
 "service-economics-seasonal-capacity-reliability-decision-outcome-continuity",
 "python scripts/service_economics_seasonal_capacity_reliability_decision_outcome_continuity_check.py",
 "node scripts/service_economics_seasonal_capacity_reliability_decision_outcome_continuity_test.mjs"
],"Build 524 workflow")

for command in [
 [sys.executable,"scripts/service_economics_seasonal_capacity_reliability_decision_readiness_check.py"],
 ["node","scripts/service_economics_seasonal_capacity_reliability_decision_readiness_test.mjs"],
 ["node","scripts/staff_mobile_remediation_closure_outcome_continuity_test.mjs"],
 ["node","scripts/service_economics_seasonal_capacity_reliability_decision_outcome_continuity_test.mjs"]
]:
    p=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if p.returncode: errors.append(f"retained/behavioral authority failed: {' '.join(command)}: {p.stderr.strip() or p.stdout.strip()}")
for p in [
 "functions/api/_lib/service-economics-seasonal-capacity-reliability-decision-outcome-continuity.js",
 "functions/api/admin/service_economics_seasonal_capacity_reliability_decision_readiness.js",
 "scripts/service_economics_seasonal_capacity_reliability_decision_outcome_continuity_test.mjs"
]:
    r=subprocess.run(["node","--check",p],cwd=ROOT,text=True,capture_output=True)
    if r.returncode: errors.append(f"{p} syntax failed: {r.stderr.strip() or r.stdout.strip()}")
migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])524(?:[^0-9]|$)",p.name)]
if migrations: errors.append("Build 524 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))
if errors:
    print("BUILD 524 SERVICE ECONOMICS, SEASONAL CAPACITY & RELIABILITY DECISION OUTCOME CONTINUITY AUTHORITY: FAIL")
    for e in errors: print(" -",e)
    sys.exit(1)
print("BUILD 524 SERVICE ECONOMICS, SEASONAL CAPACITY & RELIABILITY DECISION OUTCOME CONTINUITY AUTHORITY: PASS")
print(" - exact Build 514 independent-domain decision-readiness evidence remains authoritative")
print(" - explicit human outcomes require exact domain trace, reviewer/time/reference and completed truth-boundary review")
print(" - missing comparable history remains insufficient and cross-domain substitution is rejected")
print(" - Southern Ontario service limits remain source-owned; broad winter availability and working-temperature thresholds are not inferred")
print(" - provider billing/CPU/quota, scaling need and recovery success remain independent external evidence")
print(" - no pricing, booking, capacity, provider/recovery, canonical-HOLD, schema/storage, outreach or polling mutation is authorized")
