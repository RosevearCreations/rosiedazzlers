#!/usr/bin/env python3
"""Build 172 public FAQ/content-access guard."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = {
    "faq.html": ["Mobile Auto Detailing FAQ", "FAQPage", "Where these pages are accessed", "/api/public_faqs", "data-build172"],
    "faq/index.html": ["Mobile Auto Detailing FAQ", "FAQPage", "Where these pages are accessed", "/api/public_faqs"],
    "functions/api/public_faqs.js": ["public_faq_entries", "STATIC_FAQS", "static_fallback", "SUPABASE_SERVICE_KEY"],
    "data/site_faqs.json": ["Booking and service area", "Pricing and quotes", "Photos, privacy, and proof"],
    "sql/2026-05-24_build172_public_faq_content_foundation.sql": ["public_faq_entries", "Build 172", "source_key"],
    "assets/chrome.js": ["/faq", "FAQ", "Help articles"],
    "assets/site.css": ["Build 172 FAQ content/accessibility helpers", ".faq-question"],
    "sitemap.xml": ["https://rosiedazzlers.ca/faq/"],
    "SUPABASE_SCHEMA.sql": ["Build 172 note", "public_faq_entries"],
    "DEVELOPMENT_ROADMAP.md": ["Build 172 update", "public FAQ"],
    "KNOWN_GAPS_AND_RISKS.md": ["Build 172 known gaps", "FAQ"],
    "COMPETETIVE_COMPLETION_MATRIX.md": ["COMPETETIVE.md Completion Matrix — Build 172", "FAQ/help content"],
    "DATABASE_STRUCTURE_CURRENT.md": ["Build 172 database/schema sync", "public_faq_entries"],
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
    for rel in ["index.html", "services.html", "pricing.html", "contact.html"]:
        text = (ROOT / rel).read_text(encoding="utf-8", errors="replace")
        if "/faq" not in text:
            problems.append(f"{rel} should link to /faq")
    if problems:
        print("Build 172 FAQ/content guard failed:")
        for problem in problems:
            print(f"- {problem}")
        return 1
    print("Build 172 FAQ/content guard passed.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
