#!/usr/bin/env python3
"""Current architecture intentionally uses the protected admin bookings route; legacy public list route is not required.

Build 165 booking photo-estimate link capture checks."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED = {
    "book.html": [
        "photo_estimate_links",
        "parsePhotoEstimateLinks",
        "renderPhotoEstimateLinkHelp",
        "photo_estimate_links: parsePhotoEstimateLinks()",
        "Photo estimate links (optional)",
    ],
    "book/index.html": [
        "photo_estimate_links",
        "parsePhotoEstimateLinks",
        "renderPhotoEstimateLinkHelp",
        "photo_estimate_links: parsePhotoEstimateLinks()",
        "Photo estimate links (optional)",
    ],
    "functions/api/checkout.js": [
        "normalizePhotoEstimateLinks",
        "photoEstimateLinks",
        "photo_estimate_links: photoEstimateLinks",
        "Photo estimate links:",
        '"photo_estimate_links"',
    ],
    "functions/api/admin/bookings.js": [
        '"photo_estimate_links"',
    ],
    "admin-booking.html": [
        "normalizePhotoEstimateLinks",
        "intake.photoLinks",
        "Photo/media links",
    ],
    "admin-booking/index.html": [
        "normalizePhotoEstimateLinks",
        "intake.photoLinks",
        "Photo/media links",
    ],
    "sql/2026-05-22_build165_booking_photo_estimate_link_capture.sql": [
        "photo_estimate_links",
        "idx_bookings_photo_estimate_links_gin",
    ],
    "DEVELOPMENT_ROADMAP.md": [
        "Build 165",
        "photo-estimate link capture",
        "Next several value-added steps after Build 165",
    ],
    "KNOWN_GAPS_AND_RISKS.md": [
        "Build 165",
        "photo-estimate links",
    ],
}

def main() -> int:
    missing: list[str] = []
    for rel, markers in REQUIRED.items():
        path = ROOT / rel
        if not path.exists():
            missing.append(f"{rel}: file missing")
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        for marker in markers:
            if marker not in text:
                missing.append(f"{rel}: missing marker {marker!r}")
    if missing:
        print("Build 165 booking photo-estimate link check failed:")
        for item in missing:
            print(f"- {item}")
        return 1
    print("Build 165 booking photo-estimate link check passed.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
