#!/usr/bin/env python3
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
errors = []


def text(path):
    p = ROOT / path
    if not p.exists():
        errors.append(f"missing {path}")
        return ""
    return p.read_text(encoding="utf-8", errors="ignore")


public_page = text("maintenance-plan.html")
create_api = text("functions/api/membership_interest_create.js")
admin_api = text("functions/api/admin/membership_interest_list.js")
admin_page = text("admin-growth.html")
reminder_helper = text("functions/api/_lib/membership-reminders.js")
vehicle_save = text("functions/api/client/vehicles_save.js")
vehicle_test = ROOT / "scripts/vehicle_maintenance_rules_test.mjs"

for token in ["interest request only", "recurring billing authorization", "not a booking or recurring-service authorization"]:
    if token.lower() not in public_page.lower():
        errors.append(f"maintenance-plan.html missing public interest-only contract: {token}")

for token in ["creates_automatic_enrollment: false", "creates_appointment: false", "creates_recurring_billing: false"]:
    if token not in create_api:
        errors.append(f"membership_interest_create.js missing fail-closed contract: {token}")

for token in ["interest_requests", "reminder_candidates", "metrics", "readiness", "automatic_enrollment: false", "recurring_billing: false", "due_reminder_count"]:
    if token not in admin_api:
        errors.append(f"admin membership readiness API missing {token}")

for token in ["/api/admin/membership_interest_list", "Maintenance Plan readiness", "no automatic enrollment", "No recurring billing", "Maintenance Plan operating help", "data-interest-waitlist"]:
    if token.lower() not in admin_page.lower():
        errors.append(f"admin-growth.html missing retention/help surface: {token}")

if "@media(max-width:" not in admin_page.replace(" ", ""):
    errors.append("admin-growth.html missing explicit small-screen responsive contract")

for token in [
    "customer_vehicles",
    "vehicle_year",
    "vehicle_make",
    "vehicle_model",
    "vehicle_plate",
    "groupCompletedBookings",
    "vehicle_identity_required",
    "maintenance_vehicle_key",
    "saved_vehicle",
    "staff_vehicle_override",
    'maintenance_source: "vehicle_history"',
]:
    if token not in reminder_helper:
        errors.append(f"vehicle-aware maintenance helper missing {token}")

for forbidden in [
    "next_reminder_at: profile?.maintenance_next_reminder_at",
    "profile?.maintenance_last_reminder_at || null",
]:
    if forbidden in reminder_helper:
        errors.append(f"customer-wide reminder authority still controls vehicle reminder state: {forbidden}")

for token in ["next_cleaning_due_at", "next_service_mileage_km", "service_interval_days", "auto_schedule_opt_in"]:
    if token not in vehicle_save:
        errors.append(f"customer vehicle write guard missing staff-owned planning field: {token}")

if not vehicle_test.exists():
    errors.append("missing scripts/vehicle_maintenance_rules_test.mjs")
else:
    proc = subprocess.run(
        ["node", str(vehicle_test)],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    if proc.returncode != 0:
        errors.append("vehicle-aware maintenance behavior test failed: " + (proc.stderr.strip() or proc.stdout.strip()))

if errors:
    print("Maintenance/retention authority: FAIL")
    for error in errors:
        print(" -", error)
    raise SystemExit(1)

print("Maintenance/retention authority: PASS")
print(" - public capture remains interest-only and non-billing")
print(" - API explicitly denies automatic enrollment, appointment creation and recurring billing")
print(" - maintenance eligibility, cadence, reminder history and rebooking are vehicle-aware")
print(" - staff-owned vehicle cadence/due controls remain protected from customer writes")
print(" - ambiguous vehicle history fails closed instead of blending household/fleet vehicles")
print(" - operating help and responsive admin presentation remain protected")
