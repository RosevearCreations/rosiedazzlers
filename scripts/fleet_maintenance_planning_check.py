#!/usr/bin/env python3
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
errors = []

def text(path):
    p = ROOT / path
    if not p.exists():
        errors.append(f"missing {path}")
        return ""
    return p.read_text(encoding="utf-8", errors="ignore")

helper = text("functions/api/_lib/fleet-maintenance-planning.js")
api = text("functions/api/admin/customer_vehicle_maintenance_planning.js")
page = text("admin-fleet-maintenance.html")
test_file = text("scripts/fleet_maintenance_planning_test.mjs")

for token in [
    '"service_interval_days"',
    '"next_cleaning_due_at"',
    '"next_service_mileage_km"',
    'Automatic scheduling cannot be changed',
    'value < 14 || value > 84',
    "value < currentMileage",
]:
    if token not in helper:
        errors.append(f"fleet planning helper missing contract: {token}")

for token in [
    'capability: "view_clients"',
    'capability: "manage_clients"',
    '/rest/v1/customer_vehicles',
    'method: "PATCH"',
    'writableFleetMaintenanceFields()',
    'automatic_scheduling: false',
    'appointment_creation: false',
    'recurring_billing: false',
    'unresolved_vehicle_histories',
]:
    if token not in api:
        errors.append(f"fleet planning API missing contract: {token}")

for forbidden in [
    '/rest/v1/bookings?',
    'stripe.com',
    '/v2/checkout/orders',
    'membership_interest_requests',
]:
    if forbidden in api:
        errors.append(f"fleet planning API must not write/invoke adjacent authority: {forbidden}")

for token in [
    '<h1>Fleet maintenance workbench</h1>',
    '/api/admin/customer_vehicle_maintenance_planning',
    'data-save-vehicle',
    'No automatic scheduling',
    'No recurring billing',
    'Vehicle histories needing review',
    '@media(max-width:',
]:
    if token.lower() not in page.lower():
        errors.append(f"fleet maintenance page missing UI/help contract: {token}")

if page.lower().count('<h1') != 1:
    errors.append("admin-fleet-maintenance.html must contain exactly one H1")
if 'name="viewport"' not in page.lower():
    errors.append("admin-fleet-maintenance.html missing device viewport")
if 'noindex' not in page.lower():
    errors.append("admin-fleet-maintenance.html must remain noindex")

for token in [
    'automatic scheduling must never be writable',
    'customer/profile fields must never be writable',
    'target mileage below current mileage must fail closed',
]:
    if token not in test_file:
        errors.append(f"fleet planning executable test missing case: {token}")

migration_hits = list(ROOT.glob("**/*328*.sql")) + list(ROOT.glob("**/*build328*.sql"))
if migration_hits:
    errors.append("Build 328 must not introduce a database migration: " + ", ".join(str(p.relative_to(ROOT)) for p in migration_hits))

if not errors:
    result = subprocess.run(
        ["node", "scripts/fleet_maintenance_planning_test.mjs"],
        cwd=ROOT,
        text=True,
        capture_output=True,
    )
    if result.returncode != 0:
        errors.append("fleet maintenance executable contract failed:\n" + (result.stdout or "") + (result.stderr or ""))

if errors:
    print("Fleet maintenance planning authority: FAIL")
    for error in errors:
        print(" -", error)
    raise SystemExit(1)

print("Fleet maintenance planning authority: PASS")
print(" - staff planning is vehicle-id scoped and Operations-authorized")
print(" - only interval, due date and mileage target are writable")
print(" - automatic scheduling, appointment creation and recurring billing remain disabled")
print(" - ambiguous vehicle history remains visible but fail-closed")
print(" - executable validation/due-state tests pass")
