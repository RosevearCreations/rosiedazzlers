#!/usr/bin/env python3
"""Fail-closed source authority for Build 320 payment recovery and customer handoff."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
ADMIN_PAGE = ROOT / "admin-payment-recovery.html"
ADMIN_CLIENT = ROOT / "assets" / "admin-payment-recovery-v320.js"
READINESS_API = ROOT / "functions" / "api" / "admin" / "payment_recovery_readiness.js"
CHECKOUT_API = ROOT / "functions" / "api" / "admin" / "final_balance_checkout_create.js"
CUSTOMER_PAGE = ROOT / "final-balance-payment.html"
CUSTOMER_CLIENT = ROOT / "assets" / "final-balance-payment-v320.js"
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


admin_page = require(ADMIN_PAGE, [
    "Payment Recovery",
    "Duplicate-charge protection",
    "already-open Stripe Checkout Session is reused",
    "provider confirms the prior session is expired",
    "No automatic charge, checkout creation, customer notification or recurring billing.",
    "@media(max-width:820px)",
    "@media(max-width:600px)",
    "@media(max-width:480px)",
    "min-height:44px",
    "/assets/admin-payment-recovery-v320.js",
], "payment recovery page")

admin_client = require(ADMIN_CLIENT, [
    "/api/admin/payment_recovery_readiness?limit=200",
    "/api/admin/final_balance_checkout_create",
    'notify_customer: false',
    "recovery_confirmed = true",
    "window.confirm",
    "checkout_reused",
    "checkout_replaced",
], "payment recovery client")

readiness_api = require(READINESS_API, [
    "read-only recovery readiness",
    'capability: "manage_bookings"',
    "final_balance_payment_requests",
    "duplicate_checkout_creation: false",
    "provider_contact: false",
    "operator_action_required: true",
    'recoveryState = "reuse_guarded"',
    'recoveryState = "recovery_required"',
], "payment recovery readiness API")

checkout_api = require(CHECKOUT_API, [
    "duplicate-safe hosted final-balance checkout recovery",
    "recovery_confirmed",
    "recovery_reason",
    "Payment recovery requires an explicit new future expiry.",
    "loadStripeCheckoutSession",
    "method:'GET'",
    "existing.payment_status === 'paid'",
    "existing.status === 'open'",
    "stripe_checkout_reused_open",
    "existing.status === 'expired'",
    "stripe_checkout_replaced_expired",
    "existing.status === 'complete'",
    "unknown checkout state",
    "duplicate_charge_guard:true",
    "Live Stripe credentials are blocked for Development payment recovery.",
], "final balance checkout recovery API")

customer_page = require(CUSTOMER_PAGE, [
    "Duplicate-payment protection",
    "temporarily hides the pay-again action",
    "same existing secure checkout is reused",
    "@media(max-width:600px)",
    "/assets/final-balance-payment-v320.js",
], "customer payment page")

customer_client = require(CUSTOMER_CLIENT, [
    'returnState === "returned"',
    'returnState === "cancelled"',
    "Payment confirmation pending",
    "Please do not submit another payment yet.",
    "Return to secure checkout",
    "verifyReturnedPayment",
    "await sleep(2000)",
    "/api/final_balance_payment_view",
], "customer payment client")

workflow = require(WORKFLOW, [
    "assets/admin-payment-recovery-v320.js",
    "functions/api/admin/payment_recovery_readiness.js",
    "functions/api/admin/final_balance_checkout_create.js",
    "assets/final-balance-payment-v320.js",
    "scripts/payment_recovery_customer_handoff_check.py",
    "python scripts/payment_recovery_customer_handoff_check.py",
    "Payment recovery/customer handoff authority: PASS",
], "current source gate")

# Readiness must be observational only.
if 'method: "POST"' in readiness_api or "api.stripe.com" in readiness_api:
    errors.append("payment recovery readiness must not mutate or contact Stripe")

# A replacement session may only be created after the existing provider session is classified expired.
expired_branch = re.search(r"existing\.status === 'expired'[\s\S]{0,900}?createStripeCheckoutSession", checkout_api)
if not expired_branch:
    errors.append("replacement Stripe checkout is not visibly constrained to the provider-confirmed expired branch")
open_branch = re.search(r"existing\.status === 'open'[\s\S]{0,700}?checkoutReused = true", checkout_api)
if not open_branch:
    errors.append("open Stripe checkout is not visibly reused")

# Paid/complete/unknown states must block before replacement.
for marker in ["existing.payment_status === 'paid'", "existing.status === 'complete'", "unknown checkout state"]:
    if marker not in checkout_api:
        errors.append(f"duplicate-charge guard missing blocking state: {marker}")

# Recovery UI must never notify customers implicitly.
if 'notify_customer: true' in admin_client:
    errors.append("payment recovery client must never automatically notify the customer")

# Successful return must not render a checkout button before recorded payment confirmation resolves.
pending_match = re.search(r"function renderPending\([\s\S]*?\n}\n", customer_client)
if not pending_match:
    errors.append("could not isolate customer pending-payment renderer")
else:
    pending = pending_match.group(0)
    if "checkout_url" in pending or "Continue to secure checkout" in pending or "Return to secure checkout" in pending:
        errors.append("pending payment renderer exposes a pay-again checkout action")

# Cancelled return may resume only the already-returned checkout_url; it must not call an admin mutation.
for needle in ["final_balance_checkout_create", "payment_recovery_readiness", 'method: "POST"']:
    if needle in customer_client:
        errors.append(f"public customer payment client contains admin/mutation path: {needle}")

# Mobile usability is part of the acceptance floor.
if "min-height:44px" not in admin_page or "grid-template-columns:1fr" not in customer_page:
    errors.append("Build 320 is missing required touch/mobile layout safeguards")

# Source-only build.
migrations = list(ROOT.glob("**/*320*.sql"))
if migrations:
    errors.append("Build 320 must not introduce a schema migration: " + ", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("PAYMENT RECOVERY / CUSTOMER HANDOFF: FAIL")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("PAYMENT RECOVERY / CUSTOMER HANDOFF: PASS")
print("- payment recovery readiness is read-only")
print("- open Stripe checkout sessions are reused, not duplicated")
print("- replacement checkout requires provider-confirmed expiry")
print("- paid, complete and unknown Stripe states fail closed")
print("- expired/cancelled request recovery requires explicit operator confirmation")
print("- customer notification remains opt-in and disabled by the recovery cockpit")
print("- checkout-return pending state suppresses pay-again actions")
print("- cancelled customer returns reuse the existing secure checkout")
print("- mobile/tablet/desktop recovery and customer handoff layouts are protected")
print("- no Build 320 database migration is present")
