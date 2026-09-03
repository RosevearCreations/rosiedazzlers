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

# Build 306's raw observation authority must remain intact even after later readiness layers consume it.
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
     "/api/admin/system_health_families?family=", "refreshFamily", "refreshAll")

html = read("admin-system-health.html")
for token in ["I.T. System Health", "Build 307"]:
    if token not in html:
        errors.append(f"admin-system-health.html missing {token}")
if "/assets/admin-system-health-v306.js" not in html and "/assets/admin-system-health-v307.js" not in html:
    errors.append("admin-system-health.html no longer loads a recognized System Health runtime")
if "/assets/admin-system-health-v307.js" in html:
    need("assets/admin-system-health-v307.js", "refreshFamily", "refreshAll", "/api/admin/system_health_families")

# Build 307 readiness semantics may wrap the raw report, but must never be encoded inside Build 306 observations.
forbid("functions/api/_lib/system-health-families.js", 'status: "GREEN"', 'status: "AMBER"', 'status: "RED"', 'corrective_action:')

for rel in [
    "functions/api/_lib/system-health-families.js",
    "functions/api/admin/system_health_families.js",
    "assets/admin-system-health-v306.js",
    "scripts/build306_health_family_test.mjs",
]:
    node_check(rel)
if (ROOT / "assets/admin-system-health-v307.js").exists():
    node_check("assets/admin-system-health-v307.js")

test = subprocess.run(["node", "scripts/build306_health_family_test.mjs"], cwd=ROOT, capture_output=True, text=True)
if test.returncode:
    errors.append(f"Build 306 family test failed: {test.stderr.strip() or test.stdout.strip()}")

if errors:
    print("Build 306 I.T. Health dashboard extraction: FAIL")
    for error in errors: print("-", error)
    sys.exit(1)

print("Build 306 I.T. Health dashboard extraction: PASS")
print("- six raw observation families remain independently testable")
print("- deployment and runtime observations remain separate")
print("- database mode does not falsely claim D1 when Rosie uses Supabase")
print("- endpoint remains read-only and requires it.runtime.view")
print("- later readiness semantics remain outside the raw Build 306 observation helper")
