#!/usr/bin/env python3
"""Build 464 source authority for Reliability, Cost & Resilience Operational Guardrails."""
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

contract = read("BUILD464_RELIABILITY_COST_RESILIENCE_OPERATIONAL_GUARDRAILS.md")
roadmap = read("FORWARD_BUILD_ROADMAP_456_465.md")
queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
readme = read("README.md")
handoff = read("AI_PROJECT_HANDOFF.md")
blockers = read("STARTUP_GO_LIVE_BLOCKERS.md")
retained454 = read("BUILD454_RELIABILITY_SECURITY_COST_RESILIENCE_REASSESSMENT.md")
retained457 = read("BUILD457_RECOVERY_EVIDENCE_CLOSURE_DRILL_READINESS.md")
helper = read("functions/api/_lib/reliability-cost-resilience-operational-guardrails.js")
endpoint = read("functions/api/admin/reliability_security_cost_reassessment.js")
page = read("admin-reliability-reassessment.html")
page_copy = read("admin-reliability-reassessment/index.html")
client = read("assets/build434-reliability-reassessment.js")
source_gate = read(".github/workflows/development-source-gate.yml")
prod_workflow = read(".github/workflows/production-business-acceptance-authority.yml")
prod_check = read("scripts/production_business_acceptance_check.py")
workflow = read(".github/workflows/reliability-cost-resilience-operational-guardrails-authority.yml")

if page != page_copy:
    errors.append("reassessment .html and folder-index routes must remain byte-identical")
if len(re.findall(r"<h1\b", page, re.I)) != 1:
    errors.append("reassessment page must contain exactly one H1")

require(contract, [
    "# Build 464 — Reliability, Cost & Resilience Operational Guardrails",
    "seven days",
    "thirty days",
    "Cloudflare billing, CPU consumption, quota state and dollar cost",
    "scaling requirement",
    "real Production restore",
    "No automatic scaling",
    "Build 465 — Production Learning & Roadmap Renewal",
], "Build 464 contract")
require(roadmap, [
    "Build 464 — Reliability, Cost & Resilience Operational Guardrails",
    "Build 465 — Production Learning & Roadmap Renewal",
], "active roadmap")
require(queue, [
    "BUILD464_RELIABILITY_COST_RESILIENCE_OPERATIONAL_GUARDRAILS.md",
    "FORWARD_BUILD_ROADMAP_456_465.md",
    "Production deployment/runtime/business acceptance",
], "release queue Build 464 authority")
require(readme, [
    "BUILD464_RELIABILITY_COST_RESILIENCE_OPERATIONAL_GUARDRAILS.md",
    "python scripts/reliability_cost_resilience_operational_guardrails_check.py",
    "Production is not considered GREEN from source promotion alone.",
], "README Build 464 authority")
require(handoff, [
    "BUILD464_RELIABILITY_COST_RESILIENCE_OPERATIONAL_GUARDRAILS.md",
    "provider-owned billing/CPU/quota",
    "real Production recovery",
    "Production deployment/runtime acceptance",
], "project handoff Build 464 authority")
require(blockers, ["Provider", "Recovery", "Build 464"], "canonical HOLD backlog")
require(retained454, ["# Build 454 — Reliability, Security, Cost & Resilience Reassessment", "Cloudflare billing", "real Production restore"], "retained Build 454")
require(retained457, ["# Build 457 — Recovery Evidence Closure & Drill Readiness", "real Production restore"], "retained Build 457")
require(helper, [
    'release_authority: "reliability_cost_resilience_operational_guardrails"',
    "release_enrichment_build: 464",
    "CURRENT_MAX_DAYS = 7",
    "STALE_AFTER_DAYS = 30",
    'status: "external_evidence_required"',
    "cloudflare_quota_observed: false",
    "scaling_need_established: false",
    "real_production_restore_observed: false",
    "stale_evidence_treated_as_current: false",
    "automatic_scaling_allowed: false",
    "permanent_polling: false",
], "Build 464 guardrail helper")
require(endpoint, [
    "buildReliabilitySecurityCostReassessment",
    "buildReliabilityCostResilienceOperationalGuardrails",
    'requireActionAccess(access.actor, "it.runtime.view")',
    '"GET,HEAD,OPTIONS"',
    '"build-464-read-only"',
], "retained reassessment endpoint")
for forbidden in ["onRequestPost", "onRequestPut", "onRequestPatch", "onRequestDelete", 'method: "POST"', 'method: "PATCH"', 'method: "DELETE"', "setInterval("]:
    if forbidden in endpoint:
        errors.append(f"Build 464 endpoint must not contain {forbidden!r}")
require(page, [
    'data-build464="reliability-cost-resilience-operational-guardrails"',
    "Operational guardrails",
    "Evidence age review",
    "Cloudflare billing, CPU consumption, quota state and dollar cost are not inferred",
], "reassessment page")
require(client, [
    'fetch("/api/admin/reliability_security_cost_reassessment"',
    'method:"GET"',
    "renderGuardrails",
    "renderEvidenceAge",
    "No automatic refresh is running.",
], "reassessment client")
for forbidden in ["setInterval(", "localStorage", "sessionStorage", 'method:"POST"', 'method:"PATCH"', 'method:"DELETE"']:
    if forbidden in client:
        errors.append(f"Build 464 client must not contain {forbidden!r}")
require(source_gate, [
    "python -m py_compile scripts/reliability_cost_resilience_operational_guardrails_check.py",
    "node --check scripts/reliability_cost_resilience_operational_guardrails_test.mjs",
    "python scripts/reliability_cost_resilience_operational_guardrails_check.py",
    "node scripts/reliability_cost_resilience_operational_guardrails_test.mjs",
], "Development source gate")
require(prod_workflow, [
    "python -m py_compile scripts/reliability_cost_resilience_operational_guardrails_check.py",
    "node --check scripts/reliability_cost_resilience_operational_guardrails_test.mjs",
    "python scripts/reliability_cost_resilience_operational_guardrails_check.py",
    "node scripts/reliability_cost_resilience_operational_guardrails_test.mjs",
], "Production business workflow")
require(prod_check, [
    "reliability_cost_resilience_operational_guardrails",
    "scripts/reliability_cost_resilience_operational_guardrails_check.py",
], "Production business acceptance source authority")
require(workflow, [
    "Reliability, Cost & Resilience Operational Guardrails Authority",
    "python scripts/reliability_cost_resilience_operational_guardrails_check.py",
    "node scripts/reliability_cost_resilience_operational_guardrails_test.mjs",
], "Build 464 workflow")

migrations = [p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])464(?:[^0-9]|$)", p.name)]
if migrations:
    errors.append("Build 464 must not introduce a schema migration: " + ", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("BUILD 464 RELIABILITY / COST / RESILIENCE OPERATIONAL GUARDRAILS AUTHORITY: FAIL")
    for error in errors:
        print(" -", error)
    sys.exit(1)

commands = (
    [sys.executable, "scripts/reliability_security_cost_resilience_reassessment_check.py"],
    [sys.executable, "scripts/current_reliability_security_cost_reassessment_check.py"],
    [sys.executable, "scripts/reliability_performance_cost_capacity_check.py"],
    [sys.executable, "scripts/security_privacy_recovery_drill_check.py"],
    [sys.executable, "scripts/recovery_evidence_closure_drill_readiness_check.py"],
    [sys.executable, "scripts/backup_recovery_evidence_closure_check.py"],
    [sys.executable, "scripts/production_observability_self_diagnostics_check.py"],
    [sys.executable, "scripts/production_support_diagnostics_check.py"],
    [sys.executable, "scripts/it_readiness_release_control_audit.py"],
    [sys.executable, "scripts/release_authority_documentation_convergence_check.py"],
    ["node", "scripts/reliability_cost_resilience_operational_guardrails_test.mjs"],
)
for cmd in commands:
    proc = subprocess.run(cmd, cwd=ROOT, text=True, capture_output=True)
    if proc.returncode:
        print("BUILD 464 RELIABILITY / COST / RESILIENCE OPERATIONAL GUARDRAILS AUTHORITY: FAIL")
        print(f" - {' '.join(cmd)} failed: {proc.stderr.strip() or proc.stdout.strip()}")
        sys.exit(proc.returncode)

print("BUILD 464 RELIABILITY / COST / RESILIENCE OPERATIONAL GUARDRAILS AUTHORITY: PASS")
print(" - retained I.T. reassessment remains the single read-only operator surface")
print(" - evidence age is explicit: current <=7 days, aging 8–30 days, stale >30 days")
print(" - provider billing/CPU/quota/cost, scaling need and real Production recovery remain uninferred")
print(" - no scaling/retry/cache/secret/restore/DNS/R2/provider/schema/business/accounting/inventory/outreach mutation or permanent polling")
