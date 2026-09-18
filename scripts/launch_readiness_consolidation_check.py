#!/usr/bin/env python3
"""Durable launch-readiness consolidation authority."""

from pathlib import Path
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

helper = read("functions/api/_lib/launch-readiness-consolidation.js")
endpoint = read("functions/api/admin/launch_readiness_consolidated.js")
asset = read("assets/launch-readiness-consolidation.js")
page = read("admin-launch-readiness.html")
copy = read("admin-launch-readiness/index.html")
contract = read("BUILD415_LAUNCH_READINESS_CONSOLIDATION_ROADMAP_RENEWAL.md")
roadmap = read("FORWARD_BUILD_ROADMAP_416_425.md")
queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff = read("AI_PROJECT_HANDOFF.md")
readme = read("README.md")
dev_gate = read(".github/workflows/development-source-gate.yml")
prod_gate = read(".github/workflows/production-business-acceptance-authority.yml")
prod_check = read("scripts/production_business_acceptance_check.py")

require(helper, [
    "source_runtime_status",
    "controlled_launch_status",
    "unrestricted_launch_status",
    "source_runtime_green_is_not_unrestricted_launch_green",
    "export_route_presence_is_not_backup_proof",
    "restore_performed: false",
    "export_performed: false",
    "provider_contact_performed: false",
    "business_mutation_performed: false",
    '"backups"',
    '"rollback_drill"',
    "/api/admin/accounting_export",
    "/api/admin/payment_accountant_package_export",
    "/api/admin/editable_settings_audit_export",
], "Launch consolidation helper")

require(endpoint, [
    "getGoLiveReadiness",
    "getProductionDiagnostics",
    "buildProductionSupportDiagnostics",
    "listLaunchEvidence",
    "buildLaunchReadinessConsolidation",
    "launch_readiness_consolidation_next_roadmap_renewal",
    "Cache-Control",
    "GET, HEAD, OPTIONS",
], "Launch consolidation endpoint")

require(asset, [
    "/api/admin/launch_readiness_consolidated",
    "credentials:\"include\"",
    "Refresh readiness",
    "Source/runtime GREEN never converts missing provider evidence into success.",
    "Backup evidence observed",
    "Rollback drill observed",
], "Launch readiness client")

require(page, [
    'name="viewport"',
    'data-page="admin-launch-readiness"',
    'data-build415="launch-readiness-consolidation-roadmap-renewal"',
    "<h1>Launch readiness, recovery proof & remaining HOLDs</h1>",
    'id="refreshLaunchReadiness"',
    "/assets/launch-readiness-consolidation.js",
    'pageKey:"admin-launch-readiness"',
    "Manual refresh only",
    "does not perform a restore, export, payment, provider call",
], "Launch readiness page")

if page != copy:
    errors.append("admin-launch-readiness route copy drift")

for needle in ["setInterval(", "setTimeout(load", "location.reload("]:
    if needle in asset:
        errors.append(f"Launch readiness client contains automatic polling/reload primitive: {needle}")

for needle in ["method: \"POST\"", "method:'POST'", "method: \"DELETE\"", "method:'DELETE'", "method: \"PATCH\"", "method:'PATCH'"]:
    if needle in asset:
        errors.append(f"Launch readiness client contains mutation primitive: {needle}")

require(contract, [
    "source/runtime status",
    "controlled-launch status",
    "unrestricted-launch status",
    "route presence does not prove",
    "no schema migration",
    "no Production business-data mutation",
    "no permanent polling",
], "Build 415 contract")

require(roadmap, [
    "Build 416 — Controlled Soft Launch & Real-World Acceptance",
    "Build 417 — Payment, Refund & Delivery Provider Evidence Closure",
    "Build 418 — Backup, Restore & Accountant Export Operational Proof",
    "Build 425 — Production Learning & Roadmap Renewal",
], "Forward roadmap")

for text, label in [(queue, "queue"), (handoff, "handoff"), (readme, "README")]:
    require(text, [
        "Build 415",
        "Build 416",
    ], label)

for gate, label in [(dev_gate, "Development source gate"), (prod_gate, "Production authority")]:
    require(gate, [
        "python scripts/launch_readiness_consolidation_check.py",
        "node scripts/launch_readiness_consolidation_test.mjs",
    ], label)

require(prod_check, [
    '"launch_readiness"',
    "scripts/launch_readiness_consolidation_check.py",
    "scripts/launch_readiness_consolidation_test.mjs",
    "Validate launch readiness consolidation authorities",
], "Production business acceptance source authority")

for path in [
    "functions/api/_lib/launch-readiness-consolidation.js",
    "functions/api/admin/launch_readiness_consolidated.js",
    "assets/launch-readiness-consolidation.js",
    "scripts/launch_readiness_consolidation_test.mjs",
]:
    proc = subprocess.run(["node", "--check", path], cwd=ROOT, text=True, capture_output=True)
    if proc.returncode != 0:
        errors.append(f"{path} syntax failed: {proc.stderr.strip() or proc.stdout.strip()}")

test = subprocess.run(["node", "scripts/launch_readiness_consolidation_test.mjs"], cwd=ROOT, text=True, capture_output=True)
if test.returncode != 0:
    errors.append(f"launch readiness test failed: {test.stderr.strip() or test.stdout.strip()}")

if errors:
    print("LAUNCH READINESS CONSOLIDATION AUTHORITY: FAIL")
    for error in errors:
        print(" -", error)
    sys.exit(1)

print("LAUNCH READINESS CONSOLIDATION AUTHORITY: PASS")
print(" - exact runtime/support evidence remains separate from owner/provider evidence")
print(" - controlled and unrestricted launch decisions are fail-closed")
print(" - backup/export/recovery evidence is source-attributed without invented proof")
print(" - launch surface remains read-only and manual-refresh")
print(" - next roadmap is renewed from remaining observed evidence gaps")
