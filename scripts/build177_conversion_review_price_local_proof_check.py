#!/usr/bin/env python3
"""Build 177 guard: conversion review queue, price reconciliation, and local proof reporting."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED = {
    "admin-conversions.html": ["data-build177=\"conversion-draft-review-price-reconciliation\"", "lead_conversion_price_reconcile", "lead_conversion_create_booking"],
    "admin-conversions/index.html": ["data-build177=\"conversion-draft-review-price-reconciliation\"", "lead_conversion_price_reconcile", "lead_conversion_create_booking"],
    "functions/api/admin/lead_conversion_price_reconcile.js": ["Build 177", "loadPricingCatalog", "ready_to_book", "tax_cents"],
    "functions/api/admin/local_seo_proof_report.js": ["Build 177", "TARGET_TOWNS", "privacy_rule", "next_best_gap"],
    "admin-analytics.html": ["data-build177=\"local-seo-proof-report\"", "local_seo_proof_report", "local-seo-proof-summary"],
    "admin-analytics/index.html": ["data-build177=\"local-seo-proof-report\"", "local_seo_proof_report", "local-seo-proof-summary"],
    "gallery.html": ["data-build177=\"privacy-proof-badges\"", "media_privacy_status"],
    "gallery/index.html": ["data-build177=\"privacy-proof-badges\"", "media_privacy_status"],
    "assets/admin-auth.js": ["admin-conversions"],
    "assets/admin-menu.js": ["admin-conversions", "Conversion Queue"],
    "assets/admin-shell.js": ["admin-conversions.html"],
    "admin.html": ["admin-conversions.html", "Conversion Draft Review"],
    "admin/index.html": ["admin-conversions.html", "Conversion Draft Review"],
    "admin-leads.html": ["data-build177=\"conversion-queue-link\"", "Conversion Queue"],
    "admin-leads/index.html": ["data-build177=\"conversion-queue-link\"", "Conversion Queue"],
    "sql/2026-05-25_build177_conversion_review_price_local_proof.sql": ["final_price_review", "final_price_status", "final_price_total_cents"],
    "SUPABASE_SCHEMA.sql": ["Build 177 note", "final_price_review"],
    "DATABASE_STRUCTURE_CURRENT.md": ["Build 177", "final price review"],
    "COMPETETIVE_COMPLETION_MATRIX.md": ["Build 177 update", "Final price reconciliation", "Service/town proof reporting"],
}


def fail(msg: str) -> int:
    print(f"Build 177 check failed: {msg}")
    return 1


def main() -> int:
    for rel, markers in REQUIRED.items():
        path = ROOT / rel
        if not path.exists():
            return fail(f"missing {rel}")
        text = path.read_text(encoding="utf-8", errors="ignore")
        for marker in markers:
            if marker not in text:
                return fail(f"{rel} missing marker {marker!r}")
    print("Build 177 conversion review/price/local proof guard passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
