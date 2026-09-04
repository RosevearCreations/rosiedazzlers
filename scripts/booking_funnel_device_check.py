#!/usr/bin/env python3
"""Fail-closed source authority for Build 324 booking funnel/device analytics."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "admin-booking-funnel.html"
CLIENT = ROOT / "assets" / "admin-booking-funnel-v324.js"
API = ROOT / "functions" / "api" / "admin" / "booking_funnel_device.js"
INGEST = ROOT / "functions" / "api" / "analytics" / "ingest.js"
WORKFLOW = ROOT / ".github" / "workflows" / "development-source-gate.yml"
errors = []


def require(path: Path, needles, label):
    if not path.exists():
        errors.append(f"missing {label}: {path.relative_to(ROOT)}")
        return ""
    text = path.read_text(encoding="utf-8")
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing required contract: {needle!r}")
    return text

page = require(PAGE, [
    "Booking Funnel Analytics",
    "Unique-session conversion",
    "No customer identity or raw session IDs are returned",
    "No background polling",
    "Date + vehicle",
    "Package",
    "Add-ons",
    "Customer details",
    "Deposit / payment",
    "Operating Help",
    "@media(max-width:820px)",
    "@media(max-width:600px)",
    "@media(max-width:480px)",
    "min-height:44px",
    "/assets/admin-booking-funnel-v324.js",
], "booking funnel page")

client = require(CLIENT, [
    "/api/admin/booking_funnel_device?days=",
    'method: "GET"',
    "c.read_only === true",
    "c.unique_session_aggregation === true",
    "c.background_polling === false",
    "c.customer_identity_exposed === false",
    "c.analytics_mutation === false",
    "c.booking_mutation === false",
    "mobile_underperforming",
    "within_five_points",
], "booking funnel client")

api = require(API, [
    'capability: "manage_staff"',
    "MAX_DAYS = 30",
    "MAX_ROWS = 2500",
    '"mobile", "tablet", "desktop", "unknown"',
    'event_type === "booking_step_view"',
    'event_type === "checkout_started"',
    'event_type === "checkout_completed"',
    "new Set()",
    "start_to_completion_pct",
    "mobile_vs_desktop_completion_gap_points",
    'interpretation: gap == null ? "insufficient_evidence"',
    "truncated: data.length >= MAX_ROWS",
    "read_only: true",
    "unique_session_aggregation: true",
    "background_polling: false",
    "customer_identity_exposed: false",
    "analytics_mutation: false",
    "booking_mutation: false",
    "Booking funnel device analytics is read-only in Build 324.",
], "booking funnel API")

ingest = require(INGEST, [
    "device_type: classifyDeviceType(userAgent)",
    "return 'mobile'",
    "return 'tablet'",
    "return 'desktop'",
], "analytics ingestion")

workflow = require(WORKFLOW, [
    "assets/admin-booking-funnel-v324.js",
    "functions/api/admin/booking_funnel_device.js",
    "scripts/booking_funnel_device_check.py",
    "python scripts/booking_funnel_device_check.py",
    "Booking funnel/device authority: PASS",
], "current source gate")

# Browser and API are read-only for this Build.
for needle in ['method: "POST"', 'method:"POST"', 'method: "PATCH"', 'method:"PATCH"', 'method: "DELETE"', 'method:"DELETE"', "setInterval("]:
    if needle in client:
        errors.append(f"booking funnel client contains mutation/polling primitive: {needle}")

get_match = re.search(r"export async function onRequestGet\([\s\S]*?\n}\n\nexport async function onRequestPost", api)
if not get_match:
    errors.append("could not isolate booking funnel GET handler")
else:
    handler = get_match.group(0)
    for needle in ['method: "POST"', 'method:"POST"', 'method: "PATCH"', 'method:"PATCH"', 'method: "DELETE"', 'method:"DELETE"']:
        if needle in handler:
            errors.append(f"booking funnel GET contains mutation request: {needle}")

# Only aggregate counts/rates may leave the API; never serialize raw sessions or PII.
for needle in ["session_id:", "visitor_id:", "email:", "customer_name:", "phone:", "ip_address:"]:
    if needle in api:
        errors.append(f"booking funnel API may expose raw identity field: {needle}")

# Raw-event analysis must remain bounded to protect CPU/resource usage.
if "Math.min(MAX_DAYS" not in api or "limit=${MAX_ROWS}" not in api:
    errors.append("booking funnel raw-event query is not visibly bounded")
if "data.length >= MAX_ROWS" not in api:
    errors.append("booking funnel does not report row-limit truncation")

# Build is source-only.
migrations = list(ROOT.glob("**/*324*.sql"))
if migrations:
    errors.append("Build 324 must not introduce a schema migration: " + ", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("BOOKING FUNNEL / DEVICE ANALYTICS: FAIL")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("BOOKING FUNNEL / DEVICE ANALYTICS: PASS")
print("- existing analytics device classification is reused")
print("- booking stages are aggregated by unique session")
print("- mobile/tablet/desktop conversion and checkout abandonment are separated")
print("- no raw session/customer identity is returned to the browser")
print("- analytics is read-only and has no background polling")
print("- raw-event window and row count are CPU bounded")
print("- mobile/tablet/desktop UI is protected")
print("- no Build 324 database migration is present")
