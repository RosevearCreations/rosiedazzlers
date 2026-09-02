#!/usr/bin/env python3
from pathlib import Path
import subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
BASELINE = "09442c53d385aca7995150ace4bde55abd51d7df"
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


def forbid(rel, *tokens):
    body = read(rel)
    for token in tokens:
        if token in body:
            errors.append(f"{rel} contains forbidden token {token}")


def unchanged(rel):
    proc = subprocess.run(["git", "diff", "--quiet", BASELINE, "HEAD", "--", rel], cwd=ROOT)
    if proc.returncode:
        errors.append(f"Build 304 unexpectedly changes retained Finance authority {rel}")


def node_check(rel):
    proc = subprocess.run(["node", "--check", str(ROOT / rel)], capture_output=True, text=True)
    if proc.returncode:
        errors.append(f"node --check failed {rel}: {proc.stderr.strip()}")


# Build 304 is export-integrity only. Retain the accepted Build 303 tax/runtime authorities exactly.
for rel in [
    "admin-tax-support.html",
    "assets/admin-tax-support-v303.js",
    "functions/api/admin/accounting_tax_support.js",
    "functions/api/_lib/accounting-tax-support.js",
    "functions/api/_lib/t2125-tax-support.js",
    "functions/api/admin/accounting_t2125_workpaper.js",
]:
    unchanged(rel)

# No schema/database change belongs to this release.
changed = subprocess.run(["git", "diff", "--name-only", f"{BASELINE}...HEAD"], cwd=ROOT, capture_output=True, text=True)
if changed.returncode:
    errors.append("could not inspect Build 304 changed files")
else:
    for name in changed.stdout.splitlines():
        low = name.lower()
        if "migration" in low or low.startswith("database") or low.endswith(".sql"):
            errors.append(f"Build 304 unexpectedly changes schema/migration file {name}")

# Pure export helper owns deterministic filenames, evidence linkage and privacy stripping.
need(
    "functions/api/_lib/accounting-accountant-export.js",
    'export_contract: "rosie_accountant_workpaper_json"',
    'schema_version: 2',
    'media_type: "application/json"',
    'storage_locators_exported: false',
    'staff_identity_exported: false',
    'internal_document_notes_exported: false',
    'reference_status:',
    'evidence_integrity:',
    'accountantPackageFilename',
    'safeAccountantFilename',
    'safeCsvFilenameToken',
    'generated_by: "authorized_finance_user"'
)

# Accountant package remains read-only/finance.view and now routes all export payloads through the whitelist helper.
need(
    "functions/api/admin/accounting_accountant_package.js",
    'requireActionAccess(access.actor, "finance.view")',
    'allowLegacyAdminFallback: false',
    'buildAccountantExportPackage',
    'export_format: exported.package.format',
    'download_filename: exported.download_filename',
    'accountant_package: exported.package',
    'onRequestPost',
    'methodNotAllowed()'
)
forbid(
    "functions/api/admin/accounting_accountant_package.js",
    'generated_by: access.actor',
    'evidence_manifest: support.documents'
)

# Existing CSV export behavior stays CSV; only the dynamic filename token is normalized before Content-Disposition.
need(
    "functions/api/admin/accounting_export.js",
    'safeCsvFilenameToken',
    "'Content-Type': 'text/csv; charset=utf-8'",
    "'Content-Disposition': `attachment; filename=\"${filename}\"`",
    "rosie-payables-${safeCsvFilenameToken(status, 'all')}-${year}"
)

# The retained Build 303 UI already produces a deterministic JSON download filename; do not mutate it here.
need(
    "assets/admin-tax-support-v303.js",
    "a.download=`rosie-accountant-package-${year}.json`",
    "/api/admin/accounting_accountant_package?year="
)

for rel in [
    "functions/api/_lib/accounting-accountant-export.js",
    "functions/api/admin/accounting_accountant_package.js",
    "functions/api/admin/accounting_export.js",
    "scripts/build304_export_contract_test.mjs",
]:
    node_check(rel)

contract = subprocess.run(["node", "scripts/build304_export_contract_test.mjs"], cwd=ROOT, capture_output=True, text=True)
if contract.returncode:
    errors.append(f"Build 304 export contract test failed: {contract.stderr.strip() or contract.stdout.strip()}")

if errors:
    print("Build 304 Accountant export integrity: FAIL")
    for error in errors:
        print("-", error)
    sys.exit(1)

print("Build 304 Accountant export integrity: PASS")
print("- accountant package has a versioned/predictable JSON export contract")
print("- evidence references are explicit and integrity-classified")
print("- storage locators, internal notes and staff metadata do not leave the package")
print("- JSON and dynamic CSV filenames are deterministic/sanitized")
print("- Build 303 tax/runtime authority and database schema remain unchanged")
