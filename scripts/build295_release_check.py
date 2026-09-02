#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
BUILD294_PRODUCTION_SHA = "5d6041501b205a03dd62522a6ffb9a49a822284b"
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


proc = subprocess.run(["git", "merge-base", "--is-ancestor", BUILD294_PRODUCTION_SHA, "HEAD"], cwd=ROOT)
if proc.returncode:
    errors.append("accepted Build 294 Production is not an ancestor of Build 295 candidate")

pages = ["my-account.html", "my-account/index.html"]
required_page = [
    "data-build295-account-source-authority",
    "Maintenance interest",
    "Open maintenance interest",
    'id="maintenanceConversion"',
    'id="bookingHistory"',
    'id="vehicleForm"',
    "/assets/client-auth.js",
]
for rel in pages:
    need(rel, *required_page)
    forbid(
        rel,
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
    )

if read("my-account.html") != read("my-account/index.html"):
    errors.append("My Account route copies are not exact")

# Build 296 external module extraction is a stronger maintainability shape.
# On the original Build 295 branch these markers remain inline; after Build 296
# they must remain in the versioned account module instead.
account_asset = ROOT / "assets/my-account-v296.js"
if account_asset.exists():
    account_runtime = read("assets/my-account-v296.js")
    for rel in pages:
        need(rel, '<script type="module" src="/assets/my-account-v296.js"></script>')
        forbid(rel, '<script type="module">')
else:
    account_runtime = read("my-account.html")
for token in [
    "data-build295-maintenance-interest-only",
    "Maintenance timing is an interest preference",
    "No fixed cadence, price, discount, priority, appointment, subscription or recurring billing",
    "/api/client/profile_update",
    "/api/client/vehicles_save",
]:
    if token not in account_runtime:
        errors.append(f"customer account runtime missing {token}")
if account_asset.exists():
    forbid(
        "assets/my-account-v296.js",
        "acctAdminNotes", "vehAdminNotes", "vehNextDue", "vehNextServiceMileage",
        "vehIntervalDays", "vehAutoSchedule", "admin_private_notes",
        "next_cleaning_due_at:$('#vehNextDue')",
        "next_service_mileage_km:$('#vehNextServiceMileage')",
        "service_interval_days:$('#vehIntervalDays')",
        "auto_schedule_opt_in:$('#vehAutoSchedule')",
        "unlock maintenance pricing", "reduced maintenance pricing",
        "reduced repeat-clean pricing", "Maintenance eligible",
        "Recurring maintenance scheduling only starts",
        "Your account can move into recurring maintenance",
    )

# Server-side authorities remain the ultimate fail-closed boundary.
forbid("functions/api/client/profile_update.js", "admin_private_notes: cleanText(body.admin_private_notes)")
forbid(
    "functions/api/client/vehicles_save.js",
    "b.next_cleaning_due_at",
    "b.next_service_mileage_km",
    "b.service_interval_days",
    "b.auto_schedule_opt_in",
    "admin_private_notes: text(b.admin_private_notes)",
)
need("functions/api/client/vehicles_save.js", "Scheduling/planning remains staff-owned", "customerSafeVehicle")

# Retain older runtime adapters as defense in depth; Build 295 no longer depends on them
# to make the static account source safe.
need("assets/customer-privacy-v288.js", "acctAdminNotes", "vehAdminNotes", "control.disabled = true")
need("assets/customer-maintenance-authority-v294.js", "STAFF_OWNED_CONTROLS", "MutationObserver", "data-build294-maintenance-interest-only")
need("assets/client-auth.js", "/assets/customer-privacy-v288.js", "/assets/customer-maintenance-authority-v294.js")
need("scripts/build294_release_check.py", "data-build295-account-source-authority", "Build 295 source-level removal")

# Build 295 is source-only and must not add a schema migration.
changed = subprocess.run(
    ["git", "diff", "--name-only", f"{BUILD294_PRODUCTION_SHA}...HEAD"],
    cwd=ROOT,
    capture_output=True,
    text=True,
)
if changed.returncode:
    errors.append("could not inspect Build 295 changed files")
else:
    for name in changed.stdout.splitlines():
        low = name.lower()
        if "migration" in low or low.startswith("database") or low.endswith(".sql"):
            errors.append(f"Build 295 unexpectedly changes schema/migration file {name}")

need("BUILD295_SUMMARY.md", "Build 295", "Customer Account Static Source Authority Cleanup", "no schema migration")
need("scripts/build295_http_smoke.sh", "data-build295-account-source-authority", "/api/client/dashboard", "read-only")
need(".github/workflows/build295-source-gate.yml", "Build 295 Source Gate", "python scripts/build295_release_check.py")
need(".github/workflows/build295-development-acceptance.yml", "Build 295 Development Runtime Acceptance", "scripts/build295_http_smoke.sh")
need(".github/workflows/development-source-gate.yml", "Run current Build 295 focused guard", "python scripts/build295_release_check.py")
handoff = read("AI_PROJECT_HANDOFF.md")
if not any(marker in handoff for marker in ["**Build:** 295", "**Build:** 296", "**Build:** 297"]):
    errors.append("AI_PROJECT_HANDOFF.md missing Build 295/296/297 living authority marker")
for token in ["customer account static source authority cleanup", "My Account maintainability extraction"]:
    if token not in handoff:
        errors.append(f"AI_PROJECT_HANDOFF.md missing retained Build 295 token {token}")
roadmap = read("MASTER_VALUE_ROADMAP.md")
if not any(marker in roadmap for marker in ["**Build:** 295", "**Build:** 296", "**Build:** 297"]):
    errors.append("MASTER_VALUE_ROADMAP.md missing Build 295/296/297 living authority marker")
for token in ["Build 295 — customer account static source authority cleanup", "My Account maintainability extraction"]:
    if token not in roadmap:
        errors.append(f"MASTER_VALUE_ROADMAP.md missing retained Build 295 token {token}")

# Temporary bootstrap machinery must never ship with the accepted candidate.
for rel in [
    ".github/workflows/build295-bootstrap-authorities.yml",
    ".github/workflows/build295-bootstrap-account-source.yml",
    "scripts/build295_patch_my_account.py",
    "scripts/build295_patch_authorities.py",
    "scripts/build295_patch_development_gate.py",
    "BUILD295_BOOTSTRAP_TRIGGER.tmp",
]:
    if (ROOT / rel).exists():
        errors.append(f"temporary Build 295 bootstrap file remains: {rel}")

proc = subprocess.run(["bash", "-n", str(ROOT / "scripts/build295_http_smoke.sh")], capture_output=True, text=True)
if proc.returncode:
    errors.append(f"bash -n failed build295_http_smoke.sh: {proc.stderr.strip()}")

if errors:
    print("Build 295 customer account static source authority check: FAIL")
    for error in errors:
        print("-", error)
    sys.exit(1)

print("Build 295 customer account static source authority check: PASS")
print("- My Account source and route copy are privacy-safe and maintenance-interest-only")
print("- customer browser payloads no longer contain staff-private or staff scheduling keys")
print("- server-side Build 288/294 boundaries and defensive adapters remain retained")
print("- living handoff/roadmap retain Build 295 authority while later living releases may advance")
print("- temporary bootstrap machinery is absent from the release candidate")
print("- no maintenance price/cadence/priority/subscription authority was invented")
print("- no schema migration was introduced")
print("- Production remains closed")
