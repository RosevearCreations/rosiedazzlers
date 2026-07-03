#!/usr/bin/env python3
"""Build 217 guard: token-gated, revocable final-balance payment flow."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []


def require(rel: str) -> Path:
    path = ROOT / rel
    if not path.exists():
        errors.append(f"Missing required file: {rel}")
    return path


def text(rel: str) -> str:
    path = require(rel)
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8")


def contains(rel: str, *needles: str) -> None:
    value = text(rel)
    for needle in needles:
        if needle not in value:
            errors.append(f"{rel} missing expected text: {needle}")


def main() -> int:
    required = [
        "functions/api/_lib/final-balance-links.js",
        "functions/api/final_balance_payment_view.js",
        "functions/api/admin/final_balance_request_create.js",
        "functions/api/admin/final_balance_request_manage.js",
        "functions/api/admin/final_balance_checkout_create.js",
        "functions/api/admin/final_balance_requests_list.js",
        "functions/api/stripe/webhook.js",
        "final-balance-payment.html",
        "final-balance-payment/index.html",
        "sql/2026-06-30_build217_secure_final_balance_links.sql",
        "data/build217_secure_final_balance_links.json",
    ]
    for rel in required:
        require(rel)

    contains(
        "functions/api/_lib/final-balance-links.js",
        "crypto.getRandomValues",
        "SHA-256",
        "DEFAULT_LINK_DAYS = 14",
        "MAX_LINK_DAYS = 90",
        'parsed.protocol === "https:"',
        "paymentPageUrl",
        "statusKind",
    )
    contains(
        "functions/api/final_balance_payment_view.js",
        "token_hash",
        "equalHash",
        '"Cache-Control":"no-store"',
        '"X-Robots-Tag":"noindex, nofollow"',
    )
    public_view = text("functions/api/final_balance_payment_view.js")
    if '"notes"' in public_view:
        errors.append("Public final-balance status endpoint must not select or return staff-entered notes.")

    contains(
        "functions/api/admin/final_balance_request_create.js",
        "token_hash:await hashOpaqueToken(publicToken)",
        "expires_at:expiry.value",
        "staffSafePaymentRequest",
    )
    contains(
        "functions/api/admin/final_balance_request_manage.js",
        "rotate_link",
        "set_expiry",
        "cancel",
        "reopen",
        "notify_customer",
        "staffSafePaymentRequest",
    )
    contains(
        "functions/api/admin/final_balance_checkout_create.js",
        "metadata[final_balance_payment_request_id]",
        "success_url",
        "cancel_url",
        "staffSafePaymentRequest",
    )
    contains(
        "functions/api/admin/final_balance_requests_list.js",
        "const SELECT",
        "payment_url",
        "checkout_url",
    )
    staff_list = text("functions/api/admin/final_balance_requests_list.js")
    if 'select=*' in staff_list or '"token_hash"' in staff_list:
        errors.append("Admin final-balance list must use a whitelist and must not return token_hash.")

    contains(
        "functions/api/stripe/webhook.js",
        "final_balance_payment_request_id",
        "settleFinalBalanceFromStripe",
        "payment_request_has_no_booking_link",
        "stripe_final_balance_settled",
    )
    contains(
        "sql/2026-06-30_build217_secure_final_balance_links.sql",
        "expires_at",
        "access_token_rotated_at",
        "cancelled_at",
        "provider_payment_intent_id",
        "Never expose this value to browsers",
    )

    payment_html = text("final-balance-payment.html")
    if len(re.findall(r"<h1(?:\s|>)", payment_html, flags=re.I)) != 1:
        errors.append("final-balance-payment.html must contain exactly one H1.")
    for needle in ['noindex,nofollow,noarchive', 'data-visual-placeholder="secure_payment"', '/api/final_balance_payment_view']:
        if needle not in payment_html:
            errors.append(f"final-balance-payment.html missing expected text: {needle}")
    route_copy = text("final-balance-payment/index.html")
    if payment_html != route_copy:
        errors.append("final-balance-payment route copy is out of sync.")

    contains(
        "progress.html",
        "Final balance received",
        "expired",
        "cancelled",
    )
    contains(
        "admin-payments.html",
        "Final-balance requests",
        "data-final-action=\"rotate\"",
        "Queue customer notification",
    )
    contains("service-worker.js", "/final-balance-payment.html", "/data/build217_secure_final_balance_links.json")
    if not re.search(r"const CACHE='rosie-app-v20\d{6}build\d+'", text("service-worker.js")):
        errors.append("service-worker.js must retain a dated build cache key after the Build 217 payment page was added.")
    contains("assets/visual-placeholders.js", "secure_payment")
    for rel in [
        "AI_PROJECT_HANDOFF.md",
        "MASTER_VALUE_ROADMAP.md",
        "DOC_INDEX.md",
        "KNOWN_GAPS_AND_RISKS.md",
        "DATABASE_STRUCTURE_CURRENT.md",
        "DEVELOPMENT_ROADMAP.md",
        "README.md",
        "SUPABASE_SCHEMA.sql",
        "docs/PRODUCTION_TEST_GUIDE.md",
    ]:
        contains(rel, "Build 217")

    try:
        record = json.loads(text("data/build217_secure_final_balance_links.json"))
        if record.get("build") != 217:
            errors.append("Build 217 data record has the wrong build number.")
        if not record.get("migration"):
            errors.append("Build 217 data record is missing the SQL migration reference.")
        if not record.get("manual_release_checks"):
            errors.append("Build 217 data record is missing manual release checks.")
    except Exception as exc:
        errors.append(f"Could not parse Build 217 data record: {exc}")

    if errors:
        print("Build 217 secure final-balance link checks failed:")
        for error in errors:
            print(f"- {error}")
        return 1
    print("Build 217 secure final-balance link checks passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
