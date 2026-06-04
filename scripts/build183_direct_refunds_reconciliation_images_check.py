#!/usr/bin/env python3
"""Build 183 guard: direct provider refunds, reconciliation export, webhook warnings, and image requirements."""
from __future__ import annotations
from pathlib import Path
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]
REQUIRED_FILES = [
    "functions/api/admin/quote_deposit_refund_initiate.js",
    "functions/api/admin/payment_reconciliation_export.js",
    "functions/api/admin/payment_webhook_warnings_summary.js",
    "admin-payments.html",
    "admin-payments/index.html",
    "admin.html",
    "admin/index.html",
    "IMAGES.md",
    "data/image_requirements_build183.json",
    "sql/2026-05-30_build183_direct_refunds_reconciliation_images_no_ddl_note.sql",
]
REQUIRED_MARKERS = {
    "functions/api/admin/quote_deposit_refund_initiate.js": ["initiateStripeRefund", "initiatePayPalRefund", "recordQuoteDepositRefund", "api.stripe.com/v1/refunds", "/v2/payments/captures/"],
    "functions/api/admin/payment_reconciliation_export.js": ["quote_deposit_payment_requests", "quote_deposit_refund_records", "quote_payment_webhook_events", "text/csv"],
    "functions/api/admin/payment_webhook_warnings_summary.js": ["warning_count", "unverified", "failed", "blocked_replay_count"],
    "admin-payments.html": ["data-build183=\"direct-refunds-reconciliation-warnings\"", "Initiate provider refund", "Export reconciliation CSV", "payment_webhook_warnings_summary"],
    "admin-payments/index.html": ["data-build183=\"direct-refunds-reconciliation-warnings\"", "Initiate provider refund", "Export reconciliation CSV", "payment_webhook_warnings_summary"],
    "admin.html": ["data-build183=\"webhook-warning-dashboard\"", "Payment webhook warnings", "payment_webhook_warnings_summary"],
    "admin/index.html": ["data-build183=\"webhook-warning-dashboard\"", "Payment webhook warnings", "payment_webhook_warnings_summary"],
    "IMAGES.md": ["Rosie Dazzlers Image and Video Requirements — Build 183", "Critical missing local add-on fallback photos", "Upload methods", "Gallery proof still needed"],
    "SUPABASE_SCHEMA.sql": ["Build 183 note", "no DDL required"],
    "DATABASE_STRUCTURE_CURRENT.md": ["Build 183 schema note", "no new tables or columns"],
    "COMPETETIVE_COMPLETION_MATRIX.md": ["Build 183 matrix update", "Direct Stripe/PayPal refund initiation", "Payment reconciliation export"],
    "KNOWN_GAPS_AND_RISKS.md": ["Build 183 updated gaps", "R2 image health"],
    "DEVELOPMENT_ROADMAP.md": ["Build 183 completed", "direct provider refund initiation"],
}
NODE_CHECK_FILES = [
    "functions/api/admin/quote_deposit_refund_initiate.js",
    "functions/api/admin/payment_reconciliation_export.js",
    "functions/api/admin/payment_webhook_warnings_summary.js",
]

def fail(msg: str) -> int:
    print(f"Build 183 check failed: {msg}")
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
    data = json.loads((ROOT / "data/image_requirements_build183.json").read_text(encoding="utf-8"))
    if data.get("build") != "183":
        return fail("image requirements manifest has wrong build")
    if len(data.get("missing_local_addon_fallbacks", [])) < 12:
        return fail("image requirements manifest missing addon fallback entries")
    if len(data.get("package_images_to_verify", [])) < 15:
        return fail("image requirements manifest missing package image entries")
    for rel in NODE_CHECK_FILES:
        proc = subprocess.run(["node", "--check", rel], cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=15)
        if proc.returncode != 0:
            return fail(f"node --check failed for {rel}\n{proc.stderr or proc.stdout}")
    print("Build 183 direct refunds/reconciliation/images guard passed.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
