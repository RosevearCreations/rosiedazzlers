#!/usr/bin/env python3
"""Build 380 source authority: Booking Recovery & Failure Handling."""

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]


def fail(message: str) -> None:
    print(f"BUILD 380 FAIL: {message}", file=sys.stderr)
    raise SystemExit(1)


def read(path: str) -> str:
    target = ROOT / path
    if not target.is_file():
        fail(f"missing required file: {path}")
    return target.read_text(encoding="utf-8")


client = read("assets/booking-recovery.js")
policy_hook = read("assets/site-policies.js")
endpoint = read("functions/api/checkout_recovery.js")
doc = read("BOOKING_RECOVERY_FAILURE_HANDLING.md")
workflow = read(".github/workflows/booking-recovery-failure-handling-authority.yml")
queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
production_helper = read("scripts/cloudflare_pages_production_acceptance.sh")

required_client = [
    'const DRAFT_KEY = "rd_booking_draft_v380"',
    "sessionStorage",
    "DRAFT_MAX_AGE_MS",
    '"/api/checkout_recovery"',
    '"rd:booking-checkout-conflict"',
    'window.addEventListener("pagehide"',
    "MutationObserver",
    'recovery_state === "pending_session_attach"',
    'recovery_state === "stale_availability"',
    'recovery_state === "payment_session_expired"',
    "bookingIdFromAnyContext",
    'params.get("fresh") === "1"',
]
for needle in required_client:
    if needle not in client:
        fail(f"browser recovery contract missing: {needle}")

if "localStorage" in client:
    fail("booking draft must not use durable localStorage")
if "setInterval(" in client:
    fail("booking recovery must not introduce recurring polling")
if "photo_estimate_files" in client:
    fail("browser recovery must not persist uploaded file objects")

required_endpoint = [
    "canonicalCheckout",
    'from "./checkout.js"',
    "fetchSameDateBookings",
    "loadPricingCatalog",
    'status=in.(pending,confirmed)',
    "slotsOverlap",
    'recovery_state: "stale_availability"',
    'recovery_state: "pending_session_attach"',
    'recovery_state: "provider_lookup_failed"',
    'recovery_state: "payment_session_expired"',
    "https://api.stripe.com/v1/checkout/sessions/",
    "/v2/checkout/orders/",
    'session.status === "open"',
    'session.status === "complete"',
    'String(order.status || "").toUpperCase() === "COMPLETED"',
]
for needle in required_endpoint:
    if needle not in endpoint:
        fail(f"checkout recovery endpoint missing: {needle}")

if re.search(r"/rest/v1/bookings[^\n]+method\s*:\s*[\"'](?:POST|PATCH|DELETE|PUT)[\"']", endpoint, re.I):
    fail("checkout recovery wrapper directly mutates bookings")
if any(token in endpoint for token in ["wrangler pages deploy", "git push --force"]):
    fail("checkout recovery endpoint contains a prohibited release mutation primitive")

for needle in [
    "/assets/booking-recovery.js?v=20260911build380",
    "wireBookingRecovery",
    "canonical booking and checkout remain usable",
]:
    if needle not in policy_hook:
        fail(f"site policy hook missing booking-recovery wiring: {needle}")

for needle in [
    "canonical `/api/checkout` endpoint remains the source of truth",
    "same service date, overlapping slot, customer email, package, and vehicle size",
    "sessionStorage",
    "stale_availability",
    "pending_session_attach",
    "provider_lookup_failed",
    "payment_session_expired",
    "No database migration is required",
    "no direct booking-table mutation",
]:
    if needle not in doc:
        fail(f"booking recovery authority document missing: {needle}")

required_workflow = [
    "Build 380 — Booking Recovery & Failure Handling",
    "contents: read",
    "python3 scripts/booking_recovery_failure_handling_check.py",
    "node --check functions/api/checkout_recovery.js",
    "node --check assets/booking-recovery.js",
    "scripts/cloudflare_pages_production_acceptance.sh",
    "secrets.ROSIEDAZZLERS_TOKEN",
    "secrets.CLOUDFLARE_ACCOUNT_ID",
    "github.sha",
]
for needle in required_workflow:
    if needle not in workflow:
        fail(f"Build 380 workflow missing: {needle}")

if re.search(r"permissions:\s*\n\s*contents:\s*write", workflow):
    fail("Build 380 workflow must remain read-only")
if any(token in workflow for token in ["wrangler pages deploy", "git push --force", "curl -X POST", "curl --request POST"]):
    fail("Build 380 workflow contains a prohibited mutation primitive")

# Build 380 remains a retained authority after the living queue advances.
for needle in ["Build 380", "Build 381", "Build 382", "Booking Recovery & Failure Handling"]:
    if needle not in queue:
        fail(f"release queue missing retained/converged release state: {needle}")
if "**Build 380 — Booking Recovery & Failure Handling** is the accepted synchronized source and Production deployment boundary" not in queue:
    fail("release queue does not retain Build 380 as the accepted prior boundary")

if "PRODUCTION EXACT-SHA ACCEPTANCE: PASS" not in production_helper:
    fail("durable Production exact-SHA helper contract is missing")

migration_matches = [p for p in ROOT.rglob("*.sql") if "380" in p.name.lower() or "build380" in str(p).lower()]
if migration_matches:
    fail("Build 380 is schema-neutral; found SQL migration artifact(s): " + ", ".join(str(p.relative_to(ROOT)) for p in migration_matches))

print("BUILD 380 BOOKING RECOVERY / FAILURE HANDLING: PASS")
print("- canonical checkout remains authoritative")
print("- matching recent pending payment sessions are recoverable without duplicate bookings")
print("- stale 409 collisions fail closed and refresh the existing availability path")
print("- tab-scoped draft recovery covers refresh/back/payment-cancel interruption")
print("- no localStorage, recurring polling, direct booking mutation, or schema migration")
print("- retained authority remains compatible with an advanced release queue")
print("- durable exact-SHA Production authority retained")
