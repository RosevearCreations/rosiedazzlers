#!/usr/bin/env python3
"""Build 182 guard: webhook event history, replay controls, receipt emails, and refund tracking."""
from __future__ import annotations
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "functions/api/_lib/quote-payment-events.js",
    "functions/api/admin/payment_webhook_events_list.js",
    "functions/api/admin/payment_webhook_event_replay.js",
    "functions/api/admin/quote_deposit_refunds_list.js",
    "functions/api/admin/quote_deposit_refund_save.js",
    "admin-payments.html",
    "admin-payments/index.html",
    "sql/2026-05-26_build182_webhook_history_receipts_refunds.sql",
]

REQUIRED_MARKERS = {
    "functions/api/_lib/quote-payment-events.js": ["recordPaymentWebhookEvent", "queueQuoteDepositReceiptEmail", "recordQuoteDepositRefund", "quote_deposit_refund_records"],
    "functions/api/stripe/webhook.js": ["recordPaymentWebhookEvent", "queueQuoteDepositReceiptEmail", "recordQuoteDepositRefund", "REFUND_EVENTS"],
    "functions/api/paypal/webhook.js": ["recordPaymentWebhookEvent", "queueQuoteDepositReceiptEmail", "recordQuoteDepositRefund", "REFUND_EVENT_TYPES"],
    "functions/api/admin/payment_webhook_event_replay.js": ["replay", "markQuoteDepositPaidFromProvider", "recordQuoteDepositRefund"],
    "functions/api/admin/quote_deposit_refund_save.js": ["recordQuoteDepositRefund", "refund_amount_cents"],
    "functions/api/admin/quote_deposit_requests_list.js": ["receipt_email_status", "refunded_amount_cents", "latest_refund_at"],
    "admin-payments.html": ["data-build182=\"webhook-history-replay-receipts-refunds\"", "Replay verified event", "Record refund"],
    "admin-payments/index.html": ["data-build182=\"webhook-history-replay-receipts-refunds\"", "Replay verified event", "Record refund"],
    "assets/admin-auth.js": ["admin-payments"],
    "assets/admin-menu.js": ["admin-payments", "Webhook history"],
    "SUPABASE_SCHEMA.sql": ["Build 182 note", "quote_payment_webhook_events", "quote_deposit_refund_records"],
    "DATABASE_STRUCTURE_CURRENT.md": ["Build 182", "Webhook history", "refund"],
    "COMPETETIVE_COMPLETION_MATRIX.md": ["Build 182 matrix update", "Retry/replay controls", "Customer receipt emails"],
    "DEVELOPMENT_ROADMAP.md": ["Build 182 completed", "payment-system reliability"],
    "KNOWN_GAPS_AND_RISKS.md": ["Build 182 updated gaps", "Direct refund initiation"],
}

NODE_CHECK_FILES = [
    "functions/api/_lib/quote-payment-events.js",
    "functions/api/stripe/webhook.js",
    "functions/api/paypal/webhook.js",
    "functions/api/admin/payment_webhook_events_list.js",
    "functions/api/admin/payment_webhook_event_replay.js",
    "functions/api/admin/quote_deposit_refunds_list.js",
    "functions/api/admin/quote_deposit_refund_save.js",
]

def fail(msg: str) -> int:
    print(f"Build 182 check failed: {msg}")
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
    sql = (ROOT / "sql/2026-05-26_build182_webhook_history_receipts_refunds.sql").read_text(encoding="utf-8")
    for marker in ["create table if not exists public.quote_payment_webhook_events", "create table if not exists public.quote_deposit_refund_records", "partial_refund", "receipt_email_status"]:
        if marker not in sql:
            return fail(f"Build 182 SQL missing {marker}")
    for rel in NODE_CHECK_FILES:
        proc = subprocess.run(["node", "--check", rel], cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=15)
        if proc.returncode != 0:
            return fail(f"node --check failed for {rel}\n{proc.stderr or proc.stdout}")
    print("Build 182 webhook history/receipts/refunds guard passed.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
