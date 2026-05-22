#!/usr/bin/env python3
"""Build 160 competitor-roadmap guard for Rosie Dazzlers."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_FILES = [
    "COMPETETIVE.md",
    "COMPETITOR.md",
    "COMPETETOR.md",
    "COMPETITOR_SANITY_CHECK.md",
    "DEVELOPMENT_ROADMAP.md",
    "KNOWN_GAPS_AND_RISKS.md",
    "services.html",
    "services/index.html",
]

REQUIRED_PAGES = [
    "index.html",
    "services.html",
    "pricing.html",
    "book.html",
    "gallery.html",
    "gifts/index.html",
    "fleet-pricing.html",
    "maintenance-plan.html",
    "paint-correction/index.html",
    "ceramic-coating/index.html",
    "pet-hair-removal/index.html",
    "odor-removal/index.html",
    "headlight-restoration/index.html",
    "tillsonburg-auto-detailing/index.html",
    "woodstock-ingersoll-auto-detailing/index.html",
    "simcoe-delhi-auto-detailing/index.html",
    "port-dover-auto-detailing/index.html",
]

REQUIRED_ROADMAP_MARKERS = [
    "Build 160 update",
    "Competitor sanity check",
    "current state vs target",
    "Next 20 value-added steps after Build 160",
    "Primary source of truth",
]

REQUIRED_SANITY_MARKERS = [
    "Current website/app position",
    "Competitor-roadmap priority ranking",
    "Recommended next 20 steps",
]

REQUIRED_SERVICE_MARKERS = [
    "service-decision-guide",
    "Which service should we choose?",
    "Send photos for estimate",
    "Photo estimate tip",
]


def fail(message: str) -> int:
    print(f"ERROR: {message}")
    return 1


def check_file_exists(rel: str) -> bool:
    return (ROOT / rel).exists()


def main() -> int:
    missing = [rel for rel in REQUIRED_FILES + REQUIRED_PAGES if not check_file_exists(rel)]
    if missing:
        return fail("Missing competitor roadmap/page files: " + ", ".join(missing))

    roadmap = (ROOT / "DEVELOPMENT_ROADMAP.md").read_text(encoding="utf-8", errors="ignore")
    missing_markers = [marker for marker in REQUIRED_ROADMAP_MARKERS if marker not in roadmap]
    if missing_markers:
        return fail("Development roadmap is missing Build 160 markers: " + ", ".join(missing_markers))

    sanity = (ROOT / "COMPETITOR_SANITY_CHECK.md").read_text(encoding="utf-8", errors="ignore")
    missing_sanity = [marker for marker in REQUIRED_SANITY_MARKERS if marker not in sanity]
    if missing_sanity:
        return fail("Competitor sanity check is missing markers: " + ", ".join(missing_sanity))

    services_root = (ROOT / "services.html").read_text(encoding="utf-8", errors="ignore")
    services_folder = (ROOT / "services/index.html").read_text(encoding="utf-8", errors="ignore")
    for marker in REQUIRED_SERVICE_MARKERS:
        if marker not in services_root or marker not in services_folder:
            return fail(f"Services decision-guide marker missing from root or folder page: {marker}")

    print("Competitor roadmap check passed: Build 160 roadmap, sanity docs, and Services decision guide are present.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
