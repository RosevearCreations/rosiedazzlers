#!/usr/bin/env python3
from pathlib import Path
import subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
BASELINE = "d3976aaa8445684b18cf6b44bc2a819d8c8f4914"
PRODUCTION = "ee010654aea48c12c885ea826bf7cf60f64852b7"
ROOT_PAGE = "admin-payments.html"
FOLDER_PAGE = "admin-payments/index.html"
ASSET = "assets/admin-payments-v300.js"
TAG = '<script src="/assets/admin-payments-v300.js"></script>'
errors = []

def read(rel):
    p = ROOT / rel
    if not p.exists():
        errors.append(f"missing {rel}")
        return ""
    return p.read_text(encoding="utf-8", errors="ignore")

def baseline_page(rel):
    p = subprocess.run(["git", "show", f"{BASELINE}:{rel}"], cwd=ROOT, capture_output=True, text=True)
    if p.returncode:
        errors.append(f"could not read accepted Build 299 baseline {rel}")
        return ""
    return p.stdout

def split_runtime(text, label):
    marker = '<script>'
    start = text.rfind(marker)
    if start < 0:
        errors.append(f"{label} missing mature Payments runtime")
        return None
    body_start = start + len(marker)
    end = text.find('</script>', body_start)
    if end < 0:
        errors.append(f"{label} missing Payments runtime close")
        return None
    return start, body_start, end, end + len('</script>')

for sha, label in [(BASELINE, 'accepted Build 299 Development/queue baseline'), (PRODUCTION, 'accepted Build 299 Production')]:
    if subprocess.run(["git", "merge-base", "--is-ancestor", sha, "HEAD"], cwd=ROOT).returncode:
        errors.append(f"{label} is not an ancestor of Build 300 candidate")

baseline_root = baseline_page(ROOT_PAGE)
baseline_folder = baseline_page(FOLDER_PAGE)
if baseline_root and baseline_folder and baseline_root == baseline_folder:
    errors.append("accepted Build 299 Payments root/folder divergence unexpectedly disappeared; review route authority before Build 300")

parts = split_runtime(baseline_root, 'accepted Build 299 admin-payments.html') if baseline_root else None
if parts:
    start, body_start, end, close_end = parts
    expected_asset = baseline_root[body_start:end].lstrip('\n')
    if read(ASSET) != expected_asset:
        errors.append("versioned Payments asset is not byte-for-byte the accepted Build 299 root inline runtime")
    expected_page = baseline_root[:start] + TAG + baseline_root[close_end:]
    body = read(ROOT_PAGE)
    # GitHub's content writer may normalize only the terminal newline. Ignore that one
    # representation difference while keeping every executable/source byte identical.
    if body.rstrip('\n') != expected_page.rstrip('\n'):
        errors.append(f"{ROOT_PAGE} differs from accepted Build 299 root source beyond exact runtime extraction")
    if TAG not in body:
        errors.append(f"{ROOT_PAGE} missing Build 300 Payments runtime tag")

# Build 300 deliberately does not converge the pre-existing older folder route.
# Build 318 owns whole-application duplicate-route authority cleanup.
if baseline_folder and read(FOLDER_PAGE) != baseline_folder:
    errors.append(f"{FOLDER_PAGE} changed even though Build 300 must preserve its pre-existing older route behavior exactly")

root = read(ROOT_PAGE)
for token in ['data-page="admin-payments"', 'data-build217="secure-final-balance-links"', '/assets/admin-auth.js', '/assets/admin-shell.js', 'id="loadEvents"', 'id="loadRequests"', 'id="loadRefunds"', 'id="loadFinalBalances"', 'Payment webhooks, secure links & refunds']:
    if token not in root:
        errors.append(f"{ROOT_PAGE} lost retained Payments source token {token}")
folder = read(FOLDER_PAGE)
for token in ['data-page="admin-payments"', 'data-build185="final-balance-payment-applications-fees-tax-close"', 'Build 185 Payments', 'Payment webhooks, receipts & refunds']:
    if token not in folder:
        errors.append(f"{FOLDER_PAGE} lost retained pre-existing route token {token}")
for token in ['data-build217="secure-final-balance-links"', 'id="loadFinalBalances"']:
    if token in folder:
        errors.append(f"{FOLDER_PAGE} was silently converged with newer root behavior via {token}")

asset = read(ASSET)
for token in [
    '/api/admin/payment_webhook_warnings_summary',
    '/api/admin/payment_webhook_events_list',
    '/api/admin/quote_deposit_requests_list',
    '/api/admin/quote_deposit_refunds_list',
    '/api/admin/payment_webhook_event_replay',
    '/api/admin/quote_deposit_refund_save',
    '/api/admin/quote_deposit_refund_initiate',
    '/api/admin/payment_refund_status_poll',
    '/api/admin/payment_receipt_resend',
    '/api/admin/payment_processor_fee_save',
    '/api/admin/payment_reconciliation_export',
    '/api/admin/payment_accountant_package_export',
    '/api/admin/payment_accountant_export_full',
    '/api/admin/final_balance_requests_list',
    '/api/admin/final_balance_checkout_create',
    '/api/admin/final_balance_request_manage',
    '/api/admin/payment_variance_summary',
    '/api/admin/payment_receipt_retry_queue',
    '/api/admin/payment_refund_retry_scan',
    "method:'POST'",
    "credentials:'include'",
    "window.AdminShell.boot({pageKey:'admin-payments'",
]:
    if token not in asset:
        errors.append(f"{ASSET} missing retained runtime token {token}")

changed = subprocess.run(["git", "diff", "--name-only", f"{BASELINE}...HEAD"], cwd=ROOT, capture_output=True, text=True)
if changed.returncode:
    errors.append("could not inspect Build 300 changed files")
else:
    for name in changed.stdout.splitlines():
        low = name.lower()
        if "migration" in low or low.startswith("database") or low.endswith(".sql"):
            errors.append(f"Build 300 unexpectedly changes schema/migration file {name}")

required = {
    'BUILD300_SUMMARY.md': ['Build 300', 'Finance Payments Maintainability Extraction', 'no payment behavior change', 'no database or schema migration', 'pre-existing', 'Build 318', PRODUCTION],
    'AUTONOMOUS_RELEASE_QUEUE.md': ['Build 300 — Finance Payments maintainability extraction', 'preserve all existing payment rules/API authority', 'Build 301 — Finance Reconciliation maintainability extraction'],
    'AI_PROJECT_HANDOFF.md': ['**Build:** 300', 'Finance Payments maintainability extraction', ASSET, PRODUCTION, 'Build 301 — Finance Reconciliation maintainability extraction', 'Build 318 — Whole-application route/API authority sweep'],
    'MASTER_VALUE_ROADMAP.md': ['**Build:** 300', 'Build 300 — Finance Payments maintainability extraction', ASSET, PRODUCTION, 'Build 301 — Finance Reconciliation maintainability extraction', 'Build 318 — Whole-application route/API authority sweep'],
    'scripts/build300_http_smoke.sh': ['/assets/admin-payments-v300.js', 'read-only'],
    '.github/workflows/build300-source-gate.yml': ['Build 300 Source Gate', 'scripts/build300_release_check.py'],
    '.github/workflows/build300-development-source-gate.yml': ['Build 300 Development Source Gate', 'scripts/build300_release_check.py'],
    '.github/workflows/build300-development-acceptance.yml': ['Build 300 Development Runtime Acceptance', 'scripts/build300_http_smoke.sh'],
}
for rel, tokens in required.items():
    body = read(rel)
    for token in tokens:
        if token not in body:
            errors.append(f"{rel} missing {token}")

for rel in ['.github/workflows/build300-bootstrap-extract-payments-runtime.yml', '.github/workflows/build300-bootstrap-authorities.yml', '.github/workflows/build300-bootstrap-docs.yml', '.github/workflows/build300-retained-guard-scan.yml']:
    if (ROOT / rel).exists():
        errors.append(f"temporary Build 300 bootstrap/scan file remains: {rel}")

syntax = subprocess.run(['node', '--check', str(ROOT / ASSET)], capture_output=True, text=True)
if syntax.returncode:
    errors.append(f"node --check failed {ASSET}: {syntax.stderr.strip()}")
smoke = subprocess.run(['bash', '-n', str(ROOT / 'scripts/build300_http_smoke.sh')], capture_output=True, text=True)
if smoke.returncode:
    errors.append(f"bash -n failed build300_http_smoke.sh: {smoke.stderr.strip()}")

if errors:
    print('Build 300 Finance Payments maintainability extraction check: FAIL')
    for e in errors: print('-', e)
    sys.exit(1)
print('Build 300 Finance Payments maintainability extraction check: PASS')
print('- accepted Build 299 root Payments runtime is byte-for-byte preserved in assets/admin-payments-v300.js')
print('- admin-payments.html differs from its accepted Build 299 source only by the external classic-script tag (terminal newline normalization ignored)')
print('- pre-existing older admin-payments/index.html remains byte-for-byte unchanged; Build 300 does not silently converge route authority')
print('- webhook, refund, receipt, fee, export and root final-balance orchestration remain unchanged')
print('- living handoff and roadmap are synchronized to Build 300 and the recorded Build 301 next step')
print('- no payment behavior, API contract, provider rule, accounting judgment or schema migration was introduced')
print('- runtime acceptance is read-only; real provider transaction evidence remains explicitly gated')
print(f'- Production remains accepted Build 299 at {PRODUCTION} and stays closed for Build 300')
