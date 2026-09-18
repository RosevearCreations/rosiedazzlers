#!/usr/bin/env python3
from pathlib import Path
import subprocess
import re

ROOT = Path(__file__).resolve().parents[1]
errors = []

def read(path):
    p = ROOT / path
    if not p.exists():
        errors.append(f"missing {path}")
        return ""
    return p.read_text(encoding="utf-8", errors="ignore")

helper = read("functions/api/_lib/production-support-diagnostics.js")
endpoint = read("functions/api/admin/support_diagnostics.js")
page = read("admin/it.html")
test = read("scripts/production_support_diagnostics_test.mjs")
workflow = read(".github/workflows/production-support-diagnostics-authority.yml")
development = read(".github/workflows/development-source-gate.yml")
production = read(".github/workflows/production-business-acceptance-authority.yml")
policy = read("BUILD412_PRODUCTION_OBSERVABILITY_ALERTING_SUPPORT_DIAGNOSTICS.md").lower()

for token in (
    "buildProductionSupportDiagnostics",
    "supportPacketIsSafe",
    "runtime_identity",
    "provider_dependent",
    "owner_action",
    'severity: "critical"',
    'severity: "warning"',
    'severity: "hold"',
    'severity: "action"',
    "support_packet",
    "secret_values_included: false",
    "customer_records_included: false",
    "provider_credentials_included: false",
    "business_mutation_performed: false",
    "provider_mutation_performed: false",
    "manual_refresh_only: true",
    "permanent_polling: false",
):
    if token not in helper:
        errors.append(f"support diagnostics helper missing {token}")

for token in (
    'getGoLiveReadiness',
    'getProductionDiagnostics',
    'request.clone()',
    'source_errors',
    'authority: "production_observability_alerting_support_diagnostics"',
    '"Cache-Control": "no-store"',
    '"GET, HEAD, OPTIONS"',
):
    if token not in endpoint:
        errors.append(f"support diagnostics endpoint missing {token}")

if re.search(r'method\s*:\s*["\'](?:POST|PUT|PATCH|DELETE)["\']', endpoint, re.I):
    errors.append("support diagnostics endpoint contains a mutating HTTP method")
if "setInterval(" in endpoint or "setInterval(" in helper or "setInterval(" in page:
    errors.append("Build 412 support diagnostics must not introduce permanent interval polling")
if re.search(r"\.(?:put|delete)\s*\(", endpoint) or re.search(r"\.(?:put|delete)\s*\(", helper):
    errors.append("Build 412 support diagnostics contains a storage mutation primitive")

for token in (
    "Production support diagnostics",
    "/api/admin/support_diagnostics",
    "Refresh Support Snapshot",
    "Copy Support Packet",
    "Support packet",
    "Corrective action",
    "No automatic alert delivery",
):
    if token not in page:
        errors.append(f"I.T. page missing Build 412 operator contract: {token}")

for token in (
    "exact release identity",
    "bounded failure evidence",
    "provider holds",
    "corrective mechanics",
    "support-safe",
    "manual refresh",
    "no permanent polling",
    "no automatic alert delivery",
    "schema-neutral",
):
    if token not in policy:
        errors.append(f"Build 412 policy missing {token}")

for token in (
    "Build 412 — Production Observability, Alerting & Support Diagnostics",
    "python scripts/production_support_diagnostics_check.py",
    "node scripts/production_support_diagnostics_test.mjs",
):
    if token not in workflow:
        errors.append(f"focused Build 412 workflow missing {token}")

for token in (
    "python scripts/production_support_diagnostics_check.py",
    "node scripts/production_support_diagnostics_test.mjs",
):
    if token not in development:
        errors.append(f"Development source gate missing durable support diagnostics authority {token}")
    if token not in production:
        errors.append(f"Production authority missing durable support diagnostics authority {token}")

if "PRODUCTION OBSERVABILITY / ALERTING / SUPPORT DIAGNOSTICS: PASS" not in test:
    errors.append("Build 412 executable contract missing PASS authority")

if any("412" in path.name.lower() for path in ROOT.rglob("*.sql")):
    errors.append("Build 412 must not introduce a schema migration")

commands = (
    ["node", "--check", "functions/api/_lib/production-support-diagnostics.js"],
    ["node", "--check", "functions/api/admin/support_diagnostics.js"],
    ["node", "--check", "scripts/production_support_diagnostics_test.mjs"],
    ["node", "scripts/production_support_diagnostics_test.mjs"],
)
for command in commands:
    proc = subprocess.run(command, cwd=ROOT, text=True, capture_output=True)
    if proc.returncode != 0:
        errors.append(f"{' '.join(command)} failed: {proc.stderr.strip() or proc.stdout.strip()}")

if errors:
    print("PRODUCTION OBSERVABILITY / ALERTING / SUPPORT DIAGNOSTICS AUTHORITY: FAIL")
    for error in errors:
        print(" -", error)
    raise SystemExit(1)

print("PRODUCTION OBSERVABILITY / ALERTING / SUPPORT DIAGNOSTICS AUTHORITY: PASS")
print(" - retained readiness and Production diagnostics are composed, not replaced")
print(" - exact release identity and bounded runtime failure evidence remain operator-readable")
print(" - provider HOLDs and owner actions are separated from runtime failures")
print(" - support packet is whitelisted and excludes arbitrary evidence, customer data and secrets")
print(" - alerting is on-screen/manual only; no automatic alert delivery or permanent polling")
print(" - no provider/business mutation and no Build 412 schema migration")
