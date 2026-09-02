#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
BUILD295_PRODUCTION_SHA = "73556e1f41dc204290409294c5e38ad0b2090fb7"
ASSET = "assets/my-account-v296.js"
PAGES = ["my-account.html", "my-account/index.html"]
EXTERNAL_TAG = '<script type="module" src="/assets/my-account-v296.js"></script>'
INLINE_PATTERN = re.compile(r'<script type="module">\n(?P<body>.*?)\n</script>', re.S)
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


ancestor = subprocess.run(
    ["git", "merge-base", "--is-ancestor", BUILD295_PRODUCTION_SHA, "HEAD"],
    cwd=ROOT,
)
if ancestor.returncode:
    errors.append("accepted Build 295 Production is not an ancestor of Build 296 candidate")

baseline = subprocess.run(
    ["git", "show", f"{BUILD295_PRODUCTION_SHA}:my-account.html"],
    cwd=ROOT,
    capture_output=True,
    text=True,
)
if baseline.returncode:
    errors.append("could not read accepted Build 295 My Account baseline")
    baseline_source = ""
else:
    baseline_source = baseline.stdout

matches = list(INLINE_PATTERN.finditer(baseline_source)) if baseline_source else []
if len(matches) != 1:
    errors.append(f"accepted Build 295 baseline must contain exactly one inline account module; found {len(matches)}")
    baseline_body = ""
else:
    baseline_body = matches[0].group("body")

asset_body = read(ASSET)
if baseline_body and asset_body != baseline_body + "\n":
    errors.append("versioned My Account asset is not byte-for-byte the accepted Build 295 inline module")

expected_page = INLINE_PATTERN.sub(EXTERNAL_TAG, baseline_source, count=1) if len(matches) == 1 else ""
for rel in PAGES:
    body = read(rel)
    if expected_page and body != expected_page:
        errors.append(f"{rel} differs from accepted Build 295 source beyond the exact module extraction")
    if EXTERNAL_TAG not in body:
        errors.append(f"{rel} missing versioned My Account module tag")
    if '<script type="module">' in body:
        errors.append(f"{rel} still contains the mature inline module")
    for token in [
        "data-build295-account-source-authority",
        "Maintenance interest",
        "Open maintenance interest",
        'id="maintenanceConversion"',
        'id="bookingHistory"',
        'id="vehicleForm"',
        "/assets/client-auth.js",
    ]:
        if token not in body:
            errors.append(f"{rel} lost retained Build 295 authority token {token}")

if read(PAGES[0]) != read(PAGES[1]):
    errors.append("My Account route copies are not exact")

need(
    ASSET,
    'import { setBrandImages, setFooter } from "/assets/site.js";',
    "data-build295-maintenance-interest-only",
    "Maintenance timing is an interest preference",
    "No fixed cadence, price, discount, priority, appointment, subscription or recurring billing",
    "/api/client/dashboard",
    "/api/client/profile_update",
    "/api/client/vehicles_save",
    "/api/client/vehicle_media_upload_url",
    "/api/client/vehicle_media_save",
    "/api/client/reviews_save",
    "setBrandImages(); setFooter();",
)

forbidden = [
    "acctAdminNotes",
    "vehAdminNotes",
    "vehNextDue",
    "vehNextServiceMileage",
    "vehIntervalDays",
    "vehAutoSchedule",
    "admin_private_notes",
    "next_cleaning_due_at:$('#vehNextDue')",
    "next_service_mileage_km:$('#vehNextServiceMileage')",
    "service_interval_days:$('#vehIntervalDays')",
    "auto_schedule_opt_in:$('#vehAutoSchedule')",
    "unlock maintenance pricing",
    "reduced maintenance pricing",
    "reduced repeat-clean pricing",
    "Maintenance eligible",
    "Recurring maintenance scheduling only starts",
    "Your account can move into recurring maintenance",
]
for rel in PAGES + [ASSET]:
    forbid(rel, *forbidden)

# Retain the Build 295 privacy/source guard, now explicitly forward-compatible
# with the Build 296 external module extraction.
need(
    "scripts/build295_release_check.py",
    "assets/my-account-v296.js",
    "account_runtime",
    "Build 296 external module",
)
need("assets/customer-privacy-v288.js", "acctAdminNotes", "vehAdminNotes", "control.disabled = true")
need("assets/customer-maintenance-authority-v294.js", "STAFF_OWNED_CONTROLS", "MutationObserver")
need("assets/client-auth.js", "/assets/customer-privacy-v288.js", "/assets/customer-maintenance-authority-v294.js")

changed = subprocess.run(
    ["git", "diff", "--name-only", f"{BUILD295_PRODUCTION_SHA}...HEAD"],
    cwd=ROOT,
    capture_output=True,
    text=True,
)
if changed.returncode:
    errors.append("could not inspect Build 296 changed files")
else:
    for name in changed.stdout.splitlines():
        low = name.lower()
        if "migration" in low or low.startswith("database") or low.endswith(".sql"):
            errors.append(f"Build 296 unexpectedly changes schema/migration file {name}")

need("BUILD296_SUMMARY.md", "Build 296", "My Account Maintainability Extraction", "no customer behavior change", "no schema migration")
need("scripts/build296_http_smoke.sh", "/assets/my-account-v296.js", "/api/client/dashboard", "read-only")
need(".github/workflows/build296-source-gate.yml", "Build 296 Source Gate", "python scripts/build296_release_check.py")
need(".github/workflows/build296-development-acceptance.yml", "Build 296 Development Runtime Acceptance", "scripts/build296_http_smoke.sh")
need(".github/workflows/build296-development-source-gate.yml", "Build 296 Development Source Gate", "scripts/build296_release_check.py", "node --check assets/my-account-v296.js")
handoff = read("AI_PROJECT_HANDOFF.md")
if not any(marker in handoff for marker in ["**Build:** 296", "**Build:** 297"]):
    errors.append("AI_PROJECT_HANDOFF.md missing Build 296/297 living authority marker")
if "My Account maintainability extraction" not in handoff:
    errors.append("AI_PROJECT_HANDOFF.md missing retained Build 296 My Account maintainability authority")
roadmap = read("MASTER_VALUE_ROADMAP.md")
if not any(marker in roadmap for marker in ["**Build:** 296", "**Build:** 297"]):
    errors.append("MASTER_VALUE_ROADMAP.md missing Build 296/297 living authority marker")
if "Build 296 — My Account maintainability extraction" not in roadmap:
    errors.append("MASTER_VALUE_ROADMAP.md missing retained Build 296 My Account maintainability authority")

for rel in [
    ".github/workflows/build296-bootstrap-extraction.yml",
    ".github/workflows/build296-bootstrap-authorities.yml",
    ".github/workflows/build296-bootstrap-authorities-v2.yml",
    ".github/workflows/build296-bootstrap-code-docs.yml",
]:
    if (ROOT / rel).exists():
        errors.append(f"temporary Build 296 bootstrap file remains: {rel}")

syntax = subprocess.run(["node", "--check", str(ROOT / ASSET)], capture_output=True, text=True)
if syntax.returncode:
    errors.append(f"node --check failed {ASSET}: {syntax.stderr.strip()}")
smoke_syntax = subprocess.run(["bash", "-n", str(ROOT / "scripts/build296_http_smoke.sh")], capture_output=True, text=True)
if smoke_syntax.returncode:
    errors.append(f"bash -n failed build296_http_smoke.sh: {smoke_syntax.stderr.strip()}")

if errors:
    print("Build 296 My Account maintainability extraction check: FAIL")
    for error in errors:
        print("-", error)
    sys.exit(1)

print("Build 296 My Account maintainability extraction check: PASS")
print("- accepted Build 295 inline module is byte-for-byte preserved in assets/my-account-v296.js")
print("- both My Account route copies differ from Build 295 only by the external module tag")
print("- customer API calls and execution order remain in the same module position")
print("- Build 288/294/295 privacy and maintenance authority remains retained")
print("- living authorities may advance beyond Build 296 while retaining this extraction proof")
print("- no customer behavior, API authority, maintenance economics or schema migration was introduced")
print("- temporary bootstrap machinery is absent")
print("- Production remains closed")
