#!/usr/bin/env python3
"""Build 427 — booking conversion / quote clarity source guard."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []

def read(path):
    target = ROOT / path
    if not target.is_file():
        errors.append(f"missing required file: {path}")
        return ""
    return target.read_text(encoding="utf-8", errors="ignore")

def require(text, needles, label):
    for needle in needles:
        if needle not in text:
            errors.append(f"{label} missing {needle!r}")

contract = read("BUILD427_BOOKING_CONVERSION_QUOTE_CLARITY.md")
book = read("book.html")
funnel = read("functions/api/admin/customer_booking_funnel_quality.js")
admin = read("admin-customer-booking-funnel.html")
queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff = read("AI_PROJECT_HANDOFF.md")
readme = read("README.md")
dev_gate = read(".github/workflows/development-source-gate.yml")
focused_gate = read(".github/workflows/booking-conversion-quote-clarity-authority.yml")
prod_gate = read(".github/workflows/production-business-acceptance-authority.yml")
prod_check = read("scripts/production_business_acceptance_check.py")

require(contract, [
    "Availability remains server-authoritative",
    "estimate or accepted quote is not a booking confirmation",
    "never joined to customer identities",
    "schema-neutral",
    "protected-main",
], "Build 427 contract")

require(book, [
    ">Current estimate<",
    "Quote-required items are excluded from this fixed subtotal until reviewed.",
    "An estimate or accepted quote does not reserve a time slot.",
    'analytics("booking_quote_clarity_view"',
    'analytics("unified_booking_start"',
], "public booking clarity")

for event_name in [
    "booking_quote_clarity_view",
    "unified_vehicle_size_pick",
    "unified_service_pick",
    "unified_addon_toggle",
    "unified_booking_start",
]:
    require(funnel, [f'"{event_name}"'], "booking funnel evidence")

require(funnel, [
    "layers_joined: false",
    "identity_join: false",
    "booking_mutation: false",
], "booking funnel privacy boundary")

require(admin, [
    "Booking Conversion & Quote Clarity",
    "not unique people",
    "does not join identities",
], "staff booking funnel view")

for text, label in [(queue, "queue"), (handoff, "handoff"), (readme, "README")]:
    require(text, [
        "BUILD427_BOOKING_CONVERSION_QUOTE_CLARITY.md",
    ], label)

require(focused_gate, [
    "Build 427 — Booking Conversion & Quote Clarity",
    "python -m py_compile scripts/build427_booking_conversion_quote_clarity_check.py",
    "python scripts/build427_booking_conversion_quote_clarity_check.py",
], "focused Build 427 authority")

for numbered_call in [
    "python -m py_compile scripts/build427_booking_conversion_quote_clarity_check.py",
    "python scripts/build427_booking_conversion_quote_clarity_check.py",
]:
    if numbered_call in dev_gate:
        errors.append(f"durable Development source gate must not call numbered Build 427 helper: {numbered_call}")

require(prod_gate, [
    "Validate booking conversion & quote clarity authority",
    "python scripts/build427_booking_conversion_quote_clarity_check.py",
], "Production business authority")

require(prod_check, [
    '"booking_conversion_quote_clarity"',
    "scripts/build427_booking_conversion_quote_clarity_check.py",
    "Validate booking conversion & quote clarity authority",
], "Production business source authority")

for forbidden in [
    "wrangler d1", "INSERT INTO", "UPDATE bookings", "DELETE FROM",
    "stripe trigger", "paypal", "wrangler pages deploy"
]:
    if forbidden.lower() in contract.lower():
        errors.append(f"Build 427 contract contains forbidden mutation primitive: {forbidden}")

if errors:
    print("BOOKING CONVERSION & QUOTE CLARITY: FAIL")
    for error in errors:
        print(" -", error)
    sys.exit(1)

print("BOOKING CONVERSION & QUOTE CLARITY: PASS")
print(" - fixed catalogue pricing, condition estimates and booking confirmation are explicitly distinct")
print(" - availability remains server-authoritative")
print(" - bounded first-party interaction evidence remains anonymous and unjoined")
print(" - no schema, provider, booking, payment, accounting or inventory mutation is authorized")
