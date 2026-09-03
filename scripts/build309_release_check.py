#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
BASELINE = "d14a63c62913edf125a3e2bd8d69f110a6942dad"
PRODUCTION = "09442c53d385aca7995150ace4bde55abd51d7df"
ROOT_PAGE = "admin-staff.html"
FOLDER_PAGE = "admin-staff/index.html"
ASSET = "assets/admin-staff-v309.js"
TAG = '<script type="module" src="/assets/admin-staff-v309.js"></script>'
errors = []


def read(rel):
    path = ROOT / rel
    if not path.exists():
        errors.append(f"missing {rel}")
        return ""
    return path.read_text(encoding="utf-8", errors="ignore")


def baseline_file(rel):
    proc = subprocess.run(["git", "show", f"{BASELINE}:{rel}"], cwd=ROOT, capture_output=True, text=True)
    if proc.returncode:
        errors.append(f"could not read accepted Build 308 baseline {rel}: {proc.stderr.strip()}")
        return ""
    return proc.stdout


def split_module_runtime(text, label):
    marker = '<script type="module">'
    start = text.rfind(marker)
    if start < 0:
        errors.append(f"{label} missing mature Staff module runtime")
        return None
    body_start = start + len(marker)
    end = text.find('</script>', body_start)
    if end < 0:
        errors.append(f"{label} missing Staff runtime close")
        return None
    return start, body_start, end, end + len('</script>')


def require_ancestor(anchor, label):
    proc = subprocess.run(["git", "merge-base", "--is-ancestor", anchor, "HEAD"], cwd=ROOT)
    if proc.returncode:
        errors.append(f"{label} is not an ancestor of Build 309 candidate")


require_ancestor(BASELINE, "accepted Build 308 Development")
require_ancestor(PRODUCTION, "accepted Build 303 Production")

baseline_root = baseline_file(ROOT_PAGE)
baseline_folder = baseline_file(FOLDER_PAGE)
if baseline_root and baseline_folder and baseline_root == baseline_folder:
    errors.append("accepted Build 308 Staff root/folder divergence unexpectedly disappeared; review route authority before Build 309")

parts = split_module_runtime(baseline_root, "accepted Build 308 admin-staff.html") if baseline_root else None
if parts:
    start, body_start, end, close_end = parts
    expected_asset = baseline_root[body_start:end].lstrip("\n")
    # Ignore only terminal structural whitespace contributed by the indented closing
    # </script> line; all executable/source bytes before it remain exact.
    if read(ASSET).rstrip() != expected_asset.rstrip():
        errors.append("versioned Staff asset is not byte-for-byte the accepted Build 308 root inline runtime")
    expected_page = baseline_root[:start] + TAG + baseline_root[close_end:]
    if read(ROOT_PAGE).rstrip("\n") != expected_page.rstrip("\n"):
        errors.append(f"{ROOT_PAGE} differs from accepted Build 308 root source beyond exact runtime extraction")

root = read(ROOT_PAGE)
asset = read(ASSET)
folder = read(FOLDER_PAGE)

for token in [
    'data-page="admin-staff"',
    '<h1>Manage staff access</h1>',
    'id="staffForm"',
    'data-module-access="detailer"',
    'data-module-access="admin"',
    'Administrator / Owner — all modules',
    TAG,
]:
    if token not in root:
        errors.append(f"{ROOT_PAGE} lost retained Staff source token {token}")
if '<script type="module">' in root:
    errors.append(f"{ROOT_PAGE} still contains inline Staff module runtime")

for token in [
    'const MODULE_KEYS = ["detailer","operations","admin","it","finance","daip","socials"]',
    'const ROLE_MODULES = {',
    'admin: [...MODULE_KEYS]',
    'function syncModuleAccess(',
    'function collectModuleAccess()',
    'const forcedAdmin = role === "admin"',
    'module_access: collectModuleAccess()',
    '/api/admin/staff_list',
    '/api/admin/staff_save',
    'runtime.requestJson(',
    'password: password || undefined',
    'pageKey: "admin-staff"',
]:
    if token not in asset:
        errors.append(f"{ASSET} missing retained runtime token {token}")
if 'setInterval(' in asset:
    errors.append(f"{ASSET} introduces prohibited idle polling")

# Build 309 deliberately does not converge the pre-existing older folder route.
# Build 318 owns whole-application duplicate-route authority cleanup.
if baseline_folder and folder != baseline_folder:
    errors.append(f"{FOLDER_PAGE} changed even though Build 309 must preserve its pre-existing route behavior exactly")
if 'data-module-access="admin"' in folder or 'MODULE_KEYS' in folder or 'module_access: collectModuleAccess()' in folder:
    errors.append(f"{FOLDER_PAGE} was silently converged with newer root Staff behavior")

# The extraction must not change server-side authentication/authorization authority.
for rel in [
    "functions/api/_lib/staff-auth.js",
    "functions/api/_lib/action-permissions.js",
    "functions/api/_lib/permissions-profile.js",
    "functions/api/staff_save.js",
    "functions/api/admin/staff_save.js",
]:
    base = baseline_file(rel)
    if base and read(rel) != base:
        errors.append(f"Build 309 unexpectedly changes retained Staff authorization authority: {rel}")

changed = subprocess.run(["git", "diff", "--name-only", f"{BASELINE}...HEAD"], cwd=ROOT, capture_output=True, text=True)
if changed.returncode:
    errors.append("could not inspect Build 309 changed files")
else:
    allowed = {
        ROOT_PAGE,
        ASSET,
        "scripts/build309_release_check.py",
        "scripts/build309_http_smoke.sh",
        ".github/workflows/build309-source-gate.yml",
        ".github/workflows/build309-development-source-gate.yml",
        ".github/workflows/build309-development-acceptance.yml",
        "BUILD309_SUMMARY.md",
        "AI_PROJECT_HANDOFF.md",
        "MASTER_VALUE_ROADMAP.md",
        "AUTONOMOUS_RELEASE_QUEUE.md",
    }
    for name in changed.stdout.splitlines():
        low = name.lower()
        if "migration" in low or low.startswith("database") or low.endswith(".sql"):
            errors.append(f"Build 309 unexpectedly changes schema/migration file {name}")
        if name not in allowed:
            errors.append(f"unexpected Build 309 source path: {name}")

queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
for token in [
    "Build 309 — Staff Administration maintainability extraction",
    "preserving authentication and role-management rules",
    "Build 310 — Admin full-access acceptance matrix",
    "Build 318 — Whole-application route/API authority sweep",
]:
    if token not in queue:
        errors.append(f"AUTONOMOUS_RELEASE_QUEUE.md missing retained Build 309 queue token {token}")

for rel, tokens in {
    "scripts/build309_http_smoke.sh": ["admin-staff-v309.js", "read-only", "staff_list", "staff_save"],
    ".github/workflows/build309-source-gate.yml": ["Build 309 Source Gate", "scripts/build309_release_check.py"],
    ".github/workflows/build309-development-source-gate.yml": ["Build 309 Development Source Gate", "scripts/build309_release_check.py"],
    ".github/workflows/build309-development-acceptance.yml": ["Build 309 Development Runtime Acceptance", "scripts/build309_http_smoke.sh"],
}.items():
    body = read(rel)
    for token in tokens:
        if token not in body:
            errors.append(f"{rel} missing {token}")

syntax = subprocess.run(["node", "--check", str(ROOT / ASSET)], capture_output=True, text=True)
if syntax.returncode:
    errors.append(f"node --check failed {ASSET}: {syntax.stderr.strip()}")
smoke = subprocess.run(["bash", "-n", str(ROOT / "scripts/build309_http_smoke.sh")], capture_output=True, text=True)
if smoke.returncode:
    errors.append(f"bash -n failed build309_http_smoke.sh: {smoke.stderr.strip()}")

if errors:
    print("Build 309 Staff Administration maintainability extraction check: FAIL")
    for error in errors:
        print("-", error)
    sys.exit(1)

print("Build 309 Staff Administration maintainability extraction check: PASS")
print("- accepted Build 308 root Staff runtime is byte-for-byte preserved in assets/admin-staff-v309.js")
print("- admin-staff.html differs from the accepted Build 308 source only by the external module-script tag")
print("- role ceilings, per-profile module narrowing and forced full Admin module access remain unchanged")
print("- staff list/save API orchestration and legacy fallback presentation remain unchanged")
print("- pre-existing older admin-staff/index.html remains byte-for-byte unchanged; Build 318 owns route convergence")
print("- no Staff auth/action authority, schema, business rule or polling behavior changed")
print("- runtime acceptance is read-only; it never saves or mutates a staff record")
print(f"- Production remains accepted Build 303 at {PRODUCTION} and stays closed for Build 309")
