#!/usr/bin/env python3
"""Build 175 combined guard: lead conversion, pricing suggestions, content blocks, gallery privacy filters, conversion analytics."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED = {
    "admin-leads.html": [
        "data-build175",
        "Pricing suggestions",
        "Lead → draft booking/quote",
        "/api/admin/pricing_suggestions_for_lead",
        "/api/admin/lead_conversion_draft_save",
        "Save status"
    ],
    "admin-leads/index.html": [
        "Pricing suggestions",
        "Lead → draft booking/quote",
        "/api/admin/pricing_suggestions_for_lead",
        "/api/admin/lead_conversion_draft_save"
    ],
    "functions/api/admin/pricing_suggestions_for_lead.js": [
        "loadPricingCatalog",
        "catalog-backed package/add-on price suggestions",
        "manage_bookings",
        "suggestions"
    ],
    "functions/api/admin/lead_conversion_draft_save.js": [
        "lead_conversion_drafts",
        "safe lead → draft booking/quote conversion",
        "manage_bookings",
        "draft_booking"
    ],
    "admin-content.html": [
        "data-build175",
        "Reusable content blocks",
        "/api/admin/content_blocks_list",
        "/api/admin/content_blocks_save",
        "/api/public_content_blocks"
    ],
    "admin-content/index.html": [
        "Reusable content blocks",
        "/api/admin/content_blocks_list",
        "/api/admin/content_blocks_save"
    ],
    "functions/api/admin/content_blocks_list.js": [
        "site_content_blocks",
        "STATIC_BLOCKS",
        "manage_promos"
    ],
    "functions/api/admin/content_blocks_save.js": [
        "site_content_blocks",
        "ALLOWED_TYPES",
        "manage_promos"
    ],
    "functions/api/public_content_blocks.js": [
        "public content block reader",
        "site_content_blocks",
        "FALLBACK_BLOCKS"
    ],
    "gallery.html": [
        "data-build175",
        "Service proof",
        "Town proof",
        "/api/before_after_gallery_public"
    ],
    "gallery/index.html": [
        "Service proof",
        "Town proof",
        "privacy-approved"
    ],
    "functions/api/before_after_gallery_public.js": [
        "privacy enforcement",
        "available_services",
        "available_towns",
        "blocked_count",
        "isPublicApproved"
    ],
    "functions/api/admin/conversion_funnel_summary.js": [
        "FAQ/help/lead/quote conversion analytics",
        "lead_conversion_drafts",
        "quote_proposal_drafts",
        "public_inquiry_leads"
    ],
    "sql/2026-05-25_build175_lead_conversion_content_gallery_analytics.sql": [
        "create table if not exists public.lead_conversion_drafts",
        "create table if not exists public.site_content_blocks",
        "approved_public",
        "enable row level security"
    ],
    "SUPABASE_SCHEMA.sql": [
        "Build 175 note",
        "lead_conversion_drafts",
        "site_content_blocks"
    ],
    "DATABASE_STRUCTURE_CURRENT.md": [
        "Build 175 — lead conversion/content/gallery/analytics schema sync",
        "lead_conversion_drafts",
        "site_content_blocks"
    ],
    "DEVELOPMENT_ROADMAP.md": ["Build 175 update", "lead → draft booking/quote"],
    "KNOWN_GAPS_AND_RISKS.md": ["Build 175 known gaps", "media privacy"],
    "COMPETETIVE_COMPLETION_MATRIX.md": ["COMPETETIVE.md Completion Matrix — Build 175", "catalog-backed package/add-on price suggestions"],
    "SANITY_CHECK.md": ["Build 175 sanity check", "conversion_content_gallery_analytics"],
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
        print("Build 175 guard failed:")
        for problem in problems:
            print(f"- {problem}")
        return 1
    print("Build 175 conversion/content/gallery/analytics guard passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
