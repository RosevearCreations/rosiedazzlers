#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
BUILD296_PRODUCTION_SHA = "337ae533130f4bf1c566d47c2ba1bc712cbf780e"
ASSET = "assets/admin-customers-v297.js"
PAGES = ["admin-customers.html", "admin-customers/index.html"]
EXTERNAL_TAG = '  <script src="/assets/admin-customers-v297.js"></script>'
INLINE_PATTERN = re.compile(r'  <script>\n(?P<body>  \(function\(\)\{.*?\n  \}\)\(\);)\n  </script>', re.S)
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


ancestor = subprocess.run(
    ["git", "merge-base", "--is-ancestor", BUILD296_PRODUCTION_SHA, "HEAD"],
    cwd=ROOT,
)
if ancestor.returncode:
    errors.append("accepted Build 296 Production is not an ancestor of Build 297 candidate")

baseline = subprocess.run(
    ["git", "show", f"{BUILD296_PRODUCTION_SHA}:admin-customers.html"],
    cwd=ROOT,
    capture_output=True,
    text=True,
)
if baseline.returncode:
    errors.append("could not read accepted Build 296 Operations customer baseline")
    baseline_source = ""
else:
    baseline_source = baseline.stdout

matches = list(INLINE_PATTERN.finditer(baseline_source)) if baseline_source else []
if len(matches) != 1:
    errors.append(f"accepted Build 296 baseline must contain exactly one mature customer runtime; found {len(matches)}")
    baseline_body = ""
else:
    baseline_body = matches[0].group("body")

asset_body = read(ASSET)
if baseline_body and asset_body != baseline_body + "\n":
    errors.append("versioned Operations customer asset is not byte-for-byte the accepted Build 296 inline runtime")

expected_page = INLINE_PATTERN.sub(EXTERNAL_TAG, baseline_source, count=1) if len(matches) == 1 else ""
for rel in PAGES:
    body = read(rel)
    if expected_page and body != expected_page:
        errors.append(f"{rel} differs from accepted Build 296 source beyond the exact runtime extraction")
    if EXTERNAL_TAG not in body:
        errors.append(f"{rel} missing Build 297 customer runtime tag")
    if INLINE_PATTERN.search(body):
        errors.append(f"{rel} still contains the mature inline customer runtime")
    for token in [
        'data-page="admin-customers"',
        'noindex,nofollow,noarchive',
        '/assets/admin-auth.js',
        '/assets/admin-shell.js',
        'id="customerForm"',
        'id="helpQueue"',
        'data-access-action="send_password_reset"',
        'id="archiveBtn"',
    ]:
        if token not in body:
            errors.append(f"{rel} lost retained customer-support source token {token}")

if read(PAGES[0]) != read(PAGES[1]):
    errors.append("Operations customer route copies are not exact")

need(
    ASSET,
    "/api/admin/customer_admin_list",
    "/api/admin/customer_admin_detail",
    "/api/admin/customer_admin_save",
    "/api/admin/customer_admin_access_action",
    "/api/admin/customer_account_help_list",
    "/api/admin/customer_account_help_action",
    "send_account_setup",
    "send_password_reset",
    "resend_verification",
    "revoke_sessions",
    "ARCHIVE CLIENT",
    "AdminShell.boot({pageKey:'admin-customers'",
)

# Build 290 remains the retained authorization/source boundary for this admin page.
need("scripts/build290_release_check.py", "admin-customers.html", "customer_profiles_save")
need("scripts/build290_http_smoke.sh", "admin-customers.html", "/assets/admin-auth.js", "/assets/admin-shell.js")

changed = subprocess.run(
    ["git", "diff", "--name-only", f"{BUILD296_PRODUCTION_SHA}...HEAD"],
    cwd=ROOT,
    capture_output=True,
    text=True,
)
if changed.returncode:
    errors.append("could not inspect Build 297 changed files")
else:
    for name in changed.stdout.splitlines():
        low = name.lower()
        if "migration" in low or low.startswith("database") or low.endswith(".sql"):
            errors.append(f"Build 297 unexpectedly changes schema/migration file {name}")

need("BUILD297_SUMMARY.md", "Build 297", "Operations Customer Support Maintainability Extraction", "no admin behavior change", "no schema migration")
need("scripts/build297_http_smoke.sh", "/assets/admin-customers-v297.js", "read-only")
need(".github/workflows/build297-source-gate.yml", "Build 297 Source Gate", "python scripts/build297_release_check.py")
need(".github/workflows/build297-development-source-gate.yml", "Build 297 Development Source Gate", "scripts/build297_release_check.py")
need(".github/workflows/build297-development-acceptance.yml", "Build 297 Development Runtime Acceptance", "scripts/build297_http_smoke.sh")
need("AI_PROJECT_HANDOFF.md", "**Build:** 297", BUILD296_PRODUCTION_SHA, "Operations customer support maintainability extraction")
need("MASTER_VALUE_ROADMAP.md", "**Build:** 297", BUILD296_PRODUCTION_SHA, "Build 297 — Operations customer support maintainability extraction")

for rel in [
    ".github/workflows/build297-bootstrap-extraction.yml",
    ".github/workflows/build297-bootstrap-route-parity.yml",
    ".github/workflows/build297-retained-guard-scan.yml",
]:
    if (ROOT / rel).exists():
        errors.append(f"temporary Build 297 bootstrap/scan file remains: {rel}")

syntax = subprocess.run(["node", "--check", str(ROOT / ASSET)], capture_output=True, text=True)
if syntax.returncode:
    errors.append(f"node --check failed {ASSET}: {syntax.stderr.strip()}")
smoke_syntax = subprocess.run(["bash", "-n", str(ROOT / "scripts/build297_http_smoke.sh")], capture_output=True, text=True)
if smoke_syntax.returncode:
    errors.append(f"bash -n failed build297_http_smoke.sh: {smoke_syntax.stderr.strip()}")

if errors:
    print("Build 297 Operations customer support maintainability extraction check: FAIL")
    for error in errors:
        print("-", error)
    sys.exit(1)

print("Build 297 Operations customer support maintainability extraction check: PASS")
print("- accepted Build 296 customer runtime is byte-for-byte preserved in assets/admin-customers-v297.js")
print("- both Operations customer route copies differ from Build 296 only by the external classic-script tag")
print("- customer directory, account assistance, lifecycle and role-gated authority remain unchanged")
print("- retained Build 290 authorization/source boundary remains in place")
print("- no admin behavior, API authority, business rule, pricing, recurrence or schema migration was introduced")
print("- temporary Build 297 bootstrap/scan machinery is absent")
print("- Production remains closed for Build 297")
