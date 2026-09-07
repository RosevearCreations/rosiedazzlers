#!/usr/bin/env python3
"""Fail-closed Build 361 source authority for Booking & Rebooking Funnel Analytics."""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
HELPER = ROOT / "functions" / "api" / "_lib" / "booking-rebooking-funnel.js"
API = ROOT / "functions" / "api" / "admin" / "booking_rebooking_funnel.js"
PAGE = ROOT / "admin-booking-rebooking-funnel.html"
TEST = ROOT / "scripts" / "booking_rebooking_funnel_test.mjs"
CONFIRM = ROOT / "booking-confirmed.html"
BOOKING_HOURS = ROOT / "assets" / "booking-hours.js"
CUSTOMER_REBOOK = ROOT / "assets" / "customer-rebook-v285.js"
INGEST = ROOT / "functions" / "api" / "analytics" / "ingest.js"
WORKFLOW = ROOT / ".github" / "workflows" / "development-source-gate.yml"
errors = []


def require(path, needles, label):
    if not path.exists():
        errors.append(f"missing {label}: {path.relative_to(ROOT)}")
        return ""
    text = path.read_text(encoding="utf-8")
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing required contract: {needle!r}")
    return text


helper = require(HELPER, [
    "Build 361",
    "deriveBookingRebookingFunnel",
    "deriveAnonymousBookingFunnel",
    "deriveAnonymousRebookingIntent",
    "deriveExactRepeatBookingOutcomes",
    "booking_step_view",
    "checkout_started",
    "checkout_completed",
    "booking_rebook_prompt_view",
    "booking_rebook_start",
    "booking_rebook_prefill_applied",
    "booking_history_rebook_handoff",
    "exact_customer_profile_id_only",
    "cross_layer_identity_join:false",
    "customer_identity_exposed:false",
], "Build 361 funnel helper")

api = require(API, [
    "build:361",
    "capability:'view_live_ops'",
    "site_activity_events?select=event_type,session_id,checkout_state,created_at,payload",
    "bookings?select=id,customer_profile_id,status,job_status,created_at,service_date,completed_at",
    "customer_profile_id=not.is.null",
    "read_only:true",
    "schema_change:false",
    "anonymous_session_aggregation:true",
    "exact_customer_profile_history:true",
    "cross_layer_identity_join:false",
    "customer_identity_exposed:false",
    "fuzzy_identity_merge:false",
    "inferred_outreach_consent:false",
    "persistent_customer_score:false",
    "automatic_notifications:false",
    "automatic_booking_creation:false",
    "automatic_payment_action:false",
    "background_polling:false",
    "Booking and rebooking funnel analytics is read-only.",
], "Build 361 admin API")

page = require(PAGE, [
    'data-build361="booking-rebooking-funnel-analytics"',
    "<h1>Booking &amp; rebooking funnel analytics</h1>",
    "/api/admin/booking_rebooking_funnel?days=",
    "Anonymous booking funnel",
    "Anonymous rebooking intent",
    "Exact repeat-booking outcomes",
    "never identity-joined",
    "cannot send messages, create bookings, change customer records or take payment actions",
], "Build 361 admin page")

require(TEST, [
    "deriveBookingRebookingFunnel",
    "cross_layer_identity_join,false",
    "exact_customer_profile_id_only",
    "GREEN: Build 361 booking and rebooking funnel executable contract passed.",
], "Build 361 executable contract")
require(CONFIRM, ["booking_rebook_prompt_view", "booking_rebook_start"], "retained booking confirmation telemetry")
require(BOOKING_HOURS, ["booking_rebook_prefill_applied", "booking_step_view", "checkout_started"], "retained booking funnel telemetry")
require(CUSTOMER_REBOOK, ["booking_history_rebook_handoff", "current_catalog_verified: true"], "retained authenticated rebook handoff")
require(INGEST, ["site_activity_events", "sanitizePayload", "Analytics always fails open"], "retained analytics ingestion")

for forbidden in ["fetch('/api/checkout'", 'fetch("/api/checkout"', "method:'POST'", 'method: "POST"', "method:'PATCH'", 'method: "PATCH"', "method:'DELETE'", 'method: "DELETE"']:
    if forbidden in page:
        errors.append(f"Build 361 admin page contains forbidden mutation primitive: {forbidden}")
for forbidden in ["email=", "phone=", "full_name=", "visitor_id", "ip_address", "user_agent"]:
    if forbidden in api:
        errors.append(f"Build 361 API requests or exposes forbidden identity/analytics field: {forbidden}")
if "setInterval(" in page:
    errors.append("Build 361 admin page contains forbidden background polling")
if "customer_profile_id" not in helper or "session_id" not in helper:
    errors.append("Build 361 helper is missing one of its intentionally separate evidence layers")
if "cross_layer_identity_join:false" not in helper:
    errors.append("Build 361 helper does not explicitly prohibit anonymous-to-customer identity joining")

for path in (HELPER, API, TEST):
    proc = subprocess.run(["node", "--check", str(path.relative_to(ROOT))], cwd=ROOT, text=True, capture_output=True)
    if proc.returncode:
        errors.append(f"JavaScript syntax failed for {path.relative_to(ROOT)}: " + (proc.stdout + proc.stderr).strip())

if TEST.exists():
    proc = subprocess.run(["node", str(TEST.relative_to(ROOT))], cwd=ROOT, text=True, capture_output=True)
    if proc.returncode:
        errors.append("Build 361 executable behavior proof failed: " + (proc.stdout + proc.stderr).strip())

require(WORKFLOW, [
    "functions/api/_lib/booking-rebooking-funnel.js",
    "functions/api/admin/booking_rebooking_funnel.js",
    "scripts/booking_rebooking_funnel_test.mjs",
    "scripts/booking_rebooking_funnel_check.py",
    "python scripts/booking_rebooking_funnel_check.py",
    "Booking/rebooking funnel analytics authority: PASS",
], "Current Source Gate Build 361 wiring")

if errors:
    print("RED: Build 361 booking/rebooking funnel source proof failed:")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)
print("GREEN: Build 361 booking/rebooking funnel focused source proof passed.")
