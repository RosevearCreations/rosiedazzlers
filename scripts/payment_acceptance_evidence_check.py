#!/usr/bin/env python3
"""Fail-closed source authority for Build 319 payment acceptance evidence."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "admin-payment-acceptance.html"
CLIENT = ROOT / "assets" / "admin-payment-acceptance-v319.js"
API = ROOT / "functions" / "api" / "admin" / "payment_acceptance_evidence.js"
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
    "Payment Acceptance Evidence",
    "Fail-closed mobile / computer application contract",
    "No provider mutation, automatic charge or automatic checkout creation.",
    "not labelled webhook verified",
    "Payment evidence ledger",
    "Operating Help",
    "@media(max-width:820px)",
    "@media(max-width:600px)",
    "@media(max-width:480px)",
    "touch-friendly evidence card",
    "/assets/admin-payment-acceptance-v319.js",
], "payment acceptance page")

client = require(CLIENT, [
    "/api/admin/payment_acceptance_evidence?limit=200",
    'method: "GET"',
    "contract?.read_only === true",
    "contract?.secret_values_exposed === false",
    "contract?.provider_mutation === false",
    "contract?.automatic_charge === false",
    "contract?.automatic_checkout_creation === false",
    "contract?.automatic_customer_notification === false",
    "contract?.recurring_billing === false",
    "contract?.operator_action_required === true",
    "contract?.webhook_verification_asserted === false",
], "payment acceptance client")

api = require(API, [
    "read-only payment acceptance evidence authority",
    'capability: "manage_bookings"',
    "STRIPE_SECRET_KEY",
    'startsWith("sk_test_")',
    'startsWith("sk_live_")',
    'method: "GET"',
    "final_balance_payment_requests",
    'webhook_verification_asserted: false',
    'webhook_verification: "not_asserted_by_build319"',
    'acceptance_evidence: "not_integrated"',
    'acceptance_evidence: "operational_fallback_not_provider_acceptance"',
    '"blocked_live_credential"',
    '"blocked_unknown_credential"',
    '"configuration_ready_evidence_pending"',
    '"checkout_evidence_present"',
    '"persisted_paid_evidence_present"',
    "Payment acceptance evidence is read-only.",
], "payment acceptance API")

require(WORKFLOW, [
    "assets/admin-payment-acceptance-v319.js",
    "functions/api/admin/payment_acceptance_evidence.js",
    "scripts/payment_acceptance_evidence_check.py",
    "python scripts/payment_acceptance_evidence_check.py",
    "Payment acceptance evidence authority: PASS",
], "current source gate")

get_match = re.search(r"export async function onRequestGet\([\s\S]*?\n}\n\nexport async function onRequestPost", api)
if not get_match:
    errors.append("could not isolate payment acceptance GET handler")
else:
    handler = get_match.group(0)
    for needle in ["api.stripe.com", "paypal.com", 'method: "POST"', "final_balance_checkout_create", "final_balance_request_create", "notify_customer"]:
        if needle in handler:
            errors.append(f"payment acceptance GET contains provider/mutation path: {needle}")

for needle in ['method: "POST"', "final_balance_checkout_create", "final_balance_request_create", "notify_customer", "checkout_url"]:
    if needle in client:
        errors.append(f"payment acceptance client contains mutation/sensitive checkout path: {needle}")

for needle in ["secret_key:", "secret_value:", "client_secret:", "api_key:", "checkout_url:"]:
    if needle in api.lower():
        errors.append(f"payment acceptance API may expose a secret/provider URL field: {needle}")

if re.search(r"webhook_verified\s*:\s*true", api, re.IGNORECASE):
    errors.append("Build 319 must not claim webhook verification from persisted payment fields")
if "provider_event_id" not in api or "provider_payment_intent_id" not in api:
    errors.append("Build 319 must recognize existing provider reference fields without exposing their values")
if "PAYPAL_" in api:
    errors.append("Build 319 must not invent PayPal environment variables before a real integration exists")
if "table-wrap" not in page or "td::before" not in page or "min-height:44px" not in page:
    errors.append("payment acceptance page is missing mobile/tablet interaction safeguards")

migrations = list(ROOT.glob("**/*319*.sql"))
if migrations:
    errors.append("Build 319 must not introduce a schema migration: " + ", ".join(str(p.relative_to(ROOT)) for p in migrations))

if errors:
    print("PAYMENT ACCEPTANCE EVIDENCE: FAIL")
    for error in errors:
        print(f"- {error}")
    sys.exit(1)

print("PAYMENT ACCEPTANCE EVIDENCE: PASS")
print("- evidence API and browser cockpit are read-only")
print("- Stripe test/live credential mode is classified server-side without exposing the secret")
print("- checkout evidence is separate from persisted paid evidence; webhook verification is not asserted")
print("- PayPal remains not integrated and manual remains a fallback only")
print("- mobile, tablet and desktop evidence layouts are enforced")
print("- no automatic charge, checkout, notification or recurring billing")
print("- no Build 319 database migration is present")
