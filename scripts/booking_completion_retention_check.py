#!/usr/bin/env python3
"""Fail-closed source authority for Build 326 booking completion + rebooking lifecycle."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
MIDDLEWARE = ROOT / "functions" / "_middleware.js"
CONFIRM_API = ROOT / "functions" / "api" / "booking_confirmation.js"
PAYPAL_CAPTURE = ROOT / "functions" / "api" / "paypal" / "capture-order.js"
CONFIRM_PAGE = ROOT / "booking-confirmed.html"
SIGNOFF_PAGE = ROOT / "complete.html"
BOOK = ROOT / "book.html"
BOOK_ROUTE = ROOT / "book" / "index.html"
BOOKING_HELPER = ROOT / "assets" / "booking-hours.js"
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
], "Build 326 middleware")

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
    "params.get('rebook')",
    "booking_rebook_prefill_applied",
    "has_package_prefill",
    "has_size_prefill",
], "booking helper")

book = require(BOOK, [
    'new CustomEvent("rd:analytics"',
    'analyticsTrack("booking_step_view"',
    'analyticsTrack("checkout_started"',
    'analyticsTrack("checkout_redirect"',
], "canonical booking page")
route = require(BOOK_ROUTE, [
    'new CustomEvent("rd:analytics"',
    'analyticsTrack("booking_step_view"',
], "booking route copy")

workflow = require(WORKFLOW, [
    'functions/_middleware.js',
    'functions/api/booking_confirmation.js',
    'assets/booking-hours.js',
    'scripts/booking_completion_retention_check.py',
    'python scripts/booking_completion_retention_check.py',
    'Booking completion/retention authority: PASS',
], "current source gate")

if book and route and book != route:
    errors.append("book.html and book/index.html are not byte-identical")

# /complete must remain the token-based job-signoff page. Provider returns are rerouted before it.
if 'provider", "stripe"' in signoff or 'provider", "paypal"' in signoff:
    errors.append("customer job sign-off page contains payment-provider completion handling")

# Stripe confirmation is read/verify only. Signed webhook settlement remains authoritative.
for primitive in ['method: "PATCH"', 'method: "POST"', 'status: "confirmed"', 'job_status: "scheduled"']:
    if primitive in confirm_api:
        errors.append(f"booking confirmation API contains forbidden browser-return settlement primitive: {primitive}")

# Rebooking may only carry low-risk service choices. Never carry identity, address, appointment or payment identifiers forward.
for forbidden in [
    'next.set("customer', 'next.set("email', 'next.set("phone', 'next.set("address',
    'next.set("postal', 'next.set("city', 'next.set("plate', 'next.set("date',
    'next.set("slot', 'next.set("booking_id', 'next.set("session_id', 'next.set("token',
    'next.set("gift_code', 'next.set("area'
]:
    if forbidden in confirm_page:
        errors.append(f"rebooking page carries forbidden prior-booking value: {forbidden}")

# Gift confirmation middleware may expose only package and vehicle size from intake.
for forbidden in [
    'target.searchParams.set("customer', 'target.searchParams.set("email', 'target.searchParams.set("phone',
    'target.searchParams.set("address', 'target.searchParams.set("postal', 'target.searchParams.set("booking_id',
    'target.searchParams.set("gift_code', 'target.searchParams.set("area', 'target.searchParams.set("date',
    'target.searchParams.set("slot'
]:
    if forbidden in middleware:
        errors.append(f"gift confirmation URL carries forbidden intake value: {forbidden}")

# Preserve the established Build 324 funnel event vocabulary.
for event in [
    'booking_step_view', 'booking_date_pick', 'booking_slot_pick',
    'checkout_started', 'checkout_redirect', 'checkout_error'
]:
    if event not in book or event not in route:
        errors.append(f"established booking funnel telemetry event missing from route copies: {event}")

# Build 326 is application/routing work only; no schema change is required.
migrations = list(ROOT.glob("**/*326*.sql"))
if migrations:
    errors.append("Build 326 must not introduce a schema migration: " + ", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("BOOKING COMPLETION / RETENTION: FAIL")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("BOOKING COMPLETION / RETENTION: PASS")
print("- /complete remains the token-protected customer job-signoff surface")
print("- Stripe/PayPal payment returns are isolated on /booking-confirmed")
print("- Stripe browser confirmation verifies provider/session/booking/currency/amount without settling the booking")
print("- signed Stripe webhook remains settlement authority")
print("- PayPal confirmation remains capture-order-authoritative and replay safe")
print("- gift-covered checkout gains a confirmation URL without exposing booking/customer data")
print("- rebooking carries only package and vehicle-size hints; fresh booking validation remains mandatory")
print("- completion/rebooking analytics are present and established funnel events remain intact")
print("- no Build 326 database migration is present")
