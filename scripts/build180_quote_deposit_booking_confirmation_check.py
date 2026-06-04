#!/usr/bin/env python3
"""Build 180 guard: accepted quote deposit request and booking confirmation flow."""
from __future__ import annotations

from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "functions/api/admin/quote_deposit_request_create.js",
    "functions/api/admin/quote_deposit_requests_list.js",
    "functions/api/admin/quote_deposit_request_mark_paid.js",
    "functions/api/quote_deposit_request.js",
    "quote-payment.html",
    "quote-payment/index.html",
    "sql/2026-05-26_build180_quote_deposit_booking_confirmation.sql",
]

REQUIRED_MARKERS = {
    "admin-leads.html": ["data-build180=\"quote-deposit-booking-confirmation\"", "data-create-deposit-request", "data-mark-paid", "quote_deposit_request_create"],
    "admin-leads/index.html": ["data-build180=\"quote-deposit-booking-confirmation\"", "data-create-deposit-request", "data-mark-paid"],
    "quote-payment.html": ["data-build180=\"quote-deposit-payment-request\"", "noindex,nofollow", "/api/quote_deposit_request"],
    "SUPABASE_SCHEMA.sql": ["Build 180 note", "quote_deposit_payment_requests", "quote-payment.html"],
    "DATABASE_STRUCTURE_CURRENT.md": ["Build 180", "quote_deposit_payment_requests"],
    "COMPETETIVE_COMPLETION_MATRIX.md": ["Build 180", "deposit/payment request"],
    "DEVELOPMENT_ROADMAP.md": ["Build 180", "accepted quote"],
    "KNOWN_GAPS_AND_RISKS.md": ["Build 180", "deposit"],
}


def fail(message: str) -> int:
    print(f"Build 180 check failed: {message}")
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

    sql = (ROOT / "sql/2026-05-26_build180_quote_deposit_booking_confirmation.sql").read_text(encoding="utf-8")
    for marker in ["create table if not exists public.quote_deposit_payment_requests", "latest_deposit_payment_request_id", "deposit_request_status"]:
        if marker not in sql:
            return fail(f"Build 180 SQL missing {marker}")

    print("Build 180 quote deposit/payment request guard passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
