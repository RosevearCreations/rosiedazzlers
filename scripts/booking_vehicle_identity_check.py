#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
errors = []

def read(path):
    p = ROOT / path
    if not p.exists():
        errors.append(f"missing required file: {path}")
        return ""
    return p.read_text(encoding="utf-8", errors="ignore")

migration = read("sql/2026-09-04_build331_durable_booking_vehicle_identity.sql")
api = read("functions/api/admin/booking_vehicle_identity.js")
page = read("admin-booking-vehicle-identity.html")

for token in (
    "add column if not exists customer_vehicle_id uuid null",
    "foreign key (customer_vehicle_id)",
    "references public.customer_vehicles(id)",
    "on delete set null",
    "customer_vehicle_id is null or customer_profile_id is not null",
    "bookings_customer_vehicle_id_idx",
):
    if token.lower() not in migration.lower():
        errors.append(f"migration missing contract: {token}")

if re.search(r"update\s+public\.bookings\s+set\s+customer_vehicle_id", migration, re.I):
    errors.append("migration must not auto-backfill historical booking vehicle identity")

for token in (
    'capability: "manage_bookings"',
    'customer_vehicle_id',
    'Saved vehicle does not belong to the booking customer profile.',
    'Resolve the booking customer profile before linking a saved vehicle.',
    'automatic_backfill: false',
    'changes_booking_status: false',
    'changes_payment: false',
    'changes_schedule: false',
):
    if token not in api:
        errors.append(f"API missing contract: {token}")

for forbidden in ("stripe_session_id", "paypal_order_id", "price_total_cents"):
    if forbidden in api:
        errors.append(f"identity API contains forbidden payment/price field: {forbidden}")

patch_match = re.search(r"JSON\.stringify\(\{\s*customer_vehicle_id:\s*vehicleId\s*\}\)", api, re.S)
unlink_match = re.search(r"JSON\.stringify\(\{\s*customer_vehicle_id:\s*vehicleId\s*\}\)", api, re.S)
if not patch_match or not unlink_match:
    errors.append("booking PATCH body must remain customer_vehicle_id-only")

if page.lower().count("<h1") != 1:
    errors.append("admin identity workbench must have exactly one H1")
for token in ("noindex,nofollow", "Staff-confirmed only", "never auto-links historical rows", "does not alter service completion"):
    if token.lower() not in page.lower():
        errors.append(f"admin workbench missing safety/help contract: {token}")

proc = subprocess.run(["node", "--check", "functions/api/admin/booking_vehicle_identity.js"], cwd=ROOT, text=True, capture_output=True)
if proc.returncode:
    errors.append("JavaScript syntax failed: " + (proc.stdout + proc.stderr).strip())

if errors:
    print("BOOKING VEHICLE IDENTITY: FAIL")
    for err in errors:
        print(" -", err)
    raise SystemExit(1)

print("BOOKING VEHICLE IDENTITY: PASS")
print(" - schema is additive, nullable and foreign-keyed")
print(" - no historical auto-backfill is permitted")
print(" - staff linkage must remain within the booking customer profile")
print(" - booking status, schedule, price and payment remain out of scope")
