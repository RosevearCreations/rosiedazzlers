#!/usr/bin/env python3
"""Build 407 fail-closed authority for payment-provider live-outcome/reconciliation acceptance."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
errors = []

def read(path):
    p = ROOT / path
    if not p.exists():
        errors.append(f"missing {path}")
        return ""
    return p.read_text(encoding="utf-8", errors="ignore")

def require(text, needles, label, casefold=False):
    hay = text.casefold() if casefold else text
    for needle in needles:
        target = needle.casefold() if casefold else needle
        if target not in hay:
            errors.append(f"{label} missing {needle!r}")

contract = read("BUILD407_PAYMENT_PROVIDER_LIVE_OUTCOME_RECONCILIATION_ACCEPTANCE.md")
endpoint = read("functions/api/admin/go_live_readiness.js")
stripe_webhook = read("functions/api/stripe/webhook.js")
paypal_webhook = read("functions/api/paypal/webhook.js")
payment_helpers = read("functions/api/_lib/quote-payment-events.js")
ui = read("admin/it.html")
roadmap = read("FORWARD_BUILD_ROADMAP_405_415.md")
queue = read("AUTONOMOUS_RELEASE_QUEUE.md")
handoff = read("AI_PROJECT_HANDOFF.md")
readme = read("README.md")

require(contract, [
    "Build 407", "persisted verified webhook", "settled", "replayed", "refund_recorded",
    "stable provider event identity", "exact paid amount", "provider contact is not performed",
    "payment_provider_readiness", "hold", "protected `main`",
    "zero failed, zero queued and zero in-progress", "no schema migration",
    "Build 408 — Media / R2 Operational Acceptance & Recovery Evidence"
], "Build 407 contract", casefold=True)

require(endpoint, [
    "build: 407", 'authority: "payment_provider_live_outcome_reconciliation_acceptance"',
    "persisted_verified_webhook_required_for_provider_green: true",
    "reconciled_internal_payment_required_for_provider_green: true",
    "provider_contact_performed_by_this_check: false",
    'payment_provider_readiness: paymentProviderReady ? "green" : "hold"',
    "quote_deposit_payment_requests", "quote_payment_webhook_events",
    "provider_event_id", "quote_deposit_payment_request_id",
    'new Set(["settled", "replayed", "refund_recorded"])',
    "amountMatches", "paidLike", "runtime_proven",
    "R2_MEDIA.list({ limit: 1 })", "staff_users?select=id&limit=1",
    "provider_success_observed_by_this_check: false", "Cache-Control", "no-store"
], "Build 407 readiness endpoint", casefold=True)

for forbidden in [
    "onRequestPost", "onRequestPut", "onRequestPatch", "onRequestDelete",
    'method: "POST"', "method: 'POST'", 'method: "PATCH"', "method: 'PATCH'",
    'method: "DELETE"', "method: 'DELETE'", ".put(", ".delete("
]:
    if forbidden in endpoint:
        errors.append(f"Build 407 readiness endpoint contains mutation surface {forbidden!r}")

for pattern in [r"\binsert\s+into\b", r"\bupdate\s+\w+\s+set\b", r"\bdelete\s+from\b", r"\bdrop\s+table\b", r"\balter\s+table\b"]:
    if re.search(pattern, endpoint, re.I):
        errors.append(f"Build 407 readiness endpoint contains SQL mutation pattern {pattern!r}")

require(stripe_webhook, [
    "verifyStripeSignature", 'status: "verified"', 'status:settled.idempotent ? "replayed" : "settled"',
    "quote_deposit_payment_request_id", "provider_event_id"
], "Stripe retained verified webhook", casefold=True)
require(paypal_webhook, [
    "verifyPayPalWebhookSignature", 'status: "verified"', 'status: settled.idempotent ? "replayed" : "settled"',
    "quote_deposit_payment_request_id", "provider_event_id"
], "PayPal retained verified webhook", casefold=True)
require(payment_helpers, [
    "on_conflict=provider,provider_event_id", "quote_payment_webhook_events"
], "payment webhook persistence", casefold=True)

require(ui, [
    'data-build406="go-live-evidence-provider-readiness-convergence"',
    "/api/admin/go_live_readiness", "Refresh Readiness",
    "provider readiness", "provider outcome", "unavailable is not automatically a failure"
], "Admin I.T. readiness cockpit", casefold=True)
if "setInterval" in ui:
    errors.append("Admin I.T. readiness cockpit must not use recurring setInterval polling")
if "readinessButton.addEventListener('click', loadReadiness)" not in ui:
    errors.append("Build 407 readiness evidence must retain explicit operator-triggered refresh")

require(roadmap, [
    "### Build 407 — Payment Provider Live-Outcome & Reconciliation Acceptance",
    "### Build 408 — Media / R2 Operational Acceptance & Recovery Evidence",
    "definitive non-pending provider outcomes", "idempotent order/payment identity", "reconciliation evidence"
], "active roadmap", casefold=True)

# Living release documents may advance beyond this retained provider authority.
# Require durable release mechanics and retained-contract linkage, not historical
# current/next release labels.
require(queue, [
    "FORWARD_BUILD_ROADMAP_405_415.md", "non-force fast-forward", "rd main protection",
    "Production deployment/runtime/business acceptance"
], "release queue")
require(handoff, [
    "FORWARD_BUILD_ROADMAP_405_415.md", "protected `main`",
    "Production deployment/runtime/business acceptance",
    "BUILD407_PAYMENT_PROVIDER_LIVE_OUTCOME_RECONCILIATION_ACCEPTANCE.md"
], "project handoff")
require(readme, [
    "FORWARD_BUILD_ROADMAP_405_415.md", "rd main protection",
    "Production is not considered GREEN from source promotion alone.",
    "BUILD407_PAYMENT_PROVIDER_LIVE_OUTCOME_RECONCILIATION_ACCEPTANCE.md"
], "README")

for p in ROOT.rglob("*"):
    if not p.is_file():
        continue
    rel = p.relative_to(ROOT).as_posix().casefold()
    if "407" in rel and (rel.endswith(".sql") or "migration" in rel or "schema" in rel):
        errors.append(f"Build 407 must not introduce schema/migration artifact: {rel}")

if errors:
    print("BUILD 407 PAYMENT PROVIDER LIVE-OUTCOME & RECONCILIATION ACCEPTANCE: FAIL")
    for error in errors:
        print(" -", error)
    raise SystemExit(1)

print("BUILD 407 PAYMENT PROVIDER LIVE-OUTCOME & RECONCILIATION ACCEPTANCE: PASS")
print(" - provider configuration remains source evidence only")
print(" - provider GREEN requires persisted verified settled/replayed/refund evidence")
print(" - provider event identity must link to an internal payment request")
print(" - paid amount/currency reconciliation must pass")
print(" - readiness performs no provider contact or business mutation")
print(" - source/Production release GREEN remains distinct from live-payment readiness")
print(" - Build 407 adds no schema or Production business/provider mutation authority")
