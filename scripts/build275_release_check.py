#!/usr/bin/env python3
from pathlib import Path
import re
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


def one_h1(rel, body=None):
    body = text(rel) if body is None else body
    if not body:
        return
    count = len(re.findall(r"<h1(?:\s[^>]*)?>", body, flags=re.I))
    if count != 1:
        errors.append(f"{rel} expected exactly one H1, found {count}")


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

# Funnel evidence uses the existing bounded public analytics client. It records
# a one-shot booking-specific pagehide exit, not a speculative abandonment.
# Legitimate outbound checkout redirects and bfcache transitions are excluded.
need(
    "assets/booking-retention-v275.js",
    "booking_funnel_exit",
    'exit_reason: "pagehide"',
    'window.addEventListener("pagehide"',
    "event.persisted === true",
    "funnel.exitEmitted",
    "funnel.checkoutRedirected",
    'eventName === "checkout_redirect"',
    'eventName === "checkout_error"',
    "RosieAnalytics?.track",
    "RosieAnalytics?.flush",
    "keepalive: true",
    "has_service_area",
    "has_date",
    "has_slot",
    "has_vehicle",
    "has_vehicle_size",
    "has_package",
    "addon_count",
    "checkout_started",
)
forbid(
    "assets/booking-retention-v275.js",
    "visibilitychange",
    "/api/analytics/ingest",
    "customer_email",
    "customer_phone",
    "address_line1",
    "customer_name",
)

# Existing analytics transport and ingest remain bounded/fail-open authorities.
need(
    "assets/public-analytics.js",
    "MAX_QUEUE = 8",
    "MAX_BATCH = 12",
    "keepalive",
    "Telemetry is expendable",
    "globalScope.RosieAnalytics",
)
need(
    "functions/api/analytics/ingest.js",
    "MAX_EVENTS_PER_REQUEST = 12",
    "MAX_BODY_BYTES = 64 * 1024",
    "site_activity_events",
)

need(
    "assets/pricing-catalog-client.js",
    'import("./booking-quick-start-v274.js")',
    'import("./booking-retention-v275.js")',
    "legacy booking remains available",
)
need("book.html", 'id="ack_power_water"', 'id="need_mobile_water_power"')
forbid(
    "assets/booking-quick-start-v274.js",
    "/api/checkout",
    "STRIPE_SECRET_KEY",
    "PAYPAL_CLIENT_SECRET",
)

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
need(
    "functions/api/client/dashboard.js",
    "bookings:",
    "vehicles:",
    "package_code",
    "vehicle_size",
    "service_date",
)

# Public add-on route integrity: services.html is the actual source of the
# links customers receive. Every published add-on detail route must resolve to
# a crawlable landing page with one H1 and matching canonical/landing slug.
services_body = text("services.html")
route_map = re.search(r"const\s+ADDON_DETAIL_SLUGS\s*=\s*\{([^}]+)\};", services_body)
if not route_map:
    errors.append("services.html missing parseable ADDON_DETAIL_SLUGS map")
else:
    published_slugs = sorted(set(re.findall(r":'([^']+)'", route_map.group(1))))
    if len(published_slugs) < 20:
        errors.append(f"services.html published add-on route map unexpectedly small: {len(published_slugs)}")
    for slug in published_slugs:
        rel = f"{slug}/index.html"
        body = text(rel)
        if not body:
            continue
        one_h1(rel, body)
        if f'href="https://rosiedazzlers.ca/{slug}"' not in body:
            errors.append(f"{rel} missing matching canonical route")
        if f'data-landing-slug="{slug}"' not in body:
            errors.append(f"{rel} missing matching landing slug")

# Fleet utility authority must agree with the standard self-contained mobile
# operating model in both visible copy and FAQ structured data.
one_h1("fleet/index.html")
need(
    "fleet/index.html",
    "Rosie brings standard detailing water and power",
    "parking/work-area access",
    "unusual site restrictions are reviewed before dispatch",
)
forbid(
    "fleet/index.html",
    "water/power availability",
    "whether water/power are available",
    "water and power access",
)

# Development acceptance must prove the exact promoted Build 275 module rather
# than silently stopping at the prior Build 274 boundary.
need(
    ".github/workflows/cloudflare-development-acceptance.yml",
    "Run Build 275 focused guard",
    "python scripts/build275_release_check.py",
    "/assets/booking-retention-v275.js",
    "Next available slots",
    "booking_funnel_exit",
    "through Build 275",
)

need(
    "BUILD275_SUMMARY.md",
    "**Status: ACTIVE — Development-first**",
    "Rosie-supplied utilities",
    "true next-three available slots",
    "returning-customer short rebook",
    "funnel exit evidence",
    "Development acceptance boundary",
    "published add-on route integrity",
    "fleet utility authority",
    "No Production/main mutation",
)

if errors:
    print("Build 275 focused release checks FAILED:")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("Build 275 focused release checks passed.")
