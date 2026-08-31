#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
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


def forbid(rel, *tokens):
    body = text(rel)
    for token in tokens:
        if token in body:
            errors.append(f"{rel} contains forbidden token {token}")


# Build 275 starts by making Rosie-supplied utilities an automatic operating
# authority rather than a customer acknowledgement or quote condition. The
# legacy DOM hooks remain only while retained Build 274 checks depend on them.
need(
    "assets/booking-quick-start-v274.js",
    "Build 275 retains this layer",
    "build275UtilityAuthority",
    "build275AutoAuthority",
    "ack.checked = true",
    "ack.required = false",
    "ackLabel.hidden = true",
    "build275CompatibilityOnly",
    "legacyQuote.checked = false",
    "Rosie-supplied water/power",
    "Rosie brings standard detailing water and power",
    "Customer provides water and power",
    "Quote staff-supplied water/power setup",
    "normalizeUtilityReviewCopy",
    "installUtilityReviewGuard",
    "MutationObserver",
    "Next available days",
    "Saved Garage vehicles",
)

# Build 275 slot shortcuts must be projections of the existing canonical
# calendar/date-pill + slot controls. They may not create a parallel API or
# their own availability truth.
need(
    "assets/booking-retention-v275.js",
    "canonical date pills",
    "Next available slots",
    "data-date-pill",
    "AM open",
    "PM open",
    "data-slot",
    "qbSlot",
    "booking_quick_slot_shortcut",
    "Choose another date / full day",
    "Confirm hose/power availability",
    "Rosie brings standard detailing water and power",
)
forbid(
    "assets/booking-retention-v275.js",
    "/api/availability",
    "/api/checkout",
    "STRIPE_SECRET_KEY",
    "PAYPAL_CLIENT_SECRET",
)

# Returning-customer acceleration must reuse authenticated dashboard history,
# prior package selection and existing Garage controls. It is a prefill/review
# path only and cannot auto-book or infer which of multiple vehicles is correct.
need(
    "assets/booking-retention-v275.js",
    "/api/client/dashboard",
    'credentials: "include"',
    "pastRepeatableBooking",
    "serviceDate < todayIso",
    "cancel|refund|failed|declin|void",
    "data-garage-index",
    "vehicleCount === 1",
    "Reuse this service",
    "Current vehicle size, availability, add-ons, price and deposit rules still apply",
    "booking_returning_rebook_prefill",
    "Optional returning-customer acceleration must never block anonymous booking",
)

need(
    "assets/pricing-catalog-client.js",
    'import("./booking-quick-start-v274.js")',
    'import("./booking-retention-v275.js")',
    "legacy booking remains available",
)

# Retained Build 274 compatibility hooks may still exist in source, but they
# must not become a new customer-facing authority or payment dependency.
need("book.html", 'id="ack_power_water"', 'id="need_mobile_water_power"')
forbid(
    "assets/booking-quick-start-v274.js",
    "/api/checkout",
    "STRIPE_SECRET_KEY",
    "PAYPAL_CLIENT_SECRET",
)

# vPIC remains optional enrichment. A vendor denial/network failure may reduce
# suggestions but must never make booking bootstrap return 5xx.
need(
    "functions/api/vehicle_makes.js",
    "fallbackVehicleMakes",
    "degraded: true",
    "type your vehicle make manually",
)
need(
    "functions/api/vehicle_models.js",
    "models: []",
    "degraded: true",
    "type the model manually",
)

# Dashboard data needed by short rebook must remain available from the existing
# authenticated client authority rather than a new customer-history endpoint.
need(
    "functions/api/client/dashboard.js",
    "bookings:",
    "vehicles:",
    "package_code",
    "vehicle_size",
    "service_date",
)

# Build authority must state what is actually closed and what remains queued.
need(
    "BUILD275_SUMMARY.md",
    "**Status: ACTIVE — Development-first**",
    "Rosie-supplied utilities",
    "true next-three available slots",
    "returning-customer short rebook",
    "funnel instrumentation",
    "No Production/main mutation",
)

if errors:
    print("Build 275 focused release checks FAILED:")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("Build 275 focused release checks passed.")
