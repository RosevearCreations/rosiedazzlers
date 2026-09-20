#!/usr/bin/env python3
"""Build 454 source authority for Reliability, Security, Cost & Resilience Reassessment."""
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

contract = read("BUILD454_RELIABILITY_SECURITY_COST_RESILIENCE_REASSESSMENT.md")
roadmap = read("FORWARD_BUILD_ROADMAP_446_455.md")
queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
readme = read("README.md")
handoff = read("AI_PROJECT_HANDOFF.md")
blockers = read("STARTUP_GO_LIVE_BLOCKERS.md")
retained444 = read("BUILD444_RELIABILITY_SECURITY_COST_REASSESSMENT.md")
retained434 = read("BUILD434_RELIABILITY_SECURITY_COST_REASSESSMENT.md")
current444 = read("scripts/current_reliability_security_cost_reassessment_check.py")
helper = read("functions/api/_lib/reliability-security-cost-reassessment.js")
endpoint = read("functions/api/admin/reliability_security_cost_reassessment.js")
page = read("admin-reliability-reassessment.html")
page_copy = read("admin-reliability-reassessment/index.html")
client = read("assets/build434-reliability-reassessment.js")
source_gate = read(".github/workflows/development-source-gate.yml")
prod_workflow = read(".github/workflows/production-business-acceptance-authority.yml")
workflow = read(".github/workflows/reliability-security-cost-resilience-reassessment-authority.yml")

if page != page_copy:
    errors.append("reassessment .html and folder-index routes must remain byte-identical")
if len(re.findall(r"<h1\b", page, re.I)) != 1:
    errors.append("reassessment page must contain exactly one H1")

require(contract, [
    "# Build 454 — Reliability, Security, Cost & Resilience Reassessment",
    "446–453",
    "Cloudflare billing",
    "privacy/session",
    "observability",
    "real Production restore",
    "No automatic scaling",
    "Build 455 — Production Learning & Roadmap Renewal",
], "Build 454 contract")
require(roadmap, [
    "Build 454 — Reliability, Security, Cost & Resilience Reassessment",
    "Build 455 — Production Learning & Roadmap Renewal",
], "active roadmap")
require(queue, [
    "BUILD454_RELIABILITY_SECURITY_COST_RESILIENCE_REASSESSMENT.md",
    "**Build 454 — Reliability, Security, Cost & Resilience Reassessment** is the active bounded release.",
    "**Build 455 — Production Learning & Roadmap Renewal** is next only after the current release is independently GREEN on protected `main`.",
], "release queue")
require(readme, [
    "Current source direction: **Build 454 — Reliability, Security, Cost & Resilience Reassessment**.",
    "BUILD454_RELIABILITY_SECURITY_COST_RESILIENCE_REASSESSMENT.md",
    "python scripts/reliability_security_cost_resilience_reassessment_check.py",
], "README")
require(handoff, [
    "**Build 454 — Reliability, Security, Cost & Resilience Reassessment** is the active bounded release.",
    "BUILD454_RELIABILITY_SECURITY_COST_RESILIENCE_REASSESSMENT.md",
    "provider-owned billing/CPU",
    "real Production recovery",
], "project handoff")
require(blockers, ["Provider", "Recovery", "Build 454"], "canonical HOLD backlog")
require(retained444, ["# Build 444 — Reliability, Security & Cost Reassessment", "Cloudflare billing/CPU", "recovery"], "retained Build 444 contract")
require(retained434, ["# Build 434 — Reliability, Security & Cost Reassessment", "Cloudflare billing", "recovery"], "retained Build 434 contract")
require(current444, ["BUILD 444 RELIABILITY / SECURITY / COST REASSESSMENT AUTHORITY: PASS"], "retained Build 444 checker")
require(helper, [
    "build: 434",
    'authority: "reliability_security_cost_reassessment"',
    "cloudflare_billing_or_cpu_usage_measured: false",
    "cloudflare_cost_amount_inferred: false",
    "future_capacity_guaranteed: false",
    "attack_likelihood_inferred: false",
    "recovery_success_inferred: false",
    "read_only: true",
    "manual_refresh_only: true",
    "permanent_polling: false",
], "retained reassessment helper")
require(endpoint, [
    'requireActionAccess(access.actor, "it.runtime.view")',
    "buildReliabilitySecurityCostReassessment",
    '"GET,HEAD,OPTIONS"',
], "retained reassessment endpoint")
for forbidden in ["onRequestPost", "onRequestPut", "onRequestPatch", "onRequestDelete", 'method: "POST"', 'method: "PATCH"', 'method: "DELETE"', "setInterval("]:
    if forbidden in endpoint:
        errors.append(f"Build 454 retained endpoint must not contain {forbidden!r}")
require(page, [
    'data-build434="reliability-security-cost-reassessment"',
    "Reliability, Security &amp; Cost Reassessment",
    "Cloudflare billing, CPU consumption, future capacity, attack likelihood and recovery success are not inferred",
], "retained reassessment page")
require(client, [
    'fetch("/api/admin/reliability_security_cost_reassessment"',
    'method:"GET"',
    "No automatic refresh is running.",
], "retained reassessment client")
for forbidden in ["setInterval(", "localStorage", "sessionStorage", 'method:"POST"', 'method:"PATCH"', 'method:"DELETE"']:
    if forbidden in client:
        errors.append(f"Build 454 retained client must not contain {forbidden!r}")
require(source_gate, [
    "python -m py_compile scripts/reliability_security_cost_resilience_reassessment_check.py",
    "python scripts/reliability_security_cost_resilience_reassessment_check.py",
], "Development source gate")
require(prod_workflow, [
    "python -m py_compile scripts/reliability_security_cost_resilience_reassessment_check.py",
    "python scripts/reliability_security_cost_resilience_reassessment_check.py",
], "Production business workflow")
require(workflow, [
    "Build 454 — Reliability, Security, Cost & Resilience Reassessment Authority",
    "python scripts/reliability_security_cost_resilience_reassessment_check.py",
], "Build 454 workflow")

migrations = [p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])454(?:[^0-9]|$)", p.name)]
if migrations:
    errors.append("Build 454 must not introduce a schema migration: " + ", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("BUILD 454 RELIABILITY / SECURITY / COST / RESILIENCE REASSESSMENT AUTHORITY: FAIL")
    for error in errors:
        print(" -", error)
    sys.exit(1)

commands = (
    [sys.executable, "scripts/current_reliability_security_cost_reassessment_check.py"],
    [sys.executable, "scripts/reliability_security_cost_reassessment_check.py"],
    [sys.executable, "scripts/reliability_performance_cost_capacity_check.py"],
    [sys.executable, "scripts/security_privacy_recovery_drill_check.py"],
    [sys.executable, "scripts/backup_recovery_evidence_closure_check.py"],
    [sys.executable, "scripts/recovery_artifact_drill_evidence_review_check.py"],
    [sys.executable, "scripts/production_observability_self_diagnostics_check.py"],
    [sys.executable, "scripts/production_support_diagnostics_check.py"],
    [sys.executable, "scripts/it_readiness_release_control_audit.py"],
    [sys.executable, "scripts/release_authority_documentation_convergence_check.py"],
)
for cmd in commands:
    proc = subprocess.run(cmd, cwd=ROOT, text=True, capture_output=True)
    if proc.returncode:
        print("BUILD 454 RELIABILITY / SECURITY / COST / RESILIENCE REASSESSMENT AUTHORITY: FAIL")
        print(f" - {' '.join(cmd)} failed: {proc.stderr.strip() or proc.stdout.strip()}")
        sys.exit(proc.returncode)

print("BUILD 454 RELIABILITY / SECURITY / COST / RESILIENCE REASSESSMENT AUTHORITY: PASS")
print(" - Builds 446–453 are reassessed through retained read-only reliability/security/recovery/observability authorities")
print(" - provider-owned Cloudflare billing/CPU, future capacity, attack likelihood and real recovery success remain uninferred")
print(" - existing I.T. role ceiling, single reassessment surface and manual-refresh-only behavior remain unchanged")
print(" - no scaling/retry/cache/secret/restore/DNS/R2/provider/schema/customer/business/accounting/inventory mutation or permanent polling")
