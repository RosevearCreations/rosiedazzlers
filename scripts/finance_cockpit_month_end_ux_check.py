#!/usr/bin/env python3
from pathlib import Path
import re
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
    'data-build="384"', "Finance Cockpit &amp; Month-End", "Quote &amp; commercial terms", "Deposit evidence",
    "Approved changes &amp; final balance", "Refunds &amp; tips", "Settlement reconciliation", "HST support",
    "Month-end close", "Accountant package", "Load month-end readiness", "/admin-accounting.html",
    "/admin-payments.html", "/admin-tax-review.html", "/admin-close.html",
    "/apps/finance/finance-cockpit.js?v=20260911build384",
]:
    if token not in page:
        raise SystemExit(f"Build 384 Finance cockpit token missing: {token}")

for token in [
    "'/api/admin/accounting_month_end_closure'", "method: 'GET'", "credentials: 'include'", "cache: 'no-store'",
    "close_ready_candidate", "booking_finance", "provider_payments", "bank_reconciliation", "hst_support",
    "receivables", "payables", "operator_approval_required", "addEventListener('click', loadReadiness)",
]:
    if token not in runtime:
        raise SystemExit(f"Build 384 runtime authority token missing: {token}")

for forbidden in ["setInterval(", "method: 'POST'", 'method: "POST"', "/api/payments/", "capture_payment", "create_payment", "payment_intent", "mark_paid", "automatic_charge"]:
    if forbidden.lower() in runtime.lower():
        raise SystemExit(f"Build 384 cockpit crosses a mutation/polling boundary: {forbidden}")

for token in ['requireActionAccess(access.actor, "finance.view")', "buildMonthEndClosureSnapshot", "onRequestGet", "onRequestPost", "methodNotAllowed"]:
    if token not in endpoint:
        raise SystemExit(f"Build 384 must retain the Build 375 read endpoint contract: {token}")
for token in ["close_ready_candidate", "automatic_close: false", "accounting_posting: false", "booking_mutation: false", "customer_charge: false", "payment_provider_mutation: false", "operator_approval_required: true"]:
    if token not in helper:
        raise SystemExit(f"Build 384 must retain Build 375 fail-closed closure authority: {token}")

current_match = re.search(r"\*\*Build\s+(\d{3})\s+—\s+[^*\n]+\*\*\s+is the active bounded release\.", queue)
next_match = re.search(r"\*\*Build\s+(\d{3})\s+—\s+[^*\n]+\*\*\s+is next only after", queue)
handoff_current = re.search(r"\*\*Build\s+(\d{3})\s+—\s+[^*\n]+\*\*\s+is the active bounded release\.", handoff)
handoff_next = re.search(r"\*\*Build\s+(\d{3})\s+—\s+[^*\n]+\*\*\s+is next only after", handoff)
if not all([current_match, next_match, handoff_current, handoff_next]):
    raise SystemExit("Build 384 cannot resolve living current/next release authority.")
current, next_release = int(current_match.group(1)), int(next_match.group(1))
if current < 384 or next_release != current + 1:
    raise SystemExit(f"Build 384 living release sequence is invalid: {[current, next_release]}")
if (int(handoff_current.group(1)), int(handoff_next.group(1))) != (current, next_release):
    raise SystemExit("Build 384 release queue and project handoff are not synchronized.")
if f"Current source direction: **Build {current} —" not in readme:
    raise SystemExit(f"README must identify current source release {current}.")

for token in ["Build 384 — Finance Cockpit & Month-End UX", "production-exact-sha", "scripts/cloudflare_pages_production_acceptance.sh"]:
    if token not in workflow:
        raise SystemExit(f"Build 384 workflow token missing: {token}")

subprocess.run(["node", "--check", str(RUNTIME)], cwd=ROOT, check=True)
subprocess.run(["node", "--check", str(CLOSURE_ENDPOINT)], cwd=ROOT, check=True)
subprocess.run(["node", "--check", str(CLOSURE_HELPER)], cwd=ROOT, check=True)

print("BUILD 384 FINANCE COCKPIT / MONTH-END UX: PASS")
print(f"- retained Finance authority is compatible with living release {current}/{next_release}")
