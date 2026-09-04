#!/usr/bin/env python3
"""Fail-closed source authority for payment-provider readiness."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "admin-payment-readiness.html"
CLIENT = ROOT / "assets" / "admin-payment-readiness-v318.js"
API = ROOT / "functions" / "api" / "admin" / "payment_provider_readiness.js"
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
    "Payment Provider Readiness",
    "No secret values are displayed or returned.",
    "No automatic charge.",
    "No automatic checkout creation.",
    "No automatic customer notification.",
    "No recurring billing.",
    "PayPal show not integrated",
    "Operating Help",
    "@media(max-width:820px)",
    "/assets/admin-payment-readiness-v318.js",
], "payment readiness page")

client = require(CLIENT, [
    "/api/admin/payment_provider_readiness",
    'contract.read_only === true',
    'contract.secret_values_exposed === false',
    'contract.automatic_charge === false',
    'contract.automatic_checkout_creation === false',
    'contract.automatic_customer_notification === false',
    'contract.recurring_billing === false',
    'contract.operator_action_required === true',
], "payment readiness client")

api = require(API, [
    "read-only payment-provider readiness authority",
    'capability: "manage_bookings"',
    "STRIPE_SECRET_KEY",
    'startsWith("sk_test_")',
    'startsWith("sk_live_")',
    'provider: "paypal"',
    'integration_available: false',
    'status: "not_integrated_in_current_source"',
    'provider: "manual"',
    'secret_values_exposed: false',
    'automatic_charge: false',
    'automatic_checkout_creation: false',
    'automatic_customer_notification: false',
    'recurring_billing: false',
    'operator_action_required: true',
    "Payment-provider readiness is read-only.",
], "payment readiness API")

# Readiness must never contact or mutate payment providers.
get_match = re.search(r"export async function onRequestGet\([\s\S]*?\n}\n\nexport async function onRequestPost", api)
if not get_match:
    errors.append("could not isolate payment-provider readiness GET handler")
else:
    handler = get_match.group(0)
    for needle in ["api.stripe.com", "paypal.com", 'method: "POST"', "method:'POST'", "final_balance_checkout_create", "final_balance_request_create"]:
        if needle in handler:
            errors.append(f"readiness GET contains mutation/provider-contact path: {needle}")

# The browser client is read-only too.
for needle in ['method: "POST"', "final_balance_checkout_create", "final_balance_request_create", "notify_customer"]:
    if needle in client:
        errors.append(f"payment readiness client contains mutation path: {needle}")

# Do not serialize credential variables or suspicious secret fields.
for needle in ["secret_key:", "secret_value:", "client_secret:", "api_key:"]:
    if needle in api.lower():
        errors.append(f"payment readiness API may expose a secret field: {needle}")

# PayPal must remain explicitly not-integrated until source actually implements it.
if "PAYPAL_" in api:
    errors.append("Build 318 must not invent PayPal environment variables before a real integration exists")

# This build is source-only.
migrations = list(ROOT.glob("**/*318*.sql"))
if migrations:
    errors.append("Build 318 must not introduce a schema migration: " + ", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("PAYMENT PROVIDER READINESS: FAIL")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("PAYMENT PROVIDER READINESS: PASS")
print("- readiness GET and browser client are read-only")
print("- secret values are not exposed")
print("- Stripe test/live mode is classified by prefix only")
print("- live Stripe credentials block Development acceptance")
print("- PayPal is honestly reported as not integrated")
print("- manual fallback remains available")
print("- no automatic charge, checkout, notification or recurring billing")
print("- no Build 318 database migration is present")
