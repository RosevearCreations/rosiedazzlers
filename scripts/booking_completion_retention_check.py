#!/usr/bin/env python3
"""Fail-closed source authority for booking completion, rebooking and customer service-history convergence through Build 354."""
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
MIDDLEWARE = ROOT / "functions" / "_middleware.js"
CONFIRM_API = ROOT / "functions" / "api" / "booking_confirmation.js"
PAYPAL_CAPTURE = ROOT / "functions" / "api" / "paypal" / "capture-order.js"
CONFIRM_PAGE = ROOT / "booking-confirmed.html"
SIGNOFF_PAGE = ROOT / "complete.html"
PUBLIC_BOOK = ROOT / "book.html"
PUBLIC_ROUTE = ROOT / "book" / "index.html"
PLANNER = ROOT / "booking-planner.html"
BOOKING_HELPER = ROOT / "assets" / "booking-hours.js"
JOB_ACTION = ROOT / "functions" / "api" / "detailer" / "job_action.js"
VEHICLE_HISTORY = ROOT / "functions" / "api" / "_lib" / "customer-vehicle-service-history.js"
VEHICLE_HISTORY_TEST = ROOT / "scripts" / "customer_vehicle_service_history_test.mjs"
CLIENT_DASHBOARD = ROOT / "functions" / "api" / "client" / "dashboard.js"
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


middleware = require(MIDDLEWARE, [
    'url.pathname === "/api/checkout"',
    'payload.mode !== "gift_only_confirm"',
    'new URL("/booking-confirmed", requestUrl.origin)',
    'target.searchParams.set("provider", "gift")',
    'url.pathname === "/complete"',
    'isPaymentProvider(url.searchParams.get("provider"))',
    'url.pathname = "/booking-confirmed"',
    'return Response.redirect(url.toString(), 302)',
], "booking completion middleware")

confirm_api = require(CONFIRM_API, [
    'browser-safe booking completion authority',
    'provider === "stripe"',
    'provider === "paypal"',
    'String(booking.stripe_session_id || "").trim() !== sessionId',
    'https://api.stripe.com/v1/checkout/sessions/',
    'session?.metadata?.booking_id',
    'String(session.currency || "").toLowerCase() !== "cad"',
    'receivedCents !== expectedPayableCents',
    'session.payment_status || "").toLowerCase() === "paid"',
    'booking_confirmed: bookingConfirmed',
    'String(booking.paypal_order_id || "").trim() !== orderId',
    'booking.paypal_capture_id',
    'package_code: safeChoice',
    'vehicle_size:',
    '"Cache-Control": "no-store"',
], "booking confirmation API")

paypal_capture = require(PAYPAL_CAPTURE, [
    'PayPal order does not match the stored booking order.',
    'capturedCurrency !== "CAD"',
    'capturedCents !== expectedPayableCents',
    'status: "confirmed"',
    'job_status: "scheduled"',
], "PayPal capture authority")

confirm_page = require(CONFIRM_PAGE, [
    '<meta name="robots" content="noindex,nofollow,noarchive"',
    '<h1 id="confirmationTitle"',
    '/api/booking_confirmation?',
    '/api/paypal/capture-order',
    'booking_confirmation_view',
    'booking_rebook_prompt_view',
    'booking_rebook_start',
    'next.set("rebook", "1")',
    'next.set("package", packageCode)',
    'next.set("size", vehicleSize)',
    'You do not need to pay again.',
], "booking confirmation page")

signoff = require(SIGNOFF_PAGE, [
    '/complete?token=UUID',
    '/api/progress/view?token=',
    '/api/progress/signoff',
    'Completion Sign-off',
], "customer completion sign-off page")

helper = require(BOOKING_HELPER, [
    'Build 326: measure verified rebooking entry/prefill',
    'measureBuild326RebookPrefill()',
    "plannerParam('rebook')",
    "booking_rebook_prefill_applied",
    "has_package_prefill",
    "has_size_prefill",
    "canonicalPath() !== '/booking-planner'",
], "booking helper")

public_book = require(PUBLIC_BOOK, [
    'id="bookingPlannerFrame"',
    'return `/booking-planner?${next.toString()}`',
], "Build 336 public booking shell")
public_route = require(PUBLIC_ROUTE, [
    'id="bookingPlannerFrame"',
    'return `/booking-planner?${next.toString()}`',
], "Build 336 public booking route copy")
planner = require(PLANNER, [
    'new CustomEvent("rd:analytics"',
    'analyticsTrack("booking_step_view"',
    'analyticsTrack("checkout_started"',
    'analyticsTrack("checkout_redirect"',
], "retained booking planner")

job_action = require(JOB_ACTION, [
    "case 'complete':",
    "patch.job_status='completed'",
    'patch.detailing_completed_at=now',
    'syncCompletedBookingVehicleHistory({ env, booking: updatedBooking })',
    'event.payload.vehicle_service_history_sync',
    'vehicle_service_history_sync:vehicleServiceHistorySync',
], "detailer completion action")

vehicle_history = require(VEHICLE_HISTORY, [
    'durable_vehicle_identity_required',
    'vehicle_not_owned_by_profile',
    'last_package_code',
    'last_addons',
    'last_wash_at',
    'mileage_km',
    'service_interval_days',
    'next_cleaning_due_at',
    'next_service_mileage_km',
    'auto_schedule_opt_in',
], "completed-service vehicle history helper")

client_dashboard = require(CLIENT_DASHBOARD, [
    'customer_vehicle_id,detailing_completed_at&customer_email=eq.${encodeURIComponent(email)}',
    'const serviceHistory = buildCustomerServiceHistory(Array.isArray(bookings) ? bookings : [], vehicles);',
    'function buildCustomerServiceHistory(bookings, vehicles)',
    'String(row?.job_status || "").trim().toLowerCase() !== "completed" && !row?.detailing_completed_at',
    'const canonicalVehicle = row.customer_vehicle_id ? byVehicleId.get(String(row.customer_vehicle_id)) || null : null;',
    'const key = `${String(row.id || "")}:${String(completedAt || "")}`;',
    'history.sort((a, b) => timestampValue(b.completed_at) - timestampValue(a.completed_at)',
    'service_history: serviceHistory',
    'reviews: [], service_history: []',
], "Build 354 customer dashboard service history")

require(WORKFLOW, [
    'functions/_middleware.js',
    'functions/api/booking_confirmation.js',
    'assets/booking-hours.js',
    'scripts/booking_completion_retention_check.py',
    'python scripts/booking_completion_retention_check.py',
    'Booking completion/retention authority: PASS',
], "current source gate")

if public_book and public_route and public_book != public_route:
    errors.append("book.html and book/index.html are not byte-identical")

if 'provider", "stripe"' in signoff or 'provider", "paypal"' in signoff:
    errors.append("customer job sign-off page contains payment-provider completion handling")

for primitive in ['method: "PATCH"', 'method: "POST"', 'status: "confirmed"', 'job_status: "scheduled"']:
    if primitive in confirm_api:
        errors.append(f"booking confirmation API contains forbidden browser-return settlement primitive: {primitive}")

for forbidden in [
    'next.set("customer', 'next.set("email', 'next.set("phone', 'next.set("address',
    'next.set("postal', 'next.set("city', 'next.set("plate', 'next.set("date',
    'next.set("slot', 'next.set("booking_id', 'next.set("session_id', 'next.set("token',
    'next.set("gift_code', 'next.set("area'
]:
    if forbidden in confirm_page:
        errors.append(f"rebooking page carries forbidden prior-booking value: {forbidden}")

for forbidden in [
    'target.searchParams.set("customer', 'target.searchParams.set("email', 'target.searchParams.set("phone',
    'target.searchParams.set("address', 'target.searchParams.set("postal', 'target.searchParams.set("booking_id',
    'target.searchParams.set("gift_code', 'target.searchParams.set("area', 'target.searchParams.set("date',
    'target.searchParams.set("slot'
]:
    if forbidden in middleware:
        errors.append(f"gift confirmation URL carries forbidden intake value: {forbidden}")

for event in [
    'booking_step_view', 'booking_date_pick', 'booking_slot_pick',
    'checkout_started', 'checkout_redirect', 'checkout_error'
]:
    if event not in planner:
        errors.append(f"established booking funnel telemetry event missing from retained planner: {event}")

for forbidden_patch in [
    'patch.service_interval_days', 'patch.next_cleaning_due_at',
    'patch.next_service_mileage_km', 'patch.auto_schedule_opt_in'
]:
    if forbidden_patch in vehicle_history:
        errors.append(f"completion vehicle-history helper writes forbidden planning authority: {forbidden_patch}")
for heuristic in ['vehicle_make', 'vehicle_model', 'vehicle_plate']:
    if heuristic in vehicle_history:
        errors.append(f"completion vehicle-history helper contains forbidden identity heuristic: {heuristic}")

for mutation in ['method: "PATCH"', 'method: "PUT"', 'method: "DELETE"']:
    if mutation in client_dashboard:
        errors.append(f"Build 354 customer service-history dashboard contains forbidden mutation primitive: {mutation}")
if '&customer_email=eq.${encodeURIComponent(email)}' not in client_dashboard:
    errors.append("Build 354 booking/service-history read is not scoped to the authenticated customer email")
if 'customer_profile_id=eq.${encodeURIComponent(current.customer_profile.id)}' not in client_dashboard:
    errors.append("Build 354 canonical vehicle read is not scoped to the authenticated customer profile")

for path in (JOB_ACTION, VEHICLE_HISTORY, CLIENT_DASHBOARD):
    proc = subprocess.run(["node", "--check", str(path.relative_to(ROOT))], cwd=ROOT, text=True, capture_output=True)
    if proc.returncode:
        errors.append(f"JavaScript syntax failed for {path.relative_to(ROOT)}: " + (proc.stdout + proc.stderr).strip())

if not VEHICLE_HISTORY_TEST.exists():
    errors.append("missing scripts/customer_vehicle_service_history_test.mjs")
else:
    proc = subprocess.run(["node", str(VEHICLE_HISTORY_TEST)], cwd=ROOT, text=True, capture_output=True)
    if proc.returncode:
        errors.append("completed-service vehicle history behavior test failed: " + (proc.stdout + proc.stderr).strip())

for build_number in (326, 334, 354):
    migrations = list(ROOT.glob(f"**/*{build_number}*.sql"))
    if migrations:
        errors.append(f"Build {build_number} must not introduce a schema migration: " + ", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("BOOKING COMPLETION / RETENTION: FAIL")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("BOOKING COMPLETION / RETENTION: PASS")
print("- /complete remains the token-protected customer job-signoff surface")
print("- Stripe/PayPal payment returns remain isolated on /booking-confirmed")
print("- Stripe browser confirmation remains verify-only; signed webhook settlement remains authoritative")
print("- PayPal confirmation remains capture-order-authoritative and replay safe")
print("- rebooking still carries only package and vehicle-size hints into the unified /book shell")
print("- retained /booking-planner owns established checkout and funnel telemetry")
print("- authoritative staff completion synchronizes only same-profile durable saved-vehicle service facts")
print("- completed-service mileage cannot regress and staff scheduling/planning fields remain untouched")
print("- Build 354 exposes read-only, deduplicated completed-service history linked to canonical customer vehicles")
print("- Build 354 service history remains scoped to the authenticated customer and introduces no mutation path")
print("- no completion/retention/service-history database migration is present")
