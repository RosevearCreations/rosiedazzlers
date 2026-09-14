#!/usr/bin/env python3
"""Retained fail-closed source authority for Build 395 whole-platform Production growth readiness."""
from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github" / "workflows" / "production-business-growth-readiness-authority.yml"
PRODUCTION_WORKFLOW = ROOT / ".github" / "workflows" / "production-business-acceptance-authority.yml"
PRODUCTION_CHECK = ROOT / "scripts" / "production_business_acceptance_check.py"
CONTRACT = ROOT / "PRODUCTION_BUSINESS_ACCEPTANCE.md"
GROWTH = ROOT / "docs" / "PRODUCTION_BUSINESS_GROWTH_READINESS.md"
QUEUE = ROOT / "AUTONOMOUS_RELEASE_QUEUE.md"
HANDOFF = ROOT / "AI_PROJECT_HANDOFF.md"
README = ROOT / "README.md"
ROADMAP = ROOT / "FORWARD_BUILD_ROADMAP_386_395.md"
errors: list[str] = []


def read(path: Path, label: str) -> str:
    if not path.exists():
        errors.append(f"missing {label}: {path.relative_to(ROOT)}")
        return ""
    return path.read_text(encoding="utf-8", errors="ignore")


def require(text: str, needles: list[str], label: str) -> None:
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing required Build 395 contract: {needle!r}")


def queue_pair(text: str) -> tuple[int | None, int | None]:
    current = re.search(r"## Current release.*?\*\*Build\s+(\d{3})\s+—", text, re.S)
    next_release = re.search(r"## Next release.*?\*\*Build\s+(\d{3})\s+—", text, re.S)
    if not current or not next_release:
        errors.append("release queue cannot resolve living current/next release")
        return None, None
    return int(current.group(1)), int(next_release.group(1))


def handoff_pair(text: str) -> tuple[int | None, int | None]:
    builds = [int(value) for value in re.findall(r"\*\*Build\s+(\d{3})\s+—", text)]
    if len(builds) < 2:
        errors.append("project handoff cannot resolve living current/next release")
        return None, None
    return builds[0], builds[1]


workflow = read(WORKFLOW, "Build 395 workflow")
production_workflow = read(PRODUCTION_WORKFLOW, "durable Production workflow")
production_check = read(PRODUCTION_CHECK, "durable Production source check")
contract = read(CONTRACT, "Production business acceptance contract")
growth = read(GROWTH, "Build 395 growth-readiness contract")
queue = read(QUEUE, "release queue")
handoff = read(HANDOFF, "project handoff")
readme = read(README, "README")
roadmap = read(ROADMAP, "historical forward roadmap")

required_files = [
    "scripts/service_commercial_accuracy_check.py",
    "scripts/service_commercial_accuracy_test.mjs",
    "scripts/build389_local_seo_service_landing_proof_check.py",
    "scripts/build389_local_seo_service_landing_proof_test.mjs",
    "scripts/build390_booking_quote_estimate_hardening_test.mjs",
    "scripts/build391_photo_studio_r2_reliability_test.mjs",
    "scripts/build392_retention_maintenance_fleet_activation_check.py",
    "scripts/build392_retention_maintenance_fleet_activation_test.mjs",
    "scripts/build393_operations_inventory_job_cost_evidence_check.py",
    "scripts/build393_operations_inventory_job_cost_evidence_test.mjs",
    "scripts/build394_finance_close_reconciliation_accountant_export_check.py",
    "scripts/build394_finance_close_reconciliation_accountant_export_test.mjs",
    "scripts/it_readiness_release_control_audit.py",
    "scripts/production_observability_self_diagnostics_check.py",
    "scripts/performance_accessibility_security_check.py",
    "scripts/release_rollback_recovery_check.py",
    "scripts/release_hygiene_check.py",
]
for rel in required_files:
    if not (ROOT / rel).exists():
        errors.append(f"whole-platform retained authority is missing: {rel}")

require(workflow, [
    "name: Build 395 — Production Business Acceptance & Growth Readiness",
    "- 'build395-*'",
    "- dev",
    "- main",
    "production-business-growth-readiness",
    "python scripts/build395_production_business_growth_readiness_check.py",
    "python scripts/production_business_acceptance_check.py",
    "python scripts/release_authority_documentation_convergence_check.py",
    "production-exact-sha:",
    "if: github.event_name == 'push' && github.ref == 'refs/heads/main'",
    "bash scripts/cloudflare_pages_production_acceptance.sh",
], "Build 395 workflow")

require(production_workflow, [
    "Validate commercial, local SEO, condition-quote and media convergence authorities",
    "Validate retention, operations and finance convergence authorities",
    "Validate admin I.T. diagnostics and observability authorities",
    "python scripts/service_commercial_accuracy_check.py",
    "python scripts/build389_local_seo_service_landing_proof_check.py",
    "node scripts/build390_booking_quote_estimate_hardening_test.mjs",
    "node scripts/build391_photo_studio_r2_reliability_test.mjs",
    "python scripts/build392_retention_maintenance_fleet_activation_check.py",
    "python scripts/build393_operations_inventory_job_cost_evidence_check.py",
    "python scripts/build394_finance_close_reconciliation_accountant_export_check.py",
    "python scripts/it_readiness_release_control_audit.py",
    "python scripts/production_observability_self_diagnostics_check.py",
    "Verify exact Cloudflare Production deployment and runtime",
], "durable Production workflow")

require(production_check, [
    '"commercial_growth"',
    '"operations_finance"',
    '"it_observability"',
    "whole-platform growth readiness authorities are present",
], "durable Production source check")

require(contract, [
    "Commercial + local proof",
    "Condition-aware quote + media",
    "Operations + job cost",
    "Admin/I.T. + observability",
    "Growth readiness",
    "does not fabricate a real customer journey",
], "Production acceptance contract")

require(growth, [
    "Build 395 — Production Business Acceptance & Growth Readiness",
    "Anonymous acquisition",
    "Condition-aware booking",
    "Operations/inventory/job-cost",
    "Payment/finance",
    "I.T. diagnostics and observability",
    "Performance, accessibility, security and recovery",
    "exact Production SHA",
    "No real-world evidence is synthesized",
    "Production GREEN is fail-closed",
], "Build 395 growth-readiness contract")

queue_state = queue_pair(queue)
handoff_state = handoff_pair(handoff)
if queue_state != handoff_state:
    errors.append(f"retained Build 395 authority sees divergent living queue/handoff state: {queue_state} vs {handoff_state}")
if queue_state[0] is not None and queue_state[1] is not None:
    if queue_state[0] < 395:
        errors.append(f"living release regressed behind retained Build 395 authority: {queue_state}")
    if queue_state[1] != queue_state[0] + 1:
        errors.append(f"living release is not sequential: {queue_state}")

require(readme, [
    "Current source direction: **Build ",
    "Production is not considered GREEN from source promotion alone.",
], "README")
require(roadmap, [
    "### Build 395 — Production Business Acceptance & Growth Readiness",
    "### Build 396 — Growth Baseline & Forward Roadmap Renewal",
], "historical forward roadmap")

for text, label in [(workflow, "Build 395 workflow"), (production_workflow, "Production workflow")]:
    if re.search(r"(?m)^\s*(contents|deployments|actions):\s*write\s*$", text):
        errors.append(f"{label} grants write permission")
    for needle in ["git push", "git update-ref", "wrangler pages deploy", "stripe trigger", "curl -X POST", "curl -X DELETE", "curl -X PATCH"]:
        if needle.lower() in text.lower():
            errors.append(f"{label} contains mutation primitive: {needle}")

migrations = [p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])395(?:[^0-9]|$)", p.name)]
if migrations:
    errors.append("Build 395 must not introduce a database migration: " + ", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("BUILD 395 PRODUCTION BUSINESS ACCEPTANCE & GROWTH READINESS: FAIL")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("BUILD 395 PRODUCTION BUSINESS ACCEPTANCE & GROWTH READINESS: PASS")
print(f"- retained Build 395 authority is compatible with living release {queue_state[0]}/{queue_state[1]}")
print("- whole-platform growth readiness authorities remain present and composed into durable Production acceptance")
print("- exact-SHA Development/protected-main/Production evidence remains required and fail-closed")
print("- no schema, provider, business-data or destructive R2 mutation is authorized")
print("- real customer/payment/review/accounting/deployment evidence is never fabricated")
