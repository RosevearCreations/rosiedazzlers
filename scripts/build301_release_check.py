#!/usr/bin/env python3
from pathlib import Path
import subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
BASELINE = "ed7c0c6748db6d619fb37e515057666feed1ea70"
PRODUCTION = "ee010654aea48c12c885ea826bf7cf60f64852b7"
ROOT_PAGE = "admin-accounting.html"
FOLDER_PAGE = "admin-accounting/index.html"
ASSET = "assets/admin-accounting-v301.js"
TAG = '<script src="/assets/admin-accounting-v301.js"></script>'
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
        errors.append(f"could not read accepted Build 300 baseline {rel}")
        return ""
    return p.stdout

def split_runtime(text, label):
    marker = '<script>'
    start = text.rfind(marker)
    if start < 0:
        errors.append(f"{label} missing mature Accounting runtime")
        return None
    body_start = start + len(marker)
    end = text.find('</script>', body_start)
    if end < 0:
        errors.append(f"{label} missing Accounting runtime close")
        return None
    return start, body_start, end, end + len('</script>')

for sha, label in [(BASELINE, 'accepted Build 300 Development'), (PRODUCTION, 'accepted Build 299 Production')]:
    if subprocess.run(["git", "merge-base", "--is-ancestor", sha, "HEAD"], cwd=ROOT).returncode:
        errors.append(f"{label} is not an ancestor of Build 301 candidate")

baseline_root = baseline_page(ROOT_PAGE)
baseline_folder = baseline_page(FOLDER_PAGE)
if baseline_root and baseline_folder and baseline_root != baseline_folder:
    errors.append("accepted Build 300 Accounting route copies unexpectedly diverge; Build 301 refuses silent route convergence")

parts = split_runtime(baseline_root, 'accepted Build 300 admin-accounting.html') if baseline_root else None
if parts:
    start, body_start, end, close_end = parts
    expected_asset = baseline_root[body_start:end].lstrip('\n')
    if read(ASSET) != expected_asset:
        errors.append("versioned Accounting asset is not byte-for-byte the accepted Build 300 inline runtime")
    expected_page = baseline_root[:start] + TAG + baseline_root[close_end:]
    for rel in [ROOT_PAGE, FOLDER_PAGE]:
        body = read(rel)
        if body.rstrip('\n') != expected_page.rstrip('\n'):
            errors.append(f"{rel} differs from accepted Build 300 source beyond exact runtime extraction")
        if TAG not in body:
            errors.append(f"{rel} missing Build 301 Accounting runtime tag")

if read(ROOT_PAGE) != read(FOLDER_PAGE):
    errors.append("Build 301 Accounting root/folder route copies no longer match")

page = read(ROOT_PAGE)
for token in ['data-page="admin-accounting"', 'id="bankReconForm"', 'id="bankReconSummary"', 'id="bankReconRows"', 'id="payrollPayoutForm"', 'Bank reconciliation', 'Payroll payout reconciliation']:
    if token not in page:
        errors.append(f"{ROOT_PAGE} lost retained Finance source token {token}")

asset = read(ASSET)
for token in [
    'renderBankReconciliation',
    'loadBankReconciliation',
    '/api/admin/accounting_bank_reconciliation?',
    '/api/admin/accounting_payroll_payout_reconciliation?',
    '/api/admin/accounting_payable_settle',
    '/api/admin/accounting_statement_report?',
    '/api/admin/accounting_tax_report?',
    '/api/admin/accounting_export?type=',
    '/api/admin/accounting_accounts_list',
    '/api/admin/accounting_list',
    '/api/admin/accounting_payables_list',
    'window.AdminShell.boot({',
    "pageKey: 'admin-accounting'",
]:
    if token not in asset:
        errors.append(f"{ASSET} missing retained runtime token {token}")

changed = subprocess.run(["git", "diff", "--name-only", f"{BASELINE}...HEAD"], cwd=ROOT, capture_output=True, text=True)
if changed.returncode:
    errors.append("could not inspect Build 301 changed files")
else:
    for name in changed.stdout.splitlines():
        low = name.lower()
        if "migration" in low or low.startswith("database") or low.endswith(".sql"):
            errors.append(f"Build 301 unexpectedly changes schema/migration file {name}")

required = {
    'BUILD301_SUMMARY.md': ['Build 301', 'Finance Reconciliation Maintainability Extraction', 'no database or schema migration', 'no accounting-policy change', BASELINE, PRODUCTION, 'Build 302 — Statement Import reliability'],
    'AUTONOMOUS_RELEASE_QUEUE.md': ['Build 301 — Finance Reconciliation maintainability extraction', 'Build 302 — Statement Import reliability'],
    'AI_PROJECT_HANDOFF.md': ['**Build:** 301', 'Finance Reconciliation maintainability extraction', ASSET, PRODUCTION, 'Build 302 — Statement Import reliability'],
    'MASTER_VALUE_ROADMAP.md': ['**Build:** 301', 'Build 301 — Finance Reconciliation maintainability extraction', ASSET, PRODUCTION, 'Build 302 — Statement Import reliability'],
    'scripts/build301_http_smoke.sh': ['/assets/admin-accounting-v301.js', 'read-only', 'bounded'],
    '.github/workflows/build301-source-gate.yml': ['Build 301 Source Gate', 'scripts/build301_release_check.py'],
    '.github/workflows/build301-development-source-gate.yml': ['Build 301 Development Source Gate', 'scripts/build301_release_check.py'],
    '.github/workflows/build301-development-acceptance.yml': ['Build 301 Development Runtime Acceptance', 'scripts/build301_http_smoke.sh'],
}
for rel, tokens in required.items():
    body = read(rel)
    for token in tokens:
        if token not in body:
            errors.append(f"{rel} missing {token}")

if (ROOT / '.github/workflows/build301-bootstrap-accounting-runtime.yml').exists():
    errors.append('temporary Build 301 bootstrap workflow remains')

syntax = subprocess.run(['node', '--check', str(ROOT / ASSET)], capture_output=True, text=True)
if syntax.returncode:
    errors.append(f"node --check failed {ASSET}: {syntax.stderr.strip()}")
smoke = subprocess.run(['bash', '-n', str(ROOT / 'scripts/build301_http_smoke.sh')], capture_output=True, text=True)
if smoke.returncode:
    errors.append(f"bash -n failed build301_http_smoke.sh: {smoke.stderr.strip()}")

if errors:
    print('Build 301 Finance Reconciliation maintainability extraction check: FAIL')
    for e in errors: print('-', e)
    sys.exit(1)
print('Build 301 Finance Reconciliation maintainability extraction check: PASS')
print('- accepted Build 300 Accounting runtime is byte-for-byte preserved in assets/admin-accounting-v301.js')
print('- both Accounting route copies differ from accepted Build 300 only by the external classic-script tag')
print('- bank/payroll reconciliation, payable, statement, tax, export and Accounting boot authority remain unchanged')
print('- no schema migration or accounting-policy/provider behavior change was introduced')
print('- runtime acceptance is read-only and uses bounded mutable-alias convergence retry')
print(f'- accepted pre-Build-301 Production anchor remains Build 299 at {PRODUCTION}')
