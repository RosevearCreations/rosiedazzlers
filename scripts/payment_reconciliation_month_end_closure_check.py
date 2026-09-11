#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
HELPER = ROOT / "functions/api/_lib/accounting-month-end-closure.js"
ENDPOINT = ROOT / "functions/api/admin/accounting_month_end_closure.js"
CHECKLIST = ROOT / "functions/api/admin/accounting_month_end_checklist.js"
ACCOUNTANT = ROOT / "functions/api/admin/accounting_accountant_package.js"
WORKFLOW = ROOT / ".github/workflows/payment-reconciliation-month-end-closure-authority.yml"

for path in [HELPER, ENDPOINT, CHECKLIST, ACCOUNTANT, WORKFLOW]:
    if not path.exists():
        raise SystemExit(f"Build 375 missing required file: {path.relative_to(ROOT)}")

helper = HELPER.read_text(encoding="utf-8")
endpoint = ENDPOINT.read_text(encoding="utf-8")
checklist = CHECKLIST.read_text(encoding="utf-8")
accountant = ACCOUNTANT.read_text(encoding="utf-8")

for token in [
    "buildMonthEndClosureSnapshot",
    "close_ready_candidate",
    "booking_finance",
    "provider_payments",
    "bank_reconciliation",
    "hst_support",
    "receivables",
    "payables",
    "automatic_close: false",
    "accounting_posting: false",
    "payment_provider_mutation: false",
    "operator_approval_required: true",
]:
    if token not in helper:
        raise SystemExit(f"Build 375 closure authority token missing: {token}")

for token in [
    'requireActionAccess(access.actor, "finance.view")',
    "buildMonthEndClosureSnapshot",
    "onRequestPost",
    "methodNotAllowed",
]:
    if token not in endpoint:
        raise SystemExit(f"Build 375 endpoint token missing: {token}")

if "buildMonthEndClosureSnapshot" not in checklist or "closure" not in checklist:
    raise SystemExit("Build 375 checklist must expose computed closure evidence.")

for token in [
    "year_end_close",
    "checklist_complete",
    "payment_reconciliation_authority",
    "payment_reconciliation_snapshot_included: false",
    "manual_approval_required: true",
]:
    if token not in accountant:
        raise SystemExit(f"Build 375 accountant export handoff token missing: {token}")

for forbidden in [
    "payment_intent",
    "capture_payment",
    "create_payment",
    "automatic_charge",
    "resolution=merge-duplicates",
]:
    if forbidden in helper.lower() or forbidden in endpoint.lower():
        raise SystemExit(f"Build 375 read-only close authority crosses a mutation boundary: {forbidden}")

for path in [HELPER, ENDPOINT, CHECKLIST, ACCOUNTANT]:
    subprocess.run(["node", "--check", str(path)], cwd=ROOT, check=True)

print("BUILD 375 PAYMENT RECONCILIATION / MONTH-END CLOSURE: PASS")
