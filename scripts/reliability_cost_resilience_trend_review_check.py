#!/usr/bin/env python3
"""Build 474 source authority for Reliability, Cost & Resilience Trend Review."""
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

helper=read("functions/api/_lib/reliability-cost-resilience-trend-review.js")
endpoint=read("functions/api/admin/reliability_security_cost_reassessment.js")
client=read("assets/build434-reliability-reassessment.js")
page=read("admin-reliability-reassessment.html")
copy=read("admin-reliability-reassessment/index.html")
doc=read("BUILD474_RELIABILITY_COST_RESILIENCE_TREND_REVIEW.md")
queue=read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff=read("AI_PROJECT_HANDOFF.md")
readme=read("README.md")
source_gate=read(".github/workflows/development-source-gate.yml")
prod_gate=read(".github/workflows/production-business-acceptance-authority.yml")
workflow=read(".github/workflows/reliability-cost-resilience-trend-review-authority.yml")
blockers=read("STARTUP_GO_LIVE_BLOCKERS.md")

if page!=copy: errors.append("Build 474 reassessment route copies diverged")
if len(re.findall(r"<h1\b",page,re.I))!=1: errors.append("Build 474 page must retain exactly one H1")
require(helper,[
    "trend_enrichment_build: 474",
    'trend_authority: "reliability_cost_resilience_trend_review"',
    "most_recent_24h","preceding_six_day_daily_average",
    "bounded_window_comparison_is_capacity_forecast: false",
    "traffic_direction_proves_scaling_need: false",
    "cloudflare_provider_cost_trend_observed: false",
    "trend_storage_mutation_allowed: false",
    "permanent_polling: false"
],"Build 474 helper")
require(endpoint,[
    "buildReliabilityCostResilienceTrendReview",
    "buildReliabilityCostResilienceOperationalGuardrails",
    '"X-Rosie-Reassessment": "build-464-read-only"',
    '"X-Rosie-Trend-Review": "build-474-read-only"',
    'requireActionAccess(access.actor, "it.runtime.view")',
    '"GET,HEAD,OPTIONS"'
],"Build 474 endpoint")
for forbidden in ["onRequestPost","onRequestPut","onRequestPatch","onRequestDelete","setInterval("]:
    if forbidden in endpoint: errors.append(f"Build 474 endpoint contains forbidden mutation/polling token {forbidden!r}")
require(client,[
    "renderTrendReview",
    "reassessmentTrends",
    "Comparable first-party windows: YES",
    "No automatic refresh is running."
],"Build 474 client")
require(page,[
    'data-build474="reliability-cost-resilience-trend-review"',
    "Build 474 · bounded trend review",
    'id="reassessmentTrends"',
    "Single diagnostics, evidence-age and recovery-readiness snapshots do not establish longitudinal trends.",
    "Cloudflare billing, CPU consumption, quota state and dollar cost are not inferred"
],"Build 474 page")
require(doc,[
    "# Build 474 — Reliability, Cost & Resilience Trend Review",
    "preceding six days",
    "insufficient_comparable_history",
    "Cloudflare billing, CPU, quota and dollar-cost trend remain external",
    "Build 475 — Production Learning & Roadmap Renewal"
],"Build 474 contract")
require(queue,[
    "BUILD474_RELIABILITY_COST_RESILIENCE_TREND_REVIEW.md",
    "Production deployment/runtime/business acceptance",
],"retained Build 474 queue authority")
require(handoff,[
    "BUILD474_RELIABILITY_COST_RESILIENCE_TREND_REVIEW.md",
    "reliability_cost_resilience_trend_review_check.py",
],"retained Build 474 handoff authority")
require(readme,[
    "BUILD474_RELIABILITY_COST_RESILIENCE_TREND_REVIEW.md",
    "reliability_cost_resilience_trend_review_check.py",
    "Production is not considered GREEN from source promotion alone.",
],"retained Build 474 README authority")
require(blockers,["Provider","Recovery"],"canonical HOLD backlog")
for text,label in [(source_gate,"Development Source Gate"),(prod_gate,"Production Business Acceptance")]:
    require(text,[
        "python scripts/reliability_cost_resilience_trend_review_check.py",
        "node scripts/reliability_cost_resilience_trend_review_test.mjs"
    ],label)
require(workflow,[
    "Reliability Cost Resilience Trend Review Authority",
    "python scripts/reliability_cost_resilience_trend_review_check.py",
    "node scripts/reliability_cost_resilience_trend_review_test.mjs"
],"Build 474 workflow")

migrations=[p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])474(?:[^0-9]|$)",p.name)]
if migrations: errors.append("Build 474 must not introduce schema migration: "+", ".join(str(p.relative_to(ROOT)) for p in migrations))
if errors:
    print("BUILD 474 RELIABILITY COST RESILIENCE TREND REVIEW AUTHORITY: FAIL")
    for error in errors: print(" -",error)
    sys.exit(1)

commands=[
    ["node","scripts/reliability_cost_resilience_trend_review_test.mjs"],
    [sys.executable,"scripts/reliability_cost_resilience_operational_guardrails_check.py"],
    ["node","scripts/reliability_cost_resilience_operational_guardrails_test.mjs"],
    [sys.executable,"scripts/reliability_security_cost_resilience_reassessment_check.py"],
    [sys.executable,"scripts/current_reliability_security_cost_reassessment_check.py"],
    [sys.executable,"scripts/reliability_performance_cost_capacity_check.py"],
    [sys.executable,"scripts/security_privacy_recovery_drill_check.py"],
    [sys.executable,"scripts/recovery_evidence_closure_drill_readiness_check.py"],
    [sys.executable,"scripts/release_authority_documentation_convergence_check.py"]
]
for command in commands:
    proc=subprocess.run(command,cwd=ROOT,text=True,capture_output=True)
    if proc.returncode:
        print("BUILD 474 RELIABILITY COST RESILIENCE TREND REVIEW AUTHORITY: FAIL")
        print(" - "+" ".join(command)+" failed: "+(proc.stderr.strip() or proc.stdout.strip()))
        sys.exit(proc.returncode)
print("BUILD 474 RELIABILITY COST RESILIENCE TREND REVIEW AUTHORITY: PASS")
print(" - first-party 24h activity is compared only with the preceding six-day daily average")
print(" - single diagnostics, freshness and recovery snapshots never become fabricated longitudinal trends")
print(" - provider billing/CPU/quota/cost, scaling need, future capacity and real recovery remain uninferred")
print(" - no runtime/provider/schema/business mutation or permanent polling")
