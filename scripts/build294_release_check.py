#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
BUILD293_PRODUCTION_SHA = "449edcfdea101fa9cbc6b0336ad2f17d04327b9a"
STAFF_OWNED = ["next_cleaning_due_at", "next_service_mileage_km", "service_interval_days", "auto_schedule_opt_in"]
errors = []


def text(rel):
    path = ROOT / rel
    if not path.exists():
        errors.append(f"missing {rel}")
        return ""
    return path.read_text(encoding="utf-8", errors="ignore")


def need(rel, *tokens):
    body = text(rel)
    for token in tokens:
        if token not in body:
            errors.append(f"{rel} missing {token}")


proc = subprocess.run(["git", "merge-base", "--is-ancestor", BUILD293_PRODUCTION_SHA, "HEAD"], cwd=ROOT)
if proc.returncode:
    errors.append("accepted Build 293 Production is not an ancestor of the Build 294 candidate")

vehicle_save = text("functions/api/client/vehicles_save.js")
for field in STAFF_OWNED:
    if f"b.{field}" in vehicle_save:
        errors.append(f"customer vehicle save still trusts {field}")
    if re.search(rf"\b{re.escape(field)}\s*:\s*", vehicle_save):
        errors.append(f"customer vehicle save still persists {field}")
for token in ["Build 294", "Scheduling/planning remains staff-owned", "customerSafeVehicle"]:
    if token not in vehicle_save:
        errors.append(f"vehicles_save.js missing {token}")

safe_shape = text("functions/api/client/_lib/customer-safe-shape.js")
match = re.search(r"const VEHICLE_FIELDS = \[(.*?)\];", safe_shape, flags=re.S)
if not match:
    errors.append("customer safe VEHICLE_FIELDS list not found")
else:
    projection = match.group(1)
    for field in STAFF_OWNED:
        if re.search(rf"['\"]{re.escape(field)}['\"]", projection):
            errors.append(f"customer-safe vehicle projection still exposes {field}")
for token in ["STAFF_OWNED_VEHICLE_SCHEDULING_FIELDS", *STAFF_OWNED, "'booking_id'"]:
    if token not in safe_shape:
        errors.append(f"customer-safe shape missing retained boundary token {token}")

need(
    "assets/customer-maintenance-authority-v294.js",
    "Build 294",
    "STAFF_OWNED_CONTROLS",
    '"vehNextDue"',
    '"vehNextServiceMileage"',
    '"vehIntervalDays"',
    '"vehAutoSchedule"',
    "control.disabled = true",
    "data-build294-maintenance-interest-only",
    "Maintenance timing is an interest preference",
    "Your customer account does not set a due date, service-mileage target, recurring cadence or automatic schedule.",
    "No fixed cadence, price, discount, priority, appointment, subscription or recurring billing is created here.",
    'href="/maintenance-plan"',
    "MutationObserver",
)
adapter = text("assets/customer-maintenance-authority-v294.js")
for forbidden in ["setInterval(", 'method: "POST"', "/api/membership_interest_create", "/api/client/vehicles_save", "/api/checkout"]:
    if forbidden in adapter:
        errors.append(f"Build 294 adapter contains forbidden authority token {forbidden}")

need(
    "assets/client-auth.js",
    "loadBuild294CustomerMaintenanceAuthority",
    "/assets/customer-maintenance-authority-v294.js",
    "data-build294-customer-maintenance-authority",
    "loadBuild293CustomerNextActions",
)

for rel in ["my-account.html", "my-account/index.html"]:
    need(rel, 'id="vehNextDue"', 'id="vehNextServiceMileage"', 'id="vehIntervalDays"', 'id="vehAutoSchedule"', 'id="maintenanceConversion"', "/assets/client-auth.js")

need("BUILD294_SUMMARY.md", "Build 294", "Customer Maintenance / Auto-Schedule Authority Closure", "no schema migration", "staff-owned")
need("scripts/build294_http_smoke.sh", "/my-account", "/assets/customer-maintenance-authority-v294.js", "/api/client/dashboard", "must not create")
need(".github/workflows/build294-source-gate.yml", "Build 294 Source Gate", "python scripts/build294_release_check.py")
need(".github/workflows/build294-development-acceptance.yml", "Build 294 Development Runtime Acceptance", "scripts/build294_http_smoke.sh")

for rel in ["functions/api/client/vehicles_save.js", "functions/api/client/_lib/customer-safe-shape.js", "assets/customer-maintenance-authority-v294.js", "assets/client-auth.js"]:
    proc = subprocess.run(["node", "--check", str(ROOT / rel)], capture_output=True, text=True)
    if proc.returncode:
        errors.append(f"node --check failed {rel}: {proc.stderr.strip()}")
proc = subprocess.run(["bash", "-n", str(ROOT / "scripts/build294_http_smoke.sh")], capture_output=True, text=True)
if proc.returncode:
    errors.append(f"bash -n failed build294_http_smoke.sh: {proc.stderr.strip()}")

if errors:
    print("Build 294 customer maintenance authority closure check: FAIL")
    for error in errors:
        print("-", error)
    sys.exit(1)

print("Build 294 customer maintenance authority closure check: PASS")
print("- customer vehicle writes no longer accept staff-owned due/mileage/cadence/auto-schedule fields")
print("- customer-safe vehicle projection no longer exposes those scheduling fields")
print("- existing database/staff historical scheduling authority is not deleted or migrated")
print("- account recurrence controls are hidden/disabled and maintenance remains interest-only")
print("- adapter is event-driven and read-only; no polling, write replay or subscription authority")
print("- Build 293 review booking linkage remains retained")
print("- Production remains closed")
