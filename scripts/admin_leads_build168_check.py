#!/usr/bin/env python3
"""Build 168 Admin Leads and Photo Estimate Review guard."""
from __future__ import annotations
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "admin-leads.html",
    "admin-leads/index.html",
    "functions/api/admin/public_inquiry_leads_list.js",
    "functions/api/admin/public_inquiry_leads_save.js",
    "functions/api/admin/photo_estimate_uploads_list.js",
    "functions/api/admin/photo_estimate_uploads_save.js",
    "sql/2026-05-23_build168_admin_leads_photo_review.sql",
]

REQUIRED_MARKERS = {
    "admin-leads.html": [
        "Public leads & photo estimates",
        "/api/admin/public_inquiry_leads_list",
        "/api/admin/public_inquiry_leads_save",
        "/api/admin/photo_estimate_uploads_list",
        "/api/admin/photo_estimate_uploads_save",
        "privacy_status",
    ],
    "assets/admin-auth.js": ["admin-leads", "can_manage_bookings"],
    "assets/admin-menu.js": ["Leads & Estimates", "/admin-leads.html"],
    "admin.html": ["/admin-leads.html", "Leads &amp; Photo Estimates"],
    "admin/index.html": ["/admin-leads.html", "Leads &amp; Photo Estimates"],
    "COMPETETIVE_COMPLETION_MATRIX.md": ["Build 168", "Admin Leads", "photo_estimate_uploads", "Lead/photo review"],
    "DEVELOPMENT_ROADMAP.md": ["Build 168 update", "Admin Leads", "photo estimate review"],
    "KNOWN_GAPS_AND_RISKS.md": ["Build 168 known gaps", "Admin Leads"],
    "SUPABASE_SCHEMA.sql": ["Build 168 note", "staff_note", "privacy_note", "reviewed_at"],
    "DATABASE_STRUCTURE_CURRENT.md": ["Build 168 sync", "Admin Leads and Photo Estimate Review"],
}

SQL_MARKERS = [
    "alter table if exists public.photo_estimate_uploads",
    "add column if not exists staff_note",
    "add column if not exists privacy_note",
    "photo_estimate_uploads_privacy_status_idx",
]


def fail(message: str) -> int:
    print(f"FAIL: {message}")
    return 1


def read(rel: str) -> str:
    return (ROOT / rel).read_text(encoding="utf-8", errors="ignore")


def main() -> int:
    for rel in REQUIRED_FILES:
        if not (ROOT / rel).exists():
            return fail(f"Missing {rel}")

    for rel, markers in REQUIRED_MARKERS.items():
        text = read(rel)
        for marker in markers:
            if marker not in text:
                return fail(f"Missing marker {marker!r} in {rel}")

    sql = read("sql/2026-05-23_build168_admin_leads_photo_review.sql").lower()
    for marker in SQL_MARKERS:
        if marker.lower() not in sql:
            return fail(f"Missing SQL marker {marker}")

    print("Build 168 Admin Leads check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
