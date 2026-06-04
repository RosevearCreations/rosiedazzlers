#!/usr/bin/env python3
"""Build 181 guard: verified Stripe/PayPal webhook settlement for quote deposits."""
from __future__ import annotations

from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "functions/api/_lib/quote-deposit-payments.js",
    "functions/api/stripe/webhook.js",
    "functions/api/paypal/webhook.js",
    "functions/api/paypal/capture-quote-deposit.js",
    "functions/api/admin/quote_deposit_request_create.js",
    "quote-payment.html",
    "quote-payment/index.html",
    "sql/2026-05-26_build181_payment_webhooks_quote_deposits.sql",
]

REQUIRED_MARKERS = {
    "functions/api/stripe/webhook.js": ["quote_deposit_payment_request_id", "markQuoteDepositPaidFromProvider", "verifyStripeSignature"],
    "functions/api/paypal/webhook.js": ["verify-webhook-signature", "PAYPAL_WEBHOOK_ID", "PAYMENT.CAPTURE.COMPLETED", "markQuoteDepositPaidFromProvider"],
    "functions/api/paypal/capture-quote-deposit.js": ["capture-quote-deposit", "markQuoteDepositPaidFromProvider", "token_hash"],
    "functions/api/_lib/quote-deposit-payments.js": ["webhook_verified_at", "provider_capture_id", "booking_finance_deposit"],
    "functions/api/admin/quote_deposit_request_create.js": ["metadata[purpose]", "createPayPalOrder", "paypal_order_created", "provider === \"paypal\""],
    "quote-payment.html": ["data-build181=\"verified-provider-webhooks\"", "/api/paypal/capture-quote-deposit", "paypal_return"],
    "quote-payment/index.html": ["data-build181=\"verified-provider-webhooks\"", "/api/paypal/capture-quote-deposit"],
    "admin-leads.html": ["data-build181=\"payment-webhook-verification\"", "Payment provider? Type stripe, paypal, or manual"],
    "admin-leads/index.html": ["data-build181=\"payment-webhook-verification\"", "Payment provider? Type stripe, paypal, or manual"],
    "SUPABASE_SCHEMA.sql": ["Build 181 note", "provider_capture_id", "PAYMENT.CAPTURE.COMPLETED"],
    "DATABASE_STRUCTURE_CURRENT.md": ["Build 181", "quote_deposit_payment_requests", "webhook"],
    "COMPETETIVE_COMPLETION_MATRIX.md": ["Build 181", "Stripe/PayPal", "quote_deposit_payment_requests"],
    "DEVELOPMENT_ROADMAP.md": ["Build 181", "webhook"],
    "KNOWN_GAPS_AND_RISKS.md": ["Build 181", "PayPal"],
}

NODE_CHECK_FILES = [
    "functions/api/_lib/quote-deposit-payments.js",
    "functions/api/stripe/webhook.js",
    "functions/api/paypal/webhook.js",
    "functions/api/paypal/capture-quote-deposit.js",
    "functions/api/admin/quote_deposit_request_create.js",
]


def fail(message: str) -> int:
    print(f"Build 181 check failed: {message}")
    return 1


def main() -> int:
    for rel in REQUIRED_FILES:
        if not (ROOT / rel).exists():
            return fail(f"missing {rel}")

    for rel, markers in REQUIRED_MARKERS.items():
        path = ROOT / rel
        if not path.exists():
            return fail(f"missing marker file {rel}")
        text = path.read_text(encoding="utf-8", errors="ignore")
        for marker in markers:
            if marker not in text:
                return fail(f"{rel} missing marker {marker!r}")

    sql = (ROOT / "sql/2026-05-26_build181_payment_webhooks_quote_deposits.sql").read_text(encoding="utf-8")
    for marker in ["drop constraint if exists quote_deposit_payment_requests_provider_check", "provider in ('manual','stripe','paypal')", "provider_payload jsonb"]:
        if marker not in sql:
            return fail(f"Build 181 SQL missing {marker}")

    for rel in NODE_CHECK_FILES:
        proc = subprocess.run(["node", "--check", rel], cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=15)
        if proc.returncode != 0:
            return fail(f"node --check failed for {rel}\n{proc.stderr or proc.stdout}")

    print("Build 181 payment webhook quote-deposit guard passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
