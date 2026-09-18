#!/usr/bin/env python3
"""Build 418 backup/restore/accountant-export operational proof source authority."""
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []

def read(path):
    target = ROOT / path
    if not target.is_file():
        errors.append(f"missing required file: {path}")
        return ""
    return target.read_text(encoding="utf-8", errors="ignore")

def require(text, needles, label):
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing {needle!r}")

def living_release_pair(text):
    current = re.search(r"## Current release.*?\*\*Build\s+(\d{3})\s+—", text, re.S)
    nxt = re.search(r"## Next release.*?\*\*Build\s+(\d{3})\s+—", text, re.S)
    if not current or not nxt:
        errors.append("release queue cannot resolve current/next release")
        return (0, 0)
    return (int(current.group(1)), int(nxt.group(1)))

helper = read("functions/api/_lib/recovery-export-operational-proof.js")
endpoint = read("functions/api/admin/recovery_export_operational_proof.js")
launch_endpoint = read("functions/api/admin/launch_readiness_consolidated.js")
asset = read("assets/launch-readiness-consolidation.js")
page = read("admin-launch-readiness.html")
copy = read("admin-launch-readiness/index.html")
contract = read("BUILD418_BACKUP_RESTORE_ACCOUNTANT_EXPORT_OPERATIONAL_PROOF.md")
queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff = read("AI_PROJECT_HANDOFF.md")
readme = read("README.md")
dev_gate = read(".github/workflows/development-source-gate.yml")
prod_gate = read(".github/workflows/production-business-acceptance-authority.yml")
focused = read(".github/workflows/recovery-export-operational-proof-authority.yml")
prod_check = read("scripts/production_business_acceptance_check.py")
retained_recovery = read("scripts/backup_restore_release_recovery_drill_check.py")
retained_finance = read("scripts/build394_finance_close_reconciliation_accountant_export_check.py")

require(helper, [
    "buildRecoveryExportOperationalProof",
    "source_route_presence_is_not_artifact_proof: true",
    "production_restore_performed: false",
    "export_generation_performed: false",
    "recovery_drill_executed_by_source: false",
    "retention_location_inferred: false",
    "customer_identity_exposed: false",
    "accounting_mutation_performed: false",
    "artifact_observed",
    "retention_location_observed",
    "accountant_export",
    "accounting_accountant_package",
    "accounting_export"
], "Build 418 helper")

require(endpoint, [
    "requireStaffAccess",
    'capability: "it_diagnostics"',
    "listLaunchEvidence",
    "buildFinanceCloseAcceptanceSnapshot",
    "buildRecoveryExportOperationalProof",
    "build: 418",
    'authority: "backup_restore_accountant_export_operational_proof"',
    "GET, HEAD, OPTIONS"
], "Build 418 endpoint")

require(launch_endpoint, [
    "getRecoveryExportOperationalProof",
    "recovery_export_operational_proof",
    "build: 418",
    'authority: "backup_restore_accountant_export_operational_proof"',
    "retained_provider_build: 417",
    "retained_build: 416"
], "launch readiness composition")

require(asset, [
    "Backup, restore & accountant export operational proof",
    "Backup evidence observed",
    "Rollback drill observed",
    "Retention location",
    "Retained accountant-export artifact",
    "Source route presence is not artifact proof",
    "does not generate an export or perform a Production restore"
], "Build 418 client")

require(page, [
    'data-build418="backup-restore-accountant-export-operational-proof"',
    "Build 418 · Backup, restore & accountant export operational proof",
    "Build 418 acceptance boundary",
    "does not perform a Production restore",
    "does not generate an accountant export",
    "separately authorized recovery drill",
    "Retained Build 417 · Provider evidence closure",
    "Retained Build 416 · Controlled soft launch"
], "Build 418 page")

if page != copy:
    errors.append("admin-launch-readiness route copy drift")

require(contract, [
    "source evidence only",
    "Current backup proof requires",
    "Retention location is observed only when explicitly recorded",
    "Build 394 remains the canonical accountant-export readiness authority",
    "does **not** perform a Production restore",
    "does **not** generate or persist an accountant export",
    "Source/Production GREEN may coexist with an operational-proof HOLD",
    "Build 419 — Customer & Staff Production Workflow Evidence"
], "Build 418 contract")

current, nxt = living_release_pair(queue)
if current < 418:
    errors.append(f"living release regressed behind Build 418: {current}/{nxt}")
if current and nxt != current + 1:
    errors.append(f"living release sequence is not consecutive: {current}/{nxt}")

for text, label in [(queue, "queue"), (handoff, "handoff")]:
    require(text, [
        "Build 418",
        "Build 419",
        "BUILD418_BACKUP_RESTORE_ACCOUNTANT_EXPORT_OPERATIONAL_PROOF.md"
    ], label)

require(readme, [
    "Build 418",
    "BUILD418_BACKUP_RESTORE_ACCOUNTANT_EXPORT_OPERATIONAL_PROOF.md",
    "BUILD417_PAYMENT_REFUND_DELIVERY_PROVIDER_EVIDENCE_CLOSURE.md",
    "BUILD416_CONTROLLED_SOFT_LAUNCH_REAL_WORLD_ACCEPTANCE.md"
], "README")

for gate, label in [(dev_gate, "Development source gate"), (prod_gate, "Production authority"), (focused, "focused authority")]:
    require(gate, [
        "recovery_export_operational_proof_check.py",
        "recovery_export_operational_proof_test.mjs"
    ], label)

require(prod_check, [
    '"recovery_export_operational_proof"',
    "scripts/recovery_export_operational_proof_check.py",
    "scripts/recovery_export_operational_proof_test.mjs",
    "Validate recovery export operational proof authority"
], "Production business acceptance source authority")

require(retained_recovery, [
    "BUILD 385 BACKUP / RESTORE / RELEASE RECOVERY DRILL: PASS",
    "Production exact-SHA re-acceptance remains mandatory"
], "retained recovery authority")

require(retained_finance, [
    "BUILD 394 FINANCE CLOSE / RECONCILIATION / ACCOUNTANT EXPORT AUTHORITY: PASS",
    "accounting posting and provider mutation remain outside this read-only authority"
], "retained Finance authority")

for needle in ["setInterval(", "location.reload("]:
    if needle in asset:
        errors.append(f"Build 418 client contains automatic polling/reload primitive: {needle}")

for needle in [
    'method: "POST"', "method:'POST'",
    'method: "DELETE"', "method:'DELETE'",
    'method: "PATCH"', "method:'PATCH'"
]:
    if needle in endpoint:
        errors.append(f"Build 418 endpoint contains mutation primitive: {needle}")

for path in [
    "functions/api/_lib/recovery-export-operational-proof.js",
    "functions/api/admin/recovery_export_operational_proof.js",
    "functions/api/admin/launch_readiness_consolidated.js",
    "assets/launch-readiness-consolidation.js",
    "scripts/recovery_export_operational_proof_test.mjs"
]:
    proc = subprocess.run(["node", "--check", path], cwd=ROOT, text=True, capture_output=True)
    if proc.returncode != 0:
        errors.append(f"{path} syntax failed: {proc.stderr.strip() or proc.stdout.strip()}")

test = subprocess.run(["node", "scripts/recovery_export_operational_proof_test.mjs"], cwd=ROOT, text=True, capture_output=True)
if test.returncode != 0:
    errors.append(f"Build 418 operational proof test failed: {test.stderr.strip() or test.stdout.strip()}")

migrations = [p for p in ROOT.rglob("*.sql") if re.search(r"(?:^|[^0-9])418(?:[^0-9]|$)", p.name)]
if migrations:
    errors.append("Build 418 must not introduce a database migration: " + ", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("BACKUP RESTORE ACCOUNTANT EXPORT OPERATIONAL PROOF AUTHORITY: FAIL")
    for error in errors:
        print(" -", error)
    sys.exit(1)

print("BACKUP RESTORE ACCOUNTANT EXPORT OPERATIONAL PROOF AUTHORITY: PASS")
print(f" - retained recovery and Finance authorities remain compatible with living release {current}/{nxt}")
print(" - backup artifact and retention-location proof remains explicit owner evidence")
print(" - accountant-export usability comes from canonical read-only Finance acceptance")
print(" - export routes never fabricate a retained export artifact")
print(" - recovery drill/restore remains separately authorized")
print(" - no restore, export generation, schema or Production business-data mutation is performed")
