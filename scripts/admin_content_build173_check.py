#!/usr/bin/env python3
"""Build 173 Admin Content Center and Help Articles guard."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED = {
    "admin-content.html": [
        "Content Center",
        "FAQ editor",
        "/api/admin/content_faqs_list",
        "/api/admin/content_faqs_save",
        "data-build173"
    ],
    "admin-content/index.html": [
        "Content Center",
        "FAQ editor",
        "/api/admin/content_faqs_list",
        "/api/admin/content_faqs_save"
    ],
    "functions/api/admin/content_faqs_list.js": [
        "public_faq_entries",
        "manage_promos",
        "static_fallback",
        "SUPABASE_SERVICE_KEY"
    ],
    "functions/api/admin/content_faqs_save.js": [
        "public_faq_entries",
        "manage_promos",
        "normalizePayload",
        "updated_at"
    ],
    "assets/admin-auth.js": [
        "admin-content",
        "can_manage_promos"
    ],
    "assets/admin-menu.js": [
        "Content Center",
        "/admin-content.html",
        "FAQ and public help content"
    ],
    "assets/chrome.js": [
        '["/blog", "Help"]',
        "/blog",
        "Help Articles"
    ],
    "admin.html": [
        "/admin-content.html",
        "Content Center"
    ],
    "blog.html": [
        "Auto detailing help articles",
        "data-build173",
        "How this page is accessed",
        "ItemList"
    ],
    "blog/index.html": [
        "Auto detailing help articles",
        "How this page is accessed",
        "ItemList"
    ],
    "faq.html": [
        "Help Articles",
        "/blog",
        "data-build173"
    ],
    "sql/2026-05-24_build173_admin_content_faq_editor_no_ddl_note.sql": [
        "Build 173",
        "public.public_faq_entries",
        "no-DDL"
    ],
    "SUPABASE_SCHEMA.sql": [
        "Build 173 note",
        "Admin Content Center"
    ],
    "DATABASE_STRUCTURE_CURRENT.md": [
        "Build 173 database/schema sync",
        "public.public_faq_entries"
    ],
    "DEVELOPMENT_ROADMAP.md": [
        "Build 173 update",
        "Admin Content Center"
    ],
    "KNOWN_GAPS_AND_RISKS.md": [
        "Build 173 known gaps",
        "Admin Content Center"
    ],
    "COMPETETIVE_COMPLETION_MATRIX.md": [
        "COMPETETIVE.md Completion Matrix — Build 173",
        "FAQ editor"
    ],
    "SANITY_CHECK.md": [
        "Build 173 sanity check",
        "admin_content_build173_check"
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
        print("Build 173 Admin Content/Help guard failed:")
        for problem in problems:
            print(f"- {problem}")
        return 1

    print("Build 173 Admin Content/Help guard passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
