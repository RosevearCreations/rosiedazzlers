#!/usr/bin/env python3
"""Fail-closed source authority for Build 321 payment reconciliation evidence."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "admin-payment-reconciliation.html"
CLIENT = ROOT / "assets" / "admin-payment-reconciliation-v321.js"
API = ROOT / "functions" / "api" / "admin" / "payment_reconciliation_readiness.js"
FINANCE_API = ROOT / "functions" / "api" / "admin" / "booking_finance.js"
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


page = require(PAGE, [
    "Payment Reconciliation",
    "Fail-closed reconciliation contract",
    "No charge, checkout creation, finance write, customer notification or recurring billing.",
    "Webhook verification is not asserted.",
    "no database-enforced provider idempotency key",
    "Stripe ↔ local reconciliation queue",
    "Operating Help",
    "@media(max-width:820px)",
    "@media(max-width:600px)",
    "@media(max-width:480px)",
    "min-height:44px",
    "/assets/admin-payment-reconciliation-v321.js",
], "payment reconciliation page")

client = require(CLIENT, [
    "/api/admin/payment_reconciliation_readiness?limit=25",
    'method:"GET"',
    "contract?.read_only === true",
    "contract?.provider_contact_read_only === true",
    "contract?.provider_mutation === false",
    "contract?.finance_mutation === false",
    "contract?.webhook_verification_asserted === false",
    "/admin-booking.html?booking_id=",
    "/admin-payment-recovery.html",
], "payment reconciliation client")

api = require(API, [
    "read-only Stripe/local payment reconciliation authority",
    'capability: "manage_bookings"',
    "MAX_REQUESTS = 25",
    "booking_finance_final_payment",
    "https://api.stripe.com/v1/checkout/sessions/",
    'method: "GET"',
    "payment_status === \"paid\"",
    'reconciliationState = "finance_reconciliation_required"',
    '"request_state_reconciliation_required"',
    'reconciliationState = "matched_paid"',
    'reconciliationState = "blocked_identity_mismatch"',
    'reconciliationState = "local_provider_discrepancy"',
    'reconciliationState = "complete_unpaid_review"',
    'reconciliationState = "provider_open"',
    'reconciliationState = "recovery_ready"',
    "identityMatches",
    "amountMatches",
    "currencyMatches",
    "webhook_verified: false",
    "finance_mutation: false",
    "Payment reconciliation is read-only in Build 321.",
], "payment reconciliation API")

finance_api = require(FINANCE_API, [
    'event_type: `booking_finance_${entryType}`',
    'method: "POST"',
], "booking finance API")

workflow = require(WORKFLOW, [
    "assets/admin-payment-reconciliation-v321.js",
    "functions/api/admin/payment_reconciliation_readiness.js",
    "scripts/payment_reconciliation_check.py",
    "python scripts/payment_reconciliation_check.py",
    "Payment reconciliation authority: PASS",
], "current source gate")

# The reconciliation browser must be read-only: it can navigate to existing operator workflows but never post money.
for needle in ['method:"POST"', 'method: "POST"', "booking_finance", "final_balance_checkout_create", "final_balance_request_create", "notify_customer"]:
    if needle in client:
        errors.append(f"payment reconciliation client contains mutation path: {needle}")

# Isolate GET handler and prove Stripe is GET-only and no finance/request mutation appears there.
get_match = re.search(r"export async function onRequestGet\([\s\S]*?\n}\n\nexport async function onRequestPost", api)
if not get_match:
    errors.append("could not isolate payment reconciliation GET handler")
else:
    handler = get_match.group(0)
    for needle in ['method: "POST"', 'method:"POST"', 'method: "PATCH"', 'method:"PATCH"', "final_balance_checkout_create", "final_balance_request_create"]:
        if needle in handler:
            errors.append(f"payment reconciliation GET contains mutation path: {needle}")

# No secret/provider reference values may be serialized to the client.
for needle in ["secret_value:", "secret_key:", "api_key:", "client_secret:", "external_checkout_id:", "provider_payment_intent_id:", "provider_event_id:"]:
    if needle in api.lower():
        errors.append(f"payment reconciliation API may expose a secret/provider reference value: {needle}")

# Direct provider evidence must match amount, currency and request identity before a paid mismatch is actionable.
identity_block = re.search(r"const identityMatches =[^;]*amountMatches[^;]*currencyMatches", api)
if not identity_block:
    errors.append("reconciliation API does not visibly combine request identity, amount and currency checks")
if "providerPaid && !localPaid" not in api:
    errors.append("provider-paid/local-unpaid reconciliation state is missing")
if "providerPaid && localPaid && financeCoversRequest" not in api:
    errors.append("matched provider/local/finance paid state is missing")
if '"request_state_reconciliation_required"' not in api or '"finance_reconciliation_required"' not in api:
    errors.append("provider-paid mismatch does not expose both request-state and finance reconciliation outcomes")

# Current finance POST has no provider idempotency field/unique key; Build 321 must remain read-only for finance.
for unsupported in ["provider_payment_intent_id", "provider_event_id", "idempotency_key"]:
    if unsupported in finance_api:
        errors.append(f"booking finance source now contains {unsupported}; review whether Build 321 read-only boundary should be updated")
if "finance_mutation: false" not in api:
    errors.append("Build 321 must explicitly keep finance mutation disabled")

# Live credentials must be blocked on Development-like branches.
if 'developmentLike && stripeEnvironment.mode === "live"' not in api or "No provider request was made" not in api:
    errors.append("live Stripe credentials are not explicitly blocked for Development reconciliation")

# Mobile/tablet/desktop usability is a release requirement.
if "td::before" not in page or "grid-template-columns:1fr" not in page or "min-height:44px" not in page:
    errors.append("payment reconciliation page is missing mobile/touch layout safeguards")

# Build 321 is source-only.
migrations = list(ROOT.glob("**/*321*.sql"))
if migrations:
    errors.append("Build 321 must not introduce a schema migration: " + ", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("PAYMENT RECONCILIATION: FAIL")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("PAYMENT RECONCILIATION: PASS")
print("- reconciliation browser and authority are read-only")
print("- Stripe Checkout Session lookup is GET-only")
print("- provider amount, currency and request identity are checked before paid mismatches become actionable")
print("- booking final-payment finance totals are compared without writing a finance event")
print("- matched-paid, reconciliation-required, blocked discrepancy, open and recovery states are explicit")
print("- webhook verification is not asserted and provider reference values are not exposed")
print("- live Stripe credentials are blocked for Development reconciliation")
print("- mobile/tablet/desktop reconciliation layouts are protected")
print("- no Build 321 database migration is present")
