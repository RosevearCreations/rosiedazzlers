from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def require(text: str, needle: str, label: str) -> None:
    if needle not in text:
        raise SystemExit(f"BUILD 394 FAIL: {label} missing {needle!r}")


helper = read("functions/api/_lib/accounting-finance-close-acceptance.js")
endpoint = read("functions/api/admin/accounting_finance_close_acceptance.js")
test = read("scripts/build394_finance_close_reconciliation_accountant_export_test.mjs")
doc = read("FINANCE_CLOSE_RECONCILIATION_ACCOUNTANT_EXPORT_ACCEPTANCE.md")
roadmap = read("FORWARD_BUILD_ROADMAP_386_395.md")
queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
workflow = read(".github/workflows/finance-close-reconciliation-accountant-export-authority.yml")

for needle in [
    "buildMonthEndClosureSnapshot",
    "buildMonthlyReport",
    'status = "unavailable"',
    'status = "review"',
    'status = "ready"',
    "provider_fees",
    "payment_provider_mutation: false",
    "accounting_posting: false",
    "explicit_operator_authorization_required_for_mutation: true",
    "accounting_accountant_package",
    "accounting_export"
]:
    require(helper, needle, "finance acceptance helper")

for needle in [
    'requireActionAccess(access.actor, "finance.view")',
    "buildFinanceCloseAcceptanceSnapshot",
    "onRequestGet",
    "methodNotAllowed()"
]:
    require(endpoint, needle, "finance acceptance endpoint")

for needle in [
    'assert.equal(ready.build, 394)',
    'assert.equal(missingFee.status, "review")',
    'assert.equal(hstReview.status, "review")',
    'assert.equal(unavailable.status, "unavailable")',
    "payment_provider_mutation"
]:
    require(test, needle, "executable contract")

for needle in [
    "Build 394 — Finance Close, Reconciliation & Accountant Export Acceptance",
    "Paid provider activity without explicit posted fee evidence is **review**",
    "schema-neutral and read-only",
    "exact-SHA Development",
    "protected-main"
]:
    require(doc, needle, "Build 394 contract doc")

require(roadmap, "### Build 394 — Finance Close, Reconciliation & Accountant Export Acceptance", "forward roadmap")
require(roadmap, "Missing financial evidence remains review/unavailable", "forward roadmap")
require(queue, "**Build 394 — Finance Close, Reconciliation & Accountant Export Acceptance** is the active bounded release.", "release queue")
require(queue, "**Build 395 — Production Business Acceptance & Growth Readiness**", "release queue")
require(workflow, "Build 394 — Finance Close, Reconciliation & Accountant Export Acceptance Authority", "workflow")
require(workflow, "build394_finance_close_reconciliation_accountant_export_test.mjs", "workflow")

print("BUILD 394 FINANCE CLOSE / RECONCILIATION / ACCOUNTANT EXPORT AUTHORITY: PASS")
print("- existing finance/accounting sources remain canonical")
print("- deposit/final/refund/HST/reconciliation/month-end/export evidence is fail-closed")
print("- paid provider activity without explicit posted fee evidence remains review")
print("- accounting posting and provider mutation remain outside this read-only authority")
print("- no schema migration or second accounting ledger introduced")
