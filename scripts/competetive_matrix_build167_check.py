#!/usr/bin/env python3
"""Build 167 COMPETETIVE completion matrix guard."""
from __future__ import annotations
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "functions/api/public_lead_submit.js",
    "functions/api/public_photo_estimate_upload_url.js",
    "sql/2026-05-23_build167_competetive_matrix_leads_upload_schema.sql",
    "COMPETETIVE_COMPLETION_MATRIX.md",
]

REQUIRED_MARKERS = {
    "book.html": ["photo_estimate_files", "uploadPhotoEstimateFiles", "/api/public_photo_estimate_upload_url"],
    "book/index.html": ["photo_estimate_files", "uploadPhotoEstimateFiles", "/api/public_photo_estimate_upload_url"],
    "fleet.html": ["data-public-lead-form", "/api/public_lead_submit", "Fleet quote request", "FAQPage", "BreadcrumbList"],
    "fleet/index.html": ["data-public-lead-form", "/api/public_lead_submit", "Fleet quote request"],
    "maintenance.html": ["data-public-lead-form", "/api/public_lead_submit", "Maintenance plan interest form", "FAQPage", "BreadcrumbList"],
    "maintenance/index.html": ["data-public-lead-form", "/api/public_lead_submit", "Maintenance plan interest form"],
    "specials.html": ["FAQPage", "BreadcrumbList"],
    "gift-cards.html": ["FAQPage", "BreadcrumbList"],
    "blog.html": ["FAQPage", "BreadcrumbList"],
    "COMPETETIVE_COMPLETION_MATRIX.md": ["Build 167", "Direct customer upload", "Structured fleet lead form", "FAQPage schema", "BreadcrumbList schema"],
    "DEVELOPMENT_ROADMAP.md": ["Build 167 update", "public_lead_submit", "public_photo_estimate_upload_url", "Next several steps after Build 167"],
    "KNOWN_GAPS_AND_RISKS.md": ["Build 167 known gaps", "Direct uploads should stay disabled", "Admin Leads"],
    "SUPABASE_SCHEMA.sql": ["Build 167 note", "public_inquiry_leads", "photo_estimate_uploads"],
}

SQL_MARKERS = ["create table if not exists public.public_inquiry_leads", "create table if not exists public.photo_estimate_uploads"]

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

    sql = read("sql/2026-05-23_build167_competetive_matrix_leads_upload_schema.sql").lower()
    for marker in SQL_MARKERS:
        if marker.lower() not in sql:
            return fail(f"Missing SQL marker {marker}")

    for rel in [
        "blog/ontario-road-salt-cleanup/index.html",
        "blog/pet-hair-removal-car-detailing/index.html",
        "blog/ceramic-coating-vs-wax/index.html",
        "blog/paint-correction-basics/index.html",
        "blog/prepare-for-mobile-detailing/index.html",
    ]:
        if "BreadcrumbList" not in read(rel):
            return fail(f"Missing BreadcrumbList in {rel}")

    print("Build 167 COMPETETIVE matrix check passed.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
