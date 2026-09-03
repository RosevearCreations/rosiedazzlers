#!/usr/bin/env python3
from pathlib import Path
import subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
BASELINE = "202a62c271ddf42caedf13c9dc3a0cf139e55b8e"
errors = []

def read(rel):
    p = ROOT / rel
    if not p.exists():
        errors.append(f"missing {rel}")
        return ""
    return p.read_text(encoding="utf-8", errors="ignore")

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

def run(cmd, label):
    proc = subprocess.run(cmd, cwd=ROOT, capture_output=True, text=True)
    if proc.returncode:
        errors.append(f"{label} failed: {proc.stderr.strip() or proc.stdout.strip()}")

def node_check(rel):
    run(["node", "--check", str(ROOT / rel)], f"node --check {rel}")

changed = subprocess.run(["git", "diff", "--name-only", f"{BASELINE}...HEAD"], cwd=ROOT, capture_output=True, text=True)
if changed.returncode:
    errors.append("could not inspect Build 307 changed files")
else:
    for name in changed.stdout.splitlines():
        low = name.lower()
        if "migration" in low or low.startswith("database") or low.endswith(".sql"):
            errors.append(f"Build 307 unexpectedly changes schema/migration file {name}")

need("functions/api/_lib/system-health-readiness.js",
     '"GREEN"', '"AMBER"', '"RED"',
     'contract: "rosie_it_readiness_diagnostics_v1"',
     'configuration_is_not_transaction_acceptance: true',
     'transactionAcceptance: "not_tested"',
     'automatic: false',
     'DATABASE_CONFIGURED_NOT_TRANSACTION_TESTED',
     'R2_BOUND_NOT_OBJECT_TESTED',
     'PROVIDERS_CONFIGURED_NOT_TRANSACTION_TESTED')
need("functions/api/admin/system_health_families.js",
     'buildSystemHealthReadiness',
     'requireActionAccess(access.actor, "it.runtime.view")',
     'allowLegacyAdminFallback: false',
     'IT_HEALTH_REPORT_FAILED',
     'methodNotAllowed()')
need("assets/admin-system-health-v307.js",
     "['deployment','api','d1','storage','authentication','providers']",
     'transaction acceptance',
     'corrective_action',
     '/api/admin/system_health_families?family=',
     'RosieSystemHealth307')
need("admin-system-health.html",
     'Build 307 · I.T. readiness',
     'GREEN/AMBER/RED',
     'Provider configuration never counts as payment, webhook, delivery, publishing, or external API transaction acceptance.',
     'No corrective action on this page mutates configuration.',
     '/assets/admin-system-health-v307.js')
need("scripts/build307_readiness_diagnostics_test.mjs",
     "DATABASE_CONFIGURATION_MISSING",
     "R2_BINDING_MISSING",
     "PROVIDERS_NOT_CONFIGURED_OR_OPTIONAL",
     "transaction_acceptance === 'not_tested'" if False else "transaction_acceptance")

# No server-side readiness helper may call external providers or mutate runtime configuration.
forbid("functions/api/_lib/system-health-readiness.js",
       "fetch(", ".put(", ".delete(", "STRIPE_SECRET_KEY", "PAYPAL_CLIENT_SECRET", "SUPABASE_SERVICE_ROLE_KEY")

for rel in [
    "functions/api/_lib/system-health-readiness.js",
    "functions/api/admin/system_health_families.js",
    "assets/admin-system-health-v307.js",
    "scripts/build307_readiness_diagnostics_test.mjs",
]:
    node_check(rel)

run(["node", "scripts/build307_readiness_diagnostics_test.mjs"], "Build 307 readiness diagnostics test")

if errors:
    print("Build 307 I.T. readiness diagnostics upgrade: FAIL")
    for error in errors: print("-", error)
    sys.exit(1)

print("Build 307 I.T. readiness diagnostics upgrade: PASS")
print("- GREEN/AMBER/RED is evidence-scoped rather than inferred from configuration alone")
print("- configuration and transaction acceptance are explicit separate fields")
print("- database/R2 missing authority is fail-closed while optional providers are not falsely core-red")
print("- corrective mechanics are manual/read-only and provider secrets remain out of the contract")
print("- Build 306 raw observations remain the underlying isolated authority")
