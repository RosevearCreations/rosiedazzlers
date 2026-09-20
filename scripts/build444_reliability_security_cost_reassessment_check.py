#!/usr/bin/env python3
"""Build 444 source authority for Reliability, Security & Cost Reassessment."""
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

contract = read("BUILD444_RELIABILITY_SECURITY_COST_REASSESSMENT.md")
roadmap = read("FORWARD_BUILD_ROADMAP_436_445.md")
queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
readme = read("README.md")
handoff = read("AI_PROJECT_HANDOFF.md")
blockers = read("STARTUP_GO_LIVE_BLOCKERS.md")
retained_contract = read("BUILD434_RELIABILITY_SECURITY_COST_REASSESSMENT.md")
retained_checker = read("scripts/reliability_security_cost_reassessment_check.py")
retained_workflow = read(".github/workflows/reliability-security-cost-reassessment-authority.yml")
helper = read("functions/api/_lib/reliability-security-cost-reassessment.js")
endpoint = read("functions/api/admin/reliability_security_cost_reassessment.js")
page = read("admin-reliability-reassessment.html")
page_copy = read("admin-reliability-reassessment/index.html")
client = read("assets/build434-reliability-reassessment.js")
auth = read("assets/admin-auth.js")
nav = read("assets/app-core/module-navigation.js")
source_gate = read(".github/workflows/development-source-gate.yml")
prod_workflow = read(".github/workflows/production-business-acceptance-authority.yml")
prod_check = read("scripts/production_business_acceptance_check.py")
workflow = read(".github/workflows/build444-reliability-security-cost-reassessment-authority.yml")

if page != page_copy:
    errors.append("reassessment .html and folder-index routes must remain byte-identical")
if len(re.findall(r"<h1\b", page, re.I)) != 1:
    errors.append("reassessment page must contain exactly one H1")

require(contract, [
    "# Build 444 — Reliability, Security & Cost Reassessment",
    "436–443",
    "Cloudflare billing/CPU",
    "attack likelihood",
    "real recovery success",
    "No automatic scaling",
    "Build 445 — Production Learning & Roadmap Renewal",
], "Build 444 contract")
require(roadmap, [
    "Build 444 — Reliability, Security & Cost Reassessment",
    "Build 445 — Production Learning & Roadmap Renewal",
], "active roadmap")
require(queue, [
    "**Build 444 — Reliability, Security & Cost Reassessment** is the active bounded release.",
    "**Build 445 — Production Learning & Roadmap Renewal** is next",
    "BUILD444_RELIABILITY_SECURITY_COST_REASSESSMENT.md",
], "release queue")
require(readme, [
    "Current source direction: **Build 444 — Reliability, Security & Cost Reassessment**.",
    "## Current reliability, security & cost reassessment framework",
    "python scripts/build444_reliability_security_cost_reassessment_check.py",
], "README current authority")
require(handoff, [
    "BUILD444_RELIABILITY_SECURITY_COST_REASSESSMENT.md",
    ".github/workflows/build444-reliability-security-cost-reassessment-authority.yml",
    "scripts/build444_reliability_security_cost_reassessment_check.py",
], "project handoff")
require(blockers, [
    "Provider",
    "Recovery",
], "canonical HOLD backlog")
require(retained_contract, [
    "# Build 434 — Reliability, Security & Cost Reassessment",
    "Cloudflare billing",
    "recovery success",
], "retained Build 434 contract")
require(retained_checker, [
    "BUILD 434 RELIABILITY / SECURITY / COST REASSESSMENT AUTHORITY: PASS",
], "retained Build 434 checker")
require(retained_workflow, [
    "Build 434 — Reliability, Security & Cost Reassessment Authority",
], "retained Build 434 workflow")
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
    "automatic_scaling_allowed: false",
    "secret_rotation_allowed: false",
    "production_restore_allowed: false",
    "provider_mutation_allowed: false",
    "schema_migration_allowed: false",
], "retained reassessment helper")
require(endpoint, [
    'requireActionAccess(access.actor, "it.runtime.view")',
    "buildReliabilitySecurityCostReassessment",
    '"GET,HEAD,OPTIONS"',
], "retained reassessment endpoint")
for forbidden in ["onRequestPost", "onRequestPut", "onRequestPatch", "onRequestDelete", 'method: "POST"', 'method: "PATCH"', 'method: "DELETE"', "setInterval("]:
    if forbidden in endpoint:
        errors.append(f"Build 444 retained endpoint must not contain {forbidden!r}")
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
        errors.append(f"Build 444 retained client must not contain {forbidden!r}")
require(auth, ['case "admin-reliability-reassessment"'], "I.T. page auth ceiling")
require(nav, ['"/admin-reliability-reassessment.html"', '"page_key":"admin-reliability-reassessment"'], "module navigation")
require(source_gate, ["python scripts/build444_reliability_security_cost_reassessment_check.py"], "Development source gate")
require(prod_workflow, ["python scripts/build444_reliability_security_cost_reassessment_check.py"], "Production business workflow")
require(prod_check, [
    "build444_reliability_security_cost_reassessment",
    "scripts/build444_reliability_security_cost_reassessment_check.py",
], "Production business acceptance source authority")
require(workflow, [
    "Build 444 — Reliability, Security & Cost Reassessment Authority",
    "python scripts/build444_reliability_security_cost_reassessment_check.py",
    "python scripts/reliability_security_cost_reassessment_check.py",
], "Build 444 workflow")

migrations = [p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])444(?:[^0-9]|$)", p.name)]
if migrations:
    errors.append("Build 444 must not introduce a schema migration: " + ", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("BUILD 444 RELIABILITY / SECURITY / COST REASSESSMENT AUTHORITY: FAIL")
    for error in errors:
        print(" -", error)
    sys.exit(1)

commands = (
    [sys.executable, "scripts/reliability_security_cost_reassessment_check.py"],
    [sys.executable, "scripts/reliability_performance_cost_capacity_check.py"],
    [sys.executable, "scripts/security_privacy_recovery_drill_check.py"],
    [sys.executable, "scripts/backup_recovery_evidence_closure_check.py"],
    [sys.executable, "scripts/production_observability_self_diagnostics_check.py"],
    [sys.executable, "scripts/it_readiness_release_control_audit.py"],
    [sys.executable, "scripts/release_authority_documentation_convergence_check.py"],
)
for cmd in commands:
    proc = subprocess.run(cmd, cwd=ROOT, text=True, capture_output=True)
    if proc.returncode:
        print("BUILD 444 RELIABILITY / SECURITY / COST REASSESSMENT AUTHORITY: FAIL")
        print(f" - {' '.join(cmd)} failed: {proc.stderr.strip() or proc.stdout.strip()}")
        sys.exit(proc.returncode)

print("BUILD 444 RELIABILITY / SECURITY / COST REASSESSMENT AUTHORITY: PASS")
print(" - Builds 436–443 are reassessed through retained read-only reliability/security/recovery authorities")
print(" - Cloudflare billing/CPU, future capacity, attack likelihood and real recovery success remain uninferred")
print(" - existing I.T. role ceilings and manual-refresh-only behavior remain unchanged")
print(" - no scaling/retry/cache/secret/restore/DNS/R2/provider/schema/customer/business mutation or permanent polling")
