#!/usr/bin/env python3
from pathlib import Path
import subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
BASELINE = "9a26837aec78bdd2e4302abcd608b62596cbb604"
errors = []


def read(rel):
    path = ROOT / rel
    if not path.exists():
        errors.append(f"missing {rel}")
        return ""
    return path.read_text(encoding="utf-8", errors="ignore")


def need(rel, *tokens):
    body = read(rel)
    for token in tokens:
        if token not in body:
            errors.append(f"{rel} missing {token}")


def unchanged(rel):
    proc = subprocess.run(["git", "diff", "--quiet", BASELINE, "HEAD", "--", rel], cwd=ROOT)
    if proc.returncode:
        errors.append(f"Build 305 unexpectedly changes retained authority {rel}")


def node_check(rel):
    proc = subprocess.run(["node", "--check", str(ROOT / rel)], capture_output=True, text=True)
    if proc.returncode:
        errors.append(f"node --check failed {rel}: {proc.stderr.strip()}")


# Build 305 reuses the accepted seven-action Finance vocabulary; it does not redesign role defaults.
unchanged("functions/api/_lib/action-permissions.js")
need(
    "functions/api/_lib/admin-finance-actions.js",
    '"finance.view"',
    '"finance.post"',
    '"finance.reconcile"',
    '"finance.period.close"',
    '"finance.refund.manage"',
    '"finance.settlement.manage"',
    '"finance.tax.manage"',
    '/^(?:accounting_|payment_|payroll_)/',
    'final_balance_checkout_create',
    'quote_deposit_request_mark_paid'
)
need(
    "functions/api/admin/_middleware.js",
    'financeActionFor',
    'OPERATIONS_ACTION_BY_LEAF',
    'operations.quote.manage',
    'allowLegacyAdminFallback: true',
    'requireActionAccess(access.actor, requiredAction)'
)

# No schema/database change belongs to this authorization-only release.
changed = subprocess.run(["git", "diff", "--name-only", f"{BASELINE}...HEAD"], cwd=ROOT, capture_output=True, text=True)
if changed.returncode:
    errors.append("could not inspect Build 305 changed files")
else:
    for name in changed.stdout.splitlines():
        low = name.lower()
        if "migration" in low or low.startswith("database") or low.endswith(".sql"):
            errors.append(f"Build 305 unexpectedly changes schema/migration file {name}")

for rel in [
    "functions/api/_lib/admin-finance-actions.js",
    "functions/api/admin/_middleware.js",
    "scripts/build305_finance_action_test.mjs",
]:
    node_check(rel)

matrix = subprocess.run(["node", "scripts/build305_finance_action_test.mjs"], cwd=ROOT, capture_output=True, text=True)
if matrix.returncode:
    errors.append(f"Build 305 Finance action matrix failed: {matrix.stderr.strip() or matrix.stdout.strip()}")

if errors:
    print("Build 305 Finance authorization sweep: FAIL")
    for error in errors:
        print("-", error)
    sys.exit(1)

print("Build 305 Finance authorization sweep: PASS")
print("- current accounting/payment/payroll route methods are covered by the central Finance action resolver")
print("- Finance reads require finance.view and high-risk writes resolve to the narrow accepted actions")
print("- role ceilings, module disablement and per-action narrowing remain fail-closed")
print("- Operations-owned quote/final-balance request lifecycle remains on operations.quote.manage")
print("- Build 304 database/schema and the canonical seven-action permission vocabulary are unchanged")
