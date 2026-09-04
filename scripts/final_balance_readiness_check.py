#!/usr/bin/env python3
"""Build 317 fail-closed source authority for final-balance readiness."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "admin-final-balance.html"
CLIENT = ROOT / "assets" / "admin-final-balance-v317.js"
API = ROOT / "functions" / "api" / "admin" / "final_balance_readiness.js"

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
    "Final Balance Readiness",
    "No automatic charge.",
    "No automatic final-balance request.",
    "No recurring billing.",
    "authorized operator must explicitly create a request",
    "Ready",
    "Blocked",
    "Requested",
    "Paid / Closed",
    "Operating Help",
    "@media(max-width:820px)",
    "/assets/admin-final-balance-v317.js",
], "admin final-balance page")

client = require(CLIENT, [
    "/api/admin/final_balance_readiness?limit=200",
    "/api/admin/final_balance_request_create",
    "/api/admin/final_balance_checkout_create",
    "notify_customer: false",
    "window.confirm",
    "row.readiness !== \"ready\"",
    "row.readiness !== \"requested\"",
    "automatic_charge === false",
    "automatic_final_balance_request === false",
    "recurring_billing === false",
    "operator_action_required === true",
], "admin final-balance client")

api = require(API, [
    "read-only final-balance readiness authority",
    'capability: "manage_bookings"',
    "automatic_charge: false",
    "automatic_final_balance_request: false",
    "recurring_billing: false",
    "operator_action_required: true",
    'readiness = "ready"',
    'readiness = "blocked"',
    'readiness = "requested"',
    'readiness = "paid"',
    "totalCents - depositCents - finalPaymentCents - discountCents - otherCents + refundCents",
    "tip_cents: cents(finance.tip)",
    "Readiness is read-only.",
], "final-balance readiness API")

# Fail closed: the GET readiness handler must not call mutation payment APIs or Stripe.
get_match = re.search(r"export async function onRequestGet\([\s\S]*?\n}\n\nexport async function onRequestPost", api)
if not get_match:
    errors.append("could not isolate readiness GET handler")
else:
    get_handler = get_match.group(0)
    forbidden = [
        "final_balance_request_create",
        "final_balance_checkout_create",
        "api.stripe.com",
        "queueCustomerLiveAlert",
        'method: "POST"',
        "method:'POST'",
    ]
    for needle in forbidden:
        if needle in get_handler:
            errors.append(f"readiness GET handler contains mutation path: {needle}")

# The client may mutate only from named, confirmation-gated operator actions.
if client:
    request_pos = client.find('apiJson("/api/admin/final_balance_request_create"')
    checkout_pos = client.find('apiJson("/api/admin/final_balance_checkout_create"')
    confirm_request = client.find('window.confirm(`Create a tracked final-balance request')
    confirm_checkout = client.find('window.confirm("Create or refresh the hosted checkout')
    if min(request_pos, checkout_pos, confirm_request, confirm_checkout) < 0:
        errors.append("explicit confirmation-gated mutation flow is incomplete")
    if request_pos >= 0 and confirm_request >= request_pos:
        errors.append("final-balance request mutation is not preceded by explicit confirmation")
    if checkout_pos >= 0 and confirm_checkout >= checkout_pos:
        errors.append("hosted checkout mutation is not preceded by explicit confirmation")
    if "notify_customer: true" in client:
        errors.append("Build 317 client must not automatically notify customers")

# Build 317 is source-only and must not introduce a database migration.
new_migration_candidates = list(ROOT.glob("**/*317*.sql"))
if new_migration_candidates:
    errors.append("Build 317 must not introduce a schema migration: " + ", ".join(str(p.relative_to(ROOT)) for p in new_migration_candidates))

if errors:
    print("BUILD 317 FINAL-BALANCE READINESS: FAIL")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("BUILD 317 FINAL-BALANCE READINESS: PASS")
print("- readiness GET is read-only and fail-closed")
print("- automatic charge/request/recurring billing are prohibited")
print("- request and checkout mutations require explicit operator confirmation")
print("- customer notification remains explicit and disabled in the cockpit")
print("- service-balance formula excludes tips")
print("- responsive UI and Operating Help are present")
print("- no Build 317 database migration is present")
