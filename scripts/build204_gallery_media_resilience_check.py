#!/usr/bin/env python3
"""Build 204 release guard for before/after gallery media resilience."""
from __future__ import annotations
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]

REQUIRED = {
    "functions/api/before_after_gallery_public.js": [
        "Build 204",
        "loadStaticGallery",
        "beforeImageUrl",
        "afterImageUrl",
        "fallback_before_url",
        "fallback_after_url",
        "source_status",
        "fallback_used",
    ],
    "before_after_gallery_public.js": [
        "Build 204",
        "loadStaticGallery",
        "normalizeMediaUrl",
    ],
    "gallery.html": [
        "RDGalleryImageFallback",
        "data-fallback-src",
        "compare-media-fallback",
    ],
    "gallery/index.html": [
        "RDGalleryImageFallback",
        "data-fallback-src",
        "compare-media-fallback",
    ],
    "assets/recent-work.js": [
        "RDRecentWorkImageFallback",
        "data-fallback-src",
        "media-unavailable",
    ],
    "functions/api/admin/gallery_image_health_report.js": [
        "Build 204",
        "gallery_image_health",
        "fallback_ready_count",
    ],
    "admin.html": [
        "data-build204",
        "galleryImageHealthDiagnostics",
        "loadGalleryImageHealthDiagnostics",
    ],
    "admin/index.html": [
        "data-build204",
        "galleryImageHealthDiagnostics",
        "loadGalleryImageHealthDiagnostics",
    ],
    "data/before_after_gallery.json": [
        "/assets/brand/CarPrice2025.PNG",
        "/assets/brand/CarPriceDetails2025.PNG",
    ],
    "DEVELOPMENT_ROADMAP.md": ["Build 204", "Before/after gallery image resilience"],
    "KNOWN_GAPS_AND_RISKS.md": ["Build 204", "Gallery image resilience"],
    "DATABASE_STRUCTURE_CURRENT.md": ["Build 204", "No new DDL"],
    "SUPABASE_SCHEMA.sql": ["Build 204 gallery media resilience"],
    "sql/2026-06-12_build204_gallery_media_resilience_no_ddl_note.sql": ["No DDL"],
}


def main() -> int:
    errors: list[str] = []
    for rel, needles in REQUIRED.items():
        path = ROOT / rel
        if not path.exists():
            errors.append(f"Missing {rel}")
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        for needle in needles:
            if needle not in text:
                errors.append(f"{rel} missing {needle!r}")
    if errors:
        print("Build 204 gallery media resilience check failed:")
        for error in errors:
            print(f"- {error}")
        return 1
    print("Build 204 gallery media resilience check passed.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
