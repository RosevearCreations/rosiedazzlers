#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
errors = []


def read(path):
    file_path = ROOT / path
    if not file_path.exists():
        errors.append(f"missing {path}")
        return ""
    return file_path.read_text(encoding="utf-8", errors="ignore")


helper = read("functions/api/_lib/operations-job-cost-evidence.js")
endpoint = read("functions/api/admin/operations_job_cost_evidence.js")
test = read("scripts/build393_operations_inventory_job_cost_evidence_test.mjs")
policy = read("docs/OPERATIONS_INVENTORY_JOB_COST_EVIDENCE.md").lower()
workflow = read(".github/workflows/operations-inventory-job-cost-evidence-authority.yml")

for token in (
    'build: 393',
    'source_authority: "catalog_inventory_movements"',
    'inventory_authority: "catalog_inventory_items"',
    'reorder_authority: "catalog_purchase_orders"',
    'read_only: true',
    'mutation_authority: false',
    'second_inventory_ledger_created: false',
    'recorded_costs_only: true',
    'replay_safe_projection: true',
    'reversal_aware_projection: true',
):
    if token not in helper:
        errors.append(f"evidence helper missing {token}")

for token in (
    "requireStaffAccess",
    'capability: "manage_bookings"',
    'booking_id: `eq.${bookingId}`',
    "catalog_inventory_movements",
    "catalog_inventory_items",
    "catalog_purchase_orders",
    "mutation_authority: false",
    "schema_authority: false",
):
    if token not in endpoint:
        errors.append(f"operations evidence endpoint missing {token}")

for forbidden in (
    "insertCatalogMovement",
    "postJournalEntry",
    "method: 'POST'",
    'method: "POST"',
    "method: 'PATCH'",
    'method: "PATCH"',
    "method: 'DELETE'",
    'method: "DELETE"',
):
    if forbidden in endpoint:
        errors.append(f"read-only endpoint contains forbidden mutation authority: {forbidden}")

for token in (
    "canonical inventory movement",
    "read-only",
    "no second inventory ledger",
    "recorded costs",
    "replay",
    "reversal",
    "schema-neutral",
    "fail closed",
):
    if token not in policy:
        errors.append(f"Build 393 policy missing {token}")

for token in (
    "Build 393 — Operations, Inventory & Job-Cost Evidence Authority",
    "python scripts/build393_operations_inventory_job_cost_evidence_check.py",
    "node scripts/build393_operations_inventory_job_cost_evidence_test.mjs",
):
    if token not in workflow:
        errors.append(f"Build 393 workflow missing {token}")

if "BUILD 393 OPERATIONS / INVENTORY / JOB-COST EVIDENCE: PASS" not in test:
    errors.append("Build 393 executable contract test is missing PASS authority")

if any("393" in path.name.lower() for path in ROOT.rglob("*.sql")):
    errors.append("Build 393 must not introduce a schema migration")

commands = (
    ["node", "--check", "functions/api/_lib/operations-job-cost-evidence.js"],
    ["node", "--check", "functions/api/admin/operations_job_cost_evidence.js"],
    ["node", "--check", "scripts/build393_operations_inventory_job_cost_evidence_test.mjs"],
    ["node", "scripts/build393_operations_inventory_job_cost_evidence_test.mjs"],
)
for command in commands:
    proc = subprocess.run(command, cwd=ROOT, text=True, capture_output=True)
    if proc.returncode != 0:
        errors.append(f"{' '.join(command)} failed: {proc.stderr.strip() or proc.stdout.strip()}")

if errors:
    print("BUILD 393 OPERATIONS / INVENTORY / JOB-COST EVIDENCE AUTHORITY: FAIL")
    for error in errors:
        print(" -", error)
    raise SystemExit(1)

print("BUILD 393 OPERATIONS / INVENTORY / JOB-COST EVIDENCE AUTHORITY: PASS")
print(" - booking-scoped catalog inventory movements remain canonical")
print(" - job material costs derive only from recorded inventory costs")
print(" - replay duplicates and reversals are handled by a read-only projection")
print(" - low-stock/reorder and substitution evidence fail closed when incomplete")
print(" - no second inventory ledger, schema mutation, payment/provider mutation or Production business-data mutation")
