#!/usr/bin/env python3
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
API = ROOT / "functions/api/admin/fleet_account_operations.js"
UI = ROOT / "admin-fleet.html"
DOC = ROOT / "docs/FLEET_ACCOUNT_OPERATIONS.md"
MIGRATION = ROOT / "supabase/migrations/20260910171324_build373_fleet_account_operations.sql"

required = [API, UI, DOC, MIGRATION]
missing = [str(p.relative_to(ROOT)) for p in required if not p.exists()]
if missing:
    raise SystemExit("Build 373 missing required files: " + ", ".join(missing))

api = API.read_text(encoding="utf-8")
ui = UI.read_text(encoding="utf-8")
doc = DOC.read_text(encoding="utf-8")
sql = MIGRATION.read_text(encoding="utf-8")

for token in [
    'capability: "manage_bookings"',
    'create_account', 'add_contact', 'add_vehicle', 'create_request_group',
    'add_request_job', 'add_service_history',
    'creates_booking: false', 'mutates_booking: false', 'creates_invoice: false',
    'charges_customer: false', 'applies_fleet_pricing: false',
    'enables_recurring_billing: false', 'mutates_payment_provider: false',
    'invoice_group_reference_is_metadata_only: true', 'po_reference_is_metadata_only: true'
]:
    if token not in api:
        raise SystemExit(f"Build 373 API authority token missing: {token}")

for table in [
    "fleet_account_contacts", "fleet_account_vehicles", "fleet_request_groups",
    "fleet_request_jobs", "fleet_vehicle_service_history"
]:
    if f"create table if not exists public.{table}" not in sql.lower():
        raise SystemExit(f"Build 373 migration missing table: {table}")
    if f"alter table public.{table} enable row level security" not in sql.lower():
        raise SystemExit(f"Build 373 migration must enable RLS on {table}")
    if f"revoke all on table public.{table} from anon, authenticated" not in sql.lower():
        raise SystemExit(f"Build 373 migration must revoke direct client access on {table}")
    if f"grant select, insert, update, delete on table public.{table} to service_role" not in sql.lower():
        raise SystemExit(f"Build 373 migration must explicitly grant service-role access on {table}")

for forbidden in ["price_cents", "amount_cents", "discount_cents", "stripe_", "paypal_", "recurring_payment", "payment_intent"]:
    if forbidden in sql.lower():
        raise SystemExit(f"Build 373 migration must not add commercial/provider field: {forbidden}")

if re.search(r'fetch\([^\n]*?/rest/v1/bookings[^\n]*?\{[^}]*method:\s*["\'](?:POST|PATCH|DELETE)', api, re.I):
    raise SystemExit("Build 373 must not mutate canonical bookings")

if ui.lower().count("<h1") != 1:
    raise SystemExit("Build 373 Fleet Operations page must expose exactly one H1")
for token in ["Business contacts", "Vehicle roster", "Grouped requests / jobs", "PO / customer reference", "Invoice group reference", "Per-vehicle service history"]:
    if token not in ui:
        raise SystemExit(f"Build 373 UI missing roadmap capability: {token}")
for forbidden in ["checkout", "stripe", "paypal", "charge customer", "apply discount"]:
    if forbidden in ui.lower():
        raise SystemExit(f"Build 373 Fleet Operations UI crosses commercial boundary: {forbidden}")

for phrase in [
    "business contacts", "vehicle rosters", "per-vehicle service history",
    "grouped requests/jobs", "po/reference support", "invoice grouping",
    "does **not** create or mutate `bookings`", "metadata only"
]:
    if phrase.lower() not in doc.lower():
        raise SystemExit(f"Build 373 documentation missing authority phrase: {phrase}")

subprocess.run(["node", "--check", str(API)], cwd=ROOT, check=True)
print("BUILD 373 FLEET ACCOUNT OPERATIONS: PASS")
