#!/usr/bin/env python3
"""Build 174 quote/proposal draft guard."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED = {
    "admin-leads.html": [
        "Save quote draft",
        "Load drafts",
        "/api/admin/quote_proposal_drafts_save",
        "/api/admin/quote_proposal_drafts_list",
        "Saved quote/proposal drafts"
    ],
    "admin-leads/index.html": [
        "Save quote draft",
        "Load drafts",
        "/api/admin/quote_proposal_drafts_save",
        "/api/admin/quote_proposal_drafts_list"
    ],
    "functions/api/admin/quote_proposal_drafts_save.js": [
        "quote_proposal_drafts",
        "manage_bookings",
        "normalizePayload",
        "SUPABASE_SERVICE_KEY",
        "build174_quote_proposal_drafts.sql"
    ],
    "functions/api/admin/quote_proposal_drafts_list.js": [
        "quote_proposal_drafts",
        "manage_bookings",
        "table_ready",
        "migration_hint"
    ],
    "sql/2026-05-24_build174_quote_proposal_drafts.sql": [
        "create table if not exists public.quote_proposal_drafts",
        "lead_id uuid",
        "booking_id uuid",
        "follow_up_at timestamptz",
        "enable row level security"
    ],
    "SUPABASE_SCHEMA.sql": [
        "Build 174 note",
        "quote_proposal_drafts"
    ],
    "DATABASE_STRUCTURE_CURRENT.md": [
        "Build 174 — quote/proposal drafts",
        "quote_proposal_drafts"
    ],
    "DEVELOPMENT_ROADMAP.md": [
        "Build 174 update",
        "quote/proposal drafts"
    ],
    "KNOWN_GAPS_AND_RISKS.md": [
        "Build 174 update",
        "quote/proposal drafts"
    ],
    "COMPETETIVE_COMPLETION_MATRIX.md": [
        "COMPETETIVE.md Completion Matrix — Build 174",
        "Persistent quote/proposal drafts"
    ],
    "SANITY_CHECK.md": [
        "Build 174 update",
        "quote/proposal drafts"
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

    if problems:
        print("Build 174 quote/proposal draft guard failed:")
        for problem in problems:
            print(f"- {problem}")
        return 1

    print("Build 174 quote/proposal draft guard passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
