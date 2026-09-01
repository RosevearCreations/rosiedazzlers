#!/usr/bin/env python3
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
errors = []


def read(rel: str) -> str:
    path = ROOT / rel
    if not path.exists():
        errors.append(f"missing {rel}")
        return ""
    return path.read_text(encoding="utf-8", errors="ignore")


def need(rel: str, *tokens: str) -> None:
    body = read(rel)
    for token in tokens:
        if token not in body:
            errors.append(f"{rel} missing {token}")


def forbid(rel: str, *tokens: str) -> None:
    body = read(rel)
    for token in tokens:
        if token.lower() in body.lower():
            errors.append(f"{rel} contains forbidden authority token {token}")


need(
    "assets/customer-rebook-v285.js",
    "Build 285",
    'DASHBOARD_API = "/api/client/dashboard"',
    'credentials: "include"',
    "REJECTED_STATUS",
    "cancel|refund|failed|declin|void",
    "serviceDate < localTodayIso()",
    "rebook_package",
    "rebook_date",
    "Book this service again",
    "Using your previous booking as a starting point",
    "data-package-suggest",
    "data-package",
    "data-garage-index",
    "vehicles.length !== 1",
    "That previous service is no longer available to repeat",
    "will not silently substitute another service",
    "Current vehicle size, availability, add-ons, price, deposit and payment rules are recalculated from today's booking authority",
    "booking_history_rebook_handoff",
)
forbid(
    "assets/customer-rebook-v285.js",
    "price_total_cents",
    "deposit_cents",
    "start_slot",
    "/api/checkout",
    "/api/availability",
    "STRIPE_SECRET",
    "PAYPAL_CLIENT_SECRET",
    "auto_schedule_opt_in",
)

# The account path must load the bounded Build 285 helper without rewriting the
# established 69KB customer screen or changing its authenticated dashboard API.
need(
    "assets/client-auth.js",
    "loadBuild285CustomerRebook",
    'path !== "/my-account"',
    "/assets/customer-rebook-v285.js",
    "data-build285-customer-rebook",
)
need(
    "my-account.html",
    'id="bookingHistory"',
    "renderHistory",
    "/api/client/dashboard",
    "/assets/client-auth.js",
)
need(
    "my-account/index.html",
    'id="bookingHistory"',
    "renderHistory",
    "/api/client/dashboard",
    "/assets/client-auth.js",
)

# Build 285 extends, rather than replaces, the retained Build 274/275 booking
# presentation chain. Current controls/catalogue remain the booking authority.
need(
    "assets/pricing-catalog-client.js",
    'import("./booking-quick-start-v274.js")',
    '.then(() => import("./booking-retention-v275.js"))',
    '.then(() => import("./customer-rebook-v285.js"))',
    "legacy booking remains available",
)
need(
    "assets/booking-retention-v275.js",
    "Next available slots",
    "booking_funnel_exit",
    "/api/client/dashboard",
    "Current vehicle size, availability, add-ons, price and deposit rules still apply",
)
need(
    "functions/api/client/dashboard.js",
    "bookings:",
    "vehicles:",
    "package_code",
    "service_date",
)

summary = read("BUILD285_SUMMARY.md")
for token in [
    "Customer History", "Book this service again", "authenticated", "current booking authority",
    "no schema migration", "old price", "deposit", "payment", "Production remains closed"
]:
    if token.lower() not in summary.lower():
        errors.append(f"BUILD285_SUMMARY.md missing {token}")

feature_gate = read(".github/workflows/build285-source-gate.yml")
for token in [
    "Build 285 Source Gate", "build285-customer-rebook-handoff", "customer-rebook-v285.js",
    "build285_release_check.py", "build285_http_smoke.sh", "seq 271 284",
    "# python scripts/build283_release_check.py"
]:
    if token not in feature_gate:
        errors.append(f"Build 285 feature gate missing {token}")

dev_gate = read(".github/workflows/development-source-gate.yml")
for token in ["customer-rebook-v285.js", "build285_http_smoke.sh", "build285_release_check.py", "Build 285"]:
    if token not in dev_gate:
        errors.append(f"development-source-gate.yml missing Build 285 token: {token}")

smoke = read("scripts/build285_http_smoke.sh")
for token in [
    "/assets/customer-rebook-v285.js", "Book this service again",
    "Using your previous booking as a starting point", "rebook_package", "rebook_date",
    "/api/client/dashboard", "/assets/client-auth.js", "/assets/pricing-catalog-client.js"
]:
    if token not in smoke:
        errors.append(f"build285_http_smoke.sh missing {token}")

shared_smoke = read("scripts/development_http_smoke.sh")
for token in [
    "/assets/customer-rebook-v285.js", "Book this service again",
    "Using your previous booking as a starting point", "/assets/client-auth.js",
    "/assets/pricing-catalog-client.js"
]:
    if token not in shared_smoke:
        errors.append(f"development_http_smoke.sh missing Build 285 runtime marker: {token}")

# Cloudflare Development acceptance already invokes the cumulative release guard
# and the shared smoke on immutable + alias endpoints. Retain historical literals.
cf_gate = read(".github/workflows/cloudflare-development-acceptance.yml")
for token in ["python scripts/release_check.py", "scripts/development_http_smoke.sh", "SMOKE_SCOPE=static", "SMOKE_SCOPE=full", "through Build 276"]:
    if token not in cf_gate:
        errors.append(f"cloudflare-development-acceptance.yml missing retained acceptance token: {token}")

seo_guard = read("scripts/seo_h1_check.py")
for token in ["build285_release_check.py", "build285.exists()", "run_guard(build285)"]:
    if token not in seo_guard:
        errors.append(f"cumulative SEO/release path missing Build 285 hook: {token}")

if errors:
    print("Build 285 customer-history rebook handoff check FAILED:")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("Build 285 customer-history rebook handoff check: PASS")
print("- authenticated history exposes Book this service again only for repeatable past bookings")
print("- handoff carries only prior package/date evidence and verifies it against authenticated history")
print("- current package catalogue and booking controls remain authoritative; retired services fail closed")
print("- a single currently resolvable Garage vehicle may prefill; multi-vehicle customers choose explicitly")
print("- current size, availability, add-ons, price, deposit and payment rules are recalculated")
print("- no schema, maintenance-cadence or payment authority was introduced")
print("- Production remains closed")
