#!/usr/bin/env python3
"""Build 171 Admin Leads quote-starter guard."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = {
    "functions/api/admin/lead_quote_preview.js": [
        "lead_quote_preview",
        "buildQuotePreview",
        "privacy_warnings",
        "public_inquiry_leads",
        "photo_estimate_uploads",
        "SUPABASE_SERVICE_KEY",
    ],
    "admin-leads.html": [
        "Build quote starter",
        "/api/admin/lead_quote_preview",
        "data-quote-output",
        "Copy quote text",
    ],
    "admin-leads/index.html": [
        "Build quote starter",
        "/api/admin/lead_quote_preview",
        "data-quote-output",
    ],
    "sql/2026-05-24_build171_admin_lead_quote_preview_no_ddl_note.sql": [
        "Build 171",
        "/api/admin/lead_quote_preview",
        "No DDL is required",
    ],
    "SUPABASE_SCHEMA.sql": [
        "Build 171 note",
        "/api/admin/lead_quote_preview",
    ],
    "DEVELOPMENT_ROADMAP.md": [
        "Build 171 update",
        "Admin lead quote starter",
        "lead_quote_preview",
    ],
    "KNOWN_GAPS_AND_RISKS.md": [
        "Build 171 known gaps",
        "quote-starter",
    ],
    "COMPETETIVE_COMPLETION_MATRIX.md": [
        "COMPETETIVE.md Completion Matrix — Build 171",
        "Lead-to-quote workflow",
        "Quote-builder foundation",
    ],
    "DATABASE_STRUCTURE_CURRENT.md": [
        "Build 171 database/schema sync",
        "No DDL",
    ],
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
    for rel in [
        "functions/api/admin/public_inquiry_leads_list.js",
        "functions/api/admin/public_inquiry_leads_save.js",
        "functions/api/admin/photo_estimate_uploads_list.js",
        "functions/api/admin/photo_estimate_uploads_save.js",
    ]:
        text = (ROOT / rel).read_text(encoding="utf-8", errors="replace")
        if "getSupabaseServiceRoleKey" not in text or "SUPABASE_SERVICE_KEY" not in text:
            problems.append(f"{rel} must support Supabase service-key aliases.")
    if problems:
        print("Build 171 lead quote preview check failed:")
        for problem in problems:
            print(f"- {problem}")
        return 1
    print("Build 171 lead quote preview check passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
