#!/usr/bin/env python3
"""Build 428 — Service Economics & Job Profitability source guard."""
from pathlib import Path
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

contract = read("BUILD428_SERVICE_ECONOMICS_JOB_PROFITABILITY.md")
helper = read("functions/api/_lib/service-economics-job-profitability.js")
accounting = read("functions/api/_lib/accounting-gl.js")
admin_html = read("admin-accounting.html")
admin_copy = read("admin-accounting/index.html")
admin_js = read("assets/admin-accounting-v301.js")
test = read("scripts/build428_service_economics_job_profitability_test.mjs")
focused_gate = read(".github/workflows/service-economics-job-profitability-authority.yml")
dev_gate = read(".github/workflows/development-source-gate.yml")
prod_gate = read(".github/workflows/production-business-acceptance-authority.yml")
prod_check = read("scripts/production_business_acceptance_check.py")
queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff = read("AI_PROJECT_HANDOFF.md")
readme = read("README.md")

require(contract, [
    "recorded costs",
    "completed-job",
    "read-only",
    "No automated price change",
    "protected-main",
], "Build 428 contract")

require(helper, [
    "build: 428",
    "evidence_status",
    "recorded_material_cost_cad",
    "cogs_reconciliation_status",
    "pricing_review_contribution_cad",
    "missing_evidence_fails_closed: true",
    "pricing_mutation: false",
    "purchasing_mutation: false",
    "accounting_posting_mutation: false",
    "payment_provider_mutation: false",
], "Build 428 helper")

require(accounting, [
    'import { buildServiceEconomicsJobProfitability } from "./service-economics-job-profitability.js";',
    "loadInventoryMovementsForBookings",
    "loadInventoryItemsForEconomics",
    "posted_cogs:",
    "buildServiceEconomicsJobProfitability({",
], "accounting integration")

require(admin_html, [
    "Service economics & job profitability",
    "Evidence-backed review",
], "Finance cockpit")
if admin_html != admin_copy:
    errors.append("admin-accounting.html and admin-accounting/index.html are not byte-identical")

require(admin_js, [
    "Evidence ready",
    "Recorded materials",
    "COGS variance",
    "pricing_review_contribution_cad",
    "evidence_reasons",
], "Finance cockpit client")

require(test, [
    "BUILD 428 SERVICE ECONOMICS / JOB PROFITABILITY: PASS",
    "missing item costs or staff rates fail closed",
], "Build 428 executable contract test")

require(focused_gate, [
    "Build 428 — Service Economics & Job Profitability",
    "python -m py_compile scripts/build428_service_economics_job_profitability_check.py",
    "python scripts/build428_service_economics_job_profitability_check.py",
    "node scripts/build428_service_economics_job_profitability_test.mjs",
], "focused Build 428 authority")

for numbered_call in [
    "python -m py_compile scripts/build428_service_economics_job_profitability_check.py",
    "python scripts/build428_service_economics_job_profitability_check.py",
    "node scripts/build428_service_economics_job_profitability_test.mjs",
]:
    if numbered_call in dev_gate:
        errors.append(f"durable Development source gate must not call numbered Build 428 helper: {numbered_call}")

require(prod_gate, [
    "Validate service economics & job profitability authority",
    "python scripts/build428_service_economics_job_profitability_check.py",
    "node scripts/build428_service_economics_job_profitability_test.mjs",
], "Production business authority")

require(prod_check, [
    '"service_economics_job_profitability"',
    "scripts/build428_service_economics_job_profitability_check.py",
    "scripts/build428_service_economics_job_profitability_test.mjs",
    "Validate service economics & job profitability authority",
], "Production business source authority")

for text, label in [(queue, "queue"), (handoff, "handoff"), (readme, "README")]:
    require(text, [
        "BUILD428_SERVICE_ECONOMICS_JOB_PROFITABILITY.md",
    ], label)

for forbidden in [
    "postJournalEntry(", "method: \"POST\"", "method: 'POST'",
    "method: \"PATCH\"", "method: 'PATCH'", "method: \"DELETE\"", "method: 'DELETE'",
]:
    if forbidden in helper:
        errors.append(f"Build 428 helper contains forbidden mutation authority: {forbidden}")

if any("428" in path.name.lower() for path in ROOT.rglob("*.sql")):
    errors.append("Build 428 must not introduce a schema migration")

commands = (
    ["node", "--check", "functions/api/_lib/service-economics-job-profitability.js"],
    ["node", "--check", "functions/api/_lib/accounting-gl.js"],
    ["node", "--check", "assets/admin-accounting-v301.js"],
    ["node", "--check", "scripts/build428_service_economics_job_profitability_test.mjs"],
    ["node", "scripts/build428_service_economics_job_profitability_test.mjs"],
)
for command in commands:
    proc = subprocess.run(command, cwd=ROOT, text=True, capture_output=True)
    if proc.returncode != 0:
        errors.append(f"{' '.join(command)} failed: {proc.stderr.strip() or proc.stdout.strip()}")

if errors:
    print("SERVICE ECONOMICS & JOB PROFITABILITY: FAIL")
    for error in errors:
        print(" -", error)
    sys.exit(1)

print("SERVICE ECONOMICS & JOB PROFITABILITY: PASS")
print(" - recorded explicit job-use material cost is separated from posted accounting COGS")
print(" - missing item cost, approval/posting linkage, staff rate or cash/refund evidence fails closed")
print(" - pricing-review contribution is emitted only when required material and labour evidence is complete")
print(" - Finance cockpit exposes evidence status/reasons without automatically changing prices")
print(" - no schema, purchasing, inventory, accounting, payment/provider or customer/booking mutation is authorized")
