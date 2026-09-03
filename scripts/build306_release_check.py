#!/usr/bin/env python3
from pathlib import Path
import subprocess, sys

ROOT = Path(__file__).resolve().parents[1]
BASELINE = "fbbc6f4c3f0533c1bc7faafac36f7ad6befe6605"
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

def node_check(rel):
    proc = subprocess.run(["node", "--check", str(ROOT / rel)], capture_output=True, text=True)
    if proc.returncode:
        errors.append(f"node --check failed {rel}: {proc.stderr.strip()}")

changed = subprocess.run(["git", "diff", "--name-only", f"{BASELINE}...HEAD"], cwd=ROOT, capture_output=True, text=True)
if changed.returncode:
    errors.append("could not inspect Build 306 changed files")
else:
    for name in changed.stdout.splitlines():
        low = name.lower()
        if "migration" in low or low.startswith("database") or low.endswith(".sql"):
            errors.append(f"Build 306 unexpectedly changes schema/migration file {name}")

need("functions/api/_lib/system-health-families.js",
     '"deployment"', '"api"', '"d1"', '"storage"', '"authentication"', '"providers"',
     "Promise.allSettled", 'contract: "rosie_it_health_families_v1"',
     'semantics: "observation_only_build307_owns_readiness_diagnosis"',
     'mode = hasD1 ? "d1" : hasSupabase ? "supabase" : "unconfigured"')
need("functions/api/admin/system_health_families.js",
     'requireActionAccess(access.actor, "it.runtime.view")',
     'allowLegacyAdminFallback: false', 'onRequestGet', 'methodNotAllowed()')
need("assets/admin-system-health-v306.js",
     "['deployment','api','d1','storage','authentication','providers']",
     "/api/admin/system_health_families?family=", "Promise")
need("admin-system-health.html", "I.T. System Health", "Build 306 boundary", "/assets/admin-system-health-v306.js", "Build 307")
forbid("functions/api/_lib/system-health-families.js", "GREEN", "AMBER", "RED", "corrective_action", "remediation")

for rel in [
    "functions/api/_lib/system-health-families.js",
    "functions/api/admin/system_health_families.js",
    "assets/admin-system-health-v306.js",
    "scripts/build306_health_family_test.mjs",
]:
    node_check(rel)

test = subprocess.run(["node", "scripts/build306_health_family_test.mjs"], cwd=ROOT, capture_output=True, text=True)
if test.returncode:
    errors.append(f"Build 306 family test failed: {test.stderr.strip() or test.stdout.strip()}")

if errors:
    print("Build 306 I.T. Health dashboard extraction: FAIL")
    for error in errors: print("-", error)
    sys.exit(1)

print("Build 306 I.T. Health dashboard extraction: PASS")
print("- six observation families are independently testable")
print("- deployment and runtime observations remain separate")
print("- database mode does not falsely claim D1 when Rosie uses Supabase")
print("- endpoint is read-only and requires it.runtime.view")
print("- no schema change and no Build 307 diagnosis/remediation semantics")
