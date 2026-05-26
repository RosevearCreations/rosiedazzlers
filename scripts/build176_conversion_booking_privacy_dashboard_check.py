#!/usr/bin/env python3
"""Build 176 guard: reviewed conversion drafts can become bookings; analytics/app warnings are visible."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED = {
    "admin-leads.html": [
        "data-build176",
        "Load conversion drafts",
        "/api/admin/lead_conversion_drafts_list",
        "/api/admin/lead_conversion_create_booking",
        "Create real booking from reviewed draft",
    ],
    "admin-leads/index.html": [
        "data-build176",
        "Load conversion drafts",
        "/api/admin/lead_conversion_drafts_list",
        "/api/admin/lead_conversion_create_booking",
    ],
    "functions/api/admin/lead_conversion_drafts_list.js": [
        "lead_conversion_drafts",
        "converted_booking_id",
        "manage_bookings",
    ],
    "functions/api/admin/lead_conversion_create_booking.js": [
        "create a real booking from a reviewed lead conversion draft",
        "public.bookings",
        "address_line1",
        "price_total_cents",
        "lead_conversion_booking_created",
    ],
    "admin-analytics.html": [
        "data-build176",
        "Lead/quote conversion summary",
        "/api/admin/conversion_funnel_summary",
        "lead → quote draft",
        "lead → conversion draft",
    ],
    "admin-app.html": [
        "data-build176",
        "Media privacy readiness",
        "/api/admin/media_privacy_review_summary",
        "approved-public privacy status",
    ],
    "functions/api/admin/media_privacy_review_summary.js": [
        "media privacy readiness",
        "before_after_gallery",
        "photo_estimate_uploads",
        "approved_public",
    ],
    "sql/2026-05-25_build176_conversion_to_booking_dashboard_privacy.sql": [
        "converted_booking_id",
        "converted_at",
        "lead_conversion_drafts",
    ],
    "SUPABASE_SCHEMA.sql": [
        "Build 176 note",
        "converted_booking_id",
        "lead_conversion_create_booking",
    ],
    "DATABASE_STRUCTURE_CURRENT.md": [
        "Build 176 — conversion-to-booking/schema sync",
        "converted_booking_id",
    ],
    "DEVELOPMENT_ROADMAP.md": ["Build 176 update", "reviewed conversion drafts"],
    "KNOWN_GAPS_AND_RISKS.md": ["Build 176 known gaps", "real booking"],
    "COMPETETIVE_COMPLETION_MATRIX.md": ["Build 176", "reviewed conversion draft → real booking"],
    "SANITY_CHECK.md": ["Build 176 sanity check", "conversion draft"],
}


def main() -> int:
    problems: list[str] = []
    for rel, markers in REQUIRED.items():
        path = ROOT / rel
        if not path.exists():
            problems.append(f"Missing required file: {rel}")
            continue
        text = path.read_text(encoding="utf-8", errors="replace")
        for marker in markers:
            if marker not in text:
                problems.append(f"Missing marker in {rel}: {marker}")

    if problems:
        print("Build 176 guard failed:")
        for problem in problems:
            print(f"- {problem}")
        return 1
    print("Build 176 conversion/booking/privacy/dashboard guard passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
