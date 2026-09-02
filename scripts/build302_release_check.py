#!/usr/bin/env python3
from pathlib import Path
import subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
BASELINE = "1f950b9daf01a29abb6a46a93d7a0b12992e72b7"
errors = []

# Build 302 closes the current statement-import reliability boundary without
# recreating retired import routes. The accepted Build 301 application exposes
# reporting/reconciliation only; a future importer must be introduced as an
# explicit authority with its own parser/validation/idempotency tests.
for path in (ROOT / "functions" / "api").rglob("*"):
    if path.is_file():
        low = path.as_posix().lower()
        if any(token in low for token in ("statement_import", "statement-import", "bank_import", "bank-import")):
            errors.append(f"unexpected statement-import authority present: {path.relative_to(ROOT)}")

statement = (ROOT / "functions/api/admin/accounting_statement_report.js").read_text(encoding="utf-8")
recon = (ROOT / "functions/api/admin/accounting_bank_reconciliation.js").read_text(encoding="utf-8")
accounting_ui = (ROOT / "assets/admin-accounting-v301.js").read_text(encoding="utf-8")
for token in ["buildBalanceSheetReport", "buildCashFlowReport", "onRequestGet"]:
    if token not in statement: errors.append(f"statement report lost retained token {token}")
if "onRequestPost() { return withCors(methodNotAllowed()); }" not in statement:
    errors.append("statement report no longer fails closed on POST")
for token in ["buildBankReconciliationSnapshot", "saveBankReconciliation", "finance.reconcile"]:
    if token not in recon: errors.append(f"bank reconciliation lost retained token {token}")
for forbidden in ["FileReader", "statement_import", "bank_import", "import_statement", "importStatement"]:
    if forbidden in accounting_ui:
        errors.append(f"Accounting UI unexpectedly gained import parser/authority token {forbidden}")

changed = subprocess.run(["git", "diff", "--name-only", f"{BASELINE}...HEAD"], cwd=ROOT, capture_output=True, text=True)
if changed.returncode:
    errors.append("could not inspect Build 302 changed files")
else:
    for name in changed.stdout.splitlines():
        low = name.lower()
        if "migration" in low or low.startswith("database") or low.endswith(".sql"):
            errors.append(f"Build 302 unexpectedly changes schema/migration file {name}")

if errors:
    print("Build 302 Statement Import reliability convergence guard: FAIL")
    for error in errors: print("-", error)
    sys.exit(1)
print("Build 302 Statement Import reliability convergence guard: PASS")
print("- no active statement-import parser/API exists on the accepted Finance authority")
print("- statement POST remains fail-closed and reconciliation authority is unchanged")
print("- no schema/database or accounting-policy change was introduced")
print("- any future statement importer must be introduced explicitly with deterministic parsing, validation and idempotency coverage")
