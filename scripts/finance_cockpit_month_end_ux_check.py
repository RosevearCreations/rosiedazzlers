#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "app/finance/index.html"
RUNTIME = ROOT / "apps/finance/finance-cockpit.js"
CLOSURE_ENDPOINT = ROOT / "functions/api/admin/accounting_month_end_closure.js"
CLOSURE_HELPER = ROOT / "functions/api/_lib/accounting-month-end-closure.js"
WORKFLOW = ROOT / ".github/workflows/finance-cockpit-month-end-ux-authority.yml"
QUEUE = ROOT / "AUTONOMOUS_RELEASE_QUEUE.md"
HANDOFF = ROOT / "AI_PROJECT_HANDOFF.md"
README = ROOT / "README.md"

for path in [PAGE, RUNTIME, CLOSURE_ENDPOINT, CLOSURE_HELPER, WORKFLOW, QUEUE, HANDOFF, README]:
    if not path.exists():
        raise SystemExit(f"Build 384 missing required file: {path.relative_to(ROOT)}")

page = PAGE.read_text(encoding="utf-8")
runtime = RUNTIME.read_text(encoding="utf-8")
endpoint = CLOSURE_ENDPOINT.read_text(encoding="utf-8")
helper = CLOSURE_HELPER.read_text(encoding="utf-8")
workflow = WORKFLOW.read_text(encoding="utf-8")
queue = QUEUE.read_text(encoding="utf-8")
handoff = HANDOFF.read_text(encoding="utf-8")
readme = README.read_text(encoding="utf-8")

for token in [
    'data-build="384"',
    "Finance Cockpit &amp; Month-End",
    "Quote &amp; commercial terms",
    "Deposit evidence",
    "Approved changes &amp; final balance",
    "Refunds &amp; tips",
    "Settlement reconciliation",
    "HST support",
    "Month-end close",
    "Accountant package",
    "Load month-end readiness",
    "/admin-accounting.html",
    "/admin-payments.html",
    "/admin-tax-review.html",
    "/admin-close.html",
    "/apps/finance/finance-cockpit.js?v=20260911build384",
]:
    if token not in page:
        raise SystemExit(f"Build 384 Finance cockpit token missing: {token}")

for token in [
    "'/api/admin/accounting_month_end_closure'",
    "method: 'GET'",
    "credentials: 'include'",
    "cache: 'no-store'",
    "close_ready_candidate",
    "booking_finance",
    "provider_payments",
    "bank_reconciliation",
    "hst_support",
    "receivables",
    "payables",
    "operator_approval_required",
    "addEventListener('click', loadReadiness)",
]:
    if token not in runtime:
        raise SystemExit(f"Build 384 runtime authority token missing: {token}")

for forbidden in [
    "setInterval(",
    "method: 'POST'",
    'method: "POST"',
    "/api/payments/",
    "capture_payment",
    "create_payment",
    "payment_intent",
    "mark_paid",
    "automatic_charge",
]:
    if forbidden.lower() in runtime.lower():
        raise SystemExit(f"Build 384 cockpit crosses a mutation/polling boundary: {forbidden}")

for token in [
    'requireActionAccess(access.actor, "finance.view")',
    "buildMonthEndClosureSnapshot",
    "onRequestGet",
    "onRequestPost",
    "methodNotAllowed",
]:
    if token not in endpoint:
        raise SystemExit(f"Build 384 must retain the Build 375 read endpoint contract: {token}")

for token in [
    "close_ready_candidate",
    "automatic_close: false",
    "accounting_posting: false",
    "booking_mutation: false",
    "customer_charge: false",
    "payment_provider_mutation: false",
    "operator_approval_required: true",
]:
    if token not in helper:
        raise SystemExit(f"Build 384 must retain Build 375 fail-closed closure authority: {token}")

for token in [
    "Build 383 — Mobile Detailer Field Workflow Hardening",
    "Build 384 — Finance Cockpit & Month-End UX",
    "Build 385 — Backup, Restore & Release Recovery Drill",
]:
    if token not in queue or token not in handoff:
        raise SystemExit(f"Build 384 release documentation is not converged: {token}")

if "Current source direction: **Build 384 — Finance Cockpit & Month-End UX**." not in readme:
    raise SystemExit("README must identify Build 384 as current source direction.")

for token in [
    "Build 384 — Finance Cockpit & Month-End UX",
    "production-exact-sha",
    "scripts/cloudflare_pages_production_acceptance.sh",
]:
    if token not in workflow:
        raise SystemExit(f"Build 384 workflow token missing: {token}")

subprocess.run(["node", "--check", str(RUNTIME)], cwd=ROOT, check=True)
subprocess.run(["node", "--check", str(CLOSURE_ENDPOINT)], cwd=ROOT, check=True)
subprocess.run(["node", "--check", str(CLOSURE_HELPER)], cwd=ROOT, check=True)

print("BUILD 384 FINANCE COCKPIT / MONTH-END UX: PASS")
